import { test, expect } from '@playwright/test';

test('skip link is the first focusable element and reaches main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toHaveText(/skip to content/i);
  await focused.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

// Adjusted from the brief: :focus-visible may not match when Playwright calls
// element.focus() programmatically on non-text elements (Chromium heuristics).
// Reaching each element via a real keyboard Tab keeps focus "keyboard-initiated"
// so :focus-visible reliably matches, while still asserting a visible outline
// on every interactive element in document order.
test('every interactive element has a visible focus ring', async ({ page }) => {
  await page.goto('/');
  const els = page.locator('a[href], button, input, [tabindex="0"]');
  const count = await els.count();
  for (let i = 0; i < count; i++) {
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => {
      const n = document.activeElement as Element;
      const cs = getComputedStyle(n);
      return cs.outlineStyle + ' ' + cs.outlineWidth;
    });
    expect(outline).not.toMatch(/none|0px/);
  }
});

test('no horizontal overflow at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('landmarks are present exactly once', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header[role="banner"], body > header')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
});
