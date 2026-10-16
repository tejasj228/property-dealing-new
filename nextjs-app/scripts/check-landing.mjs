import test from 'node:test';
import { createPropertyMapModel, framePropertyMapCamera, layoutProperties } from '../components/landing/property-map-model.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Matrix4, OrthographicCamera, Vector3 } from 'three';
import { createArchitecture, createSceneCamera, frameSceneCamera, scenePose } from '../components/landing/architecture.mjs';
import { createDistrict, createKeys, createSpatialCamera, frameSpatialCamera } from '../components/landing/spatial-models.mjs';

function assertFits(object, camera, message) {
  if (!object.isMesh || object.name === 'contact-shadow') return;
  const positions = object.geometry.attributes.position;
  for (let instance = 0; instance < (object.isInstancedMesh ? object.count : 1); instance++) {
    const matrix = new Matrix4();
    if (object.isInstancedMesh) { object.getMatrixAt(instance, matrix); matrix.premultiply(object.matrixWorld); }
    else matrix.copy(object.matrixWorld);
    for (let vertex = 0; vertex < positions.count; vertex++) {
      const point = new Vector3().fromBufferAttribute(positions, vertex).applyMatrix4(matrix).project(camera);
      assert.ok(Math.abs(point.x) < 0.98 && Math.abs(point.y) < 0.98, message + ' x=' + point.x.toFixed(3) + ' y=' + point.y.toFixed(3));
    }
  }
}

test('each property section keeps its own setting throughout scrolling and reduced motion', () => {
  for (const kind of ['land', 'society', 'commercial']) {
    const illustration = createDistrict({ kind });
    assert.equal(illustration.model.children.length, 1);
    const setting = illustration.model.children[0];
    assert.equal(setting.name, kind);
    let staticPose;
    for (const progress of [0, 0.3, 0.6, 1]) {
      illustration.update(progress, false);
      assert.equal(setting.visible, true);
      assert.equal(setting.position.x, 0);
      illustration.update(progress, true, progress * 30);
      illustration.model.updateMatrixWorld(true);
      const pose = [];
      illustration.model.traverse(object => pose.push(...object.matrixWorld.elements));
      if (staticPose) assert.deepEqual(pose, staticPose);
      staticPose = pose;
    }
    illustration.dispose();
  }
});

test('additional property scenes fit their frames throughout scrolling at desktop and mobile ratios', () => {
  for (const kind of ['land', 'society', 'commercial', 'keys']) for (const compact of [false, true]) {
    const illustration = kind === 'keys' ? createKeys() : createDistrict({ compact, kind });
    const camera = createSpatialCamera(kind);
    for (const aspect of [0.8, 0.95, 1.15, 1.4, 1.8]) {
      frameSpatialCamera(camera, 1000 * aspect, 1000, kind);
      for (const progress of [0, 0.5, 1]) for (const seconds of [0, 3, 9, 18]) {
        illustration.update(progress, false, seconds); illustration.model.updateMatrixWorld(true);
        illustration.model.traverseVisible(object => assertFits(object, camera, `${kind} must fit`));
      }
    }
    illustration.dispose();
  }
});

test('additional scenes release shared resources exactly once', () => {
  for (const illustration of [...['land', 'society', 'commercial'].flatMap(kind => [createDistrict({ kind }), createDistrict({ kind, compact: true })]), createKeys()]) {
    const resources = new Set();
    illustration.model.traverse(object => {
      if (object.geometry) resources.add(object.geometry);
      if (object.material) resources.add(object.material);
      if (object.isInstancedMesh) resources.add(object);
    });
    let count = 0;
    for (const resource of resources) resource.addEventListener('dispose', () => count++);
    illustration.dispose(); assert.equal(count, resources.size);
  }
});

test('motion stays bounded, and reduced motion stays completely static', () => {
  assert.deepEqual(scenePose(-3), scenePose(0));
  assert.deepEqual(scenePose(3), scenePose(1));
  for (const progress of [0, 0.1, 0.5, 0.9, 1]) {
    assert.deepEqual(scenePose(progress, true), scenePose(0));
    const pose = scenePose(progress);
    assert.ok(pose.lift >= 0 && pose.lift <= 0.64);
    assert.ok(Object.values(pose).every(Number.isFinite));
  }
});

