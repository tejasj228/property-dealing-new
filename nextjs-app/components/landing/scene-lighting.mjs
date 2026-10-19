import { finishArchitecture } from './material-finish.mjs';
import { applySurfaceRealism } from './surface-realism.mjs';
import { AmbientLight, Color, DirectionalLight, Fog, HemisphereLight } from 'three';

// Ground plane, occlusion band and texture density per model, in that model's own units.
// Fog distances follow each camera so far edges pick up a little aerial perspective.
const SURFACES = {
  city: { ground: .17, range: .5, texelScale: 2, windowCell: [3.4, 2.78], fog: [24, 175] },
  house: { ground: .2, range: .7, texelScale: .9, windowCell: [2.2, 1.6], fog: [16, 150] },
  land: { ground: .04, range: .45, texelScale: 1.6, windowCell: [2.6, 2.4], fog: [17, 160] },
  society: { ground: .1, range: .55, texelScale: 1.6, windowCell: [2.6, 2.4], fog: [17, 160] },
  commercial: { ground: .1, range: .55, texelScale: 1.6, windowCell: [2.6, 2.4], fog: [17, 160] },
  office: { ground: .2, range: .6, texelScale: 1, windowCell: [2.2, 1.6] },
  keys: { ground: -10, range: .5, texelScale: 1.2, windowCell: [2.2, 1.6] },
  map: { ground: .12, range: .45, texelScale: 1.6, windowCell: [3, 2.8] },
};
const DAY_HAZE = new Color('#e7e1d1'), NIGHT_HAZE = new Color('#1d2227');

// Same day/night treatment for every model, including the interactive property map.
export function createSceneLighting(scene, model, renderer, { kind = 'house', compact = false, invalidate, prepare } = {}) {
  const finish = finishArchitecture(scene, model, renderer, compact, invalidate, prepare);
  const surface = SURFACES[kind] || SURFACES.house;
  const realism = applySurfaceRealism(model, surface);
  const previousBeforeRender = scene.onBeforeRender;
  scene.onBeforeRender = (...args) => { realism.update(); previousBeforeRender.apply(scene, args); };
  if (surface.fog) scene.fog = new Fog(DAY_HAZE.clone(), ...surface.fog);
  const sky = new HemisphereLight(0xeef7ff, 0xb6c5a7, 2.5);
  const ambient = new AmbientLight(0xffffff, 0.7);
  // A lower mid-morning sun gives longer, readable shadows across streets and terraces.
  const sun = new DirectionalLight(0xfff8e8, 3.2); sun.position.set(-6, 10, 8);
  sun.castShadow = !compact && kind !== 'map'; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 });
  if (kind === 'city') { sun.position.set(-13, 17, 12); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, far: 65 }); }
  // PCF with a radius gives a soft penumbra from five rotated taps per light.
  sun.shadow.radius = kind === 'city' ? 3 : 2.5;
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = kind === 'city' ? .022 : 0.015;
  scene.add(sky, ambient, sun);
  const materials = new Set(), nightDetails = [];
  model.traverse(object => {
    if (object.material?.isMeshStandardMaterial) materials.add(object.material);
    if (object.userData.nightOnly) nightDetails.push(object);
  });
  const original = [...materials].map(material => ({ material, color: material.color.clone(), emissive: material.emissive.clone(), intensity: material.emissiveIntensity }));
  function setNight(night) {
    finish.setNight(night);
    nightDetails.forEach(object => { object.visible = night; });
    sky.color.set(night ? '#789cc9' : '#e3edf8'); sky.groundColor.set(night ? '#122d31' : '#a99d80'); sky.intensity = night ? 0.45 : 0.62;
    ambient.color.set(night ? '#a1bdd4' : '#ffffff'); ambient.intensity = night ? 0.15 : 0.1;
    sun.color.set(night ? '#b6d2ff' : '#fff0da'); sun.intensity = night ? 1.5 : 3.25;
    scene.fog?.color.copy(night ? NIGHT_HAZE : DAY_HAZE);
    renderer.toneMappingExposure = 1.12;

    original.forEach(({ material, color, emissive, intensity }) => {
      material.color.copy(color); material.emissive.copy(emissive); material.emissiveIntensity = intensity;
      if (night && material.userData.nightWindow) {
        material.color.set('#4e514b'); material.emissive.set('#efbc70'); material.emissiveIntensity = 0.42;
      }
      if (night && material.userData.nightLamp) { material.emissive.set('#efbc70'); material.emissiveIntensity = 1.3; }
    });
  }
  setNight(false);
  return { setNight, dispose() {
    finish.dispose(); realism.dispose(); sun.shadow.dispose(); scene.remove(sky, ambient, sun);
    scene.onBeforeRender = previousBeforeRender; if (surface.fog) scene.fog = null;
  } };
}

export function observeSceneTheme(host, lighting, invalidate) {
  const root = host.closest('[data-theme]');
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const update = () => { const theme = root?.dataset.theme; lighting.setNight(theme === 'dark' || ((!theme || theme === 'system') && media.matches)); invalidate(); };
  const observer = new MutationObserver(update);
  if (root) observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  media.addEventListener('change', update); update();
  return () => { observer.disconnect(); media.removeEventListener('change', update); };
}
