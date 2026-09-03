import { describe, it, expect } from 'vitest';
import { detectTier, TIER_BUDGET } from '../../src/motion/tier';

const base = { hasWebgl2: true, deviceMemory: 8, hardwareConcurrency: 8, reducedMotion: false, maxTextureSize: 8192 };

describe('detectTier', () => {
  it('returns none without WebGL2', () => {
    expect(detectTier({ ...base, hasWebgl2: false })).toBe('none');
  });
  it('returns none when reduced motion is requested', () => {
    expect(detectTier({ ...base, reducedMotion: true })).toBe('none');
  });
  it('returns high on a capable machine', () => {
    expect(detectTier(base)).toBe('high');
  });
  it('drops to low on 2GB / 2 cores', () => {
    expect(detectTier({ ...base, deviceMemory: 2, hardwareConcurrency: 2 })).toBe('low');
  });
  it('drops to medium on 4 cores', () => {
    expect(detectTier({ ...base, deviceMemory: 4, hardwareConcurrency: 4 })).toBe('medium');
  });
  it('never exceeds dpr 2 and budgets decrease monotonically', () => {
    const order = ['high', 'medium', 'low'] as const;
    for (let i = 1; i < order.length; i++) {
      expect(TIER_BUDGET[order[i]].fibresPerCluster)
        .toBeLessThan(TIER_BUDGET[order[i - 1]].fibresPerCluster);
    }
    expect(TIER_BUDGET.high.dpr).toBeLessThanOrEqual(2);
  });
});
