/* The current plot owns the cast; hands never introduce future characters. */
(function(){
  const drivers={1:[['A010','A010'],['A010','A010'],['A011','A011','A011']],2:[['A022','A022'],['A022','A022'],['A022','A026']],3:[['A033','A035'],['A038','A035'],['A036','A034']],7:[['A052','A051'],['A051','A051'],['A052','A053']],8:[['A065','A065'],['A065','A065'],['A068','A069']],9:[['A081','A081'],['A081','A081'],['A082','A083']],10:[['A092','A092'],['A092','A094'],['A093','A093']],16:[['A103','A102'],['A102','A103'],['A104','A102']],20:[['A113','A114'],['A115','A116'],['A114','A113']]};
  const autonomous={1:['1:0'],2:['2:1'],3:['2:1'],7:['0:0','2:0','2:1'],8:[],9:[],10:['1:1'],16:['0:1','1:0','2:0','2:1'],20:[]};
  const dual={2:[['A022','A023'],['A022','A024'],null],3:[['A033','A035'],['A035','A038'],null],8:[['A065','A068'],['A065','A066'],['A068','A069']]};
  drivers[8][0][0]='A068';
  const intros={1:'一只手，先陪女娃入海，再化作精卫衔木填海。',2:'左手引夸父逐日，右手牵引太阳；角色随情节自动交接。',3:'双手演绎蓄水与风雨；女魃登场后改用一只手止雨。',7:'一只手，跟随羿搭箭、张弓、松弦。',8:'一只手，随启乘龙取乐，再奏乐起舞。',9:'一只手，捧日、浴日，引日轮升空。',10:'一只手，捧月、浴月，让月光照向人间。',16:'一只手，随旅人进入青丘，握住护符辨认归路。',20:'一只手，随歌声交接角色，让鸾凤与百兽起舞。'};
  intros[8]='左手与右手分别牵引启和乐师；随后合力乘龙登天，奏乐起舞。';
  const gestures={pickup:'pinch',throw:'release',shoot:'release',aim:'pinch',fly:'raise',rise:'raise',ascend:'raise',run:'tap',approach:'sway',drink:'lower',bath:'lower',fall:'lower',transform:'open',grow:'raise',storm:'sway',rain:'lower',mist:'sway',phase:'turn',dance:'turn',music:'tap',command:'open',clear:'open',illuminate:'open',reveal:'open',victory:'lower'};
  const instructions={
    pinch:'在预览框内捏合拇指与食指，保持约一秒。',
    release:'在预览框内先捏住片刻，再松指张掌，保持约一秒。',
    open:'在预览框中央张开五指，掌心朝镜头，保持约一秒。',
    raise:'手掌从预览框中部抬到上方三分之一，停留约一秒。',
    lower:'手掌从预览框中部降到下方三分之一，停留约一秒。',
    sway:'在预览框内张掌，向左或右移约一掌宽，再停留约一秒。',
    tap:'在预览框内张掌，上下轻点两次，再停留约一秒。',
    turn:'在预览框内张掌，将手腕向一侧倾斜，再保持约一秒。'
  };
  // Preview the visible consequence, not scholarly notes or a generic power label.
  const effects={
    1:[['女娃俯身拾石，石子从水边升起。','女娃向东海走去，场景随她转向海面。'],['海浪翻涌，女娃被风浪围住。','女娃的身影化为光，精卫鸟从光中飞出。'],['精卫低头衔起木石。','精卫振翼，飞向东海上方。','木石落入东海，落点泛起水纹；精卫仍会继续填海。']],
    2:[['夸父举杖启程。','夸父向日光奔去，随后来到河渭。'],['夸父俯身饮水，却仍然口渴。','夸父继续北行，寻找大泽。'],['夸父倒下，遗下木杖；随后木杖化为树林。','夸父不再登场，遗杖化作邓林。']],
    3:[['黄帝发出号令，应龙准备出战。','应龙升起，水阵随之汇聚。'],['雨师招来风雨，水面掀起波浪。','应龙翻动水势，战场浪涌加剧。'],['女魃止住风雨，天色转亮。','蚩尤隐去，战旗收起，战事落幕。']],
    7:[['凿齿持盾走近，羿准备迎战。','羿俯身搭箭，准备张弓。'],['羿张弓蓄势，等待你松指射箭。','神箭飞向凿齿；随后凿齿退场，飞鸟归来。'],['凿齿倒下退场，羿留在原野。','飞鸟重新飞过水面，原野归静。']],
    8:[['启循着天乐摆动，准备召龙。','启举手召龙，随后转入双龙所在的云海。'],['青龙升向天门，带出启乘龙登天的一幕。','启随天乐舞动，随后将天乐带回人间。'],['乐师与乐器随节拍摆动。','舞者旋舞，水面泛起节奏般的涟漪。']],
    9:[['羲和俯身捧日，身旁的日光升起。','太阳移向甘渊，随后进入浴日场景。'],['太阳沉向水面，金色涟漪散开。','日轮升起，随后来到扶桑树旁。'],['金乌展翼向上飞起。','太阳升空，日光映上水面。']],
    10:[['常羲俯身捧月，月光从水边升起。','月亮浸向水面，银色涟漪散开。'],['月相圆环缓缓转动；随后星使鸟飞过。','星使鸟升向夜空。'],['月亮升起，月光照向山路。','月光转亮，水上故事温柔收尾。']],
    16:[['旅人走向青丘，随后九尾狐现身。','九尾狐现身舒展，随后进入迷雾。'],['狐影摆动，迷雾变浓。','旅人握住护符；随后灌灌鸟将带路。'],['灌灌鸟飞向山口，为旅人引路。','雾色消散，九尾狐留在远处，旅人找到归路。']],
    20:[['鸾鸟随歌声轻摆，水面泛起涟漪。','凤凰振翼升起，与鸾鸟相和。'],['鹿向水边走来，百兽聚在一起。','百兽随节拍摆动，倒影与水纹相和。'],['凤凰旋舞，彩羽映入水中。','鸾鸟与百兽共舞，完成谢幕。']]
  };
  const cooperation={
    '2:0:1':[{side:'left',gesture:'tap',focus:'A022',motion:'run'},{side:'right',gesture:'raise',focus:'A023',motion:'rise'}],
    '3:1:1':[{side:'left',gesture:'sway',focus:'A035',motion:'storm'},{side:'right',gesture:'lower',focus:'A038',motion:'rain'}],
    '8:1:0':[{side:'left',gesture:'raise',focus:'A065',motion:'ascend'},{side:'right',gesture:'raise',focus:'A066',motion:'ascend'}],
    '8:2:1':[{side:'left',gesture:'tap',focus:'A068',motion:'music'},{side:'right',gesture:'turn',focus:'A069',motion:'dance'}]
  };
  function cue(id,act,step){
    const key=id+':'+act+':'+step,raw={...STORY_SCENES[id][act].steps[step]};
    if(key==='8:0:0')raw.focus='A068';
    if(key==='8:1:1'){raw.motion='pickup';raw.focus='A065';}
    const gesture=key==='8:1:1'?'pinch':gestures[raw.motion],driver=drivers[id][act][step],pair=dual[id]?.[act];
    const requirements=cooperation[key]||[{side:pair?.[1]===driver?'right':'left',gesture,focus:raw.focus,motion:raw.motion}];
    let effect=effects[id][act][step];
    if(key==='8:0:0')effect='乐师随你的手势奏出节拍，启循着天乐准备召龙。';
    if(key==='8:1:1')effect='启捏住天乐的音符；随后将乐舞带回人间。';
    if(key==='2:0:1')effect='夸父随节拍奔跑，太阳同时升高；两手合力推进逐日。';
    if(key==='3:1:1')effect='应龙翻涌水阵，雨师降雨，双手合成风雨交锋。';
    if(key==='8:1:0')effect='双龙同时升起，启随它们登上天门。';
    if(key==='8:2:1')effect='乐师随左手打拍，舞者随右手旋舞，水面荡起节奏涟漪。';
    return {...raw,gesture,gestureHint:instructions[gesture],effect,driver,requirements:requirements.map(r=>({...r,hint:instructions[r.gesture]})),automatic:autonomous[id].includes(act+':'+step),ensemble:key==='8:1:0'?[{focus:'A067',motion:'ascend'}]:[]};
  }
  function roles(id,act,step){const pair=dual[id]?.[act];return pair?{left:pair[0],right:pair[1]}:{left:cue(id,act,step).driver,right:null};}
  function cast(id,act,step,retired=[]){let ids=STORY_SCENES[id][act].cast.filter(a=>!retired.includes(a));if(id===16&&act===0&&step===0)ids=ids.filter(a=>a!=='A102');if(id===7&&act===2&&step===0)ids=ids.filter(a=>a!=='A053');return ids;}
  window.STORY_PERFORMANCE={cue,roles,cast,intros,gestures};
})();
