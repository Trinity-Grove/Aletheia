# Módulo Teológico Avançado (Nível Seminário) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o Módulo Teológico Avançado em nível introdutório de seminário (Issue #176, residual da #95 seções 6 e 8), incluindo 5 novos tipos de evidência acadêmica, rubrica de rigor teológico, 24 competências, pacote curricular `ADVANCED_SEMINARY_THEOLOGY` abrangendo os 4 ciclos de concentração com ementas, leituras primárias e integração com a Lente Confessional do `TheologicalProfile` da família.

**Architecture:** Abordagem híbrida orientada a dados versionados no catálogo (`DataMigrationRunner`). O conteúdo central das 24 disciplinas é ecumênico-acadêmico e neutro, complementado dinamicamente no frontend por fontes confessionais correspondentes à tradição da família (`TheologicalProfile`). A produção acadêmica é submetida via `EvidenceSubmission` e avaliada por rubrica analítica ponderada com promoção ao portfólio.

**Tech Stack:** TypeScript 5.9, Next.js 16 (App Router), NestJS (Fastify), PostgreSQL (Prisma), Zod, Vitest, React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-27-advanced-theology-seminary-module-design.md`

## Global Constraints
- ZERO AI-attribution trailers in git commit messages, code comments, or PRs (`Co-Authored-By`, `Generated-By`, etc.).
- Follow Test-Driven Development (TDD): Red -> Green -> Refactor.
- Maintain architecture module boundaries: verify with `pnpm check:boundaries`.
- Single central API serving both `apps/web` and `apps/backoffice`.
- Strict typing and Zod schemas in `@aletheia/contracts`.
- Multi-tenant isolation: family data must remain tenant-isolated.

---

### Task 1: Contratos Zod & DTOs em `@aletheia/contracts`

**Files:**
- Modify: `packages/contracts/src/evidence-type-definition.ts`
- Create: `packages/contracts/src/seminary-theology.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/contracts/tests/seminary-theology.test.ts`

**Interfaces:**
- Produces: `SeminaryEvidenceTypeCodeSchema` (`THEOLOGICAL_ESSAY`, `EXEGESIS_PAPER`, `BOOK_REVIEW`, `ORAL_DEFENSE`, `THEOLOGICAL_DEBATE`)
- Produces: `SeminaryRubricCriterionSchema`, `SeminaryTheologyRubricSchema`
- Produces: `SeminaryDisciplineSchema`, `SeminaryCycleSchema`, `SeminaryTheologyPackPayloadSchema`
- Produces: `SEMINARY_THEOLOGY_COMPETENCIES`, `SEMINARY_DISCIPLINES_METADATA`

- [ ] **Step 1: Escrever teste de falha para os contratos de seminário**

Criar `packages/contracts/tests/seminary-theology.test.ts`:
```typescript
import { describe, expect, it } from 'vitest';
import {
  SeminaryEvidenceTypeCodeSchema,
  SeminaryTheologyRubricSchema,
  SeminaryTheologyPackPayloadSchema,
  SEMINARY_THEOLOGY_COMPETENCIES,
  SEMINARY_DISCIPLINES_METADATA,
} from '../src/seminary-theology.js';