test('architectural geometry fits desktop and mobile camera frames throughout the scroll', () => {
  for (const compact of [false, true]) {
    const architecture = createArchitecture({ compact });
    const camera = createSceneCamera();
    for (const aspect of [0.95, 1.15, 1.4, 1.8]) {
      frameSceneCamera(camera, 1000 * aspect, 1000);
      for (const progress of [0, 0.5, 1]) for (const seconds of [0, 3, 9, 18]) {
        architecture.animate(seconds, false);
        const pose = scenePose(progress);
        architecture.model.rotation.y = pose.rotation;
        architecture.model.scale.setScalar(pose.scale);
        architecture.upperFloor.position.y = pose.lift;
        architecture.roof.position.y = pose.roofLift;
        architecture.model.updateMatrixWorld(true);
        architecture.model.traverse(object => assertFits(object, camera, 'Hero must fit'));
      }
    }
    architecture.dispose();
  }
});

test('every allocated model geometry, material and texture is disposed', () => {
  const architecture = createArchitecture();
  const resources = new Set();
  architecture.model.traverse(object => {
    if (object.geometry) resources.add(object.geometry);
    if (object.material) { resources.add(object.material); if (object.material.map) resources.add(object.material.map); }
    if (object.isInstancedMesh) resources.add(object);
  });
  let disposed = 0;
  for (const resource of resources) resource.addEventListener('dispose', () => disposed++);
  architecture.dispose();
  assert.equal(disposed, resources.size);
});

const loaderSource = fs.readFileSync(new URL('../lib/landing-data.js', import.meta.url), 'utf8').replace("import 'server-only';", '');
const loaderUrl = 'data:text/javascript;base64,' + Buffer.from(loaderSource).toString('base64');
const { getLandingData, getLandingProperties } = await import(loaderUrl);

async function withPublicApi(responses, callback) {
  const originalFetch = globalThis.fetch;
  const originalSource = process.env.LANDING_CONTENT_API_URL;
  process.env.LANDING_CONTENT_API_URL = 'https://public.example/api';
  globalThis.fetch = async (url, options) => {
    assert.equal(options.method || 'GET', 'GET');
    const response = responses[new URL(url).pathname];
    if (response instanceof Error) throw response;
    return { ok: true, json: async () => response };
  };
  try { await callback(); }
  finally { globalThis.fetch = originalFetch; if (originalSource === undefined) delete process.env.LANDING_CONTENT_API_URL; else process.env.LANDING_CONTENT_API_URL = originalSource; }
}

test('partial upstream failure preserves real area content without inventing listings', async () => {
  await withPublicApi({
    '/api/areas': { success: true, data: { real: { name: 'Actual area', subAreas: [{ id: 12, title: 'Actual sector', societies: [] }] } } },
    '/api/properties': new Error('Unavailable'),
  }, async () => {
    const result = await getLandingData();
    assert.equal(result.areas[0].subAreas[0].id, 12);
    assert.deepEqual(result.properties, []);
    assert.deepEqual(result.available, { areas: true, properties: false });
  });
});

test('complete upstream failure returns honest empty states without exposing server values', async () => {
  await withPublicApi({ '/api/areas': new Error('Private failure details'), '/api/properties': new Error('Private failure details') }, async () => {
    const result = await getLandingData();
    assert.deepEqual(result, { areas: [], properties: [], available: { areas: false, properties: false } });
    assert.ok(!JSON.stringify(result).includes('Private failure details'));
  });
});


