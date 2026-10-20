import { Color, CylinderGeometry, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, SphereGeometry, Vector3 } from 'three';

// Clothing seen on NCR streets: whites, blues, kurta saffron, saree pinks and greens.
const CLOTHES = ['#f0ede4', '#3f5f8f', '#d9893a', '#b8476a', '#2f6d5a', '#8d2f2f', '#d8c39a', '#24303f', '#e2b23c', '#6b4f8a'];

// Pedestrians on the pavements, two instanced draws for the whole crowd (clothed body and
// head). Each walks its own pace along a kerb with a gentle step bob.
export function createCrowd(parent, paths, count, { scale = .95, seed = 3 } = {}) {
  const body = new CylinderGeometry(.034, .046, .2, 7), head = new SphereGeometry(.033, 8, 6);
  body.translate(0, .1, 0); head.translate(0, .235, 0);
  const clothes = new MeshStandardMaterial({ name: 'crowd-clothes', color: '#ffffff', roughness: .85 });
  const skin = new MeshStandardMaterial({ name: 'crowd-skin', color: '#9c6b4e', roughness: .7 });
  const bodies = new InstancedMesh(body, clothes, count), heads = new InstancedMesh(head, skin, count);
  bodies.name = 'pedestrians'; heads.name = 'pedestrian-heads';
  for (const mesh of [bodies, heads]) { mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.userData.animated = true; parent.add(mesh); }
  const random = n => { const v = Math.sin(n * 91.7 + seed * 13.1) * 43758.5453; return v - Math.floor(v); };
  const colour = new Color(), walkers = [];
  for (let i = 0; i < count; i++) {
    const path = paths[i % paths.length];
    walkers.push({ path, phase: random(i), speed: (.0016 + random(i + 40) * .0016) * (random(i + 7) > .5 ? 1 : -1), side: random(i + 19) > .5 ? 1 : -1, height: .9 + random(i + 3) * .2 });
    bodies.setColorAt(i, colour.set(CLOTHES[Math.floor(random(i + 11) * CLOTHES.length)]));
    heads.setColorAt(i, colour.set('#ffffff').multiplyScalar(.8 + random(i + 23) * .4));
  }
  const matrix = new Matrix4(), rotation = new Quaternion(), position = new Vector3(), size = new Vector3(), up = new Vector3(0, 1, 0);
  function update(seconds = 0, reduced = false) {
    const time = reduced ? 0 : seconds;
    walkers.forEach((walker, i) => {
      const { curve, offset, y, closed } = walker.path;
      let u = ((walker.phase + time * walker.speed) % 1 + 1) % 1;
      if (!closed) u = .04 + Math.abs(u * 2 - 1) * .92;
      const p = curve.getPointAt(u), v = curve.getTangentAt(u);
      const heading = walker.speed > 0 ? 1 : -1, bob = reduced ? 0 : Math.abs(Math.sin(time * 6 + i)) * .012;
      position.set(p.x - v.z * offset * walker.side, y + bob, p.z + v.x * offset * walker.side);
      rotation.setFromAxisAngle(up, Math.atan2(v.x * heading, v.z * heading));
      matrix.compose(position, rotation, size.set(scale, scale * walker.height, scale));
      bodies.setMatrixAt(i, matrix); heads.setMatrixAt(i, matrix);
    });
    bodies.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
  }
  update(0, true);
  return { update, resources: { geometries: [body, head], materials: [clothes, skin] } };
}
