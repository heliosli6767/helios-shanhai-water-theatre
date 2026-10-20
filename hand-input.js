/* MediaPipe Hands, served locally. Camera is opened only by the Start button. */
(function(){
  'use strict';
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  // The inference input is horizontally mirrored. Convert its handedness once,
  // everywhere (labels, ownership, callbacks). Manual calibration is an override.
  function anatomicalSide(label,swapped=false){
    const side=String(label).toLowerCase();if(!['left','right'].includes(side))return null;
    return swapped?side:(side==='left'?'right':'left');
  }
  // A cue is deliberate: reading time, then a stable pose; no edge-only open event.
  function createCueGate(kind,{readyAt=0,holdMs=700}={}){
    let last=null,since=null,centered=false,anchor=null,prepared=false,pinchSince=null,done=false,taps=0,tapDown=false,anchorAngle=null;
    function lose(){last=null;since=null;centered=false;anchor=null;prepared=false;pinchSince=null;taps=0;tapDown=false;anchorAngle=null;}
    function update(pose,time){
      if(done)return {accepted:false,progress:1};
      if(time<readyAt){lose();return {accepted:false,progress:0,reading:true};}
      if(!pose){lose();return {accepted:false,progress:0};}
      if(last!==null&&time-last>250)lose();last=time;
      const {palm,open,pinch}=pose,central=palm.x>.15&&palm.x<.85&&palm.y>=.34&&palm.y<=.68;
      if(central)centered=true;
      if(!anchor)anchor={...palm};
      if(Number.isFinite(pose.angle)&&anchorAngle===null)anchorAngle=pose.angle;
      if(kind==='tap'&&open&&!pinch){if(!tapDown&&palm.y-anchor.y>.10){taps++;tapDown=true;}else if(tapDown&&palm.y-anchor.y<.035)tapDown=false;}
      if(kind==='release'&&pinch){if(pinchSince===null)pinchSince=time;if(time-pinchSince>=250)prepared=true;}else pinchSince=null;
      const matched=kind==='open'?central&&open&&!pinch:kind==='pinch'?pinch:
        kind==='release'?prepared&&open&&!pinch:kind==='raise'?centered&&palm.y<.33:
        kind==='lower'?centered&&palm.y>.72:kind==='sway'?open&&!pinch&&Math.abs(palm.x-anchor.x)>.15:
        kind==='tap'?open&&!pinch&&taps>=2:kind==='turn'?open&&!pinch&&anchorAngle!==null&&Math.abs(Math.atan2(Math.sin(pose.angle-anchorAngle),Math.cos(pose.angle-anchorAngle)))>.42:false;
      if(!matched){since=null;return {accepted:false,progress:0};}
      if(since===null)since=time;
      const progress=Math.min(1,(time-since)/holdMs);if(progress===1)done=true;
      return {accepted:done,progress};
    }
    return {update,lose};
  }
  function createCueGroup(requirements,options={}){
    const gates=new Map(requirements.map(r=>[r.side,createCueGate(r.gesture,options)]));
    const complete=new Map(),progress=new Map();let done=false;
    function lose(side){for(const r of requirements)if(!side||r.side===side){gates.set(r.side,createCueGate(r.gesture,options));complete.delete(r.side);progress.delete(r.side);}}
    function update(side,pose,time){
      if(done||!gates.has(side))return {accepted:false,progress:0,completed:[]};
      for(const [s,t] of complete)if(time-t>4500)lose(s);
      let result={reading:time<(options.readyAt||0)};
      if(!complete.has(side)){result=gates.get(side).update(pose,time);progress.set(side,result.progress);if(result.accepted)complete.set(side,time);}
      done=complete.size===requirements.length;
      return {accepted:done,reading:result.reading,progress:requirements.reduce((n,r)=>n+(progress.get(r.side)||0),0)/requirements.length,completed:[...complete.keys()]};
    }
    return {update,lose};
  }
  function classify(points,previous={},time=0){
    const scale=Math.max(.025,distance(points[0],points[9]));
    const ratio=distance(points[4],points[8])/scale;
    const pinch=ratio<(previous.pinch?.53:.38);
    const palm={x:(points[0].x+points[5].x+points[17].x)/3,y:(points[0].y+points[5].y+points[17].y)/3};
    const open=[8,12,16,20].filter(i=>distance(points[i],points[0])>distance(points[i-2],points[0])*1.2).length>=3;
    let kind=null;
    if(previous.time&&time-previous.time<250){
      if(pinch&&!previous.pinch)kind='pinch';
      else if(!pinch&&previous.pinch)kind='release';
      else if(palm.y<.34&&(previous.palm?.y??0)>=.34)kind='raise';
      else if(palm.y>.72&&(previous.palm?.y??1)<=.72)kind='lower';
      else if(open&&!previous.open)kind='open';
      else if(open&&previous.anchor&&Math.abs(palm.x-previous.anchor.x)>.13)kind='sway';
    }
    return {pinch,palm,open,time,kind,angle:Math.atan2(points[9].x-points[0].x,points[0].y-points[9].y),anchor:kind==='sway'||!previous.anchor?palm:previous.anchor};
  }
  const CONNECTIONS=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
  function drawSkeleton(canvas,result,swapped=false){
    if(!canvas)return;
    canvas.width=640;canvas.height=480;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,640,480);
    canvas.dataset.hands=String(result.landmarks.length);
    result.landmarks.forEach((points,i)=>{
      const side=anatomicalSide(result.handedness[i]?.[0]?.categoryName,swapped);if(!side)return;
      const color=side==='left'?'#ffe2a0':'#91fff0';ctx.strokeStyle=color;ctx.lineWidth=4;ctx.shadowColor='#072640';ctx.shadowBlur=5;
      for(const [a,b] of CONNECTIONS){ctx.beginPath();ctx.moveTo(points[a].x*640,points[a].y*480);ctx.lineTo(points[b].x*640,points[b].y*480);ctx.stroke();}
      points.forEach((p,k)=>{ctx.beginPath();ctx.arc(p.x*640,p.y*480,[4,8,12,16,20].includes(k)?7:5,0,Math.PI*2);ctx.fillStyle=[4,8,12,16,20].includes(k)?'#ffffff':color;ctx.fill();});
      ctx.fillStyle='#fff';ctx.font='bold 22px sans-serif';ctx.fillText(side==='left'?'左手':'右手',Math.max(5,Math.min(570,points[0].x*640)),Math.max(27,points[0].y*480-15));
    });
  }
  function create({video,overlay=null,onHands=()=>{},onPose=()=>{},onFrame,onGesture,onStatus,onError}){
    let detector=null,modelPromise=null,stream=null,raf=0,epoch=0,lastTime=-1,lastRun=0,history={},cooldown={},swapped=false;
    const mirrored=document.createElement('canvas');mirrored.width=640;mirrored.height=480;
    const context=mirrored.getContext('2d',{alpha:false});
    async function load(){
      if(!modelPromise)modelPromise=(async()=>{
        const {FilesetResolver,HandLandmarker}=await import('./assets/mediapipe/vision_bundle.mjs');
        const files=await FilesetResolver.forVisionTasks('./assets/mediapipe/wasm');
        detector=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'./assets/mediapipe/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.6,minHandPresenceConfidence:.6,minTrackingConfidence:.6});
        return detector;
      })().catch(error=>{modelPromise=null;throw error;});
      return modelPromise;
    }
    function stop(){epoch++;cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;history={};cooldown={};lastTime=-1;drawSkeleton(overlay,{landmarks:[],handedness:[]});onHands([]);onStatus('摄像头已关闭');}
    async function start(){
      stop();const token=epoch;
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('此浏览器无法访问摄像头，请在 localhost 或 HTTPS 页面打开。');
      onStatus('正在加载手势识别…');
      await load();if(token!==epoch)return false;
      onStatus('请允许摄像头访问');
      const candidate=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
      if(token!==epoch){candidate.getTracks().forEach(t=>t.stop());return false;}
      stream=candidate;video.srcObject=stream;
      try{await video.play();}catch(error){stop();throw error;}
      if(token!==epoch)return false;
      const loop=time=>{
        if(token!==epoch)return;
        if(time-lastRun>65&&video.readyState>=2&&video.currentTime!==lastTime){
          lastRun=time;lastTime=video.currentTime;
          context.setTransform(-1,0,0,1,640,0);context.drawImage(video,0,0,640,480);context.resetTransform();
          try{
            const result=detector.detectForVideo(mirrored,time);const present=[];
            drawSkeleton(overlay,result,swapped);
            onHands(result.handedness.filter(a=>(a[0]?.score||0)>=.65).map(a=>anatomicalSide(a[0].categoryName,swapped)).filter(Boolean));
            result.landmarks.forEach((points,i)=>{
              if((result.handedness[i]?.[0]?.score||0)<.65)return;
              const side=anatomicalSide(result.handedness[i][0].categoryName,swapped);if(!side)return;
              const info=classify(points,history[side],time);history[side]=info;present.push(side);
              onFrame(side,info.palm.x,info.palm.y);
              onPose(side,info,time);
              if(info.kind&&time-(cooldown[side]||0)>450){cooldown[side]=time;onGesture(side,info.kind);}
            });
            for(const side of ['left','right'])if(!present.includes(side))delete history[side];
            onStatus(present.length?present.map(s=>s==='left'?'左手':'右手').join(' · ')+' 已识别':'把手完整放入这个摄像头预览框');
          }catch(error){stop();onError(error);return;}
        }
        raf=requestAnimationFrame(loop);
      };raf=requestAnimationFrame(loop);return true;
    }
    return {start,stop,load,swap(){swapped=!swapped;history={};return swapped;},get active(){return !!stream;}};
  }
  window.HandInput={create,classify,drawSkeleton,CONNECTIONS,anatomicalSide,createCueGate,createCueGroup};
})();
