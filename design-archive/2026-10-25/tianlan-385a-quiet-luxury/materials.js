import * as THREE from 'three';

// Original, deterministic material studies drawn from observed colour / surface
// characteristics. No reference photograph, cropped texture or external asset
// is embedded here. All image data is computed locally, including under Node.
// World dimensions are metres. See setBoxUVInMetres() at the end of this file.

const TAU = Math.PI * 2;
const clamp = (v, low = 0, high = 1) => Math.min(high, Math.max(low, v));
const mix = (a, b, t) => a + (b - a) * t;
const fract = x => x - Math.floor(x);
const mod = (x, n) => ((x % n) + n) % n;
const smooth = x => x * x * (3 - 2 * x);

function hash(x, y, seed = 1) {
  let h = Math.imul(x ^ seed, 374761393) ^ Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function noise(u, v, fx = 4, fy = fx, seed = 1) {
  const x = u * fx, y = v * fy, ix = Math.floor(x), iy = Math.floor(y);
  const tx = smooth(fract(x)), ty = smooth(fract(y));
  const a = hash(mod(ix, fx), mod(iy, fy), seed);
  const b = hash(mod(ix + 1, fx), mod(iy, fy), seed);
  const c = hash(mod(ix, fx), mod(iy + 1, fy), seed);
  const d = hash(mod(ix + 1, fx), mod(iy + 1, fy), seed);
  return mix(mix(a, b, tx), mix(c, d, tx), ty);
}

function fbm(u, v, seed, base = 3, octaves = 4) {
  let value = 0, weight = .5, total = 0, frequency = base;
  for (let i = 0; i < octaves; i++) {
    value += noise(u, v, frequency, frequency, seed + i * 53) * weight;
    total += weight; weight *= .5; frequency *= 2;
  }
  return value / total;
}

function mineralBoundary(u, v, fx, fy, seed) {
  const cx = u * fx, cy = v * fy, ix = Math.floor(cx), iy = Math.floor(cy);
  let nearest = Infinity, second = Infinity;
  for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) {
    const a = ix + x, b = iy + y;
    const px = a + .1 + hash(mod(a, fx), mod(b, fy), seed) * .8;
    const py = b + .1 + hash(mod(a, fx), mod(b, fy), seed + 13) * .8;
    const d = (px - cx) ** 2 + (py - cy) ** 2;
    if (d < nearest) { second = nearest; nearest = d; }
    else if (d < second) second = d;
  }
  return Math.sqrt(second) - Math.sqrt(nearest);
}

function imageTexture(data, size, colour = false) {
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

// A sampler writes sRGB 0..255 in out[0..2], height 0..1 in out[3], and
// perceptual roughness 0..1 in out[4]. The height is only a micro-surface signal;
// normalScale controls the final relief and never changes collision geometry.
function surface(size, metres, sampler, normalStrength = 1, rotation = 0) {
  const rgba = new Uint8Array(size * size * 4);
  const roughness = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  const heights = new Float32Array(size * size);
  const out = new Float64Array(5);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    sampler(x / size, y / size, x, y, out);
    const p = y * size + x, i = p * 4;
    rgba[i] = clamp(Math.round(out[0]), 0, 255);
    rgba[i + 1] = clamp(Math.round(out[1]), 0, 255);
    rgba[i + 2] = clamp(Math.round(out[2]), 0, 255); rgba[i + 3] = 255;
    heights[p] = out[3];
    const r = Math.round(clamp(out[4]) * 255);
    roughness[i] = roughness[i + 1] = roughness[i + 2] = r;
    roughness[i + 3] = 255;
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const dx = (heights[y * size + mod(x + 1, size)] - heights[y * size + mod(x - 1, size)]) * normalStrength;
    const dy = (heights[mod(y + 1, size) * size + x] - heights[mod(y - 1, size) * size + x]) * normalStrength;
    const length = Math.sqrt(dx * dx + dy * dy + 1);
    normal[i] = Math.round(127.5 - dx / length * 127.5);
    normal[i + 1] = Math.round(127.5 - dy / length * 127.5);
    normal[i + 2] = Math.round(127.5 + 1 / length * 127.5);
    normal[i + 3] = 255;
  }
  const maps = { map: imageTexture(rgba, size, true), roughnessMap: imageTexture(roughness, size), normalMap: imageTexture(normal, size) };
  for (const texture of Object.values(maps)) {
    texture.repeat.set(1 / metres[0], 1 / metres[1]);
    texture.rotation = rotation;
  }
  return { maps, metres };
}

