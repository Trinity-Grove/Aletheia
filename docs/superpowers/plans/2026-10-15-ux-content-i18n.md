# Friendly Language and i18n Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the priority page titles and remove user-facing hardcoded copy from the curriculum-pack and portfolio flows in `pt-BR`, `en-US`, and `es-ES`.

**Architecture:** Keep the current dictionary namespaces and `useLocale().t()` contract. Change copy at the dictionary boundary, migrate targeted components to translation keys, and add focused tests that assert the three locales expose the same keys and render the approved user-facing wording. This plan deliberately does not change navigation, data contracts, or backend behavior.

**Tech Stack:** TypeScript, React 19, Next.js, Vitest, Testing Library, existing `useLocale()` dictionaries, `scripts/audit-i18n-coverage.mjs`.

**Spec:** `docs/superpowers/specs/2026-10-15-ux-language-and-journey-design.md`

## Global Constraints

- Todo texto de interface voltado ao usuário DEVE ser internacionalizado.
- Toda nova chave em `pt-BR` DEVE ser acompanhada de tradução em `en-US` e `es-ES` no mesmo commit.
- Datas, horários, números e moedas DEVEM utilizar os formatadores do `useLocale()`.
- O espanhol deve usar `Estudiante` de forma consistente nas telas de usuário.
- Nenhum título ou CTA novo pode ser escrito diretamente no JSX.
- Não substituir a rota principal `/curriculum` por `/curriculum/explore`.
- Não alterar a taxonomia educacional universal nem contratos da API.

## Review Focus

- **Troca de idioma:** títulos e mensagens devem mudar imediatamente ao alternar entre `pt-BR`, `en-US` e `es-ES`; teste em `friendly-language-copy.test.tsx`.
- **Interpolação de nomes:** mensagens de pacote devem preservar o nome do pacote sem quebrar a tradução; teste com nome contendo aspas e caracteres acentuados no mesmo arquivo.
- **Erro de API:** respostas de erro não devem expor texto cru do backend como cópia principal da interface; teste de chamadas de erro nos componentes de galeria/modal.
- **Acesso administrativo:** o CTA de importação deve continuar condicionado ao mesmo controle de acesso atual e apenas trocar o texto; teste de regressão em `curriculum-packs.test.tsx`.
- **Rotas e estados vazios:** trocar os títulos não pode remover links, estados de carregamento ou mensagens vazias; teste estático dos componentes migrados.

## File Map

- Modify `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/nav.ts`: labels curtos da navegação e apoio.
- Modify `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/shared.ts`: título e abas da agenda.
- Modify `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/landing.ts`: tagline da página pública em cada idioma.
- Modify `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/curriculum.ts`: títulos de currículo, descoberta, atividades e pacotes; namespaces `curriculum.packs.gallery` e `curriculum.packs.editor`.
- Modify `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/records.ts`: diário, portfólio e mensagens de exclusão.
- Modify `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/attendance.ts`: frequência e horas de estudo.
- Modify `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/reports.ts`: portfólio e relatórios/históricos.
- Modify `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/learners.ts`: título e subtítulo de educandos.
- Modify `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/devotional.ts`: título do devocional em família.
- Modify `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/legal-guide.ts`: guia legal e primeiros passos.
- Modify `apps/web/src/components/curriculum/curriculum-packs-gallery.tsx`: trocar títulos, CTAs, carregamento, vazios, sucesso e erro por `t()`.
- Modify `apps/web/src/components/curriculum/family-curriculum-pack-modal.tsx`: trocar título padrão, tabs, estados de mídia/revisão/editor, validações e mensagens por `t()`.
- Modify `apps/web/app/(dashboard)/portfolio/page.tsx`: trocar erros de autenticação, upload, exclusão e toast por `t()`.
- Create `apps/web/tests/friendly-language-copy.test.tsx`: paridade de cópia, renderização por locale e guarda contra hardcodes nos arquivos migrados.

### Task 1: Add the approved title glossary

**Files:**
- Modify: `apps/web/src/lib/i18n/dictionaries/pt-BR/nav.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/en-US/nav.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/es-ES/nav.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/shared.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/landing.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/curriculum.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/records.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/attendance.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/reports.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/learners.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/devotional.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/legal-guide.ts`
- Test: `apps/web/tests/friendly-language-copy.test.tsx`

**Interfaces:**
- Consumes: Existing dictionary object shape and existing translation keys used by `PageHeader` and `ProductShell`.
- Produces: The same keys with simpler values; new `curriculum.packs.gallery`, `curriculum.packs.editor`, and `records.portfolio.messages` namespaces with identical structure in all locales.

