(function(){
  'use strict';
  const $=id=>document.getElementById(id),esc=window.StageArt.escape,assets=window.SHANHAI_ASSETS;
  const state={screen:'home',reading:'story',story:null,soundOn:false,audio:null,musicTimer:null,noteIndex:0,utterance:null,narrationHadMusic:false};
  let toastTimer;
  function toast(message){$('app-status').textContent=message;$('app-status').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('app-status').classList.remove('visible'),3500);}
  function showScreen(name){
    if(state.screen==='play'&&name!=='play')theatre.close();
    if(state.screen==='story'&&name!=='story')stopNarration();
    state.screen=name;
    document.querySelectorAll('.screen').forEach(el=>el.hidden=el.id!==name+'-screen');
    document.querySelector('.app-shell').className='app-shell on-'+(name==='story'?'reading':name);
    $('nav-stories').hidden=name==='catalog';
    if(name!=='play')$('play-stage').replaceChildren();
    window.scrollTo({top:0,behavior:'instant'});
    const title=$(name+'-title');if(title){title.tabIndex=-1;title.focus({preventScroll:true});}
  }
  function buildCatalog(){
    const featured={1:'A011',2:'A022',3:'A033',7:'A051',8:'A065',9:'A081',10:'A092',16:'A102',20:'A114'};
    const realms={1:'发鸠山',2:'海外北境',3:'冀州之野',7:'寿华之野',8:'云海天门',9:'甘渊扶桑',10:'大荒月池',16:'青丘山',20:'鸾凤仙境'};
    const islands={1:[34,66,-8,1.04],2:[15,21,-7,.82],3:[84,24,8,.85],7:[68,70,6,1.02],8:[46,23,-3,.83],9:[88,45,5,.94],10:[22,42,-5,.93],16:[53,46,3,1],20:[14,84,-5,1.1]};
    $('story-grid').replaceChildren();
    STORIES.forEach((story,i)=>{
      const book=document.createElement('button'),cover=STORY_SCENES[story.id][0];
      book.className='story-card cover-book';
      const [x,y,tilt]=islands[story.id];book.style.cssText='--island-x:'+x+'%;--island-y:'+y+'%;--book-tilt:'+tilt+'deg';
      book.dataset.story=story.id;book.setAttribute('aria-label',story.title+'，'+story.summary);
      book.innerHTML='<div class="cover-object"><img class="cover-art" src="'+esc(assets[cover.background].src)+'" alt="" loading="lazy"><canvas class="cover-actor" aria-hidden="true"></canvas><span class="cover-volume">'+esc(realms[story.id])+'</span><h2 class="cover-title">'+esc(story.title)+'</h2><p class="cover-description">'+esc(story.summary)+'</p><span class="cover-chapter">'+esc(story.chapter)+'</span></div><span class="cover-caption"><span>'+(i%2?'展开竹卷':'翻开古书')+'</span><span aria-hidden="true">↗</span></span>';
      const spine=document.createElement('span');spine.className='scroll-spine';spine.setAttribute('aria-hidden','true');book.append(spine);
      book.addEventListener('click',()=>openStory(story));$('story-grid').append(book);
      StageArt.sprite(featured[story.id],book.querySelector('canvas'));
    });
  }
  function quoteMarkup(story){
    return story.quote.map(([han,py])=>{
      const syllables=py.match(/[^\s,.;!?，。；]+/g)||[];let i=0;
      return '<p>'+[...han].map(c=>/\p{Script=Han}/u.test(c)?'<ruby>'+esc(c)+'<rt>'+esc(syllables[i++]||'')+'</rt></ruby>':esc(c)).join('')+'</p>';
    }).join('');
  }
  function openStory(story){
    state.story=story;state.reading='story';
    $('story-title').textContent=story.title;
    $('story-narrative').innerHTML=story.narrative.map(p=>'<p>'+esc(p)+'</p>').join('');
    $('classic-source').textContent='《山海经 · '+story.chapter+'》节选';
    $('classic-quote').innerHTML=quoteMarkup(story);
    const audit=STORY_AUDIT[story.id];$('source-note').textContent=audit.note;$('source-link').href=audit.url;document.querySelector('.source-note').open=false;
    // This illustration remains mounted while the reader switches between versions.
    StageArt.render($('story-stage'),STORY_SCENES[story.id][0],{chrome:false});
    showScreen('story');setReading('story');
  }
  function setReading(view){
    if(view==='stage'){openPlay();return;}
    if(!['story','classic'].includes(view)||!state.story)return;
    if(view==='classic')stopNarration();
    state.reading=view;
    $('story-screen').dataset.reading=view;
    $('story-narrative').hidden=view!=='story';
    $('classic-inline').hidden=view!=='classic';
    $('listen-story').hidden=view!=='story';
    document.querySelector('.source-note').hidden=view!=='story';
    document.querySelectorAll('.reading-flow [data-reading]').forEach(b=>b.setAttribute('aria-current',b.dataset.reading===view?'page':'false'));
  }
  const theatre=window.WaterTheatre.create({toast});
  function openPlay(){
    if(!state.story)return;
    showScreen('play');theatre.open(state.story);
  }
  document.querySelectorAll('[data-reading]').forEach(b=>b.addEventListener('click',()=>setReading(b.dataset.reading)));
  window.ShanhaiStage={
    setHandPosition:(...args)=>theatre.position(...args),
    triggerAbility:(...args)=>theatre.ability(...args),
    getSnapshot:()=>({screen:state.screen,reading:state.reading,storyId:state.story?.id,...theatre.snapshot()})
  };
  function playNote() {
    if (!state.soundOn || !state.audio) return;
    const audio = state.audio;
    const melody = [0, 2, 4, 7, 4, 2, 0, -3, 0, 2, 4, 9, 7, 4, 2, 0];
    const note = melody[state.noteIndex % melody.length];
    const frequency = 293.66 * Math.pow(2, note / 12);
    const time = audio.currentTime;
    const oscillator = audio.createOscillator();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * .996, time + 1.5);
    filter.type = "lowpass"; filter.frequency.value = 1050;
    gain.gain.setValueAtTime(.0001, time);
    gain.gain.exponentialRampToValueAtTime(.055, time + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, time + 1.65);
    oscillator.connect(filter).connect(gain).connect(audio.destination);
    oscillator.start(time); oscillator.stop(time + 1.7);
    state.noteIndex += 1;
  }

  async function setSound(on) {
    if (!on) {
      state.soundOn = false;
      clearInterval(state.musicTimer); state.musicTimer = null;
      $("sound-toggle").setAttribute("aria-pressed", "false");
      $("sound-toggle").querySelector(".sound-label").textContent = "音乐";
      return;
    }
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    try {
      if (!state.audio) state.audio = new Context();
      await state.audio.resume();
      state.soundOn = true;
      $("sound-toggle").setAttribute("aria-pressed", "true");
      $("sound-toggle").querySelector(".sound-label").textContent = "静音";
      playNote();
      clearInterval(state.musicTimer);
      state.musicTimer = setInterval(playNote, 570);
    } catch (_) { /* Music is optional if audio is unavailable. */ }
  }

  function stopNarration() {
    if (!state.utterance) return;
    state.utterance = null;
    window.speechSynthesis.cancel();
    $("listen-story").textContent = "听故事";
    $("listen-story").setAttribute("aria-pressed", "false");
    if (state.narrationHadMusic) setSound(true);
    state.narrationHadMusic = false;
  }

  function toggleNarration() {
    if (!("speechSynthesis" in window)) return;
    if (state.utterance) { stopNarration(); return; }
    const utterance = new SpeechSynthesisUtterance(state.story.narrative.join("\n"));
    utterance.lang = "zh-CN";
    utterance.rate = 0.88;
    utterance.pitch = 1;
    const voice = window.speechSynthesis.getVoices().find((entry) => entry.lang.toLowerCase().startsWith("zh"));
    if (voice) utterance.voice = voice;
    state.narrationHadMusic = state.soundOn;
    if (state.narrationHadMusic) setSound(false);
    state.utterance = utterance;
    $("listen-story").textContent = "停止朗读";
    $("listen-story").setAttribute("aria-pressed", "true");
    const finish = () => {
      if (state.utterance !== utterance) return;
      state.utterance = null;
      $("listen-story").textContent = "再听一遍";
      $("listen-story").setAttribute("aria-pressed", "false");
      if (state.narrationHadMusic) setSound(true);
      state.narrationHadMusic = false;
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  }



  $('begin-button').addEventListener('click',()=>{showScreen('catalog');setSound(true);});
  $('brand-home').addEventListener('click',()=>showScreen('home'));
  $('nav-stories').addEventListener('click',()=>showScreen('catalog'));
  $('sound-toggle').addEventListener('click',()=>setSound(!state.soundOn));
  $('listen-story').addEventListener('click',()=>{if(!('speechSynthesis'in window))toast('当前浏览器不支持朗读。');else toggleNarration();});
  document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>{
    if(b.dataset.back==='story'){showScreen('story');return;}
    showScreen(b.dataset.back);
  }));
  ['A004','A005','A006'].forEach(id=>{
    const img=document.createElement('img');img.className='home-atmosphere home-'+id;img.src=assets[id].src;img.alt='';img.dataset.assetId=id;img.setAttribute('aria-hidden','true');
    $('home-screen').insertBefore(img,document.querySelector('.home-vignette'));
  });
  buildCatalog();showScreen('home');
})();
