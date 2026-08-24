import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ESLint } from 'eslint';
import config from './index.mjs';

test('shared config lints TypeScript product components', async () => {
  const eslint = new ESLint({
    overrideConfig: config,
    overrideConfigFile: true,
  });

  const [result] = await eslint.lintText(
    `export function ProductCard() {
      console.log('render');
      return <main>Product</main>;
    }`,
    { filePath: 'apps/web/product-card.tsx' },
  );

  assert.ok(result);
  assert.equal(
    result.messages.some(({ fatal }) => fatal),
    false,
  );
  assert.equal(
    result.messages.some(({ ruleId }) => ruleId === 'no-console'),
    true,
  );
});

test('shared config recognizes Node globals in configuration files', async () => {
  const eslint = new ESLint({
    overrideConfig: config,
    overrideConfigFile: true,
  });

  const [result] = await eslint.lintText(
    'export default Boolean(process.env.CI);',
    { filePath: 'apps/web/playwright.config.ts' },
  );

  assert.ok(result);
  assert.equal(
    result.messages.some(
      ({ ruleId, message }) =>
        ruleId === 'no-undef' && message.includes("'process'"),
    ),
    false,
  );
});
