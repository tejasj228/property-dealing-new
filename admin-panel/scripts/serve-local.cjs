// Preview the compiled admin on localhost; API calls keep their build-time configuration.
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../build');
const mime = { '.html':'text/html; charset=utf-8', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.png':'image/png', '.jpg':'image/jpeg', '.ttf':'font/ttf', '.woff2':'font/woff2', '.txt':'text/plain' };
http.createServer((request, response) => {
  if (!['GET','HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); } catch { response.writeHead(400).end(); return; }
  let file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  if (!path.extname(pathname)) file = path.join(root, 'index.html');
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Content-Length':stat.size, 'Cache-Control': pathname.startsWith('/static/') ? 'public, max-age=31536000, immutable' : 'no-cache' });
    if (request.method === 'HEAD') response.end(); else fs.createReadStream(file).pipe(response);
  });
}).listen(3101, '127.0.0.1', () => process.stdout.write('Admin preview ready at http://localhost:3101\n'));
