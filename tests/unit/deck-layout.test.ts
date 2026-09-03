import { describe, it, expect } from 'vitest';
import { deckTransforms } from '../../src/motion/deck/layout';

describe('deckTransforms', () => {
  it('returns one transform per card', () => {
    expect(deckTransforms(6, 0)).toHaveLength(6);
  });
  it('has exactly one frontmost card', () => {
    const t = deckTransforms(6, 0);
    const max = Math.max(...t.map(c => c.front));
    expect(t.filter(c => c.front === max)).toHaveLength(1);
  });
  it('is periodic in the card count', () => {
    const a = deckTransforms(6, 0.5), b = deckTransforms(6, 6.5);
    a.forEach((c, i) => expect(c.x).toBeCloseTo(b[i].x, 6));
  });
  it('fades and shrinks cards toward the back', () => {
    for (const c of deckTransforms(6, 0)) {
      expect(c.opacity).toBeGreaterThanOrEqual(0.3);
      expect(c.opacity).toBeLessThanOrEqual(1);
      expect(c.scale).toBeLessThanOrEqual(1.1);
    }
  });
});
