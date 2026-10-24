import * as THREE from 'three';

// Original procedural scenery, interpreted from the low-level sample-room
// photographs sina-01/03/04/06/07. Not a measured site, surveyed bearing,
// apartment-floor view or photographic panorama. No reference pixels are used.
export function createExterior() {
  const group = new THREE.Group();
  group.name = '样板间现场参照 · 分层树冠与低视点水岸 0.3';
  const land = new THREE.Group(), planting = new THREE.Group(), distant = new THREE.Group();
  land.name = '低视点水岸与园路'; planting.name = '原创枝叶植被'; distant.name = '远处城市形态示意';
  group.add(land, planting, distant);
  let seed = 46731;
  function random() { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; }
  function material(color, roughness=.8, metalness=0) { return new THREE.MeshStandardMaterial({color,roughness,metalness}); }
  const grass=material('#75835a',.97), paleStone=material('#c0bba7',.9), curb=material('#8e927d',.87),
    bark=material('#5e5a43',1), pathMat=material('#b7b5a6',.94), darkMetal=material('#5b6c67',.65,.2);
  paleStone.side=curb.side=THREE.DoubleSide;
  function mesh(geo,mat,parent=land) {const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(x,y,z,w,h,d,mat,parent=land) {const m=mesh(new THREE.BoxGeometry(w,h,d),mat,parent);m.position.set(x,y,z);return m;}

  // The independent base is below the apartment floor. In overview this entire
  // group is hidden so the surroundings never obscure the apartment diagram.
  box(8,-.82,45,180,.5,200,grass);
  const skyGeo=new THREE.SphereGeometry(205,32,12), colors=[];
  const pos=skyGeo.getAttribute('position'), low=new THREE.Color('#d4e6e9'), mid=new THREE.Color('#b2d8eb'), top=new THREE.Color('#80b9d3');
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
  pond.moveTo(-16,32);pond.bezierCurveTo(-17,25,-14,20,-9,20);
  pond.bezierCurveTo(-4,20,-5,27,-2,29.5);pond.bezierCurveTo(2,31.5,15,30,22,32);
  pond.bezierCurveTo(30,34,32,37,29,39.5);pond.bezierCurveTo(26,43,14,44.8,5,44);
  pond.bezierCurveTo(-8,44.5,-20,41,-21,37);pond.bezierCurveTo(-22,34,-20,33,-16,32);
  const points=pond.getSpacedPoints(90);
  const shore=new THREE.Shape();
  points.forEach((p,i)=>{const x=8+(p.x-8)*1.012,z=38+(p.y-38)*1.017;i?shore.lineTo(x,z):shore.moveTo(x,z);});
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
  const ripple=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);ripple.wrapS=ripple.wrapT=THREE.RepeatWrapping;ripple.repeat.set(4,3);ripple.magFilter=THREE.LinearFilter;ripple.minFilter=THREE.LinearMipmapLinearFilter;ripple.generateMipmaps=true;ripple.needsUpdate=true;
  // Soft, vertically broken vegetation reflections are drawn procedurally.
  // They describe the sheltered pond's colour only, not a captured panorama.
  const reflectionPixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    const u=x/size,v=y/size;
    const rippleOffset=.015*Math.sin(v*144+Math.sin(v*39)*2)+.008*Math.sin(v*337);
    const streak=Math.sin((u+rippleOffset)*37+1.3*Math.sin(u*13))*.5+.5;
    const fine=Math.sin(u*143+v*11)*Math.sin(v*173)*.04;
    const shade=THREE.MathUtils.clamp(.37+.30*streak+.14*Math.sin(u*11+v*4)+fine,.22,.83);
    const bank=.6+.4*Math.pow(v,.6),i=(y*size+x)*4;
    reflectionPixels[i]=Math.round(100+shade*74-bank*17);
    reflectionPixels[i+1]=Math.round(122+shade*64-bank*12);
    reflectionPixels[i+2]=Math.round(91+shade*51-bank*9);reflectionPixels[i+3]=255;
  }
  const reflection=new THREE.DataTexture(reflectionPixels,size,size,THREE.RGBAFormat);
  reflection.colorSpace=THREE.SRGBColorSpace;reflection.magFilter=THREE.LinearFilter;reflection.minFilter=THREE.LinearMipmapLinearFilter;reflection.generateMipmaps=true;reflection.needsUpdate=true;
  const water=new THREE.MeshPhysicalMaterial({color:'#9ba98a',map:reflection,roughness:.44,metalness:.04,normalMap:ripple,normalScale:new THREE.Vector2(.035,.025),clearcoat:.25,clearcoatRoughness:.32,envMapIntensity:.6,side:THREE.DoubleSide});
  const waterGeo=new THREE.ShapeGeometry(pond,12),waterPosition=waterGeo.attributes.position;
  for(let i=0;i<waterPosition.count;i++)waterGeo.attributes.uv.setXY(i,(waterPosition.getX(i)+22)/54,(waterPosition.getY(i)-20)/25);
  const pondMesh=mesh(waterGeo,water);pondMesh.rotation.x=Math.PI/2;pondMesh.position.y=-.43;pondMesh.castShadow=false;pondMesh.name='近处池水 · 原创波纹材质';
  // Photo-like low retaining ledges, grass borders and pale walks. These are
  // landscape interpretation, not walking/collision geometry for the viewer.
  box(9.8,-.36,28.5,24,.2,1.5,pathMat);
  box(-2.3,-.36,17.0,1.4,.2,21,pathMat);box(22.4,-.36,17.4,1.6,.2,21,pathMat);
  box(4.9,-.37,4.3,12,.18,1.25,pathMat);box(6.0,-.39,-2.2,19,.14,1.25,pathMat);
  for(let i=0;i<3;i++)box(25.4,-.43-i*.06,30+i*.6,6.4,.1,.57,paleStone);
  box(-7.2,-.35,31,6.5,.18,1.25,pathMat);
  for(const [x,z,w,d] of [[-2.7,8.2,1.2,8],[23.3,7.8,1.4,11],[23.4,23.1,1.5,6],[-6.1,-1.3,5,1.2],[8.7,-2.1,5,1.2]])box(x,-.43,z,w,.2,d,grass);

  // Subtle turf mounds and a planted peninsula break the uninterrupted water
  // rectangle seen in the previous version. Heights/shoreline remain inferred.
  for(const [x,z,rx,rz,h] of [[-4.7,29.8,2.8,1.6,.34],[24.2,33.0,3.6,2.0,.45],[-14.8,42.0,5.8,3.1,.60],[-4.5,45.8,6.5,3.0,.56],[7.5,45.4,7.5,3.5,.74],[19,43.3,6.5,3.4,.65],[27.2,40.0,5.0,3.0,.70]]) {
    const mound=mesh(new THREE.SphereGeometry(1,20,10),grass);mound.position.set(x,-.50,z);mound.scale.set(rx,h,rz);
  }

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
    const i=(y*texN+x)*4;leafPixels[i]=Math.round(220*shade);leafPixels[i+1]=Math.round(230*shade);leafPixels[i+2]=Math.round(176*shade);leafPixels[i+3]=a;
  }
  const leafTexture=new THREE.DataTexture(leafPixels,texN,texN,THREE.RGBAFormat);leafTexture.colorSpace=THREE.SRGBColorSpace;leafTexture.magFilter=THREE.LinearFilter;leafTexture.minFilter=THREE.LinearMipmapLinearFilter;leafTexture.generateMipmaps=true;leafTexture.needsUpdate=true;
  const leafMat=new THREE.MeshStandardMaterial({map:leafTexture,roughness:.95,metalness:0,alphaTest:.45,side:THREE.DoubleSide,emissive:'#9cb65d',emissiveIntensity:.24});
  const branchItems=[],leafItems=[];
  function branch(a,b,radius) {branchItems.push({a:new THREE.Vector3(...a),b:new THREE.Vector3(...b),radius});}
  function leafCard(x,y,z,scale,angle=0,tint=null) {
    const color=tint?tint.clone():new THREE.Color('#b8c991');
    color.multiplyScalar(.88+random()*.26);
    leafItems.push({x,y,z,sx:scale,sy:scale*.95,rx:(random()-.5)*1.8,ry:angle+random()*Math.PI,rz:(random()-.5)*1.8,color});
  }
  function tree(x,z,h=5,r=1.6,cardCount=270,tone='#c1d390',airy=false) {
    const ground=-.53,sway=(random()-.5)*.45,root=[x,ground,z],fork=[x+sway,ground+h*.55,z+.12],tint=new THREE.Color(tone),lobes=[];
    branch(root,fork,h*(airy?.010:.015));
    branch(fork,[x+sway*.7,ground+h*.93,z-.1],h*.007);
    for(let k=0;k<7;k++) {
      const a=k*2.399+random()*.35,level=.39+random()*.30,rad=r*(.58+random()*.34);
      const start=[x+sway*level,ground+h*level,z],end=[x+Math.cos(a)*rad,ground+h*(.46+random()*.44),z+Math.sin(a)*rad];
      branch(start,end,h*.0045);
      for(let twig=0;twig<3;twig++) {
        const angle=a+(twig-1)*.63,tip=[end[0]+Math.cos(angle)*r*.33,end[1]+h*(.05+random()*.07),end[2]+Math.sin(angle)*r*.33];
        branch(end,tip,h*.0018);lobes.push(tip);
      }
    }
    // Branch-end clusters leave natural light gaps. Broadleaf canopies include
    // denser inner foliage; the tall willow-like foreground has visible twigs.
    for(let i=0;i<cardCount;i++) {
      const lobe=lobes[i%lobes.length],a=random()*Math.PI*2,rho=Math.sqrt(random())*r*(airy?.37:.49),yy=(random()-.5)*h*(airy?.25:.43);
      const taper=Math.sqrt(Math.max(.15,1-Math.pow(yy/(h*(airy?.17:.27)),2)));
      leafCard(lobe[0]+Math.cos(a)*rho*taper,lobe[1]+yy,lobe[2]+Math.sin(a)*rho*taper,(airy?.39:.56)+random()*(airy?.26:.39),a,tint);
    }
    if(!airy)for(let i=0;i<Math.floor(cardCount*.25);i++) {
      const a=random()*Math.PI*2,rho=random()*r*.75;
      leafCard(x+Math.cos(a)*rho,ground+h*(.34+random()*.48),z+Math.sin(a)*rho,.65+random()*.25,a,tint);
    }
  }
  // Different canopy heights and leaf densities reproduce the visible layering
  // rather than a uniform ring of trees around a large empty pool.
  const trees=[
    [-7,8,5.7,1.75,230,'#a9bf8a'],[-7,16,6.3,1.9,260,'#a3bc82'],[-5.0,26.8,6.0,2.1,240,'#c6d794',true],
    [-9.8,33.5,7.0,2.0,260,'#c6cf9f',true],[-15.0,39,5.0,2.4,330,'#c1ce89'],[-19,48,6.3,2.2,290,'#a7bd8a'],
    [-11,53,5.1,2.4,330,'#a6c487'],[-3,54,4.9,2.7,350,'#c0d789'],[5,54,5.4,2.6,340,'#98b782'],
    [13,53,4.7,2.8,360,'#c5d58d'],[20,51,4.2,2.6,330,'#acc278'],[27.5,47,6.7,2.3,300,'#9eb887'],
    [31,39,7.1,2.3,310,'#a5bb8c'],[25.5,31.5,6.4,2.2,300,'#bfd48b'],
    [27.0,23,6.2,1.8,240,'#9fba82'],[27,15,6.3,1.8,240,'#acc58a'],[27,7,5.8,1.7,220,'#acc58a'],[25,-2,6,1.9,230,'#a1ba84'],
    [-6,-3,5.3,1.7,210,'#b6ca8c'],[1,-3.5,5.6,1.75,220,'#b5cb91'],[6,1.4,4.1,1.4,180,'#c3d399'],[1.4,2,4.4,1.3,180,'#aec48d'],
    [-29,60,7.7,2.5,280,'#859e79'],[-20,64,7.2,2.5,270,'#91ae7f'],[-10,66,7.1,2.6,290,'#7b9d79'],
    [0,67,6.7,2.7,280,'#88a879'],[12,68,6.6,2.8,300,'#91ae7f'],[25,65,7.2,2.6,290,'#85a67c'],[39,59,7.8,2.8,300,'#91ae83'],
  ];
  const middleTrees=[
    [-11.5,43.5,4.3,2.7,400,'#c7dc8b'],[-4.5,45.2,5.7,2.9,440,'#c6d791'],
    [2.8,44.1,4.9,3.1,470,'#d4e29a'],[10.5,46.4,6.3,2.9,450,'#bdd389'],
    [18.3,43.6,4.2,3.0,440,'#cede92'],[25.8,40.1,6.2,2.7,420,'#b6cf8d'],
    [-1.3,52.7,7.7,2.2,380,'#9eb98b'],[22.8,53.8,8.1,2.4,390,'#a5c18c'],
  ];
  trees.push(...middleTrees);
  trees.forEach(t=>tree(...t));
  // Two close, fine-stemmed trees frame the pond. Sparse crowns allow the water
  // and skyline to remain visible, matching the sightline through the balcony.
  const foregroundTrees=[[1.9,30.4,6.6,2.1,250,'#cbdb91',true],[21.7,32.1,7.5,1.9,240,'#c3d394',true],[-5.2,39.8,7.5,1.5,190,'#ccd6a2',true]];
  foregroundTrees.forEach(t=>tree(...t));
  // A narrow evergreen punctuates the lower broadleaf crowns in the field photo.
  const evergreen={x:17.8,z:58.5,h:8.4};
  branch([evergreen.x,-.53,evergreen.z],[evergreen.x,evergreen.h-.53,evergreen.z],.095);
  for(let level=0;level<13;level++) {
    const t=level/13,y=evergreen.h*(.25+.70*t)-.53,r=1.15*(1-t)+.14;
    for(let k=0;k<7;k++) {
      const a=k*2.399+level*.8,end=[evergreen.x+Math.cos(a)*r,y-.18,evergreen.z+Math.sin(a)*r];
      branch([evergreen.x,y,evergreen.z],end,.018*(1-t)+.005);
      for(let i=0;i<4;i++)leafCard(end[0]+(random()-.5)*.5,y+(random()-.5)*.45,end[2]+(random()-.5)*.5,.46+random()*.25,a,new THREE.Color('#78956e'));
    }
  }
  // Dense low planting follows the far shore and the photographed peninsula;
  // gaps across the central near bank preserve the view down to the pond.
  const shrubBeds=[[-18,34,2.0,100],[-19,39,2.3,140],[-15,42.3,2.8,160],[-9,44.1,3.0,180],[-2,45.0,3.1,190],[5,45.2,3.2,200],[12,44.6,3.2,210],[19,43.1,3.1,200],[26,40.8,2.8,180],[29.8,38.5,2.0,130],[24.5,33.2,2.5,145],[-4.7,29.8,1.8,95]];
  shrubBeds.forEach(([x,z,r,count],i)=>{
    const tint=new THREE.Color(i%3?'#adc681':'#c6d490');
    for(let k=0;k<count;k++){const a=random()*Math.PI*2,rho=Math.sqrt(random())*r;leafCard(x+Math.cos(a)*rho,.05+random()*1.75,z+Math.sin(a)*rho*.83,.53+random()*.25,a,tint);}
  });
  for(const [x,z] of [[-2,3.0],[2,-1.3],[8,-1.4],[23.6,2],[24.5,13],[24.2,21],[-3.8,10]])for(let k=0;k<65;k++){const a=random()*Math.PI*2,r=Math.sqrt(random())*1.1;leafCard(x+Math.cos(a)*r,.05+random()*.65,z+Math.sin(a)*r,.55+random()*.22,a);}
  const branchGeo=new THREE.CylinderGeometry(.65,1,1,5,1,true),branches=new THREE.InstancedMesh(branchGeo,bark,branchItems.length);
  const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),dir=new THREE.Vector3();
  branchItems.forEach((item,i)=>{dir.subVectors(item.b,item.a);dummy.position.copy(item.a).add(item.b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,dir.clone().normalize());dummy.scale.set(item.radius,dir.length(),item.radius);dummy.updateMatrix();branches.setMatrixAt(i,dummy.matrix);});
  branches.name='实例化树干与细枝';branches.castShadow=true;branches.receiveShadow=true;branches.instanceMatrix.needsUpdate=true;planting.add(branches);
  const foliage=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),leafMat,leafItems.length);
  leafItems.forEach((item,i)=>{dummy.position.set(item.x,item.y,item.z);dummy.rotation.set(item.rx,item.ry,item.rz);dummy.scale.set(item.sx,item.sy,1);dummy.updateMatrix();foliage.setMatrixAt(i,dummy.matrix);foliage.setColorAt(i,item.color);});
  foliage.name='原创叶簇薄片 · '+leafItems.length+'组';foliage.castShadow=true;foliage.receiveShadow=false;foliage.instanceMatrix.needsUpdate=true;foliage.instanceColor.needsUpdate=true;planting.add(foliage);

  // Distant silhouettes follow only the photographed visual motifs: a frame-
  // topped tower, an unfinished tower and a loose cluster behind the tree line.
  // The depth is intentionally compressed scenic space, not a city coordinate.
  const skylineMat=material('#b4c9d1',.84,.04), sideMat=material('#a4bec9',.84,.04), glassMat=material('#b8d1da',.5,.12), trimMat=material('#c5d6d9',.75);
  // Atmospheric fill is an illustrative aid for the hazy towers in the source.
  for(const mat of [skylineMat,sideMat,glassMat,trimMat]){mat.emissive.set('#91aeba');mat.emissiveIntensity=.22;}
  distant.scale.x=-1;distant.position.x=26;
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
    triangleBudget:60000,
    treeCount:trees.length+foregroundTrees.length+1,
    skyColor:'#d6e1e4',
    scenicRevision:'0.3 / layered photo-referenced planting and sheltered pond',
    foliageCards:leafItems.length,
    branches:branchItems.length,
  };
  return group;
}
