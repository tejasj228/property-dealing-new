import {
  ExtrudeGeometry, Group, Mesh, OrthographicCamera, Shape, TorusGeometry,
} from 'three';
import { createDetailKit } from './scene-details.mjs';
import { batchSceneMeshes } from './scene-batching.mjs';
import { createSceneLife } from './scene-life.mjs';
import { addDistrictDetails } from './district-details.mjs';
import { createFleet } from './vehicle-fleet.mjs';

const clamp = value => Math.min(1, Math.max(0, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

export function createSpatialCamera(kind) {
  const camera = new OrthographicCamera(-8, 8, 6, -6, 0.1, 80);
  if (kind === 'keys') { camera.position.set(2.5, 2, 12); camera.lookAt(0, 0, 0); }
  else { camera.position.set(12, 11.5, 15); camera.lookAt(0, 1.25, 0); }
  camera.updateMatrixWorld(); return camera;
}

export function frameSpatialCamera(camera, width, height, kind) {
  const aspect = width / height;
  const halfWidth = kind === 'keys' ? Math.max(2.3, 2.55 * aspect) : Math.max(7.0, 5.65 * aspect);
  camera.left = -halfWidth; camera.right = halfWidth;
  camera.top = halfWidth / aspect; camera.bottom = -halfWidth / aspect;
  camera.updateProjectionMatrix();
}

export function disposeSpatialModel(model, resources = {}) {
  const geometries = new Set(resources.geometries || []), materials = new Set(resources.materials || []);
  model.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) materials.add(o.material); if (o.isInstancedMesh) o.dispose(); });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}

