import { test, expect } from '@playwright/test';

// Every page built from src/layouts/Base.astro must load Google Analytics.
// The hand-written pages under public/ carry the same tag in their own HTML.
const GA_ID = 'G-4HW41XNKNR';
const ASTRO_PAGES = [
  '/', '/apps/', '/products/', '/rewire/landing/', '/rewire/skill-pack/',
  '/beeptest/landing/', '/beeptest/privacy/', '/beeptest/eula/', '/beeptest/support/',
];

for (const path of ASTRO_PAGES) {
  test(`${path} loads Google Analytics`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator(`script[src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"]`)).toHaveCount(1);
    const configured = await page.evaluate((id) =>
      Array.isArray((window as any).dataLayer) &&
      (window as any).dataLayer.some((e: IArguments) => e[0] === 'config' && e[1] === id), GA_ID);
    expect(configured, `${path} never calls gtag('config', '${GA_ID}')`).toBe(true);
  });
}
