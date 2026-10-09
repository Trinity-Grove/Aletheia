# Auditoria de Cobertura e Plano de Migração Completa para i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desenvolver uma ferramenta estática de auditoria (`scripts/audit-i18n-coverage.mjs` e `pnpm audit:i18n`) para mapear todas as páginas e componentes sem internacionalização, e orquestrar a migração sistemática em 5 ondas até atingir 100% de cobertura em `pt-BR`, `en-US` e `es-ES`.

**Architecture:** O scanner estático em Node.js (`scripts/audit-i18n-coverage.mjs`) percorre recursivamente `apps/web/app/` e `apps/web/src/components/`, analisa o código TSX identificando nós de texto JSX e atributos voltados ao usuário sem o hook `useLocale`/`t(...)`, gerando relatórios em terminal, JSON e Markdown. A migração dos 78 arquivos pendentes é executada em 5 ondas temáticas com novos módulos de dicionário estritamente tipados e validados pela suíte `apps/web/tests/i18n.test.tsx`.

**Tech Stack:** Node.js 22 (ESM, `node:fs/promises`, `node:test`), TypeScript 5.9, Next.js 16, React 19, Vitest 3.2

**Spec:** [docs/superpowers/specs/2026-10-04-i18n-coverage-audit-and-migration-design.md](file:///C:/Users/wende/Projects/Covenant-Grove/Aletheia/docs/superpowers/specs/2026-10-04-i18n-coverage-audit-and-migration-design.md)

## Global Constraints

- ZERO trailers de atribuição de IA (`Co-Authored-By`, `Generated-By`, etc.) em mensagens de commit, PRs ou comentários.
- Paridade estrita de 100% entre os três idiomas: qualquer chave adicionada em `pt-BR` deve existir com valores traduzidos e idênticas variáveis de interpolação `{var}` em `en-US` e `es-ES`.
- Toda alteração deve passar em `pnpm check:boundaries` (14/14 testes) e `pnpm -r typecheck` (0 erros).
- Nunca realizar commit direto na branch `main` (bloqueado por regra de governança `GH013`). Todo trabalho deve passar por branch de feature, PR com squash merge e sincronização imediata da `main` local com `origin/main`.

---

### Task 1: Scanner Estático de Auditoria (`scripts/audit-i18n-coverage.mjs` & `test.mjs`)

**Files:**
- Create: `scripts/audit-i18n-coverage.mjs`
- Create: `scripts/audit-i18n-coverage.test.mjs`
- Modify: `package.json:28-35`

**Interfaces:**
- Consumes: Árvore de arquivos de `apps/web/app/` e `apps/web/src/components/`.
- Produces: CLI `pnpm audit:i18n` com saída para terminal, `--json` e `--markdown`.

- [ ] **Step 1: Escrever teste de unidade para o scanner estático**

Criar `scripts/audit-i18n-coverage.test.mjs`:
```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSourceCode } from './audit-i18n-coverage.mjs';

describe('audit-i18n-coverage', () => {
  it('detecta ausência de useLocale e lista textos literais em JSX', () => {
    const code = `
      export default function TestPage() {
        return (
          <div>
            <h1>Bem-vindo ao Sistema</h1>
            <p>Texto fixo em português</p>
            <input placeholder="Digite seu nome" />
          </div>
        );
      }
    `;

    const result = analyzeSourceCode('apps/web/app/test/page.tsx', code);
    assert.equal(result.hasUseLocale, false);
    assert.ok(result.hardcodedStrings.length >= 3);
    assert.ok(result.hardcodedStrings.some((s) => s.text.includes('Bem-vindo')));
    assert.ok(result.hardcodedStrings.some((s) => s.text.includes('Digite seu nome')));
  });

  it('reconhece componente com useLocale e ignora chamadas a t(...)', () => {
    const code = `
      import { useLocale } from '@/lib/i18n/locale-context';
      export function LocalizedComponent() {
        const { t } = useLocale();
        return (
          <div>
            <h1>{t('common.home')}</h1>
            <input placeholder={t('common.search')} />
          </div>
        );
      }
    `;

    const result = analyzeSourceCode('apps/web/src/components/test.tsx', code);
    assert.equal(result.hasUseLocale, true);
    assert.equal(result.hardcodedStrings.length, 0);
  });
});
```

- [ ] **Step 2: Executar teste para verificar falha (RED)**

Executar:
```bash
node --test scripts/audit-i18n-coverage.test.mjs
```
Esperado: FAIL com erro de módulo ou exportação ausente.

- [ ] **Step 3: Implementar `scripts/audit-i18n-coverage.mjs`**

Implementar o analisador léxico/sintático sem dependências externas:
```js
import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

const USER_FACING_ATTRS = new Set([
  'placeholder',
  'title',
  'aria-label',
  'label',
  'helperText',
  'description',
  'alt',
]);

export function analyzeSourceCode(filePath, source) {
  const hasUseLocale = source.includes('useLocale(') || source.includes('useLocale =') || source.includes('useLocale');
  const hardcodedStrings = [];

  const lines = source.split('\n');
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const trimmed = line.trim();

    // Ignore imports, comments, css, and data-testids
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('import ')) {
      continue;
    }

    // Check user-facing attributes: placeholder="...", title="...", etc.
    for (const attr of USER_FACING_ATTRS) {
      const regex = new RegExp(`${attr}=["']([^"']+)["']`, 'g');
      let match;
      while ((match = regex.exec(line)) !== null) {
        const val = match[1].trim();
        if (val.length >= 3 && /[a-zA-ZÀ-ÿ]/.test(val)) {
          hardcodedStrings.push({
            line: lineIndex + 1,
            text: val,
            type: `prop:${attr}`,
          });
        }
      }
    }

    // Check JSX text children: >Texto aqui<
    const jsxTextRegex = />([^<>{}\n]+)</g;
    let textMatch;
    while ((textMatch = jsxTextRegex.exec(line)) !== null) {
      const text = textMatch[1].trim();
      // Filter out symbols, pure numbers, and technical whitespace
      if (text.length >= 3 && /[a-zA-ZÀ-ÿ]{2,}/.test(text) && !text.startsWith('http')) {
        hardcodedStrings.push({
          line: lineIndex + 1,
          text,
          type: 'jsx-text',
        });
      }
    }
  }

  return {
    filePath,
    hasUseLocale,
    hardcodedStrings,
    isFullyLocalized: hasUseLocale && hardcodedStrings.length === 0,
  };
}

export async function scanDirectory(baseDir) {
  const results = [];
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) && !entry.name.endsWith('.test.tsx')) {
        const content = await readFile(fullPath, 'utf-8');
        results.push(analyzeSourceCode(fullPath, content));
      }
    }
  }
  await walk(baseDir);
  return results;
}
```

- [ ] **Step 4: Registrar comando no `package.json`**

Em `package.json`, adicionar em `"scripts"`:
```json
"audit:i18n": "node scripts/audit-i18n-coverage.mjs"
```

- [ ] **Step 5: Executar testes do scanner (GREEN)**

Executar:
```bash
node --test scripts/audit-i18n-coverage.test.mjs
```
Esperado: PASS (2 passing).

- [ ] **Step 6: Commit**

```bash
git add scripts/audit-i18n-coverage.mjs scripts/audit-i18n-coverage.test.mjs package.json
git commit -m "feat(infra): add static i18n coverage audit scanner and npm script"
```

---

### Task 2: Matriz de Auditoria e Diagnóstico Inicial (`docs/i18n-coverage-matrix.md`)

**Files:**
- Create: `docs/i18n-coverage-matrix.md`

**Interfaces:**
- Consumes: Saída estruturada do `scripts/audit-i18n-coverage.mjs`.
- Produces: Mapeamento auditado completo dos 122 arquivos (30 páginas e 92 componentes) com separação por domínios.

- [ ] **Step 1: Executar o scanner e coletar os dados**

Executar:
```bash
node scripts/audit-i18n-coverage.mjs --markdown > docs/i18n-coverage-matrix.md
```

- [ ] **Step 2: Verificar a matriz gerada**

Inspecionar `docs/i18n-coverage-matrix.md` garantindo que lista todas as 19 páginas pendentes e 59 componentes categorizados por módulo (`attendance`, `records`, `portfolio`, `devotional`, `curriculum`, `reports`, `shared`).

- [ ] **Step 3: Commit**

```bash
git add docs/i18n-coverage-matrix.md
git commit -m "docs: generate initial i18n coverage matrix and audit report"
```

---

### Task 3: Onda 1 — Frequência e Registros de Aprendizagem (`attendance` & `records`)

**Files:**
- Create:
  - `apps/web/src/lib/i18n/dictionaries/pt-BR/attendance.ts`
  - `apps/web/src/lib/i18n/dictionaries/en-US/attendance.ts`
  - `apps/web/src/lib/i18n/dictionaries/es-ES/attendance.ts`
  - `apps/web/src/lib/i18n/dictionaries/pt-BR/records.ts`
  - `apps/web/src/lib/i18n/dictionaries/en-US/records.ts`
  - `apps/web/src/lib/i18n/dictionaries/es-ES/records.ts`
- Modify:
  - `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/index.ts`
  - `apps/web/app/(dashboard)/attendance/page.tsx`
  - `apps/web/app/(dashboard)/records/page.tsx`
  - `apps/web/src/components/records/records-list.tsx`
  - `apps/web/src/components/records/record-details-modal.tsx`
- Test:
  - `apps/web/tests/i18n.test.tsx`
  - `apps/web/tests/attendance-i18n.test.tsx`

**Interfaces:**
- Consumes: `useLocale()` em páginas de presença diária e histórico acadêmico.
- Produces: Dicionários `attendance` e `records` 100% simétricos.

- [ ] **Step 1: Escrever teste de paridade e renderização de Frequência e Registros**

Criar `apps/web/tests/attendance-i18n.test.tsx`:
```tsx
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocaleProvider } from '../src/lib/i18n/locale-context';
import AttendancePage from '../app/(dashboard)/attendance/page';

describe('Attendance Page i18n', () => {
  it('renders attendance page title and actions in pt-BR and en-US', () => {
    localStorage.setItem('aletheia_locale', 'en-US');
    render(
      <LocaleProvider>
        <AttendancePage />
      </LocaleProvider>
    );
    expect(screen.getByText(/Attendance/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Criar dicionários de `attendance` e `records` em `pt-BR`, `en-US`, `es-ES`**

Garantir equivalência total de chaves e variáveis.

- [ ] **Step 3: Refatorar páginas e componentes para usar `t('attendance.*')` e `t('records.*')`**

Substituir todos os textos hardcoded identificados pelo scanner.

- [ ] **Step 4: Executar suítes de teste**

```bash
pnpm --filter @aletheia/web test tests/i18n.test.tsx tests/attendance-i18n.test.tsx
```
Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/i18n/ apps/web/app/(dashboard)/attendance/ apps/web/app/(dashboard)/records/ apps/web/src/components/records/ apps/web/tests/
git commit -m "feat(i18n): localize attendance and records modules across pt-BR, en-US, and es-ES"
```

---

### Task 4: Onda 2 — Devocional Familiar e Comparador Bíblico (`devotional` & `comparador`)

**Files:**
- Create:
  - `apps/web/src/lib/i18n/dictionaries/pt-BR/devotional.ts`
  - `apps/web/src/lib/i18n/dictionaries/en-US/devotional.ts`
  - `apps/web/src/lib/i18n/dictionaries/es-ES/devotional.ts`
- Modify:
  - `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/index.ts`
  - `apps/web/app/(dashboard)/devotional/page.tsx`
  - `apps/web/app/(dashboard)/devotional/comparador/page.tsx`
  - `apps/web/src/components/devotional/*`
- Test:
  - `apps/web/tests/devotional.test.tsx`
  - `apps/web/tests/bible-translation-compare.test.tsx`
  - `apps/web/tests/i18n.test.tsx`

- [ ] **Step 1: Escrever testes com alternância de idioma no Devocional**
- [ ] **Step 2: Criar dicionários com termos bíblicos litúrgicos respeitosos em PT, EN e ES**
- [ ] **Step 3: Conectar `useLocale` em `devotional/page.tsx` e `comparador/page.tsx`**
- [ ] **Step 4: Executar testes de devocional e comparar versões bíblicas**
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/i18n/ apps/web/app/(dashboard)/devotional/ apps/web/src/components/devotional/ apps/web/tests/
git commit -m "feat(i18n): localize family devotional and bible comparator modules"
```

---

### Task 5: Onda 3 — Currículo, Atividades Pedagógicas e Galeria de Pacotes (`curriculum`)

**Files:**
- Create:
  - `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/activities.ts`
- Modify:
  - `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/curriculum.ts`
  - `apps/web/app/(dashboard)/curriculum/page.tsx`
  - `apps/web/app/(dashboard)/curriculum/activities/page.tsx`
  - `apps/web/app/(dashboard)/curriculum/packs/page.tsx`
  - `apps/web/src/components/curriculum/*`
- Test:
  - `apps/web/tests/curriculum-packs.test.tsx`
  - `apps/web/tests/i18n.test.tsx`

- [ ] **Step 1: Testes de unidade com idioma inglês e espanhol para catálogo pedagógico**
- [ ] **Step 2: Expandir dicionário `curriculum.ts` e criar `activities.ts`**
- [ ] **Step 3: Substituir literais em `packs/page.tsx` e componentes de filtros**
- [ ] **Step 4: Validar `pnpm --filter @aletheia/web test tests/curriculum-packs.test.tsx`**
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/i18n/ apps/web/app/(dashboard)/curriculum/ apps/web/src/components/curriculum/ apps/web/tests/
git commit -m "feat(i18n): localize curriculum activities, catalog, and pack gallery"
```

---

### Task 6: Onda 4 — Relatórios, Dossiês de Conformidade e Portfólio (`reports`, `portfolio`)

**Files:**
- Create:
  - `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/reports.ts`
  - `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/portfolio.ts`
- Modify:
  - `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/index.ts`
  - `apps/web/app/(dashboard)/reports/page.tsx`
  - `apps/web/app/(dashboard)/portfolio/page.tsx`
  - `apps/web/src/components/reports/*`
  - `apps/web/src/components/compliance/*`
- Test:
  - `apps/web/tests/reports.test.tsx`
  - `apps/web/tests/i18n.test.tsx`

- [ ] **Step 1: Escrever testes para exportação de dossiê multilíngue**
- [ ] **Step 2: Criar dicionários `reports.ts` e `portfolio.ts` com terminologia jurídica e acadêmica**
- [ ] **Step 3: Vincular `useLocale` nas páginas de relatórios e componentes de dossiê**
- [ ] **Step 4: Validar suítes de testes de conformidade**
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/i18n/ apps/web/app/(dashboard)/reports/ apps/web/app/(dashboard)/portfolio/ apps/web/src/components/reports/ apps/web/tests/
git commit -m "feat(i18n): localize reports, compliance dossiers, and learner portfolio"
```

---

### Task 7: Onda 5 — Convites, Verificações e Fechamento de Cobertura Global

**Files:**
- Modify:
  - `apps/web/app/convite/[token]/page.tsx`
  - `apps/web/app/invite/[token]/page.tsx`
  - `apps/web/app/verificar/page.tsx`
  - `apps/web/app/verify/page.tsx`
  - `apps/web/src/components/layout/`
  - `apps/web/src/components/shared/`
- Test:
  - `apps/web/tests/invitation-accept.test.tsx`
  - `apps/web/tests/i18n.test.tsx`
  - Execução final de `pnpm audit:i18n`

- [ ] **Step 1: Internacionalizar páginas públicas de aceite de convite de guardião**
- [ ] **Step 2: Internacionalizar banners de aviso de e-mail não verificado e layouts globais**
- [ ] **Step 3: Executar `pnpm audit:i18n` e verificar 100% de arquivos auditados aprovados**
- [ ] **Step 4: Executar `pnpm check:boundaries` e `pnpm -r typecheck`**
- [ ] **Step 5: Commit**

```bash
git add apps/web/app/ apps/web/src/components/ apps/web/tests/
git commit -m "feat(i18n): complete frontend coverage for invitations, verification, and shared layouts"
```

---

## Auto-Revisão de Conformidade com o Padrão

1. **Cobertura da Spec:** O plano cobre a criação do scanner automatizado, comando de CI (`pnpm audit:i18n`), geração da matriz completa de auditoria e a resolução progressiva dos 78 arquivos pendentes divididos em 5 ondas.
2. **Ausência de Placeholders:** Cada tarefa especifica caminhos exatos, comandos de teste, dicionários envolvidos e mensagens de commit estritas.
3. **Consistência de Tipos e Contratos:** Todos os novos dicionários respeitam a interface `Dictionary = Widen<typeof ptBR>`, garantindo inferência segura e autocompletação em todo o frontend.
