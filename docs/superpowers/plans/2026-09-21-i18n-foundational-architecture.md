# Arquitetura Fundacional e Governança de i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estabelecer a governança de i18n em `AGENTS.md`, modularizar os dicionários de tradução por domínio e introduzir testes automatizados de paridade profunda e integridade estrutural.

**Architecture:** Modularizar os dicionários em diretórios por idioma (`pt-BR`, `en-US`, `es-ES`) contendo arquivos individuais por domínio tipados contra `Dictionary`. Preservar os entrypoints `pt-BR.ts`, `en-US.ts` e `es-ES.ts` para total compatibilidade retroativa com código existente. Adicionar testes em vitest que inspecionam recursivamente os 3 dicionários para garantir ausência de chaves vazias e simetria de variáveis `{var}`.

**Tech Stack:** TypeScript 5.9, Next.js 16, Vitest 3.2, React 19

**Spec:** [2026-09-21-i18n-foundational-architecture-design.md](file:///C:/Users/wende/Projects/Covenant-Grove/Aletheia/docs/superpowers/specs/2026-09-21-i18n-foundational-architecture-design.md)

## Global Constraints
- Zero AI attribution trailers (`Co-Authored-By`, `Generated-By`, etc.) em commits, PRs ou comentários.
- 100% de paridade em tempo de compilação entre `pt-BR`, `en-US` e `es-ES` (`Dictionary = Widen<typeof ptBR>`).
- Reexportação sem quebra: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}.ts` devem reexportar os módulos preservando todas as importações existentes.
- Respeitar limites estritos de módulos do monorepo (`check-module-boundaries.mjs`).

---

### Task 1: Diretriz de Governança no `AGENTS.md`

**Files:**
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: Instruções arquiteturais existentes de taxonomia educacional universal.
- Produces: Regra mandatória de frontend para i18n para qualquer agente ou engenheiro humano.

- [ ] **Step 1: Adicionar seção de i18n no `AGENTS.md`**

Adicionar ao final de `AGENTS.md`:
```markdown
## Internacionalização Obrigatória no Frontend (i18n)

- Todo texto de interface voltado ao usuário DEVE ser internacionalizado. Textos fixos ("hardcoded") em JSX são estritamente proibidos em novas features e refatorações.
- Use `const { t, formatDate, formatCurrency, formatNumber } = useLocale()` de `@/lib/i18n/locale-context`.
- Chaves de tradução devem ser organizadas por domínio dentro de `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/<dominio>.ts`.
- Toda nova chave adicionada em `pt-BR` DEVE obrigatoriamente ser acompanhada de suas respectivas traduções em `en-US` e `es-ES` no mesmo commit. O TypeScript (`Dictionary`) e os testes de paridade bloqueiam o build se faltar tradução ou variável `{var}`.
- Datas, horários, números e moedas DEVEM utilizar os formatadores do `useLocale()`, respeitando a localidade ativa da família.
```

- [ ] **Step 2: Verificar integridade do `AGENTS.md`**

Inspecionar `AGENTS.md` para garantir que o conteúdo anterior de taxonomia foi integralmente preservado.

- [ ] **Step 3: Commit da governança**

```bash
git add AGENTS.md
git commit -m "docs: add mandatory i18n rule to AGENTS.md"
```

---

### Task 2: Modularização dos Dicionários por Domínio (`apps/web`)

**Files:**
- Create:
  - `apps/web/src/lib/i18n/dictionaries/pt-BR/common.ts`
  - `apps/web/src/lib/i18n/dictionaries/pt-BR/nav.ts`
  - `apps/web/src/lib/i18n/dictionaries/pt-BR/notifications.ts`
  - `apps/web/src/lib/i18n/dictionaries/pt-BR/learner-focus.ts`
  - `apps/web/src/lib/i18n/dictionaries/pt-BR/index.ts`
  - `apps/web/src/lib/i18n/dictionaries/en-US/common.ts`
  - `apps/web/src/lib/i18n/dictionaries/en-US/nav.ts`
  - `apps/web/src/lib/i18n/dictionaries/en-US/notifications.ts`
  - `apps/web/src/lib/i18n/dictionaries/en-US/learner-focus.ts`
  - `apps/web/src/lib/i18n/dictionaries/en-US/index.ts`
  - `apps/web/src/lib/i18n/dictionaries/es-ES/common.ts`
  - `apps/web/src/lib/i18n/dictionaries/es-ES/nav.ts`
  - `apps/web/src/lib/i18n/dictionaries/es-ES/notifications.ts`
  - `apps/web/src/lib/i18n/dictionaries/es-ES/learner-focus.ts`
  - `apps/web/src/lib/i18n/dictionaries/es-ES/index.ts`
- Modify:
  - `apps/web/src/lib/i18n/dictionaries/pt-BR.ts`
  - `apps/web/src/lib/i18n/dictionaries/en-US.ts`
  - `apps/web/src/lib/i18n/dictionaries/es-ES.ts`

**Interfaces:**
- Produces:
  - `export { ptBR, type Dictionary } from './dictionaries/pt-BR'`
  - `export { enUS } from './dictionaries/en-US'`
  - `export { esES } from './dictionaries/es-ES'`
  - Modular domain files tipados via `Dictionary['<domain>']` em `en-US` e `es-ES`.

- [ ] **Step 1: Criar submódulos de domínio para `pt-BR`**

Criar os 4 módulos e o agregador:
- `pt-BR/common.ts`:
```ts
export const common = {
  home: 'Início',
  logout: 'Sair',
  accessDeniedTitle: 'Acesso restrito',
  accessDeniedDescription: 'Você não tem permissão para acessar esta página.',
} as const;
```
- `pt-BR/nav.ts`:
```ts
export const nav = {
  adminCatalog: 'Catálogo administrativo',
  home: 'Início',
  learners: 'Educandos',
  devotional: 'Devocional',
  curriculum: 'Currículo',
  schedule: 'Agenda & Rotina',
  records: 'Diário de Aprendizagem',
  portfolio: 'Portfólio',
  attendance: 'Frequência',
  reports: 'Relatórios',
  support: 'Apoiar o Projeto ❤️',
  settings: 'Configurações',
} as const;
```
- `pt-BR/notifications.ts`:
```ts
export const notifications = {
  iconAriaLabel: 'Sino',
  bellAriaLabel: 'Notificações ({count} não lidas)',
  title: 'Notificações',
  newCount: '{count} novas',
  markAllRead: 'Marcar lidas',
  markAsRead: 'Marcar como lida',
  empty: 'Nenhuma notificação no momento.',
  timeJustNow: 'Agora',
  timeMinutesAgo: '{count}m atrás',
  timeHoursAgo: '{count}h atrás',
  typeDevotionalReminder: 'Devocional',
  typeDailyScheduleReminder: 'Cronograma',
  typeAttendanceMissingReminder: 'Frequência',
  typePrayerAnsweredAlert: 'Oração Respondida',
  typeSystemNotice: 'Aviso do Sistema',
  typeFallback: 'Notificação',
} as const;
```
- `pt-BR/learner-focus.ts`:
```ts
export const learnerFocus = {
  wholeFamily: 'Toda a Família',
  familyIconAriaLabel: 'Família',
  ariaLabel: 'Foco do Educando',
  selectedAriaLabel: 'Educando selecionado: {name}',
} as const;
```
- `pt-BR/index.ts`:
```ts
import { common } from './common';
import { nav } from './nav';
import { notifications } from './notifications';
import { learnerFocus } from './learner-focus';

