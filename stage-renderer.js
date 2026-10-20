/* Layered illustrated water puppets. Original images stay intact in the library.
 * This is a 2.5D compositor, not a claim that the PNGs are rigged 3D models. */
(function(){
  'use strict';
  const assets=window.SHANHAI_ASSETS, cache=new Map();
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function cutout(id){
    if(cache.has(id))return cache.get(id);
    const promise=new Promise((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>{
        const canvas=document.createElement('canvas');
        const scale=Math.min(1,540/Math.max(image.width,image.height));
        const w=canvas.width=Math.round(image.width*scale),h=canvas.height=Math.round(image.height*scale);
        const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,w,h);
        // Remove only border-connected studio backdrop. Bright plumage is retained.
        // Keep this reversible: no source image is overwritten or exported.
        try{
          const frame=ctx.getImageData(0,0,w,h),d=frame.data;
          // Honor authored alpha; never run colour-key removal on a real cutout.
          let nativeAlpha=!!assets[id].transparent;
          for(let i=3;i<d.length&&!nativeAlpha;i+=4)if(d[i]<240)nativeAlpha=true;
          if(nativeAlpha){resolve(canvas);return;}
          const samples=[];
          for(const [x,y] of [[.02,.02],[.98,.02],[.02,.5],[.98,.5],[.02,.98],[.98,.98]]){
            const p=(Math.floor(y*h)*w+Math.floor(x*w))*4;
            samples.push([d[p],d[p+1],d[p+2]]);
          }
          const visited=new Uint8Array(w*h),removed=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
          const eligible=i=>{
            const p=i*4,r=d[p],g=d[p+1],b=d[p+2];
            if(d[p+3]<20)return true;
            return samples.some(s=>{
              const lum=(r+g+b-s[0]-s[1]-s[2])/3;
              return Math.abs(lum)<32&&Math.abs((r-g)-(s[0]-s[1]))<8&&Math.abs((g-b)-(s[1]-s[2]))<8;
            });
          };
          // Texture and silhouette edges are barriers: matching grey is not enough
          // to erase cloth, bronze or stone. Only smooth exterior background floods.
          const edge=i=>{const x=i%w,y=Math.floor(i/w);if(x<1||x>=w-1||y<1||y>=h-1)return false;let spread=0;for(let c=0;c<3;c++){const values=[d[(i-1)*4+c],d[(i+1)*4+c],d[(i-w)*4+c],d[(i+w)*4+c]];spread+=Math.max(...values)-Math.min(...values);}return spread>62;};
          const visit=i=>{if(i<0||i>=w*h||visited[i])return;visited[i]=1;if(eligible(i)&&!edge(i)){removed[i]=1;queue[tail++]=i;}};
          for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}
          for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}
          while(head<tail){const i=queue[head++];if(i%w)visit(i-1);if(i%w<w-1)visit(i+1);visit(i-w);visit(i+w);}
          // Close small breaks between textured parts of one solid silhouette.
          // This affects the display matte only, never the archived source image.
          const repair=new Uint8Array(w*h),gap=Math.round(w*.12);
          for(let y=0;y<h;y++){let start=-1;for(let x=0;x<w;x++){const i=y*w+x;if(!removed[i]){if(start>=0&&x-start<=gap)for(let k=start;k<x;k++)repair[y*w+k]=1;start=x+1;}}}
          for(let i=0;i<repair.length;i++)if(repair[i])removed[i]=0;
          for(let i=0;i<w*h;i++){
            if(removed[i])d[i*4+3]=0;
            else{
              let n=0;for(const q of [i-1,i+1,i-w,i+w])if(q>=0&&q<w*h&&removed[q])n++;
              if(n)d[i*4+3]=Math.round(d[i*4+3]*(1-Math.min(n,2)*.09));
            }
          }
          ctx.putImageData(frame,0,0);
        }catch(_){ /* file:// may taint canvas; the source image is still usable. */ }
        resolve(canvas);
      };
      image.onerror=()=>{cache.delete(id);reject(new Error('素材未载入：'+assets[id].name));};
      image.src=assets[id].src;
    });cache.set(id,promise);return promise;
  }
  async function sprite(id,canvas,variant=null){
    try{const source=await cutout(id),v=window.PuppetRig?.variants[variant];
      if(v){const [x,y,w,h]=v.crop;canvas.width=Math.round(source.width*w);canvas.height=Math.round(source.height*h);const ctx=canvas.getContext('2d');ctx.beginPath();v.outline.forEach(([px,py],i)=>i?ctx.lineTo(px*canvas.width,py*canvas.height):ctx.moveTo(px*canvas.width,py*canvas.height));ctx.closePath();ctx.clip();ctx.drawImage(source,x*source.width,y*source.height,w*source.width,h*source.height,0,0,canvas.width,canvas.height);}
      else{canvas.width=source.width;canvas.height=source.height;canvas.getContext('2d').drawImage(source,0,0);}canvas.dataset.ready='true';}
    catch(e){canvas.dataset.ready='error';canvas.setAttribute('aria-label',e.message);}
  }
  function layer(id,type,x,bottom){
    const asset=assets[id],el=document.createElement('div');el.className='scene-actor'+(type?' '+type:'');
    el.dataset.assetId=id;el.style.left=x+'%';el.style.bottom=bottom+'%';
    el.setAttribute('role','img');el.setAttribute('aria-label',asset.name);
    const body=document.createElement('div');body.className='puppet-body';const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');body.append(canvas);el.append(body);el._spriteReady=sprite(id,canvas);return el;
  }
  const actor=(host,id)=>host.querySelector('.scene-actor[data-asset-id="'+id+'"]');
  const body=el=>el?.querySelector(':scope > .puppet-body');
  function fitted(el){const c=body(el)?.querySelector(':scope > canvas');return window.PuppetRig.fit(el.clientWidth,el.clientHeight,c?.width||1,c?.height||1);}
  function mountLayout(el,owner,binding){
    const p=window.PuppetRig.point(fitted(owner),binding),c=body(el).querySelector(':scope > canvas');
    Object.assign(el.style,{left:p.x+'px',top:p.y+'px',width:p.width+'px',height:p.width*c.height/c.width+'px',bottom:'auto'});
    body(el).style.rotate=(binding.angle||0)+'deg';
    body(el).style.scale=binding.flip?'-1 1':'1';
    const fit=fitted(owner);body(owner).querySelectorAll(':scope > .hand-occlusion').forEach(hand=>Object.assign(hand.style,{left:fit.x+'px',top:fit.y+'px',width:fit.width+'px',height:fit.height+'px'}));
  }
  async function attach(host,id,binding,travel=false){
    const el=actor(host,id),owner=actor(host,binding.owner),version=host._renderVersion;
    if(!el||!owner||el===owner)return false;
    await Promise.all([el._spriteReady,owner._spriteReady]);
    if(version!==host._renderVersion)return false;
    const from=el.getBoundingClientRect();
    if(binding.variant)await sprite(id,body(el).querySelector(':scope > canvas'),binding.variant);
    if(version!==host._renderVersion)return false;
    el.classList.add('mounted-prop');el.dataset.attachedTo=binding.owner;delete el.dataset.hand;
    body(owner).append(el);mountLayout(el,owner,binding);
    host._mounts.set(id,{el,owner,binding});
    if(id==='A074'&&!body(owner).querySelector('.hand-occlusion')){
      const source=body(owner).querySelector(':scope > canvas');
      for(const outline of window.PuppetRig.hands[binding.owner]||[]){const hand=document.createElement('canvas');hand.className='hand-occlusion';hand.width=source.width;hand.height=source.height;hand.getContext('2d').drawImage(source,0,0);hand.style.clipPath='polygon('+outline.map(([x,y])=>x*100+'% '+y*100+'%').join(',')+')';hand.setAttribute('aria-hidden','true');body(owner).append(hand);}mountLayout(el,owner,binding);
    }
    if(travel){const to=el.getBoundingClientRect();const motion=el.animate([{translate:(from.x+from.width/2-to.x-to.width/2)+'px '+(from.y+from.height/2-to.y-to.height/2)+'px',scale:Math.min(2,from.width/to.width)},{translate:'0 0',scale:1}],{duration:reduced()?1:950,easing:'cubic-bezier(.2,.65,.25,1)'});await motion.finished.catch(()=>{});}
    return version===host._renderVersion;
  }
  function detach(host,id){
    const el=actor(host,id);if(!el)return null;
    const r=el.getBoundingClientRect(),h=host.getBoundingClientRect();
    host._mounts.delete(id);delete host._propState.held[id];
    el.classList.remove('mounted-prop');delete el.dataset.attachedTo;
    host.querySelector('.scene-props').append(el);
    Object.assign(el.style,{left:(r.x+r.width/2-h.x)+'px',top:(r.y+r.height/2-h.y)+'px',bottom:'auto',width:r.width+'px',height:r.height+'px',transform:'translate(-50%,-50%)',animation:'none'});
    return el;
  }
  async function arrange(host,scene){
    const version=host._renderVersion,R=window.PuppetRig;if(!R)return;
    const state=host._propState,bindings={...R.equipment,...state.held};
    if(scene.background==='A049')bindings.A055=R.pickups.A051;
    if(scene.background==='A050')bindings.A055={owner:'A052',x:.5,y:.38,width:.56,angle:-24,flip:true};
    for(const [id,b] of Object.entries(bindings)){
      if(version!==host._renderVersion)return;
      if(!state.released[id])await attach(host,id,b);
    }
    if(version!==host._renderVersion)return;
    for(const [id,pose] of Object.entries(state.poses)){const el=body(actor(host,id));if(el)Object.assign(el.style,pose);}
    for(const id of Object.keys(state.released)){const el=actor(host,id);if(el)el.hidden=true;}
    host.dataset.rigReady='true';
  }
  function render(host,scene,{index=0,mode='button',instruction='',interactive=false,left=null,right=null,chrome=true,propState=null}={}){
    cancel(host);host.replaceChildren();host.dataset.mode=mode;host.dataset.motion='idle';host.dataset.act=String(index+1);
    const state=propState||{};if(state.scene!==scene.background){state.scene=scene.background;state.held={};state.released={};state.poses={};}
    host._propState=state;host._mounts=new Map();host.dataset.rigReady='false';
    const bg=document.createElement('img');bg.className='scene-background';bg.src=assets[scene.background].src;bg.alt='';bg.dataset.assetId=scene.background;host.append(bg);
    const effects=document.createElement('div');effects.className='scene-effects';effects.setAttribute('aria-hidden','true');
    scene.effects.forEach(id=>{const img=document.createElement('img');img.className='scene-effect';img.src=assets[id].src;img.alt='';img.dataset.assetId=id;effects.append(img);});host.append(effects);
    const actors=document.createElement('div');actors.className='scene-actors';
    scene.cast.forEach((id,i)=>{
      const extra=i>1,x=scene.cast.length===1?48:i===0?34:i===1?65:16+(i-2)*23;
      const el=layer(id,extra?'is-extra':'',x,extra?31:20);
      if(id===left)el.dataset.hand='left';if(id===right)el.dataset.hand='right';
      if(interactive&&(id===left||id===right)){el.tabIndex=0;el.title=assets[id].name+'：拖动或用方向键移动';el.setAttribute('aria-label',el.title);}
      else el.style.pointerEvents='none';actors.append(el);
    });host.append(actors);
    const props=document.createElement('div');props.className='scene-props';
    scene.props.forEach((id,i)=>props.append(layer(id,'is-prop',18+(i+1)*64/(scene.props.length+1),12+(i%2)*3)));host.append(props);
    for(const cls of ['scene-water','scene-mist','scene-shade']){const el=document.createElement('div');el.className=cls;el.setAttribute('aria-hidden','true');host.append(el);}
    if(chrome){
      const toolbar=document.createElement('div');toolbar.className='scene-toolbar';toolbar.innerHTML='<span class="act-label">'+['一','二','三'][index]+' · '+escape(scene.title)+'</span>';host.append(toolbar);
      const caption=document.createElement('p');caption.className='scene-instruction';caption.setAttribute('role','status');caption.textContent=instruction;host.append(caption);
    }
    host._rigReady=arrange(host,scene);
    host._rigObserver=new ResizeObserver(()=>host._mounts.forEach(({el,owner,binding})=>mountLayout(el,owner,binding)));host._rigObserver.observe(host);
  }
  function cancel(host){host._renderVersion=(host._renderVersion||0)+1;host._rigObserver?.disconnect();host.querySelectorAll('*').forEach(el=>el.getAnimations().filter(a=>!(a instanceof CSSAnimation)).forEach(a=>a.cancel()));}
  async function morph(host,fromId,toId){
    const from=host.querySelector('.scene-actor[data-asset-id="'+fromId+'"]');if(!from)return false;
    const version=host._renderVersion,x=parseFloat(from.style.left),bottom=parseFloat(from.style.bottom),glow=document.createElement('span');
    glow.className='morph-glow';glow.style.left=x+'%';glow.style.bottom=(bottom+23)+'%';host.append(glow);
    const duration=reduced()?1:1100;
    const glowMotion=glow.animate([{opacity:0,scale:.4},{opacity:1,scale:1.3}],{duration,fill:'forwards'});
    const fade=from.animate([{opacity:1,scale:1},{opacity:.7,offset:.5,scale:.7,translate:'0 30px'},{opacity:0,scale:.12,translate:'0 65px'}],{duration,fill:'forwards'});
    await Promise.all([fade.finished.catch(()=>{}),glowMotion.finished.catch(()=>{})]);
    if(version!==host._renderVersion){glow.remove();return false;}
    // Remove 女娃 before creating Jingwei: they cannot coexist as two people.
    from.remove();
    const bird=layer(toId,'',x,bottom);host.querySelector('.scene-actors').append(bird);await sprite(toId,bird.querySelector('canvas'));
    if(version!==host._renderVersion){bird.remove();glow.remove();return false;}
    const rise=bird.animate([{opacity:0,scale:.15,translate:'0 55px'},{opacity:1,scale:1,translate:'0 -35px'}],{duration:reduced()?1:1500,fill:'forwards',easing:'ease-out'});
    const dim=glow.animate([{opacity:1,scale:1.3},{opacity:0,scale:2}],{duration:reduced()?1:1500,fill:'forwards'});
    await Promise.all([rise.finished.catch(()=>{}),dim.finished.catch(()=>{})]);glow.remove();return version===host._renderVersion;
  }
  function ripple(host,x=.5,y=.8,strength=.5){
    const ring=document.createElement('span');ring.className='action-ring';ring.setAttribute('aria-hidden','true');
    ring.style.left=x*100+'%';ring.style.bottom=(1-y)*100+'%';ring.style.scale=String(.65+strength);
    host.append(ring);setTimeout(()=>ring.remove(),1800);
  }
  async function animate(host,step){
    const version=host._renderVersion;await host._rigReady;if(version!==host._renderVersion)return;
    host.dataset.motion=step.motion;
    const target=host.querySelector('.scene-actor[data-asset-id="'+step.focus+'"]');
    const canvas=body(target),all=[];
    const trail=canvas&&!reduced()?setInterval(()=>{
      if(!canvas.isConnected)return;
      const r=canvas.getBoundingClientRect(),bounds=host.getBoundingClientRect();
      if(bounds.width)ripple(host,Math.max(.05,Math.min(.95,(r.x+r.width/2-bounds.x)/bounds.width)),Math.max(.68,Math.min(.9,(r.bottom-bounds.y)/bounds.height)),.3);
    },220):null;
    const duration=reduced()?1:1400;
    const move=(el,frames,options={})=>{
      if(!el)return;const a=el.animate(frames,{duration,easing:'ease-in-out',fill:'forwards',...options});all.push(a.finished.then(()=>{
        if(version!==host._renderVersion)return;
        const last=frames[frames.length-1],pose={};for(const key of ['transform','opacity'])if(last[key]!==undefined){el.style[key]=last[key];pose[key]=last[key];}
        if(el.classList.contains('puppet-body'))host._propState.poses[el.parentElement.dataset.assetId]=pose;
        a.cancel();
      }).catch(()=>{}));
    };
    const home={transform:canvas?.style.transform||'translate(0,0) rotate(0deg) scale(1)',opacity:1};
    const motion=step.motion;
    if(motion==='pickup'){
      const binding=window.PuppetRig?.pickups[step.focus];
      if(binding&&actor(host,binding.id)){
        host._propState.held[binding.id]=binding;delete host._propState.released[binding.id];
        all.push(attach(host,binding.id,binding,true));
      }else move(canvas,[home,{transform:'translateY(-8px) scale(1.03)'},home]);
    }else if(['fly','ascend','rise'].includes(motion)){
      move(canvas,[home,{transform:'translate(18px,-65px) rotate(-8deg)'},{transform:'translate(38px,-90px) rotate(0deg)'}]);
    }else if(['throw','shoot'].includes(motion)){
      const id=motion==='shoot'?'A055':window.PuppetRig?.pickups[step.focus]?.id,prop=id&&detach(host,id);
      if(prop){const r=prop.getBoundingClientRect(),h=host.getBoundingClientRect(),start={x:r.x+r.width/2-h.x,y:r.y+r.height/2-h.y};
        const enemy=motion==='shoot'?actor(host,'A052')?.getBoundingClientRect():null;
        const end=enemy?{x:enemy.x+enemy.width*.5-h.x,y:enemy.y+enemy.height*.4-h.y}:{x:Math.min(h.width*.88,start.x+h.width*.17),y:h.height*.86};
        const dx=end.x-start.x,dy=end.y-start.y;
        move(body(prop),[{transform:'translate(0,0)',opacity:1},{transform:'translate('+dx*.45+'px,'+(dy*.3-(motion==='throw'?h.height*.12:0))+'px) scale(.9)',opacity:1},{transform:'translate('+dx+'px,'+dy+'px) scale(.4)',opacity:0}]);
        all.push(Promise.all([...all]).then(()=>{if(version===host._renderVersion){host._propState.released[id]=true;prop.hidden=true;ripple(host,end.x/h.width,end.y/h.height,motion==='throw'?.85:.3);}}));
      }
    }else if(motion==='run'||motion==='approach'){
      move(canvas,[home,{transform:'translate(20px,-10px) rotate(4deg)'},{transform:'translate(50px,0) rotate(-3deg)'},{transform:'translate(85px,-10px)'},{transform:'translate(105px,0)'}]);
    }else if(['drink','bath'].includes(motion)){
      if(motion==='bath'&&target?.dataset.attachedTo)detach(host,step.focus);
      if(motion==='bath'&&target){const r=target.getBoundingClientRect(),h=host.getBoundingClientRect(),dy=h.height*.83-(r.y+r.height*.5-h.y);move(canvas,[home,{transform:'translateY('+dy+'px) scale(.85)'}]);all.push(Promise.all([...all]).then(()=>{if(version===host._renderVersion)ripple(host,(r.x+r.width/2-h.x)/h.width,.83,.7);}));}
      else move(canvas,[home,{transform:'translateY(40px) rotate(18deg)'},{transform:'translateY(20px) rotate(8deg)'},home]);
    }else if(motion==='victory'){
      move(canvas,[home,{transform:'translateY(50px) scale(.8)',opacity:0}]);
      move(host.querySelector('[data-asset-id="A041"] canvas'),[home,{transform:'translateY(60px)',opacity:0}]);
    }else if(['fall','transform'].includes(motion)){
      if(step.focus==='A022'){const staff=detach(host,'A025');if(staff)move(body(staff),[{transform:'rotate(0deg)'},{transform:'translateY(35px) rotate(62deg)'}]);}
      move(canvas,[home,{transform:motion==='fall'?'translateY(48px) rotate(65deg) scale(.8)':'translateY(-35px) scale(.65)',opacity:0}]);
    }else if(motion==='grow'){
      const staff=actor(host,'A025');if(staff){staff.hidden=true;host._propState.released.A025=true;}
      move(canvas,[{transform:'scale(.25)',opacity:.2},{transform:'translateY(-35px) scale(2)',opacity:1}]);
    }else if(motion==='phase'){
      move(canvas,[home,{transform:'rotate(180deg)'},{transform:'rotate(360deg)'}]);
    }else if(['dance','music'].includes(motion)){
      const performers=step.solo?[canvas]:[...host.querySelectorAll('.scene-actors > .scene-actor')].map(body);
      performers.forEach((el,i)=>move(el,[home,{transform:'translateY(-20px) rotate(-8deg)'},{transform:'rotate(8deg)'},home],{delay:reduced()?0:i*80}));
      for(const id of ['A074','A073','A072','A121','A122']){const instrument=body(actor(host,id));if(instrument)move(instrument,[home,{transform:'translateY(3px) rotate(-2deg)'},home,{transform:'translateY(3px) rotate(2deg)'},home]);}
      host.querySelectorAll('.hand-occlusion').forEach(hand=>move(hand,[{transform:'translateY(0)'},{transform:'translateY(3px)'},{transform:'translateY(0)'},{transform:'translateY(2px)'},{transform:'translateY(0)'}]));
    }else if(motion==='aim'){
      move(body(actor(host,'A051')),[home,{transform:'rotate(-4deg) scale(1.04)'}]);
    }else{
      move(canvas,[home,{transform:'translateY(-15px) scale(1.13)'},home]);
      if(['storm','rain','mist'].includes(motion))host.querySelectorAll('.scene-effect').forEach(el=>move(el,[{opacity:.1},{opacity:.65},{opacity:.28}]));
    }
    if(['throw','bath','drink','storm','rain','music'].includes(motion)){
      const ring=document.createElement('span');ring.className='action-ring';ring.setAttribute('aria-hidden','true');host.append(ring);setTimeout(()=>ring.remove(),1800);
    }
    await Promise.all(all);
    if(trail)clearInterval(trail);
  }
  window.StageArt={sprite,render,animate,cancel,escape,ripple,morph};
})();
