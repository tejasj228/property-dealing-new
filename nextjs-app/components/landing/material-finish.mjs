import { createAssetPool } from './asset-pool.mjs';
import { DataTexture, RGBAFormat, RepeatWrapping, LinearFilter, PMREMGenerator, TextureLoader, SRGBColorSpace } from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const texturePool = createAssetPool();
const hdrPool = createAssetPool();
const contexts = new WeakMap();

// Reference-counted PMREM environments for one renderer.
function environmentsFor(renderer) {
  let entry = contexts.get(renderer);
  if (!entry) {
    const baked = {}, leases = {}, listeners = new Set();
    entry = { refs: 0, listeners,
      studio(size) {
        if (!baked[size]) { const room = new RoomEnvironment(), generator = new PMREMGenerator(renderer); baked[size] = generator.fromScene(room, .04, .1, 50, { size }); room.dispose(); generator.dispose(); }
        return baked[size];
      },
      sky(name, onError) {
        if (baked[name]) return baked[name];
        const lease = leases[name] ||= hdrPool.acquire(name, done => new HDRLoader().load(`/textures/pbr/${name === 'night' ? 'night' : 'autumn'}-sky.hdr`, done, undefined, onError), () => listeners.forEach(listener => listener()));
        if (!lease.asset.image?.data) return null;
        const generator = new PMREMGenerator(renderer); baked[name] = generator.fromEquirectangular(lease.asset); generator.dispose();
        return baked[name];
      },
      release() {
        if (--entry.refs > 0) return;
        Object.values(baked).forEach(target => target.dispose()); Object.values(leases).forEach(lease => lease.release()); contexts.delete(renderer);
      },
    };
    contexts.set(renderer, entry);
  }
  entry.refs++;
  return entry;
}

// Small repeatable surface maps, generated once per scene, never per frame.
export function surfaceTexture(kind, size = 128) {
  const bytes = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const noise = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    let value = 155 + (noise - Math.floor(noise)) * 55;
    if (kind === 'wood') value = 150 + Math.sin(x * .5 + Math.sin(y * .06) * 2) * 28 + (value - 155) * .35;
    if (kind === 'stone' && (x % 64 < 2 || y % 32 < 2)) value = 100;
    if (kind === 'window') value = (x % 32 < 2 || y % 64 < 3) ? 60 : 130 + Math.floor(x / 32) * 25 + Math.sin(x * .3) * 12;
    if (kind === 'water') value = 165 + Math.sin(x * .14 + Math.sin(y * .1)) * 35;
    const index = (y * size + x) * 4;
    bytes[index] = bytes[index + 1] = bytes[index + 2] = value; bytes[index + 3] = 255;
  }
  const texture = new DataTexture(bytes, size, size, RGBAFormat);
  texture.wrapS = texture.wrapT = RepeatWrapping; texture.magFilter = texture.minFilter = LinearFilter;
  texture.repeat.set(3, 3); texture.needsUpdate = true; return texture;
}

