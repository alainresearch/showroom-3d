import * as THREE from 'three';
import { setBoxUVInMetres } from './materials.js';

// Original quiet contemporary furnishing study. Proportions and material
// relationships reference the supplied direction; these are not branded CAD.
export function addLivingFurniture({ parent, materials, colliders }) {
  const root=new THREE.Group();root.name='静奢 · 曲线沙发与木构休闲椅';parent.add(root);
  function material(key,fallback,colour){const m=(materials[key]||materials[fallback]).clone();m.name='Quiet salon / '+key;if(!materials[key]&&colour)m.color.set(colour);m.normalScale?.multiplyScalar(.65);return m;}
  const sand=material('sandFabric','fabric','#d4cbbb');
  const linen=material('sandFabric','linen','#ded9ce');linen.color.multiplyScalar(1.06);
  const sage=material('sageFabric','fabric','#8e9786');
  const oak=material('warmOak','oak','#c9b18d');
  const smoke=material('smokedOak','darkWood','#8d8071');
  const stone=material('travertine','stone','#d3c9b5');stone.roughness=1;
  const bronze=material('brushedBronze','bronze','#756b58');bronze.roughness=Math.max(bronze.roughness,.50);
  const charcoal=new THREE.MeshStandardMaterial({color:'#45463f',roughness:.83});
  const ceramic=new THREE.MeshStandardMaterial({color:'#c1beb0',roughness:.77});
  const paper=new THREE.MeshStandardMaterial({color:'#e4dfd2',roughness:1});
  const shade=new THREE.MeshStandardMaterial({color:'#e9e1cc',emissive:'#e2c99b',emissiveIntensity:.14,roughness:.95});
  const seam=sand.clone();seam.name='Quiet salon / tone-on-tone textile seam';seam.color.multiplyScalar(.945);
  const sageSeam=sage.clone();sageSeam.color.multiplyScalar(.945);
  const woodPlug=oak.clone();woodPlug.name='Quiet salon / flush timber join';woodPlug.color.multiplyScalar(.90);
  const stoneEdge=stone.clone();stoneEdge.color.multiplyScalar(.91);
  const smokeEdge=smoke.clone();smokeEdge.color.multiplyScalar(.91);
  function item(name,x,z,yaw=0){const g=new THREE.Group();g.name=name;g.position.set(x,0,z);g.rotation.y=yaw;root.add(g);return g;}
  function mesh(geo,mat,g){const o=new THREE.Mesh(geo,mat);o.castShadow=!mat.transparent;o.receiveShadow=true;g.add(o);return o;}
  function box(g,x,y,z,w,h,d,mat){const geo=new THREE.BoxGeometry(w,h,d);setBoxUVInMetres(geo,w,h,d);const o=mesh(geo,mat,g);o.position.set(x,y,z);return o;}
  function soft(g,x,y,z,w,h,d,r,mat,detail=7){
    const geo=new THREE.BoxGeometry(w,h,d,detail,detail,detail),p=geo.attributes.position,n=geo.attributes.normal;r=Math.min(r,w*.48,h*.48,d*.48);
    const half=new THREE.Vector3(w/2-r,h/2-r,d/2-r),v=new THREE.Vector3(),c=new THREE.Vector3(),q=new THREE.Vector3();
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);c.set(THREE.MathUtils.clamp(v.x,-half.x,half.x),THREE.MathUtils.clamp(v.y,-half.y,half.y),THREE.MathUtils.clamp(v.z,-half.z,half.z));q.subVectors(v,c).normalize();v.copy(c).addScaledVector(q,r);p.setXYZ(i,v.x,v.y,v.z);n.setXYZ(i,q.x,q.y,q.z);}
    setBoxUVInMetres(geo,w,h,d);geo.computeBoundingSphere();const o=mesh(geo,mat,g);o.position.set(x,y,z);return o;
  }
  function cyl(g,x,y,z,r,h,mat,top=r,segments=28){const o=mesh(new THREE.CylinderGeometry(top,r,h,segments),mat,g);o.position.set(x,y,z);return o;}
  function beam(g,a,b,w,d,mat){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p),o=soft(g,0,0,0,w,v.length(),d,.003,mat,3);o.position.copy(p).add(q).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o;}
  function thread(g,points,mat=seam,closed=false,segments=48){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed,'centripetal'),segments,.0017,5,closed),mat,g);}
  function roundedOutline(w,h,r){
    const points=[];
    for(const [x,y,a0] of [[w/2-r,h/2-r,0],[-w/2+r,h/2-r,Math.PI/2],[-w/2+r,-h/2+r,Math.PI],[w/2-r,-h/2+r,Math.PI*1.5]])for(let i=0;i<5;i++){const a=a0+i*Math.PI/8;points.push([x+Math.cos(a)*r,y+Math.sin(a)*r]);}
    return points;
  }
  function cushionEdge(g,o,w,h,r,vertical=false,mat=seam){
    // Sibling detail group survives static batching while following the cushion.
    const edge=new THREE.Group();edge.position.copy(o.position);edge.quaternion.copy(o.quaternion);g.add(edge);
    const points=roundedOutline(w+.001,h+.001,r).map(([x,y])=>vertical?[x,y,0]:[x,0,y]);
    thread(edge,points,mat,true);return edge;
  }
  function pillowDrape(o,w,h,d){
    const geo=o.geometry,p=geo.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i),front=Math.max(0,z/(d/2));
      const fold=Math.exp(-(((x-w*.31)/(w*.15))**2))*Math.sin(y*51+x*17)+.6*Math.exp(-(((x+w*.32)/(w*.13))**2))*Math.sin(y*45-x*21);
      p.setZ(i,z+fold*.0016*front);
    }
    geo.computeVertexNormals();geo.computeBoundingSphere();
  }
  function solid(x,z,w,d,yaw=0){const a=Math.abs(Math.cos(yaw)),b=Math.abs(Math.sin(yaw)),dx=(a*w+b*d)/2,dz=(b*w+a*d)/2;colliders.push({minX:x-dx,maxX:x+dx,minZ:z-dz,maxZ:z+dz,type:'furniture'});}
  function shapeXZ(commands){const s=new THREE.Shape();for(const [kind,...a] of commands){if(kind==='M')s.moveTo(a[0],-a[1]);else if(kind==='L')s.lineTo(a[0],-a[1]);else if(kind==='C')s.bezierCurveTo(a[0],-a[1],a[2],-a[3],a[4],-a[5]);}s.closePath();return s;}
  function slab(g,shape,y,thickness,mat,bevel=.025){const geo=new THREE.ExtrudeGeometry(shape,{depth:thickness,steps:1,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:20});geo.rotateX(-Math.PI/2);const o=mesh(geo,mat,g);o.position.y=y;return o;}
  function footprint(scale=1){
    const commands=[['M',-1.47,.10],['C',-1.62,.40,-1.47,.57,-1.16,.55],['C',-.65,.51,-.48,.26,0,.27],['C',.52,.28,.79,.55,1.22,.54],['C',1.52,.55,1.61,.31,1.43,.07],['C',1.15,-.28,.59,-.49,0,-.48],['C',-.59,-.48,-1.19,-.26,-1.47,.10]];
    return shapeXZ(commands.map(([k,...v])=>[k,...v.map(x=>x*scale)]));
  }
  function sweptBack(g){
    const curve=new THREE.CatmullRomCurve3([
      [-1.40,.52,.25],[-1.45,.59,.02],[-1.13,.64,-.26],[-.55,.65,-.44],
      [0,.65,-.46],[.60,.645,-.43],[1.17,.61,-.22],[1.43,.53,.14]
    ].map(p=>new THREE.Vector3(...p)),false,'centripetal');
    const vertices=[],uv=[],indices=[],steps=100,sides=20;
    for(let i=0;i<=steps;i++){
      const t=i/steps,p=curve.getPointAt(t),tan=curve.getTangentAt(t),normal=new THREE.Vector3(tan.z,0,-tan.x).normalize();
      const radius=.115+.025*Math.sin(t*Math.PI),hh=.19+.01*Math.sin(t*Math.PI);
      for(let j=0;j<=sides;j++){
        const a=j/sides*Math.PI*2;
        // Three local cloth drapes, at millimetre scale, leave the silhouette calm.
        let fold=0;for(const c of [.13,.53,.86])fold+=.0022*Math.sin((t-c)*155)*Math.exp(-(((t-c)/.047)**2));
        fold*=Math.cos(a)*Math.cos(a);
        vertices.push(p.x+normal.x*(radius+fold)*Math.cos(a),p.y+(hh+fold*.3)*Math.sin(a),p.z+normal.z*(radius+fold)*Math.cos(a));uv.push(t*3.1,j/sides*.8);
        if(i<steps&&j<sides){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
      }
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();mesh(geo,sand,g);
    for(const [x,y,z] of [[-1.40,.52,.25],[1.43,.53,.14]]){const cap=mesh(new THREE.SphereGeometry(1,20,12),sand,g);cap.scale.set(.115,.19,.115);cap.position.set(x,y,z);}
    const topJoin=[];for(let i=1;i<48;i++){const t=i/48,p=curve.getPointAt(t);topJoin.push([p.x,p.y+.191+.01*Math.sin(t*Math.PI),p.z]);}thread(g,topJoin,seam,false,72);
  }
  // A continuous sweeping back and crescent seat keep the main silhouette low.
  {
    const g=item('砂灰弧形沙发 · 连续包裹靠背',13.98,20.05,-Math.PI/2);
    slab(g,footprint(.96),.105,.055,smoke,.018);
    slab(g,footprint(),.19,.23,sand,.055);
    slab(g,footprint(.985),.355,.085,linen,.043);
    sweptBack(g);
    // One understated centre join and two broad loose cushions.
    box(g,0,.449,-.055,.004,.003,.62,sand);
    for(const [x,z,rz] of [[-.73,-.16,-.12],[.69,-.15,.10]]){const p=soft(g,x,.66,z,.43,.40,.17,.06,linen,12);p.rotation.x=-.20;p.rotation.z=rz;pillowDrape(p,.43,.40,.17);cushionEdge(g,p,.43,.40,.06,true);}
    for(const x of [-1.12,1.12])for(const z of [-.16,.26])cyl(g,x,.06,z,.055,.12,smoke,.055,16);
    solid(13.98,20.05,3.14,1.13,-Math.PI/2);
  }
  // Window-side sofa: open timber base, thin rails and softly pitched cushions.
  {
    const g=item('窗边木框亚麻沙发',11.32,22.22,Math.PI),w=3.04;
    soft(g,0,.28,0,w,.085,.96,.018,oak,5);
    for(const x of [-1.32,1.32])for(const z of [-.34,.34])box(g,x,.13,z,.07,.26,.07,oak);
    box(g,0,.18,.34,w-.19,.07,.05,oak);
    for(const side of [-1,1]){box(g,side*1.45,.44,0,.045,.36,.78,oak);soft(g,side*1.45,.63,0,.09,.055,.87,.016,oak,5);}
    box(g,0,.49,-.385,w-.12,.38,.035,oak);
    for(const x of [-.70,.70]){
      const seat=soft(g,x,.415,.035,1.37,.19,.80,.055,linen,8);cushionEdge(g,seat,1.37,.80,.055);
      const back=soft(g,x,.65,-.31,1.36,.43,.20,.065,sand,8);back.rotation.x=-.13;
      cushionEdge(g,back,1.36,.43,.065,true);
    }
    for(const [x,mat] of [[-.95,sage],[.93,linen]]){const p=soft(g,x,.65,-.06,.37,.37,.16,.055,mat,11);p.rotation.x=-.22;p.rotation.z=x<0?-.08:.08;pillowDrape(p,.37,.37,.16);cushionEdge(g,p,.37,.37,.055,true,mat===sage?sageSeam:seam);}
    solid(11.32,22.22,3.04,.98,Math.PI);
  }
  function loungeChair(x,z,yaw){
    const g=item('低背木构休闲椅',x,z,yaw);
    for(const side of [-1,1]){
      beam(g,[side*.29,.035,.29],[side*.29,.61,.22],.045,.048,oak);
      beam(g,[side*.29,.035,-.27],[side*.29,.83,-.36],.045,.048,oak);
      soft(g,side*.31,.63,-.015,.065,.055,.73,.013,oak,4);
      beam(g,[side*.29,.26,-.27],[side*.29,.26,.29],.04,.04,oak);
      // Small flush timber plugs indicate the arm/post junction, not ornament.
      for(const z of [-.30,.24]){const pin=cyl(g,side*.344,.628,z,.006,.002,woodPlug,.006,12);pin.rotation.z=Math.PI/2;}
    }
    beam(g,[-.29,.245,.24],[.29,.245,.24],.034,.034,oak);
    beam(g,[-.29,.245,-.25],[.29,.245,-.25],.034,.034,oak);
    box(g,0,.38,.02,.66,.055,.64,oak);
    const seat=soft(g,0,.45,.06,.66,.15,.67,.065,sand,8);cushionEdge(g,seat,.66,.67,.065);
    const back=soft(g,0,.69,-.29,.65,.43,.15,.055,sage,8);back.rotation.x=-.16;
    cushionEdge(g,back,.65,.43,.055,true,sageSeam);
    box(g,0,.78,-.356,.66,.055,.045,oak);
    solid(x,z,.77,.85,yaw);return g;
  }
  loungeChair(11.45,17.72,.03);loungeChair(12.44,17.76,-.14);

  // Two related but unequal tables: honed stone and low smoked timber.
  const stoneShape=shapeXZ([['M',-.56,-.69],['C',-.37,-.98,.20,-.99,.48,-.70],['C',.72,-.36,.69,.31,.43,.73],['C',.17,.98,-.31,.91,-.56,.58],['C',-.78,.23,-.76,-.35,-.56,-.69]]);
  const woodShape=shapeXZ([['M',-.46,-.43],['C',-.12,-.64,.37,-.58,.49,-.24],['C',.66,.12,.34,.54,-.02,.57],['C',-.43,.61,-.64,.23,-.55,-.13],['C',-.53,-.25,-.53,-.34,-.46,-.43]]);
  const main=item('浅洞石有机形茶几',11.67,20.0,.06);
  slab(main,stoneShape,.32,.055,stone,.006);
  const stoneRebate=slab(main,stoneShape,.308,.012,stoneEdge,.003);stoneRebate.scale.set(.966,1,.966);
  for(const z of [-.45,.45]){const leg=cyl(main,0,.16,z,.22,.32,stone,.18,32);leg.scale.x=.74;}
  solid(11.67,20.0,1.48,1.9,.06);
  const secondary=item('烟熏木有机形茶几',10.51,20.69,-.18);
  slab(secondary,woodShape,.405,.045,smoke,.007);
  const timberRebate=slab(secondary,woodShape,.393,.012,smokeEdge,.003);timberRebate.scale.set(.965,1,.965);
  box(secondary,0,.21,-.25,.57,.39,.045,smoke);box(secondary,0,.21,.24,.57,.39,.045,smoke);
  solid(10.51,20.69,1.16,1.18,-.18);
  // Sparse, low objects avoid turning the tables into display plinths.
  box(main,.01,.396,-.40,.37,.036,.28,charcoal);box(main,.01,.42,-.40,.35,.008,.26,paper);
  const bowl=mesh(new THREE.LatheGeometry([[0,0],[.04,0],[.13,.025],[.18,.08],[.18,.09],[.16,.085],[.11,.035],[0,.018]].map(v=>new THREE.Vector2(...v)),32),charcoal,secondary);bowl.position.set(.02,.454,.04);
  // One side table and a diffused, framed lantern; no polished decorative metal.
  {
    const g=item('木边几与柔光台灯',9.12,22.35);
    soft(g,0,.48,0,.54,.045,.54,.025,oak,6);
    box(g,-.19,.25,0,.05,.46,.42,oak);box(g,.19,.25,0,.05,.46,.42,oak);
    box(g,0,.12,0,.40,.035,.42,oak);
    box(g,0,.52,0,.23,.035,.20,smoke);
    box(g,0,.71,0,.16,.32,.14,shade);
    for(const x of [-.096,.096])for(const z of [-.086,.086])box(g,x,.72,z,.014,.39,.014,bronze);
    for(const y of [.54,.91]){box(g,0,y,0,.22,.017,.20,bronze);}
    solid(9.12,22.35,.54,.54);
  }
  // A small stone end table beside the primary sofa carries a single vessel.
  {
    const g=item('石边几与陶器',14.58,21.95);
    cyl(g,0,.23,0,.22,.46,stone,.18,36);
    const vase=mesh(new THREE.LatheGeometry([[0,0],[.06,0],[.095,.05],[.085,.14],[.045,.22],[.045,.245],[.035,.245],[.035,.22]].map(v=>new THREE.Vector2(...v)),28),ceramic,g);vase.position.y=.46;
    solid(14.58,21.95,.44,.44);
  }
  let triangles=0,meshes=0;
  root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;}});
  root.userData={provenance:'original-contemporary-design-study',dimensions:'design-estimates-not-branded-CAD',triangleCount:triangles,meshCountBeforeBatch:meshes};
  return {group:root,triangles,meshes};
}
