import { describe, expect, it } from 'vitest';
import {
  brandColors,
  fontFamilies,
  radii,
  shadows,
  spacing,
  surfaceColors,
} from './index.js';

describe('Design Tokens Contract', () => {
  it('defines the official Trinity Grove palette colors', () => {
    expect(brandColors.forest).toBe('#123f34');
    expect(brandColors.forest2).toBe('#0c3028');
    expect(brandColors.sage).toBe('#78937f');
    expect(brandColors.gold).toBe('#d3a526');
    expect(brandColors.ivory).toBe('#fbf8ef');
    expect(brandColors.paper).toBe('#fffdf7');
    expect(brandColors.ink).toBe('#17312a');
  });

  it('defines semantic surfaces mapped to brand colors', () => {
    expect(surfaceColors.canvas).toBe(brandColors.ivory);
    expect(surfaceColors.surface).toBe(brandColors.paper);
  });

  it('defines font families for serif, sans, and mono without circular dependencies', () => {
    expect(fontFamilies.serif).toContain('Lora');
    expect(fontFamilies.sans).toContain('Plus Jakarta Sans');
  });

  it('defines spacing scale with valid CSS units', () => {
    expect(spacing[0]).toBe('0rem');
    expect(spacing[4]).toBe('1rem');
    expect(spacing[8]).toBe('2rem');
  });

  it('defines shadow elevations and border radii', () => {
    expect(shadows.sm).toBeDefined();
    expect(shadows.lg).toBeDefined();
    expect(radii.md).toBe('6px');
    expect(radii.full).toBe('9999px');
  });
});
