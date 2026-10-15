# Especificação Técnica: Harmonização do Design System @aletheia/ui (Tipografia e Quebras) (ALET-B05)

## 1. Visão Geral e Motivação

Atualmente, diversas páginas internas do painel (`apps/web/app/(dashboard)/`) apresentam inconsistências tipográficas e quebras de alinhamento estruturais:
- **Títulos de página**: Variações arbitrárias de `fontSize` (`1.5rem`, `1.75rem`, `1.875rem`), `fontWeight` (`700`, `800`, `400`) e cores (`var(--text-primary)`, `var(--forest)`, `var(--color-brand-forest)`).
- **Font-family**: Algumas páginas usam fonte sem serifa (`var(--font-sans)`), enquanto o Design System oficial do Aletheia estabelece a tipografia institucional em serifa editorial (`var(--font-serif)`) com `clamp(1.75rem, 3vw, 2.25rem)` e tom `var(--color-brand-forest)` (ou `var(--forest)`).
- **Contêineres de página**: Diferentes páginas declaram estilos inline (`maxWidth: '1200px'`, `maxWidth: '1100px'`, `padding: '1.5rem 1rem'`, `padding: '2rem 1.5rem'`), gerando "pulos" visuais (layout shifts) horizontais ao alternar entre abas do menu de navegação.

## 2. Objetivos e Requisitos

### 2.1. Escopo explícito

O escopo desta entrega são as dez rotas de primeiro nível listadas abaixo. Rotas filhas e telas especiais não entram automaticamente nesta migração e devem ser tratadas em uma issue própria ou explicitamente aprovadas como exceção:

- `/attendance`, `/curriculum`, `/devotional`, `/learners`, `/portfolio`;
- `/records`, `/reports`, `/schedule`, `/settings`, `/support`.

Ficam fora deste escopo, salvo decisão registrada, `/curriculum/activities`, `/curriculum/packs`, `/curriculum/seminary`, `/devotional/comparador`, `/settings/privacy`, `/design-system`, `/legal-guide` e `/onboarding`.

1. **Padronização do Contêiner Global (`.page-container`)**:
   - Criar e padronizar a classe utilitária semântica `.page-container` em `apps/web/app/globals.css`.
   - Largura máxima unificada: `76rem` (`1216px`), centralizada (`margin-left: auto; margin-right: auto;`).
   - Padding responsivo: `1.5rem 1rem` no mobile, expandindo para `2rem 1.5rem` a partir de `640px`. Este breakpoint é o contrato único da B05; não misturar `640px` e `768px` entre spec e implementação.
   - O container não deve impor `gap` global nem substituir `.dashboard-page`: a home já possui regras próprias e deve ser auditada separadamente para evitar espaçamento duplicado ou regressão visual.
   - Eliminar `style={{ maxWidth: '...', padding: '...' }}` manuais das páginas.
2. **Harmonização dos Cabeçalhos com `<PageHeader>` (`@aletheia/ui`)**:
   - Substituir cabeçalhos manuais (`<div><h1>...</h1><p>...</p></div>`) pelo componente institucional `<PageHeader>` nas 10 rotas do dashboard:
     - `/attendance` (Frequência Escolar)
     - `/curriculum` (Grade Curricular & Objetivos)
     - `/devotional` (Devocional Familiar & Orações)
     - `/learners` (Gestão de Educandos)
     - `/portfolio` (Portfólio de Aprendizagem)
     - `/records` (Diário de Bordo & Competências)
     - `/reports` (Relatórios & Dossiês Oficiais)
     - `/schedule` (Agenda Diária & Rotina Semanal)
     - `/settings` (Configurações da Família)
     - `/support` (Apoio Comunitário & Doações)
   - Utilizar a prop `action` do `<PageHeader>` para ações contextuais (ex.: botão "Adicionar Educando", alternador de abas da Agenda/Rotina), preservando roles, estados ARIA, foco e comportamento dos controles.
   - `/support` mantém o banner institucional, o ícone e os três benefícios; o `PageHeader` deve ser integrado ao banner sem remover ou duplicar esse conteúdo.
   - `/curriculum` mantém o badge de modelo pedagógico e suas ações. Como o `PageHeader` atual aceita `title: string`, a implementação deve estender explicitamente o contrato (por exemplo, com `titleAdornment`) ou registrar uma exceção; não achatar o cabeçalho atual silenciosamente.
