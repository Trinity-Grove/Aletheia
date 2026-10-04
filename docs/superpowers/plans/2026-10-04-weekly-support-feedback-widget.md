# Widget Semanal de Apoio e Feedback — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um botão flutuante que aparece 1x por semana por família abre um modal com "Quero apoiar" (reusa o fluxo de doação existente) e "Quero dar feedback" (relato anônimo por padrão, triado no backoffice e convertido em issue no GitHub na aprovação).

**Architecture:** Novo módulo `feedback` na API espelhando `donations`, com um `GITHUB_ISSUE_GATEWAY` abstraído atrás de interface + factory. A cadência do widget mora em `FamilySettings` (2 colunas) e é avaliada por uma função pura compartilhada em `@aletheia/contracts`. O widget é montado uma única vez dentro do `ProductShell`; a triagem é uma página nova no backoffice.

**Tech Stack:** pnpm workspaces, NestJS + Prisma + Postgres (Jest), Next.js App Router + Vitest + Testing Library, Zod 4 em `@aletheia/contracts`, `@aletheia/ui` como design system, `fetch` global (sem dependência nova).

**Spec:** `docs/superpowers/specs/2026-10-04-weekly-support-feedback-widget-design.md` — o plano argumenta a partir do spec; os dois Viajam juntos, e quem executa lê ambos.

## Global Constraints

- **Sem dependência npm nova.** O gateway do GitHub usa `fetch` global, exatamente como `MercadoPagoDonationGateway`.
- **Zero string hardcoded de UI em JSX.** Toda chave nova em `pt-BR` precisa de `en-US` e `es-ES` no mesmo commit. O tipo `Dictionary` (`apps/web/src/lib/i18n/dictionaries/en-US/index.ts:15`) e os guardrails de `apps/web/tests/i18n.test.tsx:449-495` bloqueiam o build se faltar tradução ou variável `{var}`.
- **Datas, números e moeda sempre por `useLocale()`** (`formatDate`, `formatNumber`, `formatCurrency`).
- **Fronteiras de módulo (`pnpm check:boundaries`):** um módulo só importa de outro módulo via `*/application/public-api`. Nunca `domain` nem `infrastructure` de outro módulo. Tokens disponíveis: `SETTINGS_PUBLIC_API`, `FAMILY_PUBLIC_API` (módulo `@Global`), `IDENTITY_PUBLIC_API` (módulo `@Global`), `PRIVACY_PUBLIC_API`.
- **Escrever `git add` só com caminho explícito.** Nunca `-A`, nunca `commit -a`. Outros agents estão ativos no mesmo diretório de trabalho neste momento.
- **`apps/api/prisma/schema.prisma` é o arquivo mais colidido do plano.** A migração do Prisma (Task 2) só deve ser gerada depois de `git pull`/rebase, com o schema dos outros agents já mergeado.
- **Testes da API rodam em Jest** (via `node scripts/run-test.cjs`); `run-test.cjs` troca para a config de integração sempre que o argumento contém `test/`. Contratos, web e backoffice rodam em **Vitest**.
- **Zero trailers de atribuição de IA** (`Co-Authored-By`, `Generated-By`) em commits, comentários e PRs.
- Portões de qualidade, todos obrigatórios: `pnpm check:boundaries`, `pnpm -r typecheck`, `pnpm -r test`.

## Deviações do Spec (decididas na implementação, com motivo)

1. **A função pura de elegibilidade mora em `packages/contracts/src/support-widget.ts`**, não em `apps/api/src/modules/feedback/domain/widget-eligibility.ts`. Motivo: tanto a API quanto o navegador precisam dela, e `@aletheia/contracts` é o único pacote compartilhado pelos dois. Não existe endpoint de elegibilidade (spec §6.1) — o widget lê os dois timestamps pelo `GET /settings` que já existe e avalia localmente. A afirmação do spec §3.1 de que "quem calcula é a API" fica assim: **a verdade mora no servidor**; a aritmética é uma função pura determinística.
2. **`FEEDBACK_APPROVED` e `FEEDBACK_REJECTED` também entram em `packages/contracts/src/notification.ts`**, não só no enum do Prisma. Sem isso `CreateNotificationDto` rejeita o tipo.
3. **`adminFeedbackResponseSchema` inclui `submitterEmail`.** O spec §5 o omitiu, mas o §6.2 fala em o admin ler `submitterEmail`, e o painel precisa dele para responder. Não há vazamento: as colunas só são preenchidas quando `identifySelf === true`.
4. **O backoffice ganha só o dicionário `pt-BR`.** Ele tem um único dicionário (`apps/backoffice/src/lib/i18n/dictionaries/pt-BR/`), e `DICTIONARIES` mapeia as três locales para `ptBR` (`locale-context.tsx:20-24`). O spec §11 fala em "três dicionários" no backoffice — não existem. Criar as duas traduções sem estrutura de locale no app seria teatro.
5. **Sem `apps/web/src/lib/api/feedback-client.ts`.** O widget usa o objeto `api` que já existe (`apps/web/src/lib/api/client.ts:191`), como `settings/page.tsx` faz.
6. **A seção de snooze das Configurações é um componente novo** (`SupportWidgetPreferencesCard`), renderizado na settings page — o mesmo padrão de `SupporterSettingsCard`, e testável isolado.
7. **Strings de notificação são em português, escritas pela API**, seguindo `prayer.service.ts:92-96`. Não há i18n no texto de notificação no repositório.
8. **O nome/e-mail do opt-in vêm da conta autenticada**, via `IDENTITY_PUBLIC_API.findUserById`, nunca do corpo da requisição. O DTO não tem campos de nome/e-mail, então o cliente não consegue injetar PII alheia.

## Review Focus

Cinco classes de entrada que o spec implica mas que nenhum teste do spec exercise. Cada linha tem o teste que a fixa, na task listada.

1. **Mensagem só com espaços que passa de `min(10)`.** `z.string().trim().min(10)` tem que rechazar, não aceitar. → teste em Task 1.
2. **Snooze apagado (`null`) com `lastSeenAt` recente não torna o widget elegível.** O "Reativar agora" limpa o snooze, mas o relógio de 7 dias continua valendo. → teste em Task 3 (settings) e Task 10 (widget).
3. **Aprovação com escrita parcial:** o GitHub criou a issue mas o INSERT no banco falhou, e a linha ficou `PENDING` **com `githubIssueNumber` já gravado**. A retentativa tem que reaproveitar o número, não abrir uma segunda issue. → teste em Task 6.
4. **`EDUCATOR` consegue passar por `FamilyTenantGuard`.** O guard só verifica vínculo (`family-tenant.guard.ts:36` → `isGuardianInFamily` → `isMember`, sem checar papel) e o JWT não carrega papel (`identity/application/public-api.ts:3-6`). O `POST /feedback` tem que devolver 403 mesmo assim. → teste em Task 6 (unário) e Task 8 (integração).
5. **Texto do usuário forjando o marcador de outro relato.** Uma mensagem contendo `<!-- aletheia-feedback-id: <uuid-alheio> -->` não pode fazer `findIssueByMarker` devolver a issue de outra pessoa. → teste em Task 4.

---

### Task 1: Contratos — schemas de feedback, função pura de elegibilidade, tipos de notificação e settings

**Files:**
- Create: `packages/contracts/src/feedback.ts`
- Create: `packages/contracts/src/feedback.test.ts`
- Create: `packages/contracts/src/support-widget.ts`
- Create: `packages/contracts/src/support-widget.test.ts`
- Modify: `packages/contracts/src/index.ts` (duas linhas de export)
- Modify: `packages/contracts/src/notification.ts:4-11` (dois valores no enum)
- Modify: `packages/contracts/src/settings.ts` (4 campos)
- Modify: `packages/contracts/src/settings.test.ts` (ajuste do mock, ver passo 6)

**Interfaces:**
- Consumes: nada (primeira task).
- Produz:
  - `feedbackCategorySchema: z.ZodEnum<['BUG','IDEA','QUESTION','PRAISE']>`, `type FeedbackCategory`
  - `feedbackStatusSchema: z.ZodEnum<['PENDING','APPROVED','REJECTED']>`, `type FeedbackStatus`
  - `createFeedbackSchema`, `type CreateFeedbackDto = z.input<...>`, `type CreateFeedbackOutput = z.output<...>`
  - `submitterFeedbackResponseSchema`, `type SubmitterFeedbackResponseDto`
  - `approveFeedbackSchema`, `type ApproveFeedbackDto = z.input<...>`, `type ApproveFeedbackOutput = z.output<...>`
  - `rejectFeedbackSchema`, `type RejectFeedbackDto`
  - `adminFeedbackResponseSchema`, `type AdminFeedbackResponseDto`
  - `listAdminFeedbackQuerySchema`, `type ListAdminFeedbackQueryDto`
  - `adminFeedbackListResponseSchema`, `type AdminFeedbackListResponseDto`
  - `SUPPORT_WIDGET_INTERVAL_DAYS = 7`, `SUPPORT_WIDGET_AUTO_DISMISS_MS = 20_000`, `SUPPORT_WIDGET_SNOOZE_FOREVER = '9999-12-31T23:59:59.999Z'`, `type SupportWidgetSnoozePreset = 'WEEK' | 'MONTH' | 'FOREVER'`
  - `isWidgetEligible(now: Date, lastSeenAt: Date | null, snoozedUntil: Date | null): boolean`
  - `NotificationType` ganha `'FEEDBACK_APPROVED' | 'FEEDBACK_REJECTED'`
  - `FamilySettingsResponseDto` e `UpdateFamilySettingsDto` ganham os dois timestamps do widget

- [ ] **Step 1: Escreva os testes que falham**

Crie `packages/contracts/src/feedback.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  approveFeedbackSchema,
  createFeedbackSchema,
  feedbackCategorySchema,
  feedbackStatusSchema,
  listAdminFeedbackQuerySchema,
  rejectFeedbackSchema,
} from './feedback.js';

describe('feedback contracts', () => {
  describe('feedbackCategorySchema', () => {
    it('accepts the four categories and rejects anything else', () => {
      for (const c of ['BUG', 'IDEA', 'QUESTION', 'PRAISE'] as const) {
        expect(feedbackCategorySchema.safeParse(c).success).toBe(true);
      }
      expect(feedbackCategorySchema.safeParse('SUPPORT').success).toBe(false);
      expect(feedbackCategorySchema.safeParse('').success).toBe(false);
    });
  });

  describe('feedbackStatusSchema', () => {
    it('accepts PENDING, APPROVED, REJECTED', () => {
      for (const s of ['PENDING', 'APPROVED', 'REJECTED'] as const) {
        expect(feedbackStatusSchema.safeParse(s).success).toBe(true);
      }
      expect(feedbackStatusSchema.safeParse('CLOSED').success).toBe(false);
    });
  });

  describe('createFeedbackSchema', () => {
    const valid = { category: 'BUG', message: 'O botão de salvar trava às vezes.' };

    it('defaults identifySelf to false when the client omits it', () => {
      const parsed = createFeedbackSchema.parse(valid);
      expect(parsed.identifySelf).toBe(false);
    });

    it('accepts a 10-character message and a 4000-character message', () => {
      expect(createFeedbackSchema.safeParse({ ...valid, message: 'a'.repeat(10) }).success).toBe(true);
      expect(createFeedbackSchema.safeParse({ ...valid, message: 'a'.repeat(4000) }).success).toBe(true);
    });

    it('rejects a 9-character message and a 4001-character message', () => {
      expect(createFeedbackSchema.safeParse({ ...valid, message: 'a'.repeat(9) }).success).toBe(false);
      expect(createFeedbackSchema.safeParse({ ...valid, message: 'a'.repeat(4001) }).success).toBe(false);
    });

    it('trims before measuring length, so a whitespace-only message never passes min(10)', () => {
      expect(createFeedbackSchema.safeParse({ ...valid, message: ' '.repeat(40) }).success).toBe(false);
      expect(createFeedbackSchema.safeParse({ ...valid, message: '  problema real de Login  ' }).message)
        .toBe('problema real de Login');
    });

    it('treats every technical context field as optional and independent', () => {
      const parsed = createFeedbackSchema.parse({ ...valid, pagePath: '/curriculum/packs' });
      expect(parsed.locale).toBeUndefined();
      expect(parsed.appVersion).toBeUndefined();
      expect(parsed.userAgent).toBeUndefined();
    });

    it('caps pagePath at 200, appVersion at 40 and userAgent at 400 characters', () => {
      expect(createFeedbackSchema.safeParse({ ...valid, pagePath: '/'.repeat(201) }).success).toBe(false);
      expect(createFeedbackSchema.safeParse({ ...valid, appVersion: '1'.repeat(41) }).success).toBe(false);
      expect(createFeedbackSchema.safeParse({ ...valid, userAgent: 'x'.repeat(401) }).success).toBe(false);
    });
  });

  describe('approveFeedbackSchema', () => {
    it('defaults labels to an empty array', () => {
      expect(approveFeedbackSchema.parse({ title: 'Login trava ao salvar' }).labels).toEqual([]);
    });

    it('rejects a title under 5 or over 180 characters', () => {
      expect(approveFeedbackSchema.safeParse({ title: 'abcd' }).success).toBe(false);
      expect(approveFeedbackSchema.safeParse({ title: 'a'.repeat(181) }).success).toBe(false);
      expect(approveFeedbackSchema.safeParse({ title: 'abcde' }).success).toBe(true);
    });

    it('rejects more than 8 labels and labels over 50 characters', () => {
      const many = Array.from({ length: 9 }, (_, i) => `label-${i}`);
      expect(approveFeedbackSchema.safeParse({ title: 'Login trava', labels: many }).success).toBe(false);
      expect(approveFeedbackSchema.safeParse({ title: 'Login trava', labels: ['x'.repeat(51)] }).success).toBe(false);
    });

    it('trims labels and rejects blank ones', () => {
      const parsed = approveFeedbackSchema.parse({ title: 'Login trava', labels: ['  bug  '] });
      expect(parsed.labels).toEqual(['bug']);
      expect(approveFeedbackSchema.safeParse({ title: 'Login trava', labels: ['   '] }).success).toBe(false);
    });
  });

  describe('rejectFeedbackSchema', () => {
    it('requires a reason of at least 5 characters', () => {
      expect(rejectFeedbackSchema.safeParse({ reason: 'abcd' }).success).toBe(false);
      expect(rejectFeedbackSchema.safeParse({}).success).toBe(false);
      expect(rejectFeedbackSchema.safeParse({ reason: 'Fora do escopo' }).success).toBe(true);
    });
  });

  describe('listAdminFeedbackQuerySchema', () => {
    it('caps take at 100 and floors skip at 0', () => {
      expect(listAdminFeedbackQuerySchema.safeParse({ take: 101 }).success).toBe(false);
      expect(listAdminFeedbackQuerySchema.safeParse({ skip: -1 }).success).toBe(false);
      expect(listAdminFeedbackQuerySchema.safeParse({ take: 100, skip: 0, status: 'PENDING' }).success).toBe(true);
    });
  });
});
```

