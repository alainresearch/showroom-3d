import * as THREE from 'three';
import { setBoxUVInMetres } from './materials.js?v=39a1f44f4e17';

// Original classic-American furniture studies, dimensioned for this apartment.
// Not manufacturer CAD or a reconstruction of the actual showroom furnishings.
export function addAmericanRooms({ parent, ceilings, materials: m, colliders }) {
  const root = new THREE.Group(); root.name = '美式设计 · 餐厅、主卧与书房'; parent.add(root);
  const wood=(m.mahogany||m.walnut).clone();wood.name='美式家具 · 抛光桃花心木';wood.color.multiplyScalar(.88);wood.roughness=.32;
  const brass=(m.brass||m.gold).clone();brass.name='美式家具 · 旧黄铜';brass.roughness=.30;
  const ivory=m.linen.clone();ivory.name='美式家具 · 象牙白软包';ivory.color.set('#e7d9bd');
  const cream=m.fabric.clone();cream.name='美式家具 · 米金色亚麻';cream.color.set('#c7b48d');
  const leather=(m.cognac||m.caramel).clone();leather.name='美式家具 · 干邑皮革';leather.color.set('#794c32');
  const olive=(m.velvet||m.fabric).clone();olive.name='美式家具 · 墨绿丝绒';olive.color.set('#394b3c');
  const dark=m.dark.clone();dark.color.set('#24221d');
  const blue=new THREE.MeshStandardMaterial({color:'#243949',roughness:.8});
  const parchment=new THREE.MeshStandardMaterial({color:'#cebb94',roughness:.9});
  const oxblood=new THREE.MeshStandardMaterial({color:'#643b31',roughness:.7});
  const bookMats=[wood,blue,parchment,oxblood,olive];
  const mirror=new THREE.MeshStandardMaterial({color:'#aeb9ae',roughness:.09,metalness:.95});
  const lampshade=new THREE.MeshStandardMaterial({color:'#f3e8ce',roughness:.7,side:THREE.DoubleSide,emissive:'#c19854',emissiveIntensity:.12});
  const glow=m.glow.clone();glow.emissiveIntensity=.65;
  function group(name,x=0,z=0,yaw=0,p=root){const g=new THREE.Group();g.name=name;g.position.set(x,0,z);g.rotation.y=yaw;p.add(g);return g;}
  function mesh(geo,mat,p=root){const o=new THREE.Mesh(geo,mat);o.castShadow=!mat.transparent;o.receiveShadow=true;p.add(o);return o;}
  function box(p,x,y,z,w,h,d,mat=wood){const geo=new THREE.BoxGeometry(w,h,d);setBoxUVInMetres(geo,w,h,d);const o=mesh(geo,mat,p);o.position.set(x,y,z);return o;}
  function cyl(p,x,y,z,r,h,mat=wood,top=r,n=18){const o=mesh(new THREE.CylinderGeometry(top,r,h,n),mat,p);o.position.set(x,y,z);return o;}
  function ball(p,x,y,z,r,mat=wood,s=[1,1,1]){const o=mesh(new THREE.SphereGeometry(r,12,8),mat,p);o.position.set(x,y,z);o.scale.set(...s);return o;}
  function pipe(p,pts,r,mat=wood,steps=32){const c=new THREE.CatmullRomCurve3(pts.map(a=>new THREE.Vector3(...a)));return mesh(new THREE.TubeGeometry(c,steps,r,6,false),mat,p);}
  function soft(p,x,y,z,w,h,d,r,mat=ivory,detail=6){
    r=Math.min(r,w*.47,h*.47,d*.47);
    const geo=new THREE.BoxGeometry(w,h,d,detail,detail,detail),pa=geo.attributes.position,na=geo.attributes.normal;
    const half=new THREE.Vector3(w/2-r,h/2-r,d/2-r),v=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3();
    for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i);c.set(THREE.MathUtils.clamp(v.x,-half.x,half.x),THREE.MathUtils.clamp(v.y,-half.y,half.y),THREE.MathUtils.clamp(v.z,-half.z,half.z));n.subVectors(v,c).normalize();v.copy(c).addScaledVector(n,r);pa.setXYZ(i,v.x,v.y,v.z);na.setXYZ(i,n.x,n.y,n.z);}
    setBoxUVInMetres(geo,w,h,d);geo.computeBoundingSphere();const o=mesh(geo,mat,p);o.position.set(x,y,z);return o;
  }
  function roundedShape(w,d,r){const s=new THREE.Shape(),x=-w/2,z=-d/2;s.moveTo(x+r,z);s.lineTo(x+w-r,z);s.quadraticCurveTo(x+w,z,x+w,z+r);s.lineTo(x+w,z+d-r);s.quadraticCurveTo(x+w,z+d,x+w-r,z+d);s.lineTo(x+r,z+d);s.quadraticCurveTo(x,z+d,x,z+d-r);s.lineTo(x,z+r);s.quadraticCurveTo(x,z,x+r,z);return s;}
  function slab(p,x,y,z,w,h,d,r,mat=wood){const geo=new THREE.ExtrudeGeometry(roundedShape(w,d,r),{depth:h,steps:1,bevelEnabled:true,bevelSize:.009,bevelThickness:.009,bevelSegments:2,curveSegments:10});geo.rotateX(-Math.PI/2);const o=mesh(geo,mat,p);o.position.set(x,y-h/2,z);return o;}
  function turned(p,x,z,y,h,r=.065,mat=wood){
    const profile=[[.66,0],[.76,.03],[.76,.08],[.48,.11],[.43,.25],[.70,.32],[.71,.39],[.42,.44],[.36,.73],[.61,.80],[.68,.88],[.68,1]].map(([rr,yy])=>new THREE.Vector2(rr*r,yy*h));
    const o=mesh(new THREE.LatheGeometry(profile,14),mat,p);o.position.set(x,y,z);return o;
  }
  function solid(x,z,w,d,yaw=0){const c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw)),wx=(w*c+d*s)/2,dz=(w*s+d*c)/2;colliders.push({minX:x-wx,maxX:x+wx,minZ:z-dz,maxZ:z+dz,type:'furniture'});}
  function knob(p,x,y,z,r=.014){const o=ball(p,x,y,z,r,brass,[1,1,.65]);return o;}
  function ring(p,x,y,z,r,t=.007,mat=brass,plane='y'){const o=mesh(new THREE.TorusGeometry(r,t,6,32),mat,p);o.position.set(x,y,z);if(plane==='y')o.rotation.x=Math.PI/2;return o;}
  function lamp(p,x,z,y,scale=1){
    cyl(p,x,y+.014*scale,z,.13*scale,.028*scale,wood);cyl(p,x,y+.036*scale,z,.115*scale,.018*scale,brass);
    const urn=mesh(new THREE.LatheGeometry([[0,0],[.045,.02],[.07,.08],[.075,.16],[.052,.23],[.025,.27],[.025,.30]].map(([r,h])=>new THREE.Vector2(r*scale,h*scale)),24),brass,p);urn.position.set(x,y+.045*scale,z);
    cyl(p,x,y+.43*scale,z,.19*scale,.28*scale,lampshade,.12*scale,36);ring(p,x,y+.29*scale,z,.19*scale,.004*scale);ring(p,x,y+.57*scale,z,.12*scale,.004*scale);
    cyl(p,x,y+.60*scale,z,.018*scale,.05*scale,brass);ball(p,x,y+.633*scale,z,.022*scale,brass);
  }
  function framePanel(p,x,y,z,w,h,mat=wood){box(p,x,y,z,w,h,.035,mat);for(const xx of [x-w/2+.035,x+w/2-.035])box(p,xx,y,z+.025,.022,h-.04,.025,wood);for(const yy of [y-h/2+.035,y+h/2-.035])box(p,x,yy,z+.025,w-.04,.022,.025,wood);}
  function chest(p,x,z,w=.70,h=.68,d=.52){
    for(const xx of [x-w*.35,x+w*.35])for(const zz of [z-d*.30,z+d*.30])turned(p,xx,zz,.025,.15,.055);
    box(p,x,.15+h*.43,z,w,h*.78,d);slab(p,x,h,z,w+.05,.065,d+.045,.025);
    for(let row=0;row<3;row++){const yy=.23+row*.17;framePanel(p,x,yy,z+d/2+.012,w-.065,.15);for(const xx of [x-w*.22,x+w*.22]){knob(p,xx,yy,z+d/2+.052);const pull=ring(p,xx,yy-.017,z+d/2+.058,.021,.004,brass,'z');pull.scale.y=.7;}}
  }
  function diningChair(x,z,yaw){
    const g=group('桃花心木软包餐椅',x,z,yaw);
    for(const xx of [-.22,.22])for(const zz of [-.20,.20])turned(g,xx,zz,.025,.42,.060);
    box(g,0,.39,0,.49,.12,.46);soft(g,0,.49,.015,.56,.14,.52,.045,cream);
    // A shield-shaped pierced timber frame around the upholstered back.
    const outline=new THREE.Shape();outline.moveTo(-.26,.55);outline.lineTo(-.30,1.01);outline.quadraticCurveTo(-.31,1.13,0,1.16);outline.quadraticCurveTo(.31,1.13,.30,1.01);outline.lineTo(.26,.55);outline.closePath();
    const geo=new THREE.ExtrudeGeometry(outline,{depth:.065,steps:1,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,curveSegments:10});const back=mesh(geo,wood,g);back.position.z=-.26;
    const pad=soft(g,0,.86,-.178,.45,.48,.09,.045,cream);pad.rotation.x=-.04;
    for(const xx of [-.185,.185])for(let j=0;j<8;j++)knob(g,xx,.64+j*.057,-.124,.007);
    solid(x,z,.57,.62,yaw);
    return g;
  }

  // Formal dining: twin pedestal table, eight dining chairs and a credenza.
  {
    const x=17.43,z=20.80,g=group('美式正式餐厅 · 双柱餐桌',x,z);
    slab(g,0,.79,0,1.18,.075,3.16,.22,wood);
    slab(g,0,.744,0,1.08,.045,3.05,.18,brass);
    box(g,0,.684,0,1.02,.09,2.82,wood);
    for(const zz of [-.96,.96]){
      turned(g,0,zz,.12,.54,.29,wood);ring(g,0,.185,zz,.18,.012);ring(g,0,.65,zz,.18,.012);
      for(const side of [-1,1])pipe(g,[[0,.24,zz],[side*.24,.14,zz],[side*.43,.055,zz]],.055,wood,18);
      for(const xx of [-.43,.43])soft(g,xx,.035,zz,.18,.07,.26,.025,wood);
    }
    // Restrained perimeter inlay follows the tabletop's principal axes.
    for(const xx of [-.49,.49])box(g,xx,.835,0,.005,.003,2.62,brass);
    for(const zz of [-1.37,1.37])box(g,0,.835,zz,.82,.003,.005,brass);
    solid(x,z,1.20,3.18);
    for(const zz of [19.67,20.43,21.19,21.95]){diningChair(16.47,zz,Math.PI/2);diningChair(18.39,zz,-Math.PI/2);}
    const display=group('美式餐边柜 · 黄铜饰面',19.43,20.72,-Math.PI/2);
    for(const xx of [-1.35,1.35])for(const zz of [-.16,.16])turned(display,xx,zz,.02,.18,.06);
    box(display,0,.49,0,3.15,.72,.44,wood);slab(display,0,.90,0,3.24,.07,.50,.035,m.slabStone||m.stone);
    for(const xx of [-1.18,-.39,.39,1.18]){framePanel(display,xx,.50,.231,.73,.59);knob(display,xx+.25,.52,.28,.016);}
    solid(19.43,20.72,.50,3.24);
    lamp(display,-1.11,0,.94,.82);lamp(display,1.11,0,.94,.82);
    // The credenza stands in front of glazing; keep the window clear above it.
    // Low flower arrangement and brass candle holders.
    const vase=mesh(new THREE.LatheGeometry([[.08,0],[.10,.03],[.13,.14],[.10,.22],[.075,.26]].map(v=>new THREE.Vector2(...v)),24),brass,g);vase.position.set(0,.835,0);
    for(let i=0;i<7;i++){const a=i*2.4,rr=.10+(i%2)*.05;pipe(g,[[0,.94,0],[Math.cos(a)*rr,1.18,Math.sin(a)*rr]],.004,m.leafDark,12);ball(g,Math.cos(a)*rr,1.19,Math.sin(a)*rr,.065,ivory,[1,.65,1]);}
    for(const zz of [-.75,.75]){turned(g,0,zz,.835,.24,.06,brass);cyl(g,0,1.12,zz,.025,.15,ivory);ball(g,0,1.20,zz,.014,glow,[.6,1.4,.6]);}
    // Brass six-arm chandelier with ivory shades, only in the ceiling layer.
    const light=group('美式餐厅 · 黄铜六臂吊灯',x,z,0,ceilings);
    cyl(light,0,3.065,0,.13,.055,brass);pipe(light,[[0,3.04,0],[0,2.56,0]],.014,brass,8);ball(light,0,2.44,0,.11,brass,[1,1.5,1]);
    for(let i=0;i<6;i++){const a=i*Math.PI/3,xx=Math.cos(a)*.39,zz=Math.sin(a)*.67;pipe(light,[[0,2.45,0],[xx*.7,2.20,zz*.7],[xx,2.24,zz],[xx,2.39,zz]],.018,brass,26);cyl(light,xx,2.42,zz,.09,.035,brass);cyl(light,xx,2.57,zz,.15,.24,lampshade,.095);ring(light,xx,2.45,zz,.15,.006);ball(light,xx,2.29,zz,.042,mirror,[.65,1.65,.65]);}
  }

  // Master suite: a timber-framed camelback upholstered bed with matching chests.
  {
    const g=group('美式主卧 · 弧顶木框软包床',1.80,21.70,Math.PI/2);
    slab(g,0,.25,0,2.07,.29,2.24,.10,wood);
    for(const xx of [-.88,.88])for(const zz of [-.93,.93])turned(g,xx,zz,.015,.22,.09);
    soft(g,0,.47,0,2.00,.27,2.15,.075,ivory);
    soft(g,0,.655,.23,1.98,.16,1.64,.065,ivory);
    // Curved headboard rises in the middle instead of a rectangular block.
    const profile=(w,bottom,shoulder,top)=>{const s=new THREE.Shape();s.moveTo(-w/2,bottom);s.lineTo(-w/2,shoulder);s.bezierCurveTo(-w*.42,shoulder+.03,-w*.30,top,0,top);s.bezierCurveTo(w*.30,top,w*.42,shoulder+.03,w/2,shoulder);s.lineTo(w/2,bottom);s.closePath();return s;};
    const outer=mesh(new THREE.ExtrudeGeometry(profile(2.34,.22,1.63,1.97),{depth:.14,steps:1,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,curveSegments:16}),wood,g);outer.position.z=-1.22;
    const inset=mesh(new THREE.ExtrudeGeometry(profile(2.14,.37,1.54,1.84),{depth:.045,steps:1,bevelEnabled:true,bevelSize:.028,bevelThickness:.028,bevelSegments:3,curveSegments:16}),cream,g);inset.position.z=-1.064;
    // Diamond seams and button tufts create deliberate upholstery structure.
    for(let row=0;row<4;row++)for(let col=0;col<7;col++){
      const xx=(col-3)*.29+(row%2)*.145,yy=.58+row*.29;if(Math.abs(xx)>.96||yy>1.67)continue;
      ball(g,xx,yy,-.994,.018,cream,[1,1,.45]);
      for(const sign of [-1,1])if(Math.abs(xx+sign*.145)<1.01&&yy+.145<1.72)pipe(g,[[xx,yy,-1.014],[xx+sign*.145,yy+.145,-1.010]],.0025,wood,8);
    }
    for(const xx of [-1.18,1.18]){turned(g,xx,-1.15,.04,1.79,.10);ball(g,xx,1.91,-1.15,.073,wood);ring(g,xx,1.83,-1.15,.059,.006);}
    // Paneled low foot rail, with capped posts and a softly patterned bolster.
    box(g,0,.37,1.14,2.15,.45,.10,wood);box(g,0,.39,1.199,1.89,.27,.014,cream);
    for(const xx of [-1.11,1.11]){turned(g,xx,1.14,.025,.66,.085);ball(g,xx,.74,1.14,.065,wood);}
    for(const xx of [-.48,.48]){const p=soft(g,xx,.80,-.71,.86,.25,.57,.10,ivory);p.rotation.x=-.13;const q=soft(g,xx,.89,-.91,.77,.36,.18,.07,cream);q.rotation.x=-.15;}
    const bolster=cyl(g,0,.84,.55,.12,1.25,olive);bolster.rotation.z=Math.PI/2;
    soft(g,0,.76,.74,2.02,.035,.53,.014,olive);
    for(const xx of [-.94,.94])soft(g,xx,.62,.74,.09,.30,.53,.025,olive);
    // Two chests and two identical urn lamps keep the arrangement balanced.
    for(const xx of [-1.47,1.47]){chest(g,xx,-.70,.64,.69,.52);lamp(g,xx,-.70,.73,.93);}
    solid(1.80,21.70,2.40,2.36,Math.PI/2);
    for(const zz of [20.23,23.17])solid(1.10,zz,.54,.66);
    const bench=group('美式主卧 · 床尾软包凳',3.30,21.70,Math.PI/2);
    soft(bench,0,.48,0,1.76,.18,.48,.065,cream);
    for(const xx of [-.72,.72])for(const zz of [-.15,.15])turned(bench,xx,zz,.015,.40,.060);
    for(const xx of [-.6,-.3,0,.3,.6])knob(bench,xx,.575,0,.009);
    solid(3.30,21.70,1.80,.50,Math.PI/2);
    // Low dresser north of the bed, plus an oval beveled-mirror impression.
    const dresser=group('美式主卧 · 抽屉斗柜与椭圆镜',2.04,19.02);
    for(const xx of [-1.04,1.04])for(const zz of [-.18,.18])turned(dresser,xx,zz,.02,.18,.07);
    box(dresser,0,.49,0,2.42,.72,.53,wood);slab(dresser,0,.90,0,2.50,.07,.59,.035,wood);
    for(const xx of [-.79,0,.79])for(const y of [.27,.52,.77]){framePanel(dresser,xx,y,.28,.72,.20);knob(dresser,xx,y,.32,.015);}
    const oval=mesh(new THREE.CircleGeometry(.62,48),mirror,dresser);oval.position.set(0,1.68,-.23);oval.scale.set(.77,1.0,1);
    const rim=ring(dresser,0,1.68,-.218,.65,.032,wood,'z');rim.scale.x=.77;
    const inner=ring(dresser,0,1.68,-.18,.61,.008,brass,'z');inner.scale.x=.77;
    lamp(dresser,-.89,0,.94,.78);lamp(dresser,.89,0,.94,.78);
    solid(2.04,19.02,2.50,.59);
    const rug=slab(root,2.15,.014,21.78,3.90,.022,4.34,.035,m.carpet);rug.name='主卧 · 古典图案地毯';
  }

  // An independent, richly furnished library: no new doorway or wall changes.
  {
    const g=group('美式书房 · 书桌与整壁书柜');
    const x=9.36,z=8.28;
    slab(g,x,.79,z,1.96,.075,.91,.055,wood);slab(g,x,.742,z,1.88,.035,.84,.035,brass);
    box(g,x,.71,z,1.83,.09,.79,wood);
    // Leather writing insert and paired pedestal drawers.
    slab(g,x,.836,z,1.22,.008,.57,.025,olive);
    for(const xx of [x-.67,x+.67]){
      for(const dx of [-.13,.13])for(const zz of [z-.29,z+.29])turned(g,xx+dx,zz,.015,.16,.053);
      box(g,xx,.42,z,.45,.56,.73,wood);
      for(const y of [.24,.42,.60]){framePanel(g,xx,y,z+.375,.39,.155);knob(g,xx,y,z+.416,.013);}
    }
    solid(x,z,2.00,.94);
    const chair=group('美式书房 · 高背皮椅',x,9.40,Math.PI);
    for(const xx of [-.25,.25])for(const zz of [-.22,.22])turned(chair,xx,zz,.02,.40,.065);
    soft(chair,0,.49,.015,.66,.17,.61,.07,leather);
    soft(chair,0,.90,-.245,.67,.77,.16,.07,leather);
    for(const xx of [-.32,.32]){turned(chair,xx,.18,.40,.25,.04);pipe(chair,[[xx,.71,.24],[xx,.75,0],[xx,.86,-.22]],.045,wood,24);}
    for(const xx of [-.23,0,.23])for(const yy of [.67,.88,1.09])ball(chair,xx,yy,-.153,.012,brass,[1,1,.45]);
    solid(x,9.40,.73,.72);
    // Bookcase has paneled lower doors, a cornice and slender fluted stiles.
    box(g,7.91,1.33,8.64,.055,2.60,3.12,wood);
    for(const zz of [7.08,8.12,9.16,10.20])box(g,8.08,1.33,zz,.39,2.60,.058,wood);
    for(const yy of [.10,.74,1.28,1.82,2.36,2.65])box(g,8.08,yy,8.64,.39,.045,3.17,wood);
    box(g,8.09,2.72,8.64,.48,.09,3.24,wood);box(g,8.10,2.79,8.64,.53,.045,3.30,wood);
    for(const zz of [7.60,8.64,9.68]){
      box(g,8.29,.42,zz,.027,.55,.93,wood);
      for(const dz of [-.40,.40])box(g,8.312,.42,zz+dz,.02,.47,.026,brass);
      for(const yy of [.205,.635])box(g,8.312,yy,zz,.02,.026,.82,brass);
      const k=ball(g,8.337,.43,zz-.31,.015,brass);
    }
    for(let row=0;row<3;row++)for(let bay=0;bay<3;bay++)for(let i=0;i<7;i++){
      const yy=.77+row*.54,zz=7.22+bay*1.04+i*.115,h=.27+(i%3)*.043,mat=bookMats[(i+row+bay)%bookMats.length];
      box(g,8.10,yy+h/2,zz,.24,h,.065+(i%2)*.016,mat);
      for(const y of [yy+.052,yy+h-.052])box(g,8.225,y,zz,.004,.007,.058,brass);
    }
    solid(8.09,8.64,.46,3.25);
    // A green glass banker lamp, closed books, pen tray and small globe.
    cyl(g,x+.65,.862,z-.18,.11,.035,brass);pipe(g,[[x+.65,.87,z-.18],[x+.65,1.12,z-.18],[x+.65,1.18,z-.08]],.012,brass,18);
    const shade=mesh(new THREE.SphereGeometry(.17,24,12,0,Math.PI*2,0,Math.PI/2),olive,g);shade.position.set(x+.65,1.19,z-.05);shade.scale.set(1.4,.45,.65);
    for(let i=0;i<3;i++)box(g,x-.66,.86+i*.035,z-.12,.36,.032,.25,bookMats[i]);
    slab(g,x+.20,.856,z+.24,.31,.013,.085,.015,brass);box(g,x+.18,.872,z+.24,.20,.007,.007,dark);
    cyl(g,x-.63,.89,z+.27,.07,.025,wood);ring(g,x-.63,1.02,z+.27,.12,.008,brass,'z');ball(g,x-.63,1.02,z+.27,.10,m.khaki||cream);
  }
  let triangles=0,meshes=0;
  for(const g of [root,...ceilings.children.filter(o=>o.name==='美式餐厅 · 黄铜六臂吊灯')])g.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});
  root.userData={design:'Original classic-American furniture proposal',triangles,meshCountBeforeBatch:meshes,dimensions:'estimated for viewer clearance, not construction or procurement data'};
  return {group:root,triangles,meshes};
}
