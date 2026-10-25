import * as THREE from 'three';
import { setBoxUVInMetres } from './materials.js';

// Original geometry reconstructed from observed sample-room details. Dimensions
// of fittings are estimates; this module never changes the traced wall layout.
export function addKitchenDetails({parent,ceilings,materials:m,colliders}) {
  const g=new THREE.Group();g.name='实拍参照 · 中西厨精细柜体';parent.add(g);
  const stone=m.slabStone||m.stone,steel=m.brushedMetal;
  const glass=new THREE.MeshPhysicalMaterial({color:'#eef4ef',roughness:.06,metalness:0,transmission:.70,thickness:.018,ior:1.45});glass.name='Tianlan / clearCrystal';
  const oven=new THREE.MeshStandardMaterial({color:'#101818',roughness:.12,metalness:.55});oven.name='Tianlan / ovenGlass';
  const recess=m.kitchen.clone();recess.color.multiplyScalar(.91);
  function mesh(geo,mat,p=g){const o=new THREE.Mesh(geo,mat);o.castShadow=!mat.transparent&&!(mat.transmission>.1);o.receiveShadow=true;p.add(o);return o;}
  function box(x,y,z,w,h,d,mat=m.kitchen,p=g){const geo=new THREE.BoxGeometry(w,h,d);setBoxUVInMetres(geo,w,h,d);const o=mesh(geo,mat,p);o.position.set(x,y,z);return o;}
  function cyl(x,y,z,r,h,mat=steel,p=g){const o=mesh(new THREE.CylinderGeometry(r,r,h,24),mat,p);o.position.set(x,y,z);return o;}
  function tube(points,r,mat=steel,p=g){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),28,r,8,false),mat,p);}
  function panel(x,z,width,height,y,dir,drawer=false) {
    const face=x+dir*.014;
    box(face,y,z,.025,height,width,recess);
    const rail=.025;
    for(const zz of [z-width/2+rail/2,z+width/2-rail/2])box(face+dir*.018,y,zz,.025,height,rail,m.kitchen);
    for(const yy of [y-height/2+rail/2,y+height/2-rail/2])box(face+dir*.018,yy,z,.025,rail,width,m.kitchen);
    box(face+dir*.016,y,z,.018,height-.085,width-.085,m.kitchen);
    const hy=drawer?y:y+height/2-.10,hz=drawer?z:z+(dir>0?.15:-.15);
    if(drawer){tube([[face+dir*.048,hy,hz-.09],[face+dir*.072,hy,hz-.09],[face+dir*.072,hy,hz+.09],[face+dir*.048,hy,hz+.09]],.006,m.gold);}
    else tube([[face+dir*.05,hy-.18,hz],[face+dir*.075,hy-.18,hz],[face+dir*.075,hy,hz],[face+dir*.05,hy,hz]],.006,m.gold);
  }
  function counterTop(x,z,w,d,sink=null) {
    const y=.905,h=.055;
    if(!sink){box(x,y,z,w,h,d,stone);return;}
    const [sx,sz]=sink;
    // One continuous slab with an elliptical aperture. Rectangular strips leave
    // visible corner holes outside the curved basin rim.
    const slab=new THREE.Shape();
    slab.moveTo(-w/2,-d/2);slab.lineTo(w/2,-d/2);slab.lineTo(w/2,d/2);slab.lineTo(-w/2,d/2);slab.closePath();
    const aperture=new THREE.Path();
    aperture.absellipse(sx-x,-(sz-z),.205,.205*.76,0,Math.PI*2,true);
    slab.holes.push(aperture);
    const geometry=new THREE.ExtrudeGeometry(slab,{depth:h,steps:1,bevelEnabled:false,curveSegments:32});
    geometry.rotateX(-Math.PI/2);
    const top=mesh(geometry,stone);top.position.set(x,y-h/2,z);
    sinkBowl(sx,sz,.932);
  }
  function sinkBowl(x,z,y) {
    const profile=[[0,-.12],[.07,-.12],[.14,-.09],[.185,-.025],[.202,0],[.218,.002],[.218,-.012]].map(v=>new THREE.Vector2(...v));
    const bowl=mesh(new THREE.LatheGeometry(profile,48),steel);bowl.scale.z=.76;bowl.position.set(x,y,z);
    cyl(x,y-.115,z,.022,.005,m.dark);
    tube([[x,y,z-.23],[x,y+.28,z-.23],[x,y+.34,z-.18],[x,y+.34,z-.06],[x,y+.26,z-.04]],.013,steel);
    cyl(x+.12,y+.025,z-.22,.022,.05,steel);box(x+.12,y+.07,z-.19,.016,.016,.08,steel);
  }
  function baseRun(x,z,d,dir,sink=null) {
    // Hollow cabinet shell leaves the undermount bowl genuinely open at the top.
    box(x,.06,z,.58,.12,d,m.darkWood);
    box(x-dir*.27,.46,z,.035,.80,d,m.kitchen);
    box(x,.46,z-d/2,.60,.80,.035,m.kitchen);box(x,.46,z+d/2,.60,.80,.035,m.kitchen);
    const n=Math.round(d/.58),width=d/n;
    for(let i=0;i<n;i++) {
      const zz=z-d/2+(i+.5)*width;
      panel(x+dir*.30,zz,width-.012,.22,.72,dir,true);
      panel(x+dir*.30,zz,width-.012,.49,.355,dir);
    }
    counterTop(x,z,.66,d+.03,sink);
    colliders.push({minX:x-.33,maxX:x+.33,minZ:z-d/2,maxZ:z+d/2,type:'furniture'});
  }
  function upperRun(x,z,d,dir,y=2.20,height=1.03) {
    box(x,y,z,.40,height,d,m.kitchen);
    const n=Math.max(1,Math.round(d/.54)),width=d/n;
    for(let i=0;i<n;i++)panel(x+dir*.21,z-d/2+(i+.5)*width,width-.012,height-.04,y,dir);
    box(x+dir*.11,y-height/2-.014,z,.20,.018,d-.04,m.glow);
  }
  baseRun(11.85,5.17,3.65,1,[11.87,5.4]);
  baseRun(14.9,4.96,3.95,-1);
  // The photographed cooking wall continues the white veined stone above the
  // worktop; leave the opposite window opening unobstructed.
  box(15.255,1.36,5.05,.025,.85,3.72,stone);
  // No solid upper cupboard across the photographed west window.
  upperRun(15.0,5.85,2.0,-1);
  upperRun(11.74,6.55,1.03,1,1.78,1.86);
  box(14.9,1.37,3.35,.66,2.74,.82,m.kitchen);
  panel(14.55,3.35,.76,.48,2.44,-1);
  for(const y of [.87,1.62]) {
    box(14.549,y,3.35,.025,.68,.64,oven);
    box(14.529,y-.065,3.35,.008,.43,.53,oven);
    tube([[14.50,y+.12,3.12],[14.475,y+.12,3.12],[14.475,y+.12,3.58],[14.50,y+.12,3.58]],.009,steel);
    const dial=cyl(14.518,y+.255,3.35,.046,.018,steel);dial.rotation.z=Math.PI/2;
    const face=cyl(14.503,y+.255,3.35,.033,.006,oven);face.rotation.z=Math.PI/2;
    box(14.495,y+.285,3.35,.006,.016,.003,m.white);
  }
  // Cooking zone: slim hood, grates, copper stockpot.
  box(14.89,.946,4.77,.55,.025,.87,m.dark);
  for(const zz of [4.51,4.98])for(const xx of [14.75,15.00]) {
    cyl(xx,.968,zz,.087,.012,m.darkWood);
    for(const a of [0,Math.PI/2]){const bar=box(xx,.98,zz,.18,.012,.012,m.dark);bar.rotation.y=a;}
  }
  box(14.91,1.90,4.77,.65,.12,.95,steel);box(15.17,2.23,4.77,.12,.58,.52,m.kitchen);
  for(let i=0;i<9;i++)box(14.88,1.832,4.40+i*.09,.43,.006,.013,m.dark);
  const copper=new THREE.MeshStandardMaterial({color:'#a7643f',roughness:.24,metalness:.85});copper.name='Tianlan / copper';
  cyl(14.78,1.105,4.55,.10,.23,copper);cyl(14.78,1.225,4.55,.105,.018,steel);cyl(14.78,1.245,4.55,.022,.028,steel);
  // Slim window shelving with sparse objects, as in the photographed kitchen.
  for(const zz of [3.60,4.60,5.65])box(11.57,1.99,zz,.035,1.08,.025,m.gold);
  for(const y of [1.49,2.04,2.55])box(11.67,y,4.62,.27,.025,2.11,m.gold);
  for(const [zz,r,hh] of [[3.90,.08,.19],[4.83,.06,.29],[5.36,.10,.16]])cyl(11.66,2.06+hh/2,zz,r,hh,m.pot);
  const sx=13.34,sz=4.97,sw=.72,sd=2.0;
  for(const xx of [sx-sw/2+.025,sx+sw/2-.025])box(xx,.44,sz,.05,.88,sd,stone);
  for(const zz of [sz-sd/2+.025,sz+sd/2-.025])box(sx,.44,zz,sw,.88,.05,stone);
  counterTop(sx,sz,sw+.02,sd+.02,[sx,4.55]);
  colliders.push({minX:sx-sw/2,maxX:sx+sw/2,minZ:sz-sd/2,maxZ:sz+sd/2,type:'furniture'});
  const bowl=mesh(new THREE.LatheGeometry([[0,0],[.06,0],[.13,.035],[.17,.09],[.17,.10],[.13,.05],[.06,.025],[0,.025]].map(v=>new THREE.Vector2(...v)),36),m.pot);bowl.position.set(13.34,.935,5.55);
  // Stone doorway and open bronze-framed glazed leaves.
  for(const xx of [12.31,14.44])box(xx,1.34,7.49,.15,2.68,.12,stone);
  box(13.375,2.64,7.49,2.28,.16,.13,stone);
  for(const [xx,sgn] of [[12.43,1],[14.32,-1]]) {
    const door=new THREE.Group();door.position.set(xx,0,7.55);door.rotation.y=sgn*.95;g.add(door);
    box(sgn*.41,1.27,0,.79,2.5,.012,m.glass,door);
    for(const dx of [0,sgn*.81])box(dx,1.27,0,.022,2.54,.033,m.gold,door);
    for(const y of [.015,2.525])box(sgn*.405,y,0,.81,.024,.033,m.gold,door);
    box(sgn*.70,1.20,-.03,.012,.34,.04,m.gold,door);
    const endX=xx+sgn*.81*Math.cos(.95),endZ=7.55-.81*Math.sin(.95);
    colliders.push({minX:Math.min(xx,endX)-.018,maxX:Math.max(xx,endX)+.018,minZ:endZ-.018,maxZ:7.568,type:'furniture'});
  }
  // Layered teardrop crystal cluster; one shared transmissive material is batched.
  const fixture=new THREE.Group();fixture.name='实拍参照 · 厨房水滴吊灯';ceilings.add(fixture);
  cyl(13.35,3.065,4.95,.085,.035,steel,fixture);
  tube([[13.35,3.03,4.95],[13.35,2.65,4.95]],.008,steel,fixture);
  for(let ring=0;ring<3;ring++) {
    const radius=.17+ring*.115,count=12+ring*8;
    for(let i=0;i<count;i++) {
      const a=i*Math.PI*2/count,geo=new THREE.LatheGeometry([[.002,-.09],[.025,-.07],[.044,-.015],[.037,.04],[.008,.10],[.002,.11]].map(v=>new THREE.Vector2(...v)),12);
      const drop=mesh(geo,glass,fixture);drop.position.set(13.35+Math.cos(a)*radius,2.30+ring*.09,4.95+Math.sin(a)*radius);
    }
  }
  for(const a of [0,2.1,4.2])cyl(13.35+Math.cos(a)*.15,2.42,4.95+Math.sin(a)*.15,.025,.10,m.glow,fixture);
  return g;
}

