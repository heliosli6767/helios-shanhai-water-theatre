(function(){
  'use strict';
  const $=id=>document.getElementById(id),esc=StageArt.escape,A=SHANHAI_ASSETS;
  const THEMES=[
    ['漆木飞檐','01-lacquer-pavilion',18,24,64,46],
    ['竹编水亭','02-bamboo-water-pavilion',22,28,56,41],
    ['月白石台','03-moonstone-water-shrine',24,26,51,40],
    ['彩灯庙台','04-festival-lantern-stage',19,31,62,43],
    ['玉石水门','05-jade-driftwood-arch',24,15,52,47]
  ];
  const GESTURES={pickup:'pinch',throw:'release',shoot:'release',aim:'pinch',fly:'raise',rise:'raise',ascend:'raise',run:'tap',approach:'sway',drink:'lower',bath:'lower',fall:'lower',transform:'open',grow:'raise',storm:'sway',rain:'lower',mist:'sway',phase:'turn',dance:'turn',music:'tap',command:'open',clear:'open',illuminate:'open',reveal:'open',victory:'lower'};
  const POWERS={
    A010:['拾起木石','pickup','投向水面','throw'],A011:['衔起木石','pickup','投石填海','throw'],A012:['汇聚潮水','rise','掀起海浪','storm'],
    A022:['举起木杖','command','跨山逐日','run'],A023:['聚起日光','illuminate','日轮升空','rise'],A024:['引来河水','rise','水脉奔流','storm'],
    A033:['击鼓号令','command','挥旗列阵','command'],A034:['聚起战意','command','召风布雨','rain'],A035:['蓄起水阵','rise','翻涌水势','storm'],A036:['凝聚神光','illuminate','止雨开天','clear'],A037:['聚起风势','rise','呼唤长风','storm'],A038:['召来雨云','mist','降下甘霖','rain'],A039:['擂响战鼓','music','鼓声列阵','command'],A040:['举起战旗','rise','挥旗助阵','command'],
    A051:['搭箭张弓','aim','松弦射箭','shoot'],A052:['举盾防御','command','迈步迎战','approach'],A053:['收拢羽翼','pickup','展翼归来','fly'],
    A065:['唤来双龙','command','奏响天乐','music'],A066:['云间盘旋','dance','乘云升空','ascend'],A067:['云间盘旋','dance','乘云升空','ascend'],A068:['拈起音符','pickup','奏响天乐','music'],A069:['起舞蓄势','command','随乐起舞','dance'],
    A081:['捧起太阳','pickup','甘渊浴日','bath'],A082:['收拢金翼','pickup','金乌展翼','fly'],A083:['汇聚日光','illuminate','日出东方','rise'],
    A092:['捧起月轮','pickup','水中浴月','bath'],A093:['凝聚月光','illuminate','月光升空','rise'],A094:['聚起星光','illuminate','飞过星空','fly'],
    A102:['展开九尾','reveal','唤起迷雾','mist'],A103:['握住护符','pickup','循声辨路','approach'],A104:['引出鸟鸣','music','飞向山口','fly'],
    A113:['引出清歌','music','振羽旋舞','dance'],A114:['展开彩羽','reveal','凤凰起舞','dance'],A115:['引颈听乐','command','踏水起舞','dance'],A116:['举掌击鼓','music','百兽共舞','dance'],A117:['张开鹤翼','reveal','白鹤飞舞','fly'],A118:['倾听乐声','command','踏水轻跃','dance']
  };
  function create({toast}){
    const host=$('play-stage'),world=document.querySelector('.theatre-world'),P=STORY_PERFORMANCE;
    const s={active:false,story:null,act:0,step:0,mode:'gesture',left:null,right:null,started:false,busy:false,epoch:0,auto:false,ended:false,weather:0,starting:false,entering:false,singleHand:null,retired:[],sound:true,error:''};
    const rings=[],positions={},keys=new Set();let propState={},waterFrame=0,lastFrame=0,timer=0,cueTimer=0,gate=null,phase='ready',theme=0,drag=null,audio=null,lastTone=0,lastAck=0,waterSize={w:0,h:0};
    const act=()=>STORY_SCENES[s.story.id][s.act],cue=()=>P.cue(s.story.id,s.act,s.step);
    const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sideName=side=>s.right?(side==='left'?'左手':'右手'):(s.singleHand==='left'?'左手':s.singleHand==='right'?'右手':'任意一只手');
    function stopCamera(){input.stop();document.querySelector('.camera-panel').hidden=true;s.starting=false;s.singleHand=null;}
    function slot(side){
      if(!['left','right'].includes(side))return null;
      if(s.right)return side;
      if(!s.singleHand)s.singleHand=side;
      return side===s.singleHand?'left':null;
    }
    const input=HandInput.create({
      video:$('hand-camera'),overlay:$('hand-landmarks'),
      onHands:hands=>{
        const missing=s.right?cue().requirements.map(r=>r.side).filter(side=>!hands.includes(side)):(!hands.length||(s.singleHand&&!hands.includes(s.singleHand)))?['left']:[];
        if(s.singleHand&&!hands.includes(s.singleHand))s.singleHand=null;
        if(missing.length&&gate){missing.forEach(side=>gate.lose(side));const meter=$('gesture-hold'),ack=$('gesture-ack');if(meter)meter.style.width='0%';if(ack&&phase==='ready')ack.textContent='请让'+(s.right?missing.map(side=>side==='left'?'左手':'右手').join('、'):'一只手')+'入镜';}
      },
      onFrame:(side,x,y)=>{const mapped=slot(side);if(mapped)place(mapped,.12+x*.76,.64+y*.3);},
      onGesture:()=>{},
      onPose:(side,pose,time)=>{
        if(!s.active||!s.started||s.mode!=='gesture'||s.busy||s.entering||s.ended||cue().automatic)return;
        const mapped=slot(side);if(!cue().requirements.some(r=>r.side===mapped)||!gate)return;
        const feedback=gate.update(mapped,pose,time),ack=$('gesture-ack'),meter=$('gesture-hold');
        if(feedback.reading)return;
        if(meter)meter.style.width=(feedback.progress*100)+'%';
        if(ack)ack.textContent=cue().requirements.length>1?(feedback.completed.length?'✓ '+feedback.completed.map(side=>side==='left'?'左手':'右手').join('、')+'完成 · 请完成另一只手':'双手配合 · 可依次完成'):feedback.progress?'保持手势 · '+Math.round(feedback.progress*100)+'%':'可以动作了 · '+(s.right?(mapped==='left'?'请用左手':'请用右手'):'任意一只手');
        if(feedback.accepted){tone(true);runAction();}
      },
      onStatus:message=>{$('camera-status').textContent=message;},
      onError:()=>{stopCamera();s.started=false;s.error='识别中断，请重新启动摄像头。';controls();guide();}
    });
    function prepareAudio(){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;if(!audio)audio=new Context();audio.resume().catch(()=>{});}
    function tone(accepted=true){
      if(!s.sound||!audio||audio.state!=='running'||performance.now()-lastTone<170)return;
      lastTone=performance.now();const now=audio.currentTime;
      [accepted?740:440,accepted?1110:660].forEach((hz,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(hz,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(accepted?.035:.015,now+.014+i*.02);g.gain.exponentialRampToValueAtTime(.0001,now+.17+i*.045);o.connect(g).connect(audio.destination);o.start(now);o.stop(now+.25);});
    }
    function cancel(){s.epoch++;s.auto=false;s.busy=false;s.entering=false;clearTimeout(timer);clearTimeout(cueTimer);gate=null;phase='ready';StageArt.cancel(host);keys.clear();}
    function armCue(){
      clearTimeout(cueTimer);gate=null;phase='ready';
      if(!s.started||s.mode!=='gesture'||s.entering||s.busy||s.ended||cue().automatic)return;
      phase='reading';gate=HandInput.createCueGroup(cue().requirements,{readyAt:performance.now()+1800});
      const token=s.epoch;cueTimer=setTimeout(()=>{if(token!==s.epoch||s.busy)return;phase='ready';guide();},1800);
    }
    function updateOpening(){
      const [, ,x,y,w,h]=THEMES[theme],r=world.getBoundingClientRect();if(!r.width||!r.height)return;
      const scale=Math.max(r.width/1672,r.height/941),dw=1672*scale,dh=941*scale;
      const values={x:((x/100*dw-(dw-r.width)/2)/r.width)*100,y:((y/100*dh-(dh-r.height)/2)/r.height)*100,w:w/100*dw/r.width*100,h:h/100*dh/r.height*100};
      for(const [key,value] of Object.entries(values))$('play-screen').style.setProperty('--opening-'+key,value+'%');
    }
    function setTheme(index){
      theme=index;const [name,file]=THEMES[index];$('play-screen').style.setProperty('--theatre-art','url("./assets/concepts/stage/'+file+'.png")');
      document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.theme===index)));
      try{localStorage.setItem('shanhai-water-theme',String(index));}catch(_){}
      world.setAttribute('aria-label',name+'水上戏台');updateOpening();
    }
    $('water-scene-options').innerHTML=THEMES.map(([name,file],i)=>'<button class="water-scene-choice" data-theme="'+i+'" aria-pressed="false"><img src="./assets/concepts/stage/'+file+'.png" alt="" loading="lazy"><span>'+name+'</span></button>').join('');
    $('water-scene-options').addEventListener('click',e=>{const b=e.target.closest('[data-theme]');if(b){setTheme(+b.dataset.theme);document.querySelector('.water-scenes').open=false;}});
    try{const saved=Number(localStorage.getItem('shanhai-water-theme'));if(Number.isInteger(saved)&&saved>=0&&saved<THEMES.length)theme=saved;}catch(_){}setTheme(theme);
    new ResizeObserver(updateOpening).observe(world);
    function owner(){return cue().driver===s.right?'right':'left';}
    function render(preserve=false){
      const previous={left:s.left,right:s.right},saved={...positions},roles=P.roles(s.story.id,s.act,s.step);
      s.left=roles.left;s.right=roles.right;
      const scene=act(),cast=P.cast(s.story.id,s.act,s.step,s.retired);
      StageArt.render(host,{...scene,cast},{index:s.act,mode:s.mode,interactive:s.mode==='button',left:s.mode==='auto'?null:s.left,right:s.mode==='auto'?null:s.right,chrome:false,propState});
      host.querySelectorAll('.scene-actors>.scene-actor').forEach((el,i)=>{
        const main=el.dataset.assetId===s.left||el.dataset.assetId===s.right;
        el.classList.toggle('is-extra',!main);
        const side=el.dataset.assetId===s.right?'right':'left',p=main&&preserve&&previous[side]===s[side]?saved[side]:null;
        el.style.left=(p?p.x*100:main?(side==='right'?65:s.right?35:45):20+(i%4)*18)+'%';
        el.style.bottom=(p?(1-p.y)*100:main?10:23)+'%';
        if(main)positions[side]={x:parseFloat(el.style.left)/100,y:1-parseFloat(el.style.bottom)/100};
        if(el.dataset.hand)el.dataset.sideLabel=sideName(side);
      });
      host.querySelectorAll('.is-prop').forEach((el,i)=>{el.style.left=(30+i*14)+'%';el.style.bottom=(6+(i%2)*3)+'%';});
      // A prop can be the final subject (e.g. Kuafu's abandoned staff becoming a forest).
      for(const side of ['left','right']){const el=host.querySelector('[data-asset-id="'+s[side]+'"].scene-actor');if(el&&s.mode!=='auto'){el.dataset.hand=side;if(!positions[side])positions[side]={x:parseFloat(el.style.left)/100,y:1-parseFloat(el.style.bottom)/100};}}
      $('play-title').textContent=s.story.title;
      document.querySelectorAll('[data-play-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.playMode===s.mode)));
      world.classList.toggle('is-awaiting',!s.started);
      s.weather=(s.story.id===1&&s.act===1)||(s.story.id===3&&s.act===1)?.65:0;
      armCue();controls();guide();updateOpening();
    }
    function progress(){const acts=STORY_SCENES[s.story.id];return {index:acts.slice(0,s.act).reduce((n,a)=>n+a.steps.length,0)+s.step,total:acts.reduce((n,a)=>n+a.steps.length,0)};}
    function controls(){
      let actions='';
      if(s.ended)actions='<button class="primary-button" data-restart>再启一卷</button>';
      else if(s.mode==='auto')actions='<button class="primary-button" data-auto>'+(s.auto?'暂停演绎':'继续演绎')+'</button>';
      else if(!s.started)actions='<button class="primary-button" data-start '+(s.starting?'disabled':'')+'>'+(s.starting?'正在连接…':s.mode==='gesture'?'开启摄像头 · 入戏':'启幕')+'</button>';
      else actions=(s.mode==='button'?'<button class="primary-button" data-action '+(s.busy||s.entering||cue().automatic?'disabled':'')+'>演出动作 · 空格</button>':'')+'<button class="secondary-button" data-pause>暂停</button>';
      $('play-stage-controls').innerHTML='<span class="stage-guidance" role="status">'+esc(s.error||(s.ended?'水上奇遇，至此谢幕。':s.started?cue().instruction:P.intros[s.story.id]))+'</span>'+actions+'<button class="secondary-button" data-sound aria-pressed="'+s.sound+'">'+(s.sound?'声效开':'声效关')+'</button>';
    }
    function guide(){
      const box=$('hand-guide'),c=cue();
      if(s.ended){if(box.dataset.contentKey!=='ended'){box.dataset.contentKey='ended';box.innerHTML='<div class="cue-action"><span>演绎完成</span><strong>这一卷，谢幕</strong></div><p class="cue-effect"><span>你会看到</span>山海故事在水面留下最后一圈涟漪。</p>';}return;}
      const automatic=s.mode==='auto'||c.automatic;
      const activeSide=owner(),hand=s.right?(activeSide==='left'?'左手':'右手'):'任意一只手';
      const action=automatic?'观看自动演绎':s.mode==='button'?'按空格键演出':hand+'｜'+c.gestureHint.replace(/^在预览框(?:中央|内)?/,'');
      const paired=s.mode==='gesture'&&!automatic&&!!s.right;
      const handRows=paired?['left','right'].map(side=>{const r=c.requirements.find(r=>r.side===side);return {side,label:(side==='left'?'左手':'右手')+' · '+A[s[side]].name,text:r?r.hint.replace(/^在预览框(?:中央|内)?/,''):'随手移动 · 等待配合'};}):[];
      const status=s.mode==='auto'&&!s.auto?'演绎已暂停':phase==='performing'?'✓ 正在'+c.label:phase==='result'?'✓ '+c.label+'已完成':s.entering?'角色入场中':'';
      const contentKey=JSON.stringify([action,handRows,c.effect,s.mode,automatic]);
      if(box.dataset.contentKey===contentKey){
        const ack=$('gesture-ack');if(ack&&ack.textContent!==status)ack.textContent=status;
        const label=box.querySelector('.cue-effect span');if(label)label.textContent=phase==='result'?'刚刚发生':'你会看到';
        return;
      }
      box.dataset.contentKey=contentKey;
      box.innerHTML=(paired?'<div class="cue-action cue-paired">'+handRows.map(r=>'<div class="cue-hand cue-hand-'+r.side+'"><span>'+esc(r.label)+'</span><strong>'+esc(r.text)+'</strong></div>').join('')+'</div>':'<div class="cue-action"><span>现在这样做</span><strong>'+esc(action)+'</strong></div>')+
        '<p class="cue-effect"><span>'+(phase==='result'?'刚刚发生':'你会看到')+'</span>'+esc(c.effect)+'</p>'+
        (s.mode==='gesture'&&!automatic?'<div class="gesture-hold-track" aria-hidden="true"><i id="gesture-hold"></i></div>':'')+'<p id="gesture-ack" class="gesture-ack" role="status">'+esc(status)+'</p>';
      box.classList.remove('cue-updated');void box.offsetWidth;box.classList.add('cue-updated');
    }
    async function start(){
      if(s.starting||!s.active)return;prepareAudio();s.error='';const token=s.epoch;
      if(s.mode==='gesture'){
        s.starting=true;controls();
        try{const ok=await input.start();if(!ok||token!==s.epoch||!s.active)return;document.querySelector('.camera-panel').hidden=false;}
        catch(error){if(token!==s.epoch)return;stopCamera();s.error=error.name==='NotAllowedError'?'请允许摄像头权限后重试，或使用按钮模式。':error.name==='NotFoundError'?'未找到摄像头，可先使用按钮模式。':'摄像头暂未连接，请重试。';controls();return;}
        finally{s.starting=false;}
      }
      if(token!==s.epoch)return;s.started=true;s.entering=true;render();entrance();
      timer=setTimeout(()=>{if(token!==s.epoch)return;s.entering=false;armCue();controls();guide();schedule();},reduced()?20:1800);
    }
    function entrance(){
      world.classList.add('is-awaiting');requestAnimationFrame(()=>requestAnimationFrame(()=>world.classList.remove('is-awaiting')));
      host.querySelectorAll('.scene-actors>.scene-actor').forEach(el=>{
        const x=parseFloat(el.style.left)/100,y=1-parseFloat(el.style.bottom)/100;
        el.animate([{opacity:0,translate:((.5-x)*world.clientWidth)+'px '+((.64-y)*world.clientHeight)+'px',scale:.25},{opacity:.7,offset:.45,scale:.65},{opacity:1,translate:'0 0',scale:1}],{duration:reduced()?1:1800,easing:'cubic-bezier(.2,.7,.2,1)'});
        ripple(x,y,.7);
      });
    }
    function ripple(x,y,strength=.4){rings.push({x,y,birth:performance.now(),strength});if(rings.length>42)rings.shift();StageArt.ripple(host,x,y,strength);}
    function place(side,x,y){
      if(!s.active||!s.started||s.mode==='auto'||s.ended||s.entering||s.busy||!s[side]||!Number.isFinite(x)||!Number.isFinite(y))return false;
      const actor=host.querySelector('.scene-actor[data-hand="'+side+'"]');if(!actor)return false;
      x=Math.max(.13,Math.min(.87,x));y=Math.max(.62,Math.min(.95,y));const prior=positions[side]||{x,y};
      actor.style.left=x*100+'%';actor.style.bottom=(1-y)*100+'%';positions[side]={x,y};
      const now=performance.now();if(Math.hypot(x-prior.x,y-prior.y)>.003&&now-(prior.ripple||0)>120){ripple(x,Math.max(.76,y),Math.min(1,.2+Math.hypot(x-prior.x,y-prior.y)*8));positions[side].ripple=now;}else positions[side].ripple=prior.ripple;
      return true;
    }
    function schedule(){
      clearTimeout(timer);if(!s.active||!s.started||s.busy||s.entering||s.ended)return;
      if((s.mode==='auto'&&s.auto)||(s.mode!=='auto'&&cue().automatic)){const token=s.epoch;timer=setTimeout(()=>{if(token===s.epoch)runAction();},s.mode==='auto'?1300:1800);}
    }
    async function runAction(){
      if(!s.active||!s.started||s.busy||s.ended||s.entering)return false;
      const token=s.epoch,action=cue();s.busy=true;phase='performing';clearTimeout(cueTimer);gate=null;controls();guide();
      if(['storm','rain'].includes(action.motion))s.weather=1;if(['clear','illuminate'].includes(action.motion))s.weather=0;
      const actor=host.querySelector('.scene-actor[data-asset-id="'+action.focus+'"]');
      ripple(actor?parseFloat(actor.style.left)/100:.5,actor?Math.max(.76,1-parseFloat(actor.style.bottom)/100):.86,['throw','storm','fall','rain'].includes(action.motion)?1:.45);
      if(s.story.id===1&&action.motion==='transform')await StageArt.morph(host,'A010','A011');
      else if(action.requirements.length>1)await Promise.all([...action.requirements,...action.ensemble].map(r=>StageArt.animate(host,{...action,...r,solo:true})));
      else await StageArt.animate(host,action);
      if(token!==s.epoch)return false;
      phase='result';guide();await new Promise(resolve=>setTimeout(resolve,1400));
      if(token!==s.epoch)return false;
      if(['fall','victory','transform'].includes(action.motion))s.retired.push(action.focus);
      s.busy=false;const previousAct=s.act;
      if(s.step<act().steps.length-1)s.step++;
      else if(s.act<2){s.act++;s.step=0;}
      else{s.ended=true;s.auto=false;stopCamera();controls();guide();return true;}
      render(s.act===previousAct);
      if(s.act!==previousAct){host.querySelector('.scene-background')?.animate([{opacity:.3},{opacity:1}],{duration:reduced()?1:1000});}
      schedule();return true;
    }
    function ability(side,kind='release'){
      if(!s.active||!s.started||s.busy||s.entering||s.ended||s.mode==='auto'||cue().automatic||(s.mode==='gesture'&&phase==='reading'))return false;
      if(side!==owner()||kind!==cue().gesture||(s.mode==='gesture'&&cue().requirements.length>1))return false;
      runAction();return true;
    }
    function toggleAuto(){
      prepareAudio();if(s.auto){cancel();render(true);return;}
      if(s.ended)reset();const first=!s.started;s.started=true;s.auto=true;s.entering=first;world.classList.remove('is-awaiting');controls();
      guide();if(first){entrance();const token=s.epoch;timer=setTimeout(()=>{if(token!==s.epoch)return;s.entering=false;controls();guide();schedule();},reduced()?1:1800);}else schedule();
    }
    function reset(){cancel();stopCamera();propState={};s.act=0;s.step=0;s.retired=[];s.started=false;s.ended=false;s.error='';s.singleHand=null;render();}
    function setMode(mode){if(!['gesture','button','auto'].includes(mode)||!s.active)return;if(s.mode===mode){if(mode==='auto'&&!s.auto)toggleAuto();return;}s.mode=mode;reset();if(mode==='auto')toggleAuto();}
    document.querySelectorAll('[data-play-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.playMode)));
    $('play-stage-controls').addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b||b.disabled)return;
      if(b.hasAttribute('data-start'))start();
      if(b.hasAttribute('data-action')){prepareAudio();if(!s.busy){tone(true);runAction();}}
      if(b.hasAttribute('data-auto'))toggleAuto();
      if(b.hasAttribute('data-restart')){reset();if(s.mode==='auto')toggleAuto();}
      if(b.hasAttribute('data-pause')){cancel();stopCamera();s.started=false;controls();guide();}
      if(b.hasAttribute('data-sound')){s.sound=!s.sound;prepareAudio();controls();}
    });
    $('stop-camera').addEventListener('click',()=>{cancel();stopCamera();s.started=false;controls();guide();});
    $('swap-hands').addEventListener('click',()=>{s.singleHand=null;gate?.lose();toast(input.swap()?'已切换反向校准，请举起左手核对标签。':'已恢复默认镜像校正，请举起左手核对标签。');});
    host.addEventListener('pointerdown',e=>{if(s.mode!=='button'||!s.started||s.busy)return;const el=e.target.closest('[data-hand]');if(el){drag={side:el.dataset.hand,id:e.pointerId};el.setPointerCapture(e.pointerId);e.preventDefault();}});
    host.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;const r=host.getBoundingClientRect();place(drag.side,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])host.addEventListener(type,()=>drag=null);
    document.addEventListener('keydown',e=>{
      if(!s.active||s.mode!=='button'||!s.started||s.ended||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable||e.metaKey||e.ctrlKey||e.altKey)return;
      const key=e.key.toLowerCase();if(!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','q','e','j','l',' '].includes(key))return;
      e.preventDefault();keys.add(key);if(e.repeat)return;
      const right=s.right?'right':'left',directions={w:['left',0,-1],s:['left',0,1],a:['left',-1,0],d:['left',1,0],arrowup:[right,0,-1],arrowdown:[right,0,1],arrowleft:[right,-1,0],arrowright:[right,1,0]};
      if(directions[key]){const [side,x,y]=directions[key],p=positions[side];if(p)place(side,p.x+x*.018,p.y+y*.018);}
      if(key===' '&&!s.busy&&!s.entering&&!cue().automatic){prepareAudio();tone(true);runAction();}
      if(['q','e','j','l'].includes(key)){const side=['q','e'].includes(key)?'left':right,kind=['q','j'].includes(key)?'pinch':'release';prepareAudio();tone(ability(side,kind));}
    });
    document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&s.active){cancel();stopCamera();s.started=false;controls();guide();}});
    window.addEventListener('pagehide',()=>{stopCamera();cancelAnimationFrame(waterFrame);});
    function water(time){
      if(!s.active)return;const dt=Math.min(40,time-(lastFrame||time));lastFrame=time;
      if(s.mode==='button'&&s.started&&!s.busy){
        const right=s.right?'right':'left',moves={left:[Number(keys.has('d'))-Number(keys.has('a')),Number(keys.has('s'))-Number(keys.has('w'))]};
        const arrows=[Number(keys.has('arrowright'))-Number(keys.has('arrowleft')),Number(keys.has('arrowdown'))-Number(keys.has('arrowup'))];
        if(right==='left'){moves.left[0]+=arrows[0];moves.left[1]+=arrows[1];}else moves.right=arrows;
        for(const [side,[x,y]] of Object.entries(moves)){const p=positions[side];if(p&&(x||y))place(side,p.x+x*dt*.00035,p.y+y*dt*.0003);}
      }
      if(lastAck&&time-lastAck>1500){const ack=$('gesture-ack');if(ack)ack.textContent='';lastAck=0;}
      const canvas=$('theatre-water'),ctx=canvas.getContext('2d'),r=world.getBoundingClientRect(),ratio=Math.min(2,devicePixelRatio||1);
      if(waterSize.w!==r.width||waterSize.h!==r.height){waterSize={w:r.width,h:r.height};canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);}
      ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,r.width,r.height);const motionScale=reduced()?.08:1;
      for(let i=0;i<rings.length;i++){const ring=rings[i],age=(time-ring.birth)/2100;if(age>1){rings.splice(i--,1);continue;}const rx=(12+age*180)*ring.strength*motionScale;ctx.strokeStyle='rgba(221,249,249,'+((1-age)*.7)+')';ctx.lineWidth=1.5;for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(ring.x*r.width,ring.y*r.height+j*5,rx+j*10,rx*.18+j*2,0,0,Math.PI*2);ctx.stroke();}}
      if(s.started)for(let row=0;row<11;row++){const y=r.height*(.73+row*.025);ctx.beginPath();for(let x=0;x<=r.width;x+=10){const amp=(1+s.weather*15)*(row+2)/8*motionScale,yy=y+Math.sin(x/70-time*(.001+s.weather*.003)+row)*amp+Math.sin(x/143+time*.0012)*amp*.5;x?ctx.lineTo(x,yy):ctx.moveTo(x,yy);}ctx.strokeStyle='rgba(208,245,255,'+(.045+s.weather*.23)+')';ctx.lineWidth=1+s.weather*2;ctx.stroke();}
      waterFrame=requestAnimationFrame(water);
    }
    return {
      open(story){cancel();stopCamera();s.active=true;s.story=story;s.mode='gesture';reset();cancelAnimationFrame(waterFrame);lastFrame=0;waterFrame=requestAnimationFrame(water);},
      close(){cancel();stopCamera();s.active=false;s.started=false;cancelAnimationFrame(waterFrame);rings.length=0;document.querySelector('.water-scenes').open=false;},
      position:(side,x,y)=>place(s.right?side:'left',x,y),ability,
      snapshot:()=>({act:s.act+1,step:s.step+1,mode:s.mode,busy:s.busy,done:s.ended,started:s.started,auto:s.auto,left:s.left,right:s.right,handCount:s.right?2:1,theme:THEMES[theme][0],camera:input.active})
    };
  }
  window.WaterTheatre={create,POWERS,GESTURES};
})();
