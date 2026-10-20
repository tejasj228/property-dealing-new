import test from 'node:test';
import assert from 'node:assert/strict';
import { Color, Group, Matrix4, Scene, ShaderLib, Vector3 } from 'three';
import { createCity } from '../components/landing/city-model.mjs';
import { createArchitecture, scenePose } from '../components/landing/architecture.mjs';
import { createDistrict, createKeys } from '../components/landing/spatial-models.mjs';
import { createContactOffice } from '../components/landing/contact-office.mjs';
import { createPropertyMapModel } from '../components/landing/property-map-model.mjs';
import { createSceneLighting } from '../components/landing/scene-lighting.mjs';
import { applySurfaceRealism } from '../components/landing/surface-realism.mjs';
import { createDetailKit } from '../components/landing/scene-details.mjs';
import { createFleet } from '../components/landing/vehicle-fleet.mjs';
import { clearOfRoads } from '../components/landing/road-clearance.mjs';

const builds = {
  city: () => createCity(), house: () => createArchitecture(), land: () => createDistrict({ kind: 'land' }),
  society: () => createDistrict({ kind: 'society' }), commercial: () => createDistrict({ kind: 'commercial' }),
  keys: () => createKeys(), office: () => createContactOffice(), map: () => createPropertyMapModel([{ id: '1' }, { id: '2', propertyType: 'commercial' }]),
};
const draws = model => { let count = 0; model.traverse(o => { if (o.isMesh && o.material.visible !== false) count++; }); return count; };

test('every scene material receives the shared realism shading and restores it on dispose', () => {
  for (const [kind, build] of Object.entries(builds)) {
    const illustration = build(), scene = new Scene(); scene.add(illustration.model);
    const lighting = createSceneLighting(scene, illustration.model, {}, { kind });
    const profiles = new Set();
    illustration.model.traverse(o => {
      const material = o.material;
      if (!material?.isMeshStandardMaterial || material.name === 'soft-cloud') return;
      assert.ok(material.userData.realism, `${kind} ${material.name} is shaded`);
      profiles.add(material.userData.realism);
      // Run the real three.js shader sources through the hook so the chunk anchors exist.
      const shader = { uniforms: {}, vertexShader: ShaderLib.physical.vertexShader, fragmentShader: ShaderLib.physical.fragmentShader };
      material.onBeforeCompile(shader, {});
      assert.match(shader.vertexShader, /vRlScene = \( rlToScene \* rlLocal \)\.xyz/);
      assert.match(shader.fragmentShader, /reflectedLight\.indirectDiffuse \*= rl/);
      assert.ok(shader.uniforms.rlSceneInverse && shader.uniforms.rlGround);
      if (material.userData.realism === 'window') { assert.match(shader.fragmentShader, /totalEmissiveRadiance = emissive \* rlRoom/); assert.match(shader.fragmentShader, /rlFrame/); }
      if (material.userData.realism === 'water') assert.match(shader.fragmentShader, /rlRipple/);
      if (material.userData.blink) assert.match(shader.fragmentShader, /rlFlash/);
      assert.match(shader.fragmentShader, /rlCloud/);
      if (material.userData.realism === 'surface') assert.match(shader.vertexShader, /vNormalMapUv = rlUv/);
      assert.match(material.customProgramCacheKey(), /realism-/);
    });
    if (['city', 'society', 'commercial'].includes(kind)) assert.ok(profiles.has('window') && profiles.has('leaf'), `${kind} profiles ${[...profiles]}`);
    scene.onBeforeRender(); // updates the model-space matrix without throwing
    lighting.dispose();
    assert.equal(scene.fog, null);
    illustration.model.traverse(o => { if (o.material?.isMeshStandardMaterial && o.material.name !== 'soft-cloud') assert.equal(o.material.userData.realism, undefined); });
    illustration.dispose();
  }
});

