'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'apps/wechat-miniprogram');
const target = path.join(root, 'apps/wechat-miniprogram-diagnostic');

require('./stamp-miniprogram-build.cjs')();

function copy(relativePath) {
  const from = path.join(source, relativePath);
  const to = path.join(target, relativePath);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true, force: true });
}

fs.mkdirSync(target, { recursive: true });

for (const item of [
  'app.js',
  'app.wxss',
  'sitemap.json',
  'pages',
  'services',
  'shared',
  'story-packages/story-01',
  'assets/images/home-hero.jpg',
  'assets/images/nine-islands.jpg',
  'assets/images/covers/story-01.jpg',
  'assets/images/stages'
]) copy(item);

const app = JSON.parse(fs.readFileSync(path.join(source, 'app.json'), 'utf8'));
app.subPackages = app.subPackages.filter(item => item.root === 'story-packages/story-01');
app.lazyCodeLoading = 'requiredComponents';
fs.writeFileSync(path.join(target, 'app.json'), JSON.stringify(app, null, 2) + '\n');

const project = JSON.parse(fs.readFileSync(path.join(source, 'project.config.json'), 'utf8'));
project.description = '山海水戏轻量真机诊断：仅首页与精卫填海';
project.projectname = 'shanhai-water-theatre-diagnostic';
fs.writeFileSync(path.join(target, 'project.config.json'), JSON.stringify(project, null, 2) + '\n');

// Keep this project's DevTools choices (including the user's LAN-debug choice).
// A source sync must not silently reset them to the full project's settings.
const privatePath = path.join(target, 'project.private.config.json');
const privateConfig = JSON.parse(fs.readFileSync(
  fs.existsSync(privatePath) ? privatePath : path.join(source, 'project.private.config.json'), 'utf8'));
privateConfig.projectname = 'shanhai-water-theatre-diagnostic';
fs.writeFileSync(path.join(target, 'project.private.config.json'), JSON.stringify(privateConfig, null, 2) + '\n');

const homeFile = path.join(target, 'pages/home/index.js');
const originalHome = fs.readFileSync(homeFile, 'utf8');
const originalDecorator = `function decorateStories(stories) {
  return stories.map(function(story) {
    var visual = STORY_VISUALS[story.id] || {};
    return Object.assign({}, story, visual);
  });
}`;
const diagnosticDecorator = `function decorateStories(stories) {
  return stories.filter(function(story) {
    return story.id === 1;
  }).map(function(story) {
    var visual = STORY_VISUALS[story.id] || {};
    return Object.assign({}, story, visual);
  });
}`;
if (!originalHome.includes(originalDecorator)) {
  throw new Error('首页故事装饰函数已变化，请同步诊断构建脚本。');
}
fs.writeFileSync(homeFile, originalHome.replace(originalDecorator, diagnosticDecorator));

fs.writeFileSync(path.join(target, 'README.md'), `# 山海水戏轻量真机诊断工程

仅保留首页、《精卫填海》、五种水幕、摄像头与手势逻辑，用于排查微信开发者工具预览/自动真机调试超时。

- 完整工程：\`apps/wechat-miniprogram\`
- 诊断工程：\`apps/wechat-miniprogram-diagnostic\`
- AppID 与完整工程一致。
- 开发 API 沿用完整工程的局域网地址。
- 不用于上传正式版本。
`);

console.log('轻量真机诊断工程已生成：' + target);
