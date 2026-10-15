import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PACKAGE_DEFINITIONS = [
  {
    packageName: '@aletheia/web',
    packageRoot: 'apps/web',
    testRoot: 'tests',
    testFilePattern: /\.(?:test|spec)\.tsx?$/i,
  },
  {
    packageName: '@aletheia/api',
    packageRoot: 'apps/api',
    testRoot: 'src',
    testFilePattern: /\.spec\.ts$/i,
  },
  {
    packageName: '@aletheia/contracts',
    packageRoot: 'packages/contracts',
    testRoot: 'src',
    testFilePattern: /\.(?:test|spec)\.ts$/i,
  },
];

const GLOB_META = /[*?]/;

export class TargetRoutingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TargetRoutingError';
  }
}

function normalizePath(value) {
  return value.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/+/g, '/');
}

function packageDefinitionForName(packageName) {
  return PACKAGE_DEFINITIONS.find((definition) => definition.packageName === packageName);
}

function parseTarget(target) {
  const normalized = normalizePath(String(target).trim());
  const packageQualified = normalized.match(/^(@aletheia\/[^:]+):(.+)$/);

  if (packageQualified) {
    const definition = packageDefinitionForName(packageQualified[1]);
    if (!definition) {
      throw new TargetRoutingError(
        `Unknown package-qualified targeted test "${target}". Use one of: ${PACKAGE_DEFINITIONS.map(({ packageName }) => packageName).join(', ')}.`,
      );
    }

    return {
      value: normalizePath(packageQualified[2]),
      explicitPackage: definition,
    };
  }

  const workspacePath = PACKAGE_DEFINITIONS.find(
    ({ packageRoot }) => normalized === packageRoot || normalized.startsWith(`${packageRoot}/`),
  );

  return {
    value: workspacePath
      ? normalized.slice(workspacePath.packageRoot.length).replace(/^\//, '')
      : normalized,
    explicitPackage: workspacePath,
  };
}

function globToRegExp(pattern) {
  let expression = '^';

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];

    if (character === '*') {
      if (pattern[index + 1] === '*') {
        expression += '.*';
        index += 1;
      } else {
        expression += '[^/]*';
      }
      continue;
    }

    if (character === '?') {
      expression += '[^/]';
      continue;
    }

    expression += character.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
  }

  return new RegExp(`${expression}$`, 'i');
}

function matchesTarget(parsedTarget, entry) {
  const targetValue = parsedTarget.value;
  const candidate = normalizePath(entry.relativePath);
  const candidateBasename = path.posix.basename(candidate);
  const pattern = GLOB_META.test(targetValue) ? globToRegExp(targetValue) : null;

  if (pattern) {
    return pattern.test(targetValue.includes('/') ? candidate : candidateBasename);
  }

  if (targetValue.includes('/')) {
    return candidate.toLowerCase() === targetValue.toLowerCase();
  }

  return candidateBasename.toLowerCase() === targetValue.toLowerCase();
}

function packageTargetFor(parsedTarget, entry) {
  if (parsedTarget.explicitPackage) {
    return parsedTarget.value;
  }

  if (GLOB_META.test(parsedTarget.value)) {
    return parsedTarget.value;
  }

  return entry.relativePath;
}

function resolveOneTarget(target, testIndex) {
  if (!String(target).trim()) {
    throw new TargetRoutingError('Targeted tests require at least one non-empty filename or pattern.');
  }

  const parsedTarget = parseTarget(target);
  const candidates = testIndex.filter((entry) => {
    if (parsedTarget.explicitPackage && entry.packageName !== parsedTarget.explicitPackage.packageName) {
      return false;
    }

    return matchesTarget(parsedTarget, entry);
  });

  const packages = [...new Map(candidates.map((entry) => [entry.packageName, entry])).values()];

  if (packages.length === 0) {
    throw new TargetRoutingError(
      `Unable to resolve targeted test "${target}". Use a test filename/pattern from apps/web/tests, apps/api/src, or packages/contracts/src.`,
    );
  }

  if (packages.length > 1) {
    throw new TargetRoutingError(
      `Targeted test "${target}" is ambiguous across ${packages.map(({ packageName }) => packageName).join(', ')}. Use an explicit workspace path such as apps/web/tests/example.test.tsx.`,
    );
  }

  const [entry] = packages;
  return {
    packageName: entry.packageName,
    packageRoot: entry.packageRoot,
    target: packageTargetFor(parsedTarget, entry),
  };
}