test('ambient motion continues at fixed scroll and reduced motion freezes every model', () => {
  const illustrations = [createArchitecture(), createKeys(), ...['land', 'society', 'commercial'].map(kind => createDistrict({ kind }))];
  function snapshot(illustration, seconds, reduced) {
    if (illustration.animate) illustration.animate(seconds, reduced);
    else illustration.update(0.5, reduced, seconds);
    illustration.model.updateMatrixWorld(true);
    const values = [];
    illustration.model.traverse(object => {
      values.push(...object.matrixWorld.elements);
      if (object.isInstancedMesh) values.push(...object.instanceMatrix.array);
    });
    return values;
  }
  for (const illustration of illustrations) {
    assert.notDeepEqual(snapshot(illustration, 0, false), snapshot(illustration, 3, false));
    assert.deepEqual(snapshot(illustration, 0, true), snapshot(illustration, 20, true));
    assert.deepEqual(snapshot(illustration, 3, false), snapshot(illustration, 3, false));
    illustration.dispose();
  }
});

test('map fits growing inventory inside the same desktop and mobile frame', () => {
  for (const count of [0, 1, 2, 3, 7, 18, 35, 100, 250]) {
    const properties = Array.from({ length: count }, (_, i) => ({ id: String(i), propertyType: i % 2 ? 'commercial' : 'residential' }));
    const layout = layoutProperties(properties);
    assert.equal(new Set(layout.map(p => p.id)).size, count);
    assert.equal(new Set(layout.map(p => p.x + ',' + p.z)).size, count);
    assert.deepEqual(layout, layoutProperties(properties.map(p => ({ ...p, title: 'Edited title' }))));
    if (count >= 18) {
      assert.equal(new Set(layout.map(p => p.shape)).size, 5);
      assert.ok(new Set(layout.map(p => p.scaleX)).size > 10);
      assert.ok(new Set(layout.map(p => p.rotation)).size > 10);
    }
    const map = createPropertyMapModel(properties, true), camera = new OrthographicCamera(-14, 14, 10, -10, .1, 300);
    for (const [width, height] of [[390, 520], [960, 640], [1296, 640]]) for (const angle of [-.55, .16, .55]) {
      framePropertyMapCamera(camera, width, height, map.bounds, angle, 1);
      for (const marker of map.markerPositions) {
        const p = marker.position.clone().project(camera), x = (p.x + 1) * width / 2, y = (1 - p.y) * height / 2;
        assert.ok(x > 24 && x < width - 24 && y > 36 && y < height - 24, `Marker stays in fixed frame: count=${count}, width=${width}`);
      }
      map.model.updateMatrixWorld(true);
      map.model.traverse(object => assertFits(object, camera, `Scenery fits fixed frame: count=${count}, width=${width}`));
    }
    const resources = new Set();
    map.model.traverse(object => { if (object.geometry) resources.add(object.geometry); if (object.material) resources.add(object.material); });
    let disposed = 0; resources.forEach(resource => resource.addEventListener('dispose', () => disposed++));
    map.dispose(); assert.equal(disposed, resources.size);
  }
});

test('map mixes residential buildings, open land and shops without inventing listing markers', () => {
  const properties = [
    { id:'home', title:'Residential villa', propertyType:'residential' },
    { id:'land', title:'Open plot', propertyType:'residential' },
    { id:'shop', title:'Commercial space', propertyType:'commercial' },
  ];
  const map = createPropertyMapModel(properties, true);
  assert.deepEqual(map.structures, [{id:'home',kind:'building'},{id:'land',kind:'plot'},{id:'shop',kind:'commercial'}]);
  assert.deepEqual(map.markerPositions.map(marker=>marker.id), properties.map(property=>property.id));
  assert.ok(map.markerPositions[0].position.y > map.markerPositions[1].position.y, 'Building marker clears its roof');
  assert.ok(map.markerPositions[2].position.y > map.markerPositions[1].position.y, 'Shop marker clears its roof');
  assert.ok(map.model.getObjectByName('map-building'));
  assert.ok(map.model.getObjectByName('map-commercial'));
  map.dispose();
});

test('fresh property feed includes additions beyond four and excludes inactive records', async () => {
  const records = Array.from({ length: 9 }, (_, i) => ({ _id: String(i), title: 'Published ' + i, isActive: i !== 8, propertyType: i % 2 ? 'commercial' : 'residential' }));
  await withPublicApi({ '/api/properties': { success: true, data: records } }, async () => {
    const first = await getLandingProperties(); assert.equal(first.length, 8);
    records.push({ _id: 'new', title: 'Newly published', propertyType: 'residential' });
    const updated = await getLandingProperties(); assert.equal(updated.length, 9); assert.equal(updated.at(-1).id, 'new');
    records[0].isActive = false;
    assert.equal((await getLandingProperties()).some(property => property.id === '0'), false);
  });
});

