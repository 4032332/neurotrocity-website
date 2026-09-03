export interface DOMRectLike { top: number; height: number }

/** A gentle S through the gutter, overshooting the viewport so no end cap ever shows. */
export function spinePath(w: number, h: number): string {
  const x = w * 0.52;
  return `M ${x} -40 ` +
    `C ${x - 22} ${h * 0.24} ${x + 24} ${h * 0.42} ${x} ${h * 0.56} ` +
    `C ${x - 20} ${h * 0.72} ${x + 18} ${h * 0.88} ${x} ${h + 40}`;
}

/** Where along the viewport (0 top .. 1 bottom) a section's soma should sit. */
export function somaFraction(r: DOMRectLike, vh: number): number {
  const y = r.top + Math.min(r.height * 0.5, vh * 0.34);
  return Math.max(0, Math.min(1, y / Math.max(1, vh)));
}