test('model-space shading follows the model, not the camera or the drag rotation', () => {
  const model = new Group(), kit = createDetailKit(); kit.box(model, 'stone', [1, 1, 1], [0, .5, 0]);
  const realism = applySurfaceRealism(model, { ground: .1 });
  model.rotation.set(.18, .9, 0); model.position.set(2, 1, -3); model.scale.setScalar(.96); model.updateMatrixWorld(true);
  realism.update();
  const local = new Vector3(.3, .2, -.1), world = local.clone().applyMatrix4(model.matrixWorld);
  assert.ok(world.applyMatrix4(realism.uniforms.rlSceneInverse.value).distanceTo(local) < 1e-6);
  realism.dispose(); kit.resources.geometries.forEach(g => g.dispose()); kit.resources.materials.forEach(m => m.dispose());
});

test('instanced fleets keep draw calls constant while every car gets its own paint and pose', () => {
  const counts = [1, 4, 16].map(count => {
    const kit = createDetailKit(), root = new Group(), fleet = createFleet(kit, root, count);
    for (let i = 0; i < count; i++) fleet.place(i, i, .1, -i, i * .3, .5);
    fleet.commit();
    const body = root.getObjectByName('traffic').children.find(mesh => mesh.material.name === 'vehicle-paint' && mesh.count === count);
    const colours = new Set(), matrix = new Matrix4(), position = new Vector3(), colour = new Color();
    for (let i = 0; i < count; i++) { body.getColorAt(i, colour); colours.add(colour.getHexString()); body.getMatrixAt(i, matrix); position.setFromMatrixPosition(matrix); assert.ok(position.distanceTo(new Vector3(i, .1, -i)) < 1e-6); }
    assert.equal(colours.size, Math.min(count, 10));
    const glows = root.getObjectByName('traffic').children.filter(mesh => mesh.userData.nightOnly);
    assert.equal(glows.length, 1); assert.equal(glows[0].count, count * 2); assert.equal(glows[0].visible, false);
    const total = draws(root);
    root.traverse(o => { if (o.isInstancedMesh) o.dispose(); }); kit.resources.geometries.forEach(g => g.dispose()); kit.resources.materials.forEach(m => m.dispose());
    return total;
  });
  assert.equal(new Set(counts).size, 1, `fleet draws ${counts}`);
});

test('city traffic drives in the left lane of real roads and parked cars stay off the carriageway', () => {
  for (const compact of [false, true]) {
    const city = createCity({ compact }), matrix = new Matrix4(), position = new Vector3();
    // The first part of each fleet (its painted or liveried body) gives every vehicle's pose.
    const fleets = {};
    for (const group of city.model.children[0].children.filter(o => o.name.startsWith('traffic'))) fleets[group.name === 'traffic' ? 'hatch' : group.name.slice(8)] = group.children[0];
    assert.deepEqual(Object.keys(fleets).sort(), ['bus', 'hatch', 'rickshaw', 'suv']);
    assert.ok(city.movingCars >= 9 && city.parkedSlots.count >= 6);
    for (const time of [0, 7, 31, 90]) {
      city.update(.5, false, time);
      for (const { type, slot } of city.traffic) {
        const mesh = fleets[type], perCar = mesh.count / countOf(city, type);
        mesh.getMatrixAt(slot * perCar, matrix); position.setFromMatrixPosition(matrix);
        if (matrix.getMaxScaleOnAxis() < .05) continue; // fading in at a junction
        assert.equal(clearOfRoads(position.x, position.z, 0, city.roadCorridors), false, `${type} ${slot} on a road at ${time}s`);
      }
      const hatch = fleets.hatch, perCar = hatch.count / countOf(city, 'hatch');
      for (let i = 0; i < city.parkedSlots.count; i++) {
        hatch.getMatrixAt((city.parkedSlots.first + i) * perCar, matrix); position.setFromMatrixPosition(matrix);
        assert.ok(clearOfRoads(position.x, position.z, .12, city.roadCorridors), `parked car ${i} clear of streets`);
      }
    }
    // Keep-left: a vehicle's offset from the ring centreline is to the left of travel.
    city.update(.5, false, 12);
    const ring = city.roadCorridors[0].points;
    for (const { type, slot } of city.traffic.filter((_, i) => i < (compact ? 5 : 10))) {
      const mesh = fleets[type], perCar = mesh.count / countOf(city, type);
      mesh.getMatrixAt(slot * perCar, matrix); position.setFromMatrixPosition(matrix);
      const forward = new Vector3(0, 0, 1).transformDirection(matrix);
      let nearest = 0; ring.forEach((p, j) => { if (p.distanceToSquared(position) < ring[nearest].distanceToSquared(position)) nearest = j; });
      const offset = position.clone().sub(ring[nearest]), left = new Vector3(forward.z, 0, -forward.x);
      assert.ok(offset.dot(left) > .08, `${type} ${slot} keeps left`);
    }
    city.dispose();
  }
});
const countOf = (city, type) => city.traffic.filter(car => car.type === type).length + (type === city.parkedSlots.type ? city.parkedSlots.count : 0);

