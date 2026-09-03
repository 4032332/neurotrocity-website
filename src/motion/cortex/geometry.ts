export interface Vec3 { x: number; y: number; z: number }
/** `cum[i]` is the arc length from the origin to `pts[i]`; `cum[0] === 0`, `cum[last] === len`. */
export interface Fibre { pts: Vec3[]; cluster: number; len: number; cum: Float64Array }
export interface Cluster { origin: Vec3; fibres: Fibre[]; accent: 'volt' | 'cyan' | 'ember' }

const ORIGINS: { origin: Vec3; accent: Cluster['accent'] }[] = [
  { origin: { x: -1.62, y:  0.44, z:  0.30 }, accent: 'volt'  },
  { origin: { x:  1.48, y: -0.34, z: -0.55 }, accent: 'cyan'  },
  { origin: { x:  0.12, y:  1.16, z: -1.30 }, accent: 'ember' },
];

export function buildClusters(budget: { fibresPerCluster: number }, rng: () => number): Cluster[] {
  return ORIGINS.map((o, ci) => {
    const fibres: Fibre[] = [];
    for (let i = 0; i < budget.fibresPerCluster; i++) {
      const pts: Vec3[] = [o.origin];
      let dx = rng() - 0.5, dy = rng() - 0.5, dz = rng() - 0.5;
      const m = Math.hypot(dx, dy, dz) || 1, s0 = (0.30 + rng() * 0.34) / m;
      dx *= s0; dy *= s0; dz *= s0;
      const steps = 4 + (i % 4);
      const cum = new Float64Array(steps + 1);
      let a = o.origin, len = 0;
      for (let s = 0; s < steps; s++) {
        dx += (rng() - 0.5) * 0.30; dy += (rng() - 0.5) * 0.30; dz += (rng() - 0.5) * 0.30;
        const b = { x: a.x + dx, y: a.y + dy, z: a.z + dz };
        len += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
        cum[s + 1] = len;
        pts.push(b); a = b;
      }
      fibres.push({ pts, cluster: ci, len, cum });
    }
    return { origin: o.origin, fibres, accent: o.accent };
  });
}

/**
 * Allocation-free walk along the fibre: writes the point at normalised arc
 * length `t` into `out` and returns it. Uses the precomputed cumulative
 * lengths, so the per-call cost is a short linear scan with no `hypot`.
 * This is the hot path — it runs once per live pulse per frame.
 */
export function pointAtInto(f: Fibre, t: number, out: Vec3): Vec3 {
  const target = Math.max(0, Math.min(1, t)) * f.len;
  const cum = f.cum, last = f.pts.length - 1;
  let i = 1;
  while (i < last && cum[i] < target) i++;
  const a = f.pts[i - 1], b = f.pts[i];
  const seg = cum[i] - cum[i - 1];
  const lt = seg > 0 ? Math.max(0, Math.min(1, (target - cum[i - 1]) / seg)) : 0;
  out.x = a.x + (b.x - a.x) * lt;
  out.y = a.y + (b.y - a.y) * lt;
  out.z = a.z + (b.z - a.z) * lt;
  return out;
}

/** Allocating convenience wrapper around `pointAtInto`; keep to tests and one-offs. */
export function pointAt(f: Fibre, t: number): Vec3 {
  return pointAtInto(f, t, { x: 0, y: 0, z: 0 });
}
