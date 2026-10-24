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

function createStone() {
  return surface(512, [2.6, 2.6], (u, v, x, y, out) => {
    const warpX = fbm(u, v, 71, 2, 3) - .5;
    const warpY = fbm(u + .17, v + .29, 203, 2, 3) - .5;
    const fineWarp = noise(u, v, 23, 23, 51) - .5;
    // Long oblique mineral seams: no closed cellular / Voronoi crack network.
    // Each seam has a soft mineral plume and intermittent, near-parallel splits.
    const phase = u * 3 + v * 2 + warpX * .72 + warpY * .46 + fineWarp * .045;
    const distance = Math.abs(fract(phase + .5) - .5);
    const mineral = noise(u, v, 7, 7, 992);
    const mask = .24 + .76 * noise(u, v, 5, 5, 46);
    const width = .005 + mineral * mineral * .022;
    const main = Math.exp(-Math.pow(distance / width, 1.45)) * mask;
    const halo = Math.exp(-Math.pow(distance / (width * 4.8), 1.25)) * mask;
    const splitOffset = (noise(u, v, 7, 5, 1307) - .5) * .22;
    const splitDistance = Math.abs(fract(phase + splitOffset + .5) - .5);
    const splitGate = smooth(clamp((noise(u, v, 4, 7, 1411) - .43) * 4));
    const branches = Math.exp(-Math.pow(splitDistance / .006, 1.3)) * splitGate;
    const mineralDust = noise(u, v, 37, 37, 1483);
    const hairDistance = Math.abs(fract(phase + fineWarp * .09 + .5) - .5);
    const hair = Math.exp(-Math.pow(hairDistance / .004, 1.2)) * mineralDust * .4;
    const gold = smooth(clamp((mineral - .45) * 3));
    const cloud = fbm(u + .41, v + .31, 643, 2, 3);
    const depth = clamp(main * .52 + halo * .13 + hair * .24 + branches * .25);
    const warm = gold * depth;
    const grain = (hash(x, y, 703) - .5) * 1.5;
    out[0] = 245 - depth * 90 - warm * 3 - cloud * 5 + grain;
    out[1] = 242 - depth * 91 - warm * 15 - cloud * 5 + grain;
    out[2] = 234 - depth * 82 - warm * 31 - cloud * 5 + grain;
    out[3] = .5 + (cloud - .5) * .012 + (hash(x, y, 991) - .5) * .014;
    out[4] = .24 + cloud * .045 + depth * .055;
  }, 2.0);
}

function createWood(baseColour = [143, 100, 67]) {
  return surface(512, [.8, 2.8], (u, v, x, y, out) => {
    const warp = (noise(u, v, 5, 2, 501) - .5) * 1.25;
    const growth = Math.sin(TAU * (u * 28 + warp));
    const fine = Math.sin(TAU * (u * 94 + warp * 1.4 + noise(u, v, 17, 4, 502) * .34));
    const pore = Math.pow(clamp(noise(u, v, 128, 8, 503)), 4);
    const broad = noise(u, v, 6, 1, 504) - .5;
    const variation = growth * 5 + fine * 2.5 + broad * 19 - pore * 15;
    const grain = (hash(x, y, 505) - .5) * 2;
    out[0] = baseColour[0] + variation + grain;
    out[1] = baseColour[1] + variation * .79 + grain;
    out[2] = baseColour[2] + variation * .54 + grain;
    out[3] = .5 + fine * .025 + pore * .03;
    out[4] = .4 + broad * .1 + pore * .08;
  }, 2.5);
}

function createWeave() {
  return surface(256, [.24, .24], (u, v, x, y, out) => {
    const pitch = 8, warp = .5 + .5 * Math.cos(TAU * x / pitch), weft = .5 + .5 * Math.cos(TAU * y / pitch);
    const over = (Math.floor(x / pitch) + Math.floor(y / pitch)) % 2;
    const yarn = over ? warp * .66 + weft * .34 : weft * .66 + warp * .34;
    const fuzz = hash(x, y, 301), thread = hash(Math.floor(x / pitch), Math.floor(y / pitch), 302);
    const tone = (yarn - .5) * 10 + (fuzz - .5) * 5 + (thread - .5) * 3;
    out[0] = 246 + tone; out[1] = 243 + tone; out[2] = 235 + tone;
    out[3] = yarn * .25 + fuzz * .05;
    out[4] = .91 + fuzz * .08;
  }, 3.0);
}

function createLeather() {
  return surface(256, [.38, .38], (u, v, x, y, out) => {
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
    const tone = (wrinkle - .5) * 12 - crease * 6 + (pore - .5) * 2;
    out[0] = 239 + tone; out[1] = 237 + tone; out[2] = 231 + tone;
    out[3] = .5 - crease * .15 + wrinkle * .12 + pore * .02;
    out[4] = .39 + wrinkle * .1 + crease * .08;
  }, 2.2);
}

