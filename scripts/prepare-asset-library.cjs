// Create the asset library without changing webpage asset paths or overwriting files.
const fs = require('node:fs');
const path = require('node:path');
const project = path.resolve(__dirname, '..');
const library = path.join(project, '资料库');
const manifest = JSON.parse(fs.readFileSync(path.join(library, '资产目录.json'), 'utf8'));
let assets = 0;
for (const group of manifest.groups) {
  for (const [category, names] of Object.entries(group.assets)) {
    for (const name of names) {
      assets++;
      for (const subfolder of manifest.subfolders) {
        fs.mkdirSync(path.join(library, group.folder, category, name, subfolder), { recursive: true });
      }
    }
  }
}
const copies = [
  ['图片库/八仙风格.jpg', '00_全局参考/01_风格参考/八仙电影风格/01_参考资料/八仙风格_用户提供.jpg'],
  ['图片库/山海经首图.png', '01_首页_山海水戏/01_背景/山海群像水上剧场/01_参考资料/山海经首图_用户提供.png'],
  ['assets/hero-shanhai.png', '01_首页_山海水戏/01_背景/山海群像水上剧场/02_图片/首页_旧版_v001.png'],
  ['assets/hero-shanhai-v2.png', '01_首页_山海水戏/01_背景/山海群像水上剧场/02_图片/首页_移除无头人物_v002.png'],
  ['assets/ink-landscape.png', '00_全局参考/02_通用背景/旧版水墨山水/02_图片/水墨山水_旧版_v001.png']
];
for (const [source, target] of copies) {
  const destination = path.join(library, target);
  if (!fs.existsSync(destination)) fs.copyFileSync(path.join(project, source), destination, fs.constants.COPYFILE_EXCL);
  if (!fs.readFileSync(path.join(project, source)).equals(fs.readFileSync(destination))) {
    throw new Error(`Archived copy differs: ${target}`);
  }
}
console.log(`Asset library ready: ${assets} individual assets, ${manifest.subfolders.length} subfolders each. Existing originals preserved.`);
