import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative, dirname, sep } from 'node:path';

const projectRoot = process.cwd();
const modulesRoot = resolve(projectRoot, 'apps/api/src/modules');

async function findTypeScriptFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  const files = await Promise.all(entries
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(async (entry) => {
      const entryPath = resolve(directory, entry.name);
      if (entry.isDirectory()) return findTypeScriptFiles(entryPath);
      return entry.isFile() && entry.name.endsWith('.ts') ? [entryPath] : [];
    }));

  return files.flat();
}

function pathWithinModules(candidatePath) {
  const moduleRelativePath = relative(modulesRoot, candidatePath);
  return moduleRelativePath && !moduleRelativePath.startsWith(`..${sep}`) && moduleRelativePath !== '..'
    ? moduleRelativePath.split(sep)
    : undefined;
}

function destinationFor(sourceFile, specifier) {
  if (specifier.startsWith('.')) return pathWithinModules(resolve(dirname(sourceFile), specifier));

  const aliasModulePath = specifier.match(/(?:^|[\/@])modules\/(.*)$/);
  if (!aliasModulePath) return undefined;

  return pathWithinModules(resolve(modulesRoot, aliasModulePath[1]));
}

function moduleNameFor(sourceFile) {
  return pathWithinModules(sourceFile)?.[0];
}

function isIdentifierCharacter(character) {
  return Boolean(character) && /[A-Za-z0-9_$]/.test(character);
}

function skipTrivia(source, start) {
  let cursor = start;

  while (cursor < source.length) {
    if (/\s/.test(source[cursor])) {
      cursor += 1;
    } else if (source.startsWith('//', cursor)) {
      cursor = source.indexOf('\n', cursor + 2);
      if (cursor === -1) return source.length;
    } else if (source.startsWith('/*', cursor)) {
      const end = source.indexOf('*/', cursor + 2);
      cursor = end === -1 ? source.length : end + 2;
    } else {
      break;
    }
  }

  return cursor;
}

function readQuotedLiteral(source, start) {
  const quote = source[start];
  let cursor = start + 1;
  let value = '';

  while (cursor < source.length) {
    const character = source[cursor];
    if (character === '\\') {
      value += source[cursor + 1] ?? '';
      cursor += 2;
    } else if (character === quote) {
      return { end: cursor + 1, value };
    } else {
      value += character;
      cursor += 1;
    }
  }

  return { end: source.length, value };
}

function readTemplateExpression(source, start) {
  let cursor = start;
  let depth = 1;

  while (cursor < source.length && depth > 0) {
    cursor = skipTrivia(source, cursor);
    const character = source[cursor];

    if (character === "'" || character === '"') {
      cursor = readQuotedLiteral(source, cursor).end;
    } else if (character === '`') {
      cursor = readTemplateLiteral(source, cursor).end;
    } else if (character === '{') {
      depth += 1;
      cursor += 1;
    } else if (character === '}') {
      depth -= 1;
      cursor += 1;
    } else {
      cursor += 1;
    }
  }

  return cursor;
}

function readTemplateLiteral(source, start) {
  let cursor = start + 1;
  let value = '';

  while (cursor < source.length) {
    const character = source[cursor];
    if (character === '\\') {
      value += source[cursor + 1] ?? '';
      cursor += 2;
    } else if (character === '`') {
      return { end: cursor + 1, value };
    } else if (character === '$' && source[cursor + 1] === '{') {
      cursor = readTemplateExpression(source, cursor + 2);
    } else {
      value += character;
      cursor += 1;
    }
  }

  return { end: source.length, value };
}

function readSpecifier(source, start) {
  const cursor = skipTrivia(source, start);
  if (source[cursor] === "'" || source[cursor] === '"') return readQuotedLiteral(source, cursor);
  if (source[cursor] === '`') return readTemplateLiteral(source, cursor);
  return undefined;
}

function readWord(source, start) {
  let cursor = start;
  while (isIdentifierCharacter(source[cursor])) cursor += 1;
  return { end: cursor, value: source.slice(start, cursor) };
}

function readSpecifierAfterFrom(source, start) {
  let cursor = start;

  while (cursor < source.length) {
    cursor = skipTrivia(source, cursor);
    const character = source[cursor];
    if (character === ';') return undefined;
    if (character === "'" || character === '"') {
      cursor = readQuotedLiteral(source, cursor).end;
    } else if (character === '`') {
      cursor = readTemplateLiteral(source, cursor).end;
    } else if (isIdentifierCharacter(character)) {
      const word = readWord(source, cursor);
      if (word.value === 'from') return readSpecifier(source, word.end);
      cursor = word.end;
    } else {
      cursor += 1;
    }
  }

  return undefined;
}

function readImportEqualsSpecifier(source, start) {
  let cursor = skipTrivia(source, start);
  if (!isIdentifierCharacter(source[cursor])) return undefined;

  cursor = skipTrivia(source, readWord(source, cursor).end);
  if (source[cursor] !== '=') return undefined;

  cursor = skipTrivia(source, cursor + 1);
  if (!isIdentifierCharacter(source[cursor])) return undefined;

  const requireWord = readWord(source, cursor);
  if (requireWord.value !== 'require') return undefined;

  cursor = skipTrivia(source, requireWord.end);
  if (source[cursor] !== '(') return undefined;

  return readSpecifier(source, cursor + 1);
}

