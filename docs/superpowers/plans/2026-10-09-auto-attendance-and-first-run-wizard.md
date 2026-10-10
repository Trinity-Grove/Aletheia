# Auto-Frequência na Conclusão de Lição & Guia de Primeiros Passos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o auto-registro de presença na conclusão de lições (eliminando redundância manual dos pais) e o checklist de primeiros passos no Dashboard (*First-Run Guide* com 4 etapas e barra de progresso), reduzindo o overhead operacional e o atrito no primeiro uso.

**Architecture:** O `LessonPlanService` da API orquestra a presença chamando o contrato público `COMPLIANCE_REPORTS_PUBLIC_API.logAttendance` de forma idempotente, respeitando apontamentos manuais existentes. O `DashboardService` calcula dinamicamente o progresso do onboarding (4 marcos) no mesmo payload do dashboard, persistindo o estado de dismiss em `family_settings`. No frontend (`apps/web`), o `<GettingStartedCard>` guia a família no topo da tela com links diretos, e a conclusão de lições exibe feedback visual amigável.

**Tech Stack:** pnpm workspaces, NestJS + Prisma + Postgres (Jest), Next.js App Router + Vitest + Testing Library, Zod 4 em `@aletheia/contracts`, Tailwind CSS e `@aletheia/ui`.

**Spec:** `docs/superpowers/specs/2026-10-09-auto-attendance-and-first-run-wizard-design.md` — o plano argumenta a partir do spec; os dois viajam juntos e quem executa lê ambos.

---

## Global Constraints

- **Sem dependência npm nova:** Todas as rotinas utilizam as bibliotecas existentes no workspace.
- **Zero string hardcoded de UI em JSX:** Toda chave nova em `pt-BR` precisa de `en-US` e `es-ES` no mesmo commit. O scanner estático (`node scripts/audit-i18n-coverage.mjs`) e os guardrails de i18n bloqueiam o build se faltar tradução ou variável `{var}`.
- **Fronteiras de módulo (`pnpm check:boundaries`):** Um módulo só importa de outro módulo via `*/application/public-api`. O `lessons.module.ts` importa `reports.module.js` na raiz e consome `COMPLIANCE_REPORTS_PUBLIC_API`.
- **Escrever `git add` só com caminho explícito:** Nunca `git add -A`, nunca `git commit -a`.
- **TypeScript 5.9 estrito com `exactOptionalPropertyTypes: true`:** Callbacks e propriedades opcionais devem usar sintaxe de método em interfaces ou evitar passar `undefined` explícito.
- **Zero trailers de atribuição de IA:** Sem `Co-Authored-By`, `Generated-By`, etc., em commits, comentários ou PRs.
- **Portões de qualidade obrigatórios:** `pnpm check:boundaries`, `pnpm -r typecheck`, `pnpm lint`, testes unitários e de integração verdes.

---

## File Structure & Responsibilities

| Arquivo | Responsabilidade |
|---|---|
| `packages/contracts/src/reports.ts` | Enum `AttendanceSource`, schema de presença com `source: 'AUTO_LESSON'` |
| `packages/contracts/src/dashboard.ts` | Schemas `OnboardingStepDto`, `OnboardingChecklistDto` e extensão do `DashboardResponseDto` |
| `packages/contracts/src/settings.ts` | Adicionar `onboardingDismissed` em `FamilySettingsResponseDto` e update DTO |
| `apps/api/prisma/schema.prisma` | Colunas `source` em `attendance_records` e `onboardingDismissed` em `family_settings` |
| `apps/api/src/modules/lessons/application/lesson-plan.service.ts` | Auto-frequência idempotente em `completeLesson` via `COMPLIANCE_REPORTS_PUBLIC_API` |
| `apps/api/src/modules/lessons/lessons.module.ts` | Importação de `ReportsModule` para injeção de dependência |
| `apps/api/src/modules/dashboard/application/dashboard.service.ts` | Cálculo dos 4 marcos do checklist no payload de dashboard |
| `apps/web/src/components/dashboard/getting-started-card.tsx` | Componente de interface do checklist com barra de progresso e links de ação |
| `apps/web/app/(dashboard)/page.tsx` | Montagem do `<GettingStartedCard>` no topo do dashboard |
| `apps/web/src/components/learner-portal/learner-reflection-modal.tsx` | Toast/feedback visual de auto-frequência na conclusão de lição |
| `apps/web/src/components/reports/attendance-tracker-view.tsx` | Badge de origem `"Auto (Lição)"` na listagem de presença |
| `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/*.ts` | Dicionários sincronizados para dashboard, lessons e reports |