3. **Preservação de Semântica e Testabilidade**:
   - Manter todos os `data-testid` existentes (`add-learner-btn`, `tab-agenda`, `tab-routine`, `tab-records-diario`, etc.).
   - Assegurar que `<PageHeader>` emita `<header data-testid="page-header">`, `<h1 data-testid="page-header-title">` e `<p data-testid="page-header-description">`.
4. **Governança Estrita do Projeto**:
   - ZERO classes utilitárias Tailwind no JSX de `@aletheia/web` (uso estrito de componentes de `@aletheia/ui` e classes BEM com variáveis CSS).
   - 100% de cobertura i18n preservada (`audit-i18n-coverage.mjs` sem chaves pendentes).
   - Testes de barreiras de módulo intactos (`pnpm check:boundaries`), registrando o resultado real do comando.
   - ZERO trailers de atribuição de IA nos commits e mensagens (`Co-Authored-By`, `Generated-By`, etc.).

## 3. Arquitetura e Contratos

### 3.1. Estilos em `apps/web/app/globals.css`

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

Não adicionar uma segunda definição genérica para `.dashboard-page` como parte desta entrega. Se uma página já possuir um wrapper específico, remover apenas os valores inline conflitantes e preservar classes que tenham comportamento funcional ou visual comprovado.

### 3.2. Estrutura do Componente `<PageHeader>` em `@aletheia/ui`

O componente `@aletheia/ui` já implementa `eyebrow`, `title`, `description` e `action`. Para preservar o badge do currículo, a implementação deve adicionar explicitamente `titleAdornment` ao contrato e renderizá-lo junto ao título, ou manter a exceção documentada:
```tsx
export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string | undefined;
  title: string;
  titleAdornment?: React.ReactNode | undefined;
  description?: string | undefined;
  action?: React.ReactNode | undefined;
}
```
Renderizando:
```html
<header data-testid="page-header" class="ui-page-header">
  <div>
    <!-- opcional: eyebrow -->
    <h1 data-testid="page-header-title" style="font-family: var(--font-serif); font-size: clamp(1.75rem, 3vw, 2.25rem); color: var(--color-brand-forest); font-weight: 400; line-height: 1.2;">
      {title}
    </h1>
    <!-- opcional: titleAdornment junto ao título -->
    <!-- opcional: description -->
  </div>
  <!-- opcional: action -->
</header>
```

O uso de `<PageHeader>` nesta issue consome os estilos institucionais existentes. A migração interna dos estilos inline do próprio componente para classes CSS/tokens não é implícita nesta entrega; caso seja necessária para a governança do design system, deve entrar como tarefa explícita e cobrir todos os consumidores.

## 4. Plano de Testes & Verificação

1. **Testes Unitários / Integração**:
   - `apps/web/tests/design-system-harmonization.test.tsx`:
     - Verifica a presença de `<header data-testid="page-header">` e classe `.page-container` nas páginas harmonizadas, usando `LocaleProvider`, `AuthContext`, mocks de navegação e `fetch` compatíveis com os testes existentes.
     - Valida preservação de botões de ação e seletores interativos.
     - Valida o badge de currículo, os controles de agenda e o conteúdo do banner de suporte.
     - A validação da regra CSS de `.page-container` deve ser estática ou visual; um teste de DOM isolado não carrega `globals.css` e não prova `max-width` ou padding.
2. **Suíte Existente de Testes**:
   - Execução integral de `pnpm --filter @aletheia/web test`, sem fixar previamente quantidade de arquivos ou testes; registrar a saída real.
3. **Auditorias de Governança**:
   - `pnpm audit:i18n` sem novas chaves ausentes ou strings hardcoded introduzidas.
   - `pnpm check:boundaries` sem regressões.
   - `pnpm --filter @aletheia/web typecheck` e `pnpm --filter @aletheia/web lint` sem erros.
4. **Validação responsiva**:
   - Verificar 320px, 375px, 640px, 768px e desktop.
   - Confirmar que as grades de `/support` e `/curriculum` não criam overflow horizontal; `minmax(360px, 1fr)` e `minmax(22rem, 1fr)` não podem ser aceitos sem uma regra de empilhamento ou limite baseado em `100%`.