export function createDistrict({ compact = false, kind = 'land' } = {}) {
  const t = createDetailKit({ compact }), model = new Group();
  const district = t.base(); district.name = kind; district.userData.rigid = true; model.add(district);
  const cars = [], walkers = [];
  function addWalkers(routes) {
    routes.slice(0, compact ? 3 : routes.length).forEach(([start, end], i) => {
      const object = t.person(district, start[0], start[1], i % 2 ? 'ivory' : 'cloth');
      object.position.y = kind === 'commercial' ? .13 : kind === 'society' ? .115 : .07;
      object.userData.route = { start, end };
      walkers.push({ object, start, end });
    });
  }
  let buildings, swing;
  if (kind === 'land') {
    const land = district;
    // Open plots, survey pegs and a road. These are illustrative parcels, not inventory.
    t.box(land, 'stone', [0.85, 0.035, 5.6], [0, 0.035, -0.4], false);
    for (const x of [-2.35, 2.35]) for (const z of [-2.15, -0.2, 1.65]) {
      t.box(land, 'grass', [3.5, 0.06, 1.55], [x, 0.035, z], false);
      t.box(land, 'sand', [3.5, 0.02, 0.045], [x, 0.08, z - 0.77], false);
      t.box(land, 'sand', [0.045, 0.02, 1.55], [x - 1.75, 0.08, z], false);
      for (const dx of [-1.7, 1.7]) t.box(land, 'ivory', [0.055, 0.2, 0.055], [x + dx, 0.15, z + 0.72]);
  }
  [[-4.4, -3.1], [4.3, -2.9], [-4.4, 1.7]].forEach(([x, z]) => t.tree(land, x, z));
  addWalkers([[[0, 0.4], [0, 1.55]]]);
  // Fenced perimeter, a survey tripod and an entrance marker.
  for (let x = -4.5; x <= 4.5; x += 0.75) t.box(land, 'ivory', [0.05, 0.4, 0.05], [x, 0.25, -3.5]);
  t.box(land, 'trunk', [9, 0.035, 0.04], [0, 0.43, -3.5]);
  for (const dx of [-0.12, 0.12]) { const leg = t.box(land, 'metal', [0.025, 0.48, 0.025], [0.38 + dx, 0.3, -0.8]); leg.rotation.z = dx * 2; }
  t.box(land, 'green', [0.18, 0.12, 0.16], [0.38, 0.57, -0.8]);
  t.box(land, 'stone', [0.75, 0.35, 0.15], [-0.8, 0.25, 2.1]);
  cars.push({ x: 2.6 });
  }

  // Residential society: apartment buildings, a shared park, cars and residents.
  if (kind === 'society') {
    const society = district;
    buildings = new Group(); buildings.userData.rigid = true; society.add(buildings);
    for (const [x, z, height] of [[-3, -2.2, 2.7], [0, -2.2, 3.2], [3, -2.2, 2.7]]) {
      t.box(buildings, 'ivory', [1.85, height, 1.85], [x, height / 2 + 0.1, z]);
      t.box(buildings, 'stone', [2.08, 0.11, 2.08], [x, height + 0.16, z]);
      // Parapets, roof plant and side-facing window bays give every block depth.
      for(const dx of [-.94,.94]) t.box(buildings,'ivory',[.065,.18,1.98],[x+dx,height+.3,z]);
      for(const dz of [-.94,.94]) t.box(buildings,'ivory',[1.98,.18,.065],[x,height+.3,z+dz]);
      t.box(buildings,'metal',[.52,.22,.44],[x-.38,height+.32,z-.35]);
      // Black rooftop water tanks, a familiar sight on NCR apartment blocks.
      for(const dx of [.15,.5]) t.round(buildings,'dark',[.13,.2,.13],[x+dx,height+.315,z+.5]);
      for(let fin=0;fin<5;fin++)t.box(buildings,'dark',[.035,.018,.39],[x-.56+fin*.09,height+.44,z-.35],false);
      for(const side of [-1,1])for(let floor=0;floor<3;floor++)for(const dz of [-.46,.31]) {
        const y=.58+floor*(height-.5)/3;
        t.box(buildings,'dark',[.03,.48,.51],[x+side*.933,y,z+dz]);
        t.box(buildings,'glass',[.035,.4,.43],[x+side*.953,y,z+dz],false);
        t.box(buildings,'ivory',[.09,.035,.57],[x+side*.96,y-.25,z+dz]);
      }

      for (let floor = 0; floor < (compact ? 3 : 4); floor++) {
        t.box(buildings, 'glass', [1.52, 0.34, 0.045], [x, 0.55 + floor * (height - 0.5) / (compact ? 3 : 4), z + 0.95], false);
        t.box(buildings, 'stone', [2.02, 0.06, 0.34], [x, 0.34 + floor * (height - 0.5) / (compact ? 3 : 4), z + 1.03]);
        const balconyY = 0.53 + floor * (height - 0.5) / (compact ? 3 : 4);
        t.box(buildings, 'metal', [1.85, 0.025, 0.025], [x, balconyY, z + 1.2]);
        for (const dx of [-0.8, 0, 0.8]) t.box(buildings, 'metal', [0.025, 0.19, 0.025], [x + dx, balconyY - 0.09, z + 1.2], false);
        t.box(buildings, 'dark', [0.045, 0.34, 0.06], [x, balconyY + 0.02, z + 0.97], false);
      }
  }
  t.box(society, 'stone', [7.6, 0.05, 0.38], [0, 0.07, 0.1], false);
  t.box(society, 'stone', [0.4, 0.05, 2.25], [0, 0.07, 1.2], false);
  t.box(society, 'grass', [3.25, 0.08, 1.65], [-2, 0.09, 1.2], false);
  t.round(society, 'water', [0.52, 0.06, 0.38], [-2.2, 0.14, 1.2]);
  [[-3.6, 0.55], [-3.6, 1.9], [-0.65, 1.9], [4.3, -0.6], [4.3, 1.7]].forEach(([x, z]) => t.tree(society, x, z, 0.88));
  t.bench(society, -1, 0.5); t.bench(society, -2.8, 1.9, Math.PI);
  // Small play structure in the park's corner.
  for (const x of [1.1, 2.05]) t.box(society, 'trunk', [0.07, 0.85, 0.07], [x, 0.48, 0.95]);
  t.box(society, 'trunk', [1.12, 0.07, 0.09], [1.57, 0.94, 0.95]);
  swing = new Group(); swing.userData.rigid = true; swing.position.set(1.57, 0.94, 0.95); society.add(swing);
  t.box(swing, 'green', [0.34, 0.04, 0.24], [0, -0.6, 0]);
  for (const x of [-0.15, 0.15]) t.box(swing, 'dark', [0.015, 0.57, 0.015], [x, -0.3, 0], false);
  for (const x of [-3.8, 3.8]) { t.box(society, 'stone', [0.22, 0.6, 0.24], [x, 0.35, 2.25]); t.round(society, 'ivory', [0.14, 0.16, 0.14], [x, 0.72, 2.25]); }
  cars.push({ x: 2 });
  addWalkers([[[-2.8, 0.1], [-1.6, 0.1]], [[-0.6, 0.1], [0.6, 0.1]], [[1.3, 0.1], [2.6, 0.1]], [[0, 0.7], [0, 1.8]]]);
  cars.push({ x: -2.3 });

  }

  // Commercial frontage: offices, shop windows, plaza seating and pedestrians.
  if (kind === 'commercial') {
    const commercial = district;
    const offices = new Group(); commercial.add(offices);
    t.box(offices, 'dark', [2.5, 3.85, 2.25], [-2.9, 2.02, -1.85]);
    t.box(offices, 'glass', [2.4, 3.48, 0.055], [-2.9, 2.08, -0.69]);
    t.box(offices, 'glass', [0.055, 3.48, 2.12], [-1.62, 2.08, -1.85]);
    for (let floor = 0; floor < 5; floor++) t.box(offices, 'ivory', [2.62, 0.055, 2.38], [-2.9, 0.55 + floor * 0.76, -1.85]);
    t.box(offices, 'ivory', [2.78, 0.12, 2.53], [-2.9, 4.01, -1.85]);
    for (const x of [0.05, 1.65, 3.25]) {
      t.box(commercial, 'ivory', [1.5, 1.55, 2.1], [x, 0.88, -1.8]);
      t.box(commercial, 'glass', [1.23, 1.07, 0.055], [x, 0.76, -0.72]);
      t.box(commercial, 'green', [1.57, 0.12, 0.58], [x, 1.54, -0.53]);
      t.box(commercial, 'stone', [1.58, 0.12, 2.2], [x, 1.73, -1.8]);
      t.box(commercial, 'sand', [1.0, 0.18, 0.04], [x, 1.32, -0.68]);
      t.box(commercial, 'dark', [0.035, 1.05, 0.06], [x, 0.75, -0.68]);
      for (let stripe = 0; stripe < 5; stripe++) t.box(commercial, 'ivory', [0.12, 0.015, 0.58], [x - 0.6 + stripe * 0.3, 1.61, -0.53], false);
  }
  t.box(commercial, 'stone', [8.7, 0.06, 2.15], [0, 0.07, 0.72], false);
  for (const x of [-3.6, 0, 3.5]) { t.box(commercial, 'ivory', [0.8, 0.28, 0.72], [x, 0.23, 1.5]); t.tree(commercial, x, 1.5, 0.76); }
  for (const x of [0.7, 2.4]) {
    const seating = new Group(); seating.name = 'cafe-seating'; seating.userData.pedestrianObstacle = true; commercial.add(seating);
    t.round(seating, 'trunk', [0.28, 0.05, 0.28], [x, 0.42, 0.35]);
    t.round(seating, 'metal', [0.035, 0.35, 0.035], [x, 0.22, 0.35]);
    for (const z of [0, 0.7]) t.box(seating, 'green', [0.2, 0.25, 0.2], [x, 0.22, z]);
  }
  for (const x of [-3.65, -2.9, -2.15]) t.box(offices, 'ivory', [0.035, 3.48, 0.065], [x, 2.08, -0.65], false);
  t.bench(commercial, -1.5, 0.9); t.bench(commercial, 1.7, 1.5, Math.PI / 2);
  // Separate clear promenade segments keep pedestrians away from seating and planters.
  addWalkers([[[-3.5, 2.1], [-2.4, 2.1]], [[-1.9, 2.1], [-0.8, 2.1]], [[0.2, 2.1], [1.1, 2.1]], [[1.6, 2.1], [2.4, 2.1]], [[2.8, 2.1], [3.5, 2.1]]]);
  cars.push({ x: -2 });
  cars.push({ x: 2.1 });

  }

  const fleet = createFleet(t, district, cars.length, { offset: kind === 'land' ? 3 : kind === 'society' ? 0 : 6 });
  addDistrictDetails(t, district, kind, buildings);
  const life = createSceneLife(district, { compact, kind });
  function update(progress, reduced, seconds = 0) {
    const time = reduced ? 0 : seconds;
    const p = reduced ? 0.5 : clamp(progress);
    district.rotation.y = -0.17 + p * 0.37;
    if (buildings) buildings.scale.y = reduced ? 1 : 0.9 + smooth(p / 0.4) * 0.1;
    model.position.y = reduced ? 0 : Math.sin(p * Math.PI) * 0.15;
    for (let i = 0; i < cars.length; i++) {
      const phase = time * 0.22 + i * Math.PI + 0.6;
      fleet.place(i, reduced ? cars[i].x : Math.sin(phase) * 3.7, 0.11, reduced ? 3.05 : 3.05 + Math.cos(phase) * 0.22,
        reduced ? Math.PI / 2 : Math.atan2(3.7 * Math.cos(phase), -0.22 * Math.sin(phase)));
    }
    fleet.commit();
    if (swing) swing.rotation.x = reduced ? 0 : Math.sin(time * 1.8) * 0.27;
    t.animate(time, reduced); life.update(time, reduced);
    for (let i = 0; i < walkers.length; i++) {
      const walker = walkers[i];
      const phase = time * 0.38 + i * 1.3;
      const along = reduced ? 0.5 : (1 + Math.sin(phase)) / 2;
      const dx = walker.end[0] - walker.start[0], dz = walker.end[1] - walker.start[1];
      walker.object.position.x = walker.start[0] + dx * along;
      walker.object.position.z = walker.start[1] + dz * along;
      walker.object.rotation.y = Math.atan2(dx, dz) + (reduced ? 0 : (1 - Math.tanh(Math.cos(phase) * 8)) * Math.PI / 2);
    }
  }
  batchSceneMeshes(model);
  update(0, false);
  return { model, update, kind, dispose: () => disposeSpatialModel(model, t.resources) };
}

