# Hub "Por Onde Começar" & Amparo Legal (ALET-B06) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o Hub "Por Onde Começar" & Amparo Legal (`/legal-guide` / `/guia-legal`) com fundamentação jurídica, guia de proteção por evidências, checklist interativo dos primeiros 30 dias e integração com a API de jurisdições da família.

**Architecture:** Endpoint autenticado `GET /api/v1/families/:familyId/jurisdiction` servindo a definição da jurisdição da família (`FamilyJurisdictionResponseDto`); rota protegida no Next.js com componentes do Design System do Aletheia (`LegalFrameworkCard`, `EvidenceProtectionGuide`, `First30DaysChecklistCard`, `LegalFaqAccordion`); suporte completo a i18n em `pt-BR`, `en-US` e `es-ES`; persistência de estado do checklist no `localStorage`.

**Tech Stack:** NestJS, TypeScript 5.9, Next.js 15, React 19, `@aletheia/contracts`, `@aletheia/ui`, Vitest, Jest.

**Spec:** `docs/superpowers/specs/2026-10-13-legal-guide-hub-design.md`

## Global Constraints

- ZERO AI-attribution trailers (`Co-Authored-By`, `Generated-By`, etc.) in commits, commit bodies, or PR descriptions.
- Clean module boundaries (`pnpm check:boundaries` MUST pass with 14/14 tests).
- 100% dictionary key and token symmetry across `pt-BR`, `en-US`, and `es-ES`.
- Static i18n scanner `node scripts/audit-i18n-coverage.mjs` MUST maintain 100.0% coverage with 0 hardcoded strings.
- Strict typing (TypeScript 5.9). Method syntax on interface function props (e.g. `onToggle?(): void;`) to prevent scanner regex collisions.
- No Tailwind utility classes in `@aletheia/web` (use `@aletheia/ui` components and BEM classes with CSS variables in `globals.css`).

---

### Task 1: Contratos (`@aletheia/contracts`) & Endpoint Backend na API (`apps/api`)

**Files:**
- Modify: `packages/contracts/src/modules/jurisdictions/jurisdiction-definition.dto.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `apps/api/src/modules/jurisdictions/presentation/jurisdiction-definitions.controller.ts`
- Modify: `apps/api/src/modules/jurisdictions/application/jurisdiction-definitions.service.ts`
- Test: `apps/api/src/modules/jurisdictions/application/jurisdiction-definitions.service.spec.ts`
- Test: `apps/api/test/jurisdictions.e2e-spec.ts`

**Interfaces:**
- Produces: `FamilyJurisdictionResponseDto`
  ```typescript
  export interface FamilyJurisdictionResponseDto {
    code: string;
    name: string;
    version: number;
    confidenceLevel: 'ESTABLISHED' | 'EVOLVING' | 'UNCERTAIN';
    minInstructionalDays?: number | null;
    minInstructionalHours?: number | null;
    officialSource?: string | null;
    legalBasisSummary?: string | null;
  }
  ```
- Endpoint: `GET /api/v1/families/:familyId/jurisdiction` returns `FamilyJurisdictionResponseDto`

- [ ] **Step 1: Escrever testes que falham para o serviço de jurisdição da família**

Adicionar em `apps/api/src/modules/jurisdictions/application/jurisdiction-definitions.service.spec.ts`:
```typescript
describe('getFamilyJurisdiction', () => {
  it('returns published BR jurisdiction with instructional thresholds and sources when family has default settings', async () => {
    const result = await service.getFamilyJurisdiction('fam_123');
    expect(result).toBeDefined();
    expect(result.code).toBe('BR');
    expect(result.minInstructionalDays).toBe(200);
    expect(result.minInstructionalHours).toBe(800);
  });
});
```

- [ ] **Step 2: Rodar teste para verificar falha (RED)**

Run: `node scripts/run-test.cjs "src/modules/jurisdictions/application/jurisdiction-definitions.service.spec.ts"`
Expected: FAIL (`service.getFamilyJurisdiction is not a function`)

- [ ] **Step 3: Implementar `FamilyJurisdictionResponseDto` e método no serviço/controller**

Em `packages/contracts/src/modules/jurisdictions/jurisdiction-definition.dto.ts`:
```typescript
export interface FamilyJurisdictionResponseDto {
  code: string;
  name: string;
  version: number;
  confidenceLevel: 'ESTABLISHED' | 'EVOLVING' | 'UNCERTAIN';
  minInstructionalDays?: number | null;
  minInstructionalHours?: number | null;
  officialSource?: string | null;
  legalBasisSummary?: string | null;
}
```

Em `apps/api/src/modules/jurisdictions/application/jurisdiction-definitions.service.ts`:
Implementar `getFamilyJurisdiction(familyId: string): Promise<FamilyJurisdictionResponseDto>` buscando a definição ativa no banco ou fallback estruturado do Brasil.

Em `apps/api/src/modules/jurisdictions/presentation/jurisdiction-definitions.controller.ts`:
Adicionar endpoint familiar com `@UseGuards(JwtAuthGuard, ActiveFamilyMemberGuard)` e `@Get('families/:familyId/jurisdiction')`.

- [ ] **Step 4: Rodar testes da API para verificar sucesso (GREEN)**

Run: `node scripts/run-test.cjs "src/modules/jurisdictions"`
Expected: PASS
Run: `pnpm check:boundaries`
Expected: 14/14 PASS
Run: `pnpm --filter @aletheia/api typecheck`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/ apps/api/
git commit -m "feat(api): endpoint to retrieve family legal jurisdiction requirements"
```

