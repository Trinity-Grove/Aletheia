import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const apiRoot = join(projectRoot, 'apps/api');
const apiDist = join(apiRoot, 'dist');
const contractsDist = join(projectRoot, 'packages/contracts/dist');

async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  assert(address && typeof address === 'object');
  const { port } = address;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
}

async function waitForLiveness(url, child, output) {
  const deadline = Date.now() + 45_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      assert.fail(`API exited before liveness succeeded (${child.exitCode})\n${output()}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // The process has not opened its listener yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  assert.fail(`Timed out waiting for ${url}\n${output()}`);
}

test('a clean API package build emits and boots dist/main.js', async () => {
  await rm(apiDist, { force: true, recursive: true });
  await rm(contractsDist, { force: true, recursive: true });
  await mkdir(apiDist, { recursive: true });
  await writeFile(join(apiDist, 'stale.js'), 'stale build output\n');

  const build = spawnSync(
    'pnpm',
    ['--filter', '@aletheia/api', 'build'],
    {
      cwd: projectRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        CI: 'true',
        pnpm_config_verify_deps_before_run: 'false',
      },
    },
  );

  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);
  assert.equal(
    await readdir(apiDist).then((entries) => entries.includes('main.js')),
    true,
    'API build must emit apps/api/dist/main.js',
  );
  assert.equal(
    await readdir(apiDist).then((entries) => entries.includes('stale.js')),
    false,
    'API build must remove stale dist output',
  );
  assert.equal(
    await readdir(apiDist).then((entries) => entries.includes('apps') || entries.includes('packages')),
    false,
    'API build must not emit workspace source trees under dist',
  );
  assert.equal(
    await readdir(contractsDist).then((entries) => entries.includes('index.js')),
    true,
    'standalone API build must build @aletheia/contracts first',
  );

  const port = await availablePort();
  let stdout = '';
  let stderr = '';
  const child = spawn(process.execPath, ['dist/main.js'], {
    cwd: apiRoot,
    env: {
      ...process.env,
      DATABASE_URL: 'postgresql://smoke:smoke@127.0.0.1:1/aletheia',
      HOST: '127.0.0.1',
      NODE_ENV: 'test',
      PORT: String(port),
      npm_package_version: '0.1.0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });

  try {
    const response = await waitForLiveness(
      `http://127.0.0.1:${port}/api/v1/health/live`,
      child,
      () => `${stdout}\n${stderr}`,
    );

    const payload = await response.json();
    assert.deepEqual({
      status: payload.status,
      service: payload.service,
      version: payload.version,
    }, {
      status: 'ok',
      service: 'aletheia-api',
      version: '0.1.0',
    });
    assert.match(payload.timestamp, /Z$/);
  } finally {
    if (child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill('SIGTERM');
      await exited;
    }
  }
});
