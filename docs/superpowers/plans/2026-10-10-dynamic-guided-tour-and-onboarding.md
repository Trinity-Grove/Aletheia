# Tutorial Interativo Guiado (Spotlight Walkthrough) & Autonomia de Onboarding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o Tutorial Interativo Guiado dinâmico com mecanismo de spotlight pelos elementos reais da interface, garantindo autonomia total ao usuário com botão imediato de "Pular e não ver mais", controle em Configurações, botão sob demanda na barra de navegação e integração com a gamificação, removendo o card estático pesado do Dashboard.

**Architecture:** 
- Frontend em `apps/web` com componentes modulares: `<WelcomeTourDialog>` (diálogo de primeiro acesso com pular definitivo), `<GuidedTour>` (orquestrador de spotlight com cálculo de bounding box e tooltips dinâmicos) e controle em `<FamilyGeneralSettings>`.
- Integração de persistência através de `PATCH /api/v1/families/:familyId/settings` (`onboardingDismissed: true/false`).
- Concessão de badge na gamificação (`FIRST_STEP`) ao concluir o tour.
- Limpeza do card estático `<GettingStartedCard>` do fluxo da página inicial.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS, TypeScript 5.9, `@aletheia/ui`, `@aletheia/contracts`, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-10-dynamic-guided-tour-and-onboarding-design.md`

## Global Constraints
- ZERO AI-attribution trailers (`Co-Authored-By`, `Generated-By`, etc.) em git commits, comentários de código ou PRs.
- 100% de simetria de chaves e variáveis de dicionário entre `pt-BR`, `en-US` e `es-ES`.
- `pnpm check:boundaries` DEVE passar com 14/14 testes.
- `node scripts/audit-i18n-coverage.mjs` DEVE manter 100.0% de cobertura com 0 pendências.
- Sintaxe de método em interfaces de callbacks (ex: `onDismiss?(): Promise<void> | void;`, `onStartTour(): void;`) para evitar falso-positivo no scanner estático de i18n.
- Compatibilidade estrita com `exactOptionalPropertyTypes: true`.
- TDD estrito em todas as tarefas: testes escritos antes da implementação, validação do estado RED e GREEN.

---

### Task 1: Dicionários de Internacionalização (i18n) em pt-BR, en-US e es-ES (`apps/web`)

**Files:**
- Modify: `apps/web/src/lib/i18n/dictionaries/pt-BR/dashboard.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/en-US/dashboard.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/es-ES/dashboard.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/pt-BR/settings.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/en-US/settings.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/es-ES/settings.ts`
- Test: `apps/web/tests/i18n.test.tsx`

**Interfaces:**
- Produces: Chaves `dashboard.tour.*`, `settings.general.tutorialToggle.*` e `nav.startTour` em todos os 3 idiomas.

- [ ] **Step 1: Escrever teste falhando para as novas chaves de tradução**

Adicionar suite de testes em `apps/web/tests/i18n.test.tsx` testando a existência e renderização das novas chaves `dashboard.tour.welcome.*`, `dashboard.tour.steps.*`, `dashboard.tour.controls.*` e `settings.general.tutorialToggle.*` nas 3 línguas.

- [ ] **Step 2: Executar teste para verificar falha (RED)**

Run: `pnpm --filter @aletheia/web test tests/i18n.test.tsx`  
Expected: FAIL com chaves ausentes.

- [ ] **Step 3: Implementar dicionários em pt-BR, en-US e es-ES**

Adicionar as seções `tour` no dicionário `dashboard` e `tutorialToggle` no dicionário `settings`:
```typescript
tour: {
  welcome: {
    title: 'Bem-vindo ao Aletheia!',
    subtitle: 'Gostaria de um tour guiado rápido pelas principais ferramentas do sistema?',
    start: 'Iniciar Tour Guiado (3 min)',
    dismissNever: 'Pular e não ver mais',
  },
  steps: {
    step1: {
      title: 'Navegação & Módulos',
      description: 'Acesse Educandos, Currículo, Agenda semanal, Diário de Aprendizagem, Portfólio fotográfico e Relatórios estruturados.',
    },
    step2: {
      title: 'Foco do Educando',
      description: 'Alterne facilmente entre o acompanhamento de cada filho individualmente ou veja a visão consolidada de toda a família.',
    },
    step3: {
      title: 'Versículo & Devocional',
      description: 'Inspiração espiritual diária com registros de orações e reflexões bíblicas da família.',
    },
    step4: {
      title: 'Jornada & Atividades',
      description: 'Acompanhe o tempo de instrução em tempo real e conclua lições com registro reflexivo.',
    },
    step5: {
      title: 'Tudo Pronto para Começar!',
      description: 'Você conheceu os principais pontos do Aletheia. Parabéns pelo início desta jornada educativa!',
    },
  },
  controls: {
    next: 'Próximo',
    prev: 'Anterior',
    skip: 'Pular e sair',
    finish: 'Concluir Tour',
    stepIndicator: 'Passo {current} de {total}',
  },
  startTourNav: 'Fazer Tour pelo Sistema',
}
```

- [ ] **Step 4: Executar testes de i18n e auditoria (GREEN)**

Run: `pnpm --filter @aletheia/web test tests/i18n.test.tsx`  
Run: `node scripts/audit-i18n-coverage.mjs`  
Expected: PASS com 100.0% de cobertura.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/i18n/dictionaries/ apps/web/tests/i18n.test.tsx
git commit -m "feat(i18n): dictionaries for dynamic guided tour and onboarding autonomy"
```