export const ptBR = {
  common,
  nav,
  notifications,
  learnerFocus,
} as const;
```

- [ ] **Step 2: Atualizar `apps/web/src/lib/i18n/dictionaries/pt-BR.ts`**

```ts
import { ptBR } from './pt-BR/index';

export { ptBR };

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Dictionary = Widen<typeof ptBR>;
```

- [ ] **Step 3: Criar submódulos de domínio para `en-US` e `es-ES` tipados contra `Dictionary`**

Para `en-US`:
- `en-US/common.ts`:
```ts
import type { Dictionary } from '../pt-BR';

export const common: Dictionary['common'] = {
  home: 'Home',
  logout: 'Sign out',
  accessDeniedTitle: 'Access restricted',
  accessDeniedDescription: 'You do not have permission to access this page.',
};
```
- `en-US/nav.ts`:
```ts
import type { Dictionary } from '../pt-BR';

export const nav: Dictionary['nav'] = {
  adminCatalog: 'Admin catalog',
  home: 'Home',
  learners: 'Learners',
  devotional: 'Devotional',
  curriculum: 'Curriculum',
  schedule: 'Schedule & Routine',
  records: 'Learning Journal',
  portfolio: 'Portfolio',
  attendance: 'Attendance',
  reports: 'Reports',
  support: 'Support the Project ❤️',
  settings: 'Settings',
};
```
- `en-US/notifications.ts`:
```ts
import type { Dictionary } from '../pt-BR';

export const notifications: Dictionary['notifications'] = {
  iconAriaLabel: 'Bell',
  bellAriaLabel: 'Notifications ({count} unread)',
  title: 'Notifications',
  newCount: '{count} new',
  markAllRead: 'Mark all read',
  markAsRead: 'Mark as read',
  empty: 'No notifications right now.',
  timeJustNow: 'Just now',
  timeMinutesAgo: '{count}m ago',
  timeHoursAgo: '{count}h ago',
  typeDevotionalReminder: 'Devotional',
  typeDailyScheduleReminder: 'Schedule',
  typeAttendanceMissingReminder: 'Attendance',
  typePrayerAnsweredAlert: 'Prayer Answered',
  typeSystemNotice: 'System Notice',
  typeFallback: 'Notification',
};
```
- `en-US/learner-focus.ts`:
```ts
import type { Dictionary } from '../pt-BR';

