import { BoxGeometry, CatmullRomCurve3, ConeGeometry, CylinderGeometry, Group, InstancedMesh, Mesh, MeshStandardMaterial, Object3D, TubeGeometry, Vector3 } from 'three';
import { createDetailKit } from './scene-details.mjs';
import { disposeSpatialModel } from './spatial-models.mjs';

export const propertyColours = { residential: '#44886a', commercial: '#c58a51', other: '#798994' };
export function layoutProperties(properties) {
  const rows = Math.max(1, Math.ceil(properties.length / 3));
  return properties.map((property, i) => {
    const row = Math.floor(i / 3), columns = Math.min(3, properties.length - row * 3);
    return { id: property.id, x: (i % 3 - (columns - 1) / 2) * 6.5, z: (row - (rows - 1) / 2) * 8 - 0.6, type: property.propertyType };
  });
}

export function framePropertyMapCamera(camera, width, height, depth, angle = 0.16, zoom = 1) {
  const distance = Math.max(26, depth * 1.3), aspect = width / height;
  camera.position.set(Math.sin(angle) * distance, distance * 0.95, Math.cos(angle) * distance); camera.lookAt(0, 0, 0);
  const projectedWidth = 11 * Math.cos(angle) + depth * 0.5 * Math.abs(Math.sin(angle));
  const projectedHeight = (depth * 0.5 * Math.cos(angle) + 11 * Math.abs(Math.sin(angle))) * 0.69 + 3.5;
  const halfWidth = Math.max(13.5, projectedWidth * 1.12, projectedHeight * aspect) / zoom;
  camera.left = -halfWidth; camera.right = halfWidth; camera.top = halfWidth / aspect; camera.bottom = -halfWidth / aspect;
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
}

