import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { deliveryUrl, extensionOf, IMAGE_ACCEPT, isSupportedImage } from '../lib/image-formats.mjs';
import { uniquePublicId } from '../lib/upload-ids.mjs';
import { normalizePropertyInput } from '../lib/property-input.mjs';
import { mapArchitectureKind } from '../components/landing/map-architecture.mjs';
import { createPropertyMapModel } from '../components/landing/property-map-model.mjs';

const root = path.join(import.meta.dirname, '..'), admin = path.join(root, '../admin-panel/src');

// The admin is a separate project, so its copy of the format rules is checked against the site's.
test('admin and website agree on which image types are accepted', () => {
  assert.equal(fs.readFileSync(path.join(admin, 'utils/imageFormats.js'), 'utf8'), fs.readFileSync(path.join(root, 'lib/image-formats.mjs'), 'utf8'));
});

test('every common photo type is accepted, including HEIC photos that carry no MIME type', () => {
  for (const name of ['a.jpg', 'a.JPEG', 'IMG_0001.HEIC', 'x.heif', 'x.hif', 'a.png', 'a.webp', 'a.avif', 'a.gif', 'a.tiff', 'a.bmp', 'a.svg', 'a.jfif'])
    assert.ok(isSupportedImage({ name, type: '' }), name);
  assert.ok(isSupportedImage({ name: 'camera', type: 'image/heic' }));
  for (const name of ['notes.pdf', 'sheet.xlsx', 'movie.mp4', 'noextension']) assert.equal(isSupportedImage({ name, type: '' }), false, name);
  assert.match(IMAGE_ACCEPT, /\.heic/); assert.match(IMAGE_ACCEPT, /\.heif/); assert.match(IMAGE_ACCEPT, /^image\/\*,/);
  assert.equal(extensionOf('https://res.cloudinary.com/x/a.heic?v=1'), 'heic');
});

test('photos browsers cannot show are delivered as JPEG, everything else is untouched', () => {
  const url = ext => `https://res.cloudinary.com/demo/image/upload/v1/pawan-buildhome/property-abc.${ext}`;
  for (const ext of ['heic', 'heif', 'tiff', 'jp2']) assert.equal(deliveryUrl(url(ext), ext), url('jpg'));
  for (const ext of ['jpg', 'png', 'webp', 'gif', 'svg']) assert.equal(deliveryUrl(url(ext), ext), url(ext));
  assert.equal(deliveryUrl(url('HEIC')), url('jpg'));
});

test('photos uploaded in the same millisecond never share an id', () => {
  const ids = new Set(Array.from({ length: 5000 }, () => uniquePublicId('property')));
  assert.equal(ids.size, 5000);
});

// The browser pipeline is plain modules; load it with its import pointed at the shared helper.
async function loadUploader() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uploader-'));
  const source = fs.readFileSync(path.join(admin, 'services/imageUploader.js'), 'utf8').replace("'../utils/imageFormats'", JSON.stringify(pathToFileURL(path.join(root, 'lib/image-formats.mjs')).href));
  fs.writeFileSync(path.join(dir, 'uploader.mjs'), source);
  return import(pathToFileURL(path.join(dir, 'uploader.mjs')).href);
}
const photo = (name, size = 1000, type = '') => new File([new Uint8Array(size)], name, { type, lastModified: size });
const stored = (id, format = 'jpg') => ({ secure_url: `https://res.cloudinary.com/demo/image/upload/v1/pawan-buildhome/${id}.${format}`, public_id: `pawan-buildhome/${id}`, format, bytes: 10 });
function backend() {
  const calls = { signed: 0, posts: [] };
  return { calls,
    sign: async () => { calls.signed++; return { apiKey: 'k', timestamp: 1, signature: 's', folder: 'pawan-buildhome', public_id: `property-${calls.signed}`, uploadUrl: 'https://upload.test' }; },
    post: async (url, form) => { const id = form.get('public_id'); calls.posts.push(id); return { status: 200, body: stored(id, /heic/i.test(form.get('file').name) ? 'heic' : 'jpg') }; } };
}

test('a HEIC photo uploads straight to storage and comes back as a viewable JPEG address', async () => {
  const { uploadImageFile } = await loadUploader(), api = backend();
  const result = await uploadImageFile(photo('IMG_2041.HEIC'), { sign: api.sign, post: api.post });
  assert.match(result.imageUrl, /\.jpg$/); assert.equal(api.calls.signed, 1); assert.equal(api.calls.posts.length, 1);
});

test('a dropped connection is retried with the same image id, so it can never add a second copy', async () => {
  const { uploadImageFile } = await loadUploader(), api = backend(); let first = true;
  const post = async (url, form, options) => { if (first) { first = false; throw Object.assign(new Error('The connection dropped'), { retryable: true }); } return api.post(url, form, options); };
  const result = await uploadImageFile(photo('a.jpg'), { sign: api.sign, post });
  assert.match(result.imageUrl, /property-1\.jpg$/); assert.deepEqual(api.calls.posts, ['property-1']); assert.equal(api.calls.signed, 1);
});

test('several photos at once each get their own address, and picking a file twice uploads it once', async () => {
  const { uploadImageFiles } = await loadUploader(), api = backend(), seen = [];
  const files = [photo('a.jpg', 100), photo('b.heic', 200), photo('c.png', 300), photo('d.webp', 400), photo('a.jpg', 100)];
  const results = await uploadImageFiles(files, { sign: api.sign, post: api.post, onItem: item => seen.push(item.file.name) });
  assert.equal(results.length, 4); assert.equal(new Set(results.map(item => item.imageUrl)).size, 4);
  assert.ok(results.every(item => item.status === 'done')); assert.equal(seen.length, 4); assert.equal(api.calls.posts.length, 4);
});

