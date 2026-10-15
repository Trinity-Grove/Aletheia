import test from 'node:test';
import assert from 'node:assert/strict';

import {
  partitionTargets,
  TargetRoutingError,
} from './run-targeted-tests.mjs';

const testIndex = [
  {
    packageName: '@aletheia/web',
    packageRoot: 'apps/web',
    relativePath: 'tests/curriculum-explore.test.tsx',
  },
  {
    packageName: '@aletheia/web',
    packageRoot: 'apps/web',
    relativePath: 'tests/product-shell.test.tsx',
  },
  {
    packageName: '@aletheia/api',
    packageRoot: 'apps/api',
    relativePath: 'src/modules/curriculum/application/curriculum.service.spec.ts',
  },
  {
    packageName: '@aletheia/api',
    packageRoot: 'apps/api',
    relativePath: 'src/modules/curriculum/infrastructure/curriculum.repository.spec.ts',
  },
  {
    packageName: '@aletheia/contracts',
    packageRoot: 'packages/contracts',
    relativePath: 'src/pedagogical-model-definition.test.ts',
  },
];

test('partitions the B07 target set by owning package', () => {
  const result = partitionTargets(
    [
      'curriculum-explore.test.tsx',
      'curriculum.service.spec.ts',
      'curriculum.repository.spec.ts',
      'pedagogical-model-definition.test.ts',
    ],
    testIndex,
  );

  assert.deepEqual(result, [
    {
      packageName: '@aletheia/web',
      packageRoot: 'apps/web',
      targets: ['tests/curriculum-explore.test.tsx'],
    },
    {
      packageName: '@aletheia/api',
      packageRoot: 'apps/api',
      targets: [
        'src/modules/curriculum/application/curriculum.service.spec.ts',
        'src/modules/curriculum/infrastructure/curriculum.repository.spec.ts',
      ],
    },
    {
      packageName: '@aletheia/contracts',
      packageRoot: 'packages/contracts',
      targets: ['src/pedagogical-model-definition.test.ts'],
    },
  ]);
});

test('preserves input order inside each package and uses stable package ordering', () => {
  const result = partitionTargets(
    [
      'curriculum.repository.spec.ts',
      'product-shell.test.tsx',
      'curriculum.service.spec.ts',
      'curriculum-explore.test.tsx',
    ],
    testIndex,
  );

  assert.deepEqual(result.map(({ packageName, targets }) => ({ packageName, targets })), [
    {
      packageName: '@aletheia/web',
      targets: ['tests/product-shell.test.tsx', 'tests/curriculum-explore.test.tsx'],
    },
    {
      packageName: '@aletheia/api',
      targets: [
        'src/modules/curriculum/infrastructure/curriculum.repository.spec.ts',
        'src/modules/curriculum/application/curriculum.service.spec.ts',
      ],
    },
  ]);
});

test('accepts explicit workspace paths and normalizes them for the package runner', () => {
  const result = partitionTargets(['apps/web/tests/product-shell.test.tsx'], testIndex);

  assert.deepEqual(result[0].targets, ['tests/product-shell.test.tsx']);
});

test('rejects an unknown target before any process is started', () => {
  assert.throws(
    () => partitionTargets(['missing.test.ts'], testIndex),
    (error) => {
      assert.ok(error instanceof TargetRoutingError);
      assert.match(error.message, /Unable to resolve targeted test/);
      assert.match(error.message, /missing\.test\.ts/);
      return true;
    },
  );
});

test('rejects an ambiguous bare target and asks for an explicit path', () => {
  const ambiguousIndex = [
    ...testIndex,
    {
      packageName: '@aletheia/api',
      packageRoot: 'apps/api',
      relativePath: 'test/pedagogical-model-definition.test.ts',
    },
  ];

  assert.throws(
    () => partitionTargets(['pedagogical-model-definition.test.ts'], ambiguousIndex),
    (error) => {
      assert.ok(error instanceof TargetRoutingError);
      assert.match(error.message, /ambiguous/i);
      assert.match(error.message, /explicit workspace path/i);
      return true;
    },
  );
});
