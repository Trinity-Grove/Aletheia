# Tutorial Interativo Guiado (Spotlight Walkthrough) & Autonomia de Onboarding — Design Specification

**Data:** 10 de Outubro de 2026  
**Status:** Aprovado para Planejamento  
**Escopo:** `apps/web`, `apps/api`, `packages/contracts`, `packages/ui`  
**Autor:** Trinity Grove Engineering  

---

## 1. Visão Geral & Objetivos

Substituir o bloco estático e invasivo de Primeiros Passos no Dashboard (`<GettingStartedCard>`) por um **Tutorial Interativo Guiado (Spotlight Walkthrough)** dinâmico, elegante e que respeite a **autonomia total** da família.

### 1.1 Objetivos de Negócio & Experiência
1. **Autonomia & Não-Intrusão:**
   - O Dashboard permanece limpo e focado no acompanhamento pedagógico do dia a dia.
   - Usuários que não querem o tutorial têm a opção imediata e destacada de **"Pular e não ver mais"**, que persiste a preferência e nunca mais reabre o tour.
   - Em **Configurações (`/settings`)**, o usuário pode habilitar ou desabilitar o tutorial a qualquer momento com um switch simples.
2. **Ambientação Dinâmica e Guiada (Spotlight):**
   - Usuários que desejam o tutorial são guiados dinamicamente pelos elementos reais da interface, com máscara de foco (*spotlight* visual escurecendo o restante da tela) e balões explicativos acolhedores.
   - Possibilidade de avançar, voltar ou pular o tour a qualquer instante.
3. **Acesso Sob Demanda:**
   - Botão discreto no rodapé da barra lateral ou na tela de configurações para reiniciar o tour quando a família desejar.
4. **Gamificação Integrada:**
   - Concluir o tutorial guiado desbloqueia o badge de introdução da gamificação (`FIRST_STEP` / 🌱 ou badge de boas-vindas), celebrando os primeiros passos da família no sistema.

---

## 2. Experiência do Usuário (UX) & Fluxo

```
[Primeiro Acesso ao Dashboard]
         │
         ├── Se onboardingDismissed === true ─────────► [Dashboard Limpo (Sem interrupções)]
         │
         └── Se onboardingDismissed === false
                  │
                  ▼
         [Diálogo de Boas-Vindas Dinâmico]
         ┌─────────────────────────────────────────────────────────┐
         │ Bem-vindo ao Aletheia!                                  │
         │ Gostaria de um tour rápido pelas principais ferramentas? │
         │                                                         │
         │ [ Iniciar Tour Guiado (3 min) ]                         │
         │ [ Pular e não ver mais ] ─────────────────────────────┐ │
         └─────────────────────────────────────────────────────────┘ │
                  │                                                  │
                  ▼                                                  ▼
         [Tour com Spotlight na Interface]            [Persiste onboardingDismissed: true]
         Passo 1: Barra Lateral & Módulos             [Fecha diálogo para sempre]
         Passo 2: Foco do Educando (Topo)
         Passo 3: Devocional da Família
         Passo 4: Jornada do Dia & Atividades
         Passo 5: Celebração & Badge de Gamificação
                  │
                  ▼
         [Persiste onboardingDismissed: true]
         [Concede / Exibe Badge na Gamificação]
```

### 2.1 Diálogo Inicial de Boas-Vindas (`<WelcomeTourDialog>`)
* Exibido apenas se `settings.onboardingDismissed === false` e o usuário acabou de entrar na tela inicial.
* **Ação "Pular e não ver mais":** Faz `PATCH /api/v1/families/:familyId/settings` com `{ onboardingDismissed: true }` e fecha instantaneamente.
* **Ação "Iniciar Tour Guiado":** Inicia a sequência do `<GuidedTour>`.

### 2.2 Sequência do Spotlight Walkthrough (`<GuidedTour>`)
O tour calcula a posição do elemento de destino (`getBoundingClientRect`) e projeta uma máscara escurecida com orifício destacado sobre o componente:

1. **Passo 1 — Módulos da Barra Lateral:**
   * *Target:* `[data-testid="appshell-nav"]`
   * *Título:* "Navegação & Módulos"
   * *Conteúdo:* "Acesse Educandos, Currículo, Agenda semanal, Diário de Aprendizagem, Portfólio fotográfico e Relatórios estruturados."
2. **Passo 2 — Foco do Educando:**
   * *Target:* `[data-testid="learner-focus-container"]`
   * *Título:* "Foco do Educando"
   * *Conteúdo:* "Alterne facilmente entre o acompanhamento de cada filho individualmente ou veja a visão consolidada de toda a família."
3. **Passo 3 — Devocional Diário:**
   * *Target:* `[data-testid="scripture-card"]`
   * *Título:* "Versículo & Devocional"
   * *Conteúdo:* "Inspiração espiritual diária com registros de orações e reflexões bíblicas da família."
