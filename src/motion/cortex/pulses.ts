import type { Fibre } from './geometry';

export interface Pulse { f: number; t: number; v: number; dir: 1 | -1 }
export interface Arrival { cluster: number; fibre: number }
export interface PulseState { fibres: Fibre[]; pulses: Pulse[]; max: number }

export function createState(fibres: Fibre[], max: number): PulseState {
  return { fibres, pulses: [], max };
}

export function spawn(s: PulseState, fibreIndex: number, outward: boolean): void {
  if (s.pulses.length >= s.max) return;
  const len = s.fibres[fibreIndex].len || 1;
  s.pulses.push({
    f: fibreIndex,
    t: outward ? 0 : 1,
    v: (0.55 + Math.random() * 0.75) / len,
    dir: outward ? 1 : -1,
  });
}

/** Advances every pulse. Returns the somata reached by an INBOUND pulse this frame. */
export function advance(s: PulseState, dt: number): Arrival[] {
  const arrivals: Arrival[] = [];
  for (let i = s.pulses.length - 1; i >= 0; i--) {
    const p = s.pulses[i];
    p.t += p.v * p.dir * dt;
    if (p.t <= 0) {
      arrivals.push({ cluster: s.fibres[p.f].cluster, fibre: p.f });
      s.pulses.splice(i, 1);
    } else if (p.t >= 1) {
      s.pulses.splice(i, 1);          // outbound reached the tip — no arrival
    }
  }
  return arrivals;
}