export function createPropertyMapModel(properties, compact = false) {
  const model = new Group(), kit = createDetailKit();
  const plots = layoutProperties(properties), rows = Math.max(1, Math.ceil(properties.length / 3)), depth = Math.max(12, rows * 8 + 5);
  kit.box(model, 'stone', [22, 0.65, depth], [0, -0.42, 0]);
  kit.box(model, 'grass', [21.8, 0.12, depth - 0.2], [0, -0.025, 0]);
  const roadMaterial = new MeshStandardMaterial({ color: '#bbc4b7', roughness: 1 });
  const dashMaterial = new MeshStandardMaterial({ color: '#f1f1df', roughness: 1 });
  const cars = [];
  const dashGeometry = new BoxGeometry(0.22, 0.015, 0.045);
  for (let row = 0; row < rows; row++) {
    const z = (row - (rows - 1) / 2) * 8 + 1.6;
    const curve = new CatmullRomCurve3([
      new Vector3(-10.8, 0.07, z - 0.5), new Vector3(-6, 0.07, z + 0.5), new Vector3(0, 0.07, z - 0.6), new Vector3(6, 0.07, z + 0.5), new Vector3(10.8, 0.07, z - 0.2),
    ]);
    const road = new Mesh(new TubeGeometry(curve, 60, 0.55, 6, false), roadMaterial);
    road.scale.y = 0.06; road.position.y = 0.1; road.receiveShadow = true; model.add(road);
    for (let i = 1; i < 35; i++) {
      const p = curve.getPoint(i / 35), tangent = curve.getTangent(i / 35);
      const dash = new Mesh(dashGeometry, dashMaterial); dash.position.set(p.x, 0.15, p.z); dash.rotation.y = -Math.atan2(tangent.z, tangent.x); model.add(dash);
    }
    if (row < 5) { const car = kit.car(model, 0, z, Math.PI / 2, row % 2 ? 'green' : 'ivory'); cars.push({ car, curve }); }
  }
  const markerGeometry = new CylinderGeometry(0.24, 0.36, 0.08, 20);
  const plotGeometry = new BoxGeometry(3.5, 0.16, 2.2);
  const colours = Object.fromEntries(Object.entries(propertyColours).map(([key, color]) => [key, new MeshStandardMaterial({ color, roughness: 0.85 })]));
  for (const [i, plot] of plots.entries()) {
    const color = colours[plot.type] || colours.other;
    const tile = new Mesh(plotGeometry, color); tile.position.set(plot.x, 0.16, plot.z); tile.receiveShadow = true; model.add(tile);
    kit.box(model, 'ivory', [3.7, 0.06, 2.4], [plot.x, 0.06, plot.z]);
    for (const dx of [-1.6, 1.6]) for (const dz of [-0.95, 0.95]) kit.box(model, 'ivory', [0.045, 0.28, 0.045], [plot.x + dx, 0.3, plot.z + dz]);
    // Survey parcels represent listings, not invented buildings or amenities on them.
    const pin = new Mesh(markerGeometry, color); pin.position.set(plot.x, 0.37, plot.z); model.add(pin);
    kit.box(model, 'ivory', [0.035, 0.65, 0.035], [plot.x, 0.6, plot.z]);
    if (i < (compact ? 4 : 8)) kit.tree(model, plot.x - 2.1, plot.z - 0.8, 0.8);
  }
  // A landscaped model border, with a small pond and path at the start of the route.
  for (let i = 0; i < (compact ? 6 : 12); i++) {
    const x = -9.5 + (i % 6) * 3.7, z = i < 6 ? -depth / 2 + 0.9 : depth / 2 - 0.9;
    kit.tree(model, x, z, 0.75 + (i % 3) * 0.15);
  }
  kit.round(model, 'water', [1.2, 0.035, 0.7], [-8.7, 0.11, -2.1]);
  kit.bench(model, -7.3, -2.2, -0.3);
  kit.box(model, 'stone', [1.9, 0.03, 0.35], [-8.5, 0.1, -0.8]);
  // Small pockets of planting at the edges keep every listing and road clear.
  for (let i = 0; i < (compact ? 3 : 5); i++) {
    kit.tree(model, i % 2 ? 9.6 : -9.6, -depth / 2 + 3 + i * (depth - 6) / 5, 0.62 + i % 2 * 0.18);
  }
  const grass = new InstancedMesh(new ConeGeometry(0.055, 0.3, 3), new MeshStandardMaterial({ color: '#77995d', roughness: 1 }), compact ? 90 : 180);
  grass.name = 'map-grass';
  const blade = new Object3D();
  const grassSpots = Array.from({ length: grass.count }, (_, i) => {
    const edge = i % 4, t = ((i * 0.61803398875) % 1);
    return { x: edge < 2 ? -10 + t * 20 : (edge === 2 ? -10.15 : 10.15) + Math.sin(i * 7) * 0.25,
      z: edge < 2 ? (edge === 0 ? -depth / 2 + 0.5 : depth / 2 - 0.5) + Math.sin(i * 3) * 0.22 : -depth / 2 + 1 + t * (depth - 2), scale: 0.65 + (i % 5) * 0.14 };
  });
  model.add(grass);
  const markerPositions = plots.map(plot => ({ ...plot, position: new Vector3(plot.x, 1, plot.z) }));
  function update(seconds, reduced) {
    kit.animate(seconds, reduced);
    grassSpots.forEach((spot, i) => {
      blade.position.set(spot.x, 0.16, spot.z); blade.scale.setScalar(spot.scale);
      blade.rotation.set(0, i * 2.4, reduced ? 0.06 : Math.sin(seconds * 1.2 + i * 0.4) * 0.14);
      blade.updateMatrix(); grass.setMatrixAt(i, blade.matrix);
    });
    grass.instanceMatrix.needsUpdate = true;
    cars.forEach(({ car, curve }, i) => {
      const t = reduced ? 0.28 + i * 0.05 : (seconds * 0.025 + i * 0.27 + 0.1) % 1;
      const p = curve.getPoint(t), tangent = curve.getTangent(t);
      car.position.set(p.x, 0.14, p.z); car.rotation.y = Math.atan2(tangent.x, tangent.z);
      // Taper at the edge of the model, where the road leaves the board.
      car.scale.setScalar(Math.min(1, t * 20, (1 - t) * 20));
      car.userData.wheels.forEach(wheel => { wheel.rotation.x = reduced ? 0 : seconds * 2; });
    });
  }
  // Batch static paving, parcel borders and survey posts into shared draw calls.
  model.updateMatrixWorld(true);
  const batches = new Map();
  model.traverse(object => {
    if (!object.isMesh || object.isInstancedMesh) return;
    for (let parent = object.parent; parent; parent = parent.parent) if (parent.userData.animated) return;
    const key = object.geometry.uuid + ':' + object.material.uuid;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(object);
  });
  for (const meshes of batches.values()) {
    if (meshes.length < 2) continue;
    const batch = new InstancedMesh(meshes[0].geometry, meshes[0].material, meshes.length);
    meshes.forEach((mesh, index) => { batch.setMatrixAt(index, mesh.matrixWorld); mesh.removeFromParent(); });
    batch.instanceMatrix.needsUpdate = true; model.add(batch);
  }
  update(0, true);
  return { model, markerPositions, depth, update, dispose: () => disposeSpatialModel(model, { geometries: [...kit.resources.geometries, markerGeometry, plotGeometry], materials: [...kit.resources.materials, roadMaterial, dashMaterial, ...Object.values(colours)] }) };
}
