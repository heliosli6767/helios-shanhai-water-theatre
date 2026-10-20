'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { once } = require('node:events');
const { loadHome, loadStory } = require('../services/backend/content.cjs');
const { createServer } = require('../services/backend/server.cjs');
const { isHomeResponse } = require('../packages/api-contracts/home.js');
const { isStoryResponse } = require('../packages/api-contracts/story.js');
const root = path.resolve(__dirname, '..');
const miniRoot = path.join(root, 'apps/wechat-miniprogram');
const response = () => ({ data: loadHome(), requestId: 'test-request' });
const flush = () => new Promise(resolve => setImmediate(resolve));
const directorySize = directory => fs.readdirSync(directory, { withFileTypes: true }).reduce((total, entry) => {
  const filename = path.join(directory, entry.name);
  return total + (entry.isDirectory() ? directorySize(filename) : fs.statSync(filename).size);
}, 0);

// Native service/page logic under an injected wx interface. This is NOT the
// WeChat runtime: WXML rendering, domain policy and device behavior need DevTools.
function miniRuntime(wx) {
  const cache = new Map();
  let definition;
  function load(file) {
    const filename = path.resolve(miniRoot, file.endsWith('.js') ? file : file + '.js');
    assert.ok(filename.startsWith(miniRoot + path.sep));
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
      module, exports: module.exports, wx,
      require: name => load(path.relative(miniRoot, path.resolve(path.dirname(filename), name))),
      Page: value => { definition = value; }
    }, { filename, timeout: 1000 });
    return module.exports;
  }
  return { load, page() {
    load('pages/home/index.js');
    const page = { ...definition, data: { ...definition.data }, updates: 0,
      setData(patch) { Object.assign(this.data, patch); this.updates++; }
    };
    return page;
  } };
}
function fakeWx(version = 'develop') {
  const calls = [];
  return { calls, getAccountInfoSync: () => ({ miniProgram: { envVersion: version } }),
    request(options) {
      const entry = { options, aborted: false };
      calls.push(entry);
      return { abort() { entry.aborted = true; } };
    }
  };
}

function developApiBaseUrl() {
  return miniRuntime(fakeWx()).load('services/config').getConfig().apiBaseUrl;
}

test('content adapter preserves all nine story IDs and 27 scenes', () => {
  const home = loadHome();
  assert.deepEqual(home.stories.map(story => story.id), [1, 2, 3, 7, 8, 9, 10, 16, 20]);
  assert.deepEqual(home.stats, { storyCount: 9, sceneCount: 27 });
  assert.equal(home.project.name, '山海水戏');
  assert.equal(home.stories[0].title, '精卫填海');
  assert.equal(home.contentVersion, loadHome().contentVersion);
  assert.ok(isHomeResponse(response()));
  for (const id of [1, 2, 3, 7, 8, 9, 10, 16, 20]) {
    const story = loadStory(id);
    assert.equal(story.id, id);
    assert.ok(story.narrative.length >= 3);
    assert.ok(story.quote.length >= 1);
    assert.equal(story.scenes.length, 3);
    assert.ok(story.scenes.every(scene => scene.steps.length >= 1));
    assert.ok(isStoryResponse({ data: story, requestId: 'story-test' }));
  }
  assert.equal(loadStory(999), null);
});

test('contract rejects missing, inconsistent and duplicate content', () => {
  for (const mutate of [
    body => { delete body.requestId; },
    body => { body.data.schemaVersion = 2; },
    body => { body.data.stats.storyCount = 10; },
    body => { body.data.stats.sceneCount = 28; },
    body => { body.data.stories[1].id = 1; },
    body => { body.data.stories[0].summary = ''; }
  ]) { const body = response(); mutate(body); assert.equal(isHomeResponse(body), false); }
});

