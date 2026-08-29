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
});