Crie `packages/contracts/src/support-widget.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  SUPPORT_WIDGET_AUTO_DISMISS_MS,
  SUPPORT_WIDGET_INTERVAL_DAYS,
  SUPPORT_WIDGET_SNOOZE_FOREVER,
  isWidgetEligible,
} from './support-widget.js';

const NOW = new Date('2026-10-04T12:00:00.000Z');
const daysAgo = (n: number): Date => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

describe('isWidgetEligible', () => {
  it('is eligible when the family has never seen it', () => {
    expect(isWidgetEligible(NOW, null, null)).toBe(true);
  });

  it('is not eligible 6 days after the last appearance', () => {
    expect(isWidgetEligible(NOW, daysAgo(6), null)).toBe(false);
  });

  it('is eligible again exactly 7 days after the last appearance', () => {
    expect(isWidgetEligible(NOW, daysAgo(SUPPORT_WIDGET_INTERVAL_DAYS), null)).toBe(true);
  });

  it('is not eligible while a snooze is still in the future', () => {
    const in3days = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000);
    expect(isWidgetEligible(NOW, null, in3days)).toBe(false);
  });

  it('is eligible the instant the snooze expires', () => {
    expect(isWidgetEligible(NOW, null, NOW)).toBe(true);
  });

  it('stays hidden forever for the "sempre" sentinel', () => {
    expect(isWidgetEligible(NOW, null, new Date(SUPPORT_WIDGET_SNOOZE_FOREVER))).toBe(false);
  });

  it('a cleared snooze (null) does NOT bypass a recent lastSeenAt', () => {
    expect(isWidgetEligible(NOW, daysAgo(1), null)).toBe(false);
  });

  it('pins the 20 second auto-dismiss and the 7 day interval', () => {
    expect(SUPPORT_WIDGET_AUTO_DISMISS_MS).toBe(20_000);
    expect(SUPPORT_WIDGET_INTERVAL_DAYS).toBe(7);
  });
});
```

- [ ] **Step 2: Rode os testes e confirme que falham**

```bash
pnpm --filter @aletheia/contracts test -- src/feedback.test.ts src/support-widget.test.ts
```

Esperado: FAIL — `Cannot find module './feedback.js'` e `Cannot find module './support-widget.js'`.

- [ ] **Step 3: Implemente `packages/contracts/src/support-widget.ts`**

A aritmética é exacta e as bordas importam, então vao fixadas aqui:

```ts
// Shared by the API (tests and any future server-side check) and the
// browser widget -- @aletheia/contracts is the only package both apps
// depend on, so the rule lives here instead of being duplicated.

export const SUPPORT_WIDGET_INTERVAL_DAYS = 7;
export const SUPPORT_WIDGET_AUTO_DISMISS_MS = 20_000;

// "Sempre" is stored as a far-future timestamp, never null: null means
// "no snooze", and the widget must be able to tell those apart.
export const SUPPORT_WIDGET_SNOOZE_FOREVER = '9999-12-31T23:59:59.999Z';

export type SupportWidgetSnoozePreset = 'WEEK' | 'MONTH' | 'FOREVER';

function addDays(from: Date, days: number): Date {
  const result = new Date(from.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

// Strictly greater-than on both comparisons: exactly 7 days after the last
// appearance is eligible again, and a snooze that expires exactly now has
// already expired.
export function isWidgetEligible(
  now: Date,
  lastSeenAt: Date | null,
  snoozedUntil: Date | null,
): boolean {
  if (snoozedUntil !== null && snoozedUntil.getTime() > now.getTime()) return false;
  if (lastSeenAt !== null && addDays(lastSeenAt, SUPPORT_WIDGET_INTERVAL_DAYS).getTime() > now.getTime()) {
    return false;
  }
  return true;
}
```

- [ ] **Step 4: Implemente `packages/contracts/src/feedback.ts`**

Seguindo `donation.ts`: enums primeiro, depois request schemas, depois response schemas, com `z.input` no DTO de request quando há `.default()` e `z.infer` no de response.

```ts
import { z } from 'zod';

export const feedbackCategorySchema = z.enum(['BUG', 'IDEA', 'QUESTION', 'PRAISE']);
export type FeedbackCategory = z.infer<typeof feedbackCategorySchema>;

export const feedbackStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type FeedbackStatus = z.infer<typeof feedbackStatusSchema>;

// No name/email fields on purpose: when identifySelf is true the API
// reads the submitter's own account through IDENTITY_PUBLIC_API, so a
// client can never attach someone else's identity to a submission.
export const createFeedbackSchema = z.object({
  category: feedbackCategorySchema,
  message: z.string().trim().min(10).max(4000),
  identifySelf: z.boolean().default(false),
  pagePath: z.string().max(200).optional(),
  locale: z.string().max(10).optional(),
  appVersion: z.string().max(40).optional(),
  userAgent: z.string().max(400).optional(),
});

export type CreateFeedbackDto = z.input<typeof createFeedbackSchema>;
export type CreateFeedbackOutput = z.output<typeof createFeedbackSchema>;

// Deliberately narrower than the admin view: the family never gets back
// submitterEmail or anything else that could leak across.
export const submitterFeedbackResponseSchema = z.object({
  id: z.string().uuid(),
  status: feedbackStatusSchema,
  category: feedbackCategorySchema,
  identifySelf: z.boolean(),
  createdAt: z.string(),
});

export type SubmitterFeedbackResponseDto = z.infer<typeof submitterFeedbackResponseSchema>;

export const approveFeedbackSchema = z.object({
  title: z.string().trim().min(5).max(180),
  labels: z.array(z.string().trim().min(1).max(50)).max(8).default([]),
  adminNote: z.string().trim().max(2000).optional(),
});

export type ApproveFeedbackDto = z.input<typeof approveFeedbackSchema>;
export type ApproveFeedbackOutput = z.output<typeof approveFeedbackSchema>;

export const rejectFeedbackSchema = z.object({
  reason: z.string().trim().min(5).max(1000),
});

export type RejectFeedbackDto = z.infer<typeof rejectFeedbackSchema>;

export const adminFeedbackResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  category: feedbackCategorySchema,
  message: z.string(),
  status: feedbackStatusSchema,
  identifySelf: z.boolean(),
  // Null whenever identifySelf is false -- the columns are only written
  // when the submitter explicitly consented at submission time.
  submitterName: z.string().nullable(),
  submitterEmail: z.string().nullable(),
  pagePath: z.string().nullable(),
  locale: z.string().nullable(),
  appVersion: z.string().nullable(),
  adminNote: z.string().nullable(),
  lastIssueError: z.string().nullable(),
  githubIssueNumber: z.number().int().nullable(),
  githubIssueUrl: z.string().nullable(),
  createdAt: z.string(),
  reviewedAt: z.string().nullable(),
});

export type AdminFeedbackResponseDto = z.infer<typeof adminFeedbackResponseSchema>;

export const listAdminFeedbackQuerySchema = z.object({
  status: feedbackStatusSchema.optional(),
  category: feedbackCategorySchema.optional(),
  take: z.number().int().positive().max(100).optional(),
  skip: z.number().int().min(0).optional(),
});

export type ListAdminFeedbackQueryDto = z.infer<typeof listAdminFeedbackQuerySchema>;

export const adminFeedbackListResponseSchema = z.object({
  items: z.array(adminFeedbackResponseSchema),
  total: z.number().int().nonnegative(),
});

export type AdminFeedbackListResponseDto = z.infer<typeof adminFeedbackListResponseSchema>;
```

- [ ] **Step 5: Registre os exports e os dois tipos de notificação**

Em `packages/contracts/src/index.ts`, acrescente após `export * from './donation.js';`:

```ts
export * from './feedback.js';
export * from './support-widget.js';
```

Em `packages/contracts/src/notification.ts`, acrescente `'FEEDBACK_APPROVED'` e `'FEEDBACK_REJECTED'` ao array de `notificationTypeSchema`.

Em `packages/contracts/src/settings.ts`:

- `updateFamilySettingsSchema` recebe `supportWidgetLastSeenAt: z.string().datetime().nullable().optional(),` e `supportWidgetSnoozedUntil: z.string().datetime().nullable().optional(),`
- `familySettingsResponseSchema` recebe `supportWidgetLastSeenAt: z.string().nullable(),` e `supportWidgetSnoozedUntil: z.string().nullable(),`

required-nullable (não `.optional()`) de propósito: a entidade sempre emite os dois, e required faz o TypeScript acusar se algum dia a entidade esquecer um deles.

- [ ] **Step 6: Ajuste os mocks de `FamilySettingsResponseDto` que agora falham**

`familySettingsResponseSchema` ganhou dois campos obrigatórios, então todo objeto literal tipado como `FamilySettingsResponseDto` precisa deles. Em `packages/contracts/src/settings.test.ts` e em `apps/web/tests/settings.test.tsx` (`mockSettings`, linha 29), acrescente `supportWidgetLastSeenAt: null` e `supportWidgetSnoozedUntil: null` ao literal. Depois rode `pnpm --filter @aletheia/contracts typecheck` e `pnpm --filter @aletheia/web typecheck` para caçar o resto.

- [ ] **Step 7: Rode tudo e confirme que passa**

```bash
pnpm --filter @aletheia/contracts test
pnpm --filter @aletheia/contracts typecheck
```

Esperado: PASS, 0 erros de tipo.

- [ ] **Step 8: Commit**

```bash
git add packages/contracts/src/feedback.ts packages/contracts/src/feedback.test.ts packages/contracts/src/support-widget.ts packages/contracts/src/support-widget.test.ts packages/contracts/src/index.ts packages/contracts/src/notification.ts packages/contracts/src/settings.ts packages/contracts/src/settings.test.ts apps/web/tests/settings.test.tsx
git commit -m "feat(contracts): schemas de feedback, elegibilidade do widget e tipos de notificacao"
```

---

### Task 2: Prisma — tabela `FeedbackSubmission`, enums e as duas colunas de cadência

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (`model User` recebe 2 back-relations; `model FamilySettings` recebe 2 colunas; `enum NotificationType` +2; `enum SensitiveDataResourceType` +1; 2 enums novos; `model FeedbackSubmission` novo)
- Create: `apps/api/prisma/migrations/20261004090000_weekly_support_widget/migration.sql` (gerado pelo Prisma, não escrito à mão)

**Interfaces:**
- Consumes: nada.
- Produz: tipos Prisma `FeedbackCategory`, `FeedbackStatus`, e o model `FeedbackSubmission` com `feedbackStatusSchema`/`feedbackCategorySchema` de `@aletheia/contracts` espelhando os enums.

- [ ] **Step 1: Rebase antes de mexer no schema**

```bash
git pull --rebase
git status --short apps/api/prisma
```

Se a outra frente já tiver mexido no `schema.prisma`, pare e rebaseie o work inteiro antes de continuar. Duas migrações geradas de schemas paralelos conflitam na ordem de aplicação.

- [ ] **Step 2: Escreva o schema**

Adicione em `model User` (junto das outras listas de relação, ex. `notifications NotificationItem[]`):

```prisma
  feedbackSubmissions  FeedbackSubmission[] @relation("FeedbackSubmitter")
  feedbackReviews      FeedbackSubmission[] @relation("FeedbackReviewer")
```

Em `model FamilySettings`, antes de `createdAt`:

```prisma
  supportWidgetLastSeenAt   DateTime? @map("support_widget_last_seen_at") @db.Timestamptz
  supportWidgetSnoozedUntil DateTime? @map("support_widget_snoozed_until") @db.Timestamptz
```

Enums novos (perto dos outros enums do arquivo):

```prisma
enum FeedbackCategory {
  BUG
  IDEA
  QUESTION
  PRAISE

  @@map("feedback_categories")
}

enum FeedbackStatus {
  PENDING
  APPROVED
  REJECTED

  @@map("feedback_statuses")
}
```

Acrescente `FEEDBACK_APPROVED` e `FEEDBACK_REJECTED` ao `enum NotificationType`, e `FEEDBACK_SUBMISSION` ao `enum SensitiveDataResourceType`.

Model novo (no fim do arquivo):

