import { describe, it, expect } from 'vitest';
import { buildClusters, pointAt } from '../../src/motion/cortex/geometry';

const rng = () => 0.5;   // deterministic

describe('buildClusters', () => {
  it('builds three clusters with the budgeted fibre count', () => {
    const cs = buildClusters({ fibresPerCluster: 10 }, rng);
    expect(cs).toHaveLength(3);
    for (const c of cs) expect(c.fibres).toHaveLength(10);
  });
  it('roots every fibre at its cluster origin', () => {
    for (const c of buildClusters({ fibresPerCluster: 5 }, rng)) {
      for (const f of c.fibres) expect(f.pts[0]).toEqual(c.origin);
    }
  });
  it('records a positive arc length matching the polyline', () => {
    const f = buildClusters({ fibresPerCluster: 1 }, Math.random)[0].fibres[0];
    let sum = 0;
    for (let i = 1; i < f.pts.length; i++) {
      const a = f.pts[i - 1], b = f.pts[i];
      sum += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    }
    expect(f.len).toBeCloseTo(sum, 5);
  });
});

describe('pointAt', () => {
  it('returns the origin at t=0 and the tip at t=1', () => {
    const f = buildClusters({ fibresPerCluster: 1 }, Math.random)[0].fibres[0];
    expect(pointAt(f, 0)).toEqual(f.pts[0]);
    const tip = pointAt(f, 1), last = f.pts[f.pts.length - 1];
    expect(tip.x).toBeCloseTo(last.x, 4);
  });
  it('is monotonic in arc length', () => {
    const f = buildClusters({ fibresPerCluster: 1 }, Math.random)[0].fibres[0];
    let prev = pointAt(f, 0), travelled = 0;
    for (let t = 0.1; t <= 1.0001; t += 0.1) {
      const p = pointAt(f, t);
      travelled += Math.hypot(p.x - prev.x, p.y - prev.y, p.z - prev.z);
      prev = p;
    }
    expect(travelled).toBeCloseTo(f.len, 1);
  });
});
