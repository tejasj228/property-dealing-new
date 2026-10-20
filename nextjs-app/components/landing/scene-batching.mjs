import { Color, InstancedMesh, Matrix4, Vector3 } from 'three';

// A batching frame is the root, anything animated, or a group flagged rigid because it
// moves, hides or keeps its own meshes (obstacles checked by pedestrian routes).
const isFrame = (object, root) => object === root || object.userData.animated || object.userData.rigid || object.userData.pedestrianObstacle;

// Facade tones for buildings that share one material: cream, sand, warm grey, peach, taupe.
const FACADE_TINTS = [[1, 1, 1], [1, .955, .89], [.94, .95, .97], [1.01, .925, .85], [.91, .89, .85], [.975, .97, .945]].map(([r, g, b]) => new Color(r, g, b));
const TINTED = /^(ivory|concrete|edge|stone)$/;

// Static meshes merge into one instanced draw per geometry, material and shadow setting
// inside their nearest frame, so moving parts (roofs, wheels, branches) still move.
// With `tint`, each original parent group receives one facade tone, so a building stays
// uniform while neighbouring buildings differ.
export function batchSceneMeshes(root, { tint = false } = {}) {
  root.updateMatrixWorld(true);
  const frames = new Map(), inverse = new Matrix4(), origin = new Vector3();
  root.traverse(mesh => {
    if (!mesh.isMesh || mesh.isInstancedMesh || mesh.name || mesh.material.transparent || mesh.material.visible === false || mesh.userData.animated || mesh.userData.nightOnly) return;
    let frame = mesh.parent;
    while (!isFrame(frame, root)) frame = frame.parent;
    if (!frames.has(frame)) frames.set(frame, new Map());
    const groups = frames.get(frame), key = `${mesh.geometry.uuid}:${mesh.material.uuid}:${mesh.castShadow}:${mesh.receiveShadow}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(mesh);
  });
  for (const [frame, groups] of frames) {
    inverse.copy(frame.matrixWorld).invert();
    for (const meshes of groups.values()) {
      if (meshes.length < 2) continue;
      const first = meshes[0], batch = new InstancedMesh(first.geometry, first.material, meshes.length);
      batch.castShadow = first.castShadow; batch.receiveShadow = first.receiveShadow;
      const tinted = tint && TINTED.test(first.material.name);
      meshes.forEach((mesh, i) => {
        batch.setMatrixAt(i, new Matrix4().multiplyMatrices(inverse, mesh.matrixWorld));
        if (tinted) {
          mesh.parent.getWorldPosition(origin);
          const hash = Math.abs(Math.sin(origin.x * 12.9898 + origin.z * 78.233) * 43758.5453) % 1;
          batch.setColorAt(i, FACADE_TINTS[Math.floor(hash * FACADE_TINTS.length)]);
        }
        mesh.removeFromParent();
      });
      batch.computeBoundingSphere();
      frame.add(batch);
    }
  }
}