export function finishArchitecture(scene, model, renderer, compact, invalidate = () => {}, prepare = invalidate) {
  const textures = new Map(), materials = new Set(), leases = [];
  let disposed = false;
  const loader = renderer.isWebGLRenderer ? new TextureLoader() : null;
  const wake = () => { if (!disposed) invalidate(); };
  function textureFor(surface, isColor = false) {
    if (textures.has(surface)) return textures.get(surface);
    // Prebuilt maps keep texture generation off the main thread. Compact devices
    // download 256px variants; the large architectural surfaces use 1024px maps.
    let texture;
    if (loader) {
      const url = `/textures/${surface}${compact ? '-compact' : ''}.webp`;
      const lease = texturePool.acquire(url, ready => loader.load(url, ready, undefined, wake), wake);
      leases.push(lease); texture = lease.asset;
    } else texture = surfaceTexture(surface);
    if (isColor) texture.colorSpace = SRGBColorSpace;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(surface === 'window' ? 1 : 3, surface === 'window' ? 1 : 3);
    texture.anisotropy = Math.min(compact ? 2 : 4, renderer.capabilities?.getMaxAnisotropy?.() || 1);
    textures.set(surface, texture);
    return texture;
  }
  model.traverse(object => { if (object.material?.isMeshStandardMaterial) materials.add(object.material); });
  for (const material of materials) {
    const name = material.name;
    const scanned = /timber/.test(name) ? 'wood' : /trunk/.test(name) ? 'bark' : /road/.test(name) ? 'asphalt' : /^(grass|soil|sand)$/.test(name) ? 'ground' : /concrete|stone|ivory|edge|render/.test(name) ? 'concrete' : null;
    if (scanned) {
      material.map = textureFor(`pbr/${scanned}-color`, true);
      material.normalMap = textureFor(`pbr/${scanned}-normal`);
      material.normalScale.setScalar(scanned === 'ground' ? .65 : .45);
      material.roughnessMap = textureFor(`pbr/${scanned}-roughness`);
      // Lift the scanned albedo while keeping some authored contrast: darker stone trims
      // stay distinct from rendered walls, and bare plots read paler than planted ground.
      const authored = material.color.clone();
      // Natural ground: planted turf reads olive-green, bare plots and soil dusty; asphalt stays dark.
      material.color.set(name === 'grass' ? '#b4c27a' : name === 'sand' ? '#d8c69c' : scanned === 'ground' ? '#c4ab7c' : scanned === 'asphalt' ? '#a2a5a5' : scanned === 'wood' ? '#dfd2b8' : scanned === 'bark' ? '#c5b29e' : '#eeeae2');
      if (scanned === 'concrete') material.color.lerp(authored, .6);
      material.roughness = .92;
    }
    const surface = /timber|trunk/.test(name) ? 'wood' : /concrete|ivory|edge/.test(name) ? 'plaster' : /road/.test(name) ? 'asphalt' : /stone|sand|soil/.test(name) ? 'stone' : /grass|leaf|hedge/.test(name) ? 'foliage' : name === 'water' ? 'water' : /silver|metal/.test(name) ? 'metal' : null;
    if (surface && !scanned && name !== 'autumn-leaf' && name !== 'dry-grass-blade') {
      material.bumpMap = textureFor(surface); material.bumpScale = surface === 'water' ? .025 : surface === 'foliage' ? .035 : surface === 'metal' ? .004 : .012;
      material.roughnessMap = material.bumpMap;
      material.roughness = surface === 'water' ? .16 : surface === 'wood' ? .65 : .86;
    }
    if (/glass|windscreen|solar/.test(name)) {
      material.roughness = .085; material.metalness = name === 'solar' ? .35 : .08; material.envMapIntensity = 1.7;
      if (material.isMeshPhysicalMaterial) { material.clearcoat = 1; material.clearcoatRoughness = .07; material.ior = 1.5; }
    }
    // Coated architectural glazing: a tinted mirror for the sky by day; panes, frames and
    // lit rooms are drawn by the window shading.
    if (material.userData.nightWindow && !material.transparent) { material.color.set('#3d525b'); material.metalness = .55; material.roughness = .06; material.envMapIntensity = 2.1; }
    if (name === 'water') {
      material.color.set('#2f5b5f'); material.roughness = .03; material.metalness = 0; material.envMapIntensity = 2.2;
      material.bumpMap = null; material.roughnessMap = null;
      if (material.isMeshPhysicalMaterial) { material.clearcoat = 1; material.clearcoatRoughness = .02; material.ior = 1.333; }
    }
    if (/silver|metal/.test(name)) { material.roughness = .23; material.metalness = .92; material.envMapIntensity = 1.6; }
  }
  // Image-based lighting from real HDR skies: an autumn daytime sky, and a moonless night
  // sky fetched only once a scene is shown in the dark theme. Environments are baked once
  // per WebGL context and shared by every scene. A small studio bake of the same size is
  // in place from the first frame, so when a sky arrives the shaders do not recompile;
  // compact devices keep a smaller studio bake.
  const shared = renderer.isWebGLRenderer ? environmentsFor(renderer) : null;
  let wanted = 'day';
  shared?.listeners.add(applyEnvironment);
  function applyEnvironment() {
    if (disposed || !shared) return;
    const environment = compact ? shared.studio(64) : shared.sky(wanted, wake) || shared.studio(128);
    if (scene.environment === environment.texture) return;
    // Deferred: the first call happens while the owning scene is still being set up.
    scene.environment = environment.texture; scene.environmentRotation.set(0, wanted === 'night' ? .4 : -.7, 0); queueMicrotask(wake);
  }
  return {
    // The studio bake is neutral and bright, so compact devices dim it far more at night.
    setNight(night) { scene.environmentIntensity = night ? (compact ? .14 : .55) : .85; wanted = night ? 'night' : 'day'; applyEnvironment(); },
    dispose() {
      disposed = true; scene.environment = null; shared?.listeners.delete(applyEnvironment); shared?.release();
      if (loader) leases.forEach(lease => lease.release());
      else textures.forEach(texture => texture.dispose());
    },
  };
}