function createStone({ slab = false } = {}) {
  // Calm honed limestone / travertine: horizontal mineral bedding and small
  // elongated pores. No high-contrast diagonal marble or gold veining.
  return surface(512, slab ? [2.8,1.7] : [3.2,2.0], (u,v,x,y,out)=>{
    const bedding=noise(u,v,3,44,121)-.5;
    const cloud=fbm(u,v,771,2,3)-.5;
    const tiny=noise(u,v,96,192,447),finePore=noise(u,v,192,128,449);
    const pores=Math.pow(clamp((tiny-.66)*3),2);
    const pinholes=Math.pow(clamp((finePore-.77)*4.3),2);
    const tone=bedding*3.5+cloud*5+(hash(x,y,703)-.5)*.8-pores*9-pinholes*4;
    out[0]=226+tone;out[1]=219+tone*.95;out[2]=204+tone*.88;
    out[3]=.5+bedding*.006-pores*.022-pinholes*.009;
    out[4]=.62+cloud*.035+pores*.05;
  }, .55);
}

function createWood(baseColour = [133, 112, 87]) {
  return surface(512, [.8, 2.8], (u, v, x, y, out) => {
    const warp = (noise(u, v, 5, 2, 501) - .5) * 1.25;
    const growth = Math.sin(TAU * (u * 28 + warp));
    const fine = Math.sin(TAU * (u * 94 + warp * 1.4 + noise(u, v, 17, 4, 502) * .34));
    const pore = Math.pow(clamp(noise(u, v, 128, 8, 503)), 4);
    const broad = noise(u, v, 6, 1, 504) - .5;
    const variation = growth * 2.2 + fine * 1.0 + broad * 10 - pore * 6;
    const grain = (hash(x, y, 505) - .5) * 2;
    out[0] = baseColour[0] + variation + grain;
    out[1] = baseColour[1] + variation * .79 + grain;
    out[2] = baseColour[2] + variation * .54 + grain;
    out[3] = .5 + fine * .025 + pore * .03;
    out[4] = .49 + broad * .06 + pore * .04;
  }, 2.5);
}

function createWeave() {
  return surface(256, [.096, .096], (u, v, x, y, out) => {
    const pitch = 8, warp = .5 + .5 * Math.cos(TAU * x / pitch), weft = .5 + .5 * Math.cos(TAU * y / pitch);
    const over = (Math.floor(x / pitch) + Math.floor(y / pitch)) % 2;
    const yarn = over ? warp * .66 + weft * .34 : weft * .66 + warp * .34;
    const fuzz = hash(x, y, 301), thread = hash(Math.floor(x / pitch), Math.floor(y / pitch), 302);
    const tone = (yarn - .5) * 6 + (fuzz - .5) * 2 + (thread - .5) * 2;
    out[0] = 246 + tone; out[1] = 243 + tone; out[2] = 235 + tone;
    out[3] = yarn * .25 + fuzz * .05;
    out[4] = .91 + fuzz * .08;
  }, 3.0);
}

function createLeather() {
  return surface(256, [.12, .12], (u, v, x, y, out) => {
    const cellU = u * 40, cellV = v * 40, ix = Math.floor(cellU), iy = Math.floor(cellV);
    let nearest = 10, second = 10;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const a = ix + i, b = iy + j;
      const px = a + .2 + hash(mod(a, 40), mod(b, 40), 601) * .6;
      const py = b + .2 + hash(mod(a, 40), mod(b, 40), 602) * .6;
      const distance = (px - cellU) ** 2 + (py - cellV) ** 2;
      if (distance < nearest) { second = nearest; nearest = distance; }
      else if (distance < second) second = distance;
    }
    const crease = Math.exp(-Math.max(0, second - nearest) * 27);
    const wrinkle = noise(u, v, 5, 11, 603);
    const pore = hash(x, y, 604);
    const tone = (wrinkle - .5) * 5 - crease * 3 + (pore - .5) * 1.2;
    out[0] = 239 + tone; out[1] = 237 + tone; out[2] = 231 + tone;
    out[3] = .5 - crease * .08 + wrinkle * .045 + pore * .012;
    out[4] = .36 + wrinkle * .08 + crease * .045;
  }, 2.2);
}

