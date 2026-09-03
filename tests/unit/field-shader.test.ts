import { describe, it, expect } from 'vitest';
import { FIELD_FRAG } from '../../src/motion/cortex/field.glsl';

describe('FIELD_FRAG structural sanity', () => {
  it('declares the uQuiet uniform', () => {
    expect(FIELD_FRAG).toContain('uniform vec4 uQuiet[8]');
  });

  it('defines quietness(', () => {
    expect(FIELD_FRAG).toContain('quietness(');
  });

  it('applies the 0.16 floor mix', () => {
    expect(FIELD_FRAG).toContain('mix(0.16, 1.0,');
  });

  it('starts with the precision directive', () => {
    expect(FIELD_FRAG.startsWith('precision highp float;')).toBe(true);
  });

  it('has balanced braces', () => {
    const opens = (FIELD_FRAG.match(/{/g) || []).length;
    const closes = (FIELD_FRAG.match(/}/g) || []).length;
    expect(opens).toBe(closes);
  });
});
