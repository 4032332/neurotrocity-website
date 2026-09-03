import { describe, it, expect } from 'vitest';
import { collectQuietRects, MAX_RECTS } from '../../src/motion/cortex/attenuation';

const rect = (x: number, y: number, w: number, h: number) =>
  ({ getBoundingClientRect: () => ({ left: x, top: y, width: w, height: h, right: x + w, bottom: y + h }) }) as unknown as Element;

describe('collectQuietRects', () => {
  it('maps a centred element to the clip-space origin', () => {
    const out = collectQuietRects([rect(250, 200, 500, 400)], 1000, 800);
    expect(out[0]).toBeCloseTo(0, 5);   // cx
    expect(out[1]).toBeCloseTo(0, 5);   // cy
    expect(out[2]).toBeCloseTo(0.5, 5); // halfW  (500/1000)
    expect(out[3]).toBeCloseTo(0.5, 5); // halfH  (400/800)
  });

  it('flips y so that a top-of-viewport element has positive cy', () => {
    const out = collectQuietRects([rect(0, 0, 100, 100)], 1000, 800);
    expect(out[1]).toBeGreaterThan(0);
  });

  it('drops fully offscreen elements', () => {
    const out = collectQuietRects([rect(0, -900, 100, 100)], 1000, 800);
    expect(out[2]).toBe(0);             // zero half-width == inactive slot
  });

  it('never emits more than MAX_RECTS', () => {
    const many = Array.from({ length: 40 }, (_, i) => rect(0, i * 10, 100, 20));
    expect(collectQuietRects(many, 1000, 800)).toHaveLength(MAX_RECTS * 4);
  });

  it('prioritises the elements nearest the viewport centre', () => {
    const far = rect(0, 700, 100, 40);
    const near = rect(0, 380, 100, 40);
    const out = collectQuietRects([far, near], 1000, 800);
    expect(Math.abs(out[1])).toBeLessThan(0.2);   // the near one took slot 0
  });
});
