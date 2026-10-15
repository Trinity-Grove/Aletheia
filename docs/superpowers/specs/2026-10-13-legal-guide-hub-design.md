# Especificação Técnica: Hub "Por Onde Começar" & Amparo Legal (ALET-B06)

**Data:** 13 de Outubro de 2026  
**Status:** Aprovado  
**Issue de Referência:** [#290 (ALET-B06)](https://github.com/Trinity-Grove/Aletheia/issues/290)

---

## 1. Contexto e Objetivos

Durante a rodada de validação com famílias praticantes e iniciantes no ensino domiciliar, identificou-se uma insegurança jurídica recorrente: pais sentem receio de notificações de órgãos públicos (ex: Conselho Tutelar, Ministério Público), não compreendem a jurisprudência brasileira (decisão do STF no RE 888.815) e não sabem quais são os passos práticos essenciais nos primeiros 30 dias para proteger sua família.

O objetivo desta funcionalidade é fornecer um **Hub de Amparo Legal e Primeiros Passos** no Aletheia, que:
1. Desmistifique os direitos constitucionais e as metas legais vigentes (dias e horas letivas da LDB).
2. Ensine como o portfólio de evidências e os registros diários constituem prova material contra alegações de abandono intelectual.
3. Disponibilize um **Checklist Interativo dos Primeiros 30 Dias** com passos práticos e links diretos de ação.
4. Integre a consulta de requisitos da jurisdição ativa da família via API e ofereça botão direto para a emissão do **Dossiê Preventivo Anual** em `/reports`.

---

## 2. Contratos & Modelo de Dados (`@aletheia/contracts`)

### 2.1 Novo DTO de Resposta: `FamilyJurisdictionResponseDto`

Adicionado em `packages/contracts/src/modules/jurisdictions/` ou `packages/contracts/src/index.ts`:

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

---

## 3. Backend (`apps/api`)

### 3.1 Novo Endpoint: `GET /api/v1/families/:familyId/jurisdiction`

* **Controller:** Integrado no módulo de `jurisdictions` ou `family-settings`.
* **Guards:** `JwtAuthGuard`, `ActiveFamilyMemberGuard`.
* **Fluxo de Execução:**
  1. Verifica se a família possui uma jurisdição associada em suas configurações ou registros de conformidade.
  2. Localiza a `JurisdictionDefinition` ativa (padrão `BR` versão 1 publicada se nenhuma outra estiver configurada).
  3. Mapeia e retorna `FamilyJurisdictionResponseDto` com as metas mínimas (ex: 200 dias, 800 horas), fonte legal oficial e resumo da fundamentação.
* **Resiliência:** Se a jurisdição específica não estiver no banco, devolve fallback estruturado do Brasil com código HTTP 200, sem quebrar a tela.

---

## 4. Frontend (`apps/web`)

### 4.1 Navegação & Roteamento

1. **Item de Navegação Principal:**
   - Em `apps/web/src/components/layout/product-shell.tsx`, adiciona-se ao array `MAIN_NAV_ITEMS`:
     ```typescript
     {
       id: 'legal-guide',
       label: 'nav.legalGuide',
       href: '/legal-guide',
       icon: <AletheiaIcon name="shield-check" size={18} />
     }
     ```
   - Adicionado a `PRIORITY_NAV_ITEM_IDS` logo após `reports`.
2. **Rewrite de URL Amigável:**
   - Em `next.config.mjs`, adiciona-se rewrite de `/guia-legal` para `/legal-guide`.

### 4.2 Página & Componentes (`apps/web/src/components/legal-guide/`)

* **`<LegalGuideView>`:**
  - Carrega os dados da jurisdição ativa via `GET /api/v1/families/:familyId/jurisdiction`.
  - Apresenta cabeçalho acolhedor com título, subtítulo e indicador de jurisdição ativa.
* **`<LegalFrameworkCard>` (Seus Direitos):**
  - Explica os fundamentos jurídicos: Constituição Federal (art. 226 e 229), jurisprudência do STF (RE 888.815), e dever primário da família na educação.
  - Exibe metas oficiais: Dias Letivos Mínimos (200 dias) e Horas Anuais (800h).
* **`<EvidenceProtectionGuide>` (Proteção por Evidências):**
  - Explica o valor probatório de diários, fotos, relatórios e avaliações.
  - Botão de ação direta: *"Emitir Dossiê de Conformidade"* (`/reports`), permitindo gerar o relatório anual em PDF com hash de verificação.
* **`<First30DaysChecklistCard>` (Checklist dos Primeiros 30 Dias):**
  - 6 passos práticos essenciais:
    1. Cadastrar seu primeiro educando (`/learners`)
    2. Definir o perfil pedagógico ou grade curricular (`/curriculum`)
    3. Montar o cronograma semanal de estudos (`/schedule`)
    4. Concluir a 1ª atividade com registro de evidência ou diário (`/records`)
    5. Estabelecer o momento devocional diário (`/devotional`)
    6. Visualizar a prévia do relatório de aprendizagem (`/reports`)
  - Checkboxes interativos com persistência no `localStorage` (`aletheia_checklist_30days_${familyId}`).
  - Auto-detecção inteligente de passos já cumpridos na conta.
  - Barra de progresso visual (ex: "3 de 6 etapas concluídas").
* **`<LegalFaqAccordion>` (Perguntas Frequentes):**
  - Acordeão com 4 perguntas centrais:
    1. O homeschooling é crime no Brasil?
    2. O que fazer caso receba notificação do Conselho Tutelar?
    3. Como comprovar a instrução pedagógica em caso de fiscalização?
    4. O educando pode retornar à escola regular no futuro?

---

## 5. Internacionalização (i18n)

* Novos dicionários dedicados:
  - `apps/web/src/lib/i18n/dictionaries/pt-BR/legal-guide.ts`
  - `apps/web/src/lib/i18n/dictionaries/en-US/legal-guide.ts`
  - `apps/web/src/lib/i18n/dictionaries/es-ES/legal-guide.ts`
* Chaves registradas nos dicionários principais:
  - `nav.legalGuide` em `navigation.ts`
  - `legalGuide.*` em `legal-guide.ts`
* 100% de paridade simétrica de chaves e variáveis semânticas.
* 0 strings em texto fixo (aprovado no scanner `audit-i18n-coverage.mjs`).

---

## 6. Estratégia de Testes

1. **Contratos e API:**
   - Teste unitário do serviço e controller de jurisdição da família (`jurisdiction-definitions.service.spec.ts`).
2. **Web / UI:**
   - Testes unitários do `<LegalGuideView>`, `<First30DaysChecklistCard>`, `<LegalFrameworkCard>` em `apps/web/tests/legal-guide.test.tsx`.
   - Teste de navegação no `ProductShell` (`apps/web/tests/product-shell.test.tsx`).
   - Teste de internacionalização (`apps/web/tests/i18n.test.tsx`).
3. **Controle de Qualidade:**
   - Scanner estático i18n: 100.0% de cobertura.
   - Limites modulares: 14/14 testes verdes (`pnpm check:boundaries`).
   - Tipagem TypeScript 5.9 estrita (`pnpm typecheck`).