test('frame batching merges static parts while moving storeys, swings, keys and doors keep their meshes', () => {
  const house = createArchitecture();
  let upper = 0; house.upperFloor.traverse(o => { if (o.isMesh) upper++; });
  assert.ok(upper > 3);
  const before = new Vector3(), after = new Vector3();
  const sample = house.upperFloor.children.find(o => o.isMesh);
  house.model.updateMatrixWorld(true); sample.getWorldPosition(before);
  house.upperFloor.position.y = scenePose(1).lift; house.model.updateMatrixWorld(true); sample.getWorldPosition(after);
  assert.ok(after.y - before.y > .6);
  house.dispose();
  const society = createDistrict({ kind: 'society' }), district = society.model.children[0];
  assert.equal(district.userData.rigid, true);
  let rigidGroups = 0; district.traverse(o => { if (o !== district && o.userData.rigid && o.children.some(c => c.isMesh)) rigidGroups++; });
  assert.ok(rigidGroups >= 2, 'buildings and swing keep their own meshes');
  society.dispose();
  const keys = createKeys(); let swinging = 0; keys.model.traverse(o => { if (o.userData.rigid && o.children.some(c => c.isMesh)) swinging++; });
  assert.equal(swinging, 2); keys.dispose();
  const office = createContactOffice(), door = office.model.getObjectByName('office-door');
  assert.ok(door.children.some(c => c.isMesh)); office.dispose();
});

test('city blocks vary in facade tone and the hero stays within its draw and triangle budget', () => {
  const city = createCity(), tones = new Set();
  let triangles = 0;
  city.model.traverse(o => {
    if (o.isInstancedMesh && o.instanceColor && o.material.name === 'ivory') for (let i = 0; i < o.count; i++) { const c = new Color(); o.getColorAt(i, c); tones.add(c.getHexString()); }
    if (o.isMesh && o.material.visible !== false) triangles += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
  });
  assert.ok(tones.size >= 4, `facade tones ${tones.size}`);
  assert.ok(draws(city.model) < 180, `city draws ${draws(city.model)}`);
  assert.ok(triangles < 170000, `city triangles ${triangles}`);
  city.dispose();
});

test('soft shadows have a penumbra radius, a lower sun and theme-aware haze', () => {
  for (const kind of ['city', 'house', 'society']) {
    const illustration = builds[kind](), scene = new Scene(); scene.add(illustration.model);
    const lighting = createSceneLighting(scene, illustration.model, {}, { kind });
    const sun = scene.children.find(o => o.isDirectionalLight);
    assert.ok(sun.shadow.radius >= 2.5);
    const elevation = Math.atan2(sun.position.y, Math.hypot(sun.position.x, sun.position.z));
    assert.ok(elevation < .85 && elevation > .6, `${kind} sun elevation ${elevation}`);
    assert.ok(scene.fog.far > scene.fog.near);
    lighting.setNight(true); assert.notEqual(scene.fog.color.getHexString(), 'e7e1d1');
    lighting.dispose(); illustration.dispose();
  }
});