test('native package has its own page files and synchronized shared contract', () => {
  const app = JSON.parse(fs.readFileSync(path.join(miniRoot, 'app.json')));
  assert.deepEqual(app.pages, ['pages/home/index']);
  assert.equal(app.subPackages.length, 9);
  for (const ext of ['js', 'json', 'wxml', 'wxss']) assert.ok(fs.existsSync(path.join(miniRoot, 'pages/home/index.' + ext)));
  const config = JSON.parse(fs.readFileSync(path.join(miniRoot, 'project.config.json')));
  assert.equal(config.compileType, 'miniprogram');
  assert.equal(config.miniprogramRoot, './');
  assert.equal(config.setting.urlCheck, true);
  assert.match(config.appid, /^(?:|wx[a-f0-9]{16})$/);
  for (const id of ['01', '02', '03', '07', '08', '09', '10', '16', '20']) {
    const packageRoot = path.join(miniRoot, 'story-packages/story-' + id);
    const readerMarkup = fs.readFileSync(path.join(packageRoot, 'pages/reader/index.wxml'), 'utf8');
    assert.ok(readerMarkup.indexOf('enterStage') < readerMarkup.indexOf('data-mode="story"'));
    assert.ok(readerMarkup.indexOf('data-mode="story"') < readerMarkup.indexOf('data-mode="classic"'));
    assert.match(readerMarkup, /reader-leading/);
    assert.match(readerMarkup, /reader-character/);
    assert.match(readerMarkup, /reader-prop/);
    assert.doesNotMatch(readerMarkup, /第一幕 · 角色与道具|向右轻扫查看完整水上场景/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(packageRoot, 'pages/reader/index.json'))).pageOrientation, 'portrait');
    assert.equal(JSON.parse(fs.readFileSync(path.join(packageRoot, 'pages/reader-landscape/index.json'))).pageOrientation, 'landscape');
    assert.equal(JSON.parse(fs.readFileSync(path.join(packageRoot, 'pages/stage/index.json'))).pageOrientation, 'landscape');
    for (const page of ['reader-landscape']) for (const ext of ['js', 'json', 'wxml', 'wxss']) {
      assert.ok(fs.existsSync(path.join(packageRoot, 'pages', page, 'index.' + ext)));
    }
    for (const act of [1, 2, 3]) {
      const scene = path.join(packageRoot, 'assets/act-' + act + '.jpg');
      assert.ok(fs.existsSync(scene));
      assert.ok(fs.statSync(scene).size > 100 * 1024);
    }
    for (const readerAsset of ['reader-bg.jpg', 'reader-character.png', 'reader-prop.png']) {
      const asset = path.join(packageRoot, 'assets', readerAsset);
      assert.ok(fs.existsSync(asset));
      assert.ok(fs.statSync(asset).size > 8 * 1024);
    }
    assert.ok(directorySize(packageRoot) < 2 * 1024 * 1024);
    const cover = path.join(miniRoot, 'assets/images/covers/story-' + id + '.jpg');
    assert.ok(fs.existsSync(cover));
    assert.ok(fs.statSync(cover).size > 20 * 1024);
  }
  const stageMarkup = fs.readFileSync(path.join(miniRoot, 'story-packages/story-01/pages/stage/index.wxml'), 'utf8');
  const readerPageSource = fs.readFileSync(path.join(miniRoot, 'shared/story-reader-page.js'), 'utf8');
  assert.match(readerPageSource, /enterStage:[\s\S]*wx\.navigateTo/);
  assert.doesNotMatch(readerPageSource, /wx\.showModal/);
  assert.match(readerPageSource, /toggleOrientation/);
  assert.match(readerPageSource, /reader-landscape/);
  assert.match(fs.readFileSync(path.join(miniRoot, 'story-packages/story-01/pages/reader-landscape/index.wxml'), 'utf8'), /竖屏观看/);
  assert.match(stageMarkup, /type="webgl" id="visionCanvas"/);
  assert.match(stageMarkup, /stage-puppets/);
  assert.doesNotMatch(stageMarkup, /<camera/);
  assert.doesNotMatch(stageMarkup, /hand-overlay|hand-point|hand-line/);
  assert.match(stageMarkup, /showBuildInfo/);
  assert.match(stageMarkup, /请操作/);
  assert.match(stageMarkup, /theme-picker/);
  assert.match(stageMarkup, /previewStage/);
  assert.doesNotMatch(stageMarkup, /微信原生手势/);
  for (let index = 1; index <= 5; index++) {
    assert.ok(fs.statSync(path.join(miniRoot, 'assets/images/stages/stage-' + index + '.jpg')).size > 45 * 1024);
  }
  const performanceSource = require(path.join(miniRoot, 'shared/performance-data.js'));
  assert.equal(performanceSource['1'].scenes[1].cues[1].effect, '女娃的身影化为光，精卫鸟从光中飞出。');
  assert.equal(performanceSource['2'].scenes[0].cues[1].requirements.length, 2);
  assert.equal(performanceSource['8'].scenes[2].cues[1].requirements.length, 2);
  assert.ok(directorySize(miniRoot) - directorySize(path.join(miniRoot, 'story-packages')) < 2 * 1024 * 1024);
  const handSource = fs.readFileSync(path.join(miniRoot, 'shared/wechat-hand-inference.js'), 'utf8');
  assert.match(handSource, /createVKSession/);
  assert.match(handSource, /hand:\s*\{ mode: 1 \}/);
  assert.match(handSource, /getVKFrame/);
  assert.match(handSource, /gl: this\.gl/);
  assert.ok(fs.existsSync(path.join(miniRoot, 'shared/stage-layout-data.js')));
  assert.ok(fs.existsSync(path.join(miniRoot, 'story-packages/story-01/assets/sprites/A010.webp')));
  const waterSource = fs.readFileSync(path.join(miniRoot, 'shared/mini-water.js'), 'utf8');
  assert.match(waterSource, /getContext\('2d'/);
  assert.match(waterSource, /drawImage\(image/);
  assert.match(waterSource, /globalCompositeOperation = 'screen'/);
  const packageBuilder = fs.readFileSync(path.join(root, 'scripts/build-miniprogram-story-packages.cjs'), 'utf8');
  assert.doesNotMatch(packageBuilder, /scene\.effects\.slice/);
  const source = fs.readFileSync(path.join(root, 'packages/api-contracts/home.js'), 'utf8');
  assert.equal(fs.readFileSync(path.join(miniRoot, 'services/home-contract.js'), 'utf8'),
    '// Generated by npm run sync:miniprogram. Edit packages/api-contracts/home.js instead.\n' + source);
  const storySource = fs.readFileSync(path.join(root, 'packages/api-contracts/story.js'), 'utf8');
  assert.equal(fs.readFileSync(path.join(miniRoot, 'services/story-contract.js'), 'utf8'),
    '// Generated by npm run sync:miniprogram. Edit packages/api-contracts/story.js instead.\n' + storySource);
});

