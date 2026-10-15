# Harmonização do Design System @aletheia/ui (Tipografia e Quebras) (ALET-B05) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harmonizar a tipografia de cabeçalhos de página e os contêineres de layout em todo o dashboard do Aletheia (`apps/web`), adotando o componente institucional `<PageHeader>` de `@aletheia/ui` (com fonte serifa editorial, tamanho fluido e cor de marca) e a classe semântica unificada `.page-container`, eliminando quebras visuais e pulos de layout horizontais entre rotas.

**Architecture:** Introdução da classe `.page-container` em `apps/web/app/globals.css` com largura máxima de `76rem` e paddings responsivos padronizados; refatoração das 10 rotas de primeiro nível (`/attendance`, `/curriculum`, `/devotional`, `/learners`, `/portfolio`, `/records`, `/reports`, `/schedule`, `/settings`, `/support`) com preservação dos cabeçalhos especiais de currículo e suporte; preservação integral de IDs de teste, sem fixar previamente a quantidade de testes.

**Delivery strategy:** executar em duas fases independentes: (1) consolidar o contrato do design system (`.page-container`, `PageHeader`, tokens e testes); (2) migrar as rotas padrão e depois tratar `/curriculum` e `/support` como exceções visuais controladas. Evitar misturar nesta entrega refatorações não relacionadas.

**Tech Stack:** React 19, Next.js 15, TypeScript 5.9, `@aletheia/ui`, `@aletheia/contracts`, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-14-ds-typography-harmonization-design.md`

## Global Constraints

- ZERO AI-attribution trailers (`Co-Authored-By`, `Generated-By`, etc.) in commits, commit bodies, code comments, or PR descriptions.
- ZERO Tailwind utility classes in `@aletheia/web` JSX (use `@aletheia/ui` components and BEM classes with CSS variables in `globals.css`).
- Clean module boundaries (`pnpm check:boundaries` MUST pass without regressions).
- 100% dictionary key and token symmetry across `pt-BR`, `en-US`, and `es-ES` for any key touched by the migration.
- Static i18n scanner `pnpm audit:i18n` MUST maintain its current coverage with no new hardcoded strings.
- Strict typing (TypeScript 5.9) and lint without introducing unrelated refactors.
- Compatibility with `exactOptionalPropertyTypes: true`.

### Route migration matrix

| Rota | Estratégia | Regressões proibidas |
| --- | --- | --- |
| `/attendance`, `/learners`, `/devotional`, `/records`, `/portfolio`, `/reports`, `/settings` | `PageHeader` + `.page-container` | título, descrição, ações, loading, testids e navegação |
| `/schedule` | `PageHeader` + tabs em `action` | `tab-agenda`, `tab-routine`, roles, estado ativo e foco |
| `/curriculum` | shell especial ou `PageHeader` com `titleAdornment` | badge pedagógico, seletor de ano, links e ações curriculares |
| `/support` | banner especial com `PageHeader` integrado | ícone, três benefícios, formulário, recibos e layout mobile |

---

### Task 0: Consolidar o contrato do `PageHeader` e a matriz de migração

**Files:**
- Modify: `packages/ui/src/components/page-header.tsx`
- Modify: `packages/ui/src/index.ts` only if the public export changes
- Modify: `apps/web/app/globals.css`
- Create or extend: tests do `@aletheia/ui` e `apps/web/tests/design-system-harmonization.test.tsx`

- [ ] Definir as classes estáveis `.ui-page-header`, `.ui-page-header__title`, `.ui-page-header__description` e `.ui-page-header__action`.
- [ ] Migrar a tipografia e o layout do `PageHeader` de estilos inline para CSS/tokens, preservando API e consumidores existentes.
- [ ] Adicionar `titleAdornment` somente se for necessário para o badge do currículo; caso contrário, registrar `/curriculum` como exceção customizada.
- [ ] Cobrir o contrato com testes de renderização, incluindo `title`, `description`, `action`, `eyebrow` e `titleAdornment` quando existir.
- [ ] Validar o contrato antes de iniciar a migração das rotas.

---

### Task 1: Contêiner Global Semântico `.page-container` em `globals.css` & Suíte de Testes de Harmonização

**Files:**
- Modify: `apps/web/app/globals.css:576-581`
- Create: `apps/web/tests/design-system-harmonization.test.tsx`
- Modify: `packages/ui/src/components/page-header.tsx` only if the curriculum badge requires the explicit `titleAdornment` API

**Interfaces:**
- Produces: CSS utility class `.page-container` em `globals.css`:
  ```css
  .page-container {
    width: 100%;
    max-width: 76rem;
    margin-left: auto;
    margin-right: auto;
    padding: 1.5rem 1rem;
  }
  @media (min-width: 640px) {
    .page-container {
      padding: 2rem 1.5rem;
    }
  }
  ```

- [ ] **Step 1: Escrever testes de contrato do `.page-container` e do `<PageHeader>`**

Criar `apps/web/tests/design-system-harmonization.test.tsx`:
```tsx
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '@aletheia/ui';

