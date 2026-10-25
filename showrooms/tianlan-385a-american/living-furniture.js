import * as THREE from 'three';
import { setBoxUVInMetres } from './materials.js?v=39a1f44f4e17';

// Original American-classic furnishing proposal, not a scanned or branded set.
// Sizes are design estimates in metres; this separate case preserves the plan.
export function addLivingFurniture({ parent, materials, colliders }) {
  const root = new THREE.Group();
  root.name = '豪华美式 · 卷扶手沙发与翼背椅';
  parent.add(root);
  function clone(key,fallback,color,roughness) {
    const m=(materials[key]||materials[fallback]).clone();
    m.name='American salon / '+key;if(color)m.color.set(color);
    if(roughness!==undefined)m.roughness=roughness;
    m.normalScale?.multiplyScalar(.55);return m;
  }
  const cognac=clone('cognac','leather',materials.cognac?null:'#70412a',1);
  const cream=clone('fabric','fabric','#e7dcc5',.92);
  const velvet=clone('velvet','fabric',materials.velvet?null:'#4e5b3c',1);
  const oxblood=clone('oxblood','leather',materials.oxblood?null:'#4f2928',1);
  const wood=clone('mahogany','darkWood',materials.mahogany?null:'#75513c',.95);
  const brass=clone('brass','gold','#bda16a',.26);brass.metalness=.86;
  const stone=clone('slabStone','stone','#e3d9c3',1);
  const shade=clone('linen','linen','#fff1d2',.9);
  const dark=clone('dark','dark','#241b16',.65);
  const paper=new THREE.MeshStandardMaterial({color:'#e9dfca',roughness:1});
  const amber=new THREE.MeshPhysicalMaterial({color:'#a5672a',transparent:true,opacity:.70,transmission:.18,roughness:.12,thickness:.035,depthWrite:false});
  const lampGlow=new THREE.MeshStandardMaterial({color:'#ffe4a7',emissive:'#ffc778',emissiveIntensity:.45,roughness:.8});
  function item(name,x,z,yaw=0) {const g=new THREE.Group();g.name=name;g.position.set(x,0,z);g.rotation.y=yaw;root.add(g);return g;}
  function mesh(geo,mat,g) {const o=new THREE.Mesh(geo,mat);o.castShadow=!mat.transparent;o.receiveShadow=true;g.add(o);return o;}
  function box(g,x,y,z,w,h,d,mat) {const geo=new THREE.BoxGeometry(w,h,d);setBoxUVInMetres(geo,w,h,d);const o=mesh(geo,mat,g);o.position.set(x,y,z);return o;}
  function cyl(g,x,y,z,r,h,mat,top=r,segments=24) {const o=mesh(new THREE.CylinderGeometry(top,r,h,segments),mat,g);o.position.set(x,y,z);return o;}
  function soft(g,x,y,z,w,h,d,r,mat,detail=7) {
    const geo=new THREE.BoxGeometry(w,h,d,detail,detail,detail),p=geo.attributes.position,n=geo.attributes.normal;
    r=Math.min(r,w*.48,h*.48,d*.48);
    const half=new THREE.Vector3(w/2-r,h/2-r,d/2-r),v=new THREE.Vector3(),c=new THREE.Vector3(),q=new THREE.Vector3();
    for(let i=0;i<p.count;i++) {v.fromBufferAttribute(p,i);c.set(THREE.MathUtils.clamp(v.x,-half.x,half.x),THREE.MathUtils.clamp(v.y,-half.y,half.y),THREE.MathUtils.clamp(v.z,-half.z,half.z));q.subVectors(v,c).normalize();v.copy(c).addScaledVector(q,r);p.setXYZ(i,v.x,v.y,v.z);n.setXYZ(i,q.x,q.y,q.z);}
    setBoxUVInMetres(geo,w,h,d);geo.computeBoundingSphere();const o=mesh(geo,mat,g);o.position.set(x,y,z);return o;
  }
  function tube(g,pts,r,mat,steps=32,closed=false) {return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)),closed,'centripetal'),steps,r,6,closed),mat,g);}
  function nail(g,x,y,z,r=.009) {const o=mesh(new THREE.SphereGeometry(r,8,6),brass,g);o.position.set(x,y,z);return o;}
  function solid(x,z,w,d,yaw=0) {const a=Math.abs(Math.cos(yaw)),b=Math.abs(Math.sin(yaw)),dx=(a*w+b*d)/2,dz=(b*w+a*d)/2;colliders.push({minX:x-dx,maxX:x+dx,minZ:z-dz,maxZ:z+dz,type:'furniture'});}
  function turnedFoot(g,x,z,height=.21,r=.055) {
    const profile=[[.0,0],[r*.55,0],[r*.68,.025],[r*.67,height*.25],[r,height*.46],[r*.85,height*.63],[r*.60,height*.82],[r*.64,height],[0,height]].map(v=>new THREE.Vector2(...v));
    const o=mesh(new THREE.LatheGeometry(profile,16),wood,g);o.position.set(x,0,z);cyl(g,x,.016,z,r*.58,.026,brass,r*.58,16);return o;
  }
  function rectangularPiping(g,w,d,y,z=.05,mat=brass) {
    const r=.075,pts=[];
    for(const [cx,cz,a0] of [[w/2-r,d/2-r,0],[-w/2+r,d/2-r,Math.PI/2],[-w/2+r,-d/2+r,Math.PI],[w/2-r,-d/2+r,Math.PI*1.5]])for(let i=0;i<5;i++){const a=a0+i*Math.PI/8;pts.push([cx+Math.cos(a)*r,y,z+cz+Math.sin(a)*r]);}
    tube(g,pts,.004,mat,48,true);
  }
  // A genuinely modelled diamond-quilted panel: the leather rises between
  // restrained recessed buttons. This remains visible from both sofa sides.
  function tuftPanel(g,w,h,y,z,mat,reverse=false) {
    const nx=Math.ceil(w/.30),ny=3,geo=new THREE.PlaneGeometry(w,h,nx*6,ny*6),p=geo.attributes.position;
    const dx=w/nx,dy=h/ny,points=[];
    for(let row=0;row<=ny;row++)for(let col=0;col<=nx;col++){const x=-w/2+col*dx+(row%2?dx/2:0);if(x<w/2-.03&&x>-w/2+.03)points.push([x,-h/2+row*dy]);}
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),yy=p.getY(i),u=(x+w/2)/dx,v=(yy+h/2)/dy;
      const diamond=Math.abs(Math.sin(Math.PI*(u+v*.5))*Math.sin(Math.PI*(u-v*.5)));
      let dent=0;for(const [bx,by] of points)dent=Math.max(dent,Math.exp(-((x-bx)**2+(yy-by)**2)/.0017));
      p.setZ(i,.022+.022*diamond-.027*dent);
    }
    geo.computeVertexNormals();const panel=mesh(geo,mat,g);panel.position.set(0,y,z);if(reverse)panel.rotation.y=Math.PI;
    for(const [x,yy] of points){const button=mesh(new THREE.SphereGeometry(.010,8,6),mat,g);button.scale.z=.4;button.position.set(reverse?-x:x,y+yy,z+(reverse?-.005:.005));}
    return panel;
  }
  function classicSofa({x,z,yaw,w,mat,label,tuft=true}) {
    const g=item(label,x,z,yaw),armX=w/2-.19;
    for(const xx of [-w/2+.30,w/2-.30])for(const zz of [-.36,.36])turnedFoot(g,xx,zz,.20,.06);
    soft(g,0,.29,0,w-.12,.23,1.0,.06,mat);
    box(g,0,.225,.485,w-.25,.10,.035,wood);
    for(let i=0;i<Math.floor((w-.3)/.075);i++)nail(g,-w/2+.19+i*.075,.29,.504,.008);
    soft(g,0,.74,-.385,w-.36,.55,.29,.09,mat,9);
    if(tuft) {tuftPanel(g,w-.54,.47,.75,-.226,mat);tuftPanel(g,w-.54,.47,.75,-.539,mat,true);}
    else {
      for(const xx of [-w*.24,w*.24]){const p=soft(g,xx,.78,-.245,w*.43,.44,.20,.065,mat,8);p.rotation.x=-.10;}
    }
    for(const side of [-1,1]) {
      soft(g,side*armX,.52,.04,.31,.50,.99,.10,mat,9);
      // Broad scroll arms are equal in height to the buttoned back.
      const arm=cyl(g,side*armX,.79,.02,.195,1.06,mat,.195,32);arm.rotation.x=Math.PI/2;
      const scroll=mesh(new THREE.TorusGeometry(.137,.014,6,32,Math.PI*1.85),mat,g);scroll.position.set(side*armX,.79,.559);scroll.rotation.z=side*.30;
      for(let i=0;i<18;i++){const a=i*Math.PI*2/18;nail(g,side*armX+Math.cos(a)*.158,.79+Math.sin(a)*.158,.559,.008);}
      tube(g,[[side*armX,.60,-.51],[side*armX,.62,-.1],[side*armX,.63,.51]],.004,brass,30);
    }
    const seats=w>2.85?3:2,seatW=(w-.72)/seats;
    for(let i=0;i<seats;i++){
      const xx=-(w-.72)/2+seatW*(i+.5);soft(g,xx,.47,.11,seatW-.018,.18,.72,.065,mat,8);
      const seamGroup=new THREE.Group();seamGroup.position.x=xx;g.add(seamGroup);rectangularPiping(seamGroup,seatW-.055,.66,.556,.11,mat);
    }
    if(!tuft)for(const [xx,pillowMat] of [[-w*.26,velvet],[w*.26,cognac]]){const p=soft(g,xx,.73,.01,.38,.38,.16,.065,pillowMat,7);p.rotation.set(-.2,0,xx<0?-.12:.12);}
    solid(x,z,w,1.12,yaw);return g;
  }
  classicSofa({x:13.98,z:20.05,yaw:-Math.PI/2,w:3.08,mat:cognac,label:'深干邑皮革 · 菱格卷扶手三人沙发'});
  classicSofa({x:11.32,z:22.22,yaw:Math.PI,w:3.02,mat:cream,label:'奶油织物 · 经典卷扶手对坐沙发',tuft:false});

  function wingChair(x,z,yaw,mat=velvet,label='橄榄绿丝绒 · 翼背扶手椅') {
    const g=item(label,x,z,yaw);
    for(const xx of [-.28,.28])for(const zz of [-.28,.28])turnedFoot(g,xx,zz,.30,.043);
    soft(g,0,.37,.03,.73,.17,.77,.04,wood,5);soft(g,0,.48,.055,.69,.19,.70,.065,mat,8);
    soft(g,0,.93,-.30,.67,.80,.22,.085,mat,9);
    tuftPanel(g,.54,.57,.99,-.175,mat);
    for(const side of [-1,1]) {
      const wing=soft(g,side*.32,1.03,-.15,.16,.62,.31,.065,mat,8);wing.rotation.z=-side*.12;wing.rotation.y=side*.22;
      soft(g,side*.35,.64,.09,.16,.28,.67,.065,mat,8);
      const roll=cyl(g,side*.35,.78,.10,.085,.64,mat,.085,20);roll.rotation.x=Math.PI/2;
      for(let i=0;i<10;i++)nail(g,side*.373,.76+i*.055,-.006,.0075);
      nail(g,side*.35,.78,.43,.012);
    }
    box(g,0,.345,.39,.62,.065,.025,brass);
    solid(x,z,.86,.86,yaw);return g;
  }
  wingChair(11.45,17.72,.03);wingChair(12.48,17.74,-.13);
  wingChair(9.54,18.05,.65,oxblood,'酒红皮革 · 经典阅读扶手椅');

  // A single generous cocktail table gives the salon a quieter focal point.
  {
    const g=item('桃花心木与米白大理石 · 经典茶几',11.52,20.15,.025),w=1.24,d=1.92;
    soft(g,0,.45,0,w+.10,.09,d+.10,.065,wood,6);
    soft(g,0,.506,0,w,.045,d,.045,stone,6);
    for(const xx of [-w/2+.09,w/2-.09])for(const zz of [-d/2+.11,d/2-.11])turnedFoot(g,xx,zz,.41,.065);
    for(const xx of [-w/2+.02,w/2-.02])box(g,xx,.35,0,.055,.18,d-.12,wood);
    for(const zz of [-d/2+.02,d/2-.02])box(g,0,.35,zz,w-.12,.18,.055,wood);
    soft(g,0,.17,0,w-.17,.035,d-.20,.03,wood,5);
    rectangularPiping(g,w+.015,d+.015,.48,0,brass);
    box(g,-.20,.555,-.47,.38,.055,.50,oxblood);box(g,-.20,.589,-.47,.36,.012,.47,paper);
    box(g,-.19,.621,-.48,.32,.045,.43,wood);box(g,-.19,.649,-.48,.30,.008,.41,paper);
    cyl(g,.20,.565,.44,.22,.04,brass,.22,32);
    const bowl=mesh(new THREE.LatheGeometry([[0,0],[.04,0],[.11,.025],[.16,.09],[.16,.10],[.14,.09],[.09,.04],[0,.025]].map(v=>new THREE.Vector2(...v)),32),brass,g);bowl.position.set(.20,.59,.44);
    solid(11.52,20.15,w+.1,d+.1,.025);
  }
  function sideTable(x,z,withLamp=false) {
    const g=item(withLamp?'美式圆边几与黄铜布罩灯':'美式圆边几',x,z);
    cyl(g,0,.60,0,.31,.055,wood,.31,32);cyl(g,0,.632,0,.285,.018,stone,.285,32);
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;turnedFoot(g,Math.cos(a)*.21,Math.sin(a)*.21,.57,.038);}
    cyl(g,0,.22,0,.23,.027,wood,.23,24);
    if(withLamp){
      cyl(g,0,.674,0,.11,.055,brass,.13,24);cyl(g,0,.89,0,.026,.40,brass,.036,20);
      cyl(g,0,1.04,0,.09,.07,brass,.055,24);
      const s=mesh(new THREE.CylinderGeometry(.17,.26,.31,40,1,true),shade,g);s.position.y=1.25;
      for(const y of [1.095,1.405]){const ring=mesh(new THREE.TorusGeometry(y<1.2?.26:.17,.004,4,40),brass,g);ring.rotation.x=Math.PI/2;ring.position.y=y;}
      cyl(g,0,1.16,0,.055,.16,lampGlow,.055,16);cyl(g,0,1.43,0,.015,.06,brass,.015,16);
    }
    solid(x,z,.62,.62);return g;
  }
  sideTable(9.13,22.25,true);sideTable(14.66,21.95,true);
  const drinks=sideTable(10.40,18.52,false);
  cyl(drinks,0,.75,0,.075,.22,amber,.067,24);cyl(drinks,.15,.71,.05,.055,.14,amber,.055,24);
  let triangles=0,meshes=0;
  root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;}});
  root.userData={provenance:'original-american-classic-design',dimensions:'design-estimates-not-manufacturer-CAD',triangleCount:triangles,meshCountBeforeBatch:meshes};
  return {group:root,triangles,meshes};
}