test('HTTP API serves content and enforces its narrow read-only boundary', async t => {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = 'http://127.0.0.1:' + server.address().port;
  const result = await fetch(base + '/api/v1/home');
  assert.equal(result.status, 200);
  assert.match(result.headers.get('content-type'), /application\/json/);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  const body = await result.json();
  assert.ok(isHomeResponse(body));
  assert.equal(result.headers.get('x-request-id'), body.requestId);
  assert.equal(body.data.stats.storyCount, 9);
  const storyResult = await fetch(base + '/api/v1/stories/1');
  assert.equal(storyResult.status, 200);
  const storyBody = await storyResult.json();
  assert.ok(isStoryResponse(storyBody));
  assert.equal(storyBody.data.title, '精卫填海');
  assert.equal(storyBody.data.narrative.length, 4);
  const missingStory = await fetch(base + '/api/v1/stories/999');
  assert.equal(missingStory.status, 404);
  assert.equal((await missingStory.json()).error.code, 'STORY_NOT_FOUND');
  for (const route of ['/api/v1/stories', '/stories.js', '/.env', '/']) {
    const missing = await fetch(base + route);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error.code, 'NOT_FOUND');
  }
  const post = await fetch(base + '/api/v1/home', { method: 'POST' });
  assert.equal(post.status, 405);
  assert.equal((await post.json()).error.code, 'METHOD_NOT_ALLOWED');
  const allowed = await fetch(base + '/api/v1/home', { headers: { Origin: 'http://localhost:4173' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:4173');
  const denied = await fetch(base + '/api/v1/home', { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  const preflight = await fetch(base + '/api/v1/home', { method: 'OPTIONS', headers: { Origin: 'http://localhost:4173' } });
  assert.equal(preflight.status, 204);

  // Actual HTTP round trip through the mini program service. Only the host port
  // is rewritten to an ephemeral test port; wx semantics are a test adapter.
  const wx = fakeWx();
  wx.request = options => {
    assert.equal(options.url, developApiBaseUrl() + '/api/v1/home');
    const controller = new AbortController();
    fetch(base + new URL(options.url).pathname, { signal: controller.signal })
      .then(async result => options.success({ statusCode: result.status, data: await result.json() }))
      .catch(error => options.fail({ errMsg: error.message }));
    return { abort() { controller.abort(); } };
  };
  const page = miniRuntime(wx).page();
  page.onLoad();
  await page._request.promise;
  await flush();
  assert.equal(page.data.loading, false);
  assert.equal(page.data.home.stories.length, 9);
  assert.equal(page.data.home.stats.sceneCount, 27);
  assert.equal(page.data.error, '');
  page.onUnload();
});

test('mini program refuses unconfigured trial/release environments', async () => {
  for (const version of ['trial', 'release', 'unknown']) {
    const wx = fakeWx(version);
    await assert.rejects(miniRuntime(wx).load('services/home').requestHome().promise, { code: 'CONFIG_ERROR' });
    assert.equal(wx.calls.length, 0);
  }
});

test('request service distinguishes invalid response, HTTP failure and network failure', async () => {
  for (const [event, data, code] of [
    ['success', { statusCode: 200, data: {} }, 'INVALID_RESPONSE'],
    ['success', { statusCode: 503, data: {} }, 'HTTP_ERROR'],
    ['fail', { errMsg: 'request:fail timeout' }, 'TIMEOUT'],
    ['fail', { errMsg: 'request:fail network' }, 'NETWORK_ERROR']
  ]) {
    const wx = fakeWx();
    const request = miniRuntime(wx).load('services/home').requestHome();
    wx.calls[0].options[event](data);
    await assert.rejects(request.promise, { code });
  }
});

test('native story service reads the shared detail contract', async () => {
  const wx = fakeWx();
  const request = miniRuntime(wx).load('services/story').requestStory(1);
  assert.equal(wx.calls[0].options.url, developApiBaseUrl() + '/api/v1/stories/1');
  wx.calls[0].options.success({ statusCode: 200, data: { data: loadStory(1), requestId: 'story-request' } });
  const result = await request.promise;
  assert.equal(result.data.title, '精卫填海');
  assert.equal(result.data.quote[0].text, '是炎帝之少女，名曰女娃。');
});

test('homepage retries, ignores stale requests and stops updates after unload', async () => {
  const wx = fakeWx();
  const page = miniRuntime(wx).page();
  page.onLoad();
  assert.equal(page.data.loading, true);
  wx.calls[0].options.fail({ errMsg: 'request:fail network' });
  await flush();
  assert.equal(page.data.loading, false);
  assert.ok(page.data.error.includes('无法连接'));
  page.retry();
  assert.equal(page.data.error, '');
  page.retry();
  assert.equal(wx.calls[1].aborted, true);
  wx.calls[1].options.success({ statusCode: 200, data: { ...response(), requestId: 'stale' } });
  await flush();
  assert.equal(page.data.home, null);
  wx.calls[2].options.success({ statusCode: 200, data: response() });
  await flush();
  assert.equal(page.data.requestId, 'test-request');
  assert.equal(page.data.home.stories.length, 9);
  page.retry();
  page.onUnload();
  const updates = page.updates;
  assert.equal(wx.calls[3].aborted, true);
  wx.calls[3].options.success({ statusCode: 200, data: response() });
  await flush();
  assert.equal(page.updates, updates);
});
