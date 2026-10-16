# Hub Comunitário de Trocas em Família & Mural de Inspiração — Especificação Técnica

**Data:** 16 de Outubro de 2026  
**Status:** Aprovado para Planejamento  
**Escopo:** `apps/web`, `packages/contracts`, `apps/api`

---

## 1. Contexto e Motivação

O Aletheia apoia famílias que educam seus filhos de forma personalizada. No entanto, muitas famílias enfrentam momentos de isolamento ou cansaço criativo na rotina diária de planejamento de lições e atividades extracurriculares.

Anteriormente, o compartilhamento comunitário (ALET-B09) estava restrito a uma aba aninhada em `/curriculum/activities`. Essa posição escondia a capacidade de colaboração mútua e tornava o processo de troca pouco intuitivo.

Esta especificação define o **Hub Comunitário de Trocas em Família & Mural de Inspiração** como um **subsistema de primeiro nível** acessível diretamente pelo menu principal, combinando:
1. Um **Mural de Inspiração Temático** com ideias vivas (estudo da natureza, leitura em voz alta, oficinas manuais, datas comemorativas e projetos familiares).
2. Uma **curadoria semente inicial** para que famílias recém-chegadas nunca encontrem o mural vazio.
3. Fluxo de **Publicação Descomplicada em 1 Passo** ("Compartilhar uma Ideia").
4. Fluxo de **Adoção em 1 Clique** ("Usar na Nossa Família") que cria uma cópia privada e editável no tenant da família, pronta para inclusão na agenda semanal.
5. Garantia rigorosa de **privacidade familiar e conformidade com a LGPD** (anonimização estrita, sem exposição de nomes de crianças, pais ou identificadores internos).

---

## 2. Requisitos de Usuário e Negócio

### 2.1 Requisitos Funcionais (RF)
* **RF-01 (Navegação de Primeiro Nível):** Exibir "Comunidade" (`nav.community`) na barra de navegação principal (`ProductShell`) na desktop sidebar e na tab-bar mobile responsiva, apontando para `/community`.
* **RF-02 (Rota e URL Amigável):** Disponibilizar a rota `/community` e o rewrite em português `/comunidade` no Next.js.
* **RF-03 (Mural de Inspiração Temático):** Agrupar ideias por pilares pedagógicos acolhedores:
  - 🌿 *Estudos da Natureza & Ar Livre* (`NATURE_STUDY`)
  - 📚 *Leitura em Voz Alta & Literatura Viva* (`LIVING_BOOKS`)
  - 🛠️ *Oficinas Manuais & Projetos Práticos* (`HANDICRAFT`)
  - ⏳ *Datas Históricas & Épocas do Ano* (`SEASONAL_HISTORY`)
  - ✨ *Todas as Ideias* (`ALL`)
* **RF-04 (Curadoria Semente Híbrida):** Incluir ideias atemporais na inicialização para que o espaço ofereça valor imediato antes mesmo de postagens comunitárias em larga escala.
* **RF-05 (Filtro e Busca Instantânea):** Permitir filtrar ideias por texto (título/materiais) e faixa etária recomendada (ex.: Anos Iniciais, Ensino Fundamental).
* **RF-06 (Card de Ideia Inspiradora):** Apresentar título, faixa etária recomendada, tempo estimado, materiais caseiros necessários, resumo do passo a passo e botão de ação primária.
* **RF-07 (Adoção em 1 Clique):** Ao clicar em "Adotar para a Nossa Família", a API clona a atividade para o tenant da família ativa com `visibility: PRIVATE`. A interface oferece feedback imediato e permite opcionalmente vincular ao educando ou agendar para a semana.
* **RF-08 (Publicação Descomplicada):** Botão "Compartilhar uma Ideia" abre modal simplificado em 1 passo com título, pilar temático, faixa etária, materiais simples, breve passo a passo e consentimento explícito de anonimização.
* **RF-09 (Salvaguarda de Privacidade):** Nenhum dado de família (`familyId`, sobrenomes, endereços, fotos de crianças) é exposto na API pública da comunidade.

### 2.2 Requisitos Não-Funcionais (RNF)
* **RNF-01 (Design System & Tokens):** 100% estilizado com tokens semânticos e componentes `@aletheia/ui` (Zero Tailwind utility classes no JSX).
* **RNF-02 (Internacionalização):** Cobertura de 100.0% simétrica em `pt-BR`, `en-US` e `es-ES` auditada por `scripts/audit-i18n-coverage.mjs`.
* **RNF-03 (Fronteiras Modulares):** Conformidade rigorosa com `pnpm check:boundaries` (14/14 testes verdes).
* **RNF-04 (Isolamento Multitenant):** A família adotante nunca possui referências que permitam alterar os dados da família que publicou a ideia.

---

## 3. Arquitetura e Estrutura de Componentes

### 3.1 Frontend (`apps/web`)

```
apps/web/
├── app/(dashboard)/
│   └── community/
│       └── page.tsx                      # Rota principal do subsistema
├── src/
│   └── components/
│       ├── layout/
│       │   └── product-shell.tsx         # Adição de 'community' na navegação
│       └── community/
│           ├── index.ts                  # Exportações públicas do subsistema
│           ├── community-hub-view.tsx    # Container com busca, abas temáticas e orquestração
│           ├── inspiration-mural.tsx     # Grid responsivo de cards temáticos
│           ├── community-idea-card.tsx   # Card com tema, tempo, materiais e CTA de adoção
│           ├── share-idea-modal.tsx      # Modal de publicação simplificada em 1 passo
│           ├── adopt-idea-modal.tsx      # Modal rápido de confirmação e agendamento
│           └── seed-ideas-data.ts        # Acervo semente curado de ideias práticas
└── tests/
    ├── community-hub.test.tsx            # Testes unitários de renderização, busca e abas
    └── community-adopt.test.tsx          # Testes de adoção e publicação com mocks
```