---

## Tasks

### Task 1: Contratos e DTOs Compartilhados (`@aletheia/contracts`)

- [ ] **Step 1: Escrever testes unitários para os novos schemas**
  - Em `packages/contracts/src/reports.test.ts`: testar que `logAttendanceSchema` aceita `source: 'AUTO_LESSON'` e padroniza para `'MANUAL'`.
  - Em `packages/contracts/src/dashboard.test.ts`: testar validação de `onboardingChecklistSchema` e presença opcional em `dashboardResponseSchema`.
  - Em `packages/contracts/src/settings.test.ts`: testar `onboardingDismissed` em `familySettingsResponseSchema`.
- [ ] **Step 2: Executar testes para capturar falha (RED)**
  - Comando: `pnpm --filter @aletheia/contracts test`
- [ ] **Step 3: Implementar schemas e tipos em `packages/contracts`**
  - Adicionar `attendanceSourceSchema` e atualizar `logAttendanceSchema` e `attendanceResponseSchema` em `packages/contracts/src/reports.ts`.
  - Adicionar `onboardingStepIdSchema`, `onboardingStepSchema`, `onboardingChecklistSchema` e estender `dashboardResponseSchema` em `packages/contracts/src/dashboard.ts`.
  - Adicionar `onboardingDismissed` em `packages/contracts/src/settings.ts`.
  - Reexportar tudo em `packages/contracts/src/index.ts`.
- [ ] **Step 4: Executar testes e build de contratos (GREEN)**
  - Comando: `pnpm --filter @aletheia/contracts test && pnpm --filter @aletheia/contracts build`
- [ ] **Step 5: Commit das alterações**
  - `git add packages/contracts/`
  - `git commit -m "feat(contracts): attendance source and onboarding checklist schemas"`

---

### Task 2: Modelo de Dados Prisma e Migração (`apps/api/prisma`)

- [ ] **Step 1: Atualizar `schema.prisma`**
  - Em `apps/api/prisma/schema.prisma`:
    - Adicionar `source String @default("MANUAL") @db.VarChar(32)` na tabela `attendance_records`.
    - Adicionar `onboardingDismissed Boolean @default(false)` na tabela `family_settings`.
- [ ] **Step 2: Gerar migração e Prisma Client**
  - Comando: `pnpm --filter @aletheia/api prisma migrate dev --name auto_attendance_and_onboarding_dismissed`
  - Se estiver em ambiente sem banco interativo: `pnpm --filter @aletheia/api prisma migrate deploy` ou criar o arquivo `.sql` de migração limpa.
  - Gerar client: `pnpm --filter @aletheia/api prisma:generate`
- [ ] **Step 3: Atualizar entidades e repositórios da API**
  - Em `apps/api/src/modules/reports/domain/attendance-record.entity.ts`: incluir `source` nas propriedades e no método `toResponseDto()`.
  - Em `apps/api/src/modules/reports/infrastructure/attendance.repository.ts`: mapear `source` no Prisma `create`/`bulkCreate` e na leitura.
  - Em `apps/api/src/modules/settings/domain/family-settings.entity.ts`: incluir `onboardingDismissed`.
  - Em `apps/api/src/modules/settings/infrastructure/family-settings.repository.ts`: persistir e ler `onboardingDismissed`.
- [ ] **Step 4: Executar typecheck e testes de repositório**
  - Comando: `pnpm --filter @aletheia/api test src/modules/reports src/modules/settings`
- [ ] **Step 5: Commit das alterações**
  - `git add apps/api/prisma/ apps/api/src/modules/reports/ apps/api/src/modules/settings/`
  - `git commit -m "feat(api): persist attendance source and onboarding dismissed preference"`

---

### Task 3: Backend — Auto-Frequência Idempotente no `LessonPlanService` (`apps/api`)

