# Plano de implementação — ALET-B09 Hub Comunitário

## Objetivo

Completar o B09 sobre a base de atividades comunitárias já existente, adicionando materiais didáticos, planos de aula e cronogramas como recursos familiares públicos/privados, com adoção transacional em cópia privada e isolamento comprovado entre famílias.

## Regras de execução

- Trabalhar somente em `.worktrees/alet-290-community-learning-hub`.
- Seguir TDD: escrever o teste que falha antes da implementação de cada unidade.
- Não alterar o comportamento de `FamilyActivity` nem do catálogo oficial de `CurriculumPack` sem teste específico.
- Não aceitar no payload público IDs de família, usuário, aluno, ano letivo, disciplina ou registros privados.
- Não adicionar classes Tailwind no JSX do frontend.
- Adicionar textos simultaneamente em `pt-BR`, `en-US` e `es-ES`.
- Fazer commits pequenos, sem trailers de IA, ao final de cada tarefa concluída.

## Tarefa 1 — Contratos discriminados e limites de payload

Arquivos prováveis:

- `packages/contracts/src/family-learning-resource.ts` (novo);
- `packages/contracts/src/index.ts`;
- `packages/contracts/src/family-learning-resource.test.ts` (novo).

RED:

- testar os três tipos (`MATERIAL`, `LESSON_PLAN`, `CHRONOGRAM`);
- rejeitar tipo desconhecido, conteúdo ausente, campos privados e payload acima dos limites;
- aceitar somente links HTTP/HTTPS quando houver URL;
- garantir que a resposta comunitária não contenha `familyId` ou origem.

Implementação:

- criar enum/schema de tipo e visibilidade;
- criar schemas de conteúdo discriminados e schemas de create/update/list/adopt;
- exportar tipos inferidos pelo índice de contratos;
- usar nomes de métodos em interfaces de props quando os contratos forem consumidos pelo frontend.

Verificação:

```text
pnpm --filter @aletheia/contracts test -- family-learning-resource.test.ts
pnpm --filter @aletheia/contracts typecheck
```

Commit: `feat: add B09 learning resource contracts`.

## Tarefa 2 — Persistência e migração segura

Arquivos prováveis:

- `apps/api/prisma/schema.prisma`;
- `apps/api/prisma/migrations/<timestamp>_add_family_learning_resources/migration.sql`;
- `apps/api/src/modules/curriculum/infrastructure/family-learning-resource.repository.ts` (novo);
- `apps/api/src/modules/curriculum/infrastructure/family-learning-resource.repository.spec.ts` (novo).

RED:

- testar criação privada por família;
- testar listagem pública sem família autora;
- testar consulta privada somente por `familyId`;
- testar adoção em transação e preservação da origem;
- testar que despublicar não remove cópias adotadas.

Implementação:

- adicionar enum/model `FamilyLearningResource`, índices por família/visibilidade/tipo e FK em `Family`;
- usar JSONB somente para conteúdo já validado no contrato;
- repository deve filtrar por família no próprio `where`, nunca confiar apenas no controller;
- `adoptPublic` deve reler a origem com `visibility: PUBLIC`, copiar apenas campos permitidos e forçar `PRIVATE`;
- registrar origem interna sem devolvê-la em DTO comunitário;
- gerar migration SQL reversível e preservar tabelas existentes.

Verificação:

```text
pnpm --filter @aletheia/api prisma:generate
pnpm --filter @aletheia/api test -- family-learning-resource.repository.spec.ts --runInBand
```

Commit: `feat: persist family learning resources`.

## Tarefa 3 — Serviço, controller e autorização da API

Arquivos prováveis:

- `apps/api/src/modules/curriculum/application/family-learning-resource.service.ts` (novo);
- `apps/api/src/modules/curriculum/application/family-learning-resource.service.spec.ts` (novo);
- `apps/api/src/modules/curriculum/presentation/family-learning-resource.controller.ts` (novo);
- `apps/api/src/modules/curriculum/presentation/family-learning-resource.controller.spec.ts` (novo);
- `apps/api/src/modules/curriculum/curriculum.module.ts`.

RED:

- criar sempre inicia privado;
- operações familiares rejeitam família diferente;
- GET comunitário retorna somente públicos e remove identidade;
- GET por ID privado de outra família responde como não encontrado;
- adoção privada/ID inexistente falha;
- adoção pública retorna recurso privado independente;
- update com conteúdo inválido não alcança o repository.

Implementação:

