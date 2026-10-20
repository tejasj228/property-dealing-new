import { Color, Group, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';

// Typical road colours: whites and silvers dominate, with a few dark and deep tones.
export const CAR_PAINTS = ['#eceae4', '#c2c5c9', '#f6f5f0', '#7c8288', '#25282c', '#e3e1da', '#8b2b25', '#2b3e5c', '#a99470', '#b7bbbf'];

// Every car in a scene shares one instanced draw per part (body, cabin, trim, lamps,
// wheels, night headlight pools), so traffic costs the same few draws at any count.
// Paint is per car through instance colours on a single white clearcoat material.
export function createFleet(kit, parent, count, { paints = CAR_PAINTS, offset = 0, type = 'hatch' } = {}) {
  const template = kit.car(new Group(), 0, 0, 0, '#ffffff', type);
  template.position.set(0, 0, 0); template.rotation.set(0, 0, 0); template.updateMatrixWorld(true);
  const buckets = new Map();
  template.traverse(part => {
    if (!part.isMesh) return;
    const key = `${part.geometry.uuid}:${part.material.uuid}:${part.castShadow}:${Boolean(part.userData.nightOnly)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(part);
  });
  const group = new Group(); group.name = type === 'hatch' ? 'traffic' : `traffic-${type}`; group.userData.animated = true; parent.add(group);
  const colour = new Color();
  const meshes = [...buckets.values()].map(parts => {
    const [first] = parts, mesh = new InstancedMesh(first.geometry, first.material, parts.length * count);
    mesh.name = 'car'; mesh.castShadow = first.castShadow; mesh.receiveShadow = first.receiveShadow;
    // Instances travel the whole board, so a build-time bounding sphere would cull them.
    mesh.frustumCulled = false;
    if (first.userData.nightOnly) { mesh.userData.nightOnly = true; mesh.visible = false; }
    if (first.material.name === 'vehicle-paint') for (let car = 0; car < count; car++) {
      colour.set(paints[(car + offset) % paints.length]);
      for (let j = 0; j < parts.length; j++) mesh.setColorAt(car * parts.length + j, colour);
    }
    group.add(mesh);
    return { mesh, parts: parts.map(part => part.matrixWorld.clone()) };
  });
  const root = new Matrix4(), matrix = new Matrix4(), rotation = new Quaternion(), position = new Vector3(), scale = new Vector3(), up = new Vector3(0, 1, 0);
  function place(car, x, y, z, yaw, size = 1) {
    root.compose(position.set(x, y, z), rotation.setFromAxisAngle(up, yaw), scale.setScalar(size));
    for (const { mesh, parts } of meshes) for (let j = 0; j < parts.length; j++) mesh.setMatrixAt(car * parts.length + j, matrix.multiplyMatrices(root, parts[j]));
  }
  function commit() { for (const { mesh } of meshes) mesh.instanceMatrix.needsUpdate = true; }
  return { group, count, place, commit };
}
