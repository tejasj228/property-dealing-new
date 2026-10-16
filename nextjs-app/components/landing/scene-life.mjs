import { ConeGeometry, Group, IcosahedronGeometry, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three';

// Small deterministic scene details. Time comes from the visible, unpaused renderer.
export function createSceneLife(parent, { compact = false, kind = 'house' } = {}) {
  const clouds = [];
  const cloudGeometry = new IcosahedronGeometry(1, 2);
  const cloudMaterial = new MeshStandardMaterial({ color: '#f0f3e9', roughness: 1, transparent: true, opacity: 0.82, depthWrite: false });
  for (let i = 0; i < (compact ? 1 : 2); i++) {
    const cloud = new Group(); cloud.name = 'drifting-cloud';
    const x = i ? -2.6 : 2.4, y = i ? 4.7 : 5.15, z = i ? -2.3 : -1.4;
    cloud.position.set(x, y, z);
    for (const [dx, dy, scale] of [[-0.45, 0, 0.42], [0, 0.12, 0.6], [0.5, -0.02, 0.4]]) {
      const puff = new Mesh(cloudGeometry, cloudMaterial);
      puff.position.set(dx, dy, 0); puff.scale.set(scale, scale * 0.48, scale * 0.57); cloud.add(puff);
    }
    parent.add(cloud); clouds.push({ object: cloud, x, y, z });
  }
  const patches = kind === 'house' ? [[-4.6, -0.3, 0.45, 3.8], [-0.4, 2.9, 3.4, 0.5]]
    : kind === 'land' ? [[-2.3, -0.3, 2.9, 4.5], [2.3, -0.3, 2.9, 4.5]]
    : kind === 'society' ? [[-2, 1.2, 2.9, 1.3], [3.4, 1.8, 1.5, 0.4]]
    : [[-4.5, -1.4, 0.3, 2.7], [4.5, -1.3, 0.3, 2.8]];
  const count = compact ? 80 : 210;
  const bladeGeometry = new ConeGeometry(0.035, 1, 3); bladeGeometry.translate(0, 0.5, 0);
  const bladeMaterial = new MeshStandardMaterial({ color: '#698c59', roughness: 1 });
  const grass = new InstancedMesh(bladeGeometry, bladeMaterial, count); grass.name = 'wind-in-grass';
  grass.frustumCulled = false; parent.add(grass);
  const stems = [];
  const random = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  for (let i = 0; i < count; i++) {
    const [x, z, width, depth] = patches[i % patches.length];
    stems.push({ x: x + (random(i + 2) - 0.5) * width, z: z + (random(i + 58) - 0.5) * depth, height: 0.1 + random(i + 19) * 0.14, phase: random(i + 8) * 6.28 });
  }
  const matrix = new Matrix4(), rotation = new Quaternion(), position = new Vector3(), scale = new Vector3(), axis = new Vector3(0, 0, 1);
  function update(seconds = 0, reduced = false) {
    const time = reduced ? 0 : seconds;
    clouds.forEach(({ object, x, y, z }, i) => {
      object.position.set(x + Math.sin(time * 0.16 + i) * 0.65, y + Math.sin(time * 0.25 + i) * 0.07, z);
    });
    stems.forEach((stem, i) => {
      position.set(stem.x, 0.14, stem.z); scale.set(1, stem.height, 1);
      rotation.setFromAxisAngle(axis, Math.sin(time * 1.8 + stem.phase) * (reduced ? 0.1 : 0.27));
      matrix.compose(position, rotation, scale); grass.setMatrixAt(i, matrix);
    });
    grass.instanceMatrix.needsUpdate = true;

  }
  update(0, true);
  return { update };
}