```prisma
model FeedbackSubmission {
  id                String            @id @default(uuid()) @db.Uuid
  familyId          String            @map("family_id") @db.Uuid
  submittedByUserId String            @map("submitted_by_user_id") @db.Uuid
  category          FeedbackCategory
  message           String            @db.Text

  // Technical context attached by the client at submission time. Every
  // field is optional and independent -- the client sends what it knows
  // and omits the rest.
  pagePath   String? @map("page_path")
  locale     String?
  appVersion String? @map("app_version")
  userAgent  String? @map("user_agent")

  // Identity snapshot, frozen at submission time and never editable
  // afterwards. With identifySelf = false these stay NULL: only
  // submittedByUserId is kept, which is all the audit trail and the
  // family notification need.
  identifySelf   Boolean @default(false) @map("identify_self")
  submitterName  String? @map("submitter_name")
  submitterEmail String? @map("submitter_email")

  status            FeedbackStatus @default(PENDING)
  adminNote         String?        @map("admin_note") @db.Text
  lastIssueError    String?        @map("last_issue_error")
  reviewedByUserId  String?        @map("reviewed_by_user_id") @db.Uuid
  reviewedAt        DateTime?      @map("reviewed_at") @db.Timestamptz
  githubIssueNumber Int?           @map("github_issue_number")
  githubIssueUrl    String?        @map("github_issue_url")

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  family      Family @relation(fields: [familyId], references: [id], onDelete: Cascade)
  submittedBy User   @relation("FeedbackSubmitter", fields: [submittedByUserId], references: [id], onDelete: Restrict)
  reviewedBy  User?  @relation("FeedbackReviewer", fields: [reviewedByUserId], references: [id], onDelete: SetNull)

  @@index([status, createdAt])
  @@index([familyId, createdAt])
  @@map("feedback_submissions")
}
```

- [ ] **Step 3: Gere a migração**

```bash
pnpm prisma:generate
pnpm --filter @aletheia/api prisma migrate dev --name weekly_support_widget
```

Esperado: uma pasta nova em `apps/api/prisma/migrations/` com nome carimbado pelo Prisma, contendo `CREATE TYPE` dos dois enums, os dois `ALTER TYPE ... ADD VALUE`, o `CREATE TABLE "feedback_submissions"` com os dois índices, e os dois `ALTER TABLE "family_settings" ADD COLUMN`.

**Não edite a migration à mão.** Se o Prisma gerar algo diferente do schema acima, o schema está errado — volte ao passo 2.

- [ ] **Step 4: Confirme que o schema regenera e o typecheck passa**

```bash
pnpm prisma:generate
pnpm --filter @aletheia/api typecheck
```

Esperado: 0 erros.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(api): tabela feedback_submissions e cadencia do widget semanal"
```

---

### Task 3: `FamilySettings` — as duas colunas de cadência ponta a ponta

**Files:**
- Modify: `apps/api/src/modules/settings/domain/family-settings.entity.ts` (2 props, 2 getters, 2 linhas no `toResponseDto`)
- Modify: `apps/api/src/modules/settings/infrastructure/family-settings.repository.ts` (2 campos no `FamilySettingsDbRecord`, 2 linhas no `upsert`, 2 linhas no `mapToEntity`)
- Test: `apps/api/src/modules/settings/application/family-settings.service.spec.ts`

**Interfaces:**
- Consumes: `FamilySettingsResponseDto` e `UpdateFamilySettingsDto` com os dois campos (Task 1).
- Produz: `FamilySettingsEntity.supportWidgetLastSeenAt: Date | null | undefined` e `.supportWidgetSnoozedUntil: Date | null | undefined`; `GET`/`PATCH /api/v1/families/:familyId/settings` carregando e gravando os dois. **Nenhum endpoint novo.**

- [ ] **Step 1: Escreva o teste que falha**

Acrescente ao `family-settings.service.spec.ts`, dentro do `describe` de `updateSettings`:

```ts
it('persists the widget cadence timestamps and reads them back, including the "sempre" sentinel', async () => {
  const now = new Date();
  const forever = new Date('9999-12-31T23:59:59.999Z');

  settingsRepository.upsert.mockImplementation(async (_familyId, dto) => ({
    ...existingSettings,
    supportWidgetLastSeenAt: dto.supportWidgetLastSeenAt === undefined ? null : new Date(dto.supportWidgetLastSeenAt),
    supportWidgetSnoozedUntil: dto.supportWidgetSnoozedUntil === undefined ? null : new Date(dto.supportWidgetSnoozedUntil),
  }));

  await service.updateSettings('fam-1', {
    supportWidgetLastSeenAt: now.toISOString(),
    supportWidgetSnoozedUntil: forever.toISOString(),
  });
  expect(settingsRepository.upsert).toHaveBeenCalledWith('fam-1', {
    supportWidgetLastSeenAt: now.toISOString(),
    supportWidgetSnoozedUntil: '9999-12-31T23:59:59.999Z',
  });

  // Clearing the snooze is the same single PATCH with null -- no special
  // case in the middle. lastSeenAt is untouched by that PATCH, so the
  // 7-day clock keeps running.
  await service.updateSettings('fam-1', { supportWidgetSnoozedUntil: null });
  expect(settingsRepository.upsert).toHaveBeenLastCalledWith('fam-1', { supportWidgetSnoozedUntil: null });
});
```

- [ ] **Step 2: Rode e confirme que falha**

```bash
pnpm --filter @aletheia/api test -- src/modules/settings/application/family-settings.service.spec.ts
```

Esperado: FAIL — campos `supportWidget*` não existem.

- [ ] **Step 3: Propague pelo entity e o repository**

`family-settings.entity.ts`: acrescente `supportWidgetLastSeenAt?: Date | null | undefined;` e `supportWidgetSnoozedUntil?: Date | null | undefined;` em `FamilySettingsProps`, os dois getters correspondentes, e em `toResponseDto()`:

```ts
      supportWidgetLastSeenAt: this.supportWidgetLastSeenAt ?? null,
      supportWidgetSnoozedUntil: this.supportWidgetSnoozedUntil ?? null,
```

`family-settings.repository.ts`: acrescente os dois campos em `FamilySettingsDbRecord`, mapeie os dois em `mapToEntity`, e no `upsert` trate-os como os timestamps opcionais — só entram no `update` quando o DTO traz o campo, para que um PATCH de `homeschoolName` não apague a cadência:

```ts
    const supportWidgetLastSeenAt =
      dto.supportWidgetLastSeenAt !== undefined
        ? dto.supportWidgetLastSeenAt
          ? new Date(dto.supportWidgetLastSeenAt)
          : null
        : undefined;
    const supportWidgetSnoozedUntil =
      dto.supportWidgetSnoozedUntil !== undefined
        ? dto.supportWidgetSnoozedUntil
          ? new Date(dto.supportWidgetSnoozedUntil)
          : null
        : undefined;
```

e no objeto `update`, no mesmo estilo condicional dos campos existentes:

```ts
        ...(supportWidgetLastSeenAt !== undefined ? { supportWidgetLastSeenAt } : {}),
        ...(supportWidgetSnoozedUntil !== undefined ? { supportWidgetSnoozedUntil } : {}),
```

- [ ] **Step 4: Rode e confirme que passa**

```bash
pnpm --filter @aletheia/api test -- src/modules/settings/application/family-settings.service.spec.ts
```

Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/settings/domain/family-settings.entity.ts apps/api/src/modules/settings/infrastructure/family-settings.repository.ts apps/api/src/modules/settings/application/family-settings.service.spec.ts
git commit -m "feat(api): persiste a cadencia do widget semanal em FamilySettings"
```

---

### Task 4: `GITHUB_ISSUE_GATEWAY` — interface, corpo da issue com escape, implementação real, mock e factory

**Files:**
- Create: `apps/api/src/modules/feedback/infrastructure/github-issue.gateway.interface.ts`
- Create: `apps/api/src/modules/feedback/infrastructure/github-issue-body.ts`
- Create: `apps/api/src/modules/feedback/infrastructure/github-issue.gateway.ts`
- Create: `apps/api/src/modules/feedback/infrastructure/github-issue-body.spec.ts` — **mais** `github-issue.gateway.spec.ts` (mesma suíte de testes, o spec lista os testes de escape em `github-issue.gateway.spec.ts`; o runner do API casa `*.spec.ts`, então um arquivo só é suficiente e menos atrapalha)
- Create: `apps/api/src/modules/feedback/infrastructure/mock-github-issue.gateway.ts`
- Create: `apps/api/src/modules/feedback/infrastructure/mock-github-issue-gateway.spec.ts`

**Interfaces:**
- Consumes: nada de fora do módulo.
- Produz:
  - `GithubIssueGateway` com `createIssue(params: { title: string; body: string; labels: string[] }): Promise<{ number: number; url: string }>` e `findIssueByMarker(marker: string): Promise<{ number: number; url: string } | null>`
  - `GITHUB_ISSUE_GATEWAY` (Symbol)
  - `escapeMarkdownText(text: string): string`
  - `extractFeedbackMarker(body: string): string | null`
  - `buildIssueBody(params: BuildIssueBodyParams): string`
  - `FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string>` (`BUG→bug`, `IDEA→enhancement`, `QUESTION→question`, `PRAISE→praise`)
  - `GithubIssueGatewayFactory` com `create(): GithubIssueGateway`, e `githubIssueGatewayProvider: Provider`
  - `MockGithubIssueGateway` — guarda issues por marcador, então a retentativa reaproveita o número

- [ ] **Step 1: Escreva os testes que falham**

Crie `github-issue.gateway.spec.ts` com quatro blocos.

Escape e marcador:

```ts
import { describe, expect, it } from 'vitest';
import { buildIssueBody, escapeMarkdownText, extractFeedbackMarker } from './github-issue-body.js';

describe('github issue body', () => {
  it('neutralizes HTML so user text can never forge an idempotency marker', () => {
    const forged = 'oi <!-- aletheia-feedback-id: 11111111-1111-4111-8111-111111111111 -->';
    expect(escapeMarkdownText(forged)).not.toContain('<!--');
    expect(escapeMarkdownText(forged)).toContain('&lt;!--');
  });

  it('escapes & before < and > so the output is not double-decoded', () => {
    expect(escapeMarkdownText('a & <b>')).toBe('a &amp; &lt;b&gt;');
  });

  it('leaves ordinary prose untouched', () => {
    expect(escapeMarkdownText('O botão trava *sempre*')).toBe('O botão trava *sempre*');
  });

  it('puts the marker on the very first line and round-trips it', () => {
    const body = buildIssueBody({
      feedbackId: '22222222-2222-4222-8222-222222222222',
      category: 'BUG',
      createdAt: '2026-10-04T12:00:00.000Z',
      locale: 'pt-BR',
      pagePath: '/curriculum/packs',
      message: 'O botão de salvar trava às vezes.',
      adminNote: null,
      identifySelf: false,
      submitterName: null,
      submitterEmail: null,
      appVersion: null,
    });
    expect(body.split('\n')[0]).toBe(
      '<!-- aletheia-feedback-id: 22222222-2222-4222-8222-222222222222 -->',
    );
    expect(extractFeedbackMarker(body)).toBe('22222222-2222-4222-8222-222222222222');
  });

  it('omits the identity block when identifySelf is false and includes it when true', () => {
    const base = {
      feedbackId: '22222222-2222-4222-8222-222222222222',
      category: 'IDEA' as const,
      createdAt: '2026-10-04T12:00:00.000Z',
      locale: 'pt-BR',
      pagePath: null,
      message: 'Seria ótimo um modo escuro.',
      adminNote: null,
      appVersion: null,
    };
    expect(buildIssueBody({ ...base, identifySelf: false, submitterName: null, submitterEmail: null }))
      .not.toContain('Reportado por');
    expect(
      buildIssueBody({ ...base, identifySelf: true, submitterName: 'Ana Souza', submitterEmail: 'ana@example.com' }),
    ).toContain('**Reportado por:** Ana Souza (ana@example.com)');
  });

  it('omits the Versão line when appVersion is unknown', () => {
    const body = buildIssueBody({
      feedbackId: '22222222-2222-4222-8222-222222222222',
      category: 'PRAISE' as const,
      createdAt: '2026-10-04T12:00:00.000Z',
      locale: 'pt-BR',
      pagePath: null,
      message: 'Adorei a rotina da manhã, muito obrigado!',
      adminNote: 'Manutencao 12',
      identifySelf: false,
      submitterName: null,
      submitterEmail: null,
      appVersion: null,
    });
    expect(body).not.toContain('**Versão:**');
    expect(body).toContain('### Contexto do time (administração)');
    expect(body).toContain('Manutencao 12');
  });
});
```

Gateway real (fetch mockado, no mesmo arquivo):

