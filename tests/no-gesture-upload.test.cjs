'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const mini = path.join(root, 'apps/wechat-miniprogram-diagnostic');

function read(relative) {
  return fs.readFileSync(path.join(mini, relative), 'utf8');
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

test('no-gesture comparison package does not expose or import camera inference', () => {
  const stageMarkup = read('story-packages/story-01/pages/stage/index.wxml');
  const homeMarkup = read('pages/home/index.wxml');
  const stageLogic = read('shared/story-stage-page.js');
  assert.doesNotMatch(stageMarkup, /visionCanvas|\u5f00\u542f\u6444\u50cf\u5934|<camera\b/);
  assert.doesNotMatch(homeMarkup, /MediaPipe Hands|\u5f00\u542f\u6444\u50cf\u5934|<camera\b/);
  assert.doesNotMatch(stageLogic, /require\(['"]\.\/wechat-hand-inference['"]\)/);
  assert.match(stageMarkup, /\u65e0\u624b\u52bf\u4e0a\u4f20\u6d4b\u8bd5/);
});

test('upload configuration filters unused inference files but force-includes runtime art', () => {
  const config = JSON.parse(read('project.config.json'));
  assert.equal(config.setting.ignoreUploadUnusedFiles, true);
  assert.equal(config.setting.uploadWithSourceMap, false);
  const ignored = config.packOptions.ignore.map(item => item.value);
  const included = config.packOptions.include.map(item => item.value);
  assert.ok(ignored.includes('shared/wechat-hand-inference.js'));
  assert.ok(ignored.includes('shared/vision-diagnostics.js'));
  assert.ok(included.includes('assets'));
  assert.ok(included.includes('story-packages/story-01/assets'));
});

test('diagnostic package has no byte-identical duplicate images', () => {
  const images = walk(mini).filter(file => /\.(?:jpe?g|png|webp)$/i.test(file));
  const hashes = new Map();
  images.forEach(file => {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    const matches = hashes.get(hash) || [];
    matches.push(path.relative(mini, file));
    hashes.set(hash, matches);
  });
  const duplicates = [...hashes.values()].filter(group => group.length > 1);
  assert.deepEqual(duplicates, []);
});

test('Android stage layer has an explicit full-screen containing block', () => {
  const wxss = read('story-packages/story-01/pages/stage/index.wxss');
  assert.match(wxss, /\.stage-puppets\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;/s);
});