---

### Task 2: Componente `<WelcomeTourDialog>` com Autonomia de "Pular e não ver mais" (`apps/web`)

**Files:**
- Create: `apps/web/src/components/dashboard/welcome-tour-dialog.tsx`
- Test: `apps/web/tests/welcome-tour-dialog.test.tsx`

**Interfaces:**
- Produces:
  ```typescript
  export interface WelcomeTourDialogProps {
    familyId: string;
    isOpen: boolean;
    onStartTour(): void;
    onDismiss(): void;
  }
  ```

- [ ] **Step 1: Escrever teste falhando para `<WelcomeTourDialog>`**

Criar `apps/web/tests/welcome-tour-dialog.test.tsx`:
- Renderiza título e mensagem acolhedora.
- Clicar em "Iniciar Tour Guiado" dispara `onStartTour`.
- Clicar em "Pular e não ver mais" envia `PATCH /api/v1/families/:familyId/settings` com `{ onboardingDismissed: true }` e invoca `onDismiss`.

- [ ] **Step 2: Executar teste para verificar falha (RED)**

Run: `pnpm --filter @aletheia/web test tests/welcome-tour-dialog.test.tsx`  
Expected: FAIL com módulo inexistente.

- [ ] **Step 3: Implementar `<WelcomeTourDialog>`**

Implementar `apps/web/src/components/dashboard/welcome-tour-dialog.tsx` utilizando Tailwind e ícone `compass`, com layout flutuante acolhedor e seguro contra falhas de rede no dismiss.

- [ ] **Step 4: Executar testes para verificar aprovação (GREEN)**

Run: `pnpm --filter @aletheia/web test tests/welcome-tour-dialog.test.tsx`  
Expected: PASS (todos os testes verdes).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/dashboard/welcome-tour-dialog.tsx apps/web/tests/welcome-tour-dialog.test.tsx
git commit -m "feat(web): welcome tour dialog with instant permanent dismissal"
```

---

### Task 3: Componente `<GuidedTour>` (Spotlight Walkthrough) (`apps/web`)

**Files:**
- Create: `apps/web/src/components/dashboard/guided-tour.tsx`
- Test: `apps/web/tests/guided-tour.test.tsx`

**Interfaces:**
- Produces:
  ```typescript
  export interface TourStep {
    targetSelector?: string;
    titleKey: string;
    descriptionKey: string;
  }

  export interface GuidedTourProps {
    isOpen: boolean;
    familyId: string;
    steps?: TourStep[];
    onComplete(): Promise<void> | void;
    onSkip(): Promise<void> | void;
  }
  ```

- [ ] **Step 1: Escrever teste falhando para `<GuidedTour>`**

Criar `apps/web/tests/guided-tour.test.tsx`:
- Avançar entre passos com botão "Próximo".
- Voltar com botão "Anterior".
- Pular em qualquer momento com "Pular e sair" dispara `onSkip`.
- Concluir no último passo com "Concluir Tour" dispara `onComplete`.
- Exibe o indicador de progresso "Passo X de Y".

- [ ] **Step 2: Executar teste para verificar falha (RED)**

Run: `pnpm --filter @aletheia/web test tests/guided-tour.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implementar `<GuidedTour>` com Máscara de Spotlight**