```ts
import { DonationGatewayFactory } from '../../donations/infrastructure/donation-gateway.factory.js';
import { ConfigService } from '../../donations/infrastructure/config.service.js';
import { GithubIssueGateway } from './github-issue.gateway.js';
import { GithubIssueGatewayFactory } from './github-issue.gateway.factory.js';

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

describe('GithubIssueGateway', () => {
  const env = { ...process.env };
  afterEach(() => { process.env = { ...env }; vi.unstubAllGlobals(); });

  it('POSTs to the issues endpoint with the auth and API-version headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ number: 321, html_url: 'https://github.com/Trinity-Grove/Aletheia/issues/321' }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const gateway = new GithubIssueGateway(new ConfigService()); // token via env in beforeEach

    const created = await gateway.createIssue({ title: 'Login trava', body: 'corpo', labels: ['feedback', 'bug'] });

    expect(created).toEqual({ number: 321, url: 'https://github.com/Trinity-Grove/Aletheia/issues/321' });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.github.com/repos/Trinity-Grove/Aletheia/issues');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer test-token');
    expect(init.headers['X-GitHub-Api-Version']).toBe('2022-11-28');
    expect(JSON.parse(init.body).labels).toEqual(['feedback', 'bug']);
  });

  it('throws with the upstream status when GitHub rejects the create', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'Bad credentials' }, false, 401)));
    const gateway = new GithubIssueGateway(new ConfigService());
    await expect(gateway.createIssue({ title: 'x'.repeat(5), body: 'b', labels: [] })).rejects.toThrow(/401/);
  });

  it('searches by marker and returns the issue when one matches', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ items: [{ number: 321, html_url: 'https://github.com/Trinity-Grove/Aletheia/issues/321' }] }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const gateway = new GithubIssueGateway(new ConfigService());

    const found = await gateway.findIssueByMarker('22222222-2222-4222-8222-222222222222');

    expect(found).toEqual({ number: 321, url: 'https://github.com/Trinity-Grove/Aletheia/issues/321' });
    expect(fetchMock.mock.calls[0]![0]).toContain('/search/issues?q=');
    expect(decodeURIComponent(fetchMock.mock.calls[0]![0] as string)).toContain(
      '"aletheia-feedback-id: 22222222-2222-4222-8222-222222222222" in:body repo:Trinity-Grove/Aletheia is:issue',
    );
  });

  it('returns null when the search finds nothing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ items: [] })));
    const gateway = new GithubIssueGateway(new ConfigService());
    expect(await gateway.findIssueByMarker('22222222-2222-4222-8222-222222222222')).toBeNull();
  });
});

describe('GithubIssueGatewayFactory', () => {
  const env = { ...process.env };
  afterEach(() => { process.env = { ...env }; vi.unstubAllGlobals(); });

  it('returns the mock outside production when no provider is configured', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.GITHUB_ISSUE_PROVIDER;
    expect(new GithubIssueGatewayFactory(new ConfigService()).create()).toBeInstanceOf(MockGithubIssueGateway);
  });

  it('returns the real gateway for provider=github', () => {
    process.env.NODE_ENV = 'test';
    process.env.GITHUB_ISSUE_PROVIDER = 'github';
    process.env.GITHUB_TOKEN = 'test-token';
    expect(new GithubIssueGatewayFactory(new ConfigService()).create()).toBeInstanceOf(GithubIssueGateway);
  });

  it('fails loudly when provider=github but GITHUB_TOKEN is missing', () => {
    process.env.NODE_ENV = 'test';
    process.env.GITHUB_ISSUE_PROVIDER = 'github';
    delete process.env.GITHUB_TOKEN;
    expect(() => new GithubIssueGatewayFactory(new ConfigService()).create()).toThrow(/GITHUB_TOKEN/);
  });

  it('never falls back to the mock in production, even without a provider', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.GITHUB_ISSUE_PROVIDER;
    delete process.env.GITHUB_TOKEN;
    expect(() => new GithubIssueGatewayFactory(new ConfigService()).create()).toThrow(/GITHUB_TOKEN/);
  });
});
```

Mock (terceiro bloco, no mesmo arquivo):

```ts
describe('MockGithubIssueGateway', () => {
  it('reuses the same issue number when the same marker is created twice', async () => {
    const gateway = new MockGithubIssueGateway();
    const body = buildIssueBody({
      feedbackId: '22222222-2222-4222-8222-222222222222',
      category: 'BUG', createdAt: '2026-10-04T12:00:00.000Z', locale: 'pt-BR', pagePath: null,
      message: 'O botão de salvar trava às vezes.', adminNote: null, identifySelf: false,
      submitterName: null, submitterEmail: null, appVersion: null,
    });
    const first = await gateway.createIssue({ title: 'Login trava', body, labels: [] });
    const second = await gateway.createIssue({ title: 'Login trava (2)', body, labels: [] });
    expect(second).toEqual(first);
    expect(await gateway.findIssueByMarker('22222222-2222-4222-8222-222222222222')).toEqual(first);
  });
});
```

- [ ] **Step 2: Rode e confirme que falha**

```bash
pnpm --filter @aletheia/api test -- src/modules/feedback/infrastructure/github-issue.gateway.spec.ts
```

Esperado: FAIL — `Cannot find module './github-issue-body.js'`.

- [ ] **Step 3: Crie a interface e o construtor de corpo**

`github-issue.gateway.interface.ts`, espelhando `donation-gateway.interface.ts`:

```ts
export interface GithubIssueGateway {
  createIssue(params: {
    title: string;
    body: string;
    labels: string[];
  }): Promise<{ number: number; url: string }>;

  // Used before every create: the GitHub call happens BEFORE the database
  // write (a Prisma transaction cannot be held open across network I/O),
  // so a partial failure leaves an issue with no row pointing at it. The
  // marker in the body is what makes the retry reuse instead of duplicate.
  findIssueByMarker(marker: string): Promise<{ number: number; url: string } | null>;
}

export const GITHUB_ISSUE_GATEWAY = Symbol('GITHUB_ISSUE_GATEWAY');
```

`github-issue-body.ts`:

```ts
import type { FeedbackCategory } from '@aletheia/contracts';

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  BUG: 'bug',
  IDEA: 'enhancement',
  QUESTION: 'question',
  PRAISE: 'praise',
};

const MARKER_PREFIX = 'aletheia-feedback-id';
const UUID = '[0-9a-fA-F-]{36}';

export function buildFeedbackMarker(feedbackId: string): string {
  return `<!-- ${MARKER_PREFIX}: ${feedbackId} -->`;
}

export function extractFeedbackMarker(body: string): string | null {
  const match = body.match(new RegExp(`<!--\\s*${MARKER_PREFIX}:\\s*(${UUID})\\s*-->`));
  return match?.[1] ?? null;
}

// HTML-escape, in this exact order, so `&` is not double-decoded. This is
// what stops a message containing "<!-- aletheia-feedback-id: ... -->" from
// forging another submission's marker and hijacking its approval. Markdown
// emphasis characters are deliberately left alone: the text is prose meant
// to read as the person wrote it.
export function escapeMarkdownText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface BuildIssueBodyParams {
  feedbackId: string;
  category: FeedbackCategory;
  createdAt: string;
  locale: string | null;
  pagePath: string | null;
  appVersion: string | null;
  message: string;
  adminNote: string | null;
  identifySelf: boolean;
  submitterName: string | null;
  submitterEmail: string | null;
}
```

`buildIssueBody` monta, nesta ordem: linha 1 `buildFeedbackMarker(feedbackId)`; `**Categoria:** <rótulo pt-BR>`; `**Relatado em:** <createdAt> · <locale>` (a linha inteira omitida se `locale` for null); `**Página:** <pagePath>` (omitida se null); `**Versão:** <appVersion>` (omitida se null); linha em branco; `escapeMarkdownText(message)`; `---` + `### Contexto do time (administração)` + `escapeMarkdownText(adminNote)` (o bloco todo omitido se `adminNote` for null); e, por último, `---` + `**Reportado por:** <name> (<email>)` apenas quando `identifySelf === true`.

Rótulos de categoria em pt-BR (as strings do repositório no dicionário de support são pt-BR): `BUG→Bug`, `IDEA→Ideia`, `QUESTION→Pergunta`, `PRAISE→Elogio`. Quando `identifySelf === true` mas `submitterName` é null, escreva `**Reportado por:** (nome não informado) (<email ou sem e-mail>)` — nunca a string `undefined`.

- [ ] **Step 4: Crie o gateway real**

`github-issue.gateway.ts`, espelhando `MercadoPagoDonationGateway` (mesmo `ConfigService | undefined` opcional do factory de donations, mesma leitura `this.config?.get(k) ?? process.env[k]`):

- `private headers()` devolve `{ Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', Authorization: 'Bearer ' + this.token() }`, onde `token()` lê `GITHUB_TOKEN` e **lança** `Error('GITHUB_TOKEN is required...')` se ausente/vazio.
- `private base()` devolve `` `https://api.github.com/repos/${owner}/${repo}` `` com `GITHUB_REPO_OWNER` (padrão `Trinity-Grove`) e `GITHUB_REPO_NAME` (padrão `Aletheia`).
- `createIssue` faz `POST {base}/issues` com `{ title, body, labels }` e devolve `{ number: data.number, url: data.html_url }`.
- `findIssueByMarker` faz `GET https://api.github.com/search/issues?q={encodeURIComponent(`"aletheia-feedback-id: ${marker}" in:body repo:${owner}/${repo} is:issue`)}&per_page=5` e devolve `{ number: items[0].number, url: items[0].html_url }` ou `null`.
- Nos dois: se `!res.ok`, lançar `` new Error(`GitHub ${res.status}: ${await res.text()}`) `` — o `status` no texto é o que a Task 6 grava em `lastIssueError`.

- [ ] **Step 5: Crie o mock e o factory**

`mock-github-issue.gateway.ts`: `@Injectable()`, guarda `Map<string, { number: number; url: string }>` e um contador interno começando em `900`. `createIssue` extrai o marcador com `extractFeedbackMarker(body)`; se já houver entrada, devolve a mesma; senão cria, guarda (quando houve marcador) e devolve com url `https://github.com/Trinity-Grove/Aletheia/issues/${number}`. `findIssueByMarker` devolve `this.issues.get(marker) ?? null`.

`github-issue.gateway.factory.ts`, espelhando `donation-gateway.factory.ts`:

```ts
create(): GithubIssueGateway {
  const provider =
    this.config?.get('GITHUB_ISSUE_PROVIDER') ?? process.env['GITHUB_ISSUE_PROVIDER'];
  const token = this.config?.get('GITHUB_TOKEN') ?? process.env['GITHUB_TOKEN'];
  const isProduction = (this.config?.get('NODE_ENV') ?? process.env['NODE_ENV']) === 'production';

  // Deliberate deviation from DonationGatewayFactory: there, a missing
  // token silently downgrades to a mock because a fake donation is
  // business. Here a fake approval is silently-lost admin work, so
  // production always demands a real token.
  if (provider === 'github' || isProduction) {
    if (!token) {
      throw new Error(
        'GITHUB_TOKEN is required to open GitHub issues from feedback approvals. ' +
          'Refusing to fall back to the mock gateway: an approval would report success without a real issue.',
      );
    }
    return new GithubIssueGateway(this.config);
  }

  return new MockGithubIssueGateway();
}

export const githubIssueGatewayProvider: Provider = {
  provide: GITHUB_ISSUE_GATEWAY,
  inject: [{ token: ConfigService, optional: true }],
  useFactory: (config?: ConfigService): GithubIssueGateway =>
    new GithubIssueGatewayFactory(config).create(),
};
```

- [ ] **Step 6: Rode e confirme que passa**

```bash
pnpm --filter @aletheia/api test -- src/modules/feedback/infrastructure/github-issue.gateway.spec.ts
```

Esperado: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/feedback/infrastructure
git commit -m "feat(api): gateway de issue no GitHub com marcador idempotente e escape de Markdown"
```

---

### Task 5: Persistência — `FeedbackRepository` e o lookup de papel da família

**Files:**
- Create: `apps/api/src/modules/feedback/infrastructure/feedback.repository.ts`
- Modify: `apps/api/src/modules/families/application/public-api.ts` (um método na interface)
- Modify: `apps/api/src/modules/families/application/family.service.ts` (o método)
- Modify: `apps/api/src/modules/families/infrastructure/family.repository.ts` (a query)
- Test: `apps/api/src/modules/families/application/family.service.spec.ts`

**Interfaces:**
- Consumes: tipos Prisma da Task 2.
- Produz:
  - `FeedbackRepository` com `create(data: CreateFeedbackData): Promise<FeedbackSubmission>`, `findById(id: string): Promise<FeedbackSubmission | null>`, `list(query: { status?: FeedbackStatus; category?: FeedbackCategory; take: number; skip: number }): Promise<{ items: FeedbackSubmission[]; total: number }>`, `markApproved(id, data: { adminNote: string | null; reviewedByUserId: string; githubIssueNumber: number; githubIssueUrl: string }): Promise<FeedbackSubmission>`, `markRejected(id, data: { adminNote: string; reviewedByUserId: string }): Promise<FeedbackSubmission>`, `recordIssueFailure(id: string, lastIssueError: string): Promise<void>`
  - `FamilyPublicApi.getFamilyMemberRole(userId: string, familyId: string): Promise<FamilyRole | null>`

- [ ] **Step 1: Escreva o teste que falha**

Em `family.service.spec.ts`:

```ts
it('reports the member role so callers can enforce guardian-only rules', async () => {
  familyRepository.findMemberRole.mockResolvedValue('CO_GUARDIAN');
  expect(await service.getFamilyMemberRole('user-1', 'fam-1')).toBe('CO_GUARDIAN');
});

it('returns null when the user is not a member of that family', async () => {
  familyRepository.findMemberRole.mockResolvedValue(null);
  expect(await service.getFamilyMemberRole('user-9', 'fam-1')).toBeNull();
});
```

- [ ] **Step 2: Rode e confirme que falha**

```bash
pnpm --filter @aletheia/api test -- src/modules/families/application/family.service.spec.ts
```

Esperado: FAIL — `findMemberRole` não existe no mock do repository.

- [ ] **Step 3: Implemente o lookup de papel**

`family.repository.ts`:

```ts
  async findMemberRole(familyId: string, userId: string): Promise<FamilyRole | null> {
    const member = await this.prisma.familyMember.findUnique({
      where: { family_members_family_user_unique: { familyId, userId } },
      select: { role: true },
    });
    return (member?.role as FamilyRole) ?? null;
  }
```

`family.service.ts`: `getFamilyMemberRole(userId, familyId)` delega e devolve o resultado. `public-api.ts`: acrescente `getFamilyMemberRole(userId: string, familyId: string): Promise<FamilyRole | null>;` à interface `FamilyPublicApi`, importando `FamilyRole` de `@aletheia/contracts`.

> Isto existe porque `FamilyTenantGuard` só checa vínculo (`isMember`, sem papel) e o JWT não carrega papel. A Task 6 é quem usa isto para barrar `EDUCATOR`.

- [ ] **Step 4: Rode e confirme que passa**

```bash
pnpm --filter @aletheia/api test -- src/modules/families/application/family.service.spec.ts
```

Esperado: PASS.

- [ ] **Step 5: Crie o `FeedbackRepository`**

Sem teste unitário próprio — é o mesmo tratamento que `DonationsRepository` recebe (persistência real coberta pela Task 8). `create` grava `category`, `message`, os 4 campos de contexto opcionais, `identifySelf`, e `submitterName`/`submitterEmail` **apenas quando `identifySelf === true`** (o resto do tempo, `null`). `list` aplica `where` por `status`/`category`, `orderBy: { createdAt: 'desc' }`, `take`/`skip`, e retorna `{ items, total }` com `total` vindo de um `prisma.feedbackSubmission.count` do mesmo `where`. `markApproved` e `markRejected` fazem `update` por `id` escrevendo `status`, `adminNote`, `reviewedByUserId`, `reviewedAt: new Date()` e — no approve — `githubIssueNumber`, `githubIssueUrl`, **`lastIssueError: null`**. `recordIssueFailure` faz `update` de **só** `lastIssueError`, sem tocar em `status`.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/feedback/infrastructure/feedback.repository.ts apps/api/src/modules/families/application/public-api.ts apps/api/src/modules/families/application/family.service.ts apps/api/src/modules/families/infrastructure/family.repository.ts apps/api/src/modules/families/application/family.service.spec.ts
git commit -m "feat(api): repositorio de feedback e consulta de papel na familia"
```

