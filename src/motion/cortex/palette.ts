export type Accent = 'volt' | 'jade';

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
};
