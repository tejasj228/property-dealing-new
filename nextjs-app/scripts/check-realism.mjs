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
      if (material.userData.realism === 'window') assert.match(shader.fragmentShader, /totalEmissiveRadiance \*= rlRoom/);
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
    const city = createCity({ compact }), matrix = new Matrix4(), position = new Vector3(), next = new Vector3();
    const body = city.model.getObjectByName('traffic').children.find(mesh => mesh.material.name === 'vehicle-paint' && mesh.geometry.type === 'BufferGeometry');
    assert.ok(city.movingCars >= 5 && body.count >= city.movingCars + 6);
    for (const time of [0, 7, 31, 90]) {
      city.update(.5, false, time);
      for (let i = 0; i < body.count; i++) {
        body.getMatrixAt(i, matrix); position.setFromMatrixPosition(matrix);
        if (i < city.movingCars) {
          if (matrix.getMaxScaleOnAxis() < .05) continue; // fading in at a junction
          assert.equal(clearOfRoads(position.x, position.z, 0, city.roadCorridors), false, `car ${i} on a road at ${time}s`);
          assert.ok(!clearOfRoads(position.x, position.z, .02, city.roadCorridors.slice(0, 1)) || !clearOfRoads(position.x, position.z, .02, city.roadCorridors.slice(1, 3)));
        } else assert.ok(clearOfRoads(position.x, position.z, .12, city.roadCorridors), `parked car ${i} clear of streets`);
      }
    }
    // Keep-left: a car's lateral offset from its ring centreline is to the left of travel.
    city.update(.5, false, 12);
    const ring = city.roadCorridors[0].points;
    for (let i = 0; i < Math.min(city.movingCars, compact ? 3 : 6); i++) {
      body.getMatrixAt(i, matrix); position.setFromMatrixPosition(matrix);
      const forward = new Vector3(0, 0, 1).transformDirection(matrix);
      let nearest = 0; ring.forEach((p, j) => { if (p.distanceToSquared(position) < ring[nearest].distanceToSquared(position)) nearest = j; });
      next.copy(position).sub(ring[nearest]);
      const left = new Vector3(forward.z, 0, -forward.x);
      assert.ok(next.dot(left) > .08, `car ${i} keeps left`);
    }
    city.dispose();
  }
});

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
  assert.ok(triangles < 150000, `city triangles ${triangles}`);
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