4. **Passo 4 — Jornada do Dia:**
   * *Target:* `[data-testid="card-title"]` (Jornada Diária de Aprendizagem)
   * *Título:* "Jornada & Atividades"
   * *Conteúdo:* "Acompanhe o tempo de instrução em tempo real e conclua lições com registro reflexivo."
5. **Passo 5 — Conclusão & Conquista:**
   * *Target:* Centro da tela (modal comemorativo).
   * *Título:* "Tudo Pronto para Começar!"
   * *Conteúdo:* "Você explorou os principais pontos do Aletheia. Parabéns pelo início desta jornada educativa clássica!"
   * *Badge:* Concede ou celebra o badge `FIRST_STEP` na gamificação.

---

## 3. Configurações & Autonomia Sob Demanda

### 3.1 Aba de Configurações da Família (`/settings`)
* Adição de um switch em `apps/web/src/components/settings/family-general-settings.tsx`:
  * **Rótulo:** "Tutorial de Primeiros Passos"
  * **Descrição:** "Exibir tour interativo guiado pelas principais ferramentas do sistema."
  * **Estado:** Se desativado, `onboardingDismissed` é `true`. O usuário pode ativar a qualquer momento para rever o tutorial ou desativar sem nunca ter precisado fazê-lo.
* **Botão Sob Demanda:**
  * No rodapé da barra lateral (`Sidebar`) ou no card de ajuda:
  * Botão com ícone de bússola: `"Fazer Tour pelo Sistema"` — dispara `<GuidedTour>` sob demanda.

---

## 4. Contratos & Modelo de Dados

### 4.1 `@aletheia/contracts`
* O campo `onboardingDismissed: z.boolean().optional()` já está presente em `updateFamilySettingsSchema` e `familySettingsResponseSchema`.
* Não são necessárias novas migrações de banco de dados no Prisma (`family_settings.onboardingDismissed` já existe e tem valor default `false`).

### 4.2 Gamificação (`apps/api/src/modules/gamification`)
* Ao concluir o tour, se a família possuir educandos cadastrados, aciona o registro do badge `FIRST_STEP` no motor de gamificação para o educando ativo ou primeiro educando da família.

---

## 5. Internacionalização (i18n)

Todas as strings serão implementadas com 100% de simetria nos dicionários `pt-BR`, `en-US` e `es-ES`:
* `dashboard.tour.welcome.title`
* `dashboard.tour.welcome.subtitle`
* `dashboard.tour.welcome.start`
* `dashboard.tour.welcome.dismissNever`
* `dashboard.tour.step1.title`, `dashboard.tour.step1.description`
* `dashboard.tour.step2.title`, `dashboard.tour.step2.description`
* `dashboard.tour.step3.title`, `dashboard.tour.step3.description`
* `dashboard.tour.step4.title`, `dashboard.tour.step4.description`
* `dashboard.tour.step5.title`, `dashboard.tour.step5.description`
* `dashboard.tour.controls.next`, `dashboard.tour.controls.prev`, `dashboard.tour.controls.skip`, `dashboard.tour.controls.finish`
* `dashboard.tour.progressIndicator`
* `settings.general.tutorialToggle.title`, `settings.general.tutorialToggle.description`
* `nav.startTour`

---

## 6. Critérios de Aceite & Verificação

1. **Remoção do Card Estático:**
   * O card estático de 4 colunas `<GettingStartedCard>` não aparece mais ocupando espaço no Dashboard.
2. **Autonomia (Pular e Não Ver Mais):**
   * Ao clicar em "Pular e não ver mais", a requisição `PATCH /settings` persiste `onboardingDismissed = true` e o diálogo nunca mais abre.
3. **Tour Dinâmico (Spotlight):**
   * Ao clicar em "Iniciar Tour Guiado", a tela escurece e os 4 passos reais recebem destaque visual com posicionamento dinâmico correto.
   * O usuário pode avançar, voltar e pular a qualquer instante.
   * O último passo exibe celebração e celebra o badge da gamificação.
4. **Controle em Configurações:**
   * O switch em `/settings` reflete e altera o estado de `onboardingDismissed`.
5. **Gatilho Sob Demanda:**
   * Clicar em "Fazer Tour pelo Sistema" abre o tour a qualquer momento, mesmo se o tour já tiver sido dispensado.
6. **Portões de Qualidade:**
   * `pnpm check:boundaries` aprova 14/14 testes.
   * `node scripts/audit-i18n-coverage.mjs` mantém 100.0% de cobertura.
   * Testes unitários do `<GuidedTour>` e `<WelcomeTourDialog>` passam com 100% de sucesso.
   * Zero trailers de IA nos commits.