describe('Seminary Theology Contracts', () => {
  it('validates all 5 seminary evidence type codes', () => {
    expect(SeminaryEvidenceTypeCodeSchema.parse('THEOLOGICAL_ESSAY')).toBe('THEOLOGICAL_ESSAY');
    expect(SeminaryEvidenceTypeCodeSchema.parse('EXEGESIS_PAPER')).toBe('EXEGESIS_PAPER');
    expect(SeminaryEvidenceTypeCodeSchema.parse('BOOK_REVIEW')).toBe('BOOK_REVIEW');
    expect(SeminaryEvidenceTypeCodeSchema.parse('ORAL_DEFENSE')).toBe('ORAL_DEFENSE');
    expect(SeminaryEvidenceTypeCodeSchema.parse('THEOLOGICAL_DEBATE')).toBe('THEOLOGICAL_DEBATE');
  });

  it('validates seminary theology rubric structure with 4 criteria', () => {
    const validRubric = {
      code: 'THEOLOGY_ACADEMIC_RIGOR_RUBRIC',
      name: 'Rubrica de Rigor Teológico e Exegético',
      criteria: [
        { code: 'EXEGETICAL_DEPTH', name: 'Fidelidade Exegética', weight: 0.3 },
        { code: 'SYSTEMATIC_COHERENCE', name: 'Coerência Sistemática', weight: 0.25 },
        { code: 'HISTORICAL_AWARENESS', name: 'Consciência Histórica e Patrística', weight: 0.25 },
        { code: 'ARGUMENTATIVE_RIGOR', name: 'Rigor Argumentativo e Caridade', weight: 0.2 },
      ],
    };
    expect(SeminaryTheologyRubricSchema.parse(validRubric)).toBeDefined();
  });

  it('validates all 24 required seminary competencies from Issue #95/#176', () => {
    expect(SEMINARY_THEOLOGY_COMPETENCIES.length).toBe(24);
    expect(SEMINARY_THEOLOGY_COMPETENCIES).toContain('THEO.ADV.ESCHATOLOGY_MILLENNIUM');
    expect(SEMINARY_THEOLOGY_COMPETENCIES).toContain('THEO.ADV.APOCALYPSE_MODELS');
    expect(SEMINARY_THEOLOGY_COMPETENCIES).toContain('THEO.ADV.PATRISTICS');
    expect(SEMINARY_THEOLOGY_COMPETENCIES).toContain('THEO.ADV.HISTORIC_COUNCILS');
  });

  it('validates curriculum pack payload structure with 4 cycles and 24 disciplines', () => {
    expect(SEMINARY_DISCIPLINES_METADATA.length).toBe(24);
  });
});
```

- [ ] **Step 2: Executar teste para verificar falha**

Run: `pnpm --filter @aletheia/contracts test packages/contracts/tests/seminary-theology.test.ts`
Expected: FAIL (módulo `../src/seminary-theology.js` não encontrado).

- [ ] **Step 3: Implementar schemas em `packages/contracts/src/seminary-theology.ts` e exportar em `index.ts`**

Criar `packages/contracts/src/seminary-theology.ts` contendo as definições dos 5 tipos de evidência, a rubrica analítica com pesos somando 1.0, e a lista completa dos 24 tópicos e competências.
Exportar no `packages/contracts/src/index.ts`:
```typescript
export * from './seminary-theology.js';
```

- [ ] **Step 4: Executar testes de contratos e build**

Run: `pnpm --filter @aletheia/contracts test && pnpm --filter @aletheia/contracts build`
Expected: PASS com 100% de sucesso.

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/
git commit -m "feat(contracts): add seminary theology evidence types, rubric, and curriculum schemas"
```

---

### Task 2: Seeders no Backend (`apps/api`) & DataMigrationRunner

**Files:**
- Create: `apps/api/src/modules/curriculum/infrastructure/seminary-evidence-types.seeder.ts`
- Create: `apps/api/src/modules/curriculum/infrastructure/seminary-rubrics.seeder.ts`
- Create: `apps/api/src/modules/curriculum/infrastructure/seminary-competencies.seeder.ts`
- Create: `apps/api/src/modules/curriculum/infrastructure/advanced-seminary-theology-pack.seeder.ts`
- Modify: `apps/api/src/main.ts`
- Create: `apps/api/src/modules/curriculum/infrastructure/seminary-seeders.spec.ts`

**Interfaces:**
- Consumes: `@aletheia/contracts` (`SeminaryEvidenceTypeCodeSchema`, `SEMINARY_DISCIPLINES_METADATA`, etc.)
- Consumes: `PrismaService`, `DataMigrationRunner`
- Produces: Registros estáveis no banco de dados com status `PUBLISHED` no boot da API.

- [ ] **Step 1: Escrever testes unitários para os seeders de seminário**

Criar `apps/api/src/modules/curriculum/infrastructure/seminary-seeders.spec.ts`:
- Validar se `SeminaryEvidenceTypesSeeder` insere 5 tipos de evidência com idempotência.
- Validar se `SeminaryRubricsSeeder` insere a rubrica de rigor teológico com 4 critérios e níveis de domínio.
- Validar se `SeminaryCompetenciesSeeder` insere 24 competências sob o domínio teológico.
- Validar se `AdvancedSeminaryTheologyPackSeeder` cria o `CurriculumPack` com 4 ciclos e 24 disciplinas completas.

- [ ] **Step 2: Executar teste para verificar falha**

Run: `pnpm --filter @aletheia/api test seminary-seeders.spec.ts`
Expected: FAIL (seeders não encontrados).

- [ ] **Step 3: Implementar seeders no módulo curriculum**