// Two original painterly studies for the salon. Colour relationships are
// photo-informed; every mark is generated here, without copying photographed art.
// DataTexture keeps this deterministic and available to the Node geometry checks.
export function createSalonArtMaterials() {
  function painting(seed,variant) {
    const w=256,h=384,pixels=new Uint8Array(w*h*4);
    let state=seed;
    const random=()=>{state=Math.imul(state,1664525)+1013904223|0;return (state>>>0)/4294967296;};
    const grain=(x,y,s=seed)=>{let n=Math.imul(x+31,374761393)^Math.imul(y+47,668265263)^s;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
    const ground=variant?[222,216,196]:[162,169,146];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
      const i=(y*w+x)*4,t=(grain(x,y)-.5)*8+Math.sin(x*.15+y*.08)*2;
      for(let c=0;c<3;c++)pixels[i+c]=ground[c]+t;pixels[i+3]=255;
    }
    function dab(cx,cy,rx,ry,colour,alpha,mark) {
      for(let y=Math.max(0,Math.floor(cy-ry-2));y<Math.min(h,cy+ry+2);y++)for(let x=Math.max(0,Math.floor(cx-rx-2));x<Math.min(w,cx+rx+2);x++) {
        const d=((x-cx)/rx)**2+((y-cy)/ry)**2,noise=grain(x,y,mark);
        if(d>1+(noise-.5)*.16)continue;
        const feather=Math.min(1,Math.max(0,(1-d)*9));
        const dry=.55+.45*grain(x,Math.floor(y/2),mark+17);
        const a=alpha*feather*dry,i=(y*w+x)*4;
        for(let c=0;c<3;c++)pixels[i+c]=pixels[i+c]*(1-a)+(colour[c]+(noise-.5)*8)*a;
      }
    }
    function stroke(points,width,colour,alpha=1) {
      const path=new THREE.CatmullRomCurve3(points.map(([x,y])=>new THREE.Vector3(x*w,y*h,0)));
      const mark=(random()*1e8)|0,steps=Math.ceil(path.getLength()/2),v=new THREE.Vector3();
      for(let i=0;i<=steps;i++) {
        const t=i/steps;path.getPoint(t,v);
        const taper=.18+.82*Math.pow(Math.sin(Math.PI*t),.32);
        const r=width*taper*(1+.13*Math.sin(t*43+mark)+.065*Math.sin(t*109+mark*.3));
        dab(v.x,v.y,r,r*.72,colour,alpha,mark);
      }
    }
    const palette=variant?[[51,58,56],[119,126,122],[168,133,77],[203,184,129],[236,231,211],[78,102,115]]:[[35,75,85],[69,105,99],[143,156,129],[193,169,99],[225,214,177],[41,95,117]];
    // Broad irregular washes establish asymmetrical colour masses.
    for(let i=0;i<28;i++) {
      const colour=palette[i%palette.length],x=random()*w,y=random()*h;
      dab(x,y,25+random()*49,24+random()*65,colour,.16+random()*.19,(random()*1e7)|0);
    }
    if(!variant) {
      for(let i=0;i<14;i++) {
        const x=-.12+i*.095,shift=(random()-.5)*.2;
        stroke([[x+shift,1.09],[x+.22,.69],[x-.10,.36],[x+.08,-.08]],8+random()*16,palette[i%3],.38+random()*.42);
      }
      for(let i=0;i<11;i++) {
        const x=.05+random()*.9,y=.2+random()*.7,sign=i%2?1:-1;
        stroke([[x,y+.26],[x+sign*.10,y+.08],[x+sign*.26,y-.15]],5+random()*8,palette[3+i%2],.85);
      }
      stroke([[.10,.92],[.36,.64],[.49,.40],[.39,.10]],2.2,[225,220,193],.8);
      stroke([[.68,.94],[.55,.73],[.73,.51],[.92,.40]],2.6,[215,199,151],.7);
    } else {
      for(let i=0;i<19;i++) {
        const y=-.15+i*.07,x=.15+random()*.7;
        stroke([[x-.27,y+.22],[x+.04,y+.10],[x-.06,y-.03],[x+.22,y-.20]],8+random()*17,palette[i%6],.48+random()*.4);
      }
      for(let i=0;i<13;i++) {
        const x=random(),y=random();
        stroke([[x-.15,y+.16],[x-.05,y+.01],[x+.20,y-.13]],3+random()*8,i%3?[240,235,216]:[173,141,81],.8);
      }
      stroke([[.08,.69],[.36,.54],[.29,.29],[.60,.08]],3.8,[45,54,57],.75);
    }
    // Fine broken scumbles make the broad fields read as paint, not flat logos.
    for(let i=0;i<100;i++) {
      const x=random(),y=random(),colour=palette[(random()*palette.length)|0];
      stroke([[x-.02,y+.05],[x+.025,y],[x+.06,y-.035]],.8+random()*2.0,colour,.18+random()*.25);
    }
    const texture=new THREE.DataTexture(pixels,w,h,THREE.RGBAFormat);
    texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;
    texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.anisotropy=4;texture.needsUpdate=true;
    texture.name=variant?'Original study · ochre and chalk':'Original study · blue green reeds';
    const material=new THREE.MeshStandardMaterial({map:texture,color:'#ffffff',roughness:.94});
    material.name=texture.name;return material;
  }
  return [painting(7163,0),painting(9349,1)];
}

