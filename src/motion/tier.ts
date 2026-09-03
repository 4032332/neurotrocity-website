export type Tier = 'high' | 'medium' | 'low' | 'none';

export interface TierEnv {
  hasWebgl2: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  reducedMotion: boolean;
  maxTextureSize: number;
}

export const TIER_BUDGET = {
  high:   { fibresPerCluster: 104, maxPulses: 300, dust: 440, dpr: 2 },
  medium: { fibresPerCluster: 64,  maxPulses: 180, dust: 260, dpr: 1.5 },
  low:    { fibresPerCluster: 34,  maxPulses: 90,  dust: 120, dpr: 1 },
  none:   { fibresPerCluster: 0,   maxPulses: 0,   dust: 0,   dpr: 1 },
} as const;

export function detectTier(env: TierEnv): Tier {
  if (!env.hasWebgl2 || env.reducedMotion || env.maxTextureSize < 2048) return 'none';
  const mem = env.deviceMemory ?? 4;
  const cores = env.hardwareConcurrency ?? 4;
  if (mem <= 2 || cores <= 2) return 'low';
  if (mem <= 4 || cores <= 4) return 'medium';
  return 'high';
}
