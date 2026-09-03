/**
 * Pure ring layout for the demo deck. `offset` is a continuous card index:
 * card `i` is frontmost when `offset === i`. Units are model units; the
 * mount (index.ts) maps them to pixels and CSS 3D.
 */
export interface CardTransform { x: number; z: number; rotY: number; opacity: number; scale: number; front: number }

export function deckTransforms(count: number, offset: number): CardTransform[] {
  const out: CardTransform[] = [];
  for (let i = 0; i < count; i++) {
    const a = (((i - offset) % count) + count) % count;
    const ang = (a / count) * Math.PI * 2;
    const z = Math.cos(ang) * 2.35 - 0.4;
    const front = (z + 2.75) / 5.5;
    out.push({
      x: Math.sin(ang) * 2.35,
      z,
      rotY: Math.sin(ang) * 0.62,
      opacity: 0.30 + front * 0.70,
      scale: 0.78 + front * 0.30,
      front,
    });
  }
  return out;
}
