export type Accent = 'volt' | 'jade' | 'ember' | 'violet' | 'flare';

export interface Palette {
  /** Hex colours for the three clusters, in ORIGINS order. */
  clusters: readonly [number, number, number];
  /** Field shader endpoints: sRGB hex / 255, written straight to gl_FragColor
   *  (the ShaderMaterial does no colourspace conversion), so NOT linear RGB. */
  c1: readonly [number, number, number];
  c2: readonly [number, number, number];
  dust: number;
}

export const PALETTES: Record<Accent, Palette> = {
  volt: {
    clusters: [0x7C6BFF, 0x38E1D6, 0xFF8A4C],
    c1: [0.486, 0.420, 1.0],
    c2: [0.220, 0.882, 0.839],
    dust: 0x8F86D8,
  },
  jade: {
    clusters: [0x22C489, 0x38E1D6, 0x7C6BFF],
    c1: [0.133, 0.769, 0.537],
    c2: [0.220, 0.882, 0.839],
    dust: 0x6FB8A0,
  },
  ember: {
    clusters: [0xFF8A4C, 0x38E1D6, 0x7C6BFF],
    c1: [1.0, 0.541, 0.298],
    c2: [0.220, 0.882, 0.839],
    dust: 0xD8A186,
  },
  violet: {
    clusters: [0xB45CFF, 0xFF4FA3, 0xFF8A4C],
    c1: [0.706, 0.361, 1.0],
    // Rose rather than the shared cyan: with a cyan second endpoint the field
    // reads green whatever the accent is, which put this page next to Rewire.
    c2: [1.0, 0.310, 0.639],
    dust: 0xB98CD8,
  },
  flare: {
    clusters: [0xFF3B2F, 0xFFC93C, 0xFF4FA3],
    c1: [1.0, 0.231, 0.184],
    // Hazard yellow, not the shared cyan, so the field reads crime-scene red
    // and tape yellow rather than drifting green next to Rewire.
    c2: [1.0, 0.788, 0.235],
    dust: 0xD88A86,
  },
};
