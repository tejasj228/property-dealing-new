import {
  BoxGeometry, CylinderGeometry, DataTexture, Group, IcosahedronGeometry,
  InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  OrthographicCamera, PlaneGeometry, Quaternion, RGBAFormat, Vector3,
} from 'three';
import { batchSceneMeshes } from './scene-batching.mjs';
import { createSceneLife } from './scene-life.mjs';

export function createSceneCamera() {
  const camera = new OrthographicCamera(-8, 8, 7, -7, 0.1, 80);
  camera.position.set(12, 9.5, 13);
  camera.lookAt(0, 1.05, 0);
  camera.updateMatrixWorld();
  return camera;
}

export function frameSceneCamera(camera, width, height) {
  const aspect = width / height;
  const halfWidth = Math.max(6.65, 5.65 * aspect);
  camera.left = -halfWidth; camera.right = halfWidth;
  camera.top = halfWidth / aspect; camera.bottom = -halfWidth / aspect;
  camera.updateProjectionMatrix();
}

export function scenePose(progress = 0, reducedMotion = false) {
  const p = reducedMotion ? 0 : Math.max(0, Math.min(1, progress));
  const ease = p * p * (3 - 2 * p);
  return { rotation: -0.16 + ease * 0.7, lift: ease * 0.64, roofLift: ease * 0.18, scale: 1 - ease * 0.035 };
}