// Theme and interaction checks do not require a browser or GPU.
const { Scene } = await import('three');
const { createSceneLighting } = await import('../components/landing/scene-lighting.mjs');
const { publicContentPath } = await import('../lib/public-content-path.mjs');

test('day/night lighting follows every scene and restores original materials', () => {
  for (const kind of ['house', 'land', 'society', 'commercial', 'keys', 'map']) {
    const illustration = kind === 'house' ? createArchitecture() : kind === 'keys' ? createKeys() : kind === 'map' ? createPropertyMapModel([{ id: '1', propertyType: 'residential' }]) : createDistrict({ kind });
    const scene = new Scene(), renderer = {}; scene.add(illustration.model);
    const before = new Map();
    illustration.model.traverse(o => { if (o.material?.isMeshStandardMaterial) before.set(o.material, { color: o.material.color.getHex(), emissive: o.material.emissive.getHex(), intensity: o.material.emissiveIntensity }); });
    const lighting = createSceneLighting(scene, illustration.model, renderer, { kind });
    lighting.setNight(true); assert.equal(scene.getObjectByName('night-sky'), undefined); assert.equal(renderer.toneMappingExposure, 1.12);
    illustration.model.traverse(o => { if (o.name === 'drifting-cloud') assert.equal(o.visible, true); if (o.userData.nightOnly) assert.equal(o.visible, true); if (o.material?.userData.nightWindow) assert.ok(o.material.emissiveIntensity > 0); });
    lighting.setNight(false); assert.equal(scene.getObjectByName('night-sky'), undefined);
    for (const [material, initial] of before) assert.deepEqual({ color: material.color.getHex(), emissive: material.emissive.getHex(), intensity: material.emissiveIntensity }, initial);
    illustration.model.traverse(o => { if (o.name === 'drifting-cloud') assert.equal(o.visible, true); });
    lighting.dispose(); assert.equal(scene.children.length, 1); illustration.dispose();
  }
});

test('clouds and lit details fit the house and district frames at mobile and desktop ratios', () => {
  for (const kind of ['house', 'land', 'society', 'commercial']) {
    const illustration = kind === 'house' ? createArchitecture() : createDistrict({ kind });
    const scene = new Scene(), camera = kind === 'house' ? createSceneCamera() : createSpatialCamera(kind);
    scene.add(illustration.model);
    const lighting = createSceneLighting(scene, illustration.model, {}, { kind }); lighting.setNight(true);
    for (const aspect of [0.8, 1.15, 1.8]) {
      if (kind === 'house') frameSceneCamera(camera, aspect * 1000, 1000); else frameSpatialCamera(camera, aspect * 1000, 1000, kind);
      if (kind === 'house') illustration.model.rotation.y = scenePose(0).rotation;
      scene.updateMatrixWorld(true);
      illustration.model.traverseVisible(o => assertFits(o, camera, `${kind} night details must fit`));
    }
    lighting.dispose(); illustration.dispose();
  }
});

test('keys reset their position each frame and remain inside the frame when dragged', () => {
  const keys = createKeys(), camera = createSpatialCamera('keys');
  const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0), up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  for (const aspect of [0.8, 0.95, 1.4, 1.8]) {
    frameSpatialCamera(camera, aspect * 1000, 1000, 'keys');
    for (const x of [-0.65, 0, 0.65]) for (const y of [-0.35, 0.35]) for (const p of [0, 0.5, 1]) for (const time of [0, 3, 9, 18]) {
      keys.update(p, false, time, 0.24);
      keys.model.rotation.z += 0.24 * 0.25;
      keys.model.position.addScaledVector(right, x).addScaledVector(up, y); keys.model.rotation.y += x * 0.28; keys.model.updateMatrixWorld(true);
      keys.model.traverse(o => assertFits(o, camera, 'Dragged keys must fit'));
      keys.update(p, false, time); assert.equal(keys.model.position.x, 0); assert.equal(keys.model.position.z, 0);
    }
  }
  keys.dispose();
});