- [ ] **Step 1: Escrever testes unitários em `lesson-plan.service.spec.ts` (RED)**
  - Teste 1: Concluir lição (`completeLesson`) sem presença anterior no dia invoca `complianceApi.logAttendance` com `status: 'PRESENT'`, `source: 'AUTO_LESSON'` e notas adequadas.
  - Teste 2: Se já existe presença `PRESENT` no dia para o educando, a chamada é idempotente e não cria duplicata.
  - Teste 3: Se já existe presença `ABSENT` ou `EXCUSED` marcada manualmente pelos pais, o auto-log não sobrescreve.
  - Teste 4: Se `complianceApi.logAttendance` lançar exceção, o salvamento da conclusão da lição não é afetado (resiliência com log de aviso).
- [ ] **Step 2: Executar teste para verificar falha (RED)**
  - Comando: `node scripts/run-test.cjs "src/modules/lessons/application/lesson-plan.service.spec.ts"`
- [ ] **Step 3: Implementar `autoLogAttendanceForCompletion` no `LessonPlanService`**
  - Injetar `@Optional() @Inject(COMPLIANCE_REPORTS_PUBLIC_API) private readonly complianceApi?: ComplianceReportsPublicApi`.
  - No método `completeLesson`: chamar `await this.autoLogAttendanceForCompletion(familyId, response, learnerId, completedAt)`.
  - Importar `ReportsModule` em `apps/api/src/modules/lessons/lessons.module.ts`.
- [ ] **Step 4: Validar testes unitários e fronteiras de módulo (GREEN)**
  - Comando: `node scripts/run-test.cjs "src/modules/lessons" && pnpm check:boundaries`
- [ ] **Step 5: Escrever teste de integração de ponta a ponta**
  - Em `apps/api/test/auto-attendance.integration-spec.ts`: testar ciclo real no banco com lição concluída gerando presença em `attendance_records`.
  - Comando: `pnpm --filter @aletheia/api test test/auto-attendance.integration-spec.ts`
- [ ] **Step 6: Commit das alterações**
  - `git add apps/api/src/modules/lessons/ apps/api/test/auto-attendance.integration-spec.ts`
  - `git commit -m "feat(lessons): auto-log daily attendance upon lesson completion"`

---

### Task 4: Backend — Cálculo do Checklist de Primeiros Passos no `DashboardService` (`apps/api`)

- [ ] **Step 1: Escrever testes unitários em `dashboard.service.spec.ts` (RED)**
  - Teste 1: Família sem educando retorna `completedCount: 0`, passo `create_learner: false`.
  - Teste 2: Família com educando, currículo, agenda e 1 lição concluída retorna `completedCount: 4`, todos `completed: true`.
  - Teste 3: Se `familySettings.onboardingDismissed === true`, retorna `onboarding.dismissed: true`.
- [ ] **Step 2: Executar testes para verificar falha (RED)**
  - Comando: `node scripts/run-test.cjs "src/modules/dashboard/application/dashboard.service.spec.ts"`
- [ ] **Step 3: Implementar cálculo de onboarding no `DashboardService`**
  - Injetar `FamilySettingsRepository` ou consultar `onboardingDismissed`.
  - Avaliar os 4 passos e montar o objeto `onboarding: OnboardingChecklistDto` no payload.
  - Garantir suporte para `onboardingDismissed: boolean` em `FamilySettingsService.updateSettings`.
- [ ] **Step 4: Executar testes unitários e typecheck (GREEN)**
  - Comando: `node scripts/run-test.cjs "src/modules/dashboard" && pnpm --filter @aletheia/api typecheck`
- [ ] **Step 5: Commit das alterações**
  - `git add apps/api/src/modules/dashboard/ apps/api/src/modules/settings/`
  - `git commit -m "feat(dashboard): compute first-run onboarding checklist in dashboard response"`

---

### Task 5: Frontend — Dicionários e i18n (`apps/web`)

- [ ] **Step 1: Escrever testes unitários de simetria i18n em `i18n.test.tsx` (RED)**
  - Adicionar validação de presença e simetria de chaves para `dashboard.gettingStarted.*`, `lessons.completion.autoAttendanceNotice` e `reports.attendance.source.*`.
- [ ] **Step 2: Adicionar as chaves nos 3 idiomas (`pt-BR`, `en-US`, `es-ES`)**
  - Em `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/dashboard.ts`:
    - `gettingStarted.title`, `gettingStarted.subtitle`, `gettingStarted.progress`, `gettingStarted.dismiss`.
    - `gettingStarted.steps.createLearner.{title,description,action}`.
    - `gettingStarted.steps.chooseCurriculum.{title,description,action}`.
    - `gettingStarted.steps.scheduleLesson.{title,description,action}`.
    - `gettingStarted.steps.completeFirstActivity.{title,description,action}`.
  - Em `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/lessons.ts`:
    - `completion.autoAttendanceNotice`.
  - Em `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/reports.ts`:
    - `attendance.source.autoLesson`, `attendance.source.manual`, `attendance.source.bulk`.
