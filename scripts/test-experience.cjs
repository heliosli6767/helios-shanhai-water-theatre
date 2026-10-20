/* Run: node scripts/test-experience.cjs — no packages or browser needed. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),context={window:{}};vm.createContext(context);
for(const f of ['stories.js','scene-data.js','asset-map.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f});
const {STORIES,STORY_SCENES,STORY_AUDIT,SHANHAI_ASSETS}=context.window;
assert.equal(STORIES.length,9);assert.equal(Object.keys(SHANHAI_ASSETS).length,125);
const used=new Set(),report=[];
for(const story of STORIES){
  const acts=STORY_SCENES[story.id];assert.equal(acts.length,3);assert(STORY_AUDIT[story.id]?.url);
  const storyAssets=new Set();
  for(const [i,act] of acts.entries()){
    assert.equal(SHANHAI_ASSETS[act.background].type,'background');assert(act.steps.length>=2);
    const ids=[act.background,...act.cast,...act.props,...act.effects];
    for(const id of ids){const asset=SHANHAI_ASSETS[id];assert(asset,`Missing ${id}`);assert.equal(asset.storyId,story.id,`Cross-story asset ${id}`);assert(fs.existsSync(path.resolve(root,asset.src)),`Missing file ${id}`);used.add(id);storyAssets.add(id);}
    for(const s of act.steps){assert(s.instruction&&s.label&&s.result&&s.motion);assert(ids.includes(s.focus),`Missing focus in ${story.title} ${i+1}: ${s.focus}`);}
  }
  for(const [han,py] of story.quote){const count=[...han].filter(c=>/\p{Script=Han}/u.test(c)).length;assert.equal((py.match(/[^\s,.;!?，。；]+/g)||[]).length,count,`Pinyin mismatch: ${story.title}`);}
  report.push({story:story.title,acts:acts.length,assets:storyAssets.size,steps:acts.reduce((n,a)=>n+a.steps.length,0)});
}
const expected=Object.values(SHANHAI_ASSETS).filter(a=>a.storyId!==null);
assert.equal(expected.length,119);for(const asset of expected)assert(used.has(asset.id),`Unused story asset ${asset.id}`);
for(const file of ['app.js','stage-renderer.js','water-surface.js','theatre.js','hand-input.js'])new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
vm.runInContext(fs.readFileSync(path.join(root,'theatre.js'),'utf8'),vm.createContext({window:{},StageArt:{escape:String},SHANHAI_ASSETS}),{filename:'theatre.js'});
const {createHash}=require('node:crypto');assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'stories.js'))).digest('hex'),'43b2c86a189fbde657fdde248af25fa2d0a82cf4af55f35baf375f45c284f3d8','Narrative changed despite preserve request');
console.table(report);console.log('PASS: 9 stories, 27 acts, all 119 story assets, valid action targets, pinyin alignment, unchanged stories.js, script syntax. For real model inference open scripts/check-hands.html.');
