import { test, expect } from '@playwright/test';
import { BOOKS, isLive } from '../../src/content/facts';

const live = BOOKS.filter(isLive);
const soon = BOOKS.filter(b => !isLive(b));

test('lists every book, live first', async ({ page }) => {
  await page.goto('/products/');
  const titles = await page.locator('#books .book h3').allInnerTexts();
  expect(titles).toEqual(BOOKS.map(b => b.title));
});

test('live tiles open Amazon in a new tab', async ({ page }) => {
  await page.goto('/products/');
  const tiles = page.locator('#books a.book.live');
  await expect(tiles).toHaveCount(live.length);
  for (let i = 0; i < live.length; i++) {
    const t = tiles.nth(i);
    await expect(t).toHaveAttribute('href', live[i].url);
    await expect(t).toHaveAttribute('target', '_blank');
    expect(await t.getAttribute('rel')).toContain('noopener');
    await expect(t.locator('img')).toHaveAttribute('alt', live[i].coverAlt);
  }
});

test('coming-soon tiles are not links and say so in text', async ({ page }) => {
  await page.goto('/products/');
  const tiles = page.locator('#books div.book.soon');
  await expect(tiles).toHaveCount(soon.length);
  await expect(tiles.locator('a')).toHaveCount(0);
  for (let i = 0; i < soon.length; i++) {
    await expect(tiles.nth(i)).toContainText(/coming soon/i);
    await expect(tiles.nth(i).locator('svg.chalk')).toHaveCount(1);
  }
});

test('says the books are for adults', async ({ page }) => {
  await page.goto('/products/');
  await expect(page.locator('#books')).toContainText(/for adults/i);
});

test('hero button goes to the author store', async ({ page }) => {
  await page.goto('/products/');
  const btn = page.locator('.hero a.btn.p');
  await expect(btn).toHaveAttribute('href', /amazon\.com\.au/);
  await expect(btn).toHaveAttribute('target', '_blank');
});

test('no horizontal overflow at 360px on /products/', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/products/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('footer Amazon links open in a new tab', async ({ page }) => {
  await page.goto('/products/');
  const links = page.locator('a[href*="amazon."]');
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const l = links.nth(i);
    await expect(l).toHaveAttribute('target', '_blank');
    expect(await l.getAttribute('rel')).toContain('noopener');
  }
});

test('logs no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/products/');
  await page.waitForTimeout(2500);
  expect(errors).toEqual([]);
});
