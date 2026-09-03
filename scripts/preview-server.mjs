// Static file server for `dist/`, used in place of `astro preview`.
//
// `astro preview`'s own server 404s any extensionless path that lacks a
// trailing slash when trailingSlash is "always" — see
// astro/dist/core/preview/vite-plugin-astro-preview.js, HAS_FILE_EXTENSION_REGEXP.
// It also doesn't honor `vite.plugins` from astro.config for the preview
// command at all (astro/dist/core/preview/static-preview-server.js calls
// vite's `preview()` with `configFile: false` and only its own internal
// plugin), so that behavior can't be patched from astro.config.mjs.
//
// Two files GitHub Pages depends on can't be renamed to route around this:
// `/CNAME` (GitHub Pages' apex-domain pin) and
// `/.well-known/apple-app-site-association` (Apple's universal-links file).
// Real GitHub Pages hosting is a plain static file server with no such
// trailing-slash logic, so this script serves `dist/` the same way — proving
// the routes e2e tests check are the routes production will actually serve.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const COMPRESSIBLE = new Set([
  'text/html; charset=utf-8',
  'text/css; charset=utf-8',
  'text/javascript; charset=utf-8',
  'image/svg+xml',
  'application/json; charset=utf-8',
  'text/plain; charset=utf-8',
]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const port = Number(process.argv[2] ?? 4321);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.vcf': 'text/vcard',
};

function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const safePath = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const direct = path.join(distDir, safePath);

  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;

  const asIndex = path.join(direct, 'index.html');
  if (fs.existsSync(asIndex)) return asIndex;

  const withHtml = `${direct}.html`;
  if (fs.existsSync(withHtml)) return withHtml;

  return null;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url);
  if (file) {
    const ext = path.extname(file).toLowerCase();
    const contentType = MIME[ext] ?? 'application/octet-stream';
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    sendBody(req, res, fs.readFileSync(file), contentType);
    return;
  }

  const notFoundPage = path.join(distDir, '404.html');
  res.statusCode = 404;
  if (fs.existsSync(notFoundPage)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    sendBody(req, res, fs.readFileSync(notFoundPage), 'text/html; charset=utf-8');
  } else {
    res.end('Not Found');
  }
});

function sendBody(req, res, body, contentType) {
  if (!COMPRESSIBLE.has(contentType)) {
    res.end(body);
    return;
  }
  const acceptEncoding = req.headers['accept-encoding'] ?? '';
  res.setHeader('Vary', 'Accept-Encoding');
  if (acceptEncoding.includes('br')) {
    res.setHeader('Content-Encoding', 'br');
    res.end(zlib.brotliCompressSync(body));
  } else if (acceptEncoding.includes('gzip')) {
    res.setHeader('Content-Encoding', 'gzip');
    res.end(zlib.gzipSync(body));
  } else {
    res.end(body);
  }
}

// Node closes idle keep-alive sockets after 5s by default; a client reusing the
// socket at that instant sees ECONNRESET (seen under `--workers 6`). Keep sockets
// open well past the client's own idle window so the server never wins that race.
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

server.listen(port, () => {
  console.log(`preview server listening on http://localhost:${port}`);
});
