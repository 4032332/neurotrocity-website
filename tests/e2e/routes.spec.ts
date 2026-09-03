import { test, expect } from '@playwright/test';

const MUST_RESOLVE = [
  '/', '/rewire/landing/', '/rewire/contact/',
  '/rewire/sample/', '/rewire/sample/vernier/', '/rewire/sample/apex/',
  '/rewire/sample/forge/', '/rewire/sample/lumen/',
  '/rewire/sample/northbay/', '/rewire/sample/vale/',
  '/dispoint/', '/dosetrack/',
  '/robots.txt', '/sitemap.xml', '/app-ads.txt', '/favicon.ico',
  '/contact/', '/rewire/contact/thanks.html',
];

for (const path of MUST_RESOLVE) {
  test(`${path} returns 200`, async ({ request }) => {
    const res = await request.get(path);
    expect(res.status(), `${path} must not 404`).toBe(200);
  });
}

test('apple-app-site-association survives the build unchanged', async ({ request }) => {
  const res = await request.get('/.well-known/apple-app-site-association', { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  const body = await res.json();
  // DisPoint share-a-deal universal links depend on this exact routing
  expect(body.applinks.details[0].appIDs).toContain('9VY7RCG6Y4.com.robbrown.dispoint');
  expect(body.applinks.details[0].components[0]['/']).toBe('/dispoint/d/*');
});

test('.nojekyll is present so Pages does not strip dot-directories', async ({ request }) => {
  expect((await request.get('/.nojekyll')).status()).toBe(200);
});

test('CNAME still pins the apex domain', async ({ request }) => {
  expect((await (await request.get('/CNAME')).text()).trim()).toBe('neurotrocity.com');
});
