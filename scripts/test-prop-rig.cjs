const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),c={window:{}};vm.createContext(c);
for(const file of ['asset-map.js','prop-rig.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c);
const {PuppetRig:R,SHANHAI_ASSETS:A}=c.window;
for(const [id,b] of [...Object.entries(R.equipment),...Object.values(R.pickups).map(b=>[b.id,b])]){
  assert(A[id]&&A[b.owner]);assert.equal(A[id].storyId,A[b.owner].storyId,'No cross-story attachment');
  assert(b.x>=0&&b.x<=1&&b.y>=0&&b.y<=1);assert(b.width>0&&b.width<=1);
}
for(const [width,height,iw,ih] of [[300,500,1200,1600],[500,240,1000,1600],[150,180,1163,1352]]){
  const fit=R.fit(width,height,iw,ih);assert(fit.x>=0&&fit.y>=0&&fit.width<=width+.001&&fit.height<=height+.001);
  const p=R.point(fit,R.pickups.A011);assert(p.x>fit.x&&p.x<fit.x+fit.width);assert(p.y>fit.y&&p.y<fit.y+fit.height);
  assert(Math.abs(p.width/fit.width-.105)<.0001);
}
assert.equal(R.pickups.A011.id,'A013');assert.equal(R.pickups.A011.variant,'stone');assert(R.equipment.A074.y<.35);assert.equal(R.equipment.A074.owner,'A068');
assert(R.pickups.A051.flip,'Arrow tip must point toward the opponent');
for(const f of ['prop-rig.js','stage-renderer.js','theatre.js','app.js'])new vm.Script(fs.readFileSync(path.join(root,f),'utf8'));
console.log('PASS: attachment ownership, image-fit coordinates at three aspect ratios, single-pebble atlas window, instrument hand height and arrow direction.');
