import { describe, it, expect } from 'vitest';
import { PALETTES } from '../../src/motion/cortex/palette';

describe('cortex palettes', () => {
  it('has a flare palette led by #FF3B2F', () => {
    const p = PALETTES.flare;
    expect(p).toBeTruthy();
    expect(p.clusters[0]).toBe(0xFF3B2F);
    expect(p.c1).toEqual([1.0, 0.231, 0.184]);
  });

  it('keeps every shader endpoint in 0..1', () => {
    for (const [name, p] of Object.entries(PALETTES)) {
      for (const v of [...p.c1, ...p.c2]) {
        expect(v, name).toBeGreaterThanOrEqual(0);
        expect(v, name).toBeLessThanOrEqual(1);
      }
    }
  });
});