// An original illustrative architectural study, never a model of a listed property.
// Shared geometry/materials keep the scene inexpensive and deterministic.
export function createArchitecture({ compact = false } = {}) {
  const model = new Group();
  const boxGeometry = new BoxGeometry(1, 1, 1);
  const cylinderGeometry = new CylinderGeometry(1, 1, 1, 8);
  const leafGeometry = new IcosahedronGeometry(1, 1);
  const materials = Object.fromEntries(Object.entries({
    concrete: '#e4e7df', edge: '#fafbf6', stone: '#bac6b8',
    solar: '#466d71', dark: '#354b44', glass: '#5d8880', timber: '#9a856d',
    grass: '#a7bc94', hedge: '#6c8a65', road: '#c6cec5',
    water: '#7fb8b0', poolEdge: '#d7e3d9', soil: '#c0cbb9',
  }).map(([key, color]) => [key, new MeshStandardMaterial({
    color, roughness: key === 'glass' || key === 'water' ? 0.24 : 0.84,
    metalness: key === 'glass' ? 0.38 : 0,
  })]));
  materials.glass.userData.nightWindow = true;
  function box(parent, material, dimensions, position, castShadow = true) {
    const mesh = new Mesh(boxGeometry, materials[material]);
    mesh.scale.set(...dimensions); mesh.position.set(...position);
    mesh.castShadow = castShadow; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  }
  box(model, 'soil', [10.4, 0.42, 8], [0, -0.25, 0]);
  box(model, 'grass', [10.1, 0.08, 7.75], [0, 0, 0]);
  box(model, 'concrete', [6.3, 0.16, 4.4], [-0.55, 0.12, -0.25]);
  box(model, 'road', [3.5, 0.05, 2.05], [2.95, 0.08, 2.55]);
  // Ground floor and the sheltered terrace.
  box(model, 'concrete', [4.8, 1.65, 2.9], [-0.8, 1.03, -0.95]);
  box(model, 'glass', [4.36, 1.23, 0.06], [-0.8, 1.03, 0.535]);
  box(model, 'dark', [0.1, 1.42, 0.12], [-2.92, 1.05, 0.57]);
  box(model, 'dark', [0.09, 1.42, 0.12], [-0.93, 1.05, 0.57]);
  box(model, 'dark', [0.09, 1.42, 0.12], [1.33, 1.05, 0.57]);
  box(model, 'edge', [5.25, 0.18, 3.55], [-0.8, 1.94, -0.7]);
  box(model, 'glass', [0.065, 1.22, 2.48], [1.635, 1.03, -0.86]);
  box(model, 'dark', [0.1, 1.42, 0.1], [1.68, 1.04, -0.6]);
  // Entry volume, timber screen and a courtyard deck.
  box(model, 'stone', [1.35, 1.7, 2.1], [-3.2, 1.02, -0.9]);
  box(model, 'timber', [1.2, 1.47, 0.06], [-3.2, 0.98, 0.18]);
  for (let i = 0; i < 12; i++) box(model, 'dark', [0.035, 1.46, 0.045], [-3.72 + i * 0.095, 0.98, 0.23], false);
  box(model, 'timber', [3.4, 0.09, 1.6], [-0.4, 0.25, 1.52]);
  for (let i = 0; i < (compact ? 8 : 16); i++) box(model, 'concrete', [0.025, 0.012, 1.6], [-1.95 + i * (compact ? 0.4 : 0.2), 0.3, 1.52], false);
  // A small pool is part of the illustration, not an advertised amenity.
  box(model, 'poolEdge', [1.7, 0.1, 3.85], [3.3, 0.13, -0.9]);
  box(model, 'water', [1.48, 0.045, 3.6], [3.3, 0.19, -0.9], false);
  box(model, 'edge', [0.04, 0.01, 3.25], [2.73, 0.217, -0.9], false);
  // Upper storey moves as one coherent architectural piece.
  const upperFloor = new Group(); model.add(upperFloor);
  box(upperFloor, 'edge', [3.5, 0.16, 3.1], [-1.15, 2.12, -1]);
  box(upperFloor, 'concrete', [3.12, 1.35, 2.84], [-1.15, 2.84, -1.1]);
  box(upperFloor, 'glass', [2.65, 0.97, 0.06], [-1.15, 2.83, 0.35]);
  box(upperFloor, 'edge', [0.2, 1.36, 0.22], [-2.62, 2.84, 0.34]);
  box(upperFloor, 'edge', [0.2, 1.36, 0.22], [0.32, 2.84, 0.34]);
  box(upperFloor, 'dark', [0.07, 1.07, 0.08], [-1.15, 2.83, 0.4]);
  box(upperFloor, 'glass', [0.06, 1.02, 2.24], [0.44, 2.83, -1.05]);
  box(upperFloor, 'timber', [0.08, 1.35, 2.8], [-2.76, 2.84, -1.08]);
  // Flat roof with a deep, crisply defined overhang.
  const roof = new Group(); upperFloor.add(roof);
  box(roof, 'edge', [3.65, 0.18, 3.32], [-1.15, 3.59, -1.07]);
  box(roof, 'stone', [3.23, 0.045, 2.9], [-1.15, 3.71, -1.07], false);
  // Open pergola on the terrace.
  for (const x of [0.9, 2.0]) box(model, 'dark', [0.07, 0.78, 0.07], [x, 2.42, -2]);
  for (let i = 0; i < 7; i++) box(model, 'timber', [1.28, 0.06, 0.07], [1.45, 2.85, -2.02 + i * 0.21]);
  box(model, 'stone', [1.25, 0.32, 0.56], [1.45, 2.12, -0.45]);
  // Paving, boundary walls and open street frontage.
  for (let i = 0; i < 5; i++) box(model, 'edge', [0.9, 0.045, 0.36], [-3.24, 0.08, 0.9 + i * 0.5], false);
  box(model, 'stone', [10.2, 0.35, 0.12], [0, 0.2, -3.83]);
  box(model, 'stone', [0.12, 0.35, 7.6], [-5.02, 0.2, 0]);
  box(model, 'stone', [0.12, 0.35, 7.6], [5.02, 0.2, 0]);
  box(model, 'hedge', [3.75, 0.34, 0.3], [-0.3, 0.23, 3.5]);
  // Low-poly foliage is instanced; no downloaded models or textures.
  const trees = [[-4.25, -2.8, 1.2], [4.35, -2.9, 1.3], [-4.35, 2.85, 1.1], [0.45, -3.05, 0.9]];
  if (!compact) trees.push([-4.35, -0.2, 1.08], [4.3, 0.4, 0.85]);
  const leaves = new InstancedMesh(leafGeometry, materials.hedge, trees.length * 3);
  const matrix = new Matrix4(), q = new Quaternion(); let index = 0;
  trees.forEach(([x, z, height], treeIndex) => {
    const trunk = new Mesh(cylinderGeometry, materials.timber);
    trunk.scale.set(0.075, height, 0.075); trunk.position.set(x, height / 2, z); model.add(trunk);
    [[0, 0.2, 0], [-0.23, -0.05, 0.08], [0.21, -0.08, -0.12]].forEach(([dx, dy, dz]) => {
      q.setFromAxisAngle(new Vector3(0, 1, 0), treeIndex * 0.73);
      matrix.compose(new Vector3(x + dx, height + dy, z + dz), q, new Vector3(0.55, 0.68, 0.55));
      leaves.setMatrixAt(index++, matrix);
    });
  });
  leaves.instanceMatrix.needsUpdate = true;
  leaves.castShadow = true; model.add(leaves);
  // Balustrades, rooftop solar panels, terrace furniture and planted borders.
  for (let x = -2.65; x < 0.5; x += 0.5) box(upperFloor, 'dark', [0.025, 0.38, 0.025], [x, 2.37, 0.52]);
  box(upperFloor, 'dark', [3.2, 0.035, 0.035], [-1.13, 2.57, 0.52]);
  for (const x of [-2.15, -1.1, -0.05]) {
    const panel = box(roof, 'solar', [0.88, 0.055, 1.55], [x, 3.83, -1.35]); panel.rotation.x = -0.12;
    for (const dz of [-0.5, 0, 0.5]) box(roof, 'edge', [0.85, 0.012, 0.015], [x, 3.88, -1.35 + dz], false);
  }
  for (const x of [-1.3, 0.1]) {
    box(model, 'edge', [0.78, 0.23, 0.5], [x, 0.44, 1.75]);
    box(model, 'stone', [0.78, 0.35, 0.12], [x, 0.61, 1.54]);
  }
  box(model, 'timber', [0.45, 0.12, 0.45], [-0.6, 0.45, 2.12]);
  for (const x of [-2.5, 0.8]) {
    box(model, 'edge', [0.32, 0.38, 0.32], [x, 0.45, 1.4]);
    const plant = new Mesh(leafGeometry, materials.hedge); plant.position.set(x, 0.84, 1.4); plant.scale.set(0.22, 0.3, 0.22); model.add(plant);
  }
  for (let i = 0; i < 5; i++) box(model, 'timber', [0.38, 0.075, 0.035], [-3.24, 0.16, 1 + i * 0.5], false);
  const life = createSceneLife(model, { compact, kind: 'house' });
  const foliageMatrices = Array.from({ length: leaves.count }, (_, i) => { const value = new Matrix4(); leaves.getMatrixAt(i, value); return value; });
  const wave = new Mesh(new PlaneGeometry(0.65, 2.9), new MeshBasicMaterial({ color: '#d7f1e9', transparent: true, opacity: 0.14, depthWrite: false }));
  wave.rotation.x = -Math.PI / 2; wave.position.set(3.3, 0.22, -0.9); model.add(wave);
  function animate(seconds = 0, reduced = false) {
    const time = reduced ? 0 : seconds;
    life.update(time, reduced);
    foliageMatrices.forEach((base, i) => { matrix.copy(base); matrix.elements[12] += reduced ? 0 : Math.sin(time * 1.2 + Math.floor(i / 3)) * 0.075; leaves.setMatrixAt(i, matrix); });
    leaves.instanceMatrix.needsUpdate = true;
    wave.scale.x = 1 + Math.sin(time * 0.8) * 0.4;
    wave.material.opacity = reduced ? 0.14 : 0.12 + Math.sin(time) * 0.04;
  }
  // Soft ambient contact shadow made in memory, not a large texture download.
  const pixels = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const d = ((x - 31.5) / 22) ** 2 + ((y - 31.5) / 19) ** 2;
    const i = (y * 64 + x) * 4;
    pixels[i] = 33; pixels[i + 1] = 62; pixels[i + 2] = 47;
    pixels[i + 3] = Math.round(Math.exp(-d * 1.5) * 40);
  }
  const shadowTexture = new DataTexture(pixels, 64, 64, RGBAFormat); shadowTexture.needsUpdate = true;
  const shadow = new Mesh(new PlaneGeometry(16, 13), new MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
  shadow.name = 'contact-shadow';
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.6;
  model.add(shadow);

  batchSceneMeshes(model);
  return {
    model, upperFloor, roof, animate,
    dispose() {
      const geometries = new Set(), usedMaterials = new Set();
      model.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) usedMaterials.add(o.material); if (o.isInstancedMesh) o.dispose(); });
      geometries.forEach(g => g.dispose()); usedMaterials.forEach(m => m.dispose());
      shadowTexture.dispose();
    },
  };
}
