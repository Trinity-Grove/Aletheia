import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const IMPORT_EXPORT_REGEX = /(?:import|export)(?:\s+(?:[\w*\s{},]+)\s+from)?\s+['"]([^'"]+)['"]/g;

export function checkModuleBoundaries(modulesDir) {
  const violations = [];
  if (!fs.existsSync(modulesDir)) {
    return violations;
  }

  const moduleEntries = fs.readdirSync(modulesDir, { withFileTypes: true });
  const modules = moduleEntries.filter((d) => d.isDirectory()).map((d) => d.name);

  function walk(dir, currentModule) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, currentModule);
      } else if (entry.isFile() && fullPath.endsWith('.ts') && !fullPath.endsWith('.d.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        let match;
        IMPORT_EXPORT_REGEX.lastIndex = 0;
        while ((match = IMPORT_EXPORT_REGEX.exec(content)) !== null) {
          const specifier = match[1];
          for (const otherModule of modules) {
            if (otherModule === currentModule) continue;
            const forbiddenInfra = new RegExp(`(?:\.\./)+${otherModule}/infrastructure(?:/|$)`);
            const forbiddenDomain = new RegExp(`(?:\.\./)+${otherModule}/domain(?:/|$)`);
            const forbiddenAliasedInfra = new RegExp(`[@/]${otherModule}/infrastructure(?:/|$)`);
            const forbiddenAliasedDomain = new RegExp(`[@/]${otherModule}/domain(?:/|$)`);

            if (forbiddenInfra.test(specifier) || forbiddenAliasedInfra.test(specifier)) {
              violations.push(`${currentModule} may not import ${otherModule}/infrastructure`);
            } else if (forbiddenDomain.test(specifier) || forbiddenAliasedDomain.test(specifier)) {
              violations.push(`${currentModule} may not import ${otherModule}/domain`);
            }
          }
        }
      }
    }
  }

  for (const mod of modules) {
    const modDir = path.join(modulesDir, mod);
    walk(modDir, mod);
  }

  return violations;
}

if (process.argv[1] && process.argv[1].endsWith('check-module-boundaries.mjs')) {
  const target = process.argv[2] || path.join(process.cwd(), 'apps/api/src/modules');
  const violations = checkModuleBoundaries(target);
  if (violations.length > 0) {
    for (const v of violations) {
      console.error(v);
    }
    process.exit(1);
  } else {
    console.log('Modular monolith boundaries verified: 0 violations.');
    process.exit(0);
  }
}