---

### Task 6: `FeedbackService` — envio, aprovação com idempotência, rejeição e notificação

**Files:**
- Create: `apps/api/src/modules/feedback/application/feedback.service.ts`
- Create: `apps/api/src/modules/feedback/application/feedback.service.spec.ts`

**Interfaces:**
- Consumes: `FeedbackRepository` (Task 5), `GITHUB_ISSUE_GATEWAY`/`buildIssueBody`/`FEEDBACK_CATEGORY_LABELS` (Task 4), `SettingsPublicApi`, `FamilyPublicApi.getFamilyMemberRole` (Task 5), `IdentityPublicApi.findUserById`, `PrivacyPublicApi.recordSensitiveDataAccess`.
- Produz:
  - `create(familyId: string, userId: string, dto: CreateFeedbackOutput): Promise<SubmitterFeedbackResponseDto>`
  - `list(query: ListAdminFeedbackQueryDto, actorUserId: string): Promise<AdminFeedbackListResponseDto>`
  - `getById(id: string, actorUserId: string): Promise<AdminFeedbackResponseDto>`
  - `approve(id: string, actorUserId: string, dto: ApproveFeedbackOutput): Promise<AdminFeedbackResponseDto>`
  - `reject(id: string, actorUserId: string, dto: RejectFeedbackDto): Promise<AdminFeedbackResponseDto>`

- [ ] **Step 1: Escreva os testes que falham**

Crie `feedback.service.spec.ts`. Mocks no padrão de `donations.service.spec.ts` (`jest.Mocked<T>` com objeto literal de `jest.fn()`), e as dependências injetadas nesta ordem:

```ts
const GUARDIAN_ROLES = ['OWNER_GUARDIAN', 'GUARDIAN', 'CO_GUARDIAN'];
```

Casos que precisam existir, cada um com o valor exato do spec:

```ts
describe('FeedbackService', () => {
  it('stores only submittedByUserId when identifySelf is false -- no name, no email duplicated', async () => {
    familyApi.getFamilyMemberRole.mockResolvedValue('GUARDIAN');
    identityApi.findUserById.mockResolvedValue({ fullName: 'Ana Souza', email: 'ana@example.com' } as UserSummaryDto);

    await service.create(FAMILY_ID, USER_ID, { category: 'BUG', message: 'O botão de salvar trava às vezes.', identifySelf: false });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ identifySelf: false, submitterName: null, submitterEmail: null }),
    );
    expect(identityApi.findUserById).not.toHaveBeenCalled();
  });

  it('freezes the submitter snapshot when identifySelf is true', async () => {
    familyApi.getFamilyMemberRole.mockResolvedValue('CO_GUARDIAN');
    identityApi.findUserById.mockResolvedValue({ fullName: 'Ana Souza', email: 'ana@example.com' } as UserSummaryDto);

    await service.create(FAMILY_ID, USER_ID, { category: 'IDEA', message: 'Seria ótimo um modo escuro no app.', identifySelf: true });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ identifySelf: true, submitterName: 'Ana Souza', submitterEmail: 'ana@example.com' }),
    );
  });

  it('rejects an EDUCATOR even though FamilyTenantGuard let the request through', async () => {
    familyApi.getFamilyMemberRole.mockResolvedValue('EDUCATOR');
    await expect(
      service.create(FAMILY_ID, USER_ID, { category: 'BUG', message: 'O botão de salvar trava às vezes.', identifySelf: false }),
    ).rejects.toThrow(ForbiddenException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws NotFound when identifySelf is true but the account cannot be read', async () => {
    familyApi.getFamilyMemberRole.mockResolvedValue('OWNER_GUARDIAN');
    identityApi.findUserById.mockResolvedValue(null);
    await expect(
      service.create(FAMILY_ID, USER_ID, { category: 'BUG', message: 'O botão de salvar trava às vezes.', identifySelf: true }),
    ).rejects.toThrow(NotFoundException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('never sends a notification while the submission is PENDING', async () => {
    repository.findById.mockResolvedValue(pendingRow);
    githubGateway.findIssueByMarker.mockRejectedValue(new Error('GitHub 503: Service Unavailable'));

    await expect(
      service.approve(FEEDBACK_ID, ADMIN_ID, { title: 'Botão de salvar trava', labels: [], adminNote: undefined }),
    ).rejects.toThrow(BadGatewayException);

    expect(repository.markApproved).not.toHaveBeenCalled();
    expect(repository.recordIssueFailure).toHaveBeenCalledWith(
      FEEDBACK_ID,
      expect.stringContaining('GitHub 503'),
    );
    expect(settingsApi.createNotification).not.toHaveBeenCalled();
    // status continua PENDING: recordIssueFailure não mexe em status
  });

  it('reuses the existing issue on retry instead of opening a second one', async () => {
    // partial-failure recovery: a issue existe no GitHub e o numero ja
    // foi gravado, mas o status ficou PENDING
    repository.findById.mockResolvedValue({ ...pendingRow, githubIssueNumber: 321, githubIssueUrl: 'https://github.com/Trinity-Grove/Aletheia/issues/321' });
    githubGateway.findIssueByMarker.mockResolvedValue({ number: 321, url: 'https://github.com/Trinity-Grove/Aletheia/issues/321' });

    await service.approve(FEEDBACK_ID, ADMIN_ID, { title: 'Botão de salvar trava', labels: [], adminNote: undefined });

    expect(githubGateway.createIssue).not.toHaveBeenCalled();
    expect(repository.markApproved).toHaveBeenCalledWith(
      FEEDBACK_ID,
      expect.objectContaining({ githubIssueNumber: 321, githubIssueUrl: 'https://github.com/Trinity-Grove/Aletheia/issues/321' }),
    );
  });

  it('always adds the feedback and category labels, deduped, whatever the admin sends', async () => {
    repository.findById.mockResolvedValue(pendingRow);
    githubGateway.findIssueByMarker.mockResolvedValue(null);
    githubGateway.createIssue.mockResolvedValue({ number: 322, url: 'https://github.com/Trinity-Grove/Aletheia/issues/322' });

    await service.approve(FEEDBACK_ID, ADMIN_ID, { title: 'Botão de salvar trava', labels: ['bug', 'ui'], adminNote: undefined });

    expect(githubGateway.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({ labels: ['feedback', 'bug', 'ui'] }),
    );
  });

  it('records APPROVED only after the issue exists', async () => {
    const order: string[] = [];
    githubGateway.createIssue.mockImplementation(async () => {
      order.push('github');
      return { number: 322, url: 'https://github.com/Trinity-Grove/Aletheia/issues/322' };
    });
    repository.markApproved.mockImplementation(async () => {
      order.push('db');
      return approvedRow;
    });

    await service.approve(FEEDBACK_ID, ADMIN_ID, { title: 'Botão de salvar trava', labels: [], adminNote: undefined });

    expect(order).toEqual(['github', 'db']);
  });

  it('notifies every member of the family with the issue link on approval', async () => {
    familyApi.getFamilyMemberUserIds.mockResolvedValue([USER_ID, 'co-guardian-1']);
    settingsApi.createNotification.mockResolvedValue(null);

    await service.approve(FEEDBACK_ID, ADMIN_ID, { title: 'Botão de salvar trava', labels: [], adminNote: undefined });

    expect(settingsApi.createNotification).toHaveBeenCalledTimes(2);
    expect(settingsApi.createNotification).toHaveBeenCalledWith(
      FEEDBACK_ID,
      expect.objectContaining({
        userId: 'co-guardian-1',
        type: 'FEEDBACK_APPROVED',
        linkUrl: 'https://github.com/Trinity-Grove/Aletheia/issues/322',
      }),
    );
  });

  it('notifies the family with the rejection reason', async () => {
    familyApi.getFamilyMemberUserIds.mockResolvedValue([USER_ID]);

    await service.reject(FEEDBACK_ID, ADMIN_ID, { reason: 'Fora do escopo do Aletheia' });

    expect(settingsApi.createNotification).toHaveBeenCalledWith(
      FAMILY_ID,
      expect.objectContaining({
        type: 'FEEDBACK_REJECTED',
        message: expect.stringContaining('Fora do escopo do Aletheia'),
      }),
    );
  });

  it('refuses to approve or reject a submission that is no longer PENDING', async () => {
    repository.findById.mockResolvedValue({ ...pendingRow, status: 'APPROVED' });
    await expect(
      service.approve(FEEDBACK_ID, ADMIN_ID, { title: 'Botão de salvar trava', labels: [], adminNote: undefined }),
    ).rejects.toThrow(ConflictException);
    await expect(service.reject(FEEDBACK_ID, ADMIN_ID, { reason: 'Fora do escopo' })).rejects.toThrow(ConflictException);
  });

  it('logs admin reads of the free-text message as sensitive data access', async () => {
    repository.findById.mockResolvedValue(pendingRow);

    await service.getById(FEEDBACK_ID, ADMIN_ID);

    expect(privacyApi.recordSensitiveDataAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: ADMIN_ID,
        familyId: FAMILY_ID,
        action: 'READ',
        resourceType: 'FEEDBACK_SUBMISSION',
        resourceId: FEEDBACK_ID,
      }),
    );
  });
});
```

- [ ] **Step 2: Rode e confirme que falha**

```bash
pnpm --filter @aletheia/api test -- src/modules/feedback/application/feedback.service.spec.ts
```

Esperado: FAIL — `Cannot find module './feedback.service.js'`.

- [ ] **Step 3: Implemente `create`**

```ts
@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    @Inject(GITHUB_ISSUE_GATEWAY) private readonly githubGateway: GithubIssueGateway,
    @Inject(SETTINGS_PUBLIC_API) private readonly settingsApi: SettingsPublicApi,
    @Inject(FAMILY_PUBLIC_API) private readonly familyApi: FamilyPublicApi,
    @Inject(IDENTITY_PUBLIC_API) private readonly identityApi: IdentityPublicApi,
    @Inject(PRIVACY_PUBLIC_API) private readonly privacyApi: PrivacyPublicApi,
  ) {}
```

`create(familyId, userId, dto)`:
1. `const role = await this.familyApi.getFamilyMemberRole(userId, familyId)`; se `role` não está em `['OWNER_GUARDIAN','GUARDIAN','CO_GUARDIAN']`, `throw new ForbiddenException('Only family guardians can send feedback.')`.
2. Se `dto.identifySelf`, `const user = await this.identityApi.findUserById(userId)`; se `!user`, `throw new NotFoundException('Authenticated user not found.')`. Senão, `submitterName`/`submitterEmail` ficam `null` **e `findUserById` não é chamado** (é o que o teste exige).
3. `const created = await this.feedbackRepository.create({ familyId, submittedByUserId: userId, category: dto.category, message: dto.message, pagePath: dto.pagePath ?? null, locale: dto.locale ?? null, appVersion: dto.appVersion ?? null, userAgent: dto.userAgent ?? null, identifySelf: dto.identifySelf, submitterName, submitterEmail })`.
4. Devolve `{ id, status: 'PENDING', category, identifySelf, createdAt: created.createdAt.toISOString() }`.

- [ ] **Step 4: Implemente `approve` — a ordem importa**

```ts
async approve(id, actorUserId, dto): Promise<AdminFeedbackResponseDto> {
  const submission = await this.requirePending(id);

  const marker = buildFeedbackMarker(submission.id);
  let issue: { number: number; url: string };
  try {
    issue = (await this.githubGateway.findIssueByMarker(marker)) ??
      (await this.githubGateway.createIssue({
        title: dto.title,
        body: buildIssueBody({ /* ...os campos do registro... */ }),
        labels: Array.from(new Set(['feedback', FEEDBACK_CATEGORY_LABELS[submission.category], ...dto.labels])),
      }));
  } catch (error) {
    // O relato nunca sai de PENDING: APPROVED significa que a issue
    // existe de fato. lastIssueError é o que o painel mostra para
    // "Tentar de novo".
    await this.feedbackRepository.recordIssueFailure(id, (error as Error).message);
    throw new BadGatewayException('Could not open the GitHub issue. The report is still pending.');
  }

  const approved = await this.feedbackRepository.markApproved(id, {
    adminNote: dto.adminNote ?? null,
    reviewedByUserId: actorUserId,
    githubIssueNumber: issue.number,
    githubIssueUrl: issue.url,
  });

  await this.notifyFamily(submission.familyId, 'FEEDBACK_APPROVED',
    'Seu feedback virou uma issue no GitHub',
    `O relato #${approved.githubIssueNumber} foi aberto.`,
    issue.url);

  return toAdminDto(approved);
}
```

Pontos que os testes prendem e que não podem ser "simplificados":
- `findIssueByMarker` **antes** de `createIssue`, sempre.
- `createIssue` **antes** de `markApproved` (o teste de ordem `['github','db']`).
- Nenhuma notificação no caminho de erro.
- `??` entre `findIssueByMarker` e `createIssue` garante o reuso quando a linha já tem `githubIssueNumber`.

- [ ] **Step 5: Implemente `reject`, `list`, `getById` e `notifyFamily`**

- `reject(id, actorUserId, dto)`: `requirePending(id)`, `markRejected(id, { adminNote: dto.reason, reviewedByUserId: actorUserId })`, notifica com `type: 'FEEDBACK_REJECTED'`, `title: 'Seu feedback não foi aceito'`, `message` contendo `dto.reason`, `linkUrl: null`.
- `list(query, actorUserId)`: `feedbackRepository.list({ status: query.status, category: query.category, take: query.take ?? 50, skip: query.skip ?? 0 })`, **uma** chamada `recordSensitiveDataAccess` com `resourceId: null` e `metadata: { count: items.length }`, devolve `{ items: items.map(toAdminDto), total }`.
- `getById(id, actorUserId)`: `findById`, `NotFoundException` se null, uma `recordSensitiveDataAccess` com `resourceId: id`.
- `requirePending(id)`: `findById`; null → `NotFoundException`; `status !== 'PENDING'` → `ConflictException`.
- `notifyFamily(familyId, type, title, message, linkUrl)`: `for (const userId of await this.familyApi.getFamilyMemberUserIds(familyId)) await this.settingsApi.createNotification(familyId, { userId, type, title, message, linkUrl });`. Não espera resultado — `createNotification` já devolve `null` quando a família desligou notificações no app.
- `toAdminDto(row)`: mapeia o registro para `AdminFeedbackResponseDto` com `createdAt`/`reviewedAt` em ISO.

- [ ] **Step 6: Rode e confirme que passa**

```bash
pnpm --filter @aletheia/api test -- src/modules/feedback/application/feedback.service.spec.ts
```

Esperado: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/feedback/application
git commit -m "feat(api): regras de envio, aprovacao idempotente e rejeicao de feedback"
```

