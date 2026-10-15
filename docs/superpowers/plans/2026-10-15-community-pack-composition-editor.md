# Plano de implementação — ALET-B10

## Preparação

- Trabalhar apenas em `feat/alet-b10-composition-editor`.
- Confirmar que a base é `origin/main` após o merge do B09.
- Manter o escopo no workspace de autoria de pacotes comunitários.

## Task 1 — Contratos e persistência (TDD)

1. Criar testes dos schemas do catálogo, composição e revisão.
2. Adicionar DTOs com tipos fechados, posições e `expectedRevision`.
3. Alterar Prisma com `position`, `compositionRevision` e `CurriculumPackCompositionRevision`.
4. Criar migração SQL que preencha posições legadas por data de criação.
5. Gerar/validar Prisma e rodar os testes de contratos.

Commit: `feat(curriculum): define author pack composition contracts`

## Task 2 — Catálogo publicado e validação de domínio (TDD)

1. Testar catálogo filtrado somente por definições publicadas e tipos portáveis.
2. Implementar repositório/serviço que consulta os catálogos existentes e produz o resumo amigável.
3. Implementar validação de composição: autorização, estado editável, duplicatas, existência/status, serialização e referências portáteis.
4. Testar combinações inválidas e garantir que nenhuma escrita ocorra antes da validação completa.

Commit: `feat(curriculum): validate published composition candidates`

## Task 3 — Salvamento atômico, conflito e histórico (TDD)

1. Testar add/remove/reorder, normalização de posição e no-op sem nova revisão.
2. Implementar transação que verifica `expectedRevision`, substitui itens, incrementa revisão e grava snapshot.
3. Mapear divergência de revisão para `ConflictException`/HTTP 409.
4. Adicionar leitura de composição e histórico com autorização do autor.

Commit: `feat(curriculum): persist author pack composition revisions`

## Task 4 — Controller comunitário (TDD)

1. Testar `GET` do catálogo, `GET` da composição, `PUT` da composição e histórico.
2. Usar `JwtAuthGuard` e `CurrentUser`; manter rotas fora do controller admin.
3. Validar request com Zod e preservar respostas sem IDs internos desnecessários.

Commit: `feat(api): expose community pack composition editor`

## Task 5 — Editor web responsivo (TDD)

1. Testar carregamento, busca/filtro, add, remove, mover, preview, estado sujo, sucesso, erro e conflito.
2. Criar `CommunityPackCompositionEditor` com componentes de `@aletheia/ui`.
3. Integrar no `MyAuthoredPacksPanel` somente para drafts editáveis.
4. Desabilitar submit enquanto houver salvamento e preservar a composição local ao receber erro.
5. Adicionar feedback de conflito com ação de recarregar e histórico somente leitura.

Commit: `feat(web): add responsive community composition editor`

## Task 6 — i18n, integração e verificação

1. Adicionar todas as chaves nos três idiomas.
2. Rodar typecheck/lint de API, web e contratos.
3. Rodar suítes focadas e completas, `pnpm audit:i18n`, boundaries e `git diff --check`.
4. Fazer revisão final dos critérios de segurança, atomicidade, ordem e mobile.

Commit final esperado: `feat(community): add author pack composition editor`

## Comandos de verificação

```powershell
pnpm --filter @aletheia/contracts test
pnpm --filter @aletheia/api test -- composition --runInBand
pnpm --filter @aletheia/web test -- my-authored-packs-panel --run
pnpm --filter @aletheia/api typecheck
pnpm --filter @aletheia/web typecheck
pnpm --filter @aletheia/contracts lint
pnpm --filter @aletheia/api lint
pnpm --filter @aletheia/web lint
pnpm audit:i18n
node scripts/check-module-boundaries.mjs
git diff --check
```
