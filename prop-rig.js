/* Image-space attachment points, measured on the archived character art.
 * Coordinates describe the fitted image, not its CSS box or the whole stage. */
(function(){
  const bind=(owner,x,y,width,angle=0,variant=null)=>({owner,x,y,width,angle,variant});
  const equipment={
    A025:bind('A022',.67,.43,.35),
    A041:bind('A039',.72,.42,.7),A042:bind('A034',.76,.45,.55),
    A054:bind('A051',.87,.20,.40),A056:bind('A051',.29,.45,.22),
    A057:bind('A052',.49,.43,.51),A058:bind('A052',.76,.43,.35),
    A070:bind('A066',.49,.45,.3),
    A074:bind('A068',.67,.285,.82,14),
    A073:bind('A065',.61,.45,.57),
    A085:bind('A081',.60,.47,.6),
    A105:bind('A103',.48,.35,.17),
    A121:bind('A116',.57,.47,.7),A119:bind('A116',.76,.28,.32)
  };
  const pickups={
    A010:{id:'A013',...bind('A010',.56,.45,.13,0,'stone')},
    A011:{id:'A013',...bind('A011',.697,.345,.105,0,'stone')},
    A051:{id:'A055',...bind('A051',.63,.20,.68,-24),flip:true},
    A081:{id:'A083',...bind('A081',.66,.31,.32)},
    A092:{id:'A095',...bind('A092',.60,.34,.29)},
    A103:{id:'A105',...bind('A103',.53,.41,.19)}
  };
  function fit(width,height,imageWidth,imageHeight){
    const scale=Math.min(width/imageWidth,height/imageHeight),w=imageWidth*scale,h=imageHeight*scale;
    return {x:(width-w)/2,y:(height-h)/2,width:w,height:h};
  }
  function point(box,binding){return {x:box.x+box.width*binding.x,y:box.y+box.height*binding.y,width:box.width*binding.width};}
  // Only one pebble, not the whole pile, is carried. This is an atlas window for
  // runtime composition; the original asset is not changed or overwritten.
  const variants={stone:{crop:[.315,.448,.39,.325],outline:[[.02,.51],[.13,.2],[.32,.02],[.58,.015],[.81,.25],[.99,.7],[.94,.9],[.67,.99],[.28,.96],[.04,.8]]}};
  const hands={A068:[[[.544,.26],[.572,.236],[.601,.214],[.645,.201],[.679,.209],[.685,.225],[.651,.225],[.642,.235],[.681,.242],[.67,.255],[.644,.248],[.607,.274],[.564,.29]],[[.705,.216],[.729,.211],[.75,.222],[.763,.245],[.762,.264],[.744,.291],[.717,.278],[.721,.257],[.704,.249],[.696,.237],[.727,.24],[.733,.23],[.71,.231]]]};
  window.PuppetRig={equipment,pickups,fit,point,variants,hands};
})();