---

### Task 7: Controllers, módulo e registro

**Files:**
- Create: `apps/api/src/modules/feedback/presentation/feedback.controller.ts`
- Create: `apps/api/src/modules/feedback/presentation/feedback.controller.spec.ts`
- Create: `apps/api/src/modules/feedback/presentation/feedback-admin.controller.ts`
- Create: `apps/api/src/modules/feedback/index.ts`
- Create: `apps/api/src/modules/feedback/feedback.module.ts`
- Modify: `apps/api/src/app.module.ts` (import + `FeedbackModule` no array)

**Interfaces:**
- Consumes: `FeedbackService` (Task 6).
- Produz: `POST /api/v1/families/:familyId/feedback`, `GET /api/v1/admin/feedback`, `GET /api/v1/admin/feedback/:id`, `POST /api/v1/admin/feedback/:id/approve`, `POST /api/v1/admin/feedback/:id/reject`.

- [ ] **Step 1: Escreva o teste que falha**

`feedback.controller.spec.ts`, no padrão de `donations.controller.spec.ts`: controller instanciado com um `FeedbackService` mockado, chamando o método diretamente e conferindo que `familyId` e o `userId` do `@CurrentUser('userId')` chegam ao service, e que `approve` propaga o `BadGatewayException` do service sem embrulhar.

- [ ] **Step 2: Rode e confirme que falha**

```bash
pnpm --filter @aletheia/api test -- src/modules/feedback/presentation/feedback.controller.spec.ts
```

Esperado: FAIL — `Cannot find module './feedback.controller.js'`.

- [ ] **Step 3: Crie `FeedbackController`**

Espelhe `donations.controller.ts` ao pé da letra: `@ApiTags('Feedback')`, `@ApiBearerAuth()`, `@UseGuards(JwtAuthGuard, FamilyTenantGuard)`, `@Controller({ path: 'families/:familyId/feedback', version: '1' })`, `@Post()` com `@HttpCode(HttpStatus.CREATED)`, `@ApiOperation`/`@ApiResponse` em 201/400/401/403, e `@Body(new ZodValidationPipe(createFeedbackSchema)) dto: CreateFeedbackDto`.

- [ ] **Step 4: Crie `FeedbackAdminController`**

Espelhe `admin-users.controller.ts`: `@ApiTags('Admin: Feedback')`, `@ApiBearerAuth()`, `@UseGuards(JwtAuthGuard, PlatformAdminGuard)`, `@Controller({ path: 'admin/feedback', version: '1' })`.

| Método | Rota | Assinatura |
|---|---|---|
| `GET` | `` | `list(@Query(new ZodValidationPipe(listAdminFeedbackQuerySchema)) query: ListAdminFeedbackQueryDto, @CurrentUser() caller: AuthenticatedUserPayload)` |
| `GET` | `:id` | `getOne(@Param('id') id: string, @CurrentUser() caller: AuthenticatedUserPayload)` |
| `POST` | `:id/approve` | `@HttpCode(HttpStatus.OK)` + `@Body(new ZodValidationPipe(approveFeedbackSchema)) dto: ApproveFeedbackDto` |
| `POST` | `:id/reject` | `@HttpCode(HttpStatus.OK)` + `@Body(new ZodValidationPipe(rejectFeedbackSchema)) dto: RejectFeedbackDto` |

Todos repassam `caller.userId` como `actorUserId`. O `approve` **não** intercepta `BadGatewayException` — ele vira 502 direto, que é o que o backoffice precisa para exibir "Tentar de novo".

- [ ] **Step 5: Crie o módulo e registre**

`feedback.module.ts`:

```ts
@Module({
  imports: [DatabaseModule, EnvironmentModule, SettingsModule, PrivacyModule, IdentityModule],
  controllers: [FeedbackController, FeedbackAdminController],
  providers: [
    GithubIssueGatewayFactory,
    githubIssueGatewayProvider,
    MockGithubIssueGateway,
    FeedbackRepository,
    FeedbackService,
  ],
  exports: [GITHUB_ISSUE_GATEWAY, FeedbackService, FeedbackRepository],
})
export class FeedbackModule {}
```

`FamiliesModule` e `IdentityModule` são `@Global()`, então `FAMILY_PUBLIC_API` e `IDENTITY_PUBLIC_API` chegam sem `imports`. `SettingsModule` e `PrivacyModule` não são globais — precisam estar na lista.

`index.ts` espelha `donations/index.ts`, exportando `FeedbackModule`, `FeedbackService`, `FeedbackRepository`, `GITHUB_ISSUE_GATEWAY` e o tipo `GithubIssueGateway`.

Em `app.module.ts`: import após `import { DonationsModule }` e `FeedbackModule` no array de `imports` logo depois de `DonationsModule`.

- [ ] **Step 6: Rode os testes e as fronteiras**

```bash
pnpm --filter @aletheia/api test -- src/modules/feedback
pnpm check:boundaries
pnpm --filter @aletheia/api typecheck
```

Esperado: PASS, 0 violações, 0 erros de tipo.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/feedback apps/api/src/app.module.ts
git commit -m "feat(api): endpoints de feedback da familia e de triagem no backoffice"
```

---

### Task 8: Teste de integração — o fluxo inteiro contra o Postgres real

**Files:**
- Create: `apps/api/test/feedback-github.integration-spec.ts`

**Interfaces:**
- Consumes: `createApplication` de `apps/api/src/main.js`, `registerAndConfirmGuardian` de `apps/api/test/helpers/register-verified-guardian.js`, `PLATFORM_ADMIN_EMAILS` para o admin.
- Produz: prova de que a Issue 8 do spec se sustenta ponta a ponta.

- [ ] **Step 1: Escreva o spec**

Siga `donations-mercadopago.integration-spec.ts`: `beforeAll` com `process.env.GITHUB_ISSUE_PROVIDER = 'mock'` e `app = await createApplication()`, duas famílias registradas com `registerAndConfirmGuardian`, uma delas admin via `PLATFORM_ADMIN_EMAILS`, `afterAll` com `app.close()` e `delete process.env.GITHUB_ISSUE_PROVIDER`.

Casos, cada um com o valor exato do spec:

```ts
it('stores an anonymous submission with no duplicated name or email', async () => {
  const res = await supertest(app.getHttpServer())
    .post(`/api/v1/families/${familyAId}/feedback`)
    .set('Cookie', familyACookie)
    .send({ category: 'BUG', message: 'O botão de salvar trava às vezes.' })
    .expect(201);

  expect(res.body).toMatchObject({ status: 'PENDING', category: 'BUG', identifySelf: false });
  expect(res.body).not.toHaveProperty('submitterEmail');
  expect(res.body).not.toHaveProperty('message'); // o DTO de autoatribuição é mais estreito
});

it('isolates families: family B cannot post into family A', async () => {
  await supertest(app.getHttpServer())
    .post(`/api/v1/families/${familyAId}/feedback`)
    .set('Cookie', familyBCookie)
    .send({ category: 'BUG', message: 'O botão de salvar trava às vezes.' })
    .expect(403);
});

it('freezes the identity snapshot only when the submitter opts in', async () => {
  await supertest(app.getHttpServer())
    .post(`/api/v1/families/${familyAId}/feedback`)
    .set('Cookie', familyACookie)
    .send({ category: 'IDEA', message: 'Seria ótimo um modo escuro no app.', identifySelf: true })
    .expect(201);

  const listed = await supertest(app.getHttpServer())
    .get('/api/v1/admin/feedback')
    .set('Cookie', adminCookie)
    .expect(200);

  const identified = listed.body.items.find((i: any) => i.category === 'IDEA');
  expect(identified.identifySelf).toBe(true);
  expect(identified.submitterName).toBe('Admin-ish Name');
  expect(identified.submitterEmail).toContain('@example.com');
});

it('keeps the submission PENDING and exposes the error when GitHub fails, and reuses the issue on retry', async () => {
  const created = await submitFeedback(familyACookie, { category: 'BUG', message: 'Login trava ao salvar.' });

  gatewaySpy.mockRejectedValueOnce(new Error('GitHub 502: Bad gateway'));
  const failed = await supertest(app.getHttpServer())
    .post(`/api/v1/admin/feedback/${created.id}/approve`)
    .set('Cookie', adminCookie)
    .send({ title: 'Login trava ao salvar' })
    .expect(502);

  const afterFailure = await supertest(app.getHttpServer())
    .get(`/api/v1/admin/feedback/${created.id}`)
    .set('Cookie', adminCookie)
    .expect(200);
  expect(afterFailure.body.status).toBe('PENDING');
  expect(afterFailure.body.lastIssueError).toContain('GitHub 502');

  const notificationsBefore = await countNotifications(familyAId);
  // ...retentativa...
  const ok = await supertest(app.getHttpServer())
    .post(`/api/v1/admin/feedback/${created.id}/approve`)
    .set('Cookie', adminCookie)
    .send({ title: 'Login trava ao salvar', labels: ['ui'] })
    .expect(200);
  expect(ok.body.status).toBe('APPROVED');
  expect(ok.body.githubIssueNumber).toBeGreaterThan(0);
  // a retentativa não cria uma segunda issue
  expect(gatewaySpy.mock.results.filter((r) => r.type === 'return').length).toBeGreaterThan(0);
});

it('notifies the family exactly once per outcome', async () => {
  // ...aprovação e rejeição de dois relatos distintos...
  // family member recebe FEEDBACK_APPROVED com linkUrl e FEEDBACK_REJECTED com o motivo
});

it('refuses a second approval of the same submission', async () => {
  // ...aprova uma vez, tenta de novo...
  await supertest(app.getHttpServer())
    .post(`/api/v1/admin/feedback/${id}/approve`)
    .set('Cookie', adminCookie)
    .send({ title: 'Login trava ao salvar' })
    .expect(409);
});

it('blocks a non-admin from the triage endpoints', async () => {
  await supertest(app.getHttpServer())
    .get('/api/v1/admin/feedback')
    .set('Cookie', familyACookie)
    .expect(403);
});
```

- [ ] **Step 2: Rode e confirme que passa**

```bash
pnpm --filter @aletheia/api test -- test/feedback-github.integration-spec.ts
```

Esperado: PASS contra o Postgres real, com a fronteira HTTP do GitHub mockada (o mesmo seam que `donations-mercadopago.integration-spec.ts` usa).

Se o banco de testes não estiver de pé, o comando falha no `beforeAll` — suba o Postgres e rode `pnpm --filter @aletheia/api exec prisma migrate deploy --schema prisma/schema.prisma` antes.

- [ ] **Step 3: Commit**

```bash
git add apps/api/test/feedback-github.integration-spec.ts
git commit -m "test(api): fluxo de feedback com GitHub contra o Postgres real"
```

---

### Task 9: Frontend — dicionário (3 locales), widget, modal e formulário

**Files:**
- Create: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/support-widget.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/index.ts` (import + uma linha no objeto)
- Create: `apps/web/src/components/support/weekly-support-widget.tsx`
- Create: `apps/web/src/components/support/support-widget-modal.tsx`
- Create: `apps/web/src/components/support/feedback-form.tsx`
- Create: `apps/web/src/components/support/index.ts`
- Test: `apps/web/tests/weekly-support-widget.test.tsx`

**Interfaces:**
- Consumes: `isWidgetEligible`, `SUPPORT_WIDGET_AUTO_DISMISS_MS`, `CreateFeedbackDto`, `SubmitterFeedbackResponseDto` (Task 1); `Modal`, `AletheiaIcon`, `Button`, `Card`, `Checkbox`, `Textarea` de `@aletheia/ui`; `DonationFormCard` de `./donation-form-card`; `api` de `../../lib/api`.
- Produz: `WeeklySupportWidget` com props `{ familyId: string | null; role: FamilyRole | null; pathname: string }` e callbacks `onSeen?: () => void`, `onSnoozed?: () => void`. `SupportWidgetModal` com `{ isOpen: boolean; onClose: () => void; familyId: string | null; onSnoozed: (preset: 'WEEK' | 'MONTH' | 'FOREVER') => void }`. `FeedbackForm` com `{ familyId: string; onSubmitted: () => void }`.

- [ ] **Step 1: Escreva o teste que falha**