---

### Task 2: Dicionários de Internacionalização i18n (`apps/web`)

**Files:**
- Create: `apps/web/src/lib/i18n/dictionaries/pt-BR/legal-guide.ts`
- Create: `apps/web/src/lib/i18n/dictionaries/en-US/legal-guide.ts`
- Create: `apps/web/src/lib/i18n/dictionaries/es-ES/legal-guide.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/pt-BR/navigation.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/en-US/navigation.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/es-ES/navigation.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/pt-BR/index.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/en-US/index.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/es-ES/index.ts`
- Test: `apps/web/tests/i18n.test.tsx`

**Interfaces:**
- Produces: `nav.legalGuide` ("Amparo Legal" / "Legal Guide" / "Amparo Legal")
- Produces: `legalGuide.header.title`, `legalGuide.header.subtitle`, `legalGuide.framework.*`, `legalGuide.evidence.*`, `legalGuide.checklist.*`, `legalGuide.faq.*`

- [ ] **Step 1: Escrever teste de asserção de i18n que falha**

Adicionar em `apps/web/tests/i18n.test.tsx`:
```typescript
it('possui todas as chaves de nav.legalGuide e legalGuide.* com simetria entre pt-BR, en-US e es-ES', () => {
  const pt = getDictionary('pt-BR');
  const en = getDictionary('en-US');
  const es = getDictionary('es-ES');

  expect(pt.nav.legalGuide).toBeDefined();
  expect(en.nav.legalGuide).toBeDefined();
  expect(es.nav.legalGuide).toBeDefined();

  expect(pt.legalGuide.checklist.steps.step1.title).toBeDefined();
  expect(en.legalGuide.checklist.steps.step1.title).toBeDefined();
  expect(es.legalGuide.checklist.steps.step1.title).toBeDefined();
});
```

- [ ] **Step 2: Rodar teste para verificar falha (RED)**

Run: `pnpm --filter @aletheia/web test tests/i18n.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implementar dicionários em `pt-BR`, `en-US` e `es-ES`**

Criar `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/legal-guide.ts` contendo:
- `header`: título e introdução encorajadora
- `framework`: fundamentação legal, dias e horas mínimas, decisão do STF
- `evidence`: valor das evidências e botão de dossiê de conformidade
- `checklist`: 6 passos práticos com títulos, descrições e botões de ação
- `faq`: 4 perguntas e respostas detalhadas e práticas

Registrar em `navigation.ts` e exportar em `index.ts`.

- [ ] **Step 4: Rodar teste e scanner de cobertura i18n (GREEN)**

Run: `pnpm --filter @aletheia/web test tests/i18n.test.tsx`
Expected: PASS
Run: `node scripts/audit-i18n-coverage.mjs`
Expected: 100.0% coverage, 0 pending

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/i18n/ apps/web/tests/i18n.test.tsx
git commit -m "feat(i18n): dictionaries for legal guide hub, faq and 30-day checklist"
```

---

### Task 3: Componentes do Guia Legal (`apps/web/src/components/legal-guide/`)