describe('Design System Harmonization (ALET-B05)', () => {
  it('renders @aletheia/ui PageHeader with institutional typography and testids', () => {
    render(
      <PageHeader
        title="Harmonized Title"
        description="Harmonized Subtitle"
        action={<button data-testid="custom-action">Ação</button>}
      />
    );

    const header = screen.getByTestId('page-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('ui-page-header');

    const title = screen.getByTestId('page-header-title');
    expect(title).toHaveTextContent('Harmonized Title');
    expect(title).toHaveClass('ui-page-header__title');

    const desc = screen.getByTestId('page-header-description');
    expect(desc).toHaveTextContent('Harmonized Subtitle');

    const action = screen.getByTestId('page-header-action');
    expect(action).toContainElement(screen.getByTestId('custom-action'));
  });
});
```

Os testes de rota devem usar um fixture com `LocaleProvider`, `AuthContext`, mocks de `next/navigation` e `fetch`, seguindo o padrão de `devotional-i18n.test.tsx` e `settings-ux.test.tsx`. O teste unitário do componente não carrega `globals.css`; validar as propriedades do `.page-container` por verificação estática do CSS ou por teste visual/computed-style.

- [ ] **Step 2: Rodar teste para verificar aprovação inicial do contrato de PageHeader**

Run: `pnpm --filter @aletheia/web test tests/design-system-harmonization.test.tsx`
Expected: PASS

- [ ] **Step 3: Adicionar a definição única de `.page-container` em `apps/web/app/globals.css`**

Em `apps/web/app/globals.css`:
```css
/* ==========================================================================
   Harmonized Page Container (ALET-B05)
   ========================================================================== */
.page-container {
  width: 100%;
  max-width: 76rem;
  margin-left: auto;
  margin-right: auto;
  padding: 1.5rem 1rem;
}

@media (min-width: 640px) {
  .page-container {
    padding: 2rem 1.5rem;
  }
}

```

Não alterar `.dashboard-page` nesta task: a home já possui regras próprias. Remover somente os estilos inline equivalentes dos wrappers explicitamente incluídos no escopo.

- [ ] **Step 4: Executar testes e checagem de tipos**

Run: `pnpm --filter @aletheia/web test tests/design-system-harmonization.test.tsx`
Expected: PASS
Run: `pnpm check:boundaries`
Expected: PASS sem regressões
Run: `pnpm --filter @aletheia/web lint`
Expected: PASS

- [ ] **Step 5: Commit das alterações da Task 1**

```bash
git add apps/web/app/globals.css apps/web/tests/design-system-harmonization.test.tsx
git commit -m "feat(web): define semantic page-container and baseline harmonization tests"
```

---

### Task 2: Harmonização das Rotas de Aprendizagem e Rotina (`/attendance`, `/learners`, `/devotional`, `/schedule`)

**Files:**
- Modify: `apps/web/app/(dashboard)/attendance/page.tsx:154-164`
- Modify: `apps/web/app/(dashboard)/learners/page.tsx:130-156`
- Modify: `apps/web/app/(dashboard)/devotional/page.tsx:196-205`
- Modify: `apps/web/app/(dashboard)/schedule/page.tsx:325-396`
- Modify: `apps/web/tests/design-system-harmonization.test.tsx`

**Interfaces:**
- Consumes: `<PageHeader>` from `@aletheia/ui`
- Consumes: `.page-container` from `globals.css`
- Produces: Visual harmonization across core student/routine pages without altering existing data attributes or event triggers.

- [ ] **Step 1: Escrever testes automatizados para verificar a presença de `<PageHeader>` e `.page-container` nas 4 páginas**

Adicionar em `apps/web/tests/design-system-harmonization.test.tsx`:
```tsx
import AttendancePage from '../app/(dashboard)/attendance/page';
import LearnersPage from '../app/(dashboard)/learners/page';
import DevotionalPage from '../app/(dashboard)/devotional/page';
import SchedulePage from '../app/(dashboard)/schedule/page';

// Adicionar it blocks usando o fixture de providers e verificando
// screen.getByTestId('page-header') e o container com classe page-container.
// Preservar os testids, roles e atributos ARIA dos controles de cada rota.
```

- [ ] **Step 2: Rodar teste para verificar falhas antes da implementação (RED)**

Run: `pnpm --filter @aletheia/web test tests/design-system-harmonization.test.tsx`
Expected: FAIL (páginas ainda usam `h1` sem `PageHeader`)

- [ ] **Step 3: Refatorar `/attendance`, `/learners`, `/devotional` e `/schedule`**

1. Em `apps/web/app/(dashboard)/attendance/page.tsx`:
   - Importar `PageHeader` de `@aletheia/ui`.
   - Substituir o wrapper inline por `<div className="page-container">`.
   - Substituir bloco manual de `h1`/`p` por:
     ```tsx
     <PageHeader
       title={t('attendance.page.title')}
       description={t('attendance.page.subtitle')}
     />
     ```

2. Em `apps/web/app/(dashboard)/learners/page.tsx`:
   - Importar `PageHeader` de `@aletheia/ui`.
   - Substituir o container por `<div className="page-container learners-page-container">`.
   - Substituir o bloco manual de título e botão por:
     ```tsx
     <PageHeader
       title={t('learners.title')}
       description={t('learners.subtitle')}
       action={
         <Can action="create_learner">
           <Button data-testid="add-learner-btn" onClick={handleOpenCreate}>
             {t('learners.addLearner')}
           </Button>
         </Can>
       }
     />
     ```

3. Em `apps/web/app/(dashboard)/devotional/page.tsx`:
   - Importar `PageHeader` de `@aletheia/ui`.
   - Substituir o wrapper por `<div className="page-container devotional-page-container">`.
   - Substituir o bloco manual de título por:
     ```tsx
     <PageHeader
       title={t('devotional.page.title')}
       description={t('devotional.page.subtitle')}
     />
     ```

4. Em `apps/web/app/(dashboard)/schedule/page.tsx`:
   - Importar `PageHeader` de `@aletheia/ui`.
   - Substituir o wrapper por `<div className="page-container">`.
   - Mover o alternador de abas (`tab-agenda` e `tab-routine`) para a prop `action` do `<PageHeader>`:
     ```tsx
     <PageHeader
       title={t('shared.schedule.title')}
       description={t('shared.schedule.subtitle')}
       action={
         <div className="schedule-page-tabs">
           {/* botões existentes com testids preservados */}
         </div>
       }
     />
     ```
   - Criar regra responsiva para `.schedule-page-tabs`, garantindo quebra ou empilhamento sem overflow em 320px e 375px.

- [ ] **Step 4: Rodar suíte de testes para verificar aprovação (GREEN)**

Run: `pnpm --filter @aletheia/web test tests/design-system-harmonization.test.tsx tests/learners.test.tsx tests/devotional.test.tsx tests/attendance-tracker-view.test.tsx`
Expected: PASS
Run: `pnpm check:boundaries`
Expected: PASS sem regressões

- [ ] **Step 5: Commit das alterações da Task 2**

```bash
git add apps/web/app/(dashboard)/attendance/page.tsx apps/web/app/(dashboard)/learners/page.tsx apps/web/app/(dashboard)/devotional/page.tsx apps/web/app/(dashboard)/schedule/page.tsx apps/web/tests/design-system-harmonization.test.tsx
git commit -m "feat(web): harmonize attendance, learners, devotional and schedule with PageHeader and page-container"
```

---

### Task 3: Harmonização das Rotas de Currículo e Avaliação (`/curriculum`, `/records`, `/portfolio`, `/reports`)

**Files:**
- Modify: `apps/web/src/components/curriculum/curriculum-view.tsx:120-180`
- Modify: `apps/web/app/(dashboard)/curriculum/page.tsx:313-335`
- Modify: `apps/web/app/(dashboard)/records/page.tsx:285-305`
- Modify: `apps/web/app/(dashboard)/portfolio/page.tsx:219-229`
- Modify: `apps/web/app/(dashboard)/reports/page.tsx:184-194`
- Modify: `packages/ui/src/components/page-header.tsx` if the curriculum badge requires the explicit `titleAdornment` API
- Modify: `apps/web/tests/design-system-harmonization.test.tsx`

**Interfaces:**
- Consumes: `<PageHeader>` from `@aletheia/ui`
- Consumes: `.page-container` from `globals.css`
- Produces: Harmonized curriculum, records, portfolio and reports pages.

- [ ] **Step 1: Adicionar casos de teste para rotas de avaliação e currículo**

Em `apps/web/tests/design-system-harmonization.test.tsx`:
Adicionar asserções para `/records`, `/portfolio`, `/reports` e `CurriculumView`.

- [ ] **Step 2: Rodar testes para capturar estado anterior (RED)**

Run: `pnpm --filter @aletheia/web test tests/design-system-harmonization.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implementar harmonização nas rotas e componentes**

1. Em `apps/web/src/components/curriculum/curriculum-view.tsx`:
   - Importar `PageHeader` de `@aletheia/ui`.
   - No cabeçalho principal, utilizar `<PageHeader>` com o título formatado, `titleAdornment={<span data-testid="pedagogical-framework-badge">...</span>}`, subtítulos e ações (`AcademicYearSwitcher` + links existentes). Se a API não for estendida, manter o cabeçalho customizado como exceção documentada; não remover o badge nem duplicar o `h1`.

2. Em `apps/web/app/(dashboard)/curriculum/page.tsx`:
   - Não adicionar um segundo `.page-container` se o wrapper de `CurriculumView` for o proprietário do layout. Definir um único proprietário e remover apenas os estilos inline equivalentes.

3. Em `apps/web/app/(dashboard)/records/page.tsx`:
   - Substituir `style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}` por `className="page-container"`.
   - Substituir cabeçalho inline por:
     ```tsx
     <PageHeader
       title={t('records.page.title')}
       description={t('records.page.subtitle')}
     />
     ```

4. Em `apps/web/app/(dashboard)/portfolio/page.tsx`:
   - Substituir `style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}` por `className="page-container"`.
   - Substituir cabeçalho inline por:
     ```tsx
     <PageHeader
       title={t('reports.pages.portfolio.title')}
       description={t('reports.pages.portfolio.description')}
     />
     ```

5. Em `apps/web/app/(dashboard)/reports/page.tsx`:
   - Substituir `style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}` por `className="page-container"`.
   - Substituir cabeçalho inline por:
     ```tsx
     <PageHeader
       title={t('reports.pages.reports.title')}
       description={t('reports.pages.reports.description')}
     />
     ```

- [ ] **Step 4: Rodar suíte de testes de currículo e relatórios (GREEN)**

Run: `pnpm --filter @aletheia/web test tests/curriculum.test.tsx tests/records.test.tsx tests/reports.test.tsx tests/design-system-harmonization.test.tsx`
Expected: PASS
Run: `pnpm check:boundaries`
Expected: PASS sem regressões

- [ ] **Step 5: Commit das alterações da Task 3**

```bash
git add apps/web/src/components/curriculum/curriculum-view.tsx apps/web/app/(dashboard)/curriculum/page.tsx apps/web/app/(dashboard)/records/page.tsx apps/web/app/(dashboard)/portfolio/page.tsx apps/web/app/(dashboard)/reports/page.tsx apps/web/tests/design-system-harmonization.test.tsx
git commit -m "feat(web): harmonize curriculum, records, portfolio and reports with PageHeader and page-container"
```

---

### Task 4: Harmonização de Configurações & Apoio (`/settings`, `/support`) e Validação Global

**Files:**
- Modify: `apps/web/app/(dashboard)/settings/page.tsx:300-316`
- Modify: `apps/web/app/(dashboard)/support/page.tsx:51-76`
- Modify: `apps/web/tests/design-system-harmonization.test.tsx`

**Interfaces:**
- Consumes: `<PageHeader>` from `@aletheia/ui`
- Consumes: `.page-container` from `globals.css`
- Produces: Uniform visual hierarchy across the ten scoped routes with no regressions to settings navigation or support content.

- [ ] **Step 1: Adicionar asserções de `/settings` e `/support` ao teste de harmonização**

Em `apps/web/tests/design-system-harmonization.test.tsx`:
Verificar renderização de `PageHeader` e `.page-container` em `SettingsPage` e `SupportPage`.

- [ ] **Step 2: Rodar testes para capturar estado antes do ajuste (RED)**

Run: `pnpm --filter @aletheia/web test tests/design-system-harmonization.test.tsx`
Expected: FAIL

- [ ] **Step 3: Refatorar `/settings` e `/support`**

1. Em `apps/web/app/(dashboard)/settings/page.tsx`:
   - Importar `PageHeader` de `@aletheia/ui`.
   - Substituir `style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}` por `className="page-container"`.
   - Substituir cabeçalho inline por:
     ```tsx
     <PageHeader
       title={t('settings.pageTitle')}
       description={t('settings.pageDescription')}
     />
     ```
   - Preservar a navegação lateral, estados ativos, badges, foco e layout responsivo existentes.

2. Em `apps/web/app/(dashboard)/support/page.tsx`:
   - Importar `PageHeader` de `@aletheia/ui`.
   - Substituir o container `maxWidth: '1100px'` por `className="page-container"`.
   - Manter o banner institucional, o ícone `heart` e os três benefícios; integrar o `PageHeader` ao banner sem renderizar um segundo título.
   - Usar as chaves existentes `support.pageTitle` e `support.pageSubtitle` (não inventar `support.page.title`/`support.page.subtitle` sem atualizar os três dicionários):
     ```tsx
     <PageHeader
       title={t('support.pageTitle')}
       description={t('support.pageSubtitle')}
     />
     ```
   - Corrigir a grade `minmax(360px, 1fr)` para não criar overflow em 320px/375px, preferencialmente com `minmax(min(360px, 100%), 1fr)` ou empilhamento por breakpoint.

- [ ] **Step 4: Executar suíte completa de verificação**

Run: `pnpm --filter @aletheia/web test`
Expected: todos os testes existentes e adicionados aprovados; registrar a contagem real
Run: `pnpm audit:i18n`
Expected: sem chaves pendentes ou strings novas fora do i18n
Run: `pnpm check:boundaries`
Expected: PASS sem regressões
Run: `pnpm --filter @aletheia/web typecheck`
Expected: 0 errors
Run: `pnpm --filter @aletheia/web lint`
Expected: 0 errors

Run: `pnpm --filter @aletheia/web test:e2e:visual`
Expected: smoke visual aprovado nos cenários B05 disponíveis

Validação final obrigatória: smoke visual das dez rotas em 320px, 375px, 640px, 768px e desktop, verificando ausência de overflow horizontal, um único `h1`, preservação dos testids/ARIA e manutenção do conteúdo especial de currículo, suporte e configurações. Se ainda não houver cenário visual para alguma rota, registrar a lacuna e não declarar cobertura total.

- [ ] **Step 5: Commit das alterações da Task 4**

```bash
git add apps/web/app/(dashboard)/settings/page.tsx apps/web/app/(dashboard)/support/page.tsx apps/web/tests/design-system-harmonization.test.tsx
git commit -m "feat(web): harmonize settings and support pages with PageHeader and page-container"
```
