import { test, expect } from '@playwright/test';
import { DEMOS, PRODUCTS } from '../../src/content/facts';

const PAGES = [
  { path: '/',                 canonical: 'https://neurotrocity.com/' },
  { path: '/rewire/landing/',  canonical: 'https://neurotrocity.com/rewire/landing/' },
];

for (const p of PAGES) {
  test(`${p.path} declares a self-referencing canonical`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', p.canonical);
  });

  test(`${p.path} has exactly one canonical and one og:title`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  });

  test(`${p.path} has a complete Open Graph card`, async ({ page }) => {
    await page.goto(p.path);
    for (const prop of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type', 'og:site_name']) {
      const c = await page.locator(`meta[property="${prop}"]`).getAttribute('content');
      expect(c?.trim(), `${p.path} missing ${prop}`).toBeTruthy();
    }
    await expect(page.locator('meta[name="twitter:card"]'))
      .toHaveAttribute('content', 'summary_large_image');
  });

  test(`${p.path} og:image resolves and is 1200x630`, async ({ page, request }) => {
    await page.goto(p.path);
    const src = (await page.locator('meta[property="og:image"]').getAttribute('content'))!;
    // og:image is deliberately an absolute production URL (required for social
    // crawlers). Fetch by path against the preview server rather than the real
    // domain, which won't have this build's image until deploy.
    const imgPath = new URL(src).pathname;
    const res = await request.get(imgPath);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/image\/(png|jpeg)/);
    const { width, height } = await page.evaluate((u: string) => new Promise<any>(r => {
      const i = new Image();
      i.onload = () => r({ width: i.naturalWidth, height: i.naturalHeight });
      i.src = u;
    }), imgPath);
    expect([width, height]).toEqual([1200, 630]);
  });

  test(`${p.path} emits valid JSON-LD`, async ({ page }) => {
    await page.goto(p.path);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) {
      const parsed = JSON.parse(b);
      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@type']).toBeTruthy();
    }
  });
}

test('home declares the Organization', async ({ page }) => {
  await page.goto('/');
  const types = (await page.locator('script[type="application/ld+json"]').allTextContents())
    .map(b => JSON.parse(b)['@type']);
  expect(types).toContain('Organization');
});

test('Rewire declares a Service, not an Organization', async ({ page }) => {
  await page.goto('/rewire/landing/');
  const types = (await page.locator('script[type="application/ld+json"]').allTextContents())
    .map(b => JSON.parse(b)['@type']);
  expect(types).toContain('Service');
});

test('sitemap is generated from facts and covers every indexable URL', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const required = [
    '/', '/rewire/landing/', '/rewire/contact/', '/contact/rob/', '/contact/jaimi/',
    ...PRODUCTS.map(p => p.path),
    ...DEMOS.map(d => d.href),
  ];
  for (const loc of required) {
    expect(xml, `sitemap missing ${loc}`).toContain(`https://neurotrocity.com${loc}`);
  }
});

test('every sitemap URL returns 200 — no orphans', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  expect(locs.length).toBeGreaterThan(10);
  for (const loc of locs) {
    const path = new URL(loc).pathname;
    expect((await request.get(path)).status(), `${path} is in the sitemap but 404s`).toBe(200);
  }
});

test('robots.txt allows crawling and points at the sitemap', async ({ request }) => {
  const txt = await (await request.get('/robots.txt')).text();
  expect(txt).toContain('Sitemap: https://neurotrocity.com/sitemap.xml');
  expect(txt).not.toMatch(/Disallow:\s*\/\s*$/m);
});
