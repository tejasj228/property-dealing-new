import { finishArchitecture } from './material-finish.mjs';
import { AmbientLight, DirectionalLight, HemisphereLight } from 'three';

// Same day/night treatment for every model, including the interactive property map.
export function createSceneLighting(scene, model, renderer, { kind = 'house', compact = false, invalidate } = {}) {
  const finish = finishArchitecture(scene, model, renderer, compact, invalidate);
  const sky = new HemisphereLight(0xeef7ff, 0xb6c5a7, 2.5);
  const ambient = new AmbientLight(0xffffff, 0.7);
  const sun = new DirectionalLight(0xfff8e8, 3.2); sun.position.set(-4, 12, 7);
  sun.castShadow = !compact && kind !== 'map'; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 });
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.015;
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
    sky.color.set(night ? '#789cc9' : '#eef7ff'); sky.groundColor.set(night ? '#122d31' : '#b6c5a7'); sky.intensity = night ? 0.45 : 0.7;
    ambient.color.set(night ? '#a1bdd4' : '#ffffff'); ambient.intensity = night ? 0.15 : 0.12;
    sun.color.set(night ? '#b6d2ff' : '#fff8e8'); sun.intensity = night ? 1.5 : 3.0;
    renderer.toneMappingExposure = 1.12;

    original.forEach(({ material, color, emissive, intensity }) => {
      material.color.copy(color); material.emissive.copy(emissive); material.emissiveIntensity = intensity;
      if (night && material.userData.nightWindow) {
        material.color.set('#4e514b'); material.emissive.set('#efbc70'); material.emissiveIntensity = 0.32;
      }
      if (night && material.userData.nightLamp) { material.emissive.set('#efbc70'); material.emissiveIntensity = 1.3; }
    });
  }
  setNight(false);
  return { setNight, dispose() { finish.dispose(); sun.shadow.dispose(); scene.remove(sky, ambient, sun); } };
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