Criar:
1. `seminary-evidence-types.seeder.ts`: Insere os 5 tipos de evidência acadêmica no `EvidenceTypeDefinition`.
2. `seminary-rubrics.seeder.ts`: Insere a `RubricDefinition` `THEOLOGY_ACADEMIC_RIGOR_RUBRIC`.
3. `seminary-competencies.seeder.ts`: Insere as 24 competências com descrições e objetivos educacionais.
4. `advanced-seminary-theology-pack.seeder.ts`: Insere o `CurriculumPack` `ADVANCED_SEMINARY_THEOLOGY` estruturado com 4 ciclos, ementas, leituras recomendadas e sugestões de produções acadêmicas.

- [ ] **Step 4: Integrar seeders ao `DataMigrationRunner` em `apps/api/src/main.ts`**

Adicionar chamadas com códigos estáveis de migração de dados no `bootstrap()`:
- `seed:seminary-evidence-types:v1`
- `seed:seminary-rubrics:v1`
- `seed:seminary-competencies:v1`
- `seed:advanced-seminary-theology-pack:v1`

- [ ] **Step 5: Executar testes de unidade e verificação de boundaries**

Run: `pnpm --filter @aletheia/api test seminary-seeders.spec.ts`
Run: `pnpm check:boundaries`
Run: `pnpm --filter @aletheia/api typecheck`
Expected: PASS com 0 erros.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/
git commit -m "feat(api): add seminary theology seeders and data migration runner registration"
```

---

### Task 3: Visualizador do Módulo de Seminário e Lente Confessional (`apps/web`)

**Files:**
- Create: `apps/web/src/components/curriculum/seminary-module-viewer.tsx`
- Create: `apps/web/src/components/curriculum/theological-lens-card.tsx`
- Create: `apps/web/app/(dashboard)/curriculum/seminary/page.tsx`
- Modify: `apps/web/src/lib/i18n/dictionaries/pt-BR/curriculum.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/en-US/curriculum.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/es-ES/curriculum.ts`
- Create: `apps/web/tests/seminary-module-viewer.test.tsx`

**Interfaces:**
- Consumes: `@aletheia/contracts` (`CurriculumPackResponseDto`, `TheologicalProfileResponseDto`)
- Consumes: `GET /api/v1/curriculum-packs/*`, `GET /api/v1/families/:familyId/theological-profile`
- Produces: Interface de estudo dos 4 ciclos de seminário com ementas, bibliografia clássica e alternância da lente confessional.

- [ ] **Step 1: Escrever teste de falha para os componentes de visualização**

Criar `apps/web/tests/seminary-module-viewer.test.tsx`:
- Renderizar `SeminaryModuleViewer` com mock do pacote curricular de seminário.
- Validar se os 4 ciclos são exibidos e navegáveis.
- Validar se a Lente Confessional adapta os documentos históricos recomendados com base no perfil da família (ex: Westminster para Reformados, Augsburgo para Luteranos, etc.).
- Validar exibição da matriz das 4 escolas milenistas e 4 correntes do Apocalipse na disciplina de Escatologia.

- [ ] **Step 2: Executar teste para verificar falha**

Run: `pnpm --filter @aletheia/web test tests/seminary-module-viewer.test.tsx`
Expected: FAIL (componentes não encontrados).

- [ ] **Step 3: Implementar componentes e página no App Router**

1. `theological-lens-card.tsx`: Card contextual que exibe a confissão histórica da família ou comparativo ecumênico.
2. `seminary-module-viewer.tsx`: Grid de ciclos e disciplinas, leitor de ementas, bibliografia recomendada e temas de produção acadêmica.
3. `app/(dashboard)/curriculum/seminary/page.tsx`: Página montada dentro de `ProductShell`.
4. Atualizar dicionários i18n com termos do seminário.

- [ ] **Step 4: Executar testes e typecheck**

Run: `pnpm --filter @aletheia/web test tests/seminary-module-viewer.test.tsx`
Run: `pnpm --filter @aletheia/web typecheck`
Expected: PASS com 0 erros.

- [ ] **Step 5: Commit**

```bash
git add apps/web/
git commit -m "feat(web): add seminary module viewer, curriculum cycles, and confessional lens"
```

---

### Task 4: Fluxo de Submissão de Trabalhos & Rubrica Teológica (`apps/web`)

**Files:**
- Create: `apps/web/src/components/curriculum/seminary-paper-submission-modal.tsx`
- Create: `apps/web/src/components/curriculum/theology-rubric-evaluator.tsx`
- Create: `apps/web/tests/seminary-submission-rubric.test.tsx`

**Interfaces:**
- Consumes: `POST /api/v1/evidence-submissions`
- Consumes: `@aletheia/contracts` (`CreateEvidenceSubmissionSchema`, `SeminaryTheologyRubricSchema`)
- Produces: Modal de envio de resenha/ensaio/exegese e painel de avaliação analítica por rubrica para responsáveis/mentores.

- [ ] **Step 1: Escrever teste de falha para submissão e avaliação por rubrica**

Criar `apps/web/tests/seminary-submission-rubric.test.tsx`:
- Testar formulário de envio de trabalho com seleção do tipo de evidência (`THEOLOGICAL_ESSAY`, `EXEGESIS_PAPER`, etc.).
- Testar painel de avaliação com os 4 critérios da `THEOLOGY_ACADEMIC_RIGOR_RUBRIC`, cálculo de pontuação ponderada e promoção ao portfólio.

- [ ] **Step 2: Executar teste para verificar falha**

Run: `pnpm --filter @aletheia/web test tests/seminary-submission-rubric.test.tsx`
Expected: FAIL (componentes não encontrados).

- [ ] **Step 3: Implementar componentes de envio e avaliação**

1. `seminary-paper-submission-modal.tsx`: Modal acessível com upload/texto, disciplina vinculada e tipo de evidência acadêmica.
2. `theology-rubric-evaluator.tsx`: Painel interativo com os 4 níveis de domínio (1 a 4) para cada um dos 4 critérios, cálculo da nota final ponderada e checkbox "Incluir no Portfólio Teológico".

- [ ] **Step 4: Executar testes e typecheck**

Run: `pnpm --filter @aletheia/web test tests/seminary-submission-rubric.test.tsx`
Run: `pnpm --filter @aletheia/web typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/
git commit -m "feat(web): add seminary paper submission modal and theological rubric evaluator"
```

---

### Task 5: Visualização e Suporte no Backoffice (`apps/backoffice`)

**Files:**
- Modify: `apps/backoffice/src/components/catalog/admin-catalog.tsx`
- Create: `apps/backoffice/tests/seminary-catalog.test.tsx`

**Interfaces:**
- Consumes: `/api/v1/admin/curriculum-definitions/*`
- Produces: Suporte à visualização e auditoria das novas definições e do pacote de seminário no catálogo administrativo.

- [ ] **Step 1: Escrever teste de verificação no Backoffice**

Criar `apps/backoffice/tests/seminary-catalog.test.tsx`:
- Verificar se `AdminCatalog` permite inspecionar definições de tipo de evidência e rubricas contendo `THEOLOGY_ACADEMIC_RIGOR_RUBRIC` e tipos de seminário.

- [ ] **Step 2: Implementar ajustes no `AdminCatalog` do Backoffice**

Garantir que as novas categorias e metadados de seminário sejam exibidos com clareza na interface corporativa de governança.

- [ ] **Step 3: Executar testes e typecheck**

Run: `pnpm --filter @aletheia/backoffice test`
Run: `pnpm --filter @aletheia/backoffice typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/backoffice/
git commit -m "feat(backoffice): add seminary theology definitions support in admin catalog"
```

---

### Task 6: Verificação Global de Qualidade, Limites e Fechamento

**Files:**
- Modify: `docs/superpowers/specs/2026-09-27-advanced-theology-seminary-module-design.md` (registrar status concluído)

- [ ] **Step 1: Verificar limites arquiteturais**

Run: `pnpm check:boundaries`
Expected: 14/14 testes passando, 0 violações.

- [ ] **Step 2: Executar typecheck em todos os pacotes**

Run: `pnpm -r typecheck`
Expected: PASS sem erros.

- [ ] **Step 3: Executar linter em todos os pacotes**

Run: `pnpm -r --if-present lint`
Expected: PASS sem erros/avisos.

- [ ] **Step 4: Executar todas as suítes de teste de todos os pacotes**

Run: `pnpm -r test`
Expected: PASS em todos os pacotes (`contracts`, `api`, `web`, `backoffice`).

- [ ] **Step 5: Commit final e abertura de PR**

```bash
git add docs/
git commit -m "docs: finalize advanced theology seminary module specification and plan"
```
