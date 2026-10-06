# Onda 3: Currículo, Atividades Pedagógicas e Galeria de Pacotes i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Concluir a Onda 3 do roadmap de internacionalização frontend, localizando todas as 4 páginas e 24 componentes dos módulos de Currículo e Lições/Agenda (`curriculum`, `lessons`, `activities`) com 100% de paridade entre `pt-BR`, `en-US` e `es-ES`.

**Architecture:** 
- Dicionários estritamente tipados e 100% simétricos em `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/{lessons,curriculum}.ts`.
- Injeção e consumo consistente via `useLocale()` e `t('lessons.*')` / `t('curriculum.*')`.
- Tipagens de props com assinaturas de método `onAction(param: T): Promise<void> | void;` para evitar falsos positivos no scanner estático de regex.
- Validação contínua através do scanner `scripts/audit-i18n-coverage.mjs` e testes automatizados com Vitest.

**Tech Stack:** TypeScript 5.9, Next.js 16, React 19, Vitest 3.2, `@aletheia/ui`, `@aletheia/contracts`.

---

## Global Constraints

- **ZERO trailers de IA** (`Co-Authored-By`, `Generated-By`, etc.) em commits, comentários ou descrições de PR.
- **Simetria Estrita 100%**: toda chave criada em `pt-BR` deve existir com valores traduzidos e idênticas variáveis de interpolação `{var}` em `en-US` e `es-ES`.
- **Governança de Branches**: isolamento estrito dentro do worktree `.worktrees/i18n-wave-3-curriculum` na branch `feat/i18n-wave-3-curriculum`.
- **Nunca mergear sem CI 100% GREEN**: verificar no GitHub Actions que todos os jobs passaram antes de realizar merge.
- **Sincronização**: `main` local deve sempre permanecer 100% sincronizada com `origin/main`.
- **Preservação de outros worktrees**: nunca alterar ou remover worktrees de outros agentes (ex: `.worktrees/weekly-support-feedback-widget`).

---

### Task 1: Dicionários Expandidos e Teste TDD de Paridade (Lessons & Curriculum)

**Files:**
- Modify: `apps/web/src/lib/i18n/dictionaries/pt-BR/lessons.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/en-US/lessons.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/es-ES/lessons.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/pt-BR/curriculum.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/en-US/curriculum.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/es-ES/curriculum.ts`
- Create: `apps/web/tests/curriculum-lessons-i18n.test.tsx`

- [ ] **Step 1: Mapear todas as novas chaves necessárias para as 28 telas/componentes**
- [ ] **Step 2: Escrever teste TDD em `apps/web/tests/curriculum-lessons-i18n.test.tsx` (RED)**
- [ ] **Step 3: Adicionar chaves com paridade 100% em `pt-BR`, `en-US` e `es-ES`**
- [ ] **Step 4: Executar suíte de testes (GREEN)**
- [ ] **Step 5: Commit atômico**

---

### Task 2: Localização das Lições e Rotina Semanal (Lessons Components - 7 arquivos)

**Files:**
- Modify: `apps/web/src/components/lessons/daily-agenda-view.tsx`
- Modify: `apps/web/src/components/lessons/lesson-form-modal.tsx`
- Modify: `apps/web/src/components/lessons/complete-lesson-modal.tsx`
- Modify: `apps/web/src/components/lessons/reschedule-modal.tsx`
- Modify: `apps/web/src/components/lessons/routine-slot-modal.tsx`
- Modify: `apps/web/src/components/lessons/weekly-routine-grid.tsx`
- Modify: `apps/web/src/components/lessons/ai-lesson-draft-modal.tsx`

- [ ] **Step 1: Localizar `daily-agenda-view.tsx` e `ai-lesson-draft-modal.tsx`**
- [ ] **Step 2: Localizar modais de ação (`complete-lesson-modal.tsx`, `reschedule-modal.tsx`, `lesson-form-modal.tsx`)**
- [ ] **Step 3: Localizar rotina semanal (`routine-slot-modal.tsx`, `weekly-routine-grid.tsx`)**
- [ ] **Step 4: Validar scanner nos arquivos de `lessons` (0 hardcoded)**
- [ ] **Step 5: Executar testes de lições: `pnpm --filter @aletheia/web test tests/lessons.test.tsx`**
- [ ] **Step 6: Commit atômico**

---

### Task 3: Localização das Páginas de Currículo (Curriculum Pages - 4 arquivos)

**Files:**
- Modify: `apps/web/app/(dashboard)/curriculum/page.tsx`
- Modify: `apps/web/app/(dashboard)/curriculum/activities/page.tsx`
- Modify: `apps/web/app/(dashboard)/curriculum/packs/page.tsx`
- Modify: `apps/web/app/(dashboard)/curriculum/seminary/page.tsx`

