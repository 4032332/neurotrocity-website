export const MAX_RECTS = 8;

export function collectQuietRects(els: Element[], vw: number, vh: number): Float32Array {
  const out = new Float32Array(MAX_RECTS * 4);
  const scored = els
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { r, dist: Math.abs(r.top + r.height / 2 - vh / 2) };
    })
    .filter(({ r }) => r.bottom > 0 && r.top < vh && r.width > 0 && r.height > 0)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, MAX_RECTS);

  scored.forEach(({ r }, i) => {
    const o = i * 4;
    out[o]     = ((r.left + r.width / 2) / vw) * 2 - 1;
    out[o + 1] = 1 - ((r.top + r.height / 2) / vh) * 2;
    out[o + 2] = (r.width / vw);
    out[o + 3] = (r.height / vh);
  });
  return out;
}
