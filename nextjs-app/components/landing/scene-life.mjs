import { createCloudGeometry } from './cloud-volume.mjs';
import { BufferGeometry, Float32BufferAttribute, DoubleSide, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three';

// Small deterministic scene details. Time comes from the visible, unpaused renderer.
export function createSceneLife(parent, { compact = false, kind = 'house' } = {}) {
  const clouds = [];
  const cloudGeometry = createCloudGeometry();
  const cloudMaterial = new MeshStandardMaterial({ name:'soft-cloud', color: '#eeece5', roughness: 1, transparent: true, opacity: .94, depthWrite: false });
  cloudMaterial.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', 'diffuseColor.a *= smoothstep(0.0, 0.38, abs(dot(normal, normalize(vViewPosition))));\n#include <opaque_fragment>');
  };
  cloudMaterial.customProgramCacheKey = () => 'soft-cumulus-v1';
  for (let i = 0; i < (compact ? 1 : 2); i++) {
    const cloud = new Group(); cloud.name = 'drifting-cloud';
    const x = i ? -2.6 : 2.4, y = i ? 4.7 : 5.15, z = i ? -2.3 : -1.4;
    cloud.position.set(x, y, z);
    const volume = new Mesh(cloudGeometry, cloudMaterial); volume.name = 'continuous-cloud-volume';
    volume.rotation.y = i ? -.3 : .15; volume.scale.setScalar(i ? .88 : 1);
    cloud.add(volume);
    parent.add(cloud); clouds.push({ object: cloud, x, y, z });
  }
  const patches = kind === 'house' ? [[-4.6, -0.3, 0.45, 3.8], [-0.4, 2.9, 3.4, 0.5]]
    : kind === 'land' ? [[-2.3, -0.3, 2.9, 4.5], [2.3, -0.3, 2.9, 4.5]]
    : kind === 'society' ? [[-2, 1.2, 2.9, 1.3], [3.4, 1.8, 1.5, 0.4]]
    : [[-4.5, -1.4, 0.3, 2.7], [4.5, -1.3, 0.3, 2.8]];
  const count = compact ? 220 : 760;
  const bladeGeometry = new BufferGeometry();
  bladeGeometry.setAttribute('position',new Float32BufferAttribute([-.012,0,0,.012,0,0,-.008,.55,.025,.008,.55,.025,.015,1,.09],3));
  bladeGeometry.setAttribute('uv',new Float32BufferAttribute([0,0,1,0,0,.55,1,.55,.5,1],2));
  bladeGeometry.setIndex([0,1,2,1,3,2,2,3,4]);bladeGeometry.computeVertexNormals();
  const bladeMaterial = new MeshStandardMaterial({ name: 'dry-grass-blade', color: '#a48b48', roughness: 1, side: DoubleSide });
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
      object.position.set(x + Math.sin(time * 0.22 + i) * 0.65, y + Math.sin(time * 0.35 + i) * 0.055, z);
    });
    stems.forEach((stem, i) => {
      position.set(stem.x, 0.14, stem.z); scale.set(1, stem.height, 1);
      const gust = .38 + .2 * Math.sin(time * .8 + stem.x * .45);
      rotation.setFromAxisAngle(axis, reduced ? Math.sin(stem.phase) * .1 : gust + Math.sin(time * 2.8 + stem.phase) * .25);
      matrix.compose(position, rotation, scale); grass.setMatrixAt(i, matrix);
    });
    grass.instanceMatrix.needsUpdate = true;

  }
  update(0, true);
  return { update };
}