function createRug() {
  return surface(512, [.8, .8], (u, v, x, y, out) => {
    // Irregular tuft direction avoids a repeating contrast grating at a distance.
    const stripe = noise(u,v,7,96,804);
    const tuft = hash(Math.floor(x / 2), Math.floor(y / 2), 801);
    const fuzz = hash(x, y, 802), variation = noise(u, v, 8, 8, 803);
    const tone = (stripe - .5) * 2 + (tuft - .5) * 4 + (variation - .5) * 3;
    out[0] = 239 + tone; out[1] = 236 + tone; out[2] = 227 + tone;
    out[3] = .45 + stripe * .065 + tuft * .08 + fuzz * .02;
    out[4] = .96 + fuzz * .04;
  }, 1.2);
}

function createWidePlanks() {
  // Calm, wide straight-laid oak boards, approximately 240 mm by 2.4 m.
  // The legacy material key remains compatible with the room-floor builder.
  return surface(512,[2.4,2.4],(u,v,x,y,out)=>{
    const boardX=u*10,ix=Math.floor(boardX),across=fract(boardX),along=fract(v+(ix%2)*.5);
    const identity=hash(ix,Math.floor(v+(ix%2)*.5),901);
    const bend=noise(across,along,2,4,903)*.24;
    const grain=Math.sin(TAU*(across*19+bend))*.9+Math.sin(TAU*(across*57+bend*1.4))*.35;
    const edge=Math.min(across,1-across,along*10,(1-along)*10);
    const seam=1-smooth(clamp(edge/.022));
    const tone=(identity-.5)*10+grain;
    out[0]=184+tone-seam*14;out[1]=167+tone*.9-seam*14;out[2]=140+tone*.8-seam*12;
    out[3]=.5+grain*.003-seam*.025;out[4]=.53+identity*.035+seam*.05;
  },.7);
}

function createPlaster() {
  return surface(256,[.75,.75],(u,v,x,y,out)=>{
    const trowel=fbm(u,v,1611,2,3)-.5,grain=hash(x,y,1612)-.5;
    const tone=trowel*3.1+grain*1.6;
    out[0]=244+tone;out[1]=242+tone;out[2]=236+tone;
    out[3]=.5+trowel*.008+grain*.003;out[4]=.94+grain*.035;
  },.7);
}

function createPaper() {
  return surface(256,[.35,.35],(u,v,x,y,out)=>{
    const fibres=noise(u,v,96,12,1711)-.5,cross=noise(u,v,18,96,1713)-.5;
    const cloud=fbm(u,v,1717,2,3)-.5,tone=fibres*2.3+cross*1.1+cloud*2.1;
    out[0]=246+tone;out[1]=244+tone;out[2]=237+tone;
    out[3]=.5+fibres*.008+cross*.003;out[4]=.92+cloud*.025;
  },.65);
}

function createEndGrain() {
  return surface(256,[.35,.35],(u,v,x,y,out)=>{
    const r=Math.hypot((u-.34)*.85,v-.27),warp=(noise(u,v,5,5,1811)-.5)*.022;
    const ring=Math.sin((r+warp)*TAU*32),tone=ring*2.6+(noise(u,v,8,8,1813)-.5)*5;
    out[0]=133+tone;out[1]=112+tone*.82;out[2]=87+tone*.67;
    out[3]=.5+ring*.005;out[4]=.52+(hash(x,y,1817)-.5)*.025;
  },.55);
}

let cached;
function textures() {
  if (!cached) cached = { stone: createStone(), slabStone: createStone({ slab: true }), wood: createWood(), oak: createWood([187, 169, 139]), weave: createWeave(), leather: createLeather(), rug: createRug(), parquet: createWidePlanks(), plaster: createPlaster(), paper: createPaper(), endGrain: createEndGrain() };
  return cached;
}

function material(colour, roughness = .8, metalness = 0, pack = null, parameters = {}) {
  const result = new THREE.MeshStandardMaterial({ color: colour, roughness, metalness, ...(pack?.maps || {}), ...parameters });
  if (pack) {
    // Roughness maps encode the intended roughness directly; material factor=1.
    result.roughness = 1;
    result.userData.textureMetres = [...pack.metres];
  }
  result.userData.provenance = 'original-deterministic-procedural';
  return result;
}