function createRug() {
  return surface(512, [.8, .8], (u, v, x, y, out) => {
    const stripe = .5 + .5 * Math.cos(TAU * u * 36);
    const tuft = hash(Math.floor(x / 2), Math.floor(y / 2), 801);
    const fuzz = hash(x, y, 802), variation = noise(u, v, 8, 8, 803);
    const tone = (stripe - .5) * 6 + (tuft - .5) * 10 + (variation - .5) * 7;
    out[0] = 232 + tone; out[1] = 225 + tone; out[2] = 211 + tone;
    out[3] = .45 + stripe * .13 + tuft * .15 + fuzz * .035;
    out[4] = .96 + fuzz * .04;
  }, 2.1);
}

function createHerringbone() {
  return surface(512, [1.44, 1.44], (u, v, x, y, out) => {
    // A periodic 4:1 herringbone parquet: each board is about .72 × .18 m.
    const gx = u * 8, gy = v * 8, ix = Math.floor(gx), iy = Math.floor(gy);
    const k = mod(ix + iy, 8), horizontal = k < 4;
    const along = horizontal ? k + fract(gx) : k - 4 + fract(gy);
    const across = horizontal ? fract(gy) : fract(gx);
    const board = horizontal ? hash(0, iy, 901) : hash(ix, 1, 901);
    const bend = noise(along / 4, across, 2, 2, 903) * .65;
    const fibre = Math.sin(TAU * (across * 24 + bend));
    const fine = Math.sin(TAU * (across * 71 + bend * 1.7));
    const edgeDistance = Math.min(across, 1 - across, along, 4 - along);
    const seam = 1 - smooth(clamp(edgeDistance / .018));
    const variation = (board - .5) * 22 + fibre * 3 + fine * 1.3;
    out[0] = 191 + variation - seam * 27;
    out[1] = 160 + variation * .87 - seam * 26;
    out[2] = 120 + variation * .68 - seam * 22;
    out[3] = .5 + fibre * .012 - seam * .07;
    out[4] = .46 + board * .075 + seam * .1;
  }, 2.2, Math.PI / 4);
}

let cached;
function textures() {
  if (!cached) cached = { stone: createStone(), wood: createWood(), oak: createWood([194, 166, 128]), weave: createWeave(), leather: createLeather(), rug: createRug(), parquet: createHerringbone() };
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
  const stone = () => material('#ffffff', 1, 0, p.stone, { normalScale: new THREE.Vector2(.06, .06), envMapIntensity: .8 });
  const leather = colour => material(colour, 1, 0, p.leather, { normalScale: new THREE.Vector2(.35, .35), envMapIntensity: .8 });
  const materials = {
    wall: material('#eeeae2', .9), trim: material('#e1d9ca', .62), stone: stone(), bath: stone(),
    walnut: wood(), darkWood: wood('#80756b'), oak: material('#ffffff', 1, 0, p.oak, { normalScale: new THREE.Vector2(.16, .16) }),
    fabric: cloth('#e8decd'), linen: cloth('#fffdf4', .18),
    bronze: material('#75614a', .3, .78), dark: material('#222724', .42), light: material('#fff8e8', .5),
    carpet: material('#d4c9b5', 1, 0, p.rug, { normalScale: new THREE.Vector2(.4, .4) }),
    carpetLight: material('#fffdf6', 1, 0, p.rug, { normalScale: new THREE.Vector2(.4, .4) }),
    leaf: material('#586c44', .87), leafDark: material('#344d35', .91), pot: material('#a59d8b', .85),
    water: new THREE.MeshPhysicalMaterial({ color:'#aebfba', transparent:true, opacity:.75, roughness:.12, metalness:.03, clearcoat:.4 }),
    glass: new THREE.MeshPhysicalMaterial({ color:'#e5eeea', transparent:true, opacity:.14, roughness:.07, metalness:0, side:THREE.DoubleSide, depthWrite:false }),
    glow: new THREE.MeshStandardMaterial({ color:'#fff1d0', emissive:'#ffdb9e', emissiveIntensity:.72 }),
    art: material('#a89c84', .98), white: material('#f6f3ec', .24), terrace: material('#b6ac98', .86),
    leather: leather('#292825'), caramel: leather('#ad7049'), khaki: cloth('#a28e6a'),
    kitchen: material('#f0eee5', .36), rust: cloth('#b77750'), gold: material('#bc9b62', .24, .85),
    herringboneOak: material('#ffffff', 1, 0, p.parquet, { normalScale: new THREE.Vector2(.25, .25) }),
    wallpaper: cloth('#e5dfd3', .08), brushedMetal: material('#c5c8c4', .22, .92),
    smokeGlass: new THREE.MeshPhysicalMaterial({ color:'#685347', transparent:true, opacity:.68, roughness:.13, metalness:.06, side:THREE.DoubleSide, depthWrite:false }),
  };
  for (const [name, value] of Object.entries(materials)) value.name = `Tianlan / ${name}`;
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
