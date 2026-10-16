# Hub Comunitário de Trocas em Família & Mural de Inspiração — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o compartilhamento comunitário em um subsistema de primeiro nível acessível diretamente pela navegação principal (`/community` / `/comunidade`), com um Mural de Inspiração Temático (natureza, leitura, oficinas, datas comemorativas), acervo semente acolhedor, publicação descomplicada em 1 passo e adoção em 1 clique com isolamento seguro no tenant da família.

**Architecture:** O subsistema é construído com arquitetura modular desacoplada: os contratos em `@aletheia/contracts` tipam os temas pedagógicos e a transferência anônima; o backend em `apps/api` preserva multitenancy estrito via cópias privadas; e a camada web em `apps/web` oferece uma experiência visual acolhedora com componentes nativos `@aletheia/ui`, suporte a i18n em 3 idiomas e navegação integrada no `ProductShell`.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.9, NestJS 11, Prisma, Zod, Vitest, `@aletheia/ui`.

**Spec:** `docs/superpowers/specs/2026-10-16-community-hub-inspiration-mural-design.md`

## Global Constraints

- ZERO trailers de atribuição de IA (`Co-Authored-By`, `Generated-By`, etc.) em commits ou comentários de código.
- Zero classes utilitárias de Tailwind no JSX de `@aletheia/web`; utilizar exclusivamente tokens CSS semânticos e componentes `@aletheia/ui`.
- Sintaxe de método para propriedades de função em interfaces (ex.: `onAdopt?(id: string): void;`).
- Compatibilidade estrita com `exactOptionalPropertyTypes: true`.
- Cobertura de 100.0% simétrica em `pt-BR`, `en-US` e `es-ES` auditada por `node scripts/audit-i18n-coverage.mjs`.
- Conformidade de fronteiras modulares verificada por `pnpm check:boundaries` (14/14 testes verdes).
- Compilação limpa com TypeScript 5.9 (`typecheck`).
- Windows PowerShell: nunca encapsular `CommandLine` com aspas externas no `run_command`.

---

### Task 1: Contratos e DTOs de Temas Comunitários (`packages/contracts`)

**Files:**
- Modify: `packages/contracts/src/community-activity.ts`
- Modify: `packages/contracts/src/community-activity.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export const communityIdeaThemeSchema = z.enum([
    'NATURE_STUDY',
    'LIVING_BOOKS',
    'HANDICRAFT',
    'SEASONAL_HISTORY',
    'FAMILY_PROJECTS',
  ]);
  export type CommunityIdeaTheme = z.infer<typeof communityIdeaThemeSchema>;

  export interface CommunityActivityMetadata {
    theme?: CommunityIdeaTheme | undefined;
    materials?: string[] | undefined;
    seasonalPeriod?: string | undefined;
    steps?: string[] | undefined;
    isSeed?: boolean | undefined;
    [key: string]: unknown;
  }
  ```

- [ ] **Step 1: Escrever teste com falha (RED) em `community-activity.test.ts`**

Adicionar validações para `communityIdeaThemeSchema` e propriedades temáticas no metadata da atividade comunitária:
```typescript
it('validates community idea themes and metadata payload', () => {
  expect(communityIdeaThemeSchema.parse('NATURE_STUDY')).toBe('NATURE_STUDY');
  expect(communityIdeaThemeSchema.parse('LIVING_BOOKS')).toBe('LIVING_BOOKS');
  expect(() => communityIdeaThemeSchema.parse('INVALID_THEME')).toThrow();

  const activity = communityActivityResponseSchema.parse({
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Diário da Natureza: Coleta de Folhas',
    description: 'Passeio no parque para desenhar folhas de outono.',
    ageMin: 5,
    ageMax: 10,
    estimatedDurationMinutes: 45,
    supervisionRequired: true,
    riskLevel: 'LOW',
    evidenceRequirementMode: 'PHOTO_REQUIRED',
    metadata: {
      theme: 'NATURE_STUDY',
      materials: ['Caderno sem pauta', 'Lápis de cor', 'Lupa'],
      isSeed: true,
    },
    createdAt: '2026-10-16T00:00:00.000Z',
    updatedAt: '2026-10-16T00:00:00.000Z',
  });
  expect(activity.name).toBe('Diário da Natureza: Coleta de Folhas');
});
```

- [ ] **Step 2: Executar teste para verificar falha (RED)**