test('hero has no cars or people; map has no people and includes animated planting', () => {
  const house = createArchitecture(), map = createPropertyMapModel([{ id: '1', propertyType: 'residential' }]);
  assert.equal(house.model.getObjectByName('car'), undefined); assert.equal(house.model.getObjectByName('person'), undefined);
  assert.equal(map.model.getObjectByName('person'), undefined); assert.ok(map.model.getObjectByName('car'));
  const grass = map.model.getObjectByName('map-grass'); assert.ok(grass.count > 0);
  map.update(1, false); const first = Array.from(grass.instanceMatrix.array); map.update(4, false); assert.notDeepEqual(Array.from(grass.instanceMatrix.array), first);
  map.update(1, true); const still = Array.from(grass.instanceMatrix.array); map.update(4, true); assert.deepEqual(Array.from(grass.instanceMatrix.array), still);
  let trees = 0; map.model.traverse(o => { if (o.name === 'tree-crown') trees++; }); assert.ok(trees >= 16);
  house.dispose(); map.dispose();
});

test('public content source accepts only public read paths and known filters', () => {
  assert.equal(publicContentPath('/areas'), '/areas');
  assert.equal(publicContentPath('/properties?area=yamuna-expressway&propertyType=commercial&active=false'), '/properties?area=yamuna-expressway&propertyType=commercial');
  assert.equal(publicContentPath('/societies/yamuna-expressway/12'), '/societies/yamuna-expressway/12');
  for (const path of ['/contacts', '/auth/me', 'https://other.example/areas', '//other.example/areas', '/areas/../contacts', '/areas/%2e%2e', '/properties/reorder', null]) assert.equal(publicContentPath(path), null);
});

const { createKeySpring } = await import('../components/landing/key-spring.mjs');
test('key spring overshoots, jiggles and settles independently of frame rate', () => {
  const finalStates = [];
  for (const fps of [30, 60, 120]) {
    const spring = createKeySpring(); let peak = 0, swing = 0;
    for (let i = 0; i < fps * 5; i++) {
      const value = spring.step(1 / fps, 0.5, 0.2);
      peak = Math.max(peak, value.x); swing = Math.max(swing, Math.abs(value.angle));
      assert.ok(Math.abs(value.x) <= 0.65 && Math.abs(value.y) <= 0.35 && Math.abs(value.angle) <= 0.24);
    }
    assert.ok(peak > 0.5, 'Should spring past the pointer target'); assert.ok(swing > 0.05, 'Dragging should impart angular motion');
    assert.ok(Math.abs(spring.state.x - 0.5) < 0.001 && Math.abs(spring.state.angle) < 0.001);
    finalStates.push(spring.state.x);
    spring.step(1/60, -0.3, 0, true); assert.equal(spring.state.angle, 0); assert.equal(spring.state.x, -0.3);
    spring.reset(); assert.ok(Object.values(spring.state).every(value => value === 0));
  }
  assert.ok(Math.max(...finalStates) - Math.min(...finalStates) < 0.001);
});

test('night lamps and road pools switch with the theme', () => {
  for (const kind of ['house', 'land', 'society', 'commercial', 'map']) {
    const illustration = kind === 'house' ? createArchitecture() : kind === 'map' ? createPropertyMapModel([{ id: '1' }]) : createDistrict({ kind });
    const scene = new Scene(); scene.add(illustration.model);
    const lighting = createSceneLighting(scene, illustration.model, {}, {kind}); lighting.setNight(true);
    let pools = 0, lamps = 0, calls = 0, equivalent = 0;
    illustration.model.traverse(o => {
      if (o.userData.nightOnly) { pools++; assert.equal(o.visible, true); }
      if (o.material?.userData.nightLamp) { lamps++; assert.equal(o.material.emissiveIntensity, 1.3); }
      if (o.isMesh) { calls++; equivalent += o.isInstancedMesh ? o.count : 1; }
    });
    if (kind !== 'house') { assert.ok(pools >= 2); assert.ok(lamps >= 1); }
    if (kind !== 'map') assert.ok(calls < equivalent * 0.55, 'Shared scene geometry should substantially reduce draw calls');
    lighting.setNight(false); illustration.model.traverse(o => { if (o.userData.nightOnly) assert.equal(o.visible, false); });
    lighting.dispose(); illustration.dispose();
  }
});

