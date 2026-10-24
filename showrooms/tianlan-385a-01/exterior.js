import * as THREE from 'three';

// Original procedural scenery, interpreted from the low-level sample-room
// photographs sina-01/03/04/06/07. Not a measured site, surveyed bearing,
// apartment-floor view or photographic panorama. No reference pixels are used.
export function createExterior() {
  const group = new THREE.Group();
  group.name = '样板间现场参照 · 水岸庭园近似布景';
  const land = new THREE.Group(), planting = new THREE.Group(), distant = new THREE.Group();
  land.name = '低视点水岸与园路'; planting.name = '原创枝叶植被'; distant.name = '远处城市形态示意';
  group.add(land, planting, distant);
  let seed = 46731;
  function random() { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; }
  function material(color, roughness=.8, metalness=0) { return new THREE.MeshStandardMaterial({color,roughness,metalness}); }
  const grass=material('#68784c',.97), paleStone=material('#c0bba7',.9), curb=material('#8e927d',.87),
    bark=material('#5e5a43',1), pathMat=material('#b7b5a6',.94), darkMetal=material('#5b6c67',.65,.2);
  paleStone.side=curb.side=THREE.DoubleSide;
  function mesh(geo,mat,parent=land) {const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(x,y,z,w,h,d,mat,parent=land) {const m=mesh(new THREE.BoxGeometry(w,h,d),mat,parent);m.position.set(x,y,z);return m;}

  // The independent base is below the apartment floor. In overview this entire
  // group is hidden so the surroundings never obscure the apartment diagram.
  box(8,-.82,45,180,.5,200,grass);
  const skyGeo=new THREE.SphereGeometry(205,32,12), colors=[];
  const pos=skyGeo.getAttribute('position'), low=new THREE.Color('#e1e9e6'), mid=new THREE.Color('#bcd9e3'), top=new THREE.Color('#80b3cb');
  for(let i=0;i<pos.count;i++) {
    const t=THREE.MathUtils.clamp(pos.getY(i)/205,0,1);
    const color=t<.24?low.clone().lerp(mid,t/.24):mid.clone().lerp(top,(t-.24)/.76);
    colors.push(color.r,color.g,color.b);
  }
  skyGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const sky=new THREE.Mesh(skyGeo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,depthWrite:false,toneMapped:false,fog:false}));
  sky.position.set(10,0,13);sky.name='低饱和天空与空气透视';sky.renderOrder=-10;group.add(sky);

  // An irregular pond wraps around the southwest foreground, like the visible
  // water/planting relationship in the photographs, without claiming a survey.
  const pond=new THREE.Shape();
  pond.moveTo(-19,32);pond.bezierCurveTo(-18,23,-15,17,-9,17);
  pond.bezierCurveTo(-4,17,-5,25,-3,29);pond.bezierCurveTo(2,31,15,29.5,22,31);
  pond.bezierCurveTo(33,32,39,39,38,48);pond.bezierCurveTo(36,60,22,64,8,63);
  pond.bezierCurveTo(-9,62,-23,54,-24,43);pond.bezierCurveTo(-24,38,-23,34,-19,32);
  const points=pond.getSpacedPoints(90);
  const shore=new THREE.Shape();
  points.forEach((p,i)=>{const x=8+(p.x-8)*1.045,z=41+(p.y-41)*1.055;i?shore.lineTo(x,z):shore.moveTo(x,z);});
  shore.closePath();const hole=new THREE.Path();points.forEach((p,i)=>i?hole.lineTo(p.x,p.y):hole.moveTo(p.x,p.y));hole.closePath();shore.holes.push(hole);
  const edge=mesh(new THREE.ShapeGeometry(shore,8),paleStone);edge.rotation.x=Math.PI/2;edge.position.y=-.39;
  const edgeInner=mesh(new THREE.ShapeGeometry(pond,12),curb);edgeInner.rotation.x=Math.PI/2;edgeInner.position.y=-.46;
  const size=256,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    const u=x/size,v=y/size;
    const dx=.23*Math.cos(u*41+v*17)+.12*Math.cos(u*101-v*59)+.07*Math.cos(u*193+v*81);
    const dy=.2*Math.sin(v*53-u*13)+.1*Math.sin(v*121+u*63)+.04*Math.sin(v*217-u*113);
    const n=new THREE.Vector3(dx,dy,1).normalize(),i=(y*size+x)*4;
    data[i]=Math.round((n.x*.5+.5)*255);data[i+1]=Math.round((n.y*.5+.5)*255);data[i+2]=Math.round((n.z*.5+.5)*255);data[i+3]=255;
  }
  const ripple=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);ripple.wrapS=ripple.wrapT=THREE.RepeatWrapping;ripple.repeat.set(5,5);ripple.magFilter=THREE.LinearFilter;ripple.minFilter=THREE.LinearMipmapLinearFilter;ripple.generateMipmaps=true;ripple.needsUpdate=true;
  const water=new THREE.MeshPhysicalMaterial({color:'#437f78',roughness:.18,metalness:.32,normalMap:ripple,normalScale:new THREE.Vector2(.22,.16),clearcoat:.9,clearcoatRoughness:.1,envMapIntensity:1.1,side:THREE.DoubleSide});
  const pondMesh=mesh(new THREE.ShapeGeometry(pond,12),water);pondMesh.rotation.x=Math.PI/2;pondMesh.position.y=-.43;pondMesh.castShadow=false;pondMesh.name='近处池水 · 原创波纹材质';
  // Photo-like low retaining ledges, grass borders and pale walks. These are
  // landscape interpretation, not walking/collision geometry for the viewer.
  box(9.8,-.36,28.5,24,.2,1.5,pathMat);
  box(-2.3,-.36,17.0,1.4,.2,21,pathMat);box(22.4,-.36,17.4,1.6,.2,21,pathMat);
  box(4.9,-.37,4.3,12,.18,1.25,pathMat);box(6.0,-.39,-2.2,19,.14,1.25,pathMat);
  for(let i=0;i<3;i++)box(25.4,-.43-i*.06,30+i*.6,6.4,.1,.57,paleStone);
  box(-7.2,-.35,31,6.5,.18,1.25,pathMat);
  for(const [x,z,w,d] of [[-2.7,8.2,1.2,8],[23.3,7.8,1.4,11],[23.4,23.1,1.5,6],[-6.1,-1.3,5,1.2],[8.7,-2.1,5,1.2]])box(x,-.43,z,w,.2,d,grass);

  // A small original alpha leaf cluster. Thin instanced cards retain gaps and
  // fine leaves; the canopy is not a stack of opaque low-poly spheres.
  const texN=256,leafPixels=new Uint8Array(texN*texN*4);
  const leaves=[[-.29,.28,-.62,.14,.055],[-.16,.12,-.45,.16,.060],[-.24,-.10,-.72,.15,.058],[.18,.25,.62,.15,.058],[.29,.02,.78,.17,.064],[.15,-.19,.45,.17,.061],[.01,.39,.08,.16,.062],[.02,-.35,-.10,.14,.054]];
  for(let y=0;y<texN;y++)for(let x=0;x<texN;x++) {
    const u=x/(texN-1)-.5,v=y/(texN-1)-.5;let a=0,shade=.7;
    for(let k=0;k<leaves.length;k++) {
      const [cx,cy,angle,len,width]=leaves[k],du=u-cx,dv=v-cy,c=Math.cos(angle),s=Math.sin(angle),along=du*s+dv*c,across=du*c-dv*s;
      const t=along/len,profile=Math.max(0,1-t*t),bound=width*Math.pow(profile,.74);
      if(Math.abs(t)<1&&Math.abs(across)<bound) {a=255;shade=.61+.3*profile+.08*Math.sin(t*19+k);if(Math.abs(across)<.0035)shade+=.1;}
    }
    if(Math.abs(u-.035*Math.sin(v*5))<.004&&Math.abs(v)<.42){a=255;shade=.41;}
    const i=(y*texN+x)*4;leafPixels[i]=Math.round(88*shade);leafPixels[i+1]=Math.round(122*shade);leafPixels[i+2]=Math.round(48*shade);leafPixels[i+3]=a;
  }
  const leafTexture=new THREE.DataTexture(leafPixels,texN,texN,THREE.RGBAFormat);leafTexture.colorSpace=THREE.SRGBColorSpace;leafTexture.magFilter=THREE.LinearFilter;leafTexture.minFilter=THREE.LinearMipmapLinearFilter;leafTexture.generateMipmaps=true;leafTexture.needsUpdate=true;
  const leafMat=new THREE.MeshStandardMaterial({map:leafTexture,roughness:.9,metalness:0,alphaTest:.45,side:THREE.DoubleSide,emissive:'#354326',emissiveIntensity:.09});
  const branchItems=[],leafItems=[];
  function branch(a,b,radius) {branchItems.push({a:new THREE.Vector3(...a),b:new THREE.Vector3(...b),radius});}
  function leafCard(x,y,z,scale,angle=0) {leafItems.push({x,y,z,sx:scale,sy:scale*.95,rx:(random()-.5)*1.4,ry:angle+random()*Math.PI,rz:(random()-.5)*1.6,color:new THREE.Color().setRGB(.85+random()*.26,.9+random()*.23,.76+random()*.24)});}
  function tree(x,z,h=5,r=1.6,cardCount=120) {
    const ground=-.53,sway=(random()-.5)*.35,root=[x,ground,z],fork=[x+sway,ground+h*.59,z+.12];
    branch(root,fork,h*.018);
    branch(fork,[x+sway*.7,ground+h*.92,z-.1],h*.009);
    for(let k=0;k<7;k++) {
      const a=k*2.399+random()*.35,level=.48+random()*.31,rad=r*(.65+random()*.3);
      const start=[x+sway*level,ground+h*level,z],end=[x+Math.cos(a)*rad,ground+h*(.72+random()*.23),z+Math.sin(a)*rad];
      branch(start,end,h*.006*(1-level*.3));
      branch(end,[end[0]+Math.cos(a+.6)*r*.31,end[1]+h*.08,end[2]+Math.sin(a+.6)*r*.31],h*.0035);
    }
    for(let i=0;i<cardCount;i++) {
      const a=random()*Math.PI*2,rho=Math.sqrt(random())*r,yy=(random()-.5)*h*.28;
      const taper=Math.sqrt(Math.max(.2,1-Math.pow(yy/(h*.33),2)));
      const lx=x+Math.cos(a)*rho*taper,lz=z+Math.sin(a)*rho*taper,ly=ground+h*.79+yy+Math.sin(a*2)*.13;
      leafCard(lx,ly,lz,.54+random()*.5,a);
    }
  }
  const trees=[
    [-7,8,5.7,1.75],[-8,15,6.3,1.9],[-8.5,25,5.4,1.65],[-12,31,6.7,2.0],[-21,36,6,1.8],[-23,47,6.8,2.1],[-16,57,5.8,1.9],
    [-8,63,7.1,2.2],[0,65,6.2,2.0],[8,67,7.5,2.2],[17,66,6.8,2.1],[25,63,6.4,1.9],[34,59,7.4,2.3],[39,51,6.7,2.0],[42,43,6.3,1.9],
    [29,32,5.6,1.7],[27.5,23,6.2,1.75],[27,15,6.3,1.8],[27,7,5.8,1.7],[25,-2,6,1.9],
    [-6,-3,5.3,1.7],[1,-3.5,5.6,1.75],[6,1.4,4.1,1.4],[1.4,2.0,4.4,1.3],
    [-35,60,7.7,2.3],[-28,74,7.2,2.4],[-15,77,8.5,2.6],[1,81,7.7,2.5],[16,81,8.2,2.6],[33,75,8.4,2.6],[48,66,8,2.5],
  ];
  trees.forEach(t=>tree(...t));
  // Irregular low shrubs soften, rather than hide, the pond edge.
  for(let i=0;i<18;i++) {
    const a=i/18*Math.PI*1.85+.2,x=8+Math.cos(a)*29,z=42+Math.sin(a)*24;
    if(x>-4&&x<24.5&&z>-3&&z<30.5)continue;
    for(let k=0;k<35;k++){const angle=random()*Math.PI*2,r=Math.sqrt(random())*1.4;leafCard(x+Math.cos(angle)*r,.25+random()*.75,z+Math.sin(angle)*r,.55+random()*.28,angle);}
  }
  for(const [x,z] of [[-2,3.0],[2,-1.3],[8,-1.4],[23.6,2],[24.5,13],[24.2,21],[-3.8,10]])for(let k=0;k<45;k++){const a=random()*Math.PI*2,r=Math.sqrt(random())*1.1;leafCard(x+Math.cos(a)*r,.05+random()*.65,z+Math.sin(a)*r,.55+random()*.22,a);}
  const branchGeo=new THREE.CylinderGeometry(.65,1,1,5,1),branches=new THREE.InstancedMesh(branchGeo,bark,branchItems.length);
  const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),dir=new THREE.Vector3();
  branchItems.forEach((item,i)=>{dir.subVectors(item.b,item.a);dummy.position.copy(item.a).add(item.b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,dir.clone().normalize());dummy.scale.set(item.radius,dir.length(),item.radius);dummy.updateMatrix();branches.setMatrixAt(i,dummy.matrix);});
  branches.name='实例化树干与细枝';branches.castShadow=true;branches.receiveShadow=true;branches.instanceMatrix.needsUpdate=true;planting.add(branches);
  const foliage=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),leafMat,leafItems.length);
  leafItems.forEach((item,i)=>{dummy.position.set(item.x,item.y,item.z);dummy.rotation.set(item.rx,item.ry,item.rz);dummy.scale.set(item.sx,item.sy,1);dummy.updateMatrix();foliage.setMatrixAt(i,dummy.matrix);foliage.setColorAt(i,item.color);});
  foliage.name='原创叶簇薄片 · '+leafItems.length+'组';foliage.castShadow=true;foliage.receiveShadow=true;foliage.instanceMatrix.needsUpdate=true;foliage.instanceColor.needsUpdate=true;planting.add(foliage);

  // Distant silhouettes follow only the photographed visual motifs: a frame-
  // topped tower, an unfinished tower and a loose cluster behind the tree line.
  // The depth is intentionally compressed scenic space, not a city coordinate.
  const skylineMat=material('#a0b4b9',.84,.08), sideMat=material('#90a6af',.84,.1), glassMat=material('#aac2c7',.36,.25), trimMat=material('#b5c5c7',.75);
  function tower(x,z,w,d,h) {
    box(x,h/2-.5,z,w,h,d,skylineMat,distant);
    box(x-w/2+.08,h/2-.5,z,.15,h,d+.1,sideMat,distant);
    for(let y=1;y<h;y+=2)box(x,y-.5,z-d/2-.015,w+.1,.055,.04,trimMat,distant);
    for(let xx=x-w/2+.5;xx<x+w/2;xx+=1.25)box(xx,h/2-.5,z-d/2-.028,.13,h-.4,.04,glassMat,distant);
  }
  for(const p of [[-56,137,6,6,14],[-43,145,8,8,19],[-31,139,7,6,15],[-20,146,6,8,24],[17,141,8,7,22],[38,152,7,9,20],[48,146,9,8,15],[63,163,9,9,18]])tower(...p);
  tower(-3,146,9,8,24);
  box(-6.75,27,146,1.5,6,8,sideMat,distant);box(.75,27,146,1.5,6,8,sideMat,distant);box(-3,30.7,146,9,1.4,8,skylineMat,distant);
  tower(29,155,6,6,27);box(29,28.6,155,3.6,4.2,4.5,sideMat,distant);
  box(29.4,34,155,.17,8,.17,darkMetal,distant);box(29.4,37.9,155,11,.14,.14,darkMetal,distant);
  const craneLine=mesh(new THREE.CylinderGeometry(.025,.025,9,4),darkMetal,distant);craneLine.position.set(31.6,35.7,155);craneLine.rotation.z=-.99;
  // A few low layered masses remain under the trees rather than a fictional
  // named development around the home.
  for(const p of [[-37,101,14,8,4.5],[9,105,19,8,4.0],[44,104,12,8,5]])tower(...p);

  // Static landscaping and distant façades share a handful of draw calls;
  // foliage remains instanced. Preserve material and shadow behavior.
  function batch(parent) {
    const bins=new Map();
    for(const item of parent.children)if(item.isMesh&&!item.isInstancedMesh){const key=item.material.uuid+':'+item.castShadow;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(item);}
    for(const list of bins.values()) {
      if(list.length<2)continue;
      const positions=[],normals=[],uvs=[],v=new THREE.Vector3(),n=new THREE.Vector3();
      for(const item of list) {
        item.updateMatrix();const normalMatrix=new THREE.Matrix3().getNormalMatrix(item.matrix);
        const geo=item.geometry.index?item.geometry.toNonIndexed():item.geometry;
        const pa=geo.attributes.position,na=geo.attributes.normal,ua=geo.attributes.uv;
        for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(item.matrix);positions.push(v.x,v.y,v.z);n.fromBufferAttribute(na,i).applyMatrix3(normalMatrix).normalize();normals.push(n.x,n.y,n.z);uvs.push(ua?ua.getX(i):0,ua?ua.getY(i):0);}
        parent.remove(item);if(geo!==item.geometry)geo.dispose();item.geometry.dispose();
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.computeBoundingSphere();
      const combined=new THREE.Mesh(geo,list[0].material);combined.castShadow=list[0].castShadow;combined.receiveShadow=true;combined.name='合并外景静态面 · '+list.length+'件';parent.add(combined);
    }
  }
  batch(land);batch(distant);

  group.userData = {
    provenance:'original-procedural-scenery-from-public-sample-room-photographs',
    references:['sina-01','sina-03','sina-04','sina-06','sina-07'],
    confidence:'Visible water, tree canopy and distant tower motifs are supported; bearing, distances, elevations and exact boundaries are not surveyed.',
    note:'低视点现场照片近似布景，非该住宅楼层的真实窗景、非实测总平；不使用营销图中的高空合成景观。',
    triangleBudget:30000,
    treeCount:trees.length,
    foliageCards:leafItems.length,
    branches:branchItems.length,
  };
  return group;
}
