// Home-page water refraction over the rendered illustration, not a real-time 3D scene.
// The original-image coordinates keep the motion on the pool at every aspect ratio.
(function () {
  'use strict';
  const canvas = document.getElementById('home-water');
  const screen = document.getElementById('home-screen');
  const button = document.getElementById('water-motion-toggle');
  if (!canvas || !screen || !button) return;
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
  if (!gl) { canvas.hidden = true; button.hidden = true; return; }
  const vertex = 'attribute vec2 p; varying vec2 uv; void main(){uv=p*0.5+0.5; gl_Position=vec4(p,0.,1.);}';
  const fragment = `precision mediump float;
    uniform sampler2D scene; uniform vec2 viewport; uniform vec2 imageSize;
    uniform float time; varying vec2 uv;
    void main(){
      float scale=max(viewport.x/imageSize.x,viewport.y/imageSize.y);
      vec2 size=imageSize*scale;
      vec2 p=(uv*viewport+(size-viewport)*0.5)/size;
      // Texture uploaded with flipY: uv.y=0 is the bottom edge of the image.
      float depth=1.0-smoothstep(0.04,0.48,p.y);
      float shore=smoothstep(0.22,0.35,p.x)*(1.0-smoothstep(0.82,0.89,p.x));
      float mask=depth*shore;
      float islandLeft=1.0-smoothstep(.65,1.0,length((p-vec2(.354,.252))/vec2(.105,.055)));
      float islandRight=1.0-smoothstep(.65,1.0,length((p-vec2(.736,.253))/vec2(.145,.058)));
      mask*=1.0-max(islandLeft,islandRight);
      // Fixed lantern silhouettes: light flickers, architecture never bends.
      float lamp1=1.0-smoothstep(0.45,1.0,length((p-vec2(.278,.196))/vec2(.035,.08)));
      float lamp2=1.0-smoothstep(0.45,1.0,length((p-vec2(.322,.17))/vec2(.033,.08)));
      float lamp3=1.0-smoothstep(0.45,1.0,length((p-vec2(.882,.16))/vec2(.04,.09)));
      mask*=1.0-max(lamp1,max(lamp2,lamp3));
      float wave=sin(p.y*105.0+time*3.0)+0.45*sin(p.y*195.0-p.x*26.0-time*2.1);
      vec2 ripple=vec2(wave*0.0065,cos(p.y*75.0+p.x*28.0+time*2.0)*0.0035)*mask;
      // Restrict downward refraction to the observed waterfall strips.
      float fall1=(1.0-smoothstep(.45,1.0,length((p-vec2(.817,.355))/vec2(.028,.075))));
      float fall2=(1.0-smoothstep(.45,1.0,length((p-vec2(.869,.474))/vec2(.016,.065))));
      float fall3=(1.0-smoothstep(.45,1.0,length((p-vec2(.967,.63))/vec2(.035,.075))));
      float falls=max(fall1,max(fall2,fall3));
      ripple.y+=sin(p.y*90.0+time*7.0)*.003*falls;
      float clouds=smoothstep(.72,.82,p.y)*(1.0-smoothstep(.94,1.0,p.y))*smoothstep(.39,.46,p.x)*(1.0-smoothstep(.68,.76,p.x));
      ripple.x+=sin(time*.24+p.y*8.0)*.018*clouds;
      vec3 col=texture2D(scene,clamp(p+ripple,0.001,0.999)).rgb;
      float shimmer=pow(max(0.0,sin(p.y*250.0+sin(p.x*34.0+time*1.6)*1.8-time*3.1)),12.0);
      col+=vec3(.105,.087,.041)*shimmer*mask;
      col+=vec3(.13,.16,.16)*falls*pow(max(0.0,sin(p.y*170.0+time*9.0)),6.0);
      float flicker=.45+.24*sin(time*3.7)+.13*sin(time*9.3);
      col+=vec3(.23,.12,.025)*(lamp1+lamp2+lamp3)*flicker;
      gl_FragColor=vec4(col,1.0);
    }`;
  function shader(type, source) {
    const s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  let program;
  try {
    program=gl.createProgram(); gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment)); gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Water program unavailable');
  } catch { canvas.hidden=true; button.hidden=true; return; }
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const viewport=gl.getUniformLocation(program,'viewport'), imageSize=gl.getUniformLocation(program,'imageSize'), time=gl.getUniformLocation(program,'time');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let running=false, loaded=false, raf=0, last=0, phase=0;
  function label(){button.textContent=running?'暂停动态':'水波流动';button.setAttribute('aria-pressed',String(running));screen.dataset.motion=running?'on':'off';}
  function resize(){const rect=screen.getBoundingClientRect(), dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(viewport,canvas.width,canvas.height);draw();}
  function draw(){if(loaded){gl.uniform1f(time,phase);gl.drawArrays(gl.TRIANGLES,0,6);}}
  function tick(stamp){raf=0;if(!running||screen.hidden||document.hidden||!loaded)return;if(last)phase+=Math.min((stamp-last)/1000,.05);last=stamp;draw();raf=requestAnimationFrame(tick);}
  function sync(){cancelAnimationFrame(raf);raf=0;last=0;label();if(running&&!screen.hidden&&!document.hidden&&loaded)raf=requestAnimationFrame(tick);else draw();}
  button.addEventListener('click',()=>{running=!running;sync();});
  document.addEventListener('visibilitychange',sync);
  new MutationObserver(sync).observe(screen,{attributes:true,attributeFilter:['hidden']});
  new ResizeObserver(resize).observe(screen);
  reduced.addEventListener('change',()=>{if(reduced.matches)running=false;sync();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(raf);canvas.hidden=true;button.hidden=true;});
  const image=new Image();image.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);gl.uniform2f(imageSize,image.width,image.height);loaded=true;canvas.classList.add('is-ready');resize();sync();};
  image.onerror=()=>{canvas.hidden=true;button.hidden=true;};
  image.src='./assets/hero-shanhai-3d-v1.png';label();
})();