Implementar `apps/web/src/components/dashboard/guided-tour.tsx`:
- Overlay transparente com `box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65)` sobre o elemento destacado ou fallback centralizado caso o seletor não seja encontrado.
- Card flutuante com z-index elevado, botão de fechar, botões de navegação e suporte a responsividade.

- [ ] **Step 4: Executar testes para verificar aprovação (GREEN)**

Run: `pnpm --filter @aletheia/web test tests/guided-tour.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/dashboard/guided-tour.tsx apps/web/tests/guided-tour.test.tsx
git commit -m "feat(web): dynamic guided tour spotlight component with step navigation"
```

---

### Task 4: Controle em Configurações & Acesso Sob Demanda na Barra Lateral (`apps/web`)

**Files:**
- Modify: `apps/web/src/components/settings/family-general-settings.tsx`
- Modify: `apps/web/src/components/layout/product-shell.tsx`
- Test: `apps/web/tests/family-general-settings.test.tsx` (ou novo arquivo de teste)

**Interfaces:**
- Consumes: `PATCH /api/v1/families/:familyId/settings` com `{ onboardingDismissed: boolean }`.
- Produces: Switch de tutorial em Configurações e botão sob demanda "Fazer Tour pelo Sistema" na barra lateral.

- [ ] **Step 1: Escrever teste falhando para o switch de tutorial nas Configurações**

Testar que alternar o switch "Tutorial de Primeiros Passos" em `FamilyGeneralSettings` envia a atualização correta para a API.

- [ ] **Step 2: Executar teste para verificar falha (RED)**

Run: `pnpm --filter @aletheia/web test tests/settings-tutorial-toggle.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implementar switch em `family-general-settings.tsx` e botão sob demanda em `product-shell.tsx`**

- Adicionar o campo com switch de tutorial na seção geral de configurações.
- Adicionar o botão "Fazer Tour pelo Sistema" com ícone `compass` no rodapé da navegação principal ou cabeçalho.

- [ ] **Step 4: Executar testes para verificar aprovação (GREEN)**

Run: `pnpm --filter @aletheia/web test tests/settings-tutorial-toggle.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/settings/family-general-settings.tsx apps/web/src/components/layout/product-shell.tsx apps/web/tests/
git commit -m "feat(web): tutorial toggle in family settings and on-demand trigger button"
```

---

### Task 5: Integração Completa no Dashboard, Remoção do Card Estático & Concessão de Gamificação (`apps/web`)

**Files:**
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/src/components/dashboard/getting-started-card.tsx` (desacoplar ou manter arquivado)
- Test: `apps/web/tests/dashboard.test.tsx`
- Test: `apps/web/tests/guided-tour-integration.test.tsx`

**Interfaces:**
- Consumes: `<WelcomeTourDialog>`, `<GuidedTour>`, Gamification API.
- Produces: Dashboard 100% limpo, sem card estático, com tour acionável sob demanda ou no primeiro acesso com opção definitiva de pular.

- [ ] **Step 1: Escrever teste falhando para o novo fluxo do Dashboard**

Validar que:
- O card estático de 4 colunas NÃO é renderizado na tela inicial.
- Se `onboardingDismissed === false`, exibe o diálogo `<WelcomeTourDialog>`.
- Clicar em "Pular e não ver mais" oculta o diálogo e não exibe o tour.
- Concluir o tour dispara `PATCH` de dispensa e celebra a gamificação.

- [ ] **Step 2: Executar teste para verificar falha (RED)**

Run: `pnpm --filter @aletheia/web test tests/guided-tour-integration.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Integrar os componentes em `apps/web/app/page.tsx`**

- Remover `<GettingStartedCard>` do layout do Dashboard.
- Adicionar estados `isTourOpen`, `isWelcomeOpen` geridos com autonomia.
- Conectar botão sob demanda do shell para abrir `isTourOpen = true`.

- [ ] **Step 4: Executar suite completa de testes e auditorias (GREEN)**

Run: `pnpm --filter @aletheia/web test`  
Run: `pnpm check:boundaries`  
Run: `node scripts/audit-i18n-coverage.mjs`  
Run: `pnpm --filter @aletheia/web typecheck`  
Expected: 100% PASS em todos os comandos.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/page.tsx apps/web/tests/
git commit -m "feat(web): integrate dynamic guided tour and remove static onboarding card from dashboard"
```
