import { test, expect } from '@playwright/test';

test('leads with the agency offer, then asks for the project', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText(/before it fizzles/i);
  const build = page.locator('#build');
  const contact = page.locator('#contact');
  expect((await build.boundingBox())!.y).toBeLessThan((await contact.boundingBox())!.y);
});

test('routes an SMB visitor to Rewire within the first two screens', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('a[href="/rewire/landing/"]').first();
  await expect(link).toBeVisible();
  expect((await link.boundingBox())!.y).toBeLessThan(page.viewportSize()!.height * 2);
});

test('renders exactly two sections, build then contact', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('main section, body > section').evaluateAll(
    ns => ns.map(n => n.id)
  );
  expect(ids).toEqual(['build', 'contact']);
});

test('page is visible at rest with no content parked at opacity 0', async ({ page }) => {
  await page.goto('/');
  const faded = await page.locator('main *').evaluateAll(
    ns => ns.filter(n => parseFloat(getComputedStyle(n).opacity) === 0 &&
                         (n.textContent ?? '').trim().length > 0).length
  );
  expect(faded).toBe(0);
});

test('logs no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.waitForTimeout(2500);
  expect(errors).toEqual([]);
});