export function createKeys() {
  const t = createDetailKit(), model = new Group(), ring = new Group(); model.add(ring);
  const torus = new TorusGeometry(1, 0.055, 12, 64);
  const hangingKeys = [];
  const ringMesh = new Mesh(torus, t.materials.silver); ringMesh.position.y = 0.85; ring.add(ringMesh);
  function key(x, z, angle, material) {
    const g = new Group(); g.userData.rigid = true; g.position.set(x, 0.5, z); g.rotation.z = angle; ring.add(g);
    const head = new Mesh(torus, t.materials[material]); head.scale.setScalar(0.38); g.add(head);
    t.box(g, material, [0.24, 1.65, 0.13], [0, -1.1, 0]);
    t.box(g, material, [0.52, 0.17, 0.13], [0.14, -1.78, 0]);
    t.box(g, material, [0.42, 0.17, 0.13], [0.1, -1.4, 0]);
    t.box(g, 'dark', [0.045, 1.4, 0.005], [-0.055, -1.03, 0.071], false);
    t.box(g, material, [0.42, 0.11, 0.13], [0.1, -1.58, 0]);
    hangingKeys.push({ object: g, angle });
  }
  key(-0.43, 0.1, -0.33, 'silver'); key(0.44, -0.16, 0.3, 'metal');
  const shape = new Shape(); shape.moveTo(-0.55, 0.1); shape.lineTo(0, 0.62); shape.lineTo(0.55, 0.1); shape.lineTo(0.55, -0.62); shape.lineTo(-0.55, -0.62); shape.closePath();
  const fob = new Mesh(new ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.035, bevelThickness: 0.025 }), t.materials.green);
  fob.position.set(0.06, 0.36, 0.22); ring.add(fob);
  t.box(ring, 'ivory', [0.2, 0.33, 0.03], [0.06, 0.08, 0.41], false);
  function update(progress, reduced, seconds = 0, jiggle = 0) {
    const time = reduced ? 0 : seconds;
    const p = reduced ? 0.45 : clamp(progress);
    model.rotation.set(-0.16 + p * 0.2, -0.45 + p * 0.9 + Math.sin(time * 0.45) * 0.16, -0.12 + p * 0.2);
    hangingKeys.forEach(({ object, angle }, i) => { object.rotation.z = angle + (reduced ? 0 : Math.sin(time * 1.3 + i) * 0.09 + jiggle * (i ? -0.7 : 1)); });
    model.position.set(0, reduced ? 0 : (p - 0.5) * 0.32 + Math.sin(time * 0.8) * 0.08, 0);
  }
  update(0.45, true);
  return { model, update, kind: 'keys', dispose: () => disposeSpatialModel(model, t.resources) };
}