export function partitionTargets(targets, testIndex) {
  if (!Array.isArray(targets) || targets.length === 0) {
    throw new TargetRoutingError(
      'No targeted tests were provided. Usage: pnpm test:targeted -- <test-file-or-pattern> [...more-targets].',
    );
  }

  const groups = new Map();
  const resolvedTestIndex = testIndex ?? buildTestIndex();

  for (const target of targets) {
    const resolved = resolveOneTarget(target, resolvedTestIndex);
    const group = groups.get(resolved.packageName) ?? {
      packageName: resolved.packageName,
      packageRoot: resolved.packageRoot,
      targets: [],
    };

    if (!group.targets.includes(resolved.target)) {
      group.targets.push(resolved.target);
    }
    groups.set(resolved.packageName, group);
  }

  return PACKAGE_DEFINITIONS
    .map(({ packageName }) => groups.get(packageName))
    .filter(Boolean);
}

function walkFiles(rootDirectory, relativeDirectory = '') {
  const directory = path.join(rootDirectory, relativeDirectory);
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = relativeDirectory ? path.join(relativeDirectory, entry.name) : entry.name;

    if (entry.isDirectory()) {
      files.push(...walkFiles(rootDirectory, relativePath));
    } else {
      files.push(normalizePath(relativePath));
    }
  }

  return files;
}

export function buildTestIndex(repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)))) {
  return PACKAGE_DEFINITIONS.flatMap((definition) => {
    const packageDirectory = path.join(repoRoot, definition.packageRoot);
    const files = walkFiles(packageDirectory, definition.testRoot);

    return files
      .filter((relativePath) => definition.testFilePattern.test(relativePath))
      .map((relativePath) => ({
        packageName: definition.packageName,
        packageRoot: definition.packageRoot,
        relativePath,
      }));
  });
}

export function runTargetedTests({
  targets,
  testIndex,
  repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url))),
  spawn = spawnSync,
  platform = process.platform,
  comSpec = process.env.ComSpec ?? 'cmd.exe',
} = {}) {
  const groups = partitionTargets(targets, testIndex ?? buildTestIndex(repoRoot));
  const pnpmExecutable = platform === 'win32' ? comSpec : 'pnpm';
  const pnpmPrefix = platform === 'win32' ? ['/d', '/s', '/c', 'pnpm.cmd'] : [];

  for (const group of groups) {
    console.log(`\n[targeted-tests] ${group.packageName}: ${group.targets.join(', ')}`);
    const packageArguments = ['--filter', group.packageName, 'test'];
    if (platform !== 'win32') {
      packageArguments.push('--');
    }
    packageArguments.push(...group.targets);

    const result = spawn(
      pnpmExecutable,
      [...pnpmPrefix, ...packageArguments],
      { cwd: repoRoot, stdio: 'inherit', windowsHide: true },
    );

    if (result.error) {
      console.error(`[targeted-tests] failed to start ${group.packageName}: ${result.error.message}`);
      return 1;
    }

    if (result.signal) {
      console.error(`[targeted-tests] ${group.packageName} terminated by ${result.signal}`);
      return 1;
    }

    if (result.status !== 0) {
      return result.status ?? 1;
    }
  }

  return 0;
}

function main() {
  const rawTargets = process.argv.slice(2);
  const targets = rawTargets[0] === '--' ? rawTargets.slice(1) : rawTargets;

  try {
    process.exitCode = runTargetedTests({ targets });
  } catch (error) {
    if (error instanceof TargetRoutingError) {
      console.error(`[targeted-tests] ${error.message}`);
      process.exitCode = 2;
      return;
    }

    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