- [ ] **Step 1: Write the failing dictionary test**

  Add a test named `uses the approved friendly titles in all supported locales` that renders a `Probe` through `LocaleProvider` for each locale and asserts these exact values:

  - pt-BR: `Planejamento curricular`, `Descobrir trilhas de aprendizagem`, `Agenda de estudos`, `Diário de aprendizagem`, `Trabalhos e portfólio`, `Frequência e horas de estudo`, `Relatórios e históricos`, `Devocional em família`, `Guia legal e primeiros passos`.
  - en-US: `Curriculum planning`, `Discover learning paths`, `Study schedule`, `Learning journal`, `Work portfolio`, `Attendance and study hours`, `Reports and academic records`, `Family devotional`, `Legal guide and getting started`.
  - es-ES: `Planificación curricular`, `Descubrir rutas de aprendizaje`, `Agenda de estudio`, `Diario de aprendizaje`, `Portafolio de trabajos`, `Asistencia y horas de estudio`, `Informes e historiales`, `Devocional en familia`, `Guía legal y primeros pasos`.

- [ ] **Step 2: Run the focused test and verify it fails**

  Run: `pnpm --filter @aletheia/web test -- friendly-language-copy.test.tsx`

  Expected: FAIL because the current dictionary values still contain the old wording.

- [ ] **Step 3: Update the existing dictionary values and add pack/editor message namespaces**

  Keep the existing key paths consumed by pages. Under `curriculum.packs`, add matching objects with keys `galleryTitle`, `import`, `backToCurriculum`, `loading`, `empty`, `manage`, `install`, `viewDetails`, `export`, `exportSuccess`, `exportError`, `loadError`, `installSuccess`, `installError`, `editorTitle`, `mediaTab`, `revisionsTab`, `editorTab`, `mediaLoadError`, `mediaSaveSuccess`, `mediaSaveError`, `revisionLoadError`, `genericError`, and `defaultName`. Under `records.portfolio.messages`, add `authRequired`, `updateError`, `createError`, `uploadPrepareError`, `uploadTransferError`, `uploadConfirmError`, `deleteSuccess`, and `deleteError`.

  Update the existing `shared.schedule.title` values to the approved schedule wording, and replace the English landing tagline with translated equivalents in `landing.ts`; do not change route names or test ids.

  Translate every key in all three locale files in the same commit. Use `{name}` only in success/error messages that interpolate a package name.

- [ ] **Step 4: Run the focused test and verify it passes**

  Run: `pnpm --filter @aletheia/web test -- friendly-language-copy.test.tsx`

  Expected: PASS, including structural parity and exact approved copy assertions.

- [ ] **Step 5: Commit the dictionary changes**

  ```bash
  git add apps/web/src/lib/i18n/dictionaries apps/web/tests/friendly-language-copy.test.tsx
  git commit -m "feat(web): simplify multilingual page language"
  ```

### Task 2: Migrate the curriculum-pack gallery

**Files:**
- Modify: `apps/web/src/components/curriculum/curriculum-packs-gallery.tsx`
- Test: `apps/web/tests/friendly-language-copy.test.tsx`
- Test: `apps/web/tests/curriculum-packs.test.tsx`

**Interfaces:**
- Consumes: `curriculum.packs.gallery` values from Task 1 and the existing `useLocale()` hook.
- Produces: The same gallery behavior with all visible copy translated and package names interpolated through `t()`.

- [ ] **Step 1: Write the failing static migration assertions**

  Add a test named `does not keep user-facing pack gallery copy in JSX` that reads the gallery source and asserts it contains `const { t } = useLocale()`, calls `t('curriculum.packs.gallery...')` for title/CTA/loading/empty states, and does not contain the current Portuguese literals such as `Galeria de Pacotes Curriculares`, `Importar Pacote Curricular`, `Voltar ao Currículo`, `Carregando pacotes curriculares`, `Nenhum pacote curricular encontrado`, `Gerenciar Pacote`, `Instalar no Currículo`, `Conhecer Pacote`, or `Exportar JSON`.

- [ ] **Step 2: Run the focused test and verify it fails**

  Run: `pnpm --filter @aletheia/web test -- friendly-language-copy.test.tsx curriculum-packs.test.tsx`

  Expected: FAIL because the gallery still contains those literals and interpolated messages.

- [ ] **Step 3: Replace gallery copy with `t()` calls**

  Use `t('curriculum.packs.gallery.<key>')` for headings, buttons, loading, empty state, and generic errors. Use `{name: pack.name}` for success messages. Preserve all existing access guards, test ids, fetch paths, active tabs, and modal behavior. Do not display raw backend error messages as the primary user-facing copy; use the translated generic key and keep raw details only in a development-safe logging path if an existing policy allows it.

- [ ] **Step 4: Run the focused tests and verify they pass**

  Run: `pnpm --filter @aletheia/web test -- friendly-language-copy.test.tsx curriculum-packs.test.tsx`

  Expected: PASS with existing pack installation/import behavior unchanged.