Comando: `pnpm --filter @aletheia/contracts test src/community-activity.test.ts`  
Resultado esperado: FAIL indicando que `communityIdeaThemeSchema` não está definido.

- [ ] **Step 3: Implementar contratos em `packages/contracts/src/community-activity.ts`**

Exportar `communityIdeaThemeSchema`, `CommunityIdeaTheme` e tipagem de `CommunityActivityMetadata`.

- [ ] **Step 4: Compilar contratos e executar testes para verificar sucesso (GREEN)**

Comando: `pnpm --filter @aletheia/contracts build && pnpm --filter @aletheia/contracts test src/community-activity.test.ts`  
Resultado esperado: PASS (todos os testes verdes).

- [ ] **Step 5: Commit das alterações**

```bash
git add packages/contracts/src/community-activity.ts packages/contracts/src/community-activity.test.ts
git commit -m "feat(contracts): define community idea themes and metadata schemas"
```

---

### Task 2: Dicionários de Internacionalização i18n (`apps/web`)

**Files:**
- Create: `apps/web/src/lib/i18n/dictionaries/pt-BR/community.ts`
- Create: `apps/web/src/lib/i18n/dictionaries/en-US/community.ts`
- Create: `apps/web/src/lib/i18n/dictionaries/es-ES/community.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/nav.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/index.ts`
- Modify: `apps/web/tests/i18n.test.tsx`

**Interfaces:**
- Produces: Chaves `nav.community` e namespace `community.*` com 100% de simetria de tokens e chaves.

- [ ] **Step 1: Escrever teste com falha (RED) em `apps/web/tests/i18n.test.tsx`**

Testar a presença e simetria de `nav.community` e das chaves principais do mural comunitário:
```typescript
it('provides symmetric community hub keys across all supported locales', () => {
  for (const locale of ['pt-BR', 'en-US', 'es-ES'] as const) {
    const dict = getDictionary(locale);
    expect(dict.nav.community).toBeDefined();
    expect(dict.community.hub.title).toBeDefined();
    expect(dict.community.themes.natureStudy).toBeDefined();
    expect(dict.community.themes.livingBooks).toBeDefined();
    expect(dict.community.themes.handicraft).toBeDefined();
    expect(dict.community.themes.seasonalHistory).toBeDefined();
    expect(dict.community.themes.familyProjects).toBeDefined();
    expect(dict.community.card.adoptBtn).toBeDefined();
    expect(dict.community.shareModal.title).toBeDefined();
  }
});
```

- [ ] **Step 2: Executar teste para verificar falha (RED)**

Comando: `pnpm --filter @aletheia/web test tests/i18n.test.tsx`  
Resultado esperado: FAIL com erro de propriedade indefinida `nav.community` / `community`.

- [ ] **Step 3: Criar e registrar dicionários nos 3 idiomas**

Criar `community.ts` em `pt-BR`, `en-US` e `es-ES` contendo:
- `hub.title`: "Mural de Inspiração Comunitária" / "Community Inspiration Board" / "Mural de Inspiración Comunitaria"
- `hub.subtitle`: descrição acolhedora da cooperação entre famílias
- `hub.searchPlaceholder`: busca por título ou materiais
- `themes`: nomes e descrições dos pilares pedagógicos
- `card`: "Adotar para a Nossa Família", tempo estimado, materiais
- `shareModal`: títulos, passos, campos e aviso legal de anonimato
- `adoptModal`: confirmação, seleção opcional de educando e agendamento
Registrar `community` no `index.ts` de cada idioma e `community: 'Comunidade'` em `nav.ts`.

- [ ] **Step 4: Executar testes de i18n e auditoria de paridade (GREEN)**

Comando: `pnpm --filter @aletheia/web test tests/i18n.test.tsx && node scripts/audit-i18n-coverage.mjs`  
Resultado esperado: PASS com 100.0% de cobertura e 0 chaves pendentes.

- [ ] **Step 5: Commit das alterações**

```bash
git add apps/web/src/lib/i18n/dictionaries/ apps/web/tests/i18n.test.tsx
git commit -m "feat(i18n): dictionaries for community inspiration hub in pt-BR, en-US and es-ES"
```

---

### Task 3: Acervo Semente e Componente `CommunityIdeaCard` (`apps/web`)

**Files:**
- Create: `apps/web/src/components/community/seed-ideas-data.ts`
- Create: `apps/web/src/components/community/community-idea-card.tsx`
- Create: `apps/web/tests/community-idea-card.test.tsx`

