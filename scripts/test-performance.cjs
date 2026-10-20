const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),c={window:{}};vm.createContext(c);
for(const f of ['stories.js','scene-data.js','asset-map.js']){vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);Object.assign(c,c.window);}
vm.runInContext(fs.readFileSync(path.join(root,'performance-data.js'),'utf8'),c);
const P=c.window.STORY_PERFORMANCE;
let count=0;
for(const story of c.STORIES){
  const retired=[];
  c.STORY_SCENES[story.id].forEach((act,i)=>act.steps.forEach((step,j)=>{
    const cue=P.cue(story.id,i,j),roles=P.roles(story.id,i,j),cast=P.cast(story.id,i,j,retired);
    assert(cue.effect?.length>5&&cue.effect.length<65,`Missing concise effect: ${story.title} ${i}:${j}`);
    assert(cue.gestureHint?.includes('预览框'),`Missing camera-relative instruction: ${story.title} ${i}:${j}`);
    assert(cue.gesture&&cue.gestureHint.includes('一秒'));
    assert(c.SHANHAI_ASSETS[cue.driver],`Missing driver: ${story.title} ${i}:${j}`);
    assert([roles.left,roles.right].includes(cue.driver),`Action owner not controllable: ${story.title} ${i}:${j}`);
    if(!cue.automatic)assert([...cast,...act.props].includes(cue.driver),`Driver invisible: ${story.title} ${i}:${j}`);
    assert(!cast.some(id=>retired.includes(id)),'Retired actor returned');
    if(story.id===1){assert.equal(roles.right,null);assert(!(cast.includes('A010')&&cast.includes('A011')));assert.equal(cast.includes('A011'),i===2);}
    if(['fall','victory','transform'].includes(step.motion))retired.push(step.focus);
    count++;
  }));
}
vm.runInContext(fs.readFileSync(path.join(root,'hand-input.js'),'utf8'),c);
const H=c.window.HandInput,calls={lines:0,points:0};
const ctx={clearRect(){},beginPath(){},moveTo(){},lineTo(){calls.lines++;},stroke(){},arc(){calls.points++;},fill(){},fillText(){}};
const canvas={dataset:{},getContext(){return ctx;}},points=Array.from({length:21},(_,i)=>({x:i/21,y:i/21}));
H.drawSkeleton(canvas,{landmarks:[points,points],handedness:[[{categoryName:'Left'}],[{categoryName:'Right'}]]});
assert.equal(calls.lines,42);assert.equal(calls.points,42);assert.equal(canvas.dataset.hands,'2');
H.drawSkeleton(canvas,{landmarks:[],handedness:[]});assert.equal(canvas.dataset.hands,'0');
assert.equal(H.anatomicalSide('Right'),'left');assert.equal(H.anatomicalSide('Left'),'right');
assert.equal(H.anatomicalSide('Right',true),'right');assert.equal(H.anatomicalSide('unknown'),null);
const pose=(x=.5,y=.5,open=true,pinch=false)=>({palm:{x,y},open,pinch});
let gate=H.createCueGate('open',{readyAt:1800}),result;
for(let t=0;t<1800;t+=100)assert(!gate.update(pose(),t).accepted,'Reading time must not trigger');
for(let t=1800;t<=2500;t+=100)result=gate.update(pose(),t);
assert(result.accepted,'An already-open hand must trigger after holding, without requiring a new edge');
assert(!gate.update(pose(),2600).accepted,'One hold must not repeat');
gate=H.createCueGate('open',{});for(let t=0;t<800;t+=100)assert(!gate.update(pose(.02),t).accepted,'Open must be in central target');
gate=H.createCueGate('release',{});for(let t=0;t<1000;t+=100)assert(!gate.update(pose(),t).accepted,'Release must first be prepared by pinching');
for(let t=1000;t<=1400;t+=100)gate.update(pose(.5,.5,false,true),t);
for(let t=1500;t<=2200;t+=100)result=gate.update(pose(),t);assert(result.accepted,'Prepared release should work');
for(const [kind,endY] of [['raise',.2],['lower',.85]]){
  gate=H.createCueGate(kind,{});for(let t=0;t<900;t+=100)assert(!gate.update(pose(.5,endY),t).accepted,'Must start at middle');
  gate.update(pose(),1000);for(let t=1100;t<=1800;t+=100)result=gate.update(pose(.5,endY),t);assert(result.accepted,kind);
}
gate=H.createCueGate('pinch',{});for(let t=0;t<=400;t+=100)gate.update(pose(.5,.5,false,true),t);
gate.lose();for(let t=500;t<1200;t+=100)assert(!gate.update(pose(.5,.5,false,true),t).accepted,'Tracking loss resets accumulated hold');
assert(gate.update(pose(.5,.5,false,true),1200).accepted);
gate=H.createCueGate('sway',{});gate.update(pose(.4),0);for(let t=100;t<=800;t+=100)result=gate.update(pose(.65),t);assert(result.accepted);
const dualStories=c.STORIES.filter(story=>c.STORY_SCENES[story.id].some((act,i)=>P.roles(story.id,i,0).right)).map(story=>story.id);
assert.deepEqual(Array.from(dualStories),[2,3,8],'Exactly three stories use both hands');
for(const [id,act,step] of [[2,0,1],[3,1,1],[8,1,0],[8,2,1]]){
  const cue=P.cue(id,act,step),roles=P.roles(id,act,step);
  assert.equal(cue.requirements.length,2);for(const r of cue.requirements){assert.equal(r.focus,roles[r.side]);assert(r.hint.includes('一秒'));}
}
gate=H.createCueGate('tap',{});gate.update(pose(),0);
gate.update(pose(.5,.65),100);gate.update(pose(),200);
for(let t=300;t<=1000;t+=100)assert(!gate.update(pose(),t).accepted,'One beat is not two beats');
for(let t=1100;t<=1800;t+=100)result=gate.update(pose(.5,.65),t);assert(result.accepted,'Two palm beats should trigger');
gate=H.createCueGate('turn',{});gate.update({...pose(),angle:0},0);
for(let t=100;t<=800;t+=100)result=gate.update({...pose(),angle:.55},t);assert(result.accepted,'Wrist tilt should trigger');
let group=H.createCueGroup([{side:'left',gesture:'open'},{side:'right',gesture:'open'}]);
for(let t=0;t<=700;t+=100)result=group.update('left',pose(),t);assert(!result.accepted,'One hand cannot complete a paired cue');assert.equal(result.completed[0],'left');
for(let t=800;t<=1500;t+=100)result=group.update('right',pose(),t);assert(result.accepted,'Both hands must complete');
assert(!group.update('right',pose(),1600).accepted,'Paired cue fires once');
group=H.createCueGroup([{side:'left',gesture:'open'},{side:'right',gesture:'open'}]);
for(let t=0;t<=700;t+=100)group.update('left',pose(),t);group.lose('left');
for(let t=800;t<=1500;t+=100)result=group.update('right',pose(),t);assert(!result.accepted,'Lost left hand must not stay completed');
group=H.createCueGroup([{side:'left',gesture:'open'},{side:'right',gesture:'open'}]);
for(let t=0;t<=700;t+=100)group.update('left',pose(),t);
for(let t=5300;t<=6000;t+=100)result=group.update('right',pose(),t);assert(!result.accepted,'Old hand completion expires');
console.log(`PASS: ${count} cues; chronological casting; exactly three dual-hand stories; two-hand cooperation, loss and timeout; tap and wrist tilt; anatomical labels; skeleton; stable holds and reading delay.`);
// Exercise the actual guide renderer with a tiny DOM double: status-only updates
// must preserve its markup and must not restart the attention animation.
const source=fs.readFileSync(path.join(root,'theatre.js'),'utf8');
const guideSource=source.slice(source.indexOf('    function guide(){'),source.indexOf('    async function start(){'));
let writes=0,animations=0;const ack={textContent:''},label={textContent:''};
const box={dataset:{},offsetWidth:1,classList:{remove(){},add(){animations++;}},querySelector(){return label;},set innerHTML(value){writes++;this.html=value;}};
const gc={s:{mode:'gesture',right:null,ended:false},phase:'reading',cue:()=>P.cue(1,0,0),owner:()=> 'left',esc:x=>String(x),A:c.SHANHAI_ASSETS,$:id=>id==='hand-guide'?box:ack};
vm.createContext(gc);vm.runInContext(guideSource+';guide();',gc);
for(const phase of ['ready','performing','result','ready']){gc.phase=phase;vm.runInContext('guide()',gc);}
assert.equal(writes,1,'Unchanged instructions must preserve DOM');assert.equal(animations,1,'Status changes must not flash');
gc.cue=()=>P.cue(1,0,1);vm.runInContext('guide()',gc);assert.equal(writes,2);assert.equal(animations,2);
gc.s.right='A023';gc.s.left='A022';gc.cue=()=>P.cue(2,0,1);vm.runInContext('guide()',gc);
assert(box.html.includes('左手 · 夸父')&&box.html.includes('右手 · 太阳神灵'),'Both hand roles must be visible');
console.log('PASS: unchanged guide content keeps its DOM and animation; paired role instructions are explicit.');
