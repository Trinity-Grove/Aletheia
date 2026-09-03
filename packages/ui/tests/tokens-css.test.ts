import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const stylesDirectory = resolve(process.cwd(), 'src/styles');

async function readStyleFile(name: string) {
  return readFile(resolve(stylesDirectory, name), 'utf8');
}

describe('CSS token layer contract', () => {
  it('imports the primitive, semantic, and component layers in dependency order', async () => {
    const entry = await readStyleFile('tokens.css');

    expect(entry.trim()).toBe([
      "@import './tokens-primitive.css';",
      "@import './tokens-semantic.css';",
      "@import './tokens-component.css';",
    ].join('\n'));
  });

  it('publishes the required UI semantic contracts without leaking primitives into component tokens', async () => {
    const [primitive, semantic, component, componentStyles] = await Promise.all([
      readStyleFile('tokens-primitive.css'),
      readStyleFile('tokens-semantic.css'),
      readStyleFile('tokens-component.css'),
      readStyleFile('components.css'),
    ]);
    const allLayers = [primitive, semantic, component].join('\n');

    for (const token of [
      '--ui-action-primary-background',
      '--ui-control-disabled-opacity',
      '--ui-focus-ring',
      '--ui-motion-duration-fast',
      '--ui-breakpoint-md',
      '--ui-scrim-background',
      '--ui-selection-background',
      '--ui-elevation-overlay',
    ]) {
      expect(allLayers).toContain(token);
    }

    expect(component).not.toMatch(/var\(--primitive-/);
    expect(componentStyles).not.toMatch(/var\(--primitive-/);
  });

  it('aliases the raw brand-palette names apps/web consumes directly (issue #25)', async () => {
    const semantic = await readStyleFile('tokens-semantic.css');

    for (const [alias, primitiveRef] of [
      ['--forest', '--primitive-color-forest-700'],
      ['--forest-2', '--primitive-color-forest-800'],
      ['--forest-dark', '--primitive-color-forest-900'],
      ['--sage', '--primitive-color-sage-500'],
      ['--sage-light', '--primitive-color-sage-200'],
      ['--sage-soft', '--primitive-color-sage-100'],
      ['--gold', '--primitive-color-gold-500'],
      ['--gold-soft', '--primitive-color-gold-200'],
      ['--gold-muted', '--primitive-color-gold-300'],
      ['--ivory', '--primitive-color-ivory'],
      ['--paper', '--primitive-color-paper'],
      ['--ink', '--primitive-color-ink'],
      ['--muted', '--primitive-color-muted'],
      ['--line', '--primitive-color-border-light'],
      ['--line-strong', '--primitive-color-border-medium'],
    ] as const) {
      const declaration = new RegExp(`${alias}:\\s*var\\(${primitiveRef}\\);`);
      expect(semantic, `expected ${alias} to alias var(${primitiveRef})`).toMatch(declaration);
    }
  });

  it('uses drawer and dropdown component contracts instead of legacy aliases', async () => {
    const [component, componentStyles] = await Promise.all([
      readStyleFile('tokens-component.css'),
      readStyleFile('components.css'),
    ]);
    const drawerStyles = componentStyles.match(
      /\/\* --------------------------------------------------------------------------\n   UI Drawer[\s\S]*?(?=\/\* --------------------------------------------------------------------------\n   UI Dropdown)/,
    )?.[0];
    const dropdownStyles = componentStyles.match(
      /\/\* --------------------------------------------------------------------------\n   UI Dropdown[\s\S]*?(?=\/\* --------------------------------------------------------------------------\n   UI Tooltip)/,
    )?.[0];

    expect(drawerStyles).toBeDefined();
    expect(dropdownStyles).toBeDefined();

    for (const token of [
      '--ui-drawer-width',
      '--ui-drawer-width-sm',
      '--ui-drawer-width-md',
      '--ui-drawer-width-lg',
      '--ui-dropdown-background',
      '--ui-dropdown-item-foreground',
    ]) {
      expect(component).toContain(token);
    }

    expect(drawerStyles).toContain('var(--ui-drawer-width)');
    expect(drawerStyles).toContain('var(--ui-drawer-width-sm)');
    expect(drawerStyles).toContain('var(--ui-drawer-width-md)');
    expect(drawerStyles).toContain('var(--ui-drawer-width-lg)');
    expect(dropdownStyles).not.toMatch(/var\(--color-danger-/);
    expect(dropdownStyles).toContain('var(--ui-status-danger-foreground)');
    expect(dropdownStyles).toContain('var(--ui-status-danger-background)');
  });

  it('publishes the primitive type scale and consumes stable shared-pattern contracts', async () => {
    const [primitive, component, componentStyles] = await Promise.all([
      readStyleFile('tokens-primitive.css'),
      readStyleFile('tokens-component.css'),
      readStyleFile('components.css'),
    ]);
    const patternStyles = componentStyles.match(
      /\/\* --------------------------------------------------------------------------\n   UI Domain Patterns[\s\S]*?(?=@keyframes ui-slide-left)/,
    )?.[0];

    expect(patternStyles).toBeDefined();

    for (const token of [
      '--primitive-font-size-xs',
      '--primitive-font-size-sm',
      '--primitive-font-size-base',
      '--primitive-font-size-md',
      '--primitive-font-size-lg',
      '--primitive-font-size-xl',
      '--primitive-font-size-2xl',
      '--primitive-font-size-3xl',
      '--primitive-font-size-4xl',
      '--primitive-font-size-5xl',
      '--primitive-line-height-none',
      '--primitive-line-height-tight',
      '--primitive-line-height-snug',
      '--primitive-line-height-normal',
      '--primitive-line-height-relaxed',
      '--primitive-line-height-loose',
    ]) {
      expect(primitive).toContain(token);
    }

    for (const token of [
      '--ui-daily-journey-subtitle-font-size',
      '--ui-daily-journey-subtitle-foreground',
      '--ui-daily-journey-stat-font-family',
      '--ui-daily-journey-stat-primary-foreground',
      '--ui-activity-list-subtitle-font-size',
      '--ui-activity-list-item-background',
      '--ui-activity-list-item-completed-border',
      '--ui-activity-list-checkbox-foreground',
      '--ui-activity-list-title-font-size',
    ]) {
      expect(component).toContain(token);
      expect(patternStyles).toContain(`var(${token})`);
    }

    expect(patternStyles).not.toMatch(/var\(--(?:bg|text|border|color|font|radius)-/);
    expect(patternStyles).not.toMatch(/#ffffff/i);
  });
});