export function addSalonDisplay({parent,materials:m}) {
  const g=new THREE.Group();g.name='实拍参照 · 壁炉旁暖光陈列架';parent.add(g);
  const cream=new THREE.MeshStandardMaterial({color:'#ded0b4',roughness:.82});
  const clay=new THREE.MeshStandardMaterial({color:'#b78b52',roughness:.66});
  const pale=new THREE.MeshStandardMaterial({color:'#e9e0ce',roughness:.52});
  const charcoal=new THREE.MeshStandardMaterial({color:'#302e29',roughness:.42});
  function mesh(geo,mat,x,y,z){const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
  function box(x,y,z,w,h,d,mat){const geo=new THREE.BoxGeometry(w,h,d);setBoxUVInMetres(geo,w,h,d);return mesh(geo,mat,x,y,z);}
  function vessel(z,y,r,h,mat,open=.38) {
    const points=[[0,0],[r*.58,0],[r*.92,h*.16],[r,h*.47],[r*.83,h*.77],[r*open,h*.94],[r*open,h],[r*(open-.08),h],[r*(open-.08),h*.90]].map(v=>new THREE.Vector2(...v));
    return mesh(new THREE.LatheGeometry(points,32),mat,8.42,y,z);
  }
  box(8.17,1.4,17.65,.14,2.8,1.3,m.walnut);
  box(8.25,1.41,17.65,.025,2.70,1.23,cream);
  for(const y of [.28,.82,1.36,1.9,2.44]) {
    box(8.37,y,17.65,.47,.035,1.22,m.slabStone||m.stone);
    box(8.275,y+.48,17.65,.018,.016,1.15,m.glow);
  }
  vessel(17.34,2.462,.145,.31,clay);vessel(17.90,2.462,.105,.22,clay,.30);
  for(const [z,r,mat,tilt] of [[17.34,.105,pale,.23],[17.94,.09,charcoal,-.16]]) {
    const ring=mesh(new THREE.TorusGeometry(r,r*.26,10,36),mat,8.43,1.94+r,z);
    ring.rotation.set(0,Math.PI/2,tilt);ring.scale.y=1.27;
    box(8.43,1.934,z,.12,.026,.15,charcoal);
  }
  const lowBowl=vessel(17.32,1.382,.155,.10,pale,.90);lowBowl.scale.z=1.40;
  vessel(17.96,1.382,.08,.32,pale,.43);
  const spine=new THREE.MeshStandardMaterial({color:'#79756b',roughness:.9});
  box(8.43,.857,17.85,.23,.038,.36,spine);box(8.43,.889,17.83,.22,.026,.32,pale);
  vessel(17.34,.842,.072,.13,charcoal,.86);
  const shell=mesh(new THREE.TorusGeometry(.10,.04,10,32,Math.PI*1.6),pale,8.43,.98,17.85);shell.rotation.set(.4,Math.PI/2,.4);shell.scale.y=1.25;
  vessel(17.83,.302,.13,.18,pale,.85);
  box(8.43,.322,17.33,.24,.045,.25,spine);
  return g;
}
