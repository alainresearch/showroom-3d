import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

// Glass must not become an opaque wall in the depth/normal prepass.
class InteriorSSAOPass extends SSAOPass {
  _overrideVisibility() {
    super._overrideVisibility();
    this.scene.traverse(object => {
      if (!object.isMesh || !object.visible) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (materials.every(material => (material.transparent && material.opacity < .85) || material.alphaTest > .1)) {
        object.visible = false;
        this._visibilityCache.push(object);
      }
    });
  }
}

/** A shared, bounded-quality interior renderer. All distances are in metres. */
export function createShowroomRendering({ renderer, scene, camera, coarse = false }) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // The building is static. Regenerate shadows only after light/model visibility changes.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnvironment = new RoomEnvironment();
  const environment = pmrem.fromScene(roomEnvironment, .035);
  scene.environment = environment.texture;
  scene.environmentIntensity = .34;
  roomEnvironment.dispose();
  pmrem.dispose();

  const hemisphere = new THREE.HemisphereLight('#e6eef3', '#b2a38c', .70);
  const ambient = new THREE.AmbientLight('#ffefd8', .12);
  const sun = new THREE.DirectionalLight('#fff0d5', 2.3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  sun.shadow.bias = -.00008;
  sun.shadow.normalBias = .012;
  sun.shadow.radius = 3;
  scene.add(hemisphere, ambient, sun, sun.target);

  RectAreaLightUniformsLib.init();
  const interiorLights = new THREE.Group();
  interiorLights.name = 'Soft interior illumination · illustrative, not a daylight calculation';
  scene.add(interiorLights);
  const lightMaterials = new Map();
  const floatTargets = renderer.extensions.has('EXT_color_buffer_float');
  const performance = { ambientOcclusion: !coarse && floatTargets, pixelRatio: renderer.getPixelRatio(), adaptiveReduction: false };
  const size = renderer.getSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, {
    type: floatTargets ? THREE.HalfFloatType : THREE.UnsignedByteType,
    samples: coarse ? 0 : Math.min(4, renderer.capabilities.maxSamples),
  });
  target.texture.name = 'Showroom linear color';
  const composer = new EffectComposer(renderer, target);
  const beauty = new RenderPass(scene, camera);
  const occlusion = new InteriorSSAOPass(scene, camera, size.x, size.y, 16);
  occlusion.enabled = performance.ambientOcclusion;
  // Three's depth thresholds are normalized by the camera near/far range.
  // 5 mm prevents self-shadow noise; 70 cm keeps the effect local to contact points.
  occlusion.minDistance = .005 / (camera.far - camera.near);
  occlusion.maxDistance = .70 / (camera.far - camera.near);
  occlusion.kernelRadius = .48;
  const output = new OutputPass();
  composer.addPass(beauty);
  composer.addPass(occlusion);
  composer.addPass(output);
  let mode = 'overview', evening = false, warmupFrames = 45, slowSeconds = 0;
  let daySkyColor = '#d6e1e4';

  function resize(width, height) {
    composer.setSize(width, height);
    // AO needs much less resolution than the color image. Retain a crisp MSAA color pass.
    const aoPixelRatio = Math.min(renderer.getPixelRatio(), 1);
    occlusion.setSize(Math.max(1, Math.round(width * aoPixelRatio)), Math.max(1, Math.round(height * aoPixelRatio)));
  }

  function applyLighting() {
    const walk = mode === 'walk';
    scene.background.set(walk ? (evening ? '#c9cbd8' : daySkyColor) : '#e8e9e1');
    sun.intensity = evening ? .32 : 2.3;
    sun.color.set(evening ? '#ffcf9a' : '#fff0d5');
    hemisphere.intensity = evening ? .36 : .70;
    hemisphere.color.set(evening ? '#a6bbd4' : '#e6eef3');
    ambient.intensity = evening ? .10 : .12;
    scene.environmentIntensity = evening ? .21 : .34;
    renderer.toneMappingExposure = evening ? 1.12 : 1.02;
    interiorLights.visible = walk;
    interiorLights.children.forEach(light => {
      light.intensity = evening ? light.userData.warmIntensity : light.userData.dayIntensity;
      light.color.set(evening ? '#ffd8ab' : '#fff4df');
    });
    lightMaterials.forEach((base, material) => {
      material.emissiveIntensity = base * (evening ? 1.8 : 1.0);
    });
    occlusion.kernelRadius = walk ? .38 : .65;
    renderer.shadowMap.needsUpdate = true;
  }

  function setModel(model) {
    interiorLights.clear();
    lightMaterials.clear();
    daySkyColor = model.exterior?.userData.skyColor || '#d6e1e4';
    const b = model.bounds, cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
    const span = Math.max(b.maxX - b.minX, b.maxZ - b.minZ);
    sun.position.set(cx - span * .40, Math.max(16, span * .65), b.maxZ + span * .40);
    sun.target.position.set(cx, 0, cz);
    Object.assign(sun.shadow.camera, { left: -span * .66, right: span * .66, top: span * .66, bottom: -span * .66, near: .5, far: span * 3.2 });
    sun.shadow.camera.updateProjectionMatrix();
    const anisotropy = Math.min(coarse ? 4 : 8, renderer.capabilities.getMaxAnisotropy());
    model.group.traverse(object => {
      if (!object.isMesh) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (materials.every(material => material.transparent && material.opacity < .85)) object.castShadow = false;
      for (const material of materials) {
        for (const property of ['map', 'normalMap', 'roughnessMap', 'bumpMap']) {
          if (material[property]) { material[property].anisotropy = anisotropy; material[property].needsUpdate = true; }
        }
        if (material.emissive && material.emissive.getHex() !== 0 && material.emissiveIntensity > 0) {
          if (!lightMaterials.has(material)) lightMaterials.set(material, material.emissiveIntensity);
        }
      }
    });
    // Local soft sources stand in for diffuse spill and switched-on room luminaires.
    // Their values are presentation settings, not measured lux or an IES specification.
    const presets = [
      { id: 'living', width: 4.0, depth: 3.0, day: 1.7, warm: 4.6 },
      { id: 'kitchen', width: 1.6, depth: 2.8, day: 2.1, warm: 4.8 },
      { id: 'master', width: 2.5, depth: 3.0, day: 1.5, warm: 3.7 },
    ];
    for (const preset of presets) {
      const room = model.rooms.find(candidate => candidate.id === preset.id);
      if (!room) continue;
      const light = new THREE.RectAreaLight('#fff4df', preset.day, preset.width, preset.depth);
      const anchor=room.lightAnchor||room;
      light.position.set(anchor.x, (model.metrics.height || 3.1) - .23, anchor.z);
      light.rotation.x = -Math.PI / 2;
      light.userData.dayIntensity = preset.day;
      light.userData.warmIntensity = preset.warm;
      interiorLights.add(light);
    }
    applyLighting();
  }

  function render(delta) {
    // The projection changes when entering a room and when the overview uses an offset.
    // SSAOPass only copies it in setSize by default, so keep both matrices in sync.
    occlusion.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(camera.projectionMatrix);
    occlusion.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(camera.projectionMatrixInverse);
    // The direct path retains the renderer's native MSAA on touch/low-power devices.
    if (performance.ambientOcclusion) composer.render(delta);
    else renderer.render(scene, camera);
    if (warmupFrames > 0) { warmupFrames--; return; }
    if (document.hidden || delta > .30 || delta <= 0 || performance.adaptiveReduction) return;
    slowSeconds = Math.max(0, slowSeconds + (delta > .040 ? delta : -delta * .5));
    if (slowSeconds > 3.5) {
      // A slow laptop keeps navigation responsive by dropping AO, rather than its controls.
      occlusion.enabled = false;
      performance.ambientOcclusion = false;
      performance.adaptiveReduction = true;
      renderer.setPixelRatio(Math.min(renderer.getPixelRatio(), 1));
      composer.setPixelRatio(renderer.getPixelRatio());
      performance.pixelRatio = renderer.getPixelRatio();
      const currentSize = renderer.getSize(new THREE.Vector2());
      resize(currentSize.x, currentSize.y);
    }
  }

  resize(size.x, size.y);
  return {
    render, resize, setModel, performance,
    setMode(value) { mode = value; applyLighting(); },
    setEvening(value) { evening = value; applyLighting(); },
    invalidateShadows() { renderer.shadowMap.needsUpdate = true; },
    dispose() {
      composer.dispose(); occlusion.dispose(); output.dispose(); environment.dispose();
      scene.remove(hemisphere, ambient, sun, sun.target, interiorLights);
    },
  };
}
