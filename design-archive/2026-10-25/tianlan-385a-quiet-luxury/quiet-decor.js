import * as THREE from 'three';
import { setBoxUVInMetres } from './materials.js';

// Original interpretation of restrained hospitality interiors: broad natural
// surfaces, proportion, texture and soft light. No photographed pixels or
// attributed designer/product geometry is embedded in this concept scene.
export function addQuietDecor({parent,ceilings,materials:m,colliders}) {
  const g=new THREE.Group();g.name='安静的自然材质 · 客厅墙面与软装';parent.add(g);
  const overhead=new THREE.Group();overhead.name='亚麻吊灯与隐蔽灯槽';ceilings.add(overhead);
  const stone=m.travertine||m.stone,oak=m.warmOak||m.oak,smoked=m.smokedOak||m.walnut,bronze=m.brushedBronze||m.bronze;
  const plaster=m.plaster||m.wall,black=new THREE.MeshStandardMaterial({color:'#2a2a25',roughness:.92});
  function mesh(geo,mat,p=g){const o=new THREE.Mesh(geo,mat);o.castShadow=!mat.transparent;o.receiveShadow=true;p.add(o);return o;}
  function box(x,y,z,w,h,d,mat,p=g){const geo=new THREE.BoxGeometry(w,h,d);setBoxUVInMetres(geo,w,h,d);const o=mesh(geo,mat,p);o.position.set(x,y,z);return o;}
  function cyl(x,y,z,r,h,mat,p=g,rt=r){const o=mesh(new THREE.CylinderGeometry(rt,r,h,36),mat,p);o.position.set(x,y,z);return o;}
  function oval(x,y,z,rx,ry,rz,mat,p=g){const o=mesh(new THREE.SphereGeometry(1,24,16),mat,p);o.position.set(x,y,z);o.scale.set(rx,ry,rz);return o;}
  function line(points,r,mat,p=g,segments=28){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),segments,r,7,false),mat,p);}

  // Unbordered, low-contrast sage/greige woven rug over the original edge.
  const rugMat=(m.quietRug||m.carpetLight).clone();
  for(const key of ['map','roughnessMap','normalMap'])if(rugMat[key]){rugMat[key]=rugMat[key].clone();rugMat[key].repeat.set(5.72/.8,5.12/.8);}
  box(11.58,.008,20.4,5.72,.016,5.12,m.carpet);
  const rug=mesh(new THREE.PlaneGeometry(5.72,5.12),rugMat);rug.rotation.x=-Math.PI/2; rug.position.set(11.58,.017,20.4);rug.castShadow=false;

  // West: large honed stone planes. A fine reveal is the only border detail.
  const joint=new THREE.MeshStandardMaterial({color:'#bcb7ab',roughness:.97});
  for(const [a,b] of [[18.46,19.26],[19.26,21.68],[21.68,23.28]])box(8.13,1.54,(a+b)/2,.10,3.03,b-a-.006,stone);
  // Six-millimetre joints are recessed rather than painted across one flat slab.
  for(const z of [19.26,21.68])box(8.169,1.54,z,.008,3.02,.006,joint);
  box(8.161,.021,20.87,.012,.010,4.82,joint);
  box(8.19,.55,20.63,.025,.13,2.74,black);
  box(8.208,.512,20.63,.008,.016,2.49,m.glow);
  box(8.34,.325,20.88,.40,.13,4.40,smoked);
  box(8.32,.242,20.88,.29,.025,4.18,black);
  box(8.537,.269,20.88,.004,.007,4.34,smoked);
  for(const z of [18.681,23.079])box(8.34,.325,z,.396,.125,.002,m.endGrain||smoked);
  // One modest ceramic form at the end of the ledge; no mantel clock/mirror.
  const ceramic=new THREE.MeshStandardMaterial({color:'#8e8370',roughness:.91});
  const vesselProfile=[[0,0],[.08,0],[.13,.08],[.15,.19],[.12,.31],[.055,.38],[.045,.42]].map(v=>new THREE.Vector2(...v));
  const vessel=mesh(new THREE.LatheGeometry(vesselProfile,32),ceramic);vessel.position.set(8.40,.39,22.55);
  line([[8.40,.79,22.55],[8.41,1.02,22.56],[8.37,1.25,22.60]],.005,smoked);
  line([[8.41,1.02,22.56],[8.45,1.16,22.47]],.0035,smoked);

  // Asymmetrical recessed timber niche beside the stone wall, with three
  // deliberately uneven shelves and only a few low ceramic/book silhouettes.
  box(8.125,1.53,17.45,.07,2.98,1.72,smoked);
  for(const z of [16.60,18.30])box(8.29,1.53,z,.34,2.98,.045,smoked);
  // Fine backing joints and capped shelf ends survive close viewing, without
  // adding decorative trim to the flat timber vocabulary.
  box(8.162,1.53,17.45,.003,2.92,.004,black);
  for(const y of [.20,1.06,2.16,2.97]){
    box(8.29,y,17.45,.34,.04,1.72,smoked);
    box(8.462,y-.013,17.45,.003,.005,1.67,oak);
    for(const z of [16.613,18.287])box(8.29,y,z,.334,.036,.002,m.endGrain||smoked);
  }
  // Recessed LED channels have a diffuser and a shallow front lip, so the
  // source is tucked behind the shelf rather than reading as an exposed bar.
  for(const y of [1.02,2.12,2.93]){
    box(8.205,y+.002,17.45,.048,.020,1.62,smoked);
    box(8.218,y-.009,17.45,.025,.005,1.58,m.glow);
    box(8.237,y-.005,17.45,.007,.016,1.62,smoked);
    for(const z of [16.64,18.26])box(8.205,y-.001,z,.045,.014,.008,bronze);
  }
  const warmCeramic=new THREE.MeshStandardMaterial({color:'#b2a58b',roughness:.92});
  oval(8.33,.40,17.84,.10,.18,.13,warmCeramic);
  cyl(8.33,.525,17.84,.055,.08,warmCeramic);
  for(let i=0;i<3;i++)box(8.32,1.10+i*.035,17.02,.22,.028,.38,[m.linen,m.sandFabric||m.fabric,smoked][i]);
  const bowl=mesh(new THREE.LatheGeometry([[0,0],[.06,0],[.13,.03],[.19,.08],[.19,.09],[.13,.055],[0,.02]].map(v=>new THREE.Vector2(...v)),36),warmCeramic);bowl.position.set(8.30,2.18,17.60);

  // North: natural plaster on one side, a slender timber screen on the other.
  // The round relief is matte and abstract, with no reflective gold perimeter.
  box(9.14,1.46,16.395,1.68,2.88,.045,plaster);
  for(const y of [.24,2.66])box(9.14,y,16.424,1.66,.009,.008,m.wall);
  box(11.56,1.46,16.39,3.10,2.88,.04,smoked);
  for(let x=10.06;x<13.12;x+=.105)box(x,1.46,16.445,.047,2.88,.085,oak);
  const reliefBase=plaster.clone();reliefBase.color.set('#b8aa8e');
  const reliefLight=plaster.clone();reliefLight.color.set('#d4cbb7');
  const reliefDark=plaster.clone();reliefDark.color.set('#9c927d');
  for(const mat of [reliefBase,reliefLight,reliefDark])mat.normalScale?.set(.11,.11);
  const round=mesh(new THREE.CylinderGeometry(.57,.57,.036,80),reliefBase);round.rotation.x=Math.PI/2;round.position.set(11.50,1.96,16.525);
  const half=mesh(new THREE.CircleGeometry(.49,64,0,Math.PI),reliefLight);half.position.set(11.50,1.96,16.548);
  const lower=mesh(new THREE.CircleGeometry(.45,64,Math.PI,Math.PI),reliefDark);lower.position.set(11.50,1.96,16.551);
  for(let i=-6;i<=6;i++){
    const x=i*.061,hh=Math.sqrt(Math.max(0,.47*.47-x*x));
    box(11.5+x,1.96+hh*.48,16.555,.008,hh*.94,.012,reliefBase);
  }
  box(11.50,1.925,16.565,1.08,.028,.027,smoked);
  // A long low floating timber ledge visually anchors this wall and the chairs.
  box(10.70,.25,16.59,4.70,.12,.34,smoked);
  box(10.70,.168,16.55,4.46,.02,.22,black);

  // Quiet pleated curtains gather at existing opaque mullions, leaving all
  // walk-through openings clear. A slim timber pelmet hides the warm light line.
  const cloth=(m.sandFabric||m.fabric).clone();cloth.color.set('#c9c1b0');cloth.side=THREE.DoubleSide;
  const hem=cloth.clone();hem.color.multiplyScalar(.97);
  const curtainHeight=2.83,curtainY=1.44;
  function pleat(xx,yy){
    const q=(yy+curtainHeight/2)/curtainHeight;
    const phase=xx/.29*Math.PI*8+.09*Math.sin(q*5+xx*11);
    return {x:xx*(.90+.14*(1-q)),y:yy+.003*Math.sin(phase*.45)*(1-q)*(1-q),z:.033*Math.cos(phase)+.0018*Math.sin(q*19+xx*47)};
  }
  for(const x of [8.22,11.85,15.98]){
    const geo=new THREE.PlaneGeometry(.29,curtainHeight,48,40),p=geo.attributes.position;
    for(let i=0;i<p.count;i++){const v=pleat(p.getX(i),p.getY(i));p.setXYZ(i,v.x,v.y,v.z);}
    geo.computeVertexNormals();const drape=mesh(geo,cloth);drape.position.set(x,curtainY,23.36);
    const hemGeo=new THREE.PlaneGeometry(.29,.040,48,2),hp=hemGeo.attributes.position;
    for(let i=0;i<hp.count;i++){const v=pleat(hp.getX(i),hp.getY(i)-curtainHeight/2+.020);hp.setXYZ(i,v.x,v.y,v.z+.002);}
    hemGeo.computeVertexNormals();const fold=mesh(hemGeo,hem);fold.position.set(x,curtainY,23.36);
    const seam=[];for(let i=0;i<=36;i++){const v=pleat(-.145+i*.29/36,-curtainHeight/2+.036);seam.push([x+v.x,curtainY+v.y,23.363+v.z]);}line(seam,.0009,hem);
    // A few concealed runners align with the gathered pleats above the cloth.
    for(let i=0;i<5;i++){const xx=x-.105+i*.0525;box(xx,2.888,23.36,.013,.016,.012,m.linen);line([[xx,2.885,23.36],[xx,2.866,23.365],[xx+.006,2.853,23.365]],.0025,bronze,g,8);}
  }
  box(12.05,2.917,23.36,7.68,.018,.030,bronze,overhead);
  for(const z of [23.344,23.376])box(12.05,2.906,z,7.68,.014,.006,bronze,overhead);
  for(const x of [8.205,15.895])box(x,2.913,23.36,.018,.026,.040,bronze,overhead);
  box(12.05,2.965,23.29,7.76,.13,.16,smoked,overhead);
  box(12.05,2.892,23.30,7.53,.014,.06,m.glow,overhead);
  box(8.225,3.018,19.90,.055,.015,6.55,m.glow,overhead);
  box(10.70,3.018,16.52,4.70,.015,.055,m.glow,overhead);

  // One soft, shallow linen lantern. Its broad diffuse surface replaces the
  // decorative chandelier language of the discarded scheme.
  const cx=11.62,cz=20.03;
  cyl(cx,3.055,cz,.065,.025,bronze,overhead);cyl(cx,2.94,cz,.006,.22,bronze,overhead);
  const outer=new THREE.SplineCurve([[.08,-.15],[.33,-.145],[.48,-.10],[.55,-.015],[.51,.09],[.35,.14],[.08,.15]].map(v=>new THREE.Vector2(...v))).getPoints(36);
  const inner=[...outer].reverse().map(v=>new THREE.Vector2(Math.max(.001,v.x-.002),v.y));
  const shadeProfile=[...outer,...inner,outer[0].clone()];
  const shadeGeo=new THREE.LatheGeometry(shadeProfile,72),sp=shadeGeo.attributes.position;
  for(let i=0;i<sp.count;i++){
    const xx=sp.getX(i),yy=sp.getY(i),zz=sp.getZ(i),angle=Math.atan2(zz,xx),r=Math.hypot(xx,zz);
    const tiny=.0007*Math.sin(angle*19+yy*13)+.0004*Math.sin(angle*37-yy*17);
    if(r>.001)sp.setXYZ(i,xx*(1+tiny/r),yy,zz*(1+tiny/r));
  }
  shadeGeo.computeVertexNormals();
  const shade=mesh(shadeGeo,m.diffuseLantern||m.linen,overhead);shade.position.set(cx,2.68,cz);shade.scale.z=.72;
  for(const yy of [2.536,2.825]){const r=yy<2.6?.33:.35,ring=mesh(new THREE.TorusGeometry(r,.004,5,64),m.linen,overhead);ring.rotation.x=Math.PI/2;ring.scale.y=.72;ring.position.set(cx,yy,cz);}
  const diffuser=mesh(new THREE.CircleGeometry(.33,64),m.diffuseLantern||m.glow,overhead);diffuser.rotation.x=Math.PI/2;diffuser.scale.y=.72;diffuser.position.set(cx,2.535,cz);

  g.userData={concept:'original-quiet-hospitality-material-and-light-study',measured:false};
  return {group:g,overhead};
}