`weekly-support-widget.test.tsx`, com `vi.mock('next/navigation')` e `vi.mock('next/link')` como em `product-shell.test.tsx`, e `globalThis.fetch` trocado por um `vi.fn()` como em `donation-support.test.tsx`.

Casos, com os valores exatos do spec:

```ts
describe('WeeklySupportWidget', () => {
  it('does not render while the 7-day clock is still running', () => {
    render(<WeeklySupportWidget familyId="fam-1" role="GUARDIAN" pathname="/" settings={settingsSixDaysAgo} />);
    expect(screen.queryByTestId('weekly-support-widget')).not.toBeInTheDocument();
  });

  it('renders once the snooze has been cleared but lastSeenAt is recent? no -- stays hidden', () => {
    // snooze null + lastSeenAt ontem => ainda oculto (Review Focus #2)
    render(<WeeklySupportWidget familyId="fam-1" role="GUARDIAN" pathname="/" settings={{ snoozedUntil: null, lastSeenAt: yesterday }} />);
    expect(screen.queryByTestId('weekly-support-widget')).not.toBeInTheDocument();
  });

  it('renders for a guardian and never for an EDUCATOR', () => {
    const { unmount } = render(<WeeklySupportWidget familyId="fam-1" role="OWNER_GUARDIAN" pathname="/" settings={eligible} />);
    expect(screen.getByTestId('weekly-support-widget')).toBeInTheDocument();
    unmount();
    render(<WeeklySupportWidget familyId="fam-1" role="EDUCATOR" pathname="/" settings={eligible} />);
    expect(screen.queryByTestId('weekly-support-widget')).not.toBeInTheDocument();
  });

  it('never renders on /support -- that page already offers everything', () => {
    render(<WeeklySupportWidget familyId="fam-1" role="GUARDIAN" pathname="/support" settings={eligible} />);
    expect(screen.queryByTestId('weekly-support-widget')).not.toBeInTheDocument();
  });

  it('PATCHes lastSeenAt as soon as it becomes eligible, without blocking the render', async () => {
    render(<WeeklySupportWidget familyId="fam-1" role="GUARDIAN" pathname="/" settings={eligible} onSeen={onSeen} />);
    await waitFor(() => expect(onSeen).toHaveBeenCalled());
    expect(api.patch).toHaveBeenCalledWith(
      '/families/fam-1/settings',
      expect.objectContaining({ body: expect.objectContaining({ supportWidgetLastSeenAt: expect.any(String) }) }),
    );
  });

  it('auto-dismisses after exactly 20 seconds and does not come back in the same session', () => {
    vi.useFakeTimers();
    render(<WeeklySupportWidget familyId="fam-1" role="GUARDIAN" pathname="/" settings={eligible} />);
    expect(screen.getByTestId('weekly-support-widget')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(SUPPORT_WIDGET_AUTO_DISMISS_MS - 1); });
    expect(screen.getByTestId('weekly-support-widget')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.queryByTestId('weekly-support-widget')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('sits above the tab bar and below any dialog', () => {
    render(<WeeklySupportWidget familyId="fam-1" role="GUARDIAN" pathname="/" settings={eligible} />);
    const button = screen.getByTestId('weekly-support-widget');
    expect(button).toHaveStyle({ zIndex: '200' });
  });
});

describe('SupportWidgetModal', () => {
  it('opens with two stacked shortcuts, not a random prompt', () => { /* ... */ });
  it('reuses DonationFormCard for the donation state -- no new payment code', () => {
    render(<SupportWidgetModal isOpen onClose={vi.fn()} familyId="fam-1" onSnoozed={vi.fn()} />);
    fireEvent.click(screen.getByTestId('support-widget-choose-donate'));
    expect(screen.getByTestId('donation-form-card')).toBeInTheDocument();
  });
});

describe('FeedbackForm', () => {
  it('ships identifySelf unchecked by default', () => {
    render(<FeedbackForm familyId="fam-1" onSubmitted={vi.fn()} />);
    expect(screen.getByTestId('feedback-identify-self')).not.toBeChecked();
  });

  it('warns that the text can become public', () => {
    render(<FeedbackForm familyId="fam-1" onSubmitted={vi.fn()} />);
    expect(screen.getByTestId('feedback-public-warning')).toHaveTextContent(/públic/i);
  });

  it('POSTs to the family feedback endpoint and refuses a message under 10 characters', async () => {
    // preenche categoria + 9 caracteres -> submit desabilitado, sem fetch
  });
});
```

- [ ] **Step 2: Rode e confirme que falha**

```bash
pnpm --filter @aletheia/web test -- tests/weekly-support-widget.test.tsx
```

Esperado: FAIL — `Cannot find module '../src/components/support/weekly-support-widget'`.

- [ ] **Step 3: Crie os três dicionários**

`pt-BR/support-widget.ts` exporta `supportWidget` com esta árvore (a estrutura é o contrato entre os três locales; escreva as traduções, não a chave):

```ts
export const supportWidget = {
  triggerLabel: 'Apoio e feedback',
  entry: {
    title: 'Podemos te ouvir',
    subtitle: 'O Aletheia é gratuito e sempre vai ser. Se quiserFILES sustentar o projeto ou contar alguma coisa que不易 we... ',
  },
} as const;
```

Escreva a árvore real, com estes nós: `triggerLabel`; `entry.title`, `entry.subtitle`, `entry.chooseSupport`, `entry.chooseSupportDescription`, `entry.chooseFeedback`, `entry.chooseFeedbackDescription`, `entry.dismissNow`, `entry.snoozeMenu`; `feedback.title`, `feedback.categoryLabel`, `feedback.categories.bug`, `.idea`, `.question`, `.praise`, `feedback.messageLabel`, `feedback.messagePlaceholder`, `feedback.identifySelfLabel`, `feedback.publicWarning`, `feedback.submit`, `feedback.submitting`, `feedback.success`, `feedback.error`, `feedback.tooShort`; `donation.fullPageLink`; `snooze.week`, `snooze.month`, `snooze.forever`, `snooze.label`; `settings.title`, `settings.description`, `settings.reactivateNow`, `settings.activeForever`, `settings.snoozedUntil`; `empty`.

Regras: `snooze.*` é **idêntico** nas três locales para os mesmos presets — nada de "7 dias" num lugar e "1 semana" no outro (decisão D4); os textos de notificação que o browser mostra (`feedback.success`, `feedback.error`) usam o mesmo vocabulário. Nenhum texto de usuário no componente pode ser literal em JSX.

- [ ] **Step 4: Registre nos três `index.ts`**

Em cada um de `apps/web/src/lib/i18n/dictionaries/pt-BR/index.ts`, `en-US/index.ts` e `es-ES/index.ts`: `import { supportWidget } from './support-widget';` e `supportWidget,` no objeto (o de `en-US` e `es-ES` continua tipado como `Dictionary`, então o TypeScript **exige** a mesma forma nos três).

- [ ] **Step 5: Implemente `weekly-support-widget.tsx`**

```tsx
export interface WeeklySupportWidgetSettings {
  lastSeenAt: string | null;
  snoozedUntil: string | null;
}

export interface WeeklySupportWidgetProps {
  familyId: string | null;
  role: FamilyRole | null;
  pathname: string;
  settings: WeeklySupportWidgetSettings;
  onSeen?: () => void;
  onSnoozed?: (preset: SupportWidgetSnoozePreset) => void;
}
```

Comportamento, passo a passo:
1. `const GUARDIAN_ROLES: FamilyRole[] = ['OWNER_GUARDIAN', 'GUARDIAN', 'CO_GUARDIAN']` no escopo do módulo.
2. `const [dismissed, setDismissed] = useState(false)`; auto-dismiss = `useEffect` com `setTimeout(() => setDismissed(true), SUPPORT_WIDGET_AUTO_DISMISS_MS)`, limpo no cleanup. Sem gravação extra — `lastSeenAt` já foi escrito.
3. Visível = `!dismissed && familyId !== null && GUARDIAN_ROLES.includes(role) && pathname !== '/support' && isWidgetEligible(new Date(), settings.lastSeenAt ? new Date(settings.lastSeenAt) : null, settings.snoozedUntil ? new Date(settings.snoozedUntil) : null)`. `lastSeenAt`/`snoozedUntil` são strings porque vêm do DTO.
4. Ao ficar visível pela primeira vez: `useEffect` que chama `api.patch(`/families/${familyId}/settings`, { supportWidgetLastSeenAt: new Date().toISOString() })` **sem await** (`.catch(() => {})`) e depois `onSeen?.()`. Guarde o副作用 com um `useRef` para não repetir em re-render.
5. Botão: `<button type="button" data-testid="weekly-support-widget" aria-label={t('supportWidget.triggerLabel')} onClick={() => setModalOpen(true)}>` com `<AletheiaIcon name="book" size={20} />` (`book` está no catálogo `ICON_NAMES` de `packages/ui/src/components/icon.tsx:313`; **zero imports diretos de `lucide-react`** em `apps/web`, é regra de `icon-governance.test.ts`).
6. Estilo inline, sem CSS module: `position: 'fixed'`, `right: '1.5rem'`, `bottom: '1.5rem'`, `width: 44`, `height: 44`, `borderRadius: '50%'`, `zIndex: 200`; e no mobile (`@media (max-width: 768px)` não funciona em estilo inline) — use a variável do design system direto: `bottom: 'calc(var(--ui-tab-bar-height) + env(safe-area-inset-bottom, 0px) + 0.75rem)'` como valor do atributo `style` via CSS custom property. Se preferir CSS inline com media query, o menor caminho é uma `<style jsx>`-free solução: defina a regra responsiva num `style` com `bottom: 'var(--support-widget-bottom, 1.5rem)'` e registre `--support-widget-bottom` no `:root` do `globals.css` do web com a media query. Escolha o caminho do `globals.css` — é o único que faz media query sem brings de CSS-in-JS.
7. Clique abre `SupportWidgetModal` com `isOpen={modalOpen}`.

- [ ] **Step 6: Implemente `support-widget-modal.tsx`**

`Modal` do `@aletheia/ui` (`isOpen`, `onClose`, `title`, `description`, `footer`, `maxWidth="sm"`), com três estados internos: `'entry' | 'feedback' | 'donation'`.

- `entry`: título, subtítulo, e os dois atalhos como **duas linhas empilhadas** (`data-testid="support-widget-choose-support"` e `support-widget-choose-feedback`), cada uma com `AletheiaIcon name="heart"` / `name="lightbulb"`, título e descrição. `footer` com `supportWidget.entry.dismissNow` e um botão de snooze que abre os três presets (`supportWidget.snooze.*`).
- `feedback`: renderiza `FeedbackForm`.
- `donation`: renderiza `<DonationFormCard familyId={familyId} />` dentro de uma `div[data-testid="donation-form-card"]`, mais um `Link` para `/support` com `supportWidget.donation.fullPageLink` (é lá que está o histórico de recibos). **Nenhum código de pagamento novo.**
- `onSnoozed(preset)` mapeia o preset para uma data e sobe: `'WEEK'` → `+7 dias`, `'MONTH'` → `+1 mês` (soma 1 no mês, preservando o dia), `'FOREVER'` → `new Date(SUPPORT_WIDGET_SNOOZE_FOREVER)`; **nunca `null`** (null significa "sem snooze" e é o que "Reativar agora" grava). Depois `api.patch(\`/families/${familyId}/settings\`, { supportWidgetSnoozedUntil: data.toISOString() })`, `onSnoozed(preset)`, `onClose()`.

- [ ] **Step 7: Implemente `feedback-form.tsx`**

Estado: `category`, `message`, `identifySelf` (inicial **`false`**), `submitting`, `errorMessage`. Envia `api.post(\`/families/${familyId}/feedback\`, { category, message, identifySelf, pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined, locale, userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 400) : undefined })` — **sem `appVersion`**: o app não tem constante de versão e o spec §5 proíbe criar uma só para isso. `identifySelf` controlado por um `checkbox[data-testid="feedback-identify-self"]`. Botão desabilitado enquanto `message.trim().length < 10`. Ao receber `SubmitterFeedbackResponseDto`, chama `onSubmitted()` e mostra `supportWidget.feedback.success`. Erro mostra `supportWidget.feedback.error` e **não** chama `onSubmitted`.

- [ ] **Step 8: Crie `index.ts` e rode tudo**

```bash
pnpm --filter @aletheia/web test -- tests/weekly-support-widget.test.tsx tests/i18n.test.tsx
pnpm --filter @aletheia/web test -- tests/icon-governance.test.ts
pnpm --filter @aletheia/web typecheck
```