**Files:**
- Create: `apps/web/src/components/legal-guide/legal-framework-card.tsx`
- Create: `apps/web/src/components/legal-guide/evidence-protection-guide.tsx`
- Create: `apps/web/src/components/legal-guide/first-30-days-checklist-card.tsx`
- Create: `apps/web/src/components/legal-guide/legal-faq-accordion.tsx`
- Create: `apps/web/src/components/legal-guide/legal-guide-view.tsx`
- Create: `apps/web/src/components/legal-guide/index.ts`
- Modify: `apps/web/app/globals.css` (estilos BEM do guia legal com tokens semânticos)
- Test: `apps/web/tests/legal-guide.test.tsx`

**Interfaces:**
- Produces:
  ```typescript
  export interface LegalGuideViewProps {
    familyId: string;
    learnersCount?: number;
  }
  ```

- [ ] **Step 1: Escrever testes unitários que falham em `apps/web/tests/legal-guide.test.tsx`**

Testar:
1. Renderização do `<LegalFrameworkCard>` com metas da jurisdição (200 dias / 800 horas).
2. Renderização do `<EvidenceProtectionGuide>` com botão para `/reports`.
3. Interação no `<First30DaysChecklistCard>`: marcar checkbox atualiza contagem de progresso e persiste no localStorage.
4. Auto-detecção: se `learnersCount > 0`, passo 1 já vem marcado.
5. Renderização do acordeão `<LegalFaqAccordion>` expandindo respostas.

- [ ] **Step 2: Rodar teste para verificar falha (RED)**

Run: `pnpm --filter @aletheia/web test tests/legal-guide.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implementar componentes do Guia Legal**

Construir componentes em `apps/web/src/components/legal-guide/` usando `@aletheia/ui` (`Card`, `Button`, `AletheiaIcon`, `Badge`) e classes BEM semânticas em `globals.css` (`.legal-guide-*`).
Garantir persistência via `localStorage` com chave `aletheia_checklist_30days_${familyId}` com fallback gracioso para SSR.

- [ ] **Step 4: Rodar testes unitários (GREEN)**

Run: `pnpm --filter @aletheia/web test tests/legal-guide.test.tsx`
Expected: PASS
Run: `node scripts/audit-i18n-coverage.mjs`
Expected: 100.0% coverage
Run: `pnpm check:boundaries`
Expected: 14/14 PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/legal-guide/ apps/web/app/globals.css apps/web/tests/legal-guide.test.tsx
git commit -m "feat(web): legal guide components, framework card and 30-day interactive checklist"
```

---

### Task 4: Integração de Rota, Navegação no Shell & Validação Final (`apps/web`)

**Files:**
- Create: `apps/web/app/(dashboard)/legal-guide/page.tsx`
- Modify: `apps/web/src/components/layout/product-shell.tsx`
- Modify: `next.config.mjs`
- Test: `apps/web/tests/product-shell.test.tsx`
- Test: `apps/web/tests/legal-guide-page.test.tsx`

- [ ] **Step 1: Escrever testes que falham para a rota e navegação**

Testar que `ProductShell` inclui o link `nav.legalGuide` apontando para `/legal-guide` e que a página carrega os dados da família.

- [ ] **Step 2: Rodar teste para verificar falha (RED)**

Run: `pnpm --filter @aletheia/web test tests/product-shell.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implementar rota e atualizar `ProductShell`**

1. Adicionar item `legal-guide` em `MAIN_NAV_ITEMS` e `PRIORITY_NAV_ITEM_IDS` de `product-shell.tsx`.
2. Criar `apps/web/app/(dashboard)/legal-guide/page.tsx` consumindo `LegalGuideView`.
3. Adicionar rewrite de `/guia-legal` para `/legal-guide` em `next.config.mjs`.

- [ ] **Step 4: Rodar suite completa de testes e validação**

Run: `pnpm --filter @aletheia/web test`
Expected: 65+ test files pass
Run: `node scripts/audit-i18n-coverage.mjs`
Expected: 100.0% coverage, 0 pending
Run: `pnpm check:boundaries`
Expected: 14/14 pass
Run: `pnpm --filter @aletheia/web typecheck`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/ apps/web/src/components/layout/product-shell.tsx next.config.mjs apps/web/tests/
git commit -m "feat(web): legal guide page route and product shell navigation integration"
```
