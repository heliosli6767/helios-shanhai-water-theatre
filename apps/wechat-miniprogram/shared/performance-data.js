'use strict';
// Generated from the final Web performance flow.
module.exports = {
  "1": {
    "intro": "一只手，先陪女娃入海，再化作精卫衔木填海。",
    "scenes": [
      {
        "cues": [
          {
            "label": "拾起石子",
            "instruction": "女娃来到山林水畔，拾起一颗石子。",
            "motion": "pickup",
            "focus": "A010",
            "result": "石子收入掌心。",
            "gesture": "pinch",
            "gestureHint": "在预览框内捏合拇指与食指，保持约一秒。",
            "effect": "女娃俯身拾石，石子从水边升起。",
            "driver": "A010",
            "requirements": [
              {
                "side": "left",
                "gesture": "pinch",
                "focus": "A010",
                "motion": "pickup",
                "hint": "在预览框内捏合拇指与食指，保持约一秒。",
                "focusName": "女娃"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "女娃",
            "roles": {
              "left": "A010",
              "right": null
            }
          },
          {
            "label": "前往东海",
            "instruction": "沿水边出发，下一幕来到东海。",
            "motion": "approach",
            "focus": "A010",
            "result": "女娃向东海走去。",
            "gesture": "sway",
            "gestureHint": "在预览框内张掌，向左或右移约一掌宽，再停留约一秒。",
            "effect": "女娃向东海走去，场景随她转向海面。",
            "driver": "A010",
            "requirements": [
              {
                "side": "left",
                "gesture": "sway",
                "focus": "A010",
                "motion": "approach",
                "hint": "在预览框内张掌，向左或右移约一掌宽，再停留约一秒。",
                "focusName": "女娃"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "女娃",
            "roles": {
              "left": "A010",
              "right": null
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "风浪涌起",
            "instruction": "掀起东海风浪，演绎女娃溺而不返的转折。",
            "motion": "storm",
            "focus": "A012",
            "result": "风浪遮住女娃的身影。",
            "gesture": "sway",
            "gestureHint": "在预览框内张掌，向左或右移约一掌宽，再停留约一秒。",
            "effect": "海浪翻涌，女娃被风浪围住。",
            "driver": "A010",
            "requirements": [
              {
                "side": "left",
                "gesture": "sway",
                "focus": "A012",
                "motion": "storm",
                "hint": "在预览框内张掌，向左或右移约一掌宽，再停留约一秒。",
                "focusName": "东海水灵"
              }
            ],
            "automatic": true,
            "ensemble": [],
            "focusName": "东海水灵",
            "roles": {
              "left": "A010",
              "right": null
            }
          },
          {
            "label": "化作精卫",
            "instruction": "让女娃的身影隐去，精卫在下一幕登场。",
            "motion": "transform",
            "focus": "A010",
            "result": "女娃化为精卫，故事并未结束。",
            "gesture": "open",
            "gestureHint": "在预览框中央张开五指，掌心朝镜头，保持约一秒。",
            "effect": "女娃的身影化为光，精卫鸟从光中飞出。",
            "driver": "A010",
            "requirements": [
              {
                "side": "left",
                "gesture": "open",
                "focus": "A010",
                "motion": "transform",
                "hint": "在预览框中央张开五指，掌心朝镜头，保持约一秒。",
                "focusName": "女娃"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "女娃",
            "roles": {
              "left": "A010",
              "right": null
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "衔起木石",
            "instruction": "精卫衔起西山的木石。",
            "motion": "pickup",
            "focus": "A011",
            "result": "木石衔在精卫嘴边。",
            "gesture": "pinch",
            "gestureHint": "在预览框内捏合拇指与食指，保持约一秒。",
            "effect": "精卫低头衔起木石。",
            "driver": "A011",
            "requirements": [
              {
                "side": "left",
                "gesture": "pinch",
                "focus": "A011",
                "motion": "pickup",
                "hint": "在预览框内捏合拇指与食指，保持约一秒。",
                "focusName": "精卫鸟"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "精卫鸟",
            "roles": {
              "left": "A011",
              "right": null
            }
          },
          {
            "label": "飞向东海",
            "instruction": "抬起精卫，越过水面。",
            "motion": "fly",
            "focus": "A011",
            "result": "精卫飞到东海上空。",
            "gesture": "raise",
            "gestureHint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
            "effect": "精卫振翼，飞向东海上方。",
            "driver": "A011",
            "requirements": [
              {
                "side": "left",
                "gesture": "raise",
                "focus": "A011",
                "motion": "fly",
                "hint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
                "focusName": "精卫鸟"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "精卫鸟",
            "roles": {
              "left": "A011",
              "right": null
            }
          },
          {
            "label": "投入东海",
            "instruction": "松开木石，把它投入海中。",
            "motion": "throw",
            "focus": "A011",
            "result": "又一颗石子落海；精卫仍将往返，不是已经填平大海。",
            "gesture": "release",
            "gestureHint": "在预览框内先捏住片刻，再松指张掌，保持约一秒。",
            "effect": "木石落入东海，落点泛起水纹；精卫仍会继续填海。",
            "driver": "A011",
            "requirements": [
              {
                "side": "left",
                "gesture": "release",
                "focus": "A011",
                "motion": "throw",
                "hint": "在预览框内先捏住片刻，再松指张掌，保持约一秒。",
                "focusName": "精卫鸟"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "精卫鸟",
            "roles": {
              "left": "A011",
              "right": null
            }
          }
        ]
      }
    ]
  },
  "2": {
    "intro": "左手引夸父逐日，右手牵引太阳；角色随情节自动交接。",
    "scenes": [
      {
        "cues": [
          {
            "label": "举杖出发",
            "instruction": "夸父举起木杖，向太阳奔去。",
            "motion": "command",
            "focus": "A022",
            "result": "夸父踏上逐日之途。",
            "gesture": "open",
            "gestureHint": "在预览框中央张开五指，掌心朝镜头，保持约一秒。",
            "effect": "夸父举杖启程。",
            "driver": "A022",
            "requirements": [
              {
                "side": "left",
                "gesture": "open",
                "focus": "A022",
                "motion": "command",
                "hint": "在预览框中央张开五指，掌心朝镜头，保持约一秒。",
                "focusName": "夸父"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "夸父",
            "roles": {
              "left": "A022",
              "right": "A023"
            }
          },
          {
            "label": "追赶太阳",
            "instruction": "跨越山川，追向日光。",
            "motion": "run",
            "focus": "A022",
            "result": "夸父追逐太阳，热浪越来越近。",
            "gesture": "tap",
            "gestureHint": "在预览框内张掌，上下轻点两次，再停留约一秒。",
            "effect": "夸父随节拍奔跑，太阳同时升高；两手合力推进逐日。",
            "driver": "A022",
            "requirements": [
              {
                "side": "left",
                "gesture": "tap",
                "focus": "A022",
                "motion": "run",
                "hint": "在预览框内张掌，上下轻点两次，再停留约一秒。",
                "focusName": "夸父"
              },
              {
                "side": "right",
                "gesture": "raise",
                "focus": "A023",
                "motion": "rise",
                "hint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
                "focusName": "太阳神灵"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "夸父",
            "roles": {
              "left": "A022",
              "right": "A023"
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "俯身饮水",
            "instruction": "夸父渴极，俯身饮黄河、渭河之水。",
            "motion": "drink",
            "focus": "A022",
            "result": "河、渭的水仍不足解渴。",
            "gesture": "lower",
            "gestureHint": "手掌从预览框中部降到下方三分之一，停留约一秒。",
            "effect": "夸父俯身饮水，却仍然口渴。",
            "driver": "A022",
            "requirements": [
              {
                "side": "left",
                "gesture": "lower",
                "focus": "A022",
                "motion": "drink",
                "hint": "手掌从预览框中部降到下方三分之一，停留约一秒。",
                "focusName": "夸父"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "夸父",
            "roles": {
              "left": "A022",
              "right": "A024"
            }
          },
          {
            "label": "北向大泽",
            "instruction": "转向北方，继续寻找大泽。",
            "motion": "run",
            "focus": "A022",
            "result": "他尚未到达大泽。",
            "gesture": "tap",
            "gestureHint": "在预览框内张掌，上下轻点两次，再停留约一秒。",
            "effect": "夸父继续北行，寻找大泽。",
            "driver": "A022",
            "requirements": [
              {
                "side": "left",
                "gesture": "tap",
                "focus": "A022",
                "motion": "run",
                "hint": "在预览框内张掌，上下轻点两次，再停留约一秒。",
                "focusName": "夸父"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "夸父",
            "roles": {
              "left": "A022",
              "right": "A024"
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "最后一程",
            "instruction": "夸父未至大泽，在途中渴死。",
            "motion": "fall",
            "focus": "A022",
            "result": "巨人倒下，木杖遗落。",
            "gesture": "lower",
            "gestureHint": "手掌从预览框中部降到下方三分之一，停留约一秒。",
            "effect": "夸父倒下，遗下木杖；随后木杖化为树林。",
            "driver": "A022",
            "requirements": [
              {
                "side": "left",
                "gesture": "lower",
                "focus": "A022",
                "motion": "fall",
                "hint": "手掌从预览框中部降到下方三分之一，停留约一秒。",
                "focusName": "夸父"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "夸父",
            "roles": {
              "left": "A022",
              "right": null
            }
          },
          {
            "label": "木杖化林",
            "instruction": "让遗下的木杖化为邓林。",
            "motion": "grow",
            "focus": "A026",
            "result": "弃其杖，化为邓林。桃林采用传统演绎，不是他种下的幼苗。",
            "gesture": "raise",
            "gestureHint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
            "effect": "夸父不再登场，遗杖化作邓林。",
            "driver": "A026",
            "requirements": [
              {
                "side": "left",
                "gesture": "raise",
                "focus": "A026",
                "motion": "grow",
                "hint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
                "focusName": "桃树幼苗"
              }
            ],
            "automatic": true,
            "ensemble": [],
            "focusName": "桃树幼苗",
            "roles": {
              "left": "A026",
              "right": null
            }
          }
        ]
      }
    ]
  },
  "3": {
    "intro": "双手演绎蓄水与风雨；女魃登场后改用一只手止雨。",
    "scenes": [
      {
        "cues": [
          {
            "label": "击鼓列阵",
            "instruction": "黄帝令应龙出战，两军列于水上戏台。",
            "motion": "command",
            "focus": "A033",
            "result": "应龙应命，战鼓响起。",
            "gesture": "open",
            "gestureHint": "在预览框中央张开五指，掌心朝镜头，保持约一秒。",
            "effect": "黄帝发出号令，应龙准备出战。",
            "driver": "A033",
            "requirements": [
              {
                "side": "left",
                "gesture": "open",
                "focus": "A033",
                "motion": "command",
                "hint": "在预览框中央张开五指，掌心朝镜头，保持约一秒。",
                "focusName": "黄帝"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "黄帝",
            "roles": {
              "left": "A033",
              "right": "A035"
            }
          },
          {
            "label": "应龙蓄水",
            "instruction": "抬起应龙，让水阵汇聚。",
            "motion": "rise",
            "focus": "A035",
            "result": "应龙蓄水迎战。",
            "gesture": "raise",
            "gestureHint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
            "effect": "应龙升起，水阵随之汇聚。",
            "driver": "A035",
            "requirements": [
              {
                "side": "right",
                "gesture": "raise",
                "focus": "A035",
                "motion": "rise",
                "hint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
                "focusName": "应龙"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "应龙",
            "roles": {
              "left": "A033",
              "right": "A035"
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "召风布雨",
            "instruction": "蚩尤请风伯、雨师纵大风雨。",
            "motion": "rain",
            "focus": "A038",
            "result": "风雨卷入战场。",
            "gesture": "lower",
            "gestureHint": "手掌从预览框中部降到下方三分之一，停留约一秒。",
            "effect": "雨师招来风雨，水面掀起波浪。",
            "driver": "A038",
            "requirements": [
              {
                "side": "right",
                "gesture": "lower",
                "focus": "A038",
                "motion": "rain",
                "hint": "手掌从预览框中部降到下方三分之一，停留约一秒。",
                "focusName": "雨师"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "雨师",
            "roles": {
              "left": "A035",
              "right": "A038"
            }
          },
          {
            "label": "水势翻涌",
            "instruction": "让应龙的水阵与风雨交汇。",
            "motion": "storm",
            "focus": "A035",
            "result": "水面翻涌，等待止雨。",
            "gesture": "sway",
            "gestureHint": "在预览框内张掌，向左或右移约一掌宽，再停留约一秒。",
            "effect": "应龙翻涌水阵，雨师降雨，双手合成风雨交锋。",
            "driver": "A035",
            "requirements": [
              {
                "side": "left",
                "gesture": "sway",
                "focus": "A035",
                "motion": "storm",
                "hint": "在预览框内张掌，向左或右移约一掌宽，再停留约一秒。",
                "focusName": "应龙"
              },
              {
                "side": "right",
                "gesture": "lower",
                "focus": "A038",
                "motion": "rain",
                "hint": "手掌从预览框中部降到下方三分之一，停留约一秒。",
                "focusName": "雨师"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "应龙",
            "roles": {
              "left": "A035",
              "right": "A038"
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "止雨开天",
            "instruction": "女魃登场，让雨止、云开。",
            "motion": "clear",
            "focus": "A036",
            "result": "雨止，黄帝一方得胜。",
            "gesture": "open",
            "gestureHint": "在预览框中央张开五指，掌心朝镜头，保持约一秒。",
            "effect": "女魃止住风雨，天色转亮。",
            "driver": "A036",
            "requirements": [
              {
                "side": "left",
                "gesture": "open",
                "focus": "A036",
                "motion": "clear",
                "hint": "在预览框中央张开五指，掌心朝镜头，保持约一秒。",
                "focusName": "女魃"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "女魃",
            "roles": {
              "left": "A036",
              "right": null
            }
          },
          {
            "label": "战事落幕",
            "instruction": "以收旗表现蚩尤战死，女魃留在人间。",
            "motion": "victory",
            "focus": "A034",
            "result": "原典记雨止后蚩尤被杀；本幕采用不血腥的舞台表现。",
            "gesture": "lower",
            "gestureHint": "手掌从预览框中部降到下方三分之一，停留约一秒。",
            "effect": "蚩尤隐去，战旗收起，战事落幕。",
            "driver": "A034",
            "requirements": [
              {
                "side": "left",
                "gesture": "lower",
                "focus": "A034",
                "motion": "victory",
                "hint": "手掌从预览框中部降到下方三分之一，停留约一秒。",
                "focusName": "蚩尤"
              }
            ],
            "automatic": true,
            "ensemble": [],
            "focusName": "蚩尤",
            "roles": {
              "left": "A034",
              "right": null
            }
          }
        ]
      }
    ]
  },
  "7": {
    "intro": "一只手，跟随羿搭箭、张弓、松弦。",
    "scenes": [
      {
        "cues": [
          {
            "label": "凿齿现身",
            "instruction": "凿齿持盾，羿带弓矢来到寿华之野。",
            "motion": "approach",
            "focus": "A052",
            "result": "双方在高草之间相遇。",
            "gesture": "sway",
            "gestureHint": "在预览框内张掌，向左或右移约一掌宽，再停留约一秒。",
            "effect": "凿齿持盾走近，羿准备迎战。",
            "driver": "A052",
            "requirements": [
              {
                "side": "left",
                "gesture": "sway",
                "focus": "A052",
                "motion": "approach",
                "hint": "在预览框内张掌，向左或右移约一掌宽，再停留约一秒。",
                "focusName": "凿齿"
              }
            ],
            "automatic": true,
            "ensemble": [],
            "focusName": "凿齿",
            "roles": {
              "left": "A052",
              "right": null
            }
          },
          {
            "label": "搭箭",
            "instruction": "取出神箭，准备张弓。",
            "motion": "pickup",
            "focus": "A051",
            "result": "箭搭上弓弦。",
            "gesture": "pinch",
            "gestureHint": "在预览框内捏合拇指与食指，保持约一秒。",
            "effect": "羿俯身搭箭，准备张弓。",
            "driver": "A051",
            "requirements": [
              {
                "side": "left",
                "gesture": "pinch",
                "focus": "A051",
                "motion": "pickup",
                "hint": "在预览框内捏合拇指与食指，保持约一秒。",
                "focusName": "羿"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "羿",
            "roles": {
              "left": "A051",
              "right": null
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "拉弓瞄准",
            "instruction": "羿拉开弓，瞄准持盾的凿齿。",
            "motion": "aim",
            "focus": "A051",
            "result": "弓弦绷紧。",
            "gesture": "pinch",
            "gestureHint": "在预览框内捏合拇指与食指，保持约一秒。",
            "effect": "羿张弓蓄势，等待你松指射箭。",
            "driver": "A051",
            "requirements": [
              {
                "side": "left",
                "gesture": "pinch",
                "focus": "A051",
                "motion": "aim",
                "hint": "在预览框内捏合拇指与食指，保持约一秒。",
                "focusName": "羿"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "羿",
            "roles": {
              "left": "A051",
              "right": null
            }
          },
          {
            "label": "松弦射箭",
            "instruction": "松开弓弦，向凿齿射出神箭。",
            "motion": "shoot",
            "focus": "A055",
            "result": "箭离弦而去。",
            "gesture": "release",
            "gestureHint": "在预览框内先捏住片刻，再松指张掌，保持约一秒。",
            "effect": "神箭飞向凿齿；随后凿齿退场，飞鸟归来。",
            "driver": "A051",
            "requirements": [
              {
                "side": "left",
                "gesture": "release",
                "focus": "A055",
                "motion": "shoot",
                "hint": "在预览框内先捏住片刻，再松指张掌，保持约一秒。",
                "focusName": "神箭"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "神箭",
            "roles": {
              "left": "A051",
              "right": null
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "一箭定局",
            "instruction": "箭击中凿齿，以退场表现战败身亡。",
            "motion": "fall",
            "focus": "A052",
            "result": "凿齿退场，羿收弓。",
            "gesture": "lower",
            "gestureHint": "手掌从预览框中部降到下方三分之一，停留约一秒。",
            "effect": "凿齿倒下退场，羿留在原野。",
            "driver": "A052",
            "requirements": [
              {
                "side": "left",
                "gesture": "lower",
                "focus": "A052",
                "motion": "fall",
                "hint": "手掌从预览框中部降到下方三分之一，停留约一秒。",
                "focusName": "凿齿"
              }
            ],
            "automatic": true,
            "ensemble": [],
            "focusName": "凿齿",
            "roles": {
              "left": "A052",
              "right": null
            }
          },
          {
            "label": "飞鸟归来",
            "instruction": "让受惊的飞鸟重新越过水面。",
            "motion": "fly",
            "focus": "A053",
            "result": "原野归于平静。",
            "gesture": "raise",
            "gestureHint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
            "effect": "飞鸟重新飞过水面，原野归静。",
            "driver": "A053",
            "requirements": [
              {
                "side": "left",
                "gesture": "raise",
                "focus": "A053",
                "motion": "fly",
                "hint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
                "focusName": "受惊飞鸟"
              }
            ],
            "automatic": true,
            "ensemble": [],
            "focusName": "受惊飞鸟",
            "roles": {
              "left": "A053",
              "right": null
            }
          }
        ]
      }
    ]
  },
  "8": {
    "intro": "左手与右手分别牵引启和乐师；随后合力乘龙登天，奏乐起舞。",
    "scenes": [
      {
        "cues": [
          {
            "label": "听见天乐",
            "instruction": "启在祭台上循着乐声，准备乘龙。",
            "motion": "music",
            "focus": "A068",
            "result": "乐声引出登天一幕。",
            "gesture": "tap",
            "gestureHint": "在预览框内张掌，上下轻点两次，再停留约一秒。",
            "effect": "乐师随你的手势奏出节拍，启循着天乐准备召龙。",
            "driver": "A068",
            "requirements": [
              {
                "side": "right",
                "gesture": "tap",
                "focus": "A068",
                "motion": "music",
                "hint": "在预览框内张掌，上下轻点两次，再停留约一秒。",
                "focusName": "乐师"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "乐师",
            "roles": {
              "left": "A065",
              "right": "A068"
            }
          },
          {
            "label": "召来双龙",
            "instruction": "唤来青龙与赤龙，下一幕升入云海。",
            "motion": "command",
            "focus": "A065",
            "result": "双龙应召而来。",
            "gesture": "open",
            "gestureHint": "在预览框中央张开五指，掌心朝镜头，保持约一秒。",
            "effect": "启举手召龙，随后转入双龙所在的云海。",
            "driver": "A065",
            "requirements": [
              {
                "side": "left",
                "gesture": "open",
                "focus": "A065",
                "motion": "command",
                "hint": "在预览框中央张开五指，掌心朝镜头，保持约一秒。",
                "focusName": "夏后启"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "夏后启",
            "roles": {
              "left": "A065",
              "right": "A068"
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "乘龙登天",
            "instruction": "双龙载启穿越云海。",
            "motion": "ascend",
            "focus": "A066",
            "result": "双龙升至天门。",
            "gesture": "raise",
            "gestureHint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
            "effect": "双龙同时升起，启随它们登上天门。",
            "driver": "A065",
            "requirements": [
              {
                "side": "left",
                "gesture": "raise",
                "focus": "A065",
                "motion": "ascend",
                "hint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
                "focusName": "夏后启"
              },
              {
                "side": "right",
                "gesture": "raise",
                "focus": "A066",
                "motion": "ascend",
                "hint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
                "focusName": "青龙"
              }
            ],
            "automatic": false,
            "ensemble": [
              {
                "focus": "A067",
                "motion": "ascend"
              }
            ],
            "focusName": "青龙",
            "roles": {
              "left": "A065",
              "right": "A066"
            }
          },
          {
            "label": "得九辩九歌",
            "instruction": "取得天乐，准备带回人间。",
            "motion": "pickup",
            "focus": "A065",
            "result": "《九辩》《九歌》是乐曲名，不是九种声音。",
            "gesture": "pinch",
            "gestureHint": "在预览框内捏合拇指与食指，保持约一秒。",
            "effect": "启捏住天乐的音符；随后将乐舞带回人间。",
            "driver": "A065",
            "requirements": [
              {
                "side": "left",
                "gesture": "pinch",
                "focus": "A065",
                "motion": "pickup",
                "hint": "在预览框内捏合拇指与食指，保持约一秒。",
                "focusName": "夏后启"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "夏后启",
            "roles": {
              "left": "A065",
              "right": "A066"
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "奏响天乐",
            "instruction": "乐师以编钟、鼓、琴、笛合奏。",
            "motion": "music",
            "focus": "A068",
            "result": "天乐在人间响起。",
            "gesture": "tap",
            "gestureHint": "在预览框内张掌，上下轻点两次，再停留约一秒。",
            "effect": "乐师与乐器随节拍摆动。",
            "driver": "A068",
            "requirements": [
              {
                "side": "left",
                "gesture": "tap",
                "focus": "A068",
                "motion": "music",
                "hint": "在预览框内张掌，上下轻点两次，再停留约一秒。",
                "focusName": "乐师"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "乐师",
            "roles": {
              "left": "A068",
              "right": "A069"
            }
          },
          {
            "label": "随乐起舞",
            "instruction": "指挥舞者随乐起舞。",
            "motion": "dance",
            "focus": "A069",
            "result": "水上盛典开场。",
            "gesture": "turn",
            "gestureHint": "在预览框内张掌，将手腕向一侧倾斜，再保持约一秒。",
            "effect": "乐师随左手打拍，舞者随右手旋舞，水面荡起节奏涟漪。",
            "driver": "A069",
            "requirements": [
              {
                "side": "left",
                "gesture": "tap",
                "focus": "A068",
                "motion": "music",
                "hint": "在预览框内张掌，上下轻点两次，再停留约一秒。",
                "focusName": "乐师"
              },
              {
                "side": "right",
                "gesture": "turn",
                "focus": "A069",
                "motion": "dance",
                "hint": "在预览框内张掌，将手腕向一侧倾斜，再保持约一秒。",
                "focusName": "舞者"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "舞者",
            "roles": {
              "left": "A068",
              "right": "A069"
            }
          }
        ]
      }
    ]
  },
  "9": {
    "intro": "一只手，捧日、浴日，引日轮升空。",
    "scenes": [
      {
        "cues": [
          {
            "label": "捧起太阳",
            "instruction": "羲和来到甘渊，捧起太阳灵体。",
            "motion": "pickup",
            "focus": "A081",
            "result": "太阳映亮水面。",
            "gesture": "pinch",
            "gestureHint": "在预览框内捏合拇指与食指，保持约一秒。",
            "effect": "羲和俯身捧日，身旁的日光升起。",
            "driver": "A081",
            "requirements": [
              {
                "side": "left",
                "gesture": "pinch",
                "focus": "A081",
                "motion": "pickup",
                "hint": "在预览框内捏合拇指与食指，保持约一秒。",
                "focusName": "羲和"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "羲和",
            "roles": {
              "left": "A081",
              "right": null
            }
          },
          {
            "label": "移向水池",
            "instruction": "把太阳轻轻移至甘渊水中。",
            "motion": "approach",
            "focus": "A083",
            "result": "准备浴日。",
            "gesture": "sway",
            "gestureHint": "在预览框内张掌，向左或右移约一掌宽，再停留约一秒。",
            "effect": "太阳移向甘渊，随后进入浴日场景。",
            "driver": "A081",
            "requirements": [
              {
                "side": "left",
                "gesture": "sway",
                "focus": "A083",
                "motion": "approach",
                "hint": "在预览框内张掌，向左或右移约一掌宽，再停留约一秒。",
                "focusName": "太阳灵体"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "太阳灵体",
            "roles": {
              "left": "A081",
              "right": null
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "浴日",
            "instruction": "以水沐浴太阳，让金色涟漪散开。",
            "motion": "bath",
            "focus": "A083",
            "result": "羲和浴日于甘渊。",
            "gesture": "lower",
            "gestureHint": "手掌从预览框中部降到下方三分之一，停留约一秒。",
            "effect": "太阳沉向水面，金色涟漪散开。",
            "driver": "A081",
            "requirements": [
              {
                "side": "left",
                "gesture": "lower",
                "focus": "A083",
                "motion": "bath",
                "hint": "手掌从预览框中部降到下方三分之一，停留约一秒。",
                "focusName": "太阳灵体"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "太阳灵体",
            "roles": {
              "left": "A081",
              "right": null
            }
          },
          {
            "label": "举起日轮",
            "instruction": "把沐浴后的太阳举起。",
            "motion": "rise",
            "focus": "A083",
            "result": "太阳将启程；轮值细节为舞台扩写。",
            "gesture": "raise",
            "gestureHint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
            "effect": "日轮升起，随后来到扶桑树旁。",
            "driver": "A081",
            "requirements": [
              {
                "side": "left",
                "gesture": "raise",
                "focus": "A083",
                "motion": "rise",
                "hint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
                "focusName": "太阳灵体"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "太阳灵体",
            "roles": {
              "left": "A081",
              "right": null
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "金乌展翼",
            "instruction": "金乌从扶桑展翼而起。",
            "motion": "fly",
            "focus": "A082",
            "result": "金乌伴着日光飞行。",
            "gesture": "raise",
            "gestureHint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
            "effect": "金乌展翼向上飞起。",
            "driver": "A082",
            "requirements": [
              {
                "side": "left",
                "gesture": "raise",
                "focus": "A082",
                "motion": "fly",
                "hint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
                "focusName": "金乌"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "金乌",
            "roles": {
              "left": "A082",
              "right": null
            }
          },
          {
            "label": "日出东方",
            "instruction": "引日轮升空，照亮水上群山。",
            "motion": "rise",
            "focus": "A083",
            "result": "天光越过群山。",
            "gesture": "raise",
            "gestureHint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
            "effect": "太阳升空，日光映上水面。",
            "driver": "A083",
            "requirements": [
              {
                "side": "left",
                "gesture": "raise",
                "focus": "A083",
                "motion": "rise",
                "hint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
                "focusName": "太阳灵体"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "太阳灵体",
            "roles": {
              "left": "A083",
              "right": null
            }
          }
        ]
      }
    ]
  },
  "10": {
    "intro": "一只手，捧月、浴月，让月光照向人间。",
    "scenes": [
      {
        "cues": [
          {
            "label": "捧起月亮",
            "instruction": "常羲来到水边，捧起一轮月亮。",
            "motion": "pickup",
            "focus": "A092",
            "result": "月亮映出银色微光。",
            "gesture": "pinch",
            "gestureHint": "在预览框内捏合拇指与食指，保持约一秒。",
            "effect": "常羲俯身捧月，月光从水边升起。",
            "driver": "A092",
            "requirements": [
              {
                "side": "left",
                "gesture": "pinch",
                "focus": "A092",
                "motion": "pickup",
                "hint": "在预览框内捏合拇指与食指，保持约一秒。",
                "focusName": "常羲"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "常羲",
            "roles": {
              "left": "A092",
              "right": null
            }
          },
          {
            "label": "浴月",
            "instruction": "将月亮轻轻浸入水中。",
            "motion": "bath",
            "focus": "A095",
            "result": "银色水纹缓缓散开。",
            "gesture": "lower",
            "gestureHint": "手掌从预览框中部降到下方三分之一，停留约一秒。",
            "effect": "月亮浸向水面，银色涟漪散开。",
            "driver": "A092",
            "requirements": [
              {
                "side": "left",
                "gesture": "lower",
                "focus": "A095",
                "motion": "bath",
                "hint": "手掌从预览框中部降到下方三分之一，停留约一秒。",
                "focusName": "银色月球"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "银色月球",
            "roles": {
              "left": "A092",
              "right": null
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "转动月轮",
            "instruction": "转动月相圆环，演绎月光的变化。",
            "motion": "phase",
            "focus": "A096",
            "result": "月轮缓缓转动；月相机制是互动扩写。",
            "gesture": "turn",
            "gestureHint": "在预览框内张掌，将手腕向一侧倾斜，再保持约一秒。",
            "effect": "月相圆环缓缓转动；随后星使鸟飞过。",
            "driver": "A092",
            "requirements": [
              {
                "side": "left",
                "gesture": "turn",
                "focus": "A096",
                "motion": "phase",
                "hint": "在预览框内张掌，将手腕向一侧倾斜，再保持约一秒。",
                "focusName": "月相圆环"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "月相圆环",
            "roles": {
              "left": "A092",
              "right": null
            }
          },
          {
            "label": "点亮星空",
            "instruction": "让星使鸟穿过夜空，带起星光。",
            "motion": "fly",
            "focus": "A094",
            "result": "十二月与星光映入水池。",
            "gesture": "raise",
            "gestureHint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
            "effect": "星使鸟升向夜空。",
            "driver": "A094",
            "requirements": [
              {
                "side": "left",
                "gesture": "raise",
                "focus": "A094",
                "motion": "fly",
                "hint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
                "focusName": "星使鸟"
              }
            ],
            "automatic": true,
            "ensemble": [],
            "focusName": "星使鸟",
            "roles": {
              "left": "A094",
              "right": null
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "引月升空",
            "instruction": "让月亮升起，照向山路。",
            "motion": "rise",
            "focus": "A095",
            "result": "月光沿着水面铺开。",
            "gesture": "raise",
            "gestureHint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
            "effect": "月亮升起，月光照向山路。",
            "driver": "A093",
            "requirements": [
              {
                "side": "left",
                "gesture": "raise",
                "focus": "A095",
                "motion": "rise",
                "hint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
                "focusName": "银色月球"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "银色月球",
            "roles": {
              "left": "A093",
              "right": null
            }
          },
          {
            "label": "照亮归途",
            "instruction": "把柔和的月光送至人家窗前。",
            "motion": "illuminate",
            "focus": "A093",
            "result": "夜色温柔，水戏落幕。",
            "gesture": "open",
            "gestureHint": "在预览框中央张开五指，掌心朝镜头，保持约一秒。",
            "effect": "月光转亮，水上故事温柔收尾。",
            "driver": "A093",
            "requirements": [
              {
                "side": "left",
                "gesture": "open",
                "focus": "A093",
                "motion": "illuminate",
                "hint": "在预览框中央张开五指，掌心朝镜头，保持约一秒。",
                "focusName": "月灵"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "月灵",
            "roles": {
              "left": "A093",
              "right": null
            }
          }
        ]
      }
    ]
  },
  "16": {
    "intro": "一只手，随旅人进入青丘，握住护符辨认归路。",
    "scenes": [
      {
        "cues": [
          {
            "label": "循声入林",
            "instruction": "旅人听见婴儿般的声音，走近青丘。",
            "motion": "approach",
            "focus": "A103",
            "result": "九尾狐从林间现身。",
            "gesture": "sway",
            "gestureHint": "在预览框内张掌，向左或右移约一掌宽，再停留约一秒。",
            "effect": "旅人走向青丘，随后九尾狐现身。",
            "driver": "A103",
            "requirements": [
              {
                "side": "left",
                "gesture": "sway",
                "focus": "A103",
                "motion": "approach",
                "hint": "在预览框内张掌，向左或右移约一掌宽，再停留约一秒。",
                "focusName": "旅人"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "旅人",
            "roles": {
              "left": "A103",
              "right": null
            }
          },
          {
            "label": "九尾展开",
            "instruction": "让九尾狐展开尾扇。",
            "motion": "reveal",
            "focus": "A102",
            "result": "狐影引入下一幕。",
            "gesture": "open",
            "gestureHint": "在预览框中央张开五指，掌心朝镜头，保持约一秒。",
            "effect": "九尾狐现身舒展，随后进入迷雾。",
            "driver": "A102",
            "requirements": [
              {
                "side": "left",
                "gesture": "open",
                "focus": "A102",
                "motion": "reveal",
                "hint": "在预览框中央张开五指，掌心朝镜头，保持约一秒。",
                "focusName": "九尾狐"
              }
            ],
            "automatic": true,
            "ensemble": [],
            "focusName": "九尾狐",
            "roles": {
              "left": "A102",
              "right": null
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "幻影成阵",
            "instruction": "展开镜像石门，让九尾幻影与迷雾出现。",
            "motion": "mist",
            "focus": "A102",
            "result": "九岔幻境为舞台原创情节。",
            "gesture": "sway",
            "gestureHint": "在预览框内张掌，向左或右移约一掌宽，再停留约一秒。",
            "effect": "狐影摆动，迷雾变浓。",
            "driver": "A102",
            "requirements": [
              {
                "side": "left",
                "gesture": "sway",
                "focus": "A102",
                "motion": "mist",
                "hint": "在预览框内张掌，向左或右移约一掌宽，再停留约一秒。",
                "focusName": "九尾狐"
              }
            ],
            "automatic": true,
            "ensemble": [],
            "focusName": "九尾狐",
            "roles": {
              "left": "A102",
              "right": null
            }
          },
          {
            "label": "握住护符",
            "instruction": "旅人握住鸟羽护符，辨认归路。",
            "motion": "pickup",
            "focus": "A103",
            "result": "旅人停下，等待鸟鸣。",
            "gesture": "pinch",
            "gestureHint": "在预览框内捏合拇指与食指，保持约一秒。",
            "effect": "旅人握住护符；随后灌灌鸟将带路。",
            "driver": "A103",
            "requirements": [
              {
                "side": "left",
                "gesture": "pinch",
                "focus": "A103",
                "motion": "pickup",
                "hint": "在预览框内捏合拇指与食指，保持约一秒。",
                "focusName": "旅人"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "旅人",
            "roles": {
              "left": "A103",
              "right": null
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "循鸟鸣辨路",
            "instruction": "让灌灌鸟引路，旅人循声前行。",
            "motion": "fly",
            "focus": "A104",
            "result": "前方出现清晰的山口。",
            "gesture": "raise",
            "gestureHint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
            "effect": "灌灌鸟飞向山口，为旅人引路。",
            "driver": "A104",
            "requirements": [
              {
                "side": "left",
                "gesture": "raise",
                "focus": "A104",
                "motion": "fly",
                "hint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
                "focusName": "灌灌鸟"
              }
            ],
            "automatic": true,
            "ensemble": [],
            "focusName": "灌灌鸟",
            "roles": {
              "left": "A104",
              "right": null
            }
          },
          {
            "label": "散雾归途",
            "instruction": "散开迷雾，九尾狐留在远处高台。",
            "motion": "clear",
            "focus": "A102",
            "result": "幻境落幕；原典并未记载这段旅人历险。",
            "gesture": "open",
            "gestureHint": "在预览框中央张开五指，掌心朝镜头，保持约一秒。",
            "effect": "雾色消散，九尾狐留在远处，旅人找到归路。",
            "driver": "A102",
            "requirements": [
              {
                "side": "left",
                "gesture": "open",
                "focus": "A102",
                "motion": "clear",
                "hint": "在预览框中央张开五指，掌心朝镜头，保持约一秒。",
                "focusName": "九尾狐"
              }
            ],
            "automatic": true,
            "ensemble": [],
            "focusName": "九尾狐",
            "roles": {
              "left": "A102",
              "right": null
            }
          }
        ]
      }
    ]
  },
  "20": {
    "intro": "一只手，随歌声交接角色，让鸾凤与百兽起舞。",
    "scenes": [
      {
        "cues": [
          {
            "label": "鸾鸟起歌",
            "instruction": "让鸾鸟唱出第一句。",
            "motion": "music",
            "focus": "A113",
            "result": "歌声越过湖面。",
            "gesture": "tap",
            "gestureHint": "在预览框内张掌，上下轻点两次，再停留约一秒。",
            "effect": "鸾鸟随歌声轻摆，水面泛起涟漪。",
            "driver": "A113",
            "requirements": [
              {
                "side": "left",
                "gesture": "tap",
                "focus": "A113",
                "motion": "music",
                "hint": "在预览框内张掌，上下轻点两次，再停留约一秒。",
                "focusName": "鸾鸟"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "鸾鸟",
            "roles": {
              "left": "A113",
              "right": null
            }
          },
          {
            "label": "凤凰展翼",
            "instruction": "凤凰展翼，与歌声相和。",
            "motion": "fly",
            "focus": "A114",
            "result": "彩羽映入水中。",
            "gesture": "raise",
            "gestureHint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
            "effect": "凤凰振翼升起，与鸾鸟相和。",
            "driver": "A114",
            "requirements": [
              {
                "side": "left",
                "gesture": "raise",
                "focus": "A114",
                "motion": "fly",
                "hint": "手掌从预览框中部抬到上方三分之一，停留约一秒。",
                "focusName": "凤凰"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "凤凰",
            "roles": {
              "left": "A114",
              "right": null
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "百兽聚集",
            "instruction": "鹿、熊、白鹤与灵兔来到水边。",
            "motion": "approach",
            "focus": "A115",
            "result": "百兽相群而处。",
            "gesture": "sway",
            "gestureHint": "在预览框内张掌，向左或右移约一掌宽，再停留约一秒。",
            "effect": "鹿向水边走来，百兽聚在一起。",
            "driver": "A115",
            "requirements": [
              {
                "side": "left",
                "gesture": "sway",
                "focus": "A115",
                "motion": "approach",
                "hint": "在预览框内张掌，向左或右移约一掌宽，再停留约一秒。",
                "focusName": "鹿"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "鹿",
            "roles": {
              "left": "A115",
              "right": null
            }
          },
          {
            "label": "击鼓合舞",
            "instruction": "击鼓与悬铃相和，指挥百兽共舞。",
            "motion": "dance",
            "focus": "A116",
            "result": "水面倒影随节拍摇动。",
            "gesture": "turn",
            "gestureHint": "在预览框内张掌，将手腕向一侧倾斜，再保持约一秒。",
            "effect": "百兽随节拍摆动，倒影与水纹相和。",
            "driver": "A116",
            "requirements": [
              {
                "side": "left",
                "gesture": "turn",
                "focus": "A116",
                "motion": "dance",
                "hint": "在预览框内张掌，将手腕向一侧倾斜，再保持约一秒。",
                "focusName": "熊"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "熊",
            "roles": {
              "left": "A116",
              "right": null
            }
          }
        ]
      },
      {
        "cues": [
          {
            "label": "彩羽旋舞",
            "instruction": "凤凰张翼，花瓣随舞散开。",
            "motion": "dance",
            "focus": "A114",
            "result": "彩羽、花瓣与水纹交映。",
            "gesture": "turn",
            "gestureHint": "在预览框内张掌，将手腕向一侧倾斜，再保持约一秒。",
            "effect": "凤凰旋舞，彩羽映入水中。",
            "driver": "A114",
            "requirements": [
              {
                "side": "left",
                "gesture": "turn",
                "focus": "A114",
                "motion": "dance",
                "hint": "在预览框内张掌，将手腕向一侧倾斜，再保持约一秒。",
                "focusName": "凤凰"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "凤凰",
            "roles": {
              "left": "A114",
              "right": null
            }
          },
          {
            "label": "群舞谢幕",
            "instruction": "众生共同谢幕，让余音留在水上。",
            "motion": "music",
            "focus": "A113",
            "result": "鸾鸟自歌，凤鸟自舞。",
            "gesture": "tap",
            "gestureHint": "在预览框内张掌，上下轻点两次，再停留约一秒。",
            "effect": "鸾鸟与百兽共舞，完成谢幕。",
            "driver": "A113",
            "requirements": [
              {
                "side": "left",
                "gesture": "tap",
                "focus": "A113",
                "motion": "music",
                "hint": "在预览框内张掌，上下轻点两次，再停留约一秒。",
                "focusName": "鸾鸟"
              }
            ],
            "automatic": false,
            "ensemble": [],
            "focusName": "鸾鸟",
            "roles": {
              "left": "A113",
              "right": null
            }
          }
        ]
      }
    ]
  }
};