test('one bad photo does not discard the others', async () => {
  const { uploadImageFiles } = await loadUploader(), api = backend();
  const results = await uploadImageFiles([photo('good.jpg', 10), photo('notes.pdf', 20), photo('huge.jpg', 70 * 1024 * 1024), photo('fine.heic', 30)], { sign: api.sign, post: api.post });
  assert.deepEqual(results.map(item => item.status), ['done', 'failed', 'failed', 'done']);
  assert.match(results[1].error, /not a supported image/); assert.match(results[2].error, /largest photo accepted/);
});

test('a photo over the storage limit that cannot be shrunk is refused with a clear message', async () => {
  const { uploadImageFile } = await loadUploader(), api = backend();
  await assert.rejects(uploadImageFile(photo('big.heic', 12 * 1024 * 1024), { sign: api.sign, post: api.post }), /over the 10 MB storage limit/);
  assert.equal(api.calls.posts.length, 0);
});

test('storage errors are explained, and a rejected photo is not retried forever', async () => {
  const { uploadImageFile } = await loadUploader(), api = backend(); let attempts = 0;
  const post = async () => { attempts++; return { status: 400, body: { error: { message: 'Invalid image file' } } }; };
  await assert.rejects(uploadImageFile(photo('x.jpg'), { sign: api.sign, post }), /could not be read as an image/); assert.equal(attempts, 1);
});

test('small photos fall back to the website route when signing is unavailable', async () => {
  const { uploadImageFile } = await loadUploader(); let used = 0;
  const sign = async () => { throw Object.assign(new Error('Not found'), { response: { status: 404 } }); };
  const legacyUpload = async () => { used++; return { imageUrl: 'https://res.cloudinary.com/demo/image/upload/a.jpg', filename: 'a', size: 5 }; };
  const result = await uploadImageFile(photo('a.jpg'), { sign, legacyUpload });
  assert.equal(used, 1); assert.equal(result.imageUrl, 'https://res.cloudinary.com/demo/image/upload/a.jpg');
});

test('an expired admin session is reported, not retried', async () => {
  const { uploadImageFile } = await loadUploader(); let attempts = 0;
  const sign = async () => { attempts++; throw Object.assign(new Error('Forbidden'), { response: { status: 403 } }); };
  await assert.rejects(uploadImageFile(photo('a.jpg'), { sign }), /session has expired/); assert.equal(attempts, 1);
});

test('an empty plot never carries bedrooms or bathrooms, whatever the form sends', () => {
  const plot = normalizePropertyInput({ title: 'Plot', propertyType: 'residential', isPlot: true, beds: '3', baths: 2 });
  assert.deepEqual([plot.body.isPlot, plot.body.beds, plot.body.baths], [true, null, null]);
  const home = normalizePropertyInput({ propertyType: 'residential', isPlot: false, beds: '3', baths: '' });
  assert.deepEqual([home.body.isPlot, home.body.beds, home.body.baths], [false, 3, null]);
  assert.equal(normalizePropertyInput({ isPlot: 'true' }).body.isPlot, true);
  assert.equal(normalizePropertyInput({}).body.propertyType, 'residential');
  assert.ok(normalizePropertyInput({ propertyType: 'villa' }).error);
  // An edit that does not mention the plot flag leaves it alone.
  const edit = normalizePropertyInput({ title: 'New title' }, { partial: true }).body;
  assert.equal('isPlot' in edit, false); assert.equal('propertyType' in edit, false);
});

test('the model gives plots no rooms and the property routes use the shared rules', () => {
  const model = fs.readFileSync(path.join(root, 'lib/models/Property.js'), 'utf8');
  assert.match(model, /isPlot: \{ type: Boolean, default: false \}/); assert.match(model, /if \(this\.isPlot\) \{\s*this\.beds = null;\s*this\.baths = null;/);
  for (const route of ['app/api/properties/route.js', 'app/api/properties/[id]/route.js']) assert.match(fs.readFileSync(path.join(root, route), 'utf8'), /normalizePropertyInput/);
  assert.match(fs.readFileSync(path.join(root, 'lib/landing-data.js'), 'utf8'), /isPlot: p\.isPlot === true/);
});

test('a listing marked as an empty plot appears as open land on the map', () => {
  assert.equal(mapArchitectureKind({ title: 'Corner site', propertyType: 'residential', isPlot: true }), 'plot');
  assert.equal(mapArchitectureKind({ title: 'Corner site', propertyType: 'commercial', isPlot: true }), 'plot');
  assert.equal(mapArchitectureKind({ title: 'Corner site', propertyType: 'commercial', isPlot: false }), 'commercial');
  assert.equal(mapArchitectureKind({ title: 'Three bedroom flat', propertyType: 'residential', isPlot: false }), 'building');
  assert.equal(mapArchitectureKind({ title: 'Open plot', propertyType: 'residential' }), 'plot');
  // A listing that is not marked as a plot is never drawn as one by chance.
  for (const title of ['A', 'B', 'C', 'D', 'E', 'F']) assert.equal(mapArchitectureKind({ title, propertyType: 'residential', isPlot: false }), 'building');
  const properties = [{ id: 'p1', title: 'Corner site', propertyType: 'residential', isPlot: true }, { id: 'h1', title: 'Sunrise', propertyType: 'residential', isPlot: false }];
  const map = createPropertyMapModel(properties, true);
  assert.deepEqual(map.structures, [{ id: 'p1', kind: 'plot' }, { id: 'h1', kind: 'building' }]);
  assert.ok(map.markerPositions[0].position.y > 0);
  map.dispose();
});