- [ ] **Step 1: Localizar `apps/web/app/(dashboard)/curriculum/page.tsx`**
- [ ] **Step 2: Localizar `apps/web/app/(dashboard)/curriculum/activities/page.tsx`**
- [ ] **Step 3: Localizar `apps/web/app/(dashboard)/curriculum/packs/page.tsx`**
- [ ] **Step 4: Localizar `apps/web/app/(dashboard)/curriculum/seminary/page.tsx`**
- [ ] **Step 5: Validar scanner nas páginas de currículo (0 hardcoded)**
- [ ] **Step 6: Commit atômico**

---

### Task 4: Localização do Núcleo de Currículo & Planejamento (Curriculum Core - 7 arquivos)

**Files:**
- Modify: `apps/web/src/components/curriculum/academic-year-switcher.tsx`
- Modify: `apps/web/src/components/curriculum/curriculum-view.tsx`
- Modify: `apps/web/src/components/curriculum/curriculum-planning-wizard-modal.tsx`
- Modify: `apps/web/src/components/curriculum/subject-card.tsx`
- Modify: `apps/web/src/components/curriculum/subject-modal.tsx`
- Modify: `apps/web/src/components/curriculum/objective-modal.tsx`
- Modify: `apps/web/src/components/curriculum/template-modal.tsx`

- [ ] **Step 1: Localizar `academic-year-switcher.tsx` e `curriculum-view.tsx`**
- [ ] **Step 2: Localizar `curriculum-planning-wizard-modal.tsx`**
- [ ] **Step 3: Localizar `subject-card.tsx` e `subject-modal.tsx`**
- [ ] **Step 4: Localizar `objective-modal.tsx` e `template-modal.tsx`**
- [ ] **Step 5: Validar scanner nos 7 componentes (0 hardcoded)**
- [ ] **Step 6: Commit atômico**

---

### Task 5: Localização de Galeria de Pacotes, Atividades e Seminário (Packs, Activities & Seminary - 10 arquivos)

**Files:**
- Modify: `apps/web/src/components/curriculum/curriculum-pack-detail-modal.tsx`
- Modify: `apps/web/src/components/curriculum/curriculum-pack-import-modal.tsx`
- Modify: `apps/web/src/components/curriculum/curriculum-packs-gallery.tsx`
- Modify: `apps/web/src/components/curriculum/family-activities-gallery.tsx`
- Modify: `apps/web/src/components/curriculum/family-activity-modal.tsx`
- Modify: `apps/web/src/components/curriculum/family-curriculum-pack-modal.tsx`
- Modify: `apps/web/src/components/curriculum/pack-update-diff-modal.tsx`
- Modify: `apps/web/src/components/curriculum/seminary-module-viewer.tsx`
- Modify: `apps/web/src/components/curriculum/seminary-paper-submission-modal.tsx`
- Modify: `apps/web/src/components/curriculum/theology-rubric-evaluator.tsx`

- [ ] **Step 1: Localizar galerias e modais de pacotes (`curriculum-packs-gallery.tsx`, `curriculum-pack-detail-modal.tsx`, `curriculum-pack-import-modal.tsx`, `family-curriculum-pack-modal.tsx`, `pack-update-diff-modal.tsx`)**
- [ ] **Step 2: Localizar atividades pedagógicas (`family-activities-gallery.tsx`, `family-activity-modal.tsx`)**
- [ ] **Step 3: Localizar componentes de seminário e rubrica teológica (`seminary-module-viewer.tsx`, `seminary-paper-submission-modal.tsx`, `theology-rubric-evaluator.tsx`)**
- [ ] **Step 4: Validar scanner nos 10 componentes (0 hardcoded)**
- [ ] **Step 5: Commit atômico**

---

### Task 6: Auditoria Estática, Matriz de Cobertura e Gates de Qualidade Monorepo

**Files:**
- Modify: `docs/i18n-coverage-matrix.md`

- [ ] **Step 1: Executar auditoria estática completa (`node scripts/audit-i18n-coverage.mjs`)**
  - Confirmar 0 arquivos pendentes na Onda 3 (todos os 28 arquivos com status `isFullyLocalized: true`).
- [ ] **Step 2: Regenerar `docs/i18n-coverage-matrix.md`**
- [ ] **Step 3: Executar `pnpm check:boundaries` (14/14 testes aprovados)**
- [ ] **Step 4: Executar `pnpm -r --workspace-concurrency=1 typecheck` (0 erros)**
- [ ] **Step 5: Executar `pnpm lint` (0 erros)**
- [ ] **Step 6: Executar testes de unidade e integração do frontend**
- [ ] **Step 7: Commit atômico**

---

### Task 7: Pull Request, Validação de CI e Merge com Sincronização

- [ ] **Step 1: Rebasear com `origin/main` e realizar push da branch `feat/i18n-wave-3-curriculum`**
- [ ] **Step 2: Criar PR com `gh pr create` (ZERO trailers de IA)**
- [ ] **Step 3: Acompanhar GitHub Actions até que todos os 4 jobs estejam 100% GREEN**
- [ ] **Step 4: Realizar squash & merge do PR**
- [ ] **Step 5: Sincronizar branch `main` local (`git checkout main && git pull --ff-only origin main`)**
- [ ] **Step 6: Limpar worktree da Onda 3 com segurança**
