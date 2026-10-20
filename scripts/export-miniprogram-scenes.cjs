'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ window: {} });
for (const file of ['asset-map.js', 'scene-data.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const target = path.join(root, 'apps/wechat-miniprogram/assets/images/scenes');
fs.mkdirSync(target, { recursive: true });

const covers = path.join(root, 'apps/wechat-miniprogram/assets/images/covers');
for (const filename of fs.readdirSync(covers).filter(name => /\.jpe?g$/i.test(name))) {
  const input = path.join(covers, filename);
  const dimensions = spawnSync('sips', ['-g', 'pixelWidth', input], { encoding: 'utf8' });
  const width = Number((dimensions.stdout.match(/pixelWidth:\s*(\d+)/) || [])[1]);
  if (!width || width <= 280) continue;
  const temp = path.join(covers, filename.replace(/\.jpe?g$/i, '.mobile-temp.jpg'));
  const result = spawnSync('sips', [
    '-s', 'format', 'jpeg',
    '-s', 'formatOptions', '34',
    '-z', '397', '280',
    input,
    '--out', temp
  ], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'cover compression failed');
  fs.renameSync(temp, input);
}

for (const [storyId, scenes] of Object.entries(context.window.STORY_SCENES)) {
  scenes.forEach((scene, index) => {
    const asset = context.window.SHANHAI_ASSETS[scene.background];
    if (!asset) throw new Error('Missing background asset: ' + scene.background);
    const input = path.join(root, asset.src.replace(/^\.\//, ''));
    const output = path.join(target, 'story-' + String(storyId).padStart(2, '0') + '-act-' + (index + 1) + '.jpg');
    const result = spawnSync('sips', [
      '-s', 'format', 'jpeg',
      '-s', 'formatOptions', '32',
      '-z', '360', '640',
      input,
      '--out', output
    ], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'sips failed');
  });
}

console.log('已导出 27 幕小程序背景：' + target);
