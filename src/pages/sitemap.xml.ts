import type { APIRoute } from 'astro';
import { PRODUCTS, DEMOS } from '../content/facts';

const SITE = 'https://neurotrocity.com';

/** Static pages that aren't derived from facts.ts. */
const STATIC_URLS = [
  '/',
  '/rewire/landing/',
  '/rewire/contact/',
  '/rewire/sample/',
  '/contact/rob/',
  '/contact/jaimi/',
];

/**
 * Every URL from the old hand-written public/sitemap.xml (DisPoint/DoseTrack
 * support/contact/privacy/terms/policy pages) so they don't drop out of the
 * index when the sitemap becomes generated. Copied verbatim.
 */
const LEGACY_URLS = [
  '/',
  '/dispoint/landing/',
  '/dispoint/support/',
  '/dispoint/contact/',
  '/dispoint/privacy/',
  '/dispoint/policies/terms.html',
  '/dispoint/policies/eula.html',
  '/dosetrack/landing/',
  '/dosetrack/support/',
  '/dosetrack/contact/',
  '/dosetrack/privacy/',
  '/dosetrack/terms/',
  '/dosetrack/policies/medical-disclaimer.html',
  '/dosetrack/policies/eula.html',
];

export const GET: APIRoute = () => {
  const urls = Array.from(
    new Set([
      ...STATIC_URLS,
      ...PRODUCTS.map((p) => p.path),
      ...DEMOS.map((d) => d.href),
      ...LEGACY_URLS,
    ]),
  );

  const lastmod = new Date().toISOString().slice(0, 10);

  const body = urls
    .map((loc) => `  <url><loc>${SITE}${loc}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  });
};