**Interfaces:**
- Produces:
  ```typescript
  export interface CommunityIdeaCardProps {
    idea: CommunityActivityResponseDto;
    isAdopting?: boolean | undefined;
    onAdopt?(idea: CommunityActivityResponseDto): void;
  }
  ```

- [ ] **Step 1: Escrever teste com falha (RED) em `community-idea-card.test.tsx`**

```typescript
it('renders idea card with title, theme badge, duration, materials and triggers adopt', () => {
  const onAdopt = vi.fn();
  render(
    <CommunityIdeaCard
      idea={mockIdea}
      onAdopt={onAdopt}
    />
  );
  expect(screen.getByText('Observação de Pássaros no Quintal')).toBeInTheDocument();
  expect(screen.getByText(/30 min/i)).toBeInTheDocument();
  expect(screen.getByText(/Caderno de campo/i)).toBeInTheDocument();
  
  const adoptBtn = screen.getByRole('button', { name: /adotar/i });
  fireEvent.click(adoptBtn);
  expect(onAdopt).toHaveBeenCalledWith(mockIdea);
});
```

- [ ] **Step 2: Executar teste para verificar falha (RED)**

Comando: `pnpm --filter @aletheia/web test tests/community-idea-card.test.tsx`  
Resultado esperado: FAIL com módulo não encontrado.

- [ ] **Step 3: Implementar `seed-ideas-data.ts` e `community-idea-card.tsx`**

1. `seed-ideas-data.ts`: lista de 10 ideias clássicas e vivas (estudo de folhas, leitura de crônicas, oficina de massinha caseira, observação da lua, linha do tempo histórica).
2. `community-idea-card.tsx`: card usando `Card`, `Badge`, `Button`, `AletheiaIcon` com visual acolhedor, tags temáticas com cores da paleta Trinity/Aletheia (`var(--forest)`, `var(--sage)`, `var(--gold)`), lista compacta de materiais e botão com feedback de loading.

- [ ] **Step 4: Executar testes para verificar sucesso (GREEN)**

Comando: `pnpm --filter @aletheia/web test tests/community-idea-card.test.tsx`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit das alterações**

```bash
git add apps/web/src/components/community/ apps/web/tests/community-idea-card.test.tsx
git commit -m "feat(web): community idea card and curated initial seed catalog"
```

---

### Task 4: Modais de Publicação e Adoção em 1 Passo (`apps/web`)

**Files:**
- Create: `apps/web/src/components/community/share-idea-modal.tsx`
- Create: `apps/web/src/components/community/adopt-idea-modal.tsx`
- Create: `apps/web/tests/community-modals.test.tsx`

**Interfaces:**
- Produces:
  ```typescript
  export interface ShareIdeaModalProps {
    isOpen: boolean;
    familyId: string;
    onClose(): void;
    onSuccess(): void;
  }

  export interface AdoptIdeaModalProps {
    idea: CommunityActivityResponseDto | null;
    isOpen: boolean;
    learners?: Array<{ id: string; name: string }>;
    onClose(): void;
    onConfirm(learnerId?: string, targetDate?: string): Promise<void> | void;
  }
  ```

- [ ] **Step 1: Escrever teste com falha (RED) em `community-modals.test.tsx`**

Testar preenchimento e submissão com aviso de anonimato no `ShareIdeaModal`, e confirmação com escolha de educando no `AdoptIdeaModal`.

- [ ] **Step 2: Executar teste para verificar falha (RED)**

Comando: `pnpm --filter @aletheia/web test tests/community-modals.test.tsx`  
Resultado esperado: FAIL com módulos ausentes.

- [ ] **Step 3: Implementar `share-idea-modal.tsx` e `adopt-idea-modal.tsx`**

1. `share-idea-modal.tsx`: modal utilizando `Modal`, `Input`, `Select`, `Textarea` do Design System, validação de campos obrigatórios e banner visual de anonimato/privacidade (`AletheiaIcon name="shield-check"`).
2. `adopt-idea-modal.tsx`: modal rápido confirmando a adoção privada, seletor opcional de educando e data para agendamento.

- [ ] **Step 4: Executar testes para verificar sucesso (GREEN)**

Comando: `pnpm --filter @aletheia/web test tests/community-modals.test.tsx`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit das alterações**

```bash
git add apps/web/src/components/community/ apps/web/tests/community-modals.test.tsx
git commit -m "feat(web): 1-step share and adoption modals for community activities"
```