Esperado: PASS nos três. `i18n.test.tsx` já traz dois guardrails genéricos (chave vazia, simetria de chaves e de `{var}` entre as três locales) que passam a valer para `supportWidget` sem precisar de teste novo.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/lib/i18n/dictionaries apps/web/src/components/support apps/web/tests/weekly-support-widget.test.tsx
git commit -m "feat(web): widget semanal de apoio e feedback com dicionarios nas tres locales"
```

---

### Task 10: Montagem no `ProductShell` e preferências nas Configurações

**Files:**
- Modify: `apps/web/src/components/layout/product-shell.tsx` (import + uma linha de render dentro do `AppShell`)
- Create: `apps/web/src/components/settings/support-widget-preferences-card.tsx`
- Modify: `apps/web/app/(dashboard)/settings/page.tsx` (import + `<SupportWidgetPreferencesCard familyId={familyId} />`)
- Test: `apps/web/tests/weekly-support-widget.test.tsx` (dois casos novos) e `apps/web/tests/settings-support-tab.test.tsx`

**Interfaces:**
- Consumes: `WeeklySupportWidget` (Task 9), `api`, `useLocale`.
- Produz: o widget em todas as telas do dashboard; a seção "Widget de apoio e feedback" nas Configurações.

- [ ] **Step 1: Escreva os testes que falham**

Em `weekly-support-widget.test.tsx`, acrescentar:

```ts
describe('ProductShell mount point', () => {
  it('mounts the widget once for a guardian on a dashboard page', async () => {
    // renderiza ProductShell com AuthContext/AuthRoleProvider no padrão de
    // product-shell.test.tsx, com nextNavigation.pathname = '/'
    expect(await screen.findByTestId('weekly-support-widget')).toBeInTheDocument();
  });

  it('does not mount it on /support', async () => {
    nextNavigation.pathname = '/support';
    render(/* ... */);
    expect(screen.queryByTestId('weekly-support-widget')).not.toBeInTheDocument();
  });
});
```

Em `settings-support-tab.test.tsx` (ou um arquivo novo ao lado), um caso para o card novo: renderiza, clica em "sempre", e espera

```ts
expect(api.patch).toHaveBeenCalledWith(
  '/families/fam-1/settings',
  expect.objectContaining({ body: expect.objectContaining({ supportWidgetSnoozedUntil: SUPPORT_WIDGET_SNOOZE_FOREVER }) }),
);
```

e um caso para "Reativar agora" que espera `supportWidgetSnoozedUntil: null` no mesmo endpoint.

- [ ] **Step 2: Rode e confirme que falha**

```bash
pnpm --filter @aletheia/web test -- tests/weekly-support-widget.test.tsx tests/settings-support-tab.test.tsx
```

Esperado: FAIL nos casos novos.

- [ ] **Step 3: Monte no `ProductShell`**

O `ProductShell` já tem `useOptionalAuth()` (dando `activeFamilyId`, `activeRole`), `usePathname()`, e busca as settings? **Não.** Então o wrapper precisa buscar os dois timestamps: um `useEffect` com `api.get<FamilySettingsResponseDto>(\`/families/${activeFamilyId}/settings\`)` no estado local, começando em `{ lastSeenAt: null, snoozedUntil: null }` e **não** renderizando o widget antes da resposta chegar (evita um piscar de elegibilidade em quem acabou de ser visto). Enquanto `familyId` for `null`, o fetch não roda.

Uma linha dentro do `<AppShell>`, junto do `UnverifiedEmailBanner`:

```tsx
{activeFamilyId && (
  <WeeklySupportWidget
    familyId={activeFamilyId}
    role={activeRole}
    pathname={pathname}
    settings={widgetSettings}
    onSnoozed={() => setWidgetSettings({ lastSeenAt: new Date().toISOString(), snoozedUntil: null })}
  />
)}
```

- [ ] **Step 4: Crie `SupportWidgetPreferencesCard`**

Espelhe `supporter-settings-card.tsx`: `'use client'`, props `{ familyId?: string | null }`, `const { t } = useLocale()`, `api.get` para ler e `api.patch` para gravar.

- Um `Card` com título `supportWidget.settings.title` e descrição `supportWidget.settings.description`.
- Quatro ações, **com o mesmo vocabulário do widget**: 1 semana, 1 mês, sempre, e "Reativar agora". "Reativar agora" faz `api.patch(..., { supportWidgetSnoozedUntil: null })` e fica desabilitado quando `snoozedUntil` já é `null`.
- Mostrar o estado atual com `formatDate` do `useLocale()`: quando `snoozedUntil` é maior que agora, `supportWidget.settings.snoozedUntil` com a data; quando é o sentinela `9999-12-31`, `supportWidget.settings.activeForever`.
- Erro de `PATCH` mostra `supportWidget.feedback.error` via `Alert` do `@aletheia/ui`; não trava a página.

- [ ] **Step 5: Renderize o card na página de Configurações**

Em `apps/web/app/(dashboard)/settings/page.tsx`: import e `<SupportWidgetPreferencesCard familyId={familyId} />` logo abaixo de `<SupporterSettingsCard familyId={familyId} />`.

- [ ] **Step 6: Rode e confirme que passa**

```bash
pnpm --filter @aletheia/web test
pnpm --filter @aletheia/web typecheck
```

Esperado: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/layout/product-shell.tsx apps/web/src/components/settings/support-widget-preferences-card.tsx "apps/web/app/(dashboard)/settings/page.tsx" apps/web/tests/weekly-support-widget.test.tsx apps/web/tests/settings-support-tab.test.tsx
git commit -m "feat(web): monta o widget no ProductShell e a preferencia de snooze nas Configuracoes"
```

---

### Task 11: Backoffice — dicionário, página de triagem e item de nav

**Files:**
- Create: `apps/backoffice/src/lib/i18n/dictionaries/pt-BR/feedback.ts`
- Modify: `apps/backoffice/src/lib/i18n/dictionaries/pt-BR/index.ts` (import + uma linha)
- Create: `apps/backoffice/src/components/feedback/feedback-triage-dashboard.tsx`
- Create: `apps/backoffice/app/feedback/page.tsx`
- Modify: `apps/backoffice/src/components/layout/admin-shell.tsx` (5º item de nav)
- Test: `apps/backoffice/tests/feedback-triage.test.tsx`

**Interfaces:**
- Consumes: `AdminFeedbackResponseDto`, `AdminFeedbackListResponseDto`, `ApproveFeedbackOutput`, `RejectFeedbackDto`, `FeedbackCategory`, `FeedbackStatus` (Task 1); `api` de `../../lib/api`.
- Produz: rota `/feedback` no backoffice com lista, painel de detalhe, aprovar/rejeitar e retentativa.

- [ ] **Step 1: Escreva o teste que falha**

`feedback-triage.test.tsx`, no padrão de `operations-dashboard.test.tsx`: `vi.mock('next/navigation')`, `vi.spyOn(api, 'get')` / `vi.spyOn(api, 'post')` com `mockImplementation` por path, `<AdminAuthProvider>` + página.

```ts
it('lists pending reports and labels each as anonymous or identified', async () => {
  render(<AdminAuthProvider user={mockAdminUser}><FeedbackPage /></AdminAuthProvider>);
  expect(await screen.findByTestId('feedback-row-1')).toHaveTextContent('Relato anônimo');
  expect(screen.getByTestId('feedback-row-2')).toHaveTextContent('Autor identificado');
});

it('opens the detail panel with the full text and the admin-only fields', async () => {
  // ...clica na row...
  expect(screen.getByTestId('feedback-detail-title')).toBeInTheDocument();
  expect(screen.getByTestId('feedback-admin-note')).toBeInTheDocument();
  expect(screen.getByLabelText(/labels?/i)).toBeInTheDocument();
});

it('prefills the approval labels with feedback + the category label and posts them', async () => {
  // ...clica em Aprovar e abrir issue, preenche o título, submete...
  expect(api.post).toHaveBeenCalledWith(
    '/admin/feedback/fb-1/approve',
    expect.objectContaining({ body: expect.objectContaining({ labels: ['feedback', 'bug'] }) }),
  );
});

it('keeps the report pending and shows the error with a retry action when GitHub fails', async () => {
  apiPostSpy.mockRejectedValueOnce(new ApiError('Could not open the GitHub issue...', 502));
  // ...aprove...
  expect(await screen.findByTestId('feedback-issue-error')).toHaveTextContent(/GitHub/i);
  expect(screen.getByTestId('feedback-retry-approve')).toBeInTheDocument();
  // e o status na linha continua PENDING
});

it('never renders the submitter email when the report is anonymous', () => {
  expect(screen.queryByText(/ana@example.com/)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Rode e confirme que falha**

```bash
pnpm --filter @aletheia/backoffice test -- tests/feedback-triage.test.tsx
```

Esperado: FAIL — `Cannot find module '../app/feedback/page'`.

- [ ] **Step 3: Crie o dicionário pt-BR**

`feedback.ts` exporta `feedback` com `pageTitle`, `subtitle`, `columnCategory`, `columnDate`, `columnStatus`, `columnIdentity`, `identity.anonymous` (`'Relato anônimo'`), `identity.identified` (`'Autor identificado'`), `panel.title`, `panel.message`, `panel.context`, `panel.adminNoteLabel`, `panel.approveTitleLabel`, `panel.labelsLabel`, `action.approve`, `action.reject`, `action.retryApprove`, `action.cancel`, `reject.reasonLabel`, `reject.reasonPlaceholder`, `status.PENDING/APPROVED/REJECTED`, `empty`, `error`, `issueLink`, `issueError`. Registre em `dictionaries/pt-BR/index.ts` (`export type Dictionary = typeof ptBR`, então o registro basta). **Não crie `en-US`/`es-ES` aqui** — o backoffice mapeia as três locales para `ptBR`.

- [ ] **Step 4: Crie `FeedbackTriageDashboard`**

`'use client'`. Estado: `items`, `total`, `statusFilter`, `categoryFilter`, `selectedId`, `loading`, `errorMessage`, `issueError`, `approving`.

- Carga: `api.get<AdminFeedbackListResponseDto>('/admin/feedback', { params: { status: statusFilter ?? undefined, category: categoryFilter ?? undefined, take: 50 } })`, num `useEffect` que depende dos filtros.
- Lista: uma linha por relato com `data-testid={\`feedback-row-${item.id}\`},` a categoria, `formatDate(item.createdAt)` do `useLocale()`, o selo `feedback.identity.anonymous` / `.identified` decidido por `item.identifySelf`, e `feedback.status[item.status]`.
- Detalhe: painel com o texto **literal** (`item.message`), o contexto (`pagePath`, `locale`, `appVersion`), um campo de título, checkboxes de label pré-marcados com `['feedback', <rótulo da categoria>]` editáveis, e a nota da administração (`feedback.adminNoteLabel`).
- Aprovar: `api.post(\`/admin/feedback/${id}/approve\`, { title, labels, adminNote: adminNote || undefined })`. Em sucesso: mostra `feedback.issueLink` apontando para `item.githubIssueUrl`. Em `ApiError` com status 502: `setIssueError(...)`, **sem** mexer no status na lista, e o botão vira `action.retryApprove` — o mesmo endpoint, porque o relato continua `PENDING` no servidor.
- Rejeitar: `api.post(\`/admin/feedback/${id}/reject\`, { reason })` com o campo de motivo **obrigatório** (botão desabilitado enquanto `reason.trim().length < 5`, o mesmo piso do contrato).
- O texto do usuário **nunca** é editável: o painel mostra, o admin edita só `title` e `adminNote`.

- [ ] **Step 5: Crie a página e o item de nav**

`app/feedback/page.tsx`, três linhas espelhando `app/moderation/page.tsx`: `'use client'`, `<AdminShell><FeedbackTriageDashboard /></AdminShell>`.

Em `admin-shell.tsx`, acrescente o 5º item ao array `navItems`, **depois** de `moderation` e **antes** de `users`:

```ts
{ href: '/feedback', label: 'Feedback da Comunidade' },
```

O label segue o padrão das outras entradas (pt-BR literal na nav); a tradução real vive na página.

- [ ] **Step 6: Rode e confirme que passa**

```bash
pnpm --filter @aletheia/backoffice test
pnpm --filter @aletheia/backoffice typecheck
```

Esperado: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/backoffice/src/lib/i18n/dictionaries/pt-BR apps/backoffice/src/components/feedback apps/backoffice/app/feedback apps/backoffice/src/components/layout/admin-shell.tsx apps/backoffice/tests/feedback-triage.test.tsx
git commit -m "feat(backoffice): triagem de feedback com aprovacao, rejeicao e retentativa"
```

---

### Task 12: Documentação das variáveis de ambiente e portões finais

**Files:**
- Create: `docs/operations/github-integration.md`
- Test: nenhum (documentação + verificação global)

**Interfaces:**
- Consumes: tudo das Tasks 1-11.
- Produz: a documentação que o time precisa para configurar `GITHUB_TOKEN` em Railway, e a prova de que os portões de qualidade passam.

- [ ] **Step 1: Escreva a documentação**

`docs/operations/github-integration.md`, no formato de tabela de `docs/operations/observability.md`:

| Variável | Padrão | Papel |
|---|---|---|
| `GITHUB_ISSUE_PROVIDER` | derivado | `github` força a implementação real; qualquer outro valor usa o mock |
| `GITHUB_TOKEN` | — | PAT com escopo `repo`. **Ausente em produção = a aplicação não sobe** |
| `GITHUB_REPO_OWNER` | `Trinity-Grove` | Dono do repositório |
| `GITHUB_REPO_NAME` | `Aletheia` | Nome do repositório |

Mais, em prosa: o mock nunca é usado em `NODE_ENV=production` (desvio deliberado de `DonationGatewayFactory`, justificado: uma doação falsa é negócio, uma aprovação falsa é trabalho de administração perdido); como o marcador `<!-- aletheia-feedback-id: ... -->` torna a retentativa idempotente; e que a issue vai para um repositório **público**, o que é a razão do opt-in de identificação e do aviso no formulário.

- [ ] **Step 2: Rode os três portões**

```bash
pnpm check:boundaries
pnpm -r typecheck
pnpm -r test
```

Esperado: os três verdes, 0 erros. Se `pnpm -r test` reclamar de spec de integração por falta de banco, rode `pnpm --filter @aletheia/api test -- test/feedback-github.integration-spec.ts` separadamente e reporte o que falhou — não deixe a Task 8 sem prova.

- [ ] **Step 3: Confira a Definition of Done do spec, item por item**

Reaja em `docs/superpowers/specs/2026-10-04-weekly-support-feedback-widget-design.md` §16: 1x por semana para papéis de responsável, auto-dismiss em 20s, snooze 1 semana / 1 mês / sempre no widget **e** nas Configurações; modal com dois atalhos e `DonationFormCard` reusado; relato anônimo por padrão com snapshot congelado no opt-in; selo de anônimo/identificado no backoffice; issue com marcador idempotente e retentativa sem duplicar; falha do GitHub mantendo `PENDING` com erro visível e "Tentar de novo"; notificação nos dois desfechos; paridade `pt-BR`/`en-US`/`es-ES`; os três portões verdes.

- [ ] **Step 4: Commit**

```bash
git add docs/operations/github-integration.md
git commit -m "docs: variaveis de ambiente da integracao com o GitHub"
```