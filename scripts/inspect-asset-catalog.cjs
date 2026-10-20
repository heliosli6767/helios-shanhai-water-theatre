// Read-only catalog reconciliation. Prints derived status for apply_patch to persist.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', '资料库');
const current = JSON.parse(fs.readFileSync(path.join(root, '制作状态.json'), 'utf8'));
for (const asset of current.assets) {
  delete asset.prompt;
  const expected = `${asset.folder}/02_图片/${asset.name}_3D视觉_v001.png`;
  if (fs.existsSync(path.join(root, expected))) {
    asset.image = expected;
    asset.status = 'generated';
  }
  const waterVersion = `${asset.folder}/02_图片/${asset.name}_水戏前景_v002.png`;
  if (fs.existsSync(path.join(root, waterVersion))) {
    asset.image = waterVersion;
    asset.status = 'generated';
    asset.waterStage = 'foreground_pool_reflections_ripples';
  }
  const blendDir = path.join(root, asset.folder, '03_Blender');
  const corrected = `${asset.folder}/02_图片/${asset.name}_校对_v002.png`;
  if (fs.existsSync(path.join(root, corrected))) asset.image = corrected;
  const corrected3 = `${asset.folder}/02_图片/${asset.name}_校对_v003.png`;
  if (fs.existsSync(path.join(root, corrected3))) asset.image = corrected3;
  const blend = fs.readdirSync(blendDir).find(name => name.endsWith('.blend'));
  if (blend) asset.blender = `${asset.folder}/03_Blender/${blend}`;
  if (asset.image) {
    const data = fs.readFileSync(path.join(root, asset.image));
    if (data.subarray(1, 4).toString() === 'PNG') asset.dimensions = [data.readUInt32BE(16), data.readUInt32BE(20)];
  }
}
current.updated = new Date().toISOString();
process.stdout.write(JSON.stringify(current, null, 2));
