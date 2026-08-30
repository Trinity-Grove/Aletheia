import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const webRoot = join(projectRoot, 'apps/web');
const nextEnvPath = join(webRoot, 'next-env.d.ts');
const nextTypesPath = join(webRoot, '.next/types/routes.d.ts');

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

test('web typecheck generates Next types from a clean checkout', async () => {
  const originalNextEnv = await exists(nextEnvPath)
    ? await readFile(nextEnvPath, 'utf8')
    : undefined;

  await rm(join(webRoot, '.next'), { force: true, recursive: true });
  await rm(nextEnvPath, { force: true });

  try {
    const typecheck = spawnSync(
      'pnpm',
      ['--filter', '@aletheia/web', 'typecheck'],
      {
        cwd: projectRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          CI: 'true',
          pnpm_config_verify_deps_before_run: 'false',
        },
        shell: process.platform === 'win32',
      },
    );

    assert.equal(typecheck.status, 0, `${typecheck.stdout}\n${typecheck.stderr}`);
    assert.equal(await exists(nextEnvPath), true, 'typecheck must generate next-env.d.ts');
    assert.equal(await exists(nextTypesPath), true, 'typecheck must generate .next route types');
  } finally {
    if (originalNextEnv === undefined) {
      await rm(nextEnvPath, { force: true });
    } else {
      await writeFile(nextEnvPath, originalNextEnv);
    }
  }
});
