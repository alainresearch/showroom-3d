import * as THREE from 'three';
import { setBoxUVInMetres } from './materials.js';

// Original restrained furniture proposal, inspired by proportion and material
// relationships in the supplied references; not a reproduction of designer CAD.
export function addQuietRooms({ parent, ceilings, materials: m, colliders }) {
  const root=new THREE.Group();root.name='静雅设计 · 餐厅、主卧与书房';parent.add(root);
  function choose(key,fallback,colour,roughness=.75){const mat=(m[key]||m[fallback]).clone();if(!m[key]&&colour)mat.color.set(colour);mat.roughness=roughness;return mat;}
  const oak=choose('warmOak','oak','#c3b89f',.55),smoked=choose('smokedOak','walnut','#a29582',.62);
  const sand=choose('sandFabric','fabric','#d6d0c2',1),sage=choose('sageFabric','fabric','#919b8c',1);
  const stone=choose('travertine','stone','#e1d9c5',.73),bronze=choose('brushedBronze','bronze','#665d4d',.38);
  const bedding=m.linen.clone();bedding.color.set('#eeece5');bedding.roughness=1;
  const charcoal=choose('sandFabric','fabric','#656b65',1);charcoal.color.set('#616760');
  const softLeather=m.leather.clone();softLeather.color.set('#716c60');softLeather.roughness=.75;
  const dark=m.dark.clone();dark.color.set('#2f322e');dark.roughness=.7;
  const paper=new THREE.MeshStandardMaterial({color:'#f0eadc',roughness:.9,emissive:'#d3b480',emissiveIntensity:.20});
  const lampGlow=new THREE.MeshStandardMaterial({color:'#f9f2dd',roughness:.8,emissive:'#efcc8e',emissiveIntensity:.50});
  const ceramic=new THREE.MeshStandardMaterial({color:'#7d8679',roughness:.83});
  const pages=new THREE.MeshStandardMaterial({color:'#ded8c9',roughness:1});
  const thread=new THREE.MeshStandardMaterial({color:'#a9a598',roughness:1});
  const recess=new THREE.MeshStandardMaterial({color:'#4d4b42',roughness:.94});
  const bookMats=[smoked,ceramic,pages,dark];
  for(const [key,mat] of Object.entries({oak,smoked,sand,sage,stone,bronze,bedding,charcoal,softLeather,paper,lampGlow,ceramic}))mat.name=`Quiet rooms / ${key}`;
  function group(name,x=0,z=0,yaw=0,p=root){const g=new THREE.Group();g.name=name;g.position.set(x,0,z);g.rotation.y=yaw;p.add(g);return g;}
  function mesh(geo,mat,p=root){const o=new THREE.Mesh(geo,mat);o.castShadow=!mat.transparent&&mat!==lampGlow;o.receiveShadow=true;p.add(o);return o;}
  function box(p,x,y,z,w,h,d,mat=oak){const geo=new THREE.BoxGeometry(w,h,d);setBoxUVInMetres(geo,w,h,d);const o=mesh(geo,mat,p);o.position.set(x,y,z);return o;}
  function cylinder(p,x,y,z,r,h,mat=oak,top=r,n=24){const o=mesh(new THREE.CylinderGeometry(top,r,h,n),mat,p);o.position.set(x,y,z);return o;}
  function sphere(p,x,y,z,r,mat,s=[1,1,1]){const o=mesh(new THREE.SphereGeometry(r,16,10),mat,p);o.position.set(x,y,z);o.scale.set(...s);return o;}
  function tube(p,points,r,mat=bronze,steps=20){const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));return mesh(new THREE.TubeGeometry(curve,steps,r,6,false),mat,p);}
  function soft(p,x,y,z,w,h,d,r,mat=sand,detail=6){
    r=Math.min(r,w*.47,h*.47,d*.47);const geo=new THREE.BoxGeometry(w,h,d,detail,detail,detail),pa=geo.attributes.position,na=geo.attributes.normal;
    const half=new THREE.Vector3(w/2-r,h/2-r,d/2-r),v=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3();
    for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i);c.set(THREE.MathUtils.clamp(v.x,-half.x,half.x),THREE.MathUtils.clamp(v.y,-half.y,half.y),THREE.MathUtils.clamp(v.z,-half.z,half.z));n.subVectors(v,c).normalize();v.copy(c).addScaledVector(n,r);pa.setXYZ(i,v.x,v.y,v.z);na.setXYZ(i,n.x,n.y,n.z);}
    setBoxUVInMetres(geo,w,h,d);geo.computeBoundingSphere();const o=mesh(geo,mat,p);o.position.set(x,y,z);return o;
  }
  function shape(w,d,r){const s=new THREE.Shape(),x=-w/2,z=-d/2;s.moveTo(x+r,z);s.lineTo(x+w-r,z);s.quadraticCurveTo(x+w,z,x+w,z+r);s.lineTo(x+w,z+d-r);s.quadraticCurveTo(x+w,z+d,x+w-r,z+d);s.lineTo(x+r,z+d);s.quadraticCurveTo(x,z+d,x,z+d-r);s.lineTo(x,z+r);s.quadraticCurveTo(x,z,x+r,z);return s;}
  function slab(p,x,y,z,w,h,d,r,mat=oak){const geo=new THREE.ExtrudeGeometry(shape(w,d,r),{depth:h,steps:1,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2,curveSegments:12});geo.rotateX(-Math.PI/2);const o=mesh(geo,mat,p);o.position.set(x,y-h/2,z);return o;}
  function stitchedRect(p,x,y,z,w,d,r,mat=thread){
    // Individual flat thread strokes: one small geometry, not hundreds of nodes.
    const outline=shape(w,d,r),count=Math.ceil((2*w+2*d)/.014),points=outline.getSpacedPoints(count),vertices=[],indices=[];
    for(let i=0;i<points.length-1;i++){
      const a=points[i].clone().lerp(points[i+1],.13),b=points[i].clone().lerp(points[i+1],.68),dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz),nx=dz/len*.0008,nz=-dx/len*.0008,k=vertices.length/3;
      vertices.push(x+a.x-nx,y,z+a.y-nz,x+a.x+nx,y,z+a.y+nz,x+b.x-nx,y,z+b.y-nz,x+b.x+nx,y,z+b.y+nz);
      indices.push(k,k+2,k+1,k+1,k+2,k+3);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();return mesh(geo,mat,p);
  }
  function clothCreases(o,w,h,d,strength=.006){
    const pa=o.geometry.attributes.position;
    for(let i=0;i<pa.count;i++){
      const x=pa.getX(i),y=pa.getY(i),z=pa.getZ(i),top=THREE.MathUtils.clamp((y+h/2)/h,0,1),edge=Math.min(1,Math.abs(x)/(w*.45));
      const fine=Math.sin(x*17+z*11)*.45+Math.sin(x*31-z*23)*.22;
      const tension=Math.sin((x+z*.45)*13)*Math.exp(-Math.pow((z+d*.25)/(d*.35),2))*.45;
      pa.setY(i,y+(fine+tension)*strength*Math.pow(top,3)*(.55+.45*edge));
    }
    pa.needsUpdate=true;o.geometry.computeVertexNormals();o.geometry.computeBoundingSphere();return o;
  }
  function solid(x,z,w,d,yaw=0){const c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw)),dx=(w*c+d*s)/2,dz=(w*s+d*c)/2;colliders.push({minX:x-dx,maxX:x+dx,minZ:z-dz,maxZ:z+dz,type:'furniture'});}
  function bar(p,a,b,w,d,mat=oak){const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),delta=to.clone().sub(from),o=box(p,0,0,0,w,delta.length(),d,mat);o.position.copy(from).add(to).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
  function bentBack(p,width=.56,height=.36,y=.78,z=-.24,mat=oak,depth=.06){
    const vertices=[],indices=[],uv=[],steps=20;
    for(let i=0;i<=steps;i++){
      const u=i/steps,xx=(u-.5)*width,zz=z+.12*Math.pow((u-.5)*2,2),top=y+height/2-.025*Math.pow((u-.5)*2,2),bottom=y-height/2;
      vertices.push(xx,bottom,zz-depth/2,xx,top,zz-depth/2,xx,bottom,zz+depth/2,xx,top,zz+depth/2);
      uv.push(xx+width/2,0,xx+width/2,top-bottom,xx+width/2,0,xx+width/2,top-bottom);
      if(i<steps){const a=i*4,b=a+4;indices.push(a,b,a+1,a+1,b,b+1,a+2,a+3,b+2,a+3,b+3,b+2,a+1,b+1,a+3,a+3,b+1,b+3,a,a+2,b,a+2,b+2,b);}
    }
    indices.push(0,1,2,1,3,2);const j=steps*4;indices.push(j,j+2,j+1,j+1,j+2,j+3);
    for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();return mesh(geo,mat,p);
  }
  function chair(x,z,yaw=0,mat=sand,name='木框低背餐椅'){
    const g=group(name,x,z,yaw);
    for(const xx of [-.215,.215])for(const zz of [-.19,.19])bar(g,[xx*1.10,.025,zz*1.12],[xx,.43,zz],.035,.041,smoked);
    box(g,0,.405,0,.48,.07,.43,smoked);soft(g,0,.48,.025,.54,.105,.52,.040,mat);
    // Slender stretchers and visible end-grain joints, kept inside the chair.
    for(const xx of [-.215,.215]){
      box(g,xx,.245,0,.022,.025,.38,smoked);
      for(const zz of [-.19,.19]){
        box(g,xx+Math.sign(xx)*.020,.405,zz,.006,.025,.024,oak);
        const dowel=cylinder(g,xx+Math.sign(xx)*.024,.406,zz,.005,.007,oak,.005,10);dowel.rotation.z=Math.PI/2;
      }
    }
    const edge=shape(.507,.487,.032).getSpacedPoints(64).map(v=>[v.x,.519,.025+v.y]);edge.push(edge[0]);tube(g,edge,.0018,mat,64);
    stitchedRect(g,0,.534,.025,.48,.46,.028,thread);
    for(const xx of [-.232,.232])bar(g,[xx,.40,-.185],[xx,.88,-.19],.028,.035,smoked);
    bentBack(g,.57,.35,.79,-.235,smoked,.045);bentBack(g,.505,.285,.79,-.198,mat,.034);
    solid(x,z,.59,.61,yaw);return g;
  }
  function lantern(p,x,y,z,scale=1){
    slab(p,x,y+.025*scale,z,.22*scale,.05*scale,.18*scale,.025,stone);
    soft(p,x,y+.22*scale,z,.19*scale,.34*scale,.16*scale,.035,paper);
    soft(p,x,y+.22*scale,z+.078*scale,.15*scale,.29*scale,.006*scale,.002,lampGlow,3);
    for(const xx of [-.10,.10])box(p,x+xx*scale,y+.22*scale,z,.008*scale,.38*scale,.17*scale,bronze);
    box(p,x,y+.417*scale,z,.22*scale,.015*scale,.18*scale,bronze);
  }
  function pottery(p,x,y,z,r=.10,h=.19,mat=ceramic){
    const profile=[[.55,0],[.85,.06],[1,.30],[.93,.67],[.61,.90],[.61,1]].map(([rr,yy])=>new THREE.Vector2(rr*r,yy*h));
    const o=mesh(new THREE.LatheGeometry(profile,24),mat,p);o.position.set(x,y,z);return o;
  }
  function book(p,x,y,z,w=.26,d=.20,h=.032,cover=smoked){box(p,x,y,z,w,h,d,cover);box(p,x+.003,y+.002,z+.005,w-.012,h*.60,d-.008,pages);}

  // Dining: a pale warm-wood slab, quiet solid bases and eight slim chairs.
  {
    const x=17.43,z=20.80,g=group('静雅餐厅 · 椭圆木桌',x,z);
    slab(g,0,.768,0,1.22,.075,3.15,.55,oak);
    slab(g,0,.719,0,1.12,.025,3.00,.50,smoked);
    for(const zz of [-.88,.88]){
      // Wide tapered slabs carry the table, with a small shadow gap below.
      const geo=new THREE.CylinderGeometry(.33,.42,.64,4,1,false);geo.rotateY(Math.PI/4);const leg=mesh(geo,smoked,g);leg.position.set(0,.36,zz);leg.scale.set(1.25,1,.40);
      slab(g,0,.035,zz,.82,.07,.30,.07,smoked);
    }
    solid(x,z,1.24,3.17);
    for(const zz of [19.67,20.43,21.19,21.95]){chair(16.47,zz,Math.PI/2,sand);chair(18.39,zz,-Math.PI/2,sand);}
    const bowl=mesh(new THREE.LatheGeometry([[0,0],[.10,0],[.21,.06],[.24,.12],[.225,.132],[.20,.08],[.10,.027],[0,.027]].map(v=>new THREE.Vector2(...v)),32),ceramic,g);bowl.position.y=.81;
    for(let i=0;i<3;i++){const a=i*2.6,xx=Math.cos(a)*.10,zz=Math.sin(a)*.10;sphere(g,xx,.89,zz,.045,sage,[1,.8,1]);}
    // A low sideboard remains below the window; no mirror or tall back panel.
    const side=group('静雅餐边柜 · 低矮悬浮柜',19.43,20.72,-Math.PI/2);
    box(side,0,.12,0,2.72,.17,.29,smoked);
    soft(side,0,.48,0,3.18,.58,.43,.025,oak);
    slab(side,0,.797,0,3.22,.04,.47,.035,stone);
    for(const xx of [-1.20,-.40,.40,1.20]){
      soft(side,xx,.403,.223,.778,.374,.019,.005,oak,3);
      soft(side,xx,.678,.223,.778,.140,.019,.005,oak,3);
      // Dark grooves sit beneath the drawer lip, rather than projecting pulls.
      box(side,xx,.735,.236,.22,.007,.006,recess);
    }
    box(side,0,.601,.225,3.09,.008,.008,recess);
    for(const xx of [-.80,0,.80])box(side,xx,.48,.225,.006,.51,.008,recess);
    solid(19.43,20.72,.47,3.22);
    pottery(side,-1.18,.82,.02,.075,.24,ceramic);pottery(side,-.96,.82,-.03,.095,.16,stone);
    book(side,1.11,.845,.00,.32,.23,.045,smoked);book(side,1.06,.885,.00,.29,.23,.028,ceramic);
    const light=group('静雅餐厅 · 柔光椭圆灯',x,z,0,ceilings);
    for(const zz of [-.48,.48]){cylinder(light,0,3.071,zz,.055,.025,bronze);bar(light,[0,3.06,zz],[0,2.61,zz],.007,.007,bronze);}
    soft(light,0,2.48,0,.66,.27,1.58,.13,paper,12);
    soft(light,0,2.354,0,.53,.014,1.43,.006,lampGlow,6);
    // Three delicate seams suggest a wrapped paper surface without ornament.
    for(const zz of [-.42,0,.42])box(light,0,2.621,zz,.46,.003,.005,stone);
  }

  // Master bedroom: long horizontal headboard, low bed and floating bedside slabs.
  {
    const x=1.82,z=21.70,g=group('静雅主卧 · 低床与横向床头',x,z,Math.PI/2);
    // Recessed support creates a real shadow line under the projecting bed frame.
    box(g,0,.090,.02,1.78,.17,1.82,smoked);
    slab(g,0,.225,0,2.22,.09,2.29,.07,oak);
    slab(g,0,.272,0,2.16,.025,2.24,.055,oak);
    soft(g,0,.395,.02,2.02,.25,2.13,.075,bedding);
    clothCreases(soft(g,0,.555,.27,2.00,.15,1.62,.07,bedding,18),2.00,.15,1.62,.009);
    // Integrated horizontal timber background, gently padded at the bed itself.
    box(g,0,.76,-1.24,3.82,1.42,.12,smoked);
    box(g,0,1.477,-1.24,3.87,.035,.16,oak);
    soft(g,0,1.02,-1.145,2.26,.79,.12,.055,sand,10);
    for(const xx of [-1.45,1.45]){
      soft(g,xx,.46,-.88,.63,.14,.53,.023,oak);
      box(g,xx,.382,-.965,.40,.12,.24,smoked);
      box(g,xx,.434,-.610,.55,.005,.005,recess);
      box(g,xx,.483,-.608,.22,.006,.006,recess);
      lantern(g,xx,.54,-.93,.83);
    }
    for(const xx of [-.47,.47]){
      const lower=clothCreases(soft(g,xx,.695,-.58,.88,.20,.59,.085,bedding,12),.88,.20,.59,.004);lower.rotation.x=-.12;
      const back=soft(g,xx,.83,-.88,.77,.40,.17,.065,sand);back.rotation.x=-.15;
    }
    // Folded duvet hem below the pillows, with a slightly irregular raised edge.
    const foldGeo=new THREE.PlaneGeometry(1.96,.22,28,6);foldGeo.rotateX(-Math.PI/2);const foldPos=foldGeo.attributes.position;
    for(let i=0;i<foldPos.count;i++){const xx=foldPos.getX(i),zz=foldPos.getZ(i),u=(zz+.11)/.22;foldPos.setXYZ(i,xx,.633+.021*Math.sin(Math.PI*u)+.003*Math.sin(xx*19),zz-.39);}
    foldGeo.computeVertexNormals();const foldMaterial=bedding.clone();foldMaterial.side=THREE.DoubleSide;mesh(foldGeo,foldMaterial,g);
    // A charcoal textile falls naturally over the sides at the foot of the bed.
    const throwGeo=new THREE.PlaneGeometry(2.18,.69,30,10);throwGeo.rotateX(-Math.PI/2);const pa=throwGeo.attributes.position;
    for(let i=0;i<pa.count;i++){const xx=pa.getX(i),zz=pa.getZ(i)+.70,edge=Math.max(0,Math.abs(xx)-.94);pa.setXYZ(i,xx,.646+.009*Math.sin(xx*12+zz*11)-Math.pow(edge/.15,1.3)*.20,zz);}
    throwGeo.computeVertexNormals();const throwMat=charcoal.clone();throwMat.side=THREE.DoubleSide;mesh(throwGeo,throwMat,g);
    solid(x,z,2.24,2.31,Math.PI/2);
    solid(x-1.24,z,.16,3.87);
    // Headboard stays flush to the west, while its bedside shelves get small AABBs.
    for(const zz of [20.25,23.15])solid(.94,zz,.54,.65);
    const bench=group('静雅主卧 · 木框床尾凳',3.32,21.70,Math.PI/2);
    for(const xx of [-.68,.68])box(bench,xx,.17,0,.07,.34,.34,smoked);
    slab(bench,0,.345,0,1.78,.06,.44,.035,oak);soft(bench,0,.415,0,1.65,.105,.41,.042,sand);
    solid(3.32,21.70,1.80,.45,Math.PI/2);
    const chest=group('静雅主卧 · 低矮斗柜',2.04,19.03);
    box(chest,0,.10,0,2.02,.18,.34,smoked);soft(chest,0,.48,0,2.48,.61,.51,.03,oak);slab(chest,0,.807,0,2.53,.04,.56,.035,stone);
    for(const xx of [-.83,0,.83])for(const yy of [.337,.608]){
      soft(chest,xx,yy,.266,.806,.254,.020,.006,oak,3);
      box(chest,xx,yy+.106,.281,.22,.006,.005,recess);
    }
    box(chest,0,.472,.267,2.40,.007,.008,recess);
    for(const xx of [-.415,.415])box(chest,xx,.49,.267,.006,.51,.008,recess);
    solid(2.04,19.03,2.53,.56);
    lantern(chest,-.90,.84,.03,.86);pottery(chest,.94,.84,.04,.085,.24,stone);pottery(chest,.72,.84,-.04,.10,.16,ceramic);
    const tray=slab(chest,.18,.85,0,.50,.025,.27,.045,smoked);book(chest,.18,.882,0,.32,.22,.033,pages);
    // Plain woven rug reads as material rather than a dominant decorative motif.
    slab(root,2.14,.011,21.78,3.86,.020,4.32,.025,m.carpetLight||sand);
  }

  // Study: simple writing desk and a layered library wall, with clear entry access.
  {
    const g=group('静雅书房 · 写字台与书墙'),x=9.36,z=8.28;
    slab(g,x,.763,z,1.95,.07,.87,.055,oak);
    for(const xx of [x-.72,x+.72]){box(g,xx,.37,z,.075,.74,.67,smoked);box(g,xx,.045,z,.33,.06,.73,smoked);}
    box(g,x,.697,z,1.80,.055,.75,smoked);
    slab(g,x,.805,z+.015,1.19,.008,.51,.025,softLeather);
    stitchedRect(g,x,.810,z+.015,1.157,.477,.019,thread);
    solid(x,z,1.97,.89);
    chair(x,9.39,Math.PI,softLeather,'静雅书房 · 低背皮面木椅');
    // One carefully proportioned bank of lower panels and open shelves.
    box(g,7.91,1.25,8.64,.05,2.40,3.12,smoked);
    box(g,8.08,.41,8.64,.38,.65,3.12,oak);
    for(const zz of [7.08,8.12,9.16,10.20])box(g,8.08,1.61,zz,.38,1.67,.035,smoked);
    for(const yy of [.75,1.30,1.87,2.43])box(g,8.08,yy,8.64,.40,.035,3.17,oak);
    for(const zz of [7.60,8.64,9.68]){box(g,8.279,.41,zz,.014,.55,.95,oak);box(g,8.292,.645,zz,.009,.007,.22,recess);}
    for(const zz of [8.12,9.16])box(g,8.290,.41,zz,.008,.55,.006,recess);
    for(const [bay,row,start,count] of [[0,0,0,5],[2,0,1,4],[1,1,0,5],[0,2,2,3],[2,2,0,4]]){
      const yy=.78+row*.56;
      for(let i=0;i<count;i++){const zz=7.23+bay*1.04+(start+i)*.10,h=.27+(i%3)*.038;box(g,8.11,yy+h/2,zz,.23,h,.060+(i%2)*.016,bookMats[(i+bay+row)%bookMats.length]);}
    }
    pottery(g,8.12,1.32,7.59,.10,.22,ceramic);pottery(g,8.10,1.88,8.67,.08,.25,stone);
    const pebble=sphere(g,8.13,.88,8.62,.105,stone,[.8,.65,1.5]);pebble.rotation.x=.18;
    solid(8.08,8.64,.42,3.16);
    lantern(g,x+.69,.81,z-.16,.78);
    // Quiet closed notebook, pen and a small matte screen replace ornate desk props.
    book(g,x-.65,.825,z+.05,.30,.23,.025,pages);box(g,x-.56,.844,z+.07,.20,.006,.007,bronze);
    slab(g,x+.07,.818,z-.04,.42,.018,.29,.018,dark);
    const laptop=soft(g,x+.07,.95,z-.18,.42,.26,.019,.008,dark,4);laptop.rotation.x=-.10;
  }
  let triangles=0,meshes=0;
  const count=o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;};
  root.traverse(count);for(const o of ceilings.children)if(o.name==='静雅餐厅 · 柔光椭圆灯')o.traverse(count);
  root.userData={design:'Original restrained warm-material interior proposal',triangles,meshCountBeforeBatch:meshes,dimensions:'indicative furniture sizes, not product or construction specifications'};
  return {group:root,triangles,meshes};
}
