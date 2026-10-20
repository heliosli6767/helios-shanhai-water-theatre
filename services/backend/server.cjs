'use strict';
const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { loadHome, loadStory } = require('./content.cjs');
const { HOME_PATH } = require('../../packages/api-contracts/home.js');
const { STORY_PATH_PREFIX } = require('../../packages/api-contracts/story.js');
const DEFAULT_ORIGINS = ['http://127.0.0.1:4173', 'http://localhost:4173'];

function createServer({ home = loadHome(), storyLoader = loadStory, origins = DEFAULT_ORIGINS } = {}) {
  // Freeze the startup snapshot into JSON; no user account or database yet.
  const data = JSON.stringify(home);
  return http.createServer({ maxHeaderSize: 8192, requestTimeout: 10000, headersTimeout: 5000, keepAliveTimeout: 5000 }, (req, res) => {
    const requestId = randomUUID();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('Vary', 'Origin');
    const error = (status, code, message) => { res.statusCode = status; res.end(JSON.stringify({ error: { code, message }, requestId })); };
    let pathname;
    try { pathname = new URL(req.url, 'http://localhost').pathname; }
    catch (_) { return error(400, 'BAD_REQUEST', '请求地址无效。'); }
    const storyMatch = pathname.match(new RegExp('^' + STORY_PATH_PREFIX + '(\\d+)$'));
    if (pathname !== HOME_PATH && !storyMatch) return error(404, 'NOT_FOUND', '接口不存在。');
    const origin = req.headers.origin;
    if (origin && !origins.includes(origin)) return error(403, 'ORIGIN_NOT_ALLOWED', '来源不在允许列表。');
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.statusCode = 204; return res.end();
    }
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET, OPTIONS'); return error(405, 'METHOD_NOT_ALLOWED', '只支持读取内容。'); }
    if (storyMatch) {
      const story = storyLoader(Number(storyMatch[1]));
      if (!story) return error(404, 'STORY_NOT_FOUND', '没有找到这卷故事。');
      return res.end('{"data":' + JSON.stringify(story) + ',"requestId":' + JSON.stringify(requestId) + '}');
    }
    res.end('{"data":' + data + ',"requestId":' + JSON.stringify(requestId) + '}');
  });
}
if (require.main === module) {
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || 4174);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be 1–65535');
  const origins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean) : DEFAULT_ORIGINS;
  const server = createServer({ origins });
  server.on('error', error => { console.error('API 启动失败：', error.message); process.exitCode = 1; });
  server.listen(port, host, () => console.log('山海水戏 API: http://' + host + ':' + port + HOME_PATH));
}
module.exports = { createServer };
