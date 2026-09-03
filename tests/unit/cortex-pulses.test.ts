import { describe, it, expect } from 'vitest';
import { buildClusters } from '../../src/motion/cortex/geometry';
import { advance, spawn, createState } from '../../src/motion/cortex/pulses';

const clusters = buildClusters({ fibresPerCluster: 4 }, Math.random);
const fibres = clusters.flatMap(c => c.fibres);

describe('pulse simulation', () => {
  it('reports an arrival only when an inbound pulse reaches the soma', () => {
    const s = createState(fibres, 50);
    spawn(s, 0, /* outward */ false);           // inbound, starts at t=1
    let arrivals = advance(s, 0.016);
    expect(arrivals).toHaveLength(0);           // still travelling
    for (let i = 0; i < 2000 && arrivals.length === 0; i++) arrivals = advance(s, 0.016);
    expect(arrivals).toEqual([{ cluster: fibres[0].cluster, fibre: 0 }]);
  });

  it('never reports an arrival for an outbound pulse', () => {
    const s = createState(fibres, 50);
    spawn(s, 0, true);
    for (let i = 0; i < 2000; i++) expect(advance(s, 0.016)).toHaveLength(0);
    expect(s.pulses).toHaveLength(0);           // it expired at the tip
  });

  it('respects the pulse budget', () => {
    const s = createState(fibres, 5);
    for (let i = 0; i < 50; i++) spawn(s, i % fibres.length, true);
    expect(s.pulses.length).toBeLessThanOrEqual(5);
  });

  it('is frame-rate independent', () => {
    const a = createState(fibres, 50), b = createState(fibres, 50);
    spawn(a, 0, true); spawn(b, 0, true);
    a.pulses[0].v = b.pulses[0].v = 0.5;
    for (let i = 0; i < 10; i++) advance(a, 0.032);
    for (let i = 0; i < 20; i++) advance(b, 0.016);
    expect(a.pulses[0]?.t ?? 1).toBeCloseTo(b.pulses[0]?.t ?? 1, 5);
  });
});
