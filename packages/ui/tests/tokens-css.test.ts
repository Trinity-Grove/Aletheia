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
});