function importSpecifiers(source) {
  const importEqualsSpecifiers = [];
  const requireSpecifiers = [];
  const staticSpecifiers = [];
  const dynamicSpecifiers = [];
  let cursor = 0;

  while (cursor < source.length) {
    cursor = skipTrivia(source, cursor);
    const character = source[cursor];

    if (character === "'" || character === '"') {
      cursor = readQuotedLiteral(source, cursor).end;
    } else if (character === '`') {
      cursor = readTemplateLiteral(source, cursor).end;
    } else if (isIdentifierCharacter(character)) {
      const word = readWord(source, cursor);
      const afterWord = skipTrivia(source, word.end);

      if (word.value === 'import' && source[afterWord] === '(') {
        const specifier = readSpecifier(source, afterWord + 1);
        if (specifier) {
          dynamicSpecifiers.push(specifier.value);
          cursor = specifier.end;
          continue;
        }
      } else if (word.value === 'import') {
        const importEqualsSpecifier = readImportEqualsSpecifier(source, afterWord);
        if (importEqualsSpecifier) {
          importEqualsSpecifiers.push(importEqualsSpecifier.value);
          cursor = importEqualsSpecifier.end;
          continue;
        }

        const directSpecifier = readSpecifier(source, afterWord);
        const specifier = directSpecifier ?? readSpecifierAfterFrom(source, afterWord);
        if (specifier) {
          staticSpecifiers.push(specifier.value);
          cursor = specifier.end;
          continue;
        }
      } else if (word.value === 'export') {
        const specifier = readSpecifierAfterFrom(source, afterWord);
        if (specifier) {
          staticSpecifiers.push(specifier.value);
          cursor = specifier.end;
          continue;
        }
      } else if (word.value === 'require' && source[afterWord] === '(') {
        const specifier = readSpecifier(source, afterWord + 1);
        if (specifier) {
          requireSpecifiers.push(specifier.value);
          cursor = specifier.end;
          continue;
        }
      }

      cursor = word.end;
    } else {
      cursor += 1;
    }
  }

  return {
    dynamicSpecifiers,
    importEqualsSpecifiers,
    requireSpecifiers,
    staticSpecifiers,
  };
}

function isPublicApplicationContract(destination) {
  const [, layer, contract, ...remainingPath] = destination;
  return layer === 'application'
    && /^public-api(?:\.[cm]?[jt]s)?$/.test(contract ?? '')
    && remainingPath.length === 0;
}

function isFeatureModuleComposition(sourceFile, destination) {
  const [, moduleRoot, ...remainingPath] = destination;
  return sourceFile.endsWith('.module.ts')
    && /^[^/]+\.module(?:\.[cm]?[jt]s)?$/.test(moduleRoot ?? '')
    && remainingPath.length === 0;
}

function violationsFor(sourceFile, source) {
  const sourceModule = moduleNameFor(sourceFile);
  if (!sourceModule) return [];
  const {
    dynamicSpecifiers,
    importEqualsSpecifiers,
    requireSpecifiers,
    staticSpecifiers,
  } = importSpecifiers(source);

  const staticViolations = staticSpecifiers.flatMap((specifier) => {
    const destination = destinationFor(sourceFile, specifier);
    const destinationModule = destination?.[0];
    const destinationLayer = destination?.[1];

    if (
      !destinationModule ||
      destinationModule === sourceModule ||
      isPublicApplicationContract(destination) ||
      isFeatureModuleComposition(sourceFile, destination)
    ) {
      return [];
    }

    return destinationLayer === 'domain' || destinationLayer === 'infrastructure'
      ? [`${sourceModule} may not import ${destinationModule}/${destinationLayer}`]
      : [`${sourceModule} may only import ${destinationModule}/application/public-api`];
  });

  const dynamicViolations = dynamicSpecifiers.flatMap((specifier) => {
    const destination = destinationFor(sourceFile, specifier);
    const destinationModule = destination?.[0];

    return destinationModule && destinationModule !== sourceModule
      ? [`${sourceModule} may not dynamically import ${destinationModule}`]
      : [];
  });

  const requireViolations = requireSpecifiers.flatMap((specifier) => {
    const destinationModule = destinationFor(sourceFile, specifier)?.[0];

    return destinationModule && destinationModule !== sourceModule
      ? [`${sourceModule} may not require ${destinationModule}`]
      : [];
  });

  const importEqualsViolations = importEqualsSpecifiers.flatMap((specifier) => {
    const destinationModule = destinationFor(sourceFile, specifier)?.[0];

    return destinationModule && destinationModule !== sourceModule
      ? [`${sourceModule} may not use import-equals for ${destinationModule}`]
      : [];
  });

  return [
    ...staticViolations,
    ...dynamicViolations,
    ...requireViolations,
    ...importEqualsViolations,
  ];
}

const files = await findTypeScriptFiles(modulesRoot);
const violations = (await Promise.all(files.map(async (file) => violationsFor(file, await readFile(file, 'utf8'))))).flat();

if (violations.length > 0) {
  process.stderr.write(`${violations.join('\n')}\n`);
  process.exitCode = 1;
}