const { compileScene } = await import('../components/landing/render-policy.mjs');
test('parallel shader compilation resumes rendering even if readiness never resolves', async () => {
  const started = Date.now();
  await compileScene({ compileAsync: () => new Promise(() => {}) }, null, null, 40);
  assert.ok(Date.now() - started < 1000);
  await compileScene({ compileAsync: () => Promise.reject(new Error('lost')) }, null, null, 40);
  await compileScene({ compileAsync: () => { throw new Error('context lost'); } }, null, null, 40);
  await compileScene({}, null, null);
});

test('city trees merge into one leaf and one branch draw with per-leaf crown data', () => {
  const city = createCity(), leaves = [], branches = [];
  let markers = 0;
  city.model.traverse(o => { if (o.name === 'forest-leaves') leaves.push(o); if (o.name === 'forest-branches') branches.push(o); if (o.name === 'botanical-tree') markers++; });
  assert.equal(leaves.length, 1); assert.equal(branches.length, 1);
  assert.ok(markers >= 60, `city trees ${markers}`);
  assert.equal(leaves[0].count % markers, 0);
  assert.equal(leaves[0].geometry.getAttribute('rlCrown').count, leaves[0].instanceMatrix.count);
  assert.equal(leaves[0].material.defines.RL_FOREST, 1);
  city.dispose();
});

test('pedestrians keep to the pavements and every working machine is bounded and freezes', () => {
  const city = createCity(), matrix = new Matrix4(), position = new Vector3();
  const crowd = city.model.getObjectByName('pedestrians');
  for (const time of [0, 13, 61]) {
    city.update(.5, false, time);
    for (let i = 0; i < crowd.count; i++) {
      crowd.getMatrixAt(i, matrix); position.setFromMatrixPosition(matrix);
      // Walkers follow kerbs (ring, ring, cross street, cross street); they may cross side streets at junctions.
      const own = city.roadCorridors[[0, 0, 1, 2][i % 4]];
      assert.ok(clearOfRoads(position.x, position.z, 0, [own]), `pedestrian ${i} beside, not on, its road at ${time}s`);
    }
  }
  const jib = city.model.getObjectByName('crane-jib'), snapshot = () => { city.model.updateMatrixWorld(true); return jib.matrixWorld.elements.slice(); };
  city.update(.5, true, 0); const still = snapshot(); city.update(.5, true, 40); assert.deepEqual(snapshot(), still);
  city.update(.5, false, 40); assert.notDeepEqual(snapshot(), still);
  city.dispose();
  const land = createDistrict({ kind: 'land' }), excavator = land.model.getObjectByName('excavator');
  const pose = () => { const p = []; excavator.traverse(o => p.push(o.rotation.x, o.rotation.y)); return p; };
  land.update(.5, true, 0); const rest = pose(); land.update(.5, true, 7); assert.deepEqual(pose(), rest);
  land.update(.5, false, 3); assert.notDeepEqual(pose(), rest);
  land.dispose();
});

test('real HDR skies ship small, valid and with matching sizes for both themes', async () => {
  const fs = await import('node:fs');
  const { HDRLoader } = await import('three/addons/loaders/HDRLoader.js');
  const sizes = [];
  for (const name of ['autumn-sky', 'night-sky']) {
    const file = new URL(`../public/textures/pbr/${name}.hdr`, import.meta.url), bytes = fs.readFileSync(file);
    assert.ok(bytes.length < 600000, `${name} ${bytes.length} bytes`);
    const parsed = new HDRLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length));
    sizes.push(`${parsed.width}x${parsed.height}`);
  }
  assert.equal(sizes[0], sizes[1]);
});