### 3.2 Contratos (`packages/contracts`)
Reaproveitamento e consolidação do schema já existente `communityActivityResponseSchema` em `packages/contracts/src/community-activity.ts` e inclusão de metadados de pilares temáticos:
```typescript
export type CommunityIdeaTheme =
  | 'NATURE_STUDY'
  | 'LIVING_BOOKS'
  | 'HANDICRAFT'
  | 'SEASONAL_HISTORY'
  | 'FAMILY_PROJECTS';
```

### 3.3 Backend (`apps/api`)
Consolidação dos endpoints sob o controller já testado em `apps/api/src/modules/curriculum/presentation/community-activity.controller.ts`:
* `GET /api/v1/curriculum/community-activities` — Listagem anônima de atividades públicas.
* `POST /api/v1/curriculum/community-activities/:id/adopt` — Adoção transacional gerando cópia privada no tenant da família autenticada.
* `POST /api/v1/families/:familyId/activities` com `visibility: 'PUBLIC'` — Publicação instantânea de nova ideia.

---

## 4. Design de Interface e Experiência do Usuário

### 4.1 Cabeçalho e Descoberta
O topo de `/community` recebe um banner acolhedor com a identidade visual do Aletheia:
* Título: *"Mural de Inspiração Comunitária"*
* Subtítulo: *"Práticas, leituras e ideias pedagógicas compartilhadas entre famílias para enriquecer sua semana."*
* Ações:
  - Input de busca textual com ícone de lupa: filtra por nome, materiais caseiros ou palavras-chave.
  - Seletor de Faixa Etária: Todas, 3-6 anos, 7-10 anos, 11-14 anos, 15+ anos.
  - Botão Primário: **"Compartilhar uma Ideia"** com ícone `plus-circle`.

### 4.2 Abas / Chips do Mural de Inspiração
Menu horizontal de seleção rápida com contadores de ideias:
- `✨ Todas as Ideias`
- `🌿 Estudos da Natureza`
- `📚 Leitura & Literatura Viva`
- `🛠️ Oficinas & Projetos Manuais`
- `⏳ História & Épocas do Ano`

### 4.3 Card da Ideia (`CommunityIdeaCard`)
Projetado para leitura rápida e prática:
- **Badge de Categoria:** Cor e ícone característicos do tema.
- **Título & Resumo:** Descrição clara da atividade em linguagem natural de pais para pais.
- **Indicadores:** Duração estimada (ex.: 30 min) e nível de supervisão recomendada.
- **Lista de Materiais:** Itens comuns de fácil acesso doméstico.
- **Botão de Ação:** *"Adotar para a Nossa Família"* (secundário ou primário suave).

### 4.4 Modais
* **`ShareIdeaModal`:** Formulário focado e acolhedor, com validação de campos obrigatórios e confirmação visual de anonimato.
* **`AdoptIdeaModal`:** Ao clicar em Adotar, a família pode escolher para qual educando deseja registrar a atividade e em qual dia da semana pretende executá-la, ou simplesmente guardá-la no seu banco de atividades privadas.

---

## 5. Dicionários de Internacionalização (i18n)

Serão adicionadas chaves simétricas nos dicionários `pt-BR`, `en-US` e `es-ES`:
* `nav.community`: *"Comunidade"* / *"Community"* / *"Comunidad"*
* `community.hub.title`: Título do Hub
* `community.hub.subtitle`: Subtítulo acolhedor
* `community.hub.searchPlaceholder`: Placeholder da busca
* `community.themes.*`: Nomes e descrições dos pilares temáticos
* `community.card.materials`: Rótulo de materiais
* `community.card.adoptBtn`: *"Adotar para Nossa Família"*
* `community.shareModal.*`: Títulos, rótulos e aviso de privacidade do modal de publicação
* `community.adoptModal.*`: Textos de sucesso e seleção de educando

---

## 6. Estratégia de Testes Automatizados (TDD)

1. **Testes Unitários de Componentes (`@aletheia/web/tests/community-hub.test.tsx`):**
   - Renderização inicial do Mural com os cards semente e dados da API.
   - Filtro por pilar temático (exibir apenas Natureza ao selecionar a aba correspondente).
   - Busca em tempo real filtrando cards por título e materiais.
   - Estado vazio quando não houver correspondência com botão para limpar filtros.
2. **Testes de Fluxo de Adoção e Publicação (`@aletheia/web/tests/community-adopt.test.tsx`):**
   - Disparo da mutação de adoção ao confirmar o modal, verificando a criação da cópia privada.
   - Submissão de nova ideia pelo formulário com validação de payload anônimo.
3. **Navegação (`@aletheia/web/tests/product-shell.test.tsx`):**
   - Presença da rota `/community` no menu lateral e na barra inferior mobile.
4. **Governança:**
   - 100% de paridade no scanner `node scripts/audit-i18n-coverage.mjs`.
   - Limites de importação intocados em `pnpm check:boundaries` (14/14).
   - Compilação estrita em `pnpm --filter @aletheia/web typecheck`.
