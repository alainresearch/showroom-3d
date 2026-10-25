import * as THREE from 'three';
import { setBoxUVInMetres } from './materials.js?v=39a1f44f4e17';

// Original concept decoration for the American variant. The floor-plan walls,
// doors and bathroom/study separation remain owned by the shared room layout.
export function addAmericanDecor({parent,ceilings,materials:m,colliders}) {
  const g=new THREE.Group();g.name='美式经典饰面 · 壁炉台与线脚';parent.add(g);
  const fixture=new THREE.Group();fixture.name='美式黄铜蜡烛吊灯';ceilings.add(fixture);
  const ivory=m.trim,wood=m.mahogany||m.walnut,brass=m.brass||m.gold;
  const candle=m.linen.clone();candle.color.set('#f0e2c4');
  const curtain=m.linen.clone();curtain.color.set('#d5c3a3');curtain.side=THREE.DoubleSide;
  const black=new THREE.MeshStandardMaterial({color:'#201c17',roughness:.86});
  function mesh(geo,mat,p=g){const o=new THREE.Mesh(geo,mat);o.castShadow=!mat.transparent;o.receiveShadow=true;p.add(o);return o;}
  function box(x,y,z,w,h,d,mat=ivory,p=g){const geo=new THREE.BoxGeometry(w,h,d);setBoxUVInMetres(geo,w,h,d);const o=mesh(geo,mat,p);o.position.set(x,y,z);return o;}
  function cyl(x,y,z,r,h,mat=brass,p=g,rt=r){const o=mesh(new THREE.CylinderGeometry(rt,r,h,28),mat,p);o.position.set(x,y,z);return o;}
  function tube(points,r=.012,mat=brass,p=g){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),28,r,8,false),mat,p);}
  function oval(x,y,z,rx,ry,rz,mat,p=g){const o=mesh(new THREE.SphereGeometry(1,24,14),mat,p);o.position.set(x,y,z);o.scale.set(rx,ry,rz);return o;}

  // Patterned rug sits above the original rug's simple bound edge.
  const rug=mesh(new THREE.PlaneGeometry(5.72,5.12),m.persianRug);rug.rotation.x=-Math.PI/2;rug.position.set(11.58,.042,20.4);rug.castShadow=false;
  rug.name='原创花卉边框地毯';

  // A stone/ivory mantel around a dark fire opening, retaining the photographed
  // chimney-wall location. The upper mirror is design intent, not a real reflection.
  box(8.445,.68,20.33,.12,1.20,2.36,ivory);
  box(8.514,.64,20.33,.025,.86,1.76,black);
  box(8.538,.22,20.33,.025,.045,1.64,m.glow);
  for(const z of [19.18,21.48]) {
    box(8.48,.69,z,.22,1.22,.30,ivory);
    for(const y of [.12,.24,1.12,1.25])box(8.51,y,z,.29,.075,.40,ivory);
    for(const zz of [z-.08,z,z+.08])box(8.603,.7,zz,.017,.76,.017,m.wall);
  }
  box(8.50,1.34,20.33,.40,.15,2.90,ivory);
  box(8.48,1.46,20.33,.51,.09,3.10,ivory);
  box(8.43,.065,20.33,.66,.13,3.10,m.slabStone||m.stone);
  // A slender antique-brass mirror frame above the mantel.
  box(8.34,2.09,20.33,.045,1.12,1.94,m.mirror||m.smokeGlass);
  for(const z of [19.33,21.33])for(const x of [8.365,8.386])box(x,2.09,z,.025,1.23,.025,brass);
  for(const y of [1.49,2.69])for(const x of [8.365,8.386])box(x,y,20.33,.025,.025,2.03,brass);
  // Small finial-clock silhouette and paired tall candlesticks on the mantel.
  box(8.56,1.565,20.33,.14,.12,.42,wood);oval(8.56,1.78,20.33,.08,.22,.22,wood);
  const clockFace=mesh(new THREE.CircleGeometry(.145,36),m.linen);clockFace.position.set(8.646,1.79,20.33);clockFace.rotation.y=Math.PI/2;
  box(8.652,1.84,20.33,.004,.12,.008,brass);box(8.654,1.795,20.365,.004,.008,.08,brass);
  for(const z of [19.35,21.31]){
    cyl(8.53,1.535,z,.10,.04,brass);cyl(8.53,1.70,z,.025,.30,brass);cyl(8.53,1.87,z,.055,.045,brass);cyl(8.53,2.00,z,.027,.23,candle);
  }

  // Paneled wainscot below the paintings; their original canvases stay visible.
  box(10.70,.46,16.49,4.74,.82,.035,m.paintedPanel||m.wall);
  for(const y of [.10,.89,.96])box(10.70,y,16.535,4.8,.035,.045,wood);
  for(let x=8.35;x<13.0;x+=.79){
    for(const xx of [x+.055,x+.70])box(xx,.47,16.54,.022,.59,.025,ivory);
    for(const y of [.18,.76])box(x+.3775,y,16.54,.665,.022,.025,ivory);
  }
  for(const x of [8.32,13.08])box(x,1.91,16.49,.065,1.82,.055,wood);
  for(const y of [2.76,2.82,2.89])box(10.7,y,16.46,4.82,.035,.10+(y-2.76)*.38,ivory);
  for(const x of [8.76,12.77]){
    oval(x,1.99,16.56,.07,.20,.025,brass);
    tube([[x,1.87,16.60],[x,1.83,16.78],[x,2.02,16.87]],.012,brass);
    cyl(x,2.06,16.87,.075,.025,brass);cyl(x,2.18,16.87,.035,.21,m.glow);
    cyl(x,2.27,16.87,.115,.22,candle,g,.075);
  }

  // A formal, eight-arm candle chandelier. Small linen shades soften the light;
  // clear bead drops add restrained sparkle rather than a heavy glass mass.
  const cx=11.70,cz=20.15;
  cyl(cx,3.065,cz,.14,.045,brass,fixture);cyl(cx,2.88,cz,.017,.34,brass,fixture);
  oval(cx,2.72,cz,.11,.14,.11,brass,fixture);cyl(cx,2.59,cz,.18,.045,brass,fixture);
  const crystal=new THREE.MeshPhysicalMaterial({color:'#d9e3dc',roughness:.06,transmission:.65,thickness:.035,ior:1.45});crystal.name='American / chandelier crystal';
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4,dx=Math.cos(a),dz=Math.sin(a),x=cx+dx*.62,z=cz+dz*.62;
    tube([[cx+dx*.10,2.63,cz+dz*.10],[cx+dx*.34,2.46,cz+dz*.34],[x,2.49,z],[x,2.64,z]],.014,brass,fixture);
    cyl(x,2.645,z,.09,.03,brass,fixture);cyl(x,2.73,z,.028,.16,m.glow,fixture);
    cyl(x,2.82,z,.12,.22,candle,fixture,.075);
    const bead=oval(cx+dx*.43,2.44,cz+dz*.43,.027,.06,.027,crystal,fixture);bead.castShadow=false;
  }
  oval(cx,2.46,cz,.055,.095,.055,brass,fixture);

  // Curtains gather onto existing solid mullions, never across the clear doors.
  tube([[8.22,2.97,23.36],[15.98,2.97,23.36]],.018,brass);
  for(const x of [8.22,11.85,15.98]){
    const geo=new THREE.PlaneGeometry(.29,2.75,28,14),p=geo.attributes.position;
    for(let i=0;i<p.count;i++){
      const px=p.getX(i),py=p.getY(i),q=(py+1.375)/2.75,w=.80+.27*(1-q);
      p.setXYZ(i,px*w,py,.042*Math.cos(px/.29*Math.PI*8)*(1-.18*q));
    }
    geo.computeVertexNormals();const drape=mesh(geo,curtain);drape.position.set(x,1.49,23.35);
    box(x,.125,23.37,.30,.035,.016,m.gold);
    for(let i=0;i<4;i++){const ring=mesh(new THREE.TorusGeometry(.025,.005,5,14),brass);ring.position.set(x-.105+i*.07,2.89,23.36);}
  }
  // Layered crown line and quiet ceiling rosette around the main fixture.
  for(const y of [2.97,3.015]){
    box(11.7,y,16.62,6.46,.035,.13,ivory,fixture);box(11.7,y,23.13,6.46,.035,.13,ivory,fixture);
    box(8.47,y,19.875,.13,.035,6.51,ivory,fixture);box(14.93,y,19.875,.13,.035,6.51,ivory,fixture);
  }
  for(const r of [.25,.31,.39]){const ring=mesh(new THREE.TorusGeometry(r,.012,6,64),ivory,fixture);ring.rotation.x=Math.PI/2;ring.position.set(cx,3.035,cz);}
  g.userData={concept:'original-American-classic-decoration',measured:false};
  return {group:g,fixture};
}
