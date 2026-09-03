export interface Vec3 { x: number; y: number; z: number }
export interface Fibre { pts: Vec3[]; cluster: number; len: number }
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
      let a = o.origin, len = 0;
      for (let s = 0; s < steps; s++) {
        dx += (rng() - 0.5) * 0.30; dy += (rng() - 0.5) * 0.30; dz += (rng() - 0.5) * 0.30;
        const b = { x: a.x + dx, y: a.y + dy, z: a.z + dz };
        len += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
        pts.push(b); a = b;
      }
      fibres.push({ pts, cluster: ci, len });
    }
    return { origin: o.origin, fibres, accent: o.accent };
  });
}

export function pointAt(f: Fibre, t: number): Vec3 {
  const target = Math.max(0, Math.min(1, t)) * f.len;
  let acc = 0;
  for (let i = 1; i < f.pts.length; i++) {
    const a = f.pts[i - 1], b = f.pts[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    if (acc + seg >= target || i === f.pts.length - 1) {
      const lt = seg > 0 ? Math.max(0, Math.min(1, (target - acc) / seg)) : 0;
      return { x: a.x + (b.x - a.x) * lt, y: a.y + (b.y - a.y) * lt, z: a.z + (b.z - a.z) * lt };
    }
    acc += seg;
  }
  return f.pts[0];
}
