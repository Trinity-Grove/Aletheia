import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const stylesDirectory = resolve(process.cwd(), 'src/styles');

async function readStyleFile(name: string) {
  return readFile(resolve(stylesDirectory, name), 'utf8');
}

function parseDeclarations(css: string): Map<string, string> {
  const declarations = new Map<string, string>();
  for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    declarations.set(match[1]!, match[2]!.trim());
  }
  return declarations;
}

function resolveToken(name: string, declarations: Map<string, string>, seen = new Set<string>()): string {
  if (seen.has(name)) {
    throw new Error(`Circular token reference detected at ${name}`);
  }
  const value = declarations.get(name);
  if (value === undefined) {
    throw new Error(`Unknown token: ${name}`);
  }
  const varMatch = value.match(/^var\((--[a-z0-9-]+)\)$/);
  if (!varMatch) {
    return value;
  }
  seen.add(name);
  return resolveToken(varMatch[1]!, declarations, seen);
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [R, G, B] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hexA: string, hexB: string): number {
  const luminanceA = relativeLuminance(hexToRgb(hexA));
  const luminanceB = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = luminanceA > luminanceB ? [luminanceA, luminanceB] : [luminanceB, luminanceA];
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Semantic color token WCAG contrast', () => {
  let declarations: Map<string, string>;

  beforeAll(async () => {
    const [primitive, semantic] = await Promise.all([
      readStyleFile('tokens-primitive.css'),
      readStyleFile('tokens-semantic.css'),
    ]);
    declarations = parseDeclarations(`${primitive}\n${semantic}`);
  });

  it('loads the primitive and semantic token layers', () => {
    expect(declarations.size).toBeGreaterThan(0);
  });

  // WCAG 2.2 AA requires 4.5:1 for normal text. These pairs are the
  // general-purpose text/surface combinations used across the app for
  // body copy, so they're held to the strict normal-text threshold.
  const normalTextPairs: Array<[string, string]> = [
    ['--ui-text-primary', '--ui-surface-default'],
    ['--ui-text-primary', '--ui-surface-canvas'],
    ['--ui-text-secondary', '--ui-surface-default'],
    ['--ui-text-secondary', '--ui-surface-canvas'],
    ['--ui-text-inverse', '--ui-surface-inverse'],
    ['--ui-text-brand', '--ui-surface-default'],
    ['--ui-text-link', '--ui-surface-default'],
    ['--ui-text-link-hover', '--ui-surface-default'],
    ['--ui-action-primary-foreground', '--ui-action-primary-background'],
    ['--ui-action-danger-foreground', '--ui-action-danger-background'],
  ];

  it.each(normalTextPairs)('%s on %s meets 4.5:1 (WCAG AA normal text)', (foreground, background) => {
    const fgHex = resolveToken(foreground, declarations);
    const bgHex = resolveToken(background, declarations);
    expect(contrastRatio(fgHex, bgHex)).toBeGreaterThanOrEqual(4.5);
  });

  // Status foreground/background pairs render as badges and banners, which
  // are either bold/large text or a graphical UI component — WCAG's 3:1
  // large-text / non-text-contrast threshold applies, not the 4.5:1 body
  // text minimum.
  const statusPairs: Array<[string, string]> = [
    ['--ui-status-success-foreground', '--ui-status-success-background'],
    ['--ui-status-warning-foreground', '--ui-status-warning-background'],
    ['--ui-status-danger-foreground', '--ui-status-danger-background'],
    ['--ui-status-info-foreground', '--ui-status-info-background'],
  ];

  it.each(statusPairs)('%s on %s meets 3:1 (WCAG AA large text / UI component)', (foreground, background) => {
    const fgHex = resolveToken(foreground, declarations);
    const bgHex = resolveToken(background, declarations);
    expect(contrastRatio(fgHex, bgHex)).toBeGreaterThanOrEqual(3);
  });

  // --ui-text-disabled is intentionally excluded: WCAG 2.2 Success Criterion
  // 1.4.3 explicitly exempts text/components in a disabled or inactive state.
  //
  // --ui-text-gold is intentionally excluded: it is only ever used for the
  // brand logo mark on the dark --ui-action-primary-background (not paper)
  // and for large accent numerals in the daily-journey stat cards — never
  // as normal body text on --ui-surface-default/canvas, where it would fail.
});