export function createMaterials() {
  const p = textures();
  const cloth = (colour, normal = .3) => material(colour, 1, 0, p.weave, { normalScale: new THREE.Vector2(normal, normal) });
  const wood = (colour = '#ffffff') => material(colour, 1, 0, p.wood, { normalScale: new THREE.Vector2(.16, .16) });
  const stone = (pack = p.stone) => material('#ffffff', 1, 0, pack, { normalScale: new THREE.Vector2(.06, .06), envMapIntensity: .8 });
  const leather = colour => material(colour, 1, 0, p.leather, { normalScale: new THREE.Vector2(.35, .35), envMapIntensity: .8 });
  const materials = {
    wall: material('#e9e4d9', .94), trim: material('#ddd6c9', .74), stone: stone(), slabStone: stone(p.slabStone), bath: stone(),
    walnut: wood(), darkWood: wood('#a29c90'), oak: material('#ffffff', 1, 0, p.oak, { normalScale: new THREE.Vector2(.16, .16) }),
    fabric: cloth('#b6b2a6', .12), linen: cloth('#ded8ca', .10),
    bronze: material('#766b59', .54, .55), dark: material('#222724', .42), light: material('#fff8e8', .5),
    carpet: material('#a3aaa0', 1, 0, p.rug, { normalScale: new THREE.Vector2(.4, .4) }),
    carpetLight: material('#c8cdc2', 1, 0, p.rug, { normalScale: new THREE.Vector2(.4, .4) }),
    leaf: material('#586c44', .87), leafDark: material('#344d35', .91), pot: material('#a59d8b', .85),
    water: new THREE.MeshPhysicalMaterial({ color:'#aebfba', transparent:true, opacity:.75, roughness:.12, metalness:.03, clearcoat:.4 }),
    glass: new THREE.MeshPhysicalMaterial({ color:'#e5eeea', transparent:true, opacity:.14, roughness:.07, metalness:0, side:THREE.DoubleSide, depthWrite:false }),
    glow: new THREE.MeshStandardMaterial({ color:'#f4ead4', emissive:'#ffe1aa', emissiveIntensity:.36 }),
    art: material('#a89c84', .98), white: material('#f6f3ec', .24), terrace: material('#b6ac98', .86),
    leather: leather('#796c57'), caramel: cloth('#a49d8c',.10), khaki: cloth('#9c9e8b',.12),
    kitchen: material('#e1ddcf', .53), rust: cloth('#8a8170',.12), gold: material('#8d7e65', .57, .55),
    herringboneOak: material('#ffffff', 1, 0, p.parquet, { normalScale: new THREE.Vector2(.25, .25) }),
    wallpaper: cloth('#d4cdbd', .06), brushedMetal: material('#a3a79f', .45, .72),
    smokeGlass: new THREE.MeshPhysicalMaterial({ color:'#685347', transparent:true, opacity:.68, roughness:.13, metalness:.06, side:THREE.DoubleSide, depthWrite:false }),
  };
  materials.sandFabric=cloth('#b7b3a5',.10);
  materials.sageFabric=cloth('#929f90',.12);
  materials.warmOak=material('#ffffff',1,0,p.oak,{normalScale:new THREE.Vector2(.10,.10)});
  materials.smokedOak=wood('#e6e1d9');
  materials.travertine=stone();
  materials.brushedBronze=material('#817663',.58,.55);
  materials.plaster=material('#d9d2c4',1,0,p.plaster,{normalScale:new THREE.Vector2(.09,.09)});
  materials.endGrain=material('#e6e1d9',1,0,p.endGrain,{normalScale:new THREE.Vector2(.07,.07)});
  materials.quietRug=material('#c6cfc3',1,0,p.rug,{normalScale:new THREE.Vector2(.22,.22)});
  materials.diffuseLantern=new THREE.MeshStandardMaterial({color:'#f0e9d9',roughness:1,...p.paper.maps,normalScale:new THREE.Vector2(.08,.08),emissive:'#f0d7ad',emissiveIntensity:.22,side:THREE.DoubleSide});
  for (const [name, value] of Object.entries(materials)) value.name = `Tianlan Quiet / ${name}`;
  return materials;
}

// BoxGeometry uses 0..1 UVs per face. Converting them to local metres lets every
// surface share the same textures, with colour / normal / roughness aligned.
// Works for plain and subdivided rounded BoxGeometry, before merging.
// ExtrudeGeometry already uses local-unit UVs and does not need this.
export function setBoxUVInMetres(geometry, width, height, depth) {
  const uv = geometry.getAttribute('uv');
  if (!uv || geometry.type !== 'BoxGeometry') return geometry;
  const faceSizes = [[depth,height],[depth,height],[width,depth],[width,depth],[width,height],[width,height]];
  for (const group of geometry.groups) {
    const size=faceSizes[group.materialIndex];if(!size)continue;
    const indices=new Set();
    for(let i=group.start;i<group.start+group.count;i++)indices.add(geometry.index?geometry.index.getX(i):i);
    for(const i of indices)uv.setXY(i,uv.getX(i)*size[0],uv.getY(i)*size[1]);
  }
  uv.needsUpdate = true;
  return geometry;
}