- expor os endpoints definidos na spec;
- proteger endpoints com `JwtAuthGuard` e `FamilyTenantGuard`;
- aplicar `ZodValidationPipe` aos corpos e query params;
- mapear datas para ISO e converter JSON para DTOs sem campos internos;
- usar mensagens de erro estáveis para o frontend;
- registrar repository, service e controller no `CurriculumModule`.

Verificação:

```text
pnpm --filter @aletheia/api test -- family-learning-resource.service.spec.ts family-learning-resource.controller.spec.ts --runInBand
pnpm --filter @aletheia/api typecheck
```

Commit: `feat: expose B09 community resource API`.

## Tarefa 4 — UI do hub comunitário

Arquivos prováveis:

- `apps/web/app/(dashboard)/curriculum/community/page.tsx` (novo);
- `apps/web/src/components/curriculum/community-learning-resources-gallery.tsx` (novo);
- `apps/web/src/components/curriculum/community-learning-resource-modal.tsx` (novo);
- `apps/web/tests/community-learning-resources-gallery.test.tsx` (novo);
- `apps/web/src/lib/i18n/dictionaries/pt-BR.ts`;
- `apps/web/src/lib/i18n/dictionaries/en-US.ts`;
- `apps/web/src/lib/i18n/dictionaries/es-ES.ts`;
- `apps/web/app/globals.css` somente se necessário para BEM responsivo.

RED:

- renderizar tabs “Meus recursos”/“Explorar comunidade”;
- renderizar estados loading, vazio, erro/retry e sucesso;
- abrir formulário para cada tipo e validar campos amigavelmente;
- publicar/despublicar/excluir recurso próprio;
- adotar recurso público e mostrar a cópia em “Meus recursos” com selo privado;
- confirmar por texto que adoção cria cópia independente;
- verificar que nenhum texto visível fica hardcoded.

Implementação:

- seguir o padrão de fetch e `AbortController` já usado em `FamilyActivitiesGallery`;
- manter ações idempotentes no estado local e evitar duplo submit;
- usar `Card`, `Button`, `Alert`, `Badge`/componentes equivalentes de `@aletheia/ui`;
- usar classes BEM e tokens CSS, com grid que colapse no mobile;
- manter acessibilidade: labels associados, foco no modal, `aria-pressed`, mensagens de erro associadas;
- inserir link “Planos e materiais da comunidade” na página de atividades sem remover a navegação atual.

Verificação:

```text
pnpm --filter @aletheia/web test -- community-learning-resources-gallery.test.tsx
pnpm --filter @aletheia/web typecheck
pnpm audit:i18n
```

Commit: `feat: add B09 community learning hub`.

## Tarefa 5 — Integração e testes de isolamento

Arquivos prováveis:

- `apps/api/test/community-learning-resource.integration-spec.ts` (novo);
- testes existentes de atividades, currículo e dashboard, apenas quando a integração exigir ajuste;
- documentação/fixture mínima de teste, se necessária.

RED:

- família A publica recurso e família B o encontra;
- família B adota e recebe cópia privada;
- família A não consegue ler, editar ou excluir o recurso privado de B;
- retirar publicação remove do catálogo, mas preserva a cópia de B;
- conteúdo comunitário não contém dados identificáveis de A.

Implementação:

- adicionar fluxo autenticado usando o setup de integração existente;
- cobrir os três tipos pelo menos uma vez, com foco em material e plano/cronograma;
- corrigir apenas wiring, fixtures ou tradução que os testes revelarem.

Verificação:

```text
pnpm --filter @aletheia/api test -- community-learning-resource.integration-spec.ts --runInBand
pnpm --filter @aletheia/web test -- activities-page.test.tsx community-learning-resources-gallery.test.tsx
```

Commit: `test: cover B09 sharing isolation`.

## Tarefa 6 — Auditoria final e preparação para PR

Executar na worktree:

```text
git diff --check
pnpm --filter @aletheia/contracts test
pnpm --filter @aletheia/api test
pnpm --filter @aletheia/web test
pnpm audit:i18n
node scripts/check-module-boundaries.mjs
pnpm --filter @aletheia/api typecheck
pnpm --filter @aletheia/web typecheck
git status --short
```

Checklist final:

- migration e cliente Prisma gerados;
- nenhuma alteração fora da worktree;
- nenhum segredo, ID de família/aluno ou URL privada em resposta pública;
- links para o hub estão acessíveis a partir do fluxo de atividades;
- mobile e teclado cobertos pelos testes de componente;
- issue #290 só será fechada depois de todos os critérios do B09 passarem.

Commit final, se necessário: `chore: verify B09 community hub`.