- [ ] **Step 3: Executar auditoria de cobertura i18n e testes (GREEN)**
  - Comando: `node scripts/audit-i18n-coverage.mjs && pnpm --filter @aletheia/web test tests/i18n.test.tsx`
- [ ] **Step 4: Commit das alterações**
  - `git add apps/web/src/lib/i18n/dictionaries/ apps/web/tests/i18n.test.tsx`
  - `git commit -m "feat(i18n): dictionaries for first-run checklist and auto-attendance notices"`

---

### Task 6: Frontend — Componente `<GettingStartedCard>` e Integração no Dashboard (`apps/web`)

- [ ] **Step 1: Escrever teste de componente `getting-started-card.test.tsx` (RED)**
  - Testar renderização dos 4 passos com barra de progresso.
  - Testar clique em "Dispensar" chamando a API de configurações e ocultando o card.
  - Testar links diretos para cada uma das rotas (`/learners`, `/curriculum`, `/schedule`, `/aluno/agenda`).
- [ ] **Step 2: Implementar `apps/web/src/components/dashboard/getting-started-card.tsx`**
  - Layout limpo, responsivo, acessível e alinhado ao design system `@aletheia/ui`.
  - Suporte a `exactOptionalPropertyTypes: true` em props e callbacks.
- [ ] **Step 3: Integrar no topo de `apps/web/app/(dashboard)/page.tsx`**
  - Renderizar condicionalmente quando `data.onboarding && !data.onboarding.dismissed && data.onboarding.completedCount < 4`.
- [ ] **Step 4: Executar testes de componente e scanner i18n (GREEN)**
  - Comando: `pnpm --filter @aletheia/web test tests/getting-started-card.test.tsx && node scripts/audit-i18n-coverage.mjs`
- [ ] **Step 5: Commit das alterações**
  - `git add apps/web/src/components/dashboard/ apps/web/app/(dashboard)/page.tsx apps/web/tests/getting-started-card.test.tsx`
  - `git commit -m "feat(web): first-run getting-started checklist card on dashboard"`

---

### Task 7: Frontend — Feedback de Auto-Frequência e Badge de Origem (`apps/web`)

- [ ] **Step 1: Atualizar modal de conclusão de lição (`learner-reflection-modal.tsx`)**
  - Exibir toast ou aviso visual na confirmação informando o registro automático da presença.
- [ ] **Step 2: Atualizar tabela de frequência (`attendance-tracker-view.tsx`)**
  - Exibir badge sutil de origem quando `source === 'AUTO_LESSON'`.
- [ ] **Step 3: Escrever/atualizar testes Vitest**
  - Comando: `pnpm --filter @aletheia/web test tests/learner-reflection-modal.test.tsx tests/attendance-tracker-view.test.tsx`
- [ ] **Step 4: Commit das alterações**
  - `git add apps/web/src/components/learner-portal/ apps/web/src/components/reports/`
  - `git commit -m "feat(web): auto-attendance feedback notices and attendance source badges"`

---

### Task 8: Verificação Final, Portões de Qualidade e Pull Request

- [ ] **Step 1: Executar todos os portões de qualidade locais**
  - `pnpm check:boundaries` (14/14 aprovados)
  - `pnpm -r --workspace-concurrency=1 typecheck` (0 erros)
  - `pnpm lint` (0 erros)
  - `node scripts/audit-i18n-coverage.mjs` (100.0% cobertura, 0 pendências)
  - Full test suites:
    - `pnpm --filter @aletheia/contracts test`
    - `pnpm --filter @aletheia/api test`
    - `pnpm --filter @aletheia/web test`
- [ ] **Step 2: Enviar branch para o remoto e abrir Pull Request**
  - Comando: `git push -u origin feat/auto-attendance-and-first-run-wizard`
  - Comando: `gh pr create --base main --title "feat(learning): auto-attendance on lesson completion and first-run dashboard guide" -F .pr-body.md`
- [ ] **Step 3: Monitorar CI no GitHub Actions até 100% verde**
  - Acompanhar `gh pr checks` e apresentar relatório final ao usuário.
