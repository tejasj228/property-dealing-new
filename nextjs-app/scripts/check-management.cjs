const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const source = fs.readFileSync(path.join(__dirname, '../lib/auth.js'), 'utf8').replace(/^import .*;\r?\n/gm, '').replaceAll('export function ', 'function ');
const { authorizeAdmin } = new Function('jwt', 'NextResponse', source + '\nreturn { authorizeAdmin };')(jwt, { json: (data, options) => Response.json(data, options) });

test('management changes require a valid, unexpired admin token', () => {
  const previous = process.env.JWT_SECRET; process.env.JWT_SECRET = 'release-check-only-not-a-deployment-secret';
  try {
    const request = token => new Request('https://example.com/api/properties', { method: 'POST', headers: token ? { Authorization: 'Bearer ' + token } : {} });
    assert.equal(authorizeAdmin(request()).status, 401);
    assert.equal(authorizeAdmin(request('invalid')).status, 403);
    assert.equal(authorizeAdmin(request(jwt.sign({ role: 'user' }, process.env.JWT_SECRET))).status, 403);
    assert.equal(authorizeAdmin(request(jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: -1 }))).status, 403);
    assert.equal(authorizeAdmin(request(jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: 60 }))), null);
  } finally { if (previous === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previous; }
});

test('every property, area, society and upload mutation checks admin access first', () => {
  let protectedHandlers = 0;
  for (const directory of ['properties', 'areas', 'societies', 'uploads']) {
    const root = path.join(__dirname, '../app/api', directory);
    for (const relative of fs.readdirSync(root, { recursive: true }).filter(file => file.endsWith('route.js'))) {
      const content = fs.readFileSync(path.join(root, relative), 'utf8');
      for (const match of content.matchAll(/export async function (POST|PUT|PATCH|DELETE)\(request[^\n]*\{\r?\n([\s\S]*?)(?=export async function|$)/g)) {
        assert.match(match[2], /^  const denied = authorizeAdmin\(request\);\r?\n  if \(denied\) return denied;/, relative + ' ' + match[1]); protectedHandlers++;
      }
    }
  }
  assert.equal(protectedHandlers, 16);
});
