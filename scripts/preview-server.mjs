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
import { fileURLToPath } from 'node:url';

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
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
    res.end(fs.readFileSync(file));
    return;
  }

  const notFoundPage = path.join(distDir, '404.html');
  res.statusCode = 404;
  if (fs.existsSync(notFoundPage)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync(notFoundPage));
  } else {
    res.end('Not Found');
  }
});

server.listen(port, () => {
  console.log(`preview server listening on http://localhost:${port}`);
});