const { createOrbitSpring } = await import('../components/landing/orbit-spring.mjs');
const { scenePixelRatio, prefersLightweightScene } = await import('../components/landing/render-policy.mjs');
const { contentImageUrl } = await import('../lib/image-url.mjs');

test('all architectural scenes support bounded pointer orbit with stable settling', () => {
  for (const fps of [30, 60, 120]) {
    const orbit = createOrbitSpring();
    for (let i = 0; i < fps * 3; i++) { orbit.step(1/fps, .7, .15); assert.ok(Math.abs(orbit.state.yaw) <= .8 && Math.abs(orbit.state.pitch) <= .18); }
    assert.ok(Math.abs(orbit.state.yaw - .7) < .001 && Math.abs(orbit.state.pitch - .15) < .001);
    orbit.step(1/fps, -.2, -.1, true); assert.equal(orbit.state.yaw, -.2); assert.equal(orbit.state.pitch, -.1);
    orbit.reset(); assert.ok(Object.values(orbit.state).every(value => value === 0));
  }
});

test('3D pixel budgets stay bounded for retina screens and growing property inventories', () => {
  for (const [width,height] of [[390,500],[1440,700],[2000,5000],[2000,50000]]) for(const lowPower of [false,true]) {
    const ratio = scenePixelRatio(width,height,{devicePixelRatio:3,lowPower,maxTextureSize:8192});
    assert.ok(width*height*ratio*ratio <= (lowPower?700000:1400000)+1);
    assert.ok(Math.max(width,height)*ratio <=8192); assert.ok(ratio >0 && ratio<=1.35);
  }
  assert.equal(prefersLightweightScene({connection:{saveData:true}}),true);
  assert.equal(prefersLightweightScene({hardwareConcurrency:4}),true);
  assert.equal(prefersLightweightScene({hardwareConcurrency:16,deviceMemory:8}),false);
});

test('image delivery resizes Cloudinary previews without changing document or local URLs', () => {
  assert.equal(contentImageUrl('/assets/local.png'),'/assets/local.png');
  assert.equal(contentImageUrl('https://example.com/photo.png'),'https://example.com/photo.png');
  assert.equal(contentImageUrl('https://res.cloudinary.com/demo/image/upload/map.pdf'),'https://res.cloudinary.com/demo/image/upload/map.pdf');
  assert.match(contentImageUrl('https://res.cloudinary.com/demo/image/upload/v1/photo.jpg',900),/\/f_auto,q_auto,w_900,c_limit\/v1\/photo.jpg$/);
});

test('grabbed architectural geometry remains inside desktop and mobile camera frames', () => {
  for(const kind of ['house','land','society','commercial']) {
    const illustration=kind==='house'?createArchitecture():createDistrict({kind});
    const camera=kind==='house'?createSceneCamera():createSpatialCamera(kind);
    for(const aspect of [.8,.95,1.4,1.8]) {
      if(kind==='house') frameSceneCamera(camera,aspect*1000,1000); else frameSpatialCamera(camera,aspect*1000,1000,kind);
      for(const yaw of [-.8,0,.8]) for(const pitch of [-.18,.18]) for(const progress of [0,1]) {
        if(kind==='house') { const pose=scenePose(progress); illustration.model.rotation.set(pitch,pose.rotation+yaw,0); illustration.upperFloor.position.y=pose.lift; illustration.roof.position.y=pose.roofLift; illustration.model.scale.setScalar(pose.scale); }
        else { illustration.update(progress,false,3); illustration.model.rotation.set(pitch,yaw,0); }
        illustration.model.updateMatrixWorld(true); illustration.model.traverseVisible(object=>assertFits(object,camera,kind+' grabbed model must fit'));
      }
    }
    illustration.dispose();
  }
});
