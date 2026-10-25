import * as THREE from 'three';
import { setBoxUVInMetres } from './materials.js?v=fd6261ec4708';

// Shape studies from the published 385 m² sample-room photographs. These are
// original meshes, not manufacturer CAD, scans, or photograph-derived textures.
// Furniture dimensions and its location within the plan remain approximations.
export function addLivingFurniture({ parent, materials, colliders }) {
  const root = new THREE.Group();
  root.name = '385样板间实拍参照 · 客厅家具 0.3';
  parent.add(root);
  const black = materials.leather.clone(); black.name = '黑皮 · 低矮包裹沙发'; black.color.set('#242421'); black.normalScale?.set(.24,.24);
  const cream = materials.leather.clone(); cream.name = '奶白皮面 · 不对称卧榻'; cream.color.set('#e8e1d5'); cream.normalScale?.set(.12,.12);
  const beige = materials.fabric.clone(); beige.name = '米色扶手椅'; beige.color.set('#c9bea9'); beige.normalScale?.set(.16,.16);
  const stone = materials.stone.clone(); stone.name = '浅灰石材 · 薄托盘茶几'; stone.color.set('#d3d7d2');
  const bronze = materials.gold.clone(); bronze.name = '抛光黄铜盘与柱脚'; bronze.color.set('#b7a071'); bronze.roughness=.20;
  const chrome = (materials.brushedMetal || materials.bronze).clone(); chrome.color.set('#d1d5d1'); chrome.metalness=.95; chrome.roughness=.14;
  const red = new THREE.MeshStandardMaterial({color:'#9f4d2e',roughness:.29,metalness:.32});
  const seam = black.clone(); seam.color.set('#181a18'); seam.roughness=.9;
  const ivorySeam = cream.clone(); ivorySeam.color.set('#c9c1b4'); ivorySeam.roughness=1;
  const amber = new THREE.MeshPhysicalMaterial({color:'#a9581e',roughness:.16,metalness:0,transparent:true,opacity:.78,transmission:.16,thickness:.025,ior:1.45,side:THREE.DoubleSide,depthWrite:false});

  function item(name,x,z,yaw=0) {
    const g=new THREE.Group();g.name=name;g.position.set(x,0,z);g.rotation.y=yaw;root.add(g);return g;
  }
  function mesh(geometry,material,g) {
    const m=new THREE.Mesh(geometry,material);m.castShadow=!material.transparent;m.receiveShadow=true;g.add(m);return m;
  }
  function cylinder(g,x,y,z,r,h,mat,top=r,segments=32) {
    const m=mesh(new THREE.CylinderGeometry(top,r,h,segments),mat,g);m.position.set(x,y,z);return m;
  }
  function box(g,x,y,z,w,h,d,mat) {
    const geo=new THREE.BoxGeometry(w,h,d);setBoxUVInMetres(geo,w,h,d);const m=mesh(geo,mat,g);m.position.set(x,y,z);return m;
  }
  function soft(g,x,y,z,w,h,d,r,mat,{detail=14,wrinkle=0}={}) {
    const geo=new THREE.BoxGeometry(w,h,d,detail,detail,detail),p=geo.attributes.position,n=geo.attributes.normal;
    r=Math.min(r,w*.485,h*.485,d*.485);
    const half=new THREE.Vector3(w/2-r,h/2-r,d/2-r),v=new THREE.Vector3(),c=new THREE.Vector3(),q=new THREE.Vector3();
    for(let i=0;i<p.count;i++) {
      v.fromBufferAttribute(p,i);c.set(THREE.MathUtils.clamp(v.x,-half.x,half.x),THREE.MathUtils.clamp(v.y,-half.y,half.y),THREE.MathUtils.clamp(v.z,-half.z,half.z));
      q.subVectors(v,c).normalize();v.copy(c).addScaledVector(q,r);
      // Irregular, millimetre-scale drape concentrates at the edge of upholstery.
      if(wrinkle) {
        const edge=.25+.75*Math.pow(Math.abs(v.x)/(w/2),2);
        const fold=(Math.sin(v.x*29+v.y*17+v.z*11)+.42*Math.sin(v.x*67-v.y*31+v.z*23))*.5;
        v.addScaledVector(q,fold*wrinkle*edge);
      }
      p.setXYZ(i,v.x,v.y,v.z);n.setXYZ(i,q.x,q.y,q.z);
    }
    setBoxUVInMetres(geo,w,h,d);
    if(wrinkle)geo.computeVertexNormals();
    geo.computeBoundingSphere();const m=mesh(geo,mat,g);m.position.set(x,y,z);return m;
  }
  function tube(g,points,r,mat,segments=48,closed=false) {
    const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)),closed,'centripetal');
    return mesh(new THREE.TubeGeometry(curve,segments,r,8,closed),mat,g);
  }
  function rectPath(w,d,r,y,zShift=0,xShift=0) {
    const points=[];
    for(const [cx,cz,start] of [[w/2-r,d/2-r,0],[-w/2+r,d/2-r,Math.PI/2],[-w/2+r,-d/2+r,Math.PI],[w/2-r,-d/2+r,Math.PI*1.5]])for(let i=0;i<7;i++) {
      const a=start+i*Math.PI/12;points.push([xShift+cx+Math.cos(a)*r,y,zShift+cz+Math.sin(a)*r]);
    }
    return points;
  }
  function solid(x,z,w,d,yaw=0) {
    const a=Math.abs(Math.cos(yaw)),b=Math.abs(Math.sin(yaw));
    const dx=(a*w+b*d)/2,dz=(b*w+a*d)/2;
    colliders.push({minX:x-dx,maxX:x+dx,minZ:z-dz,maxZ:z+dz,type:'furniture'});
  }
  function ellipticalSweep(g,curve,mat,{steps=112,sides=24,radius=.16,height=.30,wrinkles=0}={}) {
    const vertices=[],uv=[],indices=[];
    for(let i=0;i<=steps;i++) {
      const t=i/steps,p=curve.getPointAt(t),tan=curve.getTangentAt(t);
      const normal=new THREE.Vector3(tan.z,0,-tan.x).normalize();
      const h=typeof height==='function'?height(t,p):height;
      const r=typeof radius==='function'?radius(t,p):radius;
      for(let j=0;j<=sides;j++) {
        const angle=j/sides*Math.PI*2;
        const folds=wrinkles*(Math.sin(t*157+angle*3.3)*.55+Math.sin(t*83-angle*5.1)*.3)*Math.pow(Math.abs(Math.cos(angle)),1.5);
        vertices.push(p.x+normal.x*(r+folds)*Math.cos(angle),p.y+h*Math.sin(angle)+folds*.45,p.z+normal.z*(r+folds)*Math.cos(angle));
        uv.push(t*3.4,j/sides*.8);
        if(i<steps&&j<sides){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
      }
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();return mesh(geo,mat,g);
  }

  // The low black sofa has a continuous inflated outer cover, not a row of
  // upright dining-chair-like backs. Its long axis follows the plan's z axis.
  {
    const g=item('低矮黑皮沙发 · 连续包裹靠背',13.98,20.05,-Math.PI/2),w=3.02;
    soft(g,0,.18,.015,w,.24,1.06,.11,black,{wrinkle:.003});
    const path=new THREE.CatmullRomCurve3([
      [-1.34,.43,.38],[-1.40,.47,.06],[-1.32,.52,-.29],[-.92,.555,-.41],
      [0,.57,-.43],[.92,.555,-.41],[1.32,.52,-.29],[1.40,.47,.06],[1.34,.43,.38]
    ].map(p=>new THREE.Vector3(...p)));
    ellipticalSweep(g,path,black,{height:(t,p)=>.25+(p.y-.43)*.40,radius:.17,wrinkles:.007});
    for(const side of [-1,1]){const cap=mesh(new THREE.SphereGeometry(1,24,16),black,g);cap.scale.set(.17,.25,.13);cap.position.set(side*1.34,.43,.38);}
    for(const x of [-.61,.61]) {
      soft(g,x,.40,.08,1.21,.19,.75,.09,black,{detail:16,wrinkle:.0038});
      tube(g,rectPath(1.16,.70,.085,.48,.08,x),.003,seam,56,true);
    }
    // Only two loose pillows are visible in the photographs.
    for(const [x,z,rz] of [[-.62,-.12,-.15],[.08,-.16,.12]]) {
      const p=soft(g,x,.69,z,.54,.42,.18,.08,black,{detail:18,wrinkle:.006});p.rotation.x=-.29;p.rotation.z=rz;
    }
    for(const x of [-1.16,1.16])for(const z of [-.32,.33])cylinder(g,x,.055,z,.029,.11,bronze);
    // Cover stitching near the ground and across the broad outer back.
    tube(g,[[-1.46,.17,.30],[-1.49,.16,-.1],[-1.26,.17,-.52],[0,.18,-.60],[1.26,.17,-.52],[1.49,.16,-.1],[1.46,.17,.30]],.0035,seam,96);
    solid(13.98,20.05,3.08,1.09,-Math.PI/2);
  }

  // One broad cream chaise with a short asymmetric back and one chunky end.
  // Its free, flat end faces the fireplace; there are no three equal seat pads.
  {
    const g=item('奶白不对称卧榻 · 单块连续座面',11.32,22.22,Math.PI);
    soft(g,0,.20,.015,3.10,.29,1.03,.06,cream,{wrinkle:.0015});
    soft(g,.18,.405,.015,2.69,.17,1.005,.057,cream,{detail:18,wrinkle:.0018});
    soft(g,-1.29,.48,.015,.48,.55,1.03,.048,cream,{detail:16,wrinkle:.002});
    soft(g,-.85,.585,-.395,1.44,.48,.25,.055,cream,{detail:16,wrinkle:.002});
    const pillow=soft(g,-.45,.66,-.10,.61,.43,.18,.07,cream,{detail:18,wrinkle:.0025});pillow.rotation.x=-.34;pillow.rotation.z=.13;
    tube(g,rectPath(2.61,.94,.045,.479,.015,.18),.0025,ivorySeam,64,true);
    for(const x of [-1.25,-.3,.65,1.3])box(g,x,.045,.0,.08,.09,.65,materials.dark);
    solid(11.32,22.22,3.10,1.04,Math.PI);
  }

  // Two low, wide chairs next to the timber panel. The padded crescent tapers
  // towards the arms; it is not a tall cylindrical barrel.
  for(const [x,z,yaw] of [[11.5,17.68,0],[12.42,17.72,-.13]]) {
    const g=item('米色低弧背椅',x,z,yaw);
    soft(g,0,.43,.025,.68,.16,.62,.075,beige,{detail:16});
    const points=[];
    for(let i=0;i<=20;i++){const a=-.14+(Math.PI+.28)*i/20;points.push(new THREE.Vector3(.31*Math.cos(a),.59+.055*Math.sin(a),-.245*Math.sin(a)-.025));}
    ellipticalSweep(g,new THREE.CatmullRomCurve3(points),beige,{steps:72,sides:18,radius:(t)=>.075+.012*Math.sin(t*Math.PI),height:(t)=>.11+.055*Math.sin(t*Math.PI)});
    for(const xx of [-.24,.24])for(const zz of [-.20,.20]){const foot=cylinder(g,xx,.20,zz,.031,.40,materials.dark,.027,16);foot.rotation.z=xx*.12;foot.rotation.x=zz*.10;}
    solid(x,z,.78,.72,yaw);
  }

  // The black lounge chair has a bright continuous tubular sled and loose,
  // softly wrinkled cushions. The photographed chair is beside the fireplace.
  {
    const g=item('黑皮金属管架单椅',9.64,17.85,-.65);
    soft(g,0,.39,.04,.79,.21,.76,.10,black,{detail:18,wrinkle:.004});
    const back=soft(g,0,.68,-.27,.80,.53,.26,.125,black,{detail:18,wrinkle:.007});back.rotation.x=-.27;
    for(const side of [-1,1]) {
      const xx=side*.425;
      tube(g,[[xx,.08,.35],[xx,.065,-.32],[xx,.15,-.47],[xx,.63,-.43],[xx,.75,-.28],[xx,.67,.20],[xx,.52,.37],[xx,.18,.38]],.017,chrome,88);
      soft(g,side*.39,.58,.06,.20,.20,.67,.09,black,{detail:16,wrinkle:.004});
    }
    tube(g,[[-.425,.13,-.40],[0,.13,-.43],[.425,.13,-.40]],.014,chrome,24);
    solid(9.64,17.85,.92,.96,-.65);
  }

  function roundedShape(w,d,r,inset=0) {
    const W=w-inset*2,D=d-inset*2,R=Math.max(.015,r-inset),x=-W/2,z=-D/2,s=new THREE.Shape();
    s.moveTo(x+R,z);s.lineTo(x+W-R,z);s.quadraticCurveTo(x+W,z,x+W,z+R);
    s.lineTo(x+W,z+D-R);s.quadraticCurveTo(x+W,z+D,x+W-R,z+D);
    s.lineTo(x+R,z+D);s.quadraticCurveTo(x,z+D,x,z+D-R);s.lineTo(x,z+R);s.quadraticCurveTo(x,z,x+R,z);return s;
  }
  function slab(g,shape,thickness,y,mat) {
    const geo=new THREE.ExtrudeGeometry(shape,{depth:thickness,steps:1,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,curveSegments:16});geo.rotateX(-Math.PI/2);
    const m=mesh(geo,mat,g);m.position.y=y;return m;
  }
  function stoneTray(x,z,w,d,h,yaw=0) {
    const g=item('浅灰石材薄托盘茶几',x,z,yaw),r=.22;
    slab(g,roundedShape(w,d,r),.032,h-.032,stone);
    const rim=roundedShape(w,d,r);const hole=roundedShape(w,d,r,.022);rim.holes.push(new THREE.Path(hole.getPoints(40)));
    slab(g,rim,.026,h-.003,stone);
    // Folded thin plate supports leave a visible void beneath the top.
    for(const zz of [-d*.37,d*.37])soft(g,0,(h-.035)/2,zz,w*.78,h-.035,.045,.012,stone,{detail:4});
    solid(x,z,w-.04,d-.04,yaw);
    return g;
  }
  const nearTray=stoneTray(11.9,20.08,1.0,1.86,.36,.035);
  const farTray=stoneTray(10.55,20.8,.94,1.58,.42,-.045);

  function goldTable(x,z,r=.34,h=.50) {
    const g=item('黄铜浅盘边几 · 细槽柱脚',x,z);
    const profile=[new THREE.Vector2(0,0),new THREE.Vector2(r*.8,0),new THREE.Vector2(r,.022),new THREE.Vector2(r*1.01,.039),new THREE.Vector2(r*.98,.045),new THREE.Vector2(r*.79,.025),new THREE.Vector2(0,.021)];
    const top=mesh(new THREE.LatheGeometry(profile,64),bronze,g);top.position.y=h-.02;top.scale.z=.82;
    cylinder(g,0,(h-.04)/2,0,.095,h-.04,bronze);
    for(let i=0;i<24;i++){const a=i*Math.PI/12;cylinder(g,Math.cos(a)*.096,(h-.04)/2,Math.sin(a)*.096,.009,h-.04,bronze,.009,8);}
    cylinder(g,0,.025,0,.13,.05,bronze);
    return g;
  }
  goldTable(11.15,20.25,.37,.52);goldTable(8.99,22.38,.29,.48);

  function copperSide(x,z,yaw=0) {
    const g=item('赭红椭圆桶形边几',x,z,yaw);
    const points=[new THREE.Vector2(0,.015),new THREE.Vector2(.21,.015),new THREE.Vector2(.22,.05),new THREE.Vector2(.29,.44),new THREE.Vector2(.29,.46),new THREE.Vector2(.278,.462),new THREE.Vector2(.272,.448),new THREE.Vector2(0,.448)];
    const m=mesh(new THREE.LatheGeometry(points,64),red,g);m.scale.z=.68;
    return g;
  }
  copperSide(14.69,21.67,-.15);copperSide(9.37,19.68,.22);

  // Low books and small amber glass vessels match the observed scale. The
  // former tall generic vase in the centre of the room has been removed.
  const pink=new THREE.MeshStandardMaterial({color:'#caa8a5',roughness:.8});
  const paper=new THREE.MeshStandardMaterial({color:'#dbd7cb',roughness:.95});
  box(nearTray,-.02,.392,-.24,.38,.036,.28,pink);box(nearTray,-.02,.413,-.24,.35,.009,.26,paper);box(nearTray,-.03,.433,-.25,.34,.032,.26,materials.dark);
  function amberVase(g,x,z,y,h=.27,r=.09,seed=0) {
    const points=[new THREE.Vector2(0,0),new THREE.Vector2(r*.55,0),new THREE.Vector2(r,.08*h/.27),new THREE.Vector2(r*.90,h*.54),new THREE.Vector2(r*.65,h*.82),new THREE.Vector2(r*.98,h)];
    const geo=new THREE.LatheGeometry(points,40),p=geo.attributes.position;
    for(let i=0;i<p.count;i++){const px=p.getX(i),py=p.getY(i),pz=p.getZ(i),a=Math.atan2(pz,px),q=py/h;const crimp=1+.09*Math.sin(a*5+seed+q*8)*q*q;p.setXYZ(i,px*crimp,py+(Math.sin(a*5+seed)*.016+Math.sin(a*9)*.009)*Math.pow(q,8),pz*crimp);}
    geo.computeVertexNormals();const m=mesh(geo,amber,g);m.position.set(x,y,z);return m;
  }
  amberVase(farTray,-.10,-.20,.43,.29,.09,1);amberVase(farTray,.13,-.38,.43,.23,.075,3);
  // A small original folded shell ornament, rather than a cone-shaped plant.
  const shellMat=materials.white.clone();shellMat.color.set('#e5dac3');
  const ornament=mesh(new THREE.TorusGeometry(.10,.025,10,36,Math.PI*1.6),shellMat,nearTray);ornament.position.set(.05,.43,.38);ornament.rotation.set(Math.PI/2.7,.3,.6);ornament.scale.set(1.7,.7,1);

  let triangles=0,meshes=0;
  root.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;});
  root.userData={provenance:'published-385-sample-room-photo-shape-study',dimensions:'estimated-not-manufacturer-CAD',triangleCount:triangles,meshCountBeforeBatch:meshes};
  return {group:root,triangles,meshes};
}