- [ ] **Step 5: Commit the gallery migration**

  ```bash
  git add apps/web/src/components/curriculum/curriculum-packs-gallery.tsx apps/web/tests/friendly-language-copy.test.tsx apps/web/tests/curriculum-packs.test.tsx
  git commit -m "feat(web): translate curriculum pack gallery"
  ```

### Task 3: Migrate the family pack editor modal

**Files:**
- Modify: `apps/web/src/components/curriculum/family-curriculum-pack-modal.tsx`
- Test: `apps/web/tests/friendly-language-copy.test.tsx`

**Interfaces:**
- Consumes: `curriculum.packs.editor` values from Task 1 and the existing `useLocale()` hook.
- Produces: The same media, revisions, and editor tabs with translated labels, fallbacks, validation messages, and modal title.

- [ ] **Step 1: Write the failing static migration assertions**

  Add assertions for `curriculum.packs.editor` usage and for removal of the current hardcoded fallback `Pacote Curricular`, media loading/error messages, and tab/action labels from the modal source.

- [ ] **Step 2: Run the focused test and verify it fails**

  Run: `pnpm --filter @aletheia/web test -- friendly-language-copy.test.tsx`

  Expected: FAIL while hardcoded modal copy remains.

- [ ] **Step 3: Replace modal copy with translation keys**

  Migrate the default pack name, `Modal` title, tabs, upload fields, loading/empty/error/success messages, delete actions, revision actions, and fallback labels. Preserve the current media MIME/size validation, API calls, callbacks, and active tab state. Any interpolated pack name must be passed as a translation variable, not concatenated into a sentence in JSX.

- [ ] **Step 4: Run the focused test and typecheck**

  Run: `pnpm --filter @aletheia/web test -- friendly-language-copy.test.tsx`

  Expected: PASS.

  Run: `pnpm --filter @aletheia/web typecheck`

  Expected: PASS with no dictionary-shape or translation-key errors.

- [ ] **Step 5: Commit the modal migration**

  ```bash
  git add apps/web/src/components/curriculum/family-curriculum-pack-modal.tsx apps/web/tests/friendly-language-copy.test.tsx
  git commit -m "feat(web): translate family curriculum pack editor"
  ```

### Task 4: Migrate portfolio feedback and finalize content validation

**Files:**
- Modify: `apps/web/app/(dashboard)/portfolio/page.tsx`
- Test: `apps/web/tests/friendly-language-copy.test.tsx`

**Interfaces:**
- Consumes: `records.portfolio.messages` from Task 1 and existing `useLocale()`.
- Produces: Translated portfolio errors and success feedback without changing portfolio API behavior.

- [ ] **Step 1: Write the failing static assertions**

  Assert that the portfolio page calls `t('records.portfolio.messages...')` for authentication, create/update, upload, delete, and toast messages, and no longer contains `Evidência excluída.` or the current hardcoded upload/error fallbacks.

- [ ] **Step 2: Run the focused test and verify it fails**

  Run: `pnpm --filter @aletheia/web test -- friendly-language-copy.test.tsx`

  Expected: FAIL until portfolio feedback uses dictionary keys.

- [ ] **Step 3: Replace portfolio feedback with `t()`**

  Map each existing error branch to a stable translated key. Keep the current API calls, refresh behavior, toast variants, and modal flow unchanged. Do not expose raw API messages directly as the default title.

- [ ] **Step 4: Run the full content validation**

  Run: `pnpm --filter @aletheia/web test -- friendly-language-copy.test.tsx curriculum-packs.test.tsx curriculum-lessons-i18n.test.tsx attendance-records-i18n.test.tsx`

  Expected: PASS.

  Run: `pnpm audit:i18n`

  Expected: 100% coverage and zero pending files.

  Run: `pnpm --filter @aletheia/web typecheck`

  Expected: PASS.

- [ ] **Step 5: Commit the portfolio migration**

  ```bash
  git add apps/web/app/(dashboard)/portfolio/page.tsx apps/web/tests/friendly-language-copy.test.tsx
  git commit -m "feat(web): translate portfolio feedback"
  ```

### Task 5: Final review and handoff for the journey plan

- [ ] **Step 1: Run the targeted test runner for the changed web files**

  Run: `pnpm test:targeted -- apps/web/tests/friendly-language-copy.test.tsx apps/web/tests/curriculum-packs.test.tsx`

  Expected: all selected tests pass and the runner reports the selected web scope.

- [ ] **Step 2: Review the diff for scope**

  Confirm that no route changed, no API contract changed, no navigation item changed from `/curriculum`, and no user-facing string was added outside the three dictionaries.

- [ ] **Step 3: Prepare the next independent plan**

  After this plan is reviewed, create `2026-10-15-ux-journey-integration.md` for contextual CTAs, dashboard next-step state, and cross-module links. Do not implement the journey or AI backend in this content PR.

