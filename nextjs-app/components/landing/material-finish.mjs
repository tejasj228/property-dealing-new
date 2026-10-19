import { createAssetPool } from './asset-pool.mjs';
import { DataTexture, RGBAFormat, RepeatWrapping, LinearFilter, PMREMGenerator, TextureLoader, SRGBColorSpace } from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const texturePool = createAssetPool();
const hdrPool = createAssetPool();

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
    const scanned = /timber/.test(name) ? 'wood' : /trunk/.test(name) ? 'bark' : /road/.test(name) ? 'asphalt' : /^(grass|soil|sand)$/.test(name) ? 'ground' : /concrete|stone|ivory|edge/.test(name) ? 'concrete' : null;
    if (scanned) {
      material.map = textureFor(`pbr/${scanned}-color`, true);
      material.normalMap = textureFor(`pbr/${scanned}-normal`);
      material.normalScale.setScalar(scanned === 'ground' ? .65 : .45);
      material.roughnessMap = textureFor(`pbr/${scanned}-roughness`);
      // Lift the scanned albedo while keeping some authored contrast: darker stone trims
      // stay distinct from rendered walls, and bare plots read paler than planted ground.
      const authored = material.color.clone();
      material.color.set(scanned === 'ground' ? '#c8ab73' : scanned === 'wood' ? '#dfd2b8' : scanned === 'bark' ? '#c5b29e' : '#eeeae2');
      if (scanned === 'concrete' || name === 'sand') material.color.lerp(authored, name === 'sand' ? .5 : .6);
      material.roughness = .92;
    }
    const surface = /timber|trunk/.test(name) ? 'wood' : /concrete|ivory|edge/.test(name) ? 'plaster' : /road/.test(name) ? 'asphalt' : /stone|sand|soil/.test(name) ? 'stone' : /grass|leaf|hedge/.test(name) ? 'foliage' : name === 'water' ? 'water' : /silver|metal/.test(name) ? 'metal' : null;
    if (surface && !scanned && name !== 'autumn-leaf' && name !== 'dry-grass-blade') {
      material.bumpMap = textureFor(surface); material.bumpScale = surface === 'water' ? .025 : surface === 'foliage' ? .035 : surface === 'metal' ? .004 : .012;
      material.roughnessMap = material.bumpMap;
      material.roughness = surface === 'water' ? .16 : surface === 'wood' ? .65 : .86;
    }
    if (material.userData.nightWindow) {
      material.emissiveMap = textureFor('window');
    }
    if (/glass|windscreen|solar/.test(name)) {
      material.roughness = .085; material.metalness = name === 'solar' ? .35 : .08; material.envMapIntensity = 1.7;
      if (material.isMeshPhysicalMaterial) { material.clearcoat = 1; material.clearcoatRoughness = .07; material.ior = 1.5; }
    }
    if (name === 'water' && material.isMeshPhysicalMaterial) { material.clearcoat = 1; material.clearcoatRoughness = .05; material.ior = 1.333; material.envMapIntensity = 1.8; }
    if (/silver|metal/.test(name)) { material.roughness = .23; material.metalness = .92; material.envMapIntensity = 1.6; }
  }
  let environment, hdrLease, environmentTimer;
  // Let the first model frame render before baking reflection lighting. Desktop
  // bakes the outdoor sky only; compact devices use one smaller studio bake.
  if (renderer.isWebGLRenderer) environmentTimer = setTimeout(() => {
    if (disposed) return;
    if (compact) {
      const studio = new RoomEnvironment(), generator = new PMREMGenerator(renderer);
      environment = generator.fromScene(studio, .04, .1, 50, { size:64 });
      scene.environment = environment.texture;
      studio.dispose(); generator.dispose(); if (!disposed) prepare();
    } else {
      const applyEnvironment = () => {
        if (disposed || !hdrLease?.asset.image?.data || environment) return;
        const generator = new PMREMGenerator(renderer);
        environment = generator.fromEquirectangular(hdrLease.asset);
        scene.environment = environment.texture; scene.environmentRotation.set(0,-.7,0);
        // A new environment changes shader variants; let the renderer compile them off-frame.
        generator.dispose(); if (!disposed) prepare();
      };
      hdrLease = hdrPool.acquire('outdoor', ready => new HDRLoader().load('/textures/pbr/autumn-sky.hdr', ready, undefined, wake), applyEnvironment);
      applyEnvironment();
    }
  }, 120);
  return {
    setNight(night) { scene.environmentIntensity = night ? .24 : .48; },
    dispose() {
      disposed = true; clearTimeout(environmentTimer); scene.environment = null;
      environment?.dispose(); hdrLease?.release();
      if (loader) leases.forEach(lease => lease.release());
      else textures.forEach(texture => texture.dispose());
    },
  };
}