export const learnerFocus: Dictionary['learnerFocus'] = {
  wholeFamily: 'Whole Family',
  familyIconAriaLabel: 'Family',
  ariaLabel: 'Learner Focus',
  selectedAriaLabel: 'Selected learner: {name}',
};
```
- `en-US/index.ts`:
```ts
import type { Dictionary } from '../pt-BR';
import { common } from './common';
import { nav } from './nav';
import { notifications } from './notifications';
import { learnerFocus } from './learner-focus';

export const enUS: Dictionary = {
  common,
  nav,
  notifications,
  learnerFocus,
};
```

E para `es-ES`:
- `es-ES/common.ts`, `es-ES/nav.ts`, `es-ES/notifications.ts`, `es-ES/learner-focus.ts`, `es-ES/index.ts` com as strings correspondentes em espanhol.

- [ ] **Step 4: Atualizar `en-US.ts` e `es-ES.ts` para reexportar dos novos índices**

Em `apps/web/src/lib/i18n/dictionaries/en-US.ts`:
```ts
export { enUS } from './en-US/index';
```

Em `apps/web/src/lib/i18n/dictionaries/es-ES.ts`:
```ts
export { esES } from './es-ES/index';
```

- [ ] **Step 5: Executar typecheck e testes existentes**

```bash
pnpm --filter @aletheia/web test tests/i18n.test.tsx
pnpm --filter @aletheia/web typecheck
```
Expected: PASS com 0 erros de tipos.

- [ ] **Step 6: Commit da modularização**

```bash
git add apps/web/src/lib/i18n/dictionaries
git commit -m "feat(i18n): modularize dictionaries by domain with strict typing"
```

---

### Task 3: Guardrails Automatizados de Paridade e Integridade Estrutural

**Files:**
- Modify: `apps/web/tests/i18n.test.tsx`

**Interfaces:**
- Consumes: `ptBR`, `enUS`, `esES` from `../src/lib/i18n/locale-context` / `dictionaries`.
- Produces: Testes de unidade que garantem ausência de strings em branco e simetria de variáveis de interpolação.

- [ ] **Step 1: Adicionar testes de validação estrutural em `apps/web/tests/i18n.test.tsx`**

Adicionar novo bloco `describe`:
```tsx
describe('Guardrails de Integridade Estrutural e Paridade de Dicionários', () => {
  function collectKeysAndValues(obj: Record<string, any>, prefix = ''): { key: string; value: string }[] {
    const entries: { key: string; value: string }[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string') {
        entries.push({ key: fullKey, value: v });
      } else if (v && typeof v === 'object') {
        entries.push(...collectKeysAndValues(v, fullKey));
      }
    }
    return entries;
  }

  function extractVariables(template: string): string[] {
    const matches = [...template.matchAll(/\{(\w+)\}/g)];
    return matches.map((m) => m[1]).sort();
  }

  it('garante que nenhuma chave em nenhum idioma seja vazia ou apenas espaços', () => {
    const ptEntries = collectKeysAndValues(ptBR);
    const enEntries = collectKeysAndValues(enUS);
    const esEntries = collectKeysAndValues(esES);

    for (const entry of [...ptEntries, ...enEntries, ...esEntries]) {
      expect(entry.value.trim().length, `Chave vazia detectada: ${entry.key}`).toBeGreaterThan(0);
    }
  });

  it('garante simetria exata de chaves e variáveis de interpolação {var} entre todos os idiomas', () => {
    const ptEntries = collectKeysAndValues(ptBR);
    const enMap = new Map(collectKeysAndValues(enUS).map((e) => [e.key, e.value]));
    const esMap = new Map(collectKeysAndValues(esES).map((e) => [e.key, e.value]));

    for (const { key, value: ptValue } of ptEntries) {
      expect(enMap.has(key), `Chave '${key}' presente em pt-BR mas ausente em en-US`).toBe(true);
      expect(esMap.has(key), `Chave '${key}' presente em pt-BR mas ausente em es-ES`).toBe(true);

      const ptVars = extractVariables(ptValue);
      const enVars = extractVariables(enMap.get(key)!);
      const esVars = extractVariables(esMap.get(key)!);

      expect(enVars, `Discrepância de variáveis {var} na chave '${key}' entre pt-BR e en-US`).toEqual(ptVars);
      expect(esVars, `Discrepância de variáveis {var} na chave '${key}' entre pt-BR e es-ES`).toEqual(ptVars);
    }
  });
});
```

- [ ] **Step 2: Executar testes de validação**

```bash
pnpm --filter @aletheia/web test tests/i18n.test.tsx
```
Expected: PASS com todos os testes passando.

- [ ] **Step 3: Executar suíte completa do frontend e typecheck**

```bash
pnpm --filter @aletheia/web typecheck
pnpm --filter @aletheia/web test
```
Expected: PASS sem nenhuma quebra.

- [ ] **Step 4: Commit dos guardrails**

```bash
git add apps/web/tests/i18n.test.tsx
git commit -m "test(i18n): add structural integrity and interpolation parity guardrails"
```
