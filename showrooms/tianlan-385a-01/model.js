import * as THREE from 'three';

// LACADIERE Tianlan 385A, Building 22 / 01.
// Plan tracing: x points east/right, z points south/down. Dimensions in metres.
// The plan is the geometric source. Furniture is replaceable interpretation.
export function createApartment() {
  const group = new THREE.Group(); group.name = '天览385A · 22栋01';
  const architecture = new THREE.Group(); architecture.name = '按户型图描摹的建筑';
  const furniture = new THREE.Group(); furniture.name = '可替换的样板间陈设';
  const ceilings = new THREE.Group(); ceilings.name = '演示吊顶 · 净高假定3.10米';
  group.add(architecture, furniture, ceilings);
  const colliders = [], openings = [], walkable = [];
  const H = 3.10, T = .16;
  const materials = {
    wall: mat('#eee9df', .89), trim: mat('#d1c7b5', .62), stone: mat('#f1eee7', .31),
    bath: mat('#dbd7cd', .6), walnut: mat('#70513b', .62), darkWood: mat('#473b31', .61),
    oak: mat('#ac9273', .78), fabric: mat('#e4ddd0', .95), linen: mat('#f4efe3', 1),
    bronze: mat('#6e5c48', .3, .7), dark: mat('#292b29', .45), light: mat('#fff8e8', .5),
    carpet: mat('#c9bcaa', 1), carpetLight: mat('#dad0bd', 1), leaf: mat('#66735c', .94),
    leafDark: mat('#414c3a', 1), pot: mat('#9d9380', .85), water: mat('#b0c8c4', .2),
    glass: new THREE.MeshPhysicalMaterial({color:'#c4e1dd', transparent:true, opacity:.19, roughness:.13, metalness:.05, side:THREE.DoubleSide, depthWrite:false}),
    glow: new THREE.MeshStandardMaterial({color:'#fff1d0', emissive:'#ffdb9e', emissiveIntensity:.55}),
    art: mat('#a89c84', .98), white: mat('#f4f1e9', .38), terrace: mat('#b6ac98', .88),
    leather: mat('#252623', .48), caramel: mat('#9d5f35', .65), khaki: mat('#8c7b60', .95),
    kitchen: mat('#f2efe6', .46), rust: mat('#a55f3d', .91), gold: mat('#b39a69', .23, .78),
  };
  // Original procedural materials: no source photographs or borrowed textures.
  const marble = new Uint8Array(256*256*4);
  for(let j=0;j<256;j++)for(let i=0;i<256;i++) {
    const u=i/256,v=j/256;
    const warp=.17*Math.sin(v*17+u*8)+.08*Math.sin(v*41-u*16)+.028*Math.sin(v*97+u*31);
    const vein=Math.exp(-Math.abs(Math.sin((u*2.7+v*1.5+warp)*Math.PI))*48);
    const hair=Math.exp(-Math.abs(Math.sin((u*5.1+v*2.8+warp*.6)*Math.PI))*100)*.24;
    const cloud=2.2*Math.sin(u*24+v*31)*Math.sin(v*19-u*7),k=(j*256+i)*4;
    marble[k]=244-cloud-65*(vein+hair);marble[k+1]=242-cloud-68*(vein+hair);marble[k+2]=235-cloud-66*(vein+hair);marble[k+3]=255;
  }
  const marbleMap=new THREE.DataTexture(marble,256,256,THREE.RGBAFormat);marbleMap.colorSpace=THREE.SRGBColorSpace;marbleMap.wrapS=marbleMap.wrapT=THREE.RepeatWrapping;marbleMap.needsUpdate=true;
  materials.stone.map=marbleMap;materials.bath.map=marbleMap;
  function mat(color, roughness=.8, metalness=0) { return new THREE.MeshStandardMaterial({color,roughness,metalness}); }
  function mesh(geometry, material, parent=architecture) {
    const o = new THREE.Mesh(geometry, material); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
  }
  function box(x,y,z,w,h,d,material=materials.wall,parent=architecture) {
    const o = mesh(new THREE.BoxGeometry(w,h,d),material,parent); o.position.set(x,y,z); return o;
  }
  function round(x,y,z,w,h,d,r,material,parent=furniture) {
    r = Math.min(r,w/2-.001,d/2-.001);
    const s=new THREE.Shape(), a=-w/2,b=-d/2;
    s.moveTo(a+r,b); s.lineTo(a+w-r,b); s.quadraticCurveTo(a+w,b,a+w,b+r);
    s.lineTo(a+w,b+d-r); s.quadraticCurveTo(a+w,b+d,a+w-r,b+d);
    s.lineTo(a+r,b+d); s.quadraticCurveTo(a,b+d,a,b+d-r);
    s.lineTo(a,b+r); s.quadraticCurveTo(a,b,a+r,b);
    const geo=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:6});
    geo.rotateX(-Math.PI/2); const o=mesh(geo,material,parent); o.position.set(x,y-h/2,z); return o;
  }
  function cyl(x,y,z,r,h,material,parent=furniture,rTop=r) {
    const o=mesh(new THREE.CylinderGeometry(rTop,r,h,24),material,parent); o.position.set(x,y,z); return o;
  }
  function solid(x,z,w,d,type='furniture') {colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,type});}
  function named(name, x=0,z=0,yaw=0) {const g=new THREE.Group();g.name=name;g.position.set(x,0,z);g.rotation.y=yaw;furniture.add(g);return g;}
  function floor(x1,z1,x2,z2,material, ceiling=true, tiles=false) {
    walkable.push({minX:x1,maxX:x2,minZ:z1,maxZ:z2});
    let fm=material;
    if(material.map) {fm=material.clone();fm.map=material.map.clone();fm.map.repeat.set((x2-x1)/2.4,(z2-z1)/2.4);fm.map.needsUpdate=true;}
    box((x1+x2)/2,-.065,(z1+z2)/2,x2-x1,.13,z2-z1,fm);
    if(ceiling) box((x1+x2)/2,H+.07,(z1+z2)/2,x2-x1,.14,z2-z1,materials.wall,ceilings);
    if(tiles) {
      const line=mat('#cec8bc',.95);
      for(let x=Math.ceil(x1/1.2)*1.2;x<x2;x+=1.2)box(x,.003,(z1+z2)/2,.007,.004,z2-z1,line);
      for(let z=Math.ceil(z1/1.2)*1.2;z<z2;z+=1.2)box((x1+x2)/2,.003,z,x2-x1,.004,.007,line);
    }
  }
  function woodFloor(x1,z1,x2,z2,ceiling=true) {
    floor(x1,z1,x2,z2,materials.oak,ceiling);
    const dark=mat('#9f8567',.88), light=mat('#b59c7f',.86);
    for(let x=x1+.12;x<x2;x+=.22) {
      box(x,.003,(z1+z2)/2,.006,.004,z2-z1,dark);
      let row=Math.round((x-x1)/.22);
      for(let z=z1+.5+(row%3)*.38;z<z2;z+=1.65)box(x,.004,z,.21,.004,.008,light);
    }
  }
  // A wall may have true floor-level doors and/or glazing. Headers never collide.
  function wall(axis,fixed,start,end,{thickness=T,doors=[],windows=[],material=materials.wall}={}) {
    const spans=[...doors.map(d=>({a:d[0],b:d[1],kind:'door',height:d[2]||2.45})),...windows.map(d=>({a:d[0],b:d[1],kind:'window',sill:d[2]??.28,height:d[3]||2.72}))].sort((a,b)=>a.a-b.a);
    let p=start;
    function segment(a,b,low=0,high=H,collision=true) {
      if(b-a<.005||high-low<.005)return;
      const x=axis==='x'?(a+b)/2:fixed,z=axis==='x'?fixed:(a+b)/2;
      const w=axis==='x'?b-a:thickness,d=axis==='x'?thickness:b-a;
      box(x,(low+high)/2,z,w,high-low,d,material);
      if(collision)solid(x,z,w,d,'wall');
      if(low===0) {
        if(axis==='x') { box(x,.06,z-thickness/2-.008,w,.12,.015,materials.trim);box(x,.06,z+thickness/2+.008,w,.12,.015,materials.trim); }
        else { box(x-thickness/2-.008,.06,z,.015,.12,d,materials.trim);box(x+thickness/2+.008,.06,z,.015,.12,d,materials.trim); }
      }
    }
    for(const s of spans) {
      const a=Math.max(start,s.a),b=Math.min(end,s.b); if(b<=a)continue;
      segment(p,a);
      if(s.kind==='door') {
        segment(a,b,s.height,H,false); openings.push({axis,fixed,start:a,end:b,height:s.height});
        for(const v of [a+.025,b-.025]) {if(axis==='x')box(v,s.height/2,fixed,.05,s.height,thickness+.025,materials.trim);else box(fixed,s.height/2,v,thickness+.025,s.height,.05,materials.trim);}
        if(axis==='x')box((a+b)/2,s.height-.025,fixed,b-a,.05,thickness+.025,materials.trim);else box(fixed,s.height-.025,(a+b)/2,thickness+.025,.05,b-a,materials.trim);
      } else {
        segment(a,b,0,s.sill,true); segment(a,b,s.height,H,false);
        const gh=s.height-s.sill, mid=(s.sill+s.height)/2;
        if(axis==='x')box((a+b)/2,mid,fixed,b-a,gh,.018,materials.glass);else box(fixed,mid,(a+b)/2,.018,gh,b-a,materials.glass);
        // Keep full-height glass boundaries in collision so walkers cannot exit.
        if(s.sill<.05)solid(axis==='x'?(a+b)/2:fixed,axis==='x'?fixed:(a+b)/2,axis==='x'?b-a:thickness,axis==='x'?thickness:b-a,'wall');
        for(let v=a;v<=b+.01;v+=Math.min(1.35,(b-a)/Math.ceil((b-a)/1.35))) {
          if(axis==='x')box(v,mid,fixed,.035,gh,.055,materials.bronze);else box(fixed,mid,v,.055,gh,.035,materials.bronze);
        }
        for(const y of [s.sill,s.height]) {if(axis==='x')box((a+b)/2,y,fixed,b-a,.045,.07,materials.bronze);else box(fixed,y,(a+b)/2,.07,.045,b-a,materials.bronze);}
      }
      p=b;
    }
    segment(p,end);
  }
  function glassDoor(axis,fixed,a,b) {
    // Retracted panel keeps the designated passage genuinely open.
    const span=Math.min(.8,(b-a)*.22),x=axis==='x'?a+span/2:fixed,z=axis==='x'?fixed:a+span/2;
    box(x,1.3,z,axis==='x'?span:.035,2.6,axis==='x'?.035:span,materials.glass);
    if(axis==='x')box(x,2.62,z,b-a,.04,.06,materials.bronze);else box(x,2.62,z,.06,.04,b-a,materials.bronze);
  }
  function rug(x,z,w,d,parent=furniture) {round(x,.016,z,w,.024,d,.07,materials.carpet,parent);round(x,.031,z,w-.13,.006,d-.13,.06,materials.carpetLight,parent);}
  function cabinet(x,z,w,d,h=2.5,parent=furniture,yaw=0,collision=true) {
    const o=box(x,h/2,z,w,h,d,materials.walnut,parent);o.rotation.y=yaw;
    const n=Math.ceil(w/.55);
    for(let i=1;i<n;i++)box(x-w/2+i*w/n,h/2,z+d/2+.006,.009,h-.08,.012,materials.darkWood,parent);
    box(x,.08,z,w-.1,.16,d-.06,materials.darkWood,parent);
    if(collision&&parent===furniture)solid(x,z,yaw?d:w,yaw?w:d);
  }
  function bed(cx,cz,width=1.9,length=2.1,yaw=0,label='床') {
    const g=named(label,cx,cz,yaw);
    const master=label.startsWith('主卧');
    rug(0,0,width+1.2,length+1.05,g);
    round(0,.20,0,width+.12,.32,length+.12,.06,materials.darkWood,g);
    round(0,.46,0,width,.24,length,.08,materials.linen,g);
    round(0,.61,.18,width-.04,.09,length*.7,.08,materials.fabric,g);
    box(0,master?.87:.72,-length/2-.065,width+.52,master?1.68:1.35,.13,master?materials.khaki:materials.carpet,g);
    for(const dx of [-width*.25,width*.25]) round(dx,.65,-length*.31,width*.43,.16,.45,.09,materials.linen,g);
    box(0,.67,length*.25,width+.01,.035,.48,master?materials.rust:materials.carpet,g);
    if(master) {
      for(let x=-width/2;x<=width/2;x+=.28)for(let y=.35;y<1.58;y+=.28){const tuft=mesh(new THREE.SphereGeometry(.025,6,4),materials.darkWood,g);tuft.position.set(x+(Math.round(y/.28)%2)*.1,y,-length/2+.01);}
      round(0,.39,length/2+.40,width*.86,.14,.43,.2,materials.khaki,g);
      for(const x of [-width*.34,width*.34])for(const z of [length/2+.28,length/2+.52])cyl(x,.17,z,.018,.34,materials.dark,g);
    }
    for(const dx of [-width/2-.42,width/2+.42]) {
      if(master) {
        cyl(dx,.54,-length/2+.22,.32,.045,materials.dark,g);cyl(dx,.27,-length/2+.22,.018,.54,materials.dark,g);
        cyl(dx,.65,-length/2+.22,.14,.18,materials.glow,g);
        const lamp=mesh(new THREE.SphereGeometry(.18,16,12),materials.bronze,g);lamp.position.set(dx,.80,-length/2+.22);lamp.scale.y=.75;
      } else {
        round(dx,.3,-length/2+.22,.55,.57,.46,.035,materials.walnut,g);
        cyl(dx,.62,-length/2+.22,.12,.035,materials.bronze,g);cyl(dx,.81,-length/2+.22,.018,.38,materials.bronze,g);
        cyl(dx,1.02,-length/2+.22,.17,.24,materials.linen,g,.11);
      }
    }
    solid(cx,cz,Math.abs(Math.cos(yaw))*(width+.16)+Math.abs(Math.sin(yaw))*(length+.16),Math.abs(Math.sin(yaw))*(width+.16)+Math.abs(Math.cos(yaw))*(length+.16));
    return g;
  }
  function sofa(cx,cz,w=2.7,yaw=0,label='布艺沙发',collision=true,upholstery=materials.fabric) {
    const g=named(label,cx,cz,yaw);
    round(0,.25,0,w,.30,.92,.12,upholstery,g);round(0,.55,-.38,w,.60,.22,.1,upholstery,g);
    for(const x of [-w/2+.1,w/2-.1])round(x,.47,0,.20,.42,.86,.08,upholstery,g);
    const n=Math.max(2,Math.round(w/.85));
    for(let i=0;i<n;i++) {round(-w/2+.22+(i+.5)*(w-.44)/n,.45,.06,(w-.48)/n,.13,.64,.08,upholstery===materials.leather?upholstery:materials.linen,g);const c=round(-w/2+.42+i*(w-.84)/(n-1),.74,-.18,.42,.14,.42,.05,upholstery===materials.leather?upholstery:(i%2?materials.carpet:materials.linen),g);c.rotation.x=.35;}
    if(collision)solid(cx,cz,Math.abs(Math.cos(yaw))*w+Math.abs(Math.sin(yaw))*.95,Math.abs(Math.sin(yaw))*w+Math.abs(Math.cos(yaw))*.95);
    return g;
  }
  function chair(x,z,yaw=0,parent=furniture,scale=1,upholstery=materials.fabric) {
    const g=new THREE.Group();parent.add(g);g.position.set(x,0,z);g.rotation.y=yaw;g.scale.setScalar(scale);
    round(0,.44,0,.53,.10,.53,.09,upholstery,g);round(0,.70,-.23,.53,.48,.09,.04,upholstery===materials.fabric?materials.carpet:upholstery,g);
    for(const a of [-.18,.18])for(const b of [-.17,.17])cyl(a,.21,b,.022,.42,materials.bronze,g);
    return g;
  }
  function table(x,z,w,d,h=.75,parent=furniture) {
    round(x,h,z,w,.07,d,Math.min(.22,d/2-.01),materials.stone,parent);
    for(const dx of [-w*.29,w*.29])round(x+dx,h/2-.04,z,.18,h-.08,d*.52,.06,materials.walnut,parent);
  }
  function vase(x,z,y=0,parent=furniture) {cyl(x,y+.16,z,.095,.32,materials.pot,parent,.06); for(let i=0;i<3;i++){const s=cyl(x+(i-1)*.04,y+.49,z,.005,.43,materials.darkWood,parent);s.rotation.z=(i-1)*.18;const leaf=mesh(new THREE.SphereGeometry(.09,8,6),materials.leaf,parent);leaf.scale.set(1.2,.2,.6);leaf.position.set(x+(i-1)*.08,y+.62,z);}}
  function plant(x,z,size=1,parent=furniture) {
    cyl(x,.22*size,z,.22*size,.44*size,materials.pot,parent,.25*size);
    const trunk=cyl(x,.75*size,z,.025*size,1.15*size,materials.walnut,parent);trunk.rotation.z=.08;
    for(let i=0;i<9;i++) {const a=i*2.4,r=.2+(i%3)*.07;const o=mesh(new THREE.IcosahedronGeometry((.2+(i%2)*.04)*size,1),i%3?materials.leaf:materials.leafDark,parent);o.position.set(x+Math.cos(a)*r*size,(.85+i*.07)*size,z+Math.sin(a)*r*size);o.scale.set(1.25,.65,1);}
  }
  function counter(x,z,w,d,parent=furniture,body=materials.walnut) {box(x,.43,z,w,.86,d,body,parent);box(x,.89,z,w+.02,.065,d+.02,materials.stone,parent);if(parent===furniture&&w*d>.7)solid(x,z,w,d);}
  function kitchenCabinet(x,z,w,d) {
    counter(x,z,w,d,furniture,materials.kitchen);
    if(d>w) {const face=x<13?x+w/2+.012:x-w/2-.012, n=Math.ceil(d/.6);for(let i=0;i<n;i++){const zz=z-d/2+(i+.5)*d/n;box(face,.47,zz,.028,.68,d/n-.055,materials.trim,furniture);box(face+(x<13?.018:-.018),.47,zz,.02,.61,d/n-.12,materials.kitchen,furniture);box(face+(x<13?.045:-.045),.73,zz,.035,.025,.24,materials.gold,furniture);}}
  }
  function basin(x,z,y=.94,parent=furniture) {round(x,y,z,.44,.11,.34,.09,materials.white,parent);round(x,y+.058,z,.31,.005,.22,.06,materials.water,parent);cyl(x,y+.16,z-.19,.012,.27,materials.bronze,parent);box(x,y+.28,z-.12,.022,.022,.14,materials.bronze,parent);}
  function toilet(x,z,yaw=0,parent=furniture) {const g=new THREE.Group();parent.add(g);g.position.set(x,0,z);g.rotation.y=yaw;round(0,.22,.06,.36,.42,.55,.17,materials.white,g);round(0,.45,.07,.39,.08,.57,.17,materials.white,g);box(0,.52,-.21,.39,.55,.16,materials.white,g);}
  function shower(x,z,w,d,parent=furniture) {box(x,.025,z,w,.05,d,materials.bath,parent);box(x,1.1,z+d/2,w,2.2,.018,materials.glass,parent);box(x-w/2,1.1,z,.018,2.2,d,materials.glass,parent);cyl(x,1.25,z-d/2+.06,.014,1.5,materials.bronze,parent);box(x,2.05,z-d/2+.21,.24,.025,.3,materials.bronze,parent);cyl(x,.056,z,.045,.008,materials.bronze,parent);}
  function artwork(axis,fixed,center,width=1.3,height=.85) {
    if(axis==='x') {box(center,1.75,fixed,width+.06,height+.06,.045,materials.bronze,furniture);box(center,1.75,fixed+.028,width,height,.012,materials.art,furniture);box(center+.17,1.75,fixed+.037,width*.14,height*.7,.006,materials.fabric,furniture);}
    else {box(fixed,1.75,center,.045,height+.06,width+.06,materials.bronze,furniture);box(fixed+.028,1.75,center,.012,height,width,materials.art,furniture);}
  }
  function pendant(x,z,length=1.5,y=2.35) {
    for(const dx of [-length*.32,length*.32])cyl(x+dx,(H+y)/2,z,.007,H-y,materials.bronze,ceilings);
    round(x,y,z,length,.055,.16,.05,materials.bronze,ceilings);round(x,y-.032,z,length-.08,.008,.1,.035,materials.glow,ceilings);
  }
  function diningChandelier(x,z) {
    box(x,2.42,z,.035,.035,2.5,materials.gold,ceilings);
    for(const dz of [-.85,.85])cyl(x,2.77,z+dz,.012,.65,materials.gold,ceilings);
    for(let i=0;i<7;i++) {const zz=z-1.08+i*.36;box(x,2.4,zz,.52,.025,.025,materials.gold,ceilings);for(const dx of [-.22,.22]){cyl(x+dx,2.17,zz,.105,.36,materials.glass,ceilings);cyl(x+dx,2.18,zz,.022,.29,materials.glow,ceilings);}}
  }
  function cove(x1,z1,x2,z2) {
    const y=H-.09;
    box((x1+x2)/2,y,z1,x2-x1,.025,.035,materials.glow,ceilings);box((x1+x2)/2,y,z2,x2-x1,.025,.035,materials.glow,ceilings);
    box(x1,y,(z1+z2)/2,.035,.025,z2-z1,materials.glow,ceilings);box(x2,y,(z1+z2)/2,.035,.025,z2-z1,materials.glow,ceilings);
    for(let i=0;i<3;i++){const off=i*.045,yy=H-.035-i*.025;box((x1+x2)/2,yy,z1-off,x2-x1+2*off,.025,.035,materials.wall,ceilings);box((x1+x2)/2,yy,z2+off,x2-x1+2*off,.025,.035,materials.wall,ceilings);box(x1-off,yy,(z1+z2)/2,.035,.025,z2-z1+2*off,materials.wall,ceilings);box(x2+off,yy,(z1+z2)/2,.035,.025,z2-z1+2*off,materials.wall,ceilings);}
  }

  // Floor outlines deliberately leave the lift/stair core unbuilt.
  floor(11.4,0,15.35,2.8,materials.stone,true,true);
  woodFloor(15.35,.85,17.3,2.8);
  floor(11.4,2.8,15.35,7.55,materials.stone,true,true);
  woodFloor(0,6.45,4.1,12.7); woodFloor(4.1,6.45,7.75,12.7); woodFloor(7.75,6.45,11.1,10.95); woodFloor(9.65,10.95,11.1,12.7);
  floor(0,11.35,2.55,14.1,materials.bath); floor(6.2,10.95,9.65,12.7,materials.bath);
  floor(2.55,12.7,11.15,14.1,materials.stone,true,true);
  floor(11.15,7.55,15.65,16.25,materials.stone,true,true);
  floor(15.65,10.8,18.5,16.15,materials.stone,true,true);
  floor(0,14.1,3.55,18.7,materials.bath,true,true);
  woodFloor(3.55,14.1,7.75,16.4); woodFloor(3.55,16.4,5,18.7);
  floor(7.75,14.1,11.1,16.25,materials.bath,true,true);
  woodFloor(5,16.4,8,24.9); woodFloor(0,18.7,5,24.9);
  floor(8,16.25,19.9,23.5,materials.stone,true,true);
  floor(0,24.9,8,26.4,materials.terrace,false);floor(8,23.5,19.9,26.4,materials.terrace,false);
  // Service rooms and kitchen.
  wall('x',0,11.4,15.35,{windows:[[12.1,15.1,.95,2.75]]});
  wall('z',11.4,0,6.45,{windows:[[3.55,5.85,.95,2.75]]});
  box(16.325,H/2,.425,1.95,H,.85,materials.wall);solid(16.325,.425,1.95,.85,'wall');
  wall('z',17.3,.85,2.8); wall('z',15.35,.85,2.8,{doors:[[1.85,2.65,2.3]]});
  wall('x',2.8,11.4,17.3,{doors:[[12.25,13.85,2.5]]});
  wall('z',15.35,2.8,7.55);wall('z',11.4,6.45,7.55);
  wall('x',7.55,11.15,15.65,{doors:[[12.4,14.35,2.6]]});
  // North bedrooms, with two suites and one distinct bedroom.
  wall('x',6.45,0,11.1,{windows:[[1.35,3.65,.3,2.78],[4.8,7.15,.3,2.78],[8.25,10.7,.3,2.78]]});
  wall('z',0,6.45,14.1,{windows:[[12.2,12.85,1.2,2.7]]});
  wall('z',4.1,6.45,12.7);wall('z',7.75,6.45,10.95);wall('z',11.1,6.45,12.7);
  wall('x',12.7,2.55,6.2,{doors:[[2.8,3.8],[4.3,5.3]]});
  wall('x',12.7,6.2,11.1,{doors:[[9.92,10.92]]});
  wall('x',11.35,0,2.55);wall('z',2.55,11.35,14.1,{doors:[[11.48,12.45,2.3]]});wall('x',14.1,0,3.55);
  wall('x',10.95,6.2,9.65);wall('z',6.2,10.95,12.7,{doors:[[11.15,12.15,2.3]]});wall('z',9.65,10.95,12.7);
  // Corridor, master suite and guest bathroom.
  wall('x',14.1,3.55,11.1,{doors:[[5.1,6.3],[7.95,8.9]]});
  wall('z',0,14.1,24.9,{windows:[[15.3,16.55,.6,2.78],[19.45,23.75,.25,2.78]]});
  wall('z',3.55,14.1,18.7,{doors:[[16.2,17.4,2.4]]});
  wall('x',17.55,0,3.55,{doors:[[1.0,2.45,2.3]]});
  wall('x',18.7,0,3.55);wall('z',7.75,14.1,16.4);
  wall('x',16.4,5,8);wall('z',5,16.4,18.7,{doors:[[17.05,18.25]]});
  wall('x',18.7,5,8);wall('z',5,18.7,24.9,{doors:[[20.75,23.65,2.65]]});
  wall('z',8,16.4,23.5);wall('z',8,23.5,24.9);
  wall('x',16.25,7.75,11.1);wall('z',11.1,14.1,16.25);
  // Family dining, foyer, private entrance. The public lift/stair lobby is excluded.
  wall('z',15.65,7.55,16.25,{doors:[[13.05,14.85,2.65]]});
  wall('x',10.8,15.65,18.5);wall('z',18.5,10.8,16.15);wall('x',16.15,15.65,18.5);
  wall('x',16.25,11.1,13.3);wall('z',13.3,12.8,16.25);
  // Structural columns follow the major positions visible on the source drawing.
  for(const [x,z,w,d] of [[.6,6.85,1.2,.8],[11.65,7.05,1.1,1.2],[7.25,15.2,.85,2.2],[7.4,24.2,1.2,1.4],[19.4,24.2,1,1.4],[.6,24.3,1.2,1.2]]) {
    box(x,H/2,z,w,H,d,materials.wall);solid(x,z,w,d,'wall');
  }
  // South facade: wide real walk-through slider openings to the balcony.
  wall('x',24.9,0,8,{doors:[[1.2,4.8,2.72],[5.2,6.7,2.72]]});
  glassDoor('x',24.9,1.2,4.8);glassDoor('x',24.9,5.2,6.7);
  wall('x',23.5,8,19.9,{doors:[[8.3,11.7,2.72],[12.0,15.9,2.72],[16.2,18.8,2.72]]});
  glassDoor('x',23.5,8.3,11.7);glassDoor('x',23.5,12,15.9);glassDoor('x',23.5,16.2,18.8);
  wall('z',19.9,16.25,23.5,{windows:[[16.7,23.15,.18,2.8]]});wall('x',16.25,15.65,19.9,{windows:[[16.15,19.35,.3,2.75]]});
  // Low clear balustrade, not a fabricated enclosed room.
  function rail(axis,fixed,a,b) {
    const x=axis==='x'?(a+b)/2:fixed,z=axis==='x'?fixed:(a+b)/2;
    box(x,.55,z,axis==='x'?b-a:.025,1.1,axis==='x'?.025:b-a,materials.glass);
    box(x,1.11,z,axis==='x'?b-a:.055,.055,axis==='x'?.055:b-a,materials.bronze);
    for(let v=a;v<=b;v+=1.3)box(axis==='x'?v:fixed,.55,axis==='x'?fixed:v,.035,1.1,.035,materials.bronze);
    solid(x,z,axis==='x'?b-a:.12,axis==='x'?.12:b-a,'wall');
  }
  rail('x',26.4,0,19.9);rail('z',0,24.9,26.4);rail('z',19.9,23.5,26.4);

  // Replaceable room furniture. All decorative additions are interpretative.
  bed(1.65,9.05,1.9,2.1,Math.PI/2,'北西套房 · 双人床');
  cabinet(1.45,10.98,2.45,.52,2.3);chair(3.15,7.35,-.5);cyl(2.8,.47,7.35,.24,.05,materials.stone);cyl(2.8,.23,7.35,.06,.46,materials.bronze);
  bed(6.32,8.55,1.8,2.05,-Math.PI/2,'北中套房 · 双人床');cabinet(6.95,10.54,1.45,.55,2.35);
  bed(9.0,8.55,1.75,2.05,Math.PI/2,'北东独立卧室 · 双人床');cabinet(8.85,10.56,1.75,.5,2.35);
  counter(.8,11.78,.9,.48);basin(.8,11.78);toilet(.6,12.55,-Math.PI/2);shower(1.88,13.42,1.1,1.05);
  counter(6.95,12.34,1.1,.5);basin(6.95,12.34);toilet(7.85,12.28,Math.PI);shower(9.02,11.6,1.02,1.05);
  // Main suite: separately accessible bath, dressing rooms and sleeping room.
  bed(1.8,21.7,2.0,2.15,Math.PI/2,'主卧 · 双人床');cabinet(1.9,19.08,3.0,.54,2.5);
  chair(2.2,24.0,.55, furniture,1.25);cyl(2.9,.42,24.0,.23,.05,materials.stone);cyl(2.9,.22,24,.055,.4,materials.bronze);
  cabinet(6.5,16.75,2.75,.55,2.5);cabinet(6.5,18.31,2.75,.55,2.5);cabinet(6.5,19.08,2.75,.55,2.5);
  cabinet(7.58,21.46,.58,4.1,2.5);round(6.15,.42,21.6,.75,.75,1.25,.16,materials.fabric);solid(6.15,21.6,.75,1.25);
  counter(6.04,24.27,1.2,.55);chair(6.04,23.76,Math.PI);
  counter(1.78,14.48,2.7,.55);basin(1.15,14.48);basin(2.3,14.48);
  round(.67,.33,16.0,.82,.60,1.75,.38,materials.white);round(.67,.64,16,.64,.015,1.52,.3,materials.water);
  shower(.85,18.13,1.4,1.03);toilet(2.55,18.1,Math.PI/2);
  counter(8.33,15.83,.85,.5);basin(8.33,15.83);toilet(9.1,15.77,Math.PI);shower(10.25,15.08,1.15,1.43);
  // Combined Chinese / western kitchen and service suite.
  kitchenCabinet(11.85,5.17,.65,3.65);kitchenCabinet(14.9,4.96,.65,3.95);
  box(11.86,2.13,4.23,.66,1.1,1.75,materials.kitchen,furniture);box(14.91,2.13,4.23,.66,1.1,1.75,materials.kitchen,furniture);
  for(const x of [12.21,14.56])for(const z of [3.7,4.23,4.75])box(x,1.94,z,.035,.26,.025,materials.gold,furniture);
  box(14.5,1.23,3.48,.025,.55,.51,materials.dark,furniture);box(14.5,.65,3.48,.025,.48,.51,materials.dark,furniture);
  for(const z of [3.25,5.25])box(11.56,1.94,z,.055,1.05,.045,materials.gold,furniture);
  for(const y of [1.47,2.0,2.5])box(11.62,y,4.25,.28,.04,2.05,materials.gold,furniture);
  counter(13.34,4.97,.72,2.0,furniture,materials.stone);basin(11.87,5.4);basin(13.34,4.55);
  box(14.88,.94,4.72,.54,.025,.83,materials.dark,furniture);
  for(const z of [4.49,4.95]) {cyl(14.87,.962,z,.13,.012,materials.bronze);cyl(14.87,.97,z,.085,.012,materials.dark);}
  box(14.87,1.93,4.72,.62,.20,.85,materials.bronze,furniture);
  counter(13.35,.35,2.8,.6);basin(12.5,.35);box(11.84,.48,1.82,.64,.96,1.3,materials.white,furniture);
  for(const z of [1.5,2.13]) {const washer=mesh(new THREE.CylinderGeometry(.22,.22,.035,24),materials.dark,furniture);washer.rotation.z=Math.PI/2;washer.position.set(12.18,.48,z);}
  const cot=named('储藏/家政辅助间 · 示意床');round(16.69,.22,1.67,.85,.4,1.65,.05,materials.oak,cot);round(16.69,.46,1.67,.82,.13,1.62,.05,materials.linen,cot);round(16.69,.57,1.1,.66,.12,.4,.07,materials.fabric,cot);solid(16.69,1.67,.85,1.65);
  // Family dining, with built-in banquette at the east wall.
  sofa(15.03,9.75,2.5,-Math.PI/2,'家庭厅 · 卡座');table(14.05,9.8,.86,2.35,.75);
  chair(13.31,9.22,Math.PI/2);chair(13.31,10.18,Math.PI/2);chair(14.05,8.25,0);chair(14.05,11.36,Math.PI);
  counter(11.55,9.78,.55,2.75);vase(11.55,9.2,.93);plant(14.95,8.15,.8);
  // The foyer screen is in the location on the original plan, not across a door.
  box(13.19,1.4,14.42,.12,2.8,2.8,materials.walnut,furniture);
  for(let z=13.18;z<15.72;z+=.13)box(13.1,1.4,z,.035,2.8,.045,materials.bronze,furniture);
  counter(16.9,15.74,2.15,.5);vase(17.4,15.74,.93);artwork('x',15.44,16.9,1.5,.9);
  // South salon + formal dining. Generous circulation follows the drawn plan.
  rug(11.58,20.4,5.85,5.25);
  sofa(13.98,20.05,2.85,-Math.PI/2,'客厅 · 参照照片黑皮主沙发',true,materials.leather);
  const daybed=sofa(11.32,22.22,3.0,Math.PI,'客厅 · 参照照片奶白卧榻');daybed.children[1].scale.x=.5;daybed.children[1].position.x=-.65;daybed.children[3].visible=false;
  chair(10.1,19.65,-.55,furniture,1.42);chair(9.64,17.85,-.65,furniture,1.22);
  table(11.9,20.08,.95,1.85,.36);table(10.55,20.8,.9,1.55,.41);cyl(11.15,.52,20.25,.38,.055,materials.gold);cyl(11.15,.26,20.25,.045,.5,materials.gold);
  vase(11.89,19.8,.43);round(11.85,.415,20.37,.31,.045,.24,.01,materials.darkWood);
  box(8.15,1.3,20.33,.11,2.6,3.5,materials.gold,furniture);box(8.23,1.61,20.33,.13,1.86,3.31,materials.stone,furniture);
  box(8.24,.38,20.33,.18,.38,3.35,materials.bronze,furniture);box(8.35,.34,20.33,.025,.2,2.77,materials.dark,furniture);
  box(8.37,.29,20.33,.026,.025,2.69,materials.glow,furniture);box(8.28,.12,20.33,.42,.24,3.5,materials.stone,furniture);
  for(let z=22.21;z<23.25;z+=.07)box(8.19,1.4,z,.07,2.8,.03,materials.trim,furniture);
  // A shallow illuminated display shelf, visible in the published living-room photograph.
  box(8.17,1.4,17.65,.14,2.8,1.3,materials.walnut,furniture);
  for(const y of [.28,.82,1.36,1.9,2.44]) {box(8.37,y,17.65,.47,.035,1.22,materials.stone,furniture);box(8.19,y+.04,17.65,.025,.02,1.15,materials.glow,furniture);vase(8.36,17.65,y+.04);}
  // Walnut grid panel and two independently generated abstract works.
  box(10.7,1.42,16.36,4.8,2.84,.07,materials.walnut,furniture);
  for(let x=8.3;x<13.2;x+=.8)box(x,1.42,16.41,.025,2.84,.025,materials.darkWood,furniture);
  for(let y=.1;y<2.85;y+=.56)box(10.7,y,16.41,4.8,.025,.025,materials.darkWood,furniture);
  for(const x of [10.1,11.8]) {artwork('x',16.46,x,1.04,1.45);for(let i=0;i<7;i++){const p=box(x+Math.sin(i*2.3)*.35,1.75+Math.cos(i*2.5)*.5,16.504,.12,.47,.007,i%2?materials.khaki:materials.leafDark,furniture);p.rotation.z=i*.53;}}
  chair(11.5,17.68,0);chair(12.36,17.68,0);cyl(11.94,.44,17.65,.24,.05,materials.stone);
  table(17.43,20.8,1.04,3.05,.76);
  for(const z of [19.78,20.48,21.18,21.88]) {chair(16.64,z,Math.PI/2,furniture,1,materials.caramel);chair(18.22,z,-Math.PI/2,furniture,1,materials.caramel);}
  counter(19.45,20.75,.48,3.7);vase(19.45,19.85,.93);vase(17.43,20.8,.81);
  round(17.44,.43,17.65,2.15,.10,.68,.33,materials.walnut);cyl(16.9,.21,17.65,.12,.42,materials.bronze);cyl(17.98,.21,17.65,.12,.42,materials.bronze);
  plant(19.22,16.85,.95);plant(8.65,23.98,1.02);
  // Open viewing balcony, consistent with the south setback of the master suite.
  chair(10.02,24.55,0,furniture,1.18);chair(11.72,24.55,0,furniture,1.18);cyl(10.86,.43,24.55,.31,.055,materials.stone);cyl(10.86,.21,24.55,.09,.41,materials.bronze);
  sofa(17.02,24.48,1.75,Math.PI,'阳台 · 户外沙发',false);chair(16.0,25.53,-.7);cyl(16.8,.39,25.33,.36,.05,materials.stone);cyl(16.8,.2,25.33,.12,.36,materials.bronze);
  plant(.65,25.65,.95);plant(1.28,25.66,.65);plant(18.72,25.63,1.13);plant(18.8,24.7,.88);
  // Art, ceiling coffers and quiet strips use the same neutral material palette.
  artwork('x',14.0,4.25,.8,.8);artwork('z',4.18,8.2,1.3,.9);artwork('z',11.2,11.3,1.2,1.05);
  cove(8.6,16.8,15.2,22.9);cove(16.1,16.8,19.35,22.9);cove(.45,19.15,4.55,24.35);cove(11.7,8.0,15.1,12.1);
  diningChandelier(17.43,20.8);pendant(14.05,9.8,1.6);
  cyl(13.35,2.76,4.95,.015,.65,materials.gold,ceilings);
  for(let i=0;i<24;i++){const a=i*Math.PI/12,drop=mesh(new THREE.SphereGeometry(.062,8,6),materials.glass,ceilings);drop.position.set(13.35+Math.cos(a)*.38,2.30+(i%3)*.065,4.95+Math.sin(a)*.38);drop.scale.y=1.8;}
  cyl(13.35,2.38,4.95,.23,.18,materials.glow,ceilings);
  for(const [x,z] of [[3,7.2],[5.1,7.2],[10.2,7.2],[4.5,13.4],[8.3,13.4],[14.5,14.7],[16.9,13.6],[4.2,15.2],[1.9,15.5],[6.1,20.1],[6.1,23.9]])cyl(x,H-.045,z,.055,.025,materials.glow,ceilings);
  ceilings.visible = false;
  const rooms = [
    {id:'entry',name:'入户前厅',x:17.05,z:13.85,yaw:Math.PI/2,description:'独立入户前厅；电梯与公共楼梯未纳入住宅。'},
    {id:'foyer',name:'玄关',x:14.65,z:14.8,yaw:Math.PI,description:'从玄关向南进入客厅，向北连接家庭餐厅。'},
    {id:'living',name:'客厅',x:11.45,z:18.62,yaw:2.0,description:'南向客厅与品茗 / 宴会厅相连，落地门通往长阳台。'},
    {id:'dining',name:'品茗 / 宴会厅',x:16.05,z:18.65,yaw:-.55,description:'南侧正式餐区；座椅、茶台与材质为可替换室内陈设。'},
    {id:'family',name:'家庭厅 / 餐厅',x:12.35,z:11.6,yaw:-.75,description:'家庭餐厅与中西厨相接。'},
    {id:'kitchen',name:'中西厨',x:13.4,z:6.7,yaw:0,description:'保留中央工作台与两侧操作台布局。'},
    {id:'utility',name:'家政空间',x:13.4,z:1.85,yaw:0,description:'北侧家政区与独立保姆 / 储藏间。'},
    {id:'bedroom-1',name:'北西套房',x:3.25,z:10.05,yaw:Math.PI/2,description:'独立套房，保留南侧套内卫生间。'},
    {id:'bedroom-2',name:'北中套房',x:4.75,z:10.6,yaw:-.75,description:'独立套房，卫生间在卧室东南侧。'},
    {id:'bedroom-3',name:'北东卧室',x:10.5,z:11.6,yaw:0,description:'保留原户型独立卧室与入口，未与相邻卧室打通。'},
    {id:'master',name:'主卧套房',x:3.75,z:22.6,yaw:1.0,description:'西南主卧连通衣帽区、主卫与南侧阳台。'},
    {id:'dressing',name:'衣帽间',x:6.25,z:23.1,yaw:0,description:'主卧东侧步入式衣帽间。'},
    {id:'master-bath',name:'主卫',x:2.65,z:16.45,yaw:Math.PI/2,description:'双台盆、浴缸与独立淋浴 / 卫生区。'},
    {id:'balcony',name:'约20米景观阳台',x:13.65,z:25.25,yaw:0,description:'按户型图南侧连续阳台描摹，长度约19.9米。'},
  ];
  const bounds={minX:-.15,maxX:20.05,minZ:-.15,maxZ:26.55};
  const entry={x:17.05,z:13.85,yaw:Math.PI/2};
  const metrics={planWidth:19.9,planDepth:26.4,height:H,advertisedArea:385,bedrooms:4,bathrooms:4,ceilingHeightAssumed:true,source:'公开转载的开发商版式户型图：天览385A 22栋01号房，横向4100+3650+3750+8400毫米标定',notes:'平面为户型图描摹，局部按图估读；净高3.10米为演示假设。客餐厅、厨房与主卧材质参照已核看的385㎡样板间公开照片，家具尺寸与无法核验的房间陈设仍为近似表达；不能据展示照片断定楼层或窗外景观。建筑面积385㎡为原图宣传口径，不等同模型净使用面积。公摊电梯、楼梯及图旁可变空间示意未建为居室。',openings};
  group.userData.materials=materials;
  group.userData.provenance={geometry:'public-floor-plan-not-surveyed',furniture:'photo-referenced-and-interpretive-replaceable',verticalDimensions:'assumed',photoReference:'385sqm sample room living/dining/kitchen: published photos; master suite: medium-confidence same-size sample room photos; north bedrooms: unverified decor'};
  // Batch opaque meshes inside each named component. This preserves room pieces,
  // material controls and ceiling/furniture visibility while reducing draw calls.
  function batch(root) {
    for(const child of [...root.children])if(child.isGroup)batch(child);
    const bins=new Map();
    for(const o of root.children)if(o.isMesh&&o.visible&&!o.material.transparent) {
      const key=o.material.uuid;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(o);
    }
    for(const list of bins.values()) {
      if(list.length<2)continue;
      const positions=[],normals=[],uvs=[],v=new THREE.Vector3(),n=new THREE.Vector3();
      for(const o of list) {
        o.updateMatrix();const normalMatrix=new THREE.Matrix3().getNormalMatrix(o.matrix);
        const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry;
        const pa=geo.getAttribute('position'),na=geo.getAttribute('normal'),ua=geo.getAttribute('uv');
        for(let i=0;i<pa.count;i++) {v.fromBufferAttribute(pa,i).applyMatrix4(o.matrix);positions.push(v.x,v.y,v.z);n.fromBufferAttribute(na,i).applyMatrix3(normalMatrix).normalize();normals.push(n.x,n.y,n.z);uvs.push(ua?ua.getX(i):0,ua?ua.getY(i):0);}
        root.remove(o);if(geo!==o.geometry)geo.dispose();o.geometry.dispose();
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.computeBoundingSphere();
      const combined=mesh(geo,list[0].material,root);combined.name='合并静态几何 · '+list.length+'件';
    }
  }
  batch(architecture);batch(furniture);batch(ceilings);
  return {group,ceilings,furniture,colliders,rooms,bounds,entry,metrics,walkable};
}