---

### Task 5: Mural de Inspiração e View Principal `CommunityHubView` (`apps/web`)

**Files:**
- Create: `apps/web/src/components/community/inspiration-mural.tsx`
- Create: `apps/web/src/components/community/community-hub-view.tsx`
- Create: `apps/web/src/components/community/index.ts`
- Create: `apps/web/tests/community-hub.test.tsx`

**Interfaces:**
- Produces:
  ```typescript
  export interface CommunityHubViewProps {
    familyId: string;
    learners?: Array<{ id: string; name: string }>;
  }
  ```

- [ ] **Step 1: Escrever teste com falha (RED) em `community-hub.test.tsx`**

Testar busca textual em tempo real, alternância entre abas temáticas (Natureza, Leitura, Oficinas), renderização combinada de sementes e ideias de API, e abertura dos modais.

- [ ] **Step 2: Executar teste para verificar falha (RED)**

Comando: `pnpm --filter @aletheia/web test tests/community-hub.test.tsx`  
Resultado esperado: FAIL.

- [ ] **Step 3: Implementar `inspiration-mural.tsx`, `community-hub-view.tsx` e `index.ts`**

1. `inspiration-mural.tsx`: grid responsivo CSS com chips de filtro temático e contadores dinâmicos.
2. `community-hub-view.tsx`: busca textual, integração com `GET /api/v1/curriculum/community-activities`, junção com o catálogo semente sem duplicação de IDs, e orquestração de estados de erro/loading/adoção.
3. `index.ts`: exportação limpa dos componentes.

- [ ] **Step 4: Executar testes para verificar sucesso (GREEN)**

Comando: `pnpm --filter @aletheia/web test tests/community-hub.test.tsx`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit das alterações**

```bash
git add apps/web/src/components/community/ apps/web/tests/community-hub.test.tsx
git commit -m "feat(web): inspiration mural and community hub view orchestration"
```

---

### Task 6: Rota `/community` e Integração no Shell de Navegação (`apps/web`)

**Files:**
- Create: `apps/web/app/(dashboard)/community/page.tsx`
- Modify: `apps/web/next.config.ts`
- Modify: `apps/web/src/components/layout/product-shell.tsx`
- Modify: `apps/web/tests/product-shell.test.tsx`
- Create: `apps/web/tests/community-page.test.tsx`

**Interfaces:**
- Consumes: `CommunityHubView` de `src/components/community/`
- Produces: Rota pública `/community` acessível via menu lateral e tab bar mobile.

- [ ] **Step 1: Escrever teste com falha (RED) em `product-shell.test.tsx` e `community-page.test.tsx`**

Assert que `nav.community` é renderizado nos landmarks do `ProductShell` e que a página `/community` monta a view autenticada.

- [ ] **Step 2: Executar teste para verificar falha (RED)**

Comando: `pnpm --filter @aletheia/web test tests/product-shell.test.tsx tests/community-page.test.tsx`  
Resultado esperado: FAIL.

- [ ] **Step 3: Implementar rota e atualizar `ProductShell` e `next.config.ts`**

1. Inserir `{ id: 'community', label: 'nav.community', href: '/community', icon: <AletheiaIcon name="sparkles" size={18} /> }` em `MAIN_NAV_ITEMS` e `PRIORITY_NAV_ITEM_IDS` no `ProductShell`.
2. Adicionar rewrite `/comunidade` ➔ `/community` em `apps/web/next.config.ts`.
3. Criar `apps/web/app/(dashboard)/community/page.tsx` com resolução segura de contexto de família e educandos.

- [ ] **Step 4: Executar suítes de teste de integração (GREEN)**

Comando: `pnpm --filter @aletheia/web test tests/product-shell.test.tsx tests/community-page.test.tsx`  
Resultado esperado: PASS.

- [ ] **Step 5: Executar todas as validações de integridade**

Executar a bateria completa de qualidade:
```powershell
pnpm check:boundaries
node scripts/audit-i18n-coverage.mjs
pnpm --filter @aletheia/contracts test
pnpm --filter @aletheia/web test
pnpm --filter @aletheia/web typecheck
```

- [ ] **Step 6: Commit final da integração**

```bash
git add apps/web/app/(dashboard)/community/page.tsx apps/web/next.config.ts apps/web/src/components/layout/product-shell.tsx apps/web/tests/
git commit -m "feat(web): integrate community inspiration hub route and navigation landmarks"
```
