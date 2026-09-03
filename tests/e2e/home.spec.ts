import { test, expect } from '@playwright/test';

test('leads with the agency offer, not the venture list', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText(/honest software/i);
  const build = page.locator('#build');
  const proof = page.locator('#proof');
  expect((await build.boundingBox())!.y).toBeLessThan((await proof.boundingBox())!.y);
});

test('routes an SMB visitor to Rewire within the first two screens', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('a[href="/rewire/landing/"]').first();
  await expect(link).toBeVisible();
  expect((await link.boundingBox())!.y).toBeLessThan(page.viewportSize()!.height * 2);
});

test('surfaces the client-privacy stance as a heading-scale element', async ({ page }) => {
  await page.goto('/');
  const stance = page.locator('.stance p').first();
  await expect(stance).toContainText(/clients/i);
  const size = await stance.evaluate(n => parseFloat(getComputedStyle(n).fontSize));
  expect(size).toBeGreaterThan(18);
});

test('renders all four rules from facts', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#rules .rule')).toHaveCount(4);
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
