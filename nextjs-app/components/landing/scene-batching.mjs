import { InstancedMesh } from 'three';

// Batch siblings in local space so animated parents (roof, wheels, branches) still move.
export function batchSceneMeshes(root) {
  const parents = []; root.traverse(object => { if (object.children.length) parents.push(object); });
  for (const parent of parents) {
    const groups = new Map();
    for (const mesh of parent.children) {
      if (!mesh.isMesh || mesh.isInstancedMesh || mesh.material.transparent || mesh.userData.animated || mesh.userData.nightOnly) continue;
      const key = `${mesh.geometry.uuid}:${mesh.material.uuid}:${mesh.castShadow}:${mesh.receiveShadow}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(mesh);
    }
    for (const meshes of groups.values()) {
      if (meshes.length < 2) continue;
      const batch = new InstancedMesh(meshes[0].geometry, meshes[0].material, meshes.length);
      batch.castShadow = meshes[0].castShadow; batch.receiveShadow = meshes[0].receiveShadow;
      meshes.forEach((mesh, i) => { mesh.updateMatrix(); batch.setMatrixAt(i, mesh.matrix); parent.remove(mesh); });
      parent.add(batch);
    }
  }
}
