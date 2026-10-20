// Read-only audit. Refresh 制作状态.json before running.
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const root=path.resolve(__dirname,'../资料库');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'制作状态.json'),'utf8'));
const hashes=new Map(), missing=[], duplicates=[], stories={}, kinds={};
let ready=0, blends=0;
for(const a of catalog.assets){
  for(const d of ['01_参考资料','02_图片','03_Blender','04_导出动画与模型'])
    if(!fs.existsSync(path.join(root,a.folder,d))) missing.push(`${a.id}: missing ${d}`);
  if(!a.image || !fs.existsSync(path.join(root,a.image))){missing.push(`${a.id}: image missing`);continue;}
  const bytes=fs.readFileSync(path.join(root,a.image));
  if(bytes.length<10000) missing.push(`${a.id}: suspiciously small image`);
  if(bytes.subarray(1,4).toString()==='PNG'){
    if(bytes.readUInt32BE(16)<700 || bytes.readUInt32BE(20)<700)missing.push(`${a.id}: low resolution`);
    if(!bytes.subarray(-8).includes(Buffer.from('IEND')))missing.push(`${a.id}: incomplete PNG`);
  }
  const hash=crypto.createHash('sha256').update(bytes).digest('hex');
  if(hashes.has(hash))duplicates.push([hashes.get(hash),a.id]);
  else hashes.set(hash,a.id);
  ready++; stories[a.story]=(stories[a.story]||0)+1; kinds[a.type]=(kinds[a.type]||0)+1;
  if(a.blender){if(fs.existsSync(path.join(root,a.blender)))blends++;else missing.push(`${a.id}: Blender missing`);}
  if(a.status==='generated'){
    const notes=fs.readdirSync(path.join(root,a.folder,'01_参考资料'));
    if(!notes.some(n=>n.includes('制作说明')||n.includes('生成记录')))missing.push(`${a.id}: prompt record missing`);
  }
}
console.log(JSON.stringify({checkedAt:new Date().toISOString(),total:catalog.assets.length,ready,blends,stories,kinds,missing,duplicates},null,2));
process.exitCode=missing.length||duplicates.length?1:0;
