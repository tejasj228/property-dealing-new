import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliseAnalytics } from '../lib/vercel-analytics.mjs';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Scene } from 'three';
import { finishArchitecture, surfaceTexture } from '../components/landing/material-finish.mjs';
import fs from 'node:fs';

test('analytics preserves unique lifetime visitors instead of adding daily visitors', () => {
  const result = normaliseAnalytics({ data: { pageviews: 50, visitors: 4 } }, { data: [{ timestamp: '2026-10-17T00:00:00Z', pageviews: 12, visitors: 3 }, { timestamp: '2026-10-16T00:00:00Z', pageviews: 8, visitors: 3 }] }, new Date('2026-10-17T12:00:00Z'));
  assert.equal(result.visitors, 4); assert.equal(result.days.length, 7);
  assert.equal(result.days.at(-1).pageviews, 12); assert.equal(result.days[0].pageviews, 0);
});
test('malformed analytics cannot become zero-valued successful metrics', () => {
  assert.throws(() => normaliseAnalytics({}, { data: [] }));
  assert.throws(() => normaliseAnalytics({ data: { pageviews: 0, visitors: 0 } }, { data: [{ timestamp: '2026-10-17', pageviews: -1, visitors: 0 }] }));
});
test('surface maps are deterministic, bounded and distinct for each finish', () => {
  const stone = surfaceTexture('stone'), second = surfaceTexture('stone'), wood = surfaceTexture('wood');
  assert.deepEqual(stone.image.data, second.image.data); assert.notDeepEqual(stone.image.data, wood.image.data);
  assert.equal(stone.image.width, 128); assert.equal(stone.image.data.length, 65536);
  [stone, second, wood].forEach(texture => texture.dispose());
});

test('analytics checks administrator access before reading upstream data and hides upstream failures', async () => {
  const source = fs.readFileSync(new URL('../app/api/analytics/route.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '').replace('export async function GET', 'async function GET');
  const create = (auth, fetcher, env) => new Function('authorizeAdmin', 'fetch', 'process', 'NextResponse', 'normaliseAnalytics', source + '\nreturn GET;')(auth, fetcher, { env }, { json: (body, options) => Response.json(body, options) }, normaliseAnalytics);
  let calls = 0;
  const denied = create(() => Response.json({}, { status: 401 }), () => { calls++; }, {});
  assert.equal((await denied({})).status, 401); assert.equal(calls, 0);
  const missing = create(() => null, () => { calls++; }, {});
  assert.deepEqual(await (await missing({})).json(), { available: false, reason: 'not_configured' }); assert.equal(calls, 0);
  const failed = create(() => null, async () => { throw new Error('private upstream information'); }, { VERCEL_ANALYTICS_TOKEN: 'test-token', VERCEL_ANALYTICS_PROJECT_ID: 'test-project' });
  const response = await failed({});
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await response.json(), { available: false, reason: 'connection_failed' });
});


test('architectural finishes share surface maps and release each map once', () => {
  const scene = new Scene(), model = new Group(), geometry = new BoxGeometry();
  const materials = ['stone', 'stone', 'leaf', 'glass'].map(name => new MeshStandardMaterial({ name }));
  materials[3].userData.nightWindow = true;
  materials.forEach(material => model.add(new Mesh(geometry, material)));
  const finish = finishArchitecture(scene, model, {}, true);
  assert.equal(materials[0].normalMap, materials[1].normalMap);
  assert.notEqual(materials[0].normalMap, materials[2].bumpMap);
  const textures = new Set(materials.flatMap(material => [material.map, material.normalMap, material.roughnessMap, material.bumpMap, material.emissiveMap]).filter(Boolean));
  let releases = 0; textures.forEach(texture => texture.addEventListener('dispose', () => releases++));
  finish.setNight(true); assert.equal(scene.environmentIntensity, .14);
  finish.dispose(); assert.equal(releases, textures.size); assert.equal(scene.environment, null);
  geometry.dispose(); materials.forEach(material => material.dispose());
});
