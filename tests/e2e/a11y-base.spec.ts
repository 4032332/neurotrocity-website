import { test, expect } from '@playwright/test';

test('skip link is the first focusable element and reaches main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toHaveText(/skip to content/i);
  await focused.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

// Reaching each element via a real keyboard Tab keeps focus "keyboard-initiated",
// so :focus-visible reliably matches (Chromium does not always apply it to
// programmatic element.focus() on non-text elements).
for (const path of ['/', '/beeptest/landing/']) {
  test(`${path} every interactive element has a visible focus ring`, async ({ page }) => {
    await page.goto(path);
    // Only what Tab can reach. Disabled controls and hidden inputs are skipped
    // by Tab, so counting them would tab past the last element and fail.
    const els = page.locator(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), [tabindex="0"]',
    );
    const count = await els.count();
    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab');
      const outline = await page.evaluate(() => {
        const cs = getComputedStyle(document.activeElement as Element);
        return cs.outlineStyle + ' ' + cs.outlineWidth;
      });
      expect(outline).not.toMatch(/none|0px/);
    }
  });

  test(`${path} has no horizontal overflow at 360px`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('landmarks are present exactly once', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header[role="banner"], body > header')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
});
