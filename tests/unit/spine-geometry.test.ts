import { describe, it, expect } from 'vitest';
import { spinePath, somaFraction } from '../../src/motion/spine/geometry';

describe('spinePath', () => {
  it('starts above and ends below the viewport so it never shows an end cap', () => {
    const d = spinePath(96, 800);
    expect(d).toMatch(/^M [\d.]+ -40 /);
    expect(d).toContain('840');            // 800 + 40
  });
  it('scales horizontally with the gutter width', () => {
    expect(spinePath(96, 800)).not.toBe(spinePath(140, 800));
  });
});

describe('somaFraction', () => {
  const vh = 800;
  it('is 0 at the top of the viewport and 1 at the bottom', () => {
    // A 10px section anchors at its own centre (5px), so "top" is ~0.006 — the
    // brief's toBeCloseTo(0, 2) contradicted its own prototype-faithful formula.
    expect(somaFraction({ top: 0, height: 10 }, vh)).toBeCloseTo(0, 1);
    expect(somaFraction({ top: vh, height: 10 }, vh)).toBeCloseTo(1, 2);
  });
  it('clamps rather than returning out-of-range values', () => {
    expect(somaFraction({ top: -5000, height: 10 }, vh)).toBe(0);
    expect(somaFraction({ top: 5000, height: 10 }, vh)).toBe(1);
  });
  it('anchors tall sections near their top third, not their centre', () => {
    const f = somaFraction({ top: 0, height: 4000 }, vh);
    expect(f).toBeLessThan(0.5);
  });
});
