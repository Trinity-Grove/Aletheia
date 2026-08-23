import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { checkModuleBoundaries } from './check-module-boundaries.mjs';

test('checkModuleBoundaries detects forbidden cross-module infrastructure imports', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'boundary-test-'));
  try {
    const curriculumApp = path.join(tmpDir, 'curriculum', 'application');
    const familiesInfra = path.join(tmpDir, 'families', 'infrastructure');
    const familiesApp = path.join(tmpDir, 'families', 'application');
    fs.mkdirSync(curriculumApp, { recursive: true });
    fs.mkdirSync(familiesInfra, { recursive: true });
    fs.mkdirSync(familiesApp, { recursive: true });

    fs.writeFileSync(
      path.join(familiesInfra, 'family.repository.ts'),
      'export class FamilyRepository {}'
    );
    fs.writeFileSync(
      path.join(familiesApp, 'public-api.ts'),
      'export class FamilyPublicApi {}'
    );

    // Forbidden import
    fs.writeFileSync(
      path.join(curriculumApp, 'use-case.ts'),
      "import { FamilyRepository } from '../../families/infrastructure/family.repository';"
    );

    const violations = checkModuleBoundaries(tmpDir);
    assert.equal(violations.length, 1);
    assert.equal(violations[0], 'curriculum may not import families/infrastructure');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('checkModuleBoundaries allows public-api cross-module imports', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'boundary-test-'));
  try {
    const curriculumApp = path.join(tmpDir, 'curriculum', 'application');
    const familiesApp = path.join(tmpDir, 'families', 'application');
    fs.mkdirSync(curriculumApp, { recursive: true });
    fs.mkdirSync(familiesApp, { recursive: true });

    fs.writeFileSync(
      path.join(familiesApp, 'public-api.ts'),
      'export class FamilyPublicApi {}'
    );
    fs.writeFileSync(
      path.join(curriculumApp, 'use-case.ts'),
      "import { FamilyPublicApi } from '../../families/application/public-api';"
    );

    const violations = checkModuleBoundaries(tmpDir);
    assert.equal(violations.length, 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
