'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const miniRoot = path.join(root, 'apps/wechat-miniprogram');
const context = vm.createContext({ window: {} });
for (const file of ['asset-map.js', 'scene-data.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const assets = context.window.SHANHAI_ASSETS;
const stories = context.window.STORY_SCENES;
context.SHANHAI_ASSETS = assets;
context.STORY_SCENES = stories;
vm.runInContext(fs.readFileSync(path.join(root, 'performance-data.js'), 'utf8'), context, { filename: 'performance-data.js' });
const webPerformance = context.window.STORY_PERFORMANCE;
const cutoutCache = new Map();

const FEATURED = { 1: 'A011', 2: 'A022', 3: 'A033', 7: 'A051', 8: 'A065', 9: 'A081', 10: 'A092', 16: 'A102', 20: 'A114' };
const STAGE_FILES = [
  '01-lacquer-pavilion',
  '02-bamboo-water-pavilion',
  '03-moonstone-water-shrine',
  '04-festival-lantern-stage',
  '05-jade-driftwood-arch'
];

function resolveAsset(id) {
  const asset = assets[id];
  if (!asset) throw new Error(`Unknown asset ${id}`);
  return path.join(root, asset.src.replace(/^\.\//, ''));
}

function distanceToSamples(data, offset, samples) {
  const r = data[offset], g = data[offset + 1], b = data[offset + 2];
  return samples.some(sample => {
    const lum = (r + g + b - sample[0] - sample[1] - sample[2]) / 3;
    return Math.abs(lum) < 34 &&
      Math.abs((r - g) - (sample[0] - sample[1])) < 12 &&
      Math.abs((g - b) - (sample[1] - sample[2])) < 12;
  });
}

async function cutout(id) {
  if (cutoutCache.has(id)) return cutoutCache.get(id);
  const promise = (async () => {
    const source = sharp(resolveAsset(id)).rotate().resize({
      width: 520,
      height: 520,
      fit: 'inside',
      withoutEnlargement: true
    }).ensureAlpha();
    const { data, info } = await source.raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    let authoredAlpha = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 240) { authoredAlpha = true; break; }
    }
    if (!authoredAlpha) {
      const points = [[.02, .02], [.98, .02], [.02, .5], [.98, .5], [.02, .98], [.98, .98]];
      const samples = points.map(([x, y]) => {
        const offset = (Math.min(height - 1, Math.floor(y * height)) * width + Math.min(width - 1, Math.floor(x * width))) * 4;
        return [data[offset], data[offset + 1], data[offset + 2]];
      });
      const visited = new Uint8Array(width * height);
      const removed = new Uint8Array(width * height);
      const queue = new Int32Array(width * height);
      let head = 0, tail = 0;
      const isEdge = index => {
        const x = index % width, y = Math.floor(index / width);
        if (x < 1 || x >= width - 1 || y < 1 || y >= height - 1) return false;
        let spread = 0;
        for (let channel = 0; channel < 3; channel++) {
          const values = [data[(index - 1) * 4 + channel], data[(index + 1) * 4 + channel], data[(index - width) * 4 + channel], data[(index + width) * 4 + channel]];
          spread += Math.max(...values) - Math.min(...values);
        }
        return spread > 68;
      };
      const visit = index => {
        if (index < 0 || index >= width * height || visited[index]) return;
        visited[index] = 1;
        const offset = index * 4;
        if ((data[offset + 3] < 20 || distanceToSamples(data, offset, samples)) && !isEdge(index)) {
          removed[index] = 1;
          queue[tail++] = index;
        }
      };
      for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
      for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
      while (head < tail) {
        const index = queue[head++];
        if (index % width) visit(index - 1);
        if (index % width < width - 1) visit(index + 1);
        visit(index - width);
        visit(index + width);
      }
      for (let i = 0; i < removed.length; i++) {
        if (removed[i]) data[i * 4 + 3] = 0;
      }
    }
    const bounds = await sharp(data, { raw: { width, height, channels: 4 } }).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer({ resolveWithObject: true });
    return { buffer: bounds.data, width: bounds.info.width, height: bounds.info.height };
  })();
  cutoutCache.set(id, promise);
  return promise;
}

async function place(id, x, bottom, targetHeight, opacity = 1, canvasWidth = 1280, canvasHeight = 720) {
  const item = await cutout(id);
  const height = Math.round(targetHeight);
  const width = Math.max(1, Math.round(item.width * height / item.height));
  const input = await sharp(item.buffer).resize({ width, height, fit: 'fill' }).png().toBuffer();
  return {
    input,
    left: Math.max(0, Math.min(canvasWidth - width, Math.round(canvasWidth * x - width / 2))),
    top: Math.max(0, Math.min(canvasHeight - height, Math.round(canvasHeight - bottom - height))),
    blend: 'over',
    opacity
  };
}

async function renderScene(scene, output) {
  // The stage must remain composable. Characters and props are exported as
  // independent transparent sprites below so VisionKit can move them in real time.
  await sharp(resolveAsset(scene.background)).rotate().resize(1280, 720, { fit: 'cover' })
    .modulate({ saturation: 1.08, brightness: 1.03 })
    .jpeg({ quality: 84, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(output);
}

async function renderStageSprites(scenes, assetDir) {
  const spriteDir = path.join(assetDir, 'sprites');
  fs.mkdirSync(spriteDir, { recursive: true });
  const ids = new Set();
  scenes.forEach(scene => {
    scene.cast.forEach(id => ids.add(id));
    scene.props.forEach(id => ids.add(id));
  });
  // Jingwei appears during the act-two transformation before act three begins.
  if (scenes === stories[1]) ids.add('A011');
  for (const id of ids) {
    const item = await cutout(id);
    const targetHeight = assets[id].type === 'character' ? 320 : 120;
    await sharp(item.buffer)
      .resize({ height: targetHeight, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78, alphaQuality: 90, smartSubsample: true })
      .toFile(path.join(spriteDir, `${id}.webp`));
  }
}

function exportStageLayoutData() {
  const output = {};
  for (const [storyId, scenes] of Object.entries(stories)) {
    output[storyId] = {
      acts: scenes.map((scene, actIndex) => {
        const cast = scene.cast.map((id, index) => ({
          id,
          name: assets[id].name,
          type: 'actor',
          x: scene.cast.length === 1 ? 50 : index === 0 ? 38 : index === 1 ? 65 : 18 + (index - 2) * 15,
          bottom: index > 1 ? 22 : 14,
          width: index > 1 ? 15 : 22,
          opacity: 1
        }));
        if (Number(storyId) === 1 && actIndex === 1) {
          cast.push({ id: 'A011', name: assets.A011.name, type: 'actor', x: 42, bottom: 20, width: 19, opacity: 0, transitionActor: true });
        }
        const props = scene.props.slice(0, 5).map((id, index) => ({
          id,
          name: assets[id].name,
          type: 'prop',
          x: 24 + (index + 1) * 54 / (Math.min(scene.props.length, 5) + 1),
          bottom: 8 + (index % 2) * 3,
          width: 9,
          opacity: 1
        }));
        return { cast, props };
      })
    };
  }
  fs.writeFileSync(
    path.join(miniRoot, 'shared/stage-layout-data.js'),
    `'use strict';\n// Generated from scene-data.js for the native layered stage.\nmodule.exports = ${JSON.stringify(output, null, 2)};\n`
  );
}

async function renderCover(storyId, scene, output) {
  const width = 320, height = 450;
  const composites = [await place(FEATURED[storyId], .55, 43, 292, 1, width, height)];
  if (scene.props[0]) composites.push(await place(scene.props[0], .22, 24, 82, .96, width, height));
  await sharp(resolveAsset(scene.background)).rotate().resize(width, height, { fit: 'cover', position: 'attention' })
    .modulate({ saturation: 1.12, brightness: 1.04 })
    .composite(composites)
    .jpeg({ quality: 82, chromaSubsampling: '4:2:0', mozjpeg: true })
    .toFile(output);
}

async function renderReaderAssets(storyId, scene, assetDir) {
  await sharp(resolveAsset(scene.background)).rotate().resize(1280, 720, { fit: 'cover' })
    .modulate({ saturation: 1.06, brightness: 1.03 })
    .jpeg({ quality: 86, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(path.join(assetDir, 'reader-bg.jpg'));

  const character = await cutout(scene.cast[0] || FEATURED[storyId]);
  await sharp(character.buffer).resize({ height: 440, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(assetDir, 'reader-character.png'));

  if (scene.props[0]) {
    const prop = await cutout(scene.props[0]);
    await sharp(prop.buffer).resize({ height: 180, fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(path.join(assetDir, 'reader-prop.png'));
  }
}

async function renderStageThemes() {
  const target = path.join(miniRoot, 'assets/images/stages');
  fs.mkdirSync(target, { recursive: true });
  for (let index = 0; index < STAGE_FILES.length; index++) {
    await sharp(path.join(root, 'assets/concepts/stage', `${STAGE_FILES[index]}.png`))
      .resize(960, 540, { fit: 'fill' })
      .jpeg({ quality: 72, chromaSubsampling: '4:2:0', mozjpeg: true })
      .toFile(path.join(target, `stage-${index + 1}.jpg`));
  }
}

function exportPerformanceData() {
  const output = {};
  for (const [storyId, scenes] of Object.entries(stories)) {
    const id = Number(storyId);
    output[storyId] = {
      intro: webPerformance.intros[id],
      scenes: scenes.map((scene, actIndex) => ({
        cues: scene.steps.map((step, stepIndex) => {
          const cue = webPerformance.cue(id, actIndex, stepIndex);
          return Object.assign({}, cue, {
            focusName: assets[cue.focus] ? assets[cue.focus].name : '',
            roles: webPerformance.roles(id, actIndex, stepIndex),
            requirements: cue.requirements.map(requirement => Object.assign({}, requirement, {
              focusName: assets[requirement.focus] ? assets[requirement.focus].name : ''
            }))
          });
        })
      }))
    };
  }
  fs.writeFileSync(
    path.join(miniRoot, 'shared/performance-data.js'),
    `'use strict';\n// Generated from the final Web performance flow.\nmodule.exports = ${JSON.stringify(output, null, 2)};\n`
  );
}

const readerJs = (storyId, forcedLandscape = false) => `'use strict';\nconst createReaderPage = require('../../../../shared/story-reader-page');\nPage(createReaderPage(${storyId}, '/story-packages/story-${String(storyId).padStart(2, '0')}', ${forcedLandscape}));\n`;
const stageJs = storyId => `'use strict';\nconst createStagePage = require('../../../../shared/story-stage-page');\nPage(createStagePage(${storyId}, '/story-packages/story-${String(storyId).padStart(2, '0')}'));\n`;

async function main() {
  const codeOnly = process.argv.includes('--code-only');
  const templateDir = path.join(root, 'scripts/miniprogram-story-templates');
  const covers = path.join(miniRoot, 'assets/images/covers');
  fs.mkdirSync(covers, { recursive: true });
  if (!codeOnly) await renderStageThemes();
  exportPerformanceData();
  exportStageLayoutData();
  for (const [storyId, scenes] of Object.entries(stories)) {
    const prefix = String(storyId).padStart(2, '0');
    const packageRoot = path.join(miniRoot, 'story-packages', `story-${prefix}`);
    const assetDir = path.join(packageRoot, 'assets');
    fs.mkdirSync(path.join(packageRoot, 'pages/reader'), { recursive: true });
    fs.mkdirSync(path.join(packageRoot, 'pages/reader-landscape'), { recursive: true });
    fs.mkdirSync(path.join(packageRoot, 'pages/stage'), { recursive: true });
    fs.mkdirSync(assetDir, { recursive: true });
    if (!codeOnly) {
      await renderCover(Number(storyId), scenes[0], path.join(covers, `story-${prefix}.jpg`));
      await renderReaderAssets(Number(storyId), scenes[0], assetDir);
      await renderStageSprites(scenes, assetDir);
      for (let index = 0; index < scenes.length; index++) {
        const output = path.join(assetDir, `act-${index + 1}.jpg`);
        await renderScene(scenes[index], output);
      }
    }
    fs.writeFileSync(path.join(packageRoot, 'pages/reader/index.js'), readerJs(Number(storyId)));
    fs.writeFileSync(path.join(packageRoot, 'pages/reader-landscape/index.js'), readerJs(Number(storyId), true));
    fs.writeFileSync(path.join(packageRoot, 'pages/stage/index.js'), stageJs(Number(storyId)));
    for (const page of ['reader', 'stage']) {
      for (const extension of ['wxml', 'wxss', 'json']) {
        fs.copyFileSync(path.join(templateDir, `${page}.${extension}`), path.join(packageRoot, `pages/${page}/index.${extension}`));
      }
    }
    for (const extension of ['wxml', 'wxss']) {
      fs.copyFileSync(path.join(templateDir, `reader.${extension}`), path.join(packageRoot, `pages/reader-landscape/index.${extension}`));
    }
    fs.copyFileSync(path.join(templateDir, 'reader-landscape.json'), path.join(packageRoot, 'pages/reader-landscape/index.json'));
  }
  require('./stamp-miniprogram-build.cjs')();
  console.log(codeOnly ? '已同步 9 个故事页面与剧情数据；现有图片未重新生成。' : '已生成 9 张故事封面、5 个水幕舞台、9 个故事分包与 27 张 1280×720 分层合成场景。');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
