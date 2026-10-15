# Plano — facetas de tags do catálogo

## Escopo

Adicionar contrato, agregação no repositório, serviço e endpoint administrativo para descobrir tags existentes sem alterar o comportamento de tags atual.

## Tarefas

1. Escrever testes RED para query e DTO de facetas no pacote de contratos.
2. Implementar `searchDefinitionTagFacets` no repositório com `groupBy` Prisma e filtros combináveis.
3. Expor o método no serviço/controller em `GET .../tags/facets`, mantendo guards existentes.
4. Cobrir o encaminhamento no serviço e o fluxo HTTP na integração administrativa.
5. Rodar contratos, API unitária/integrada, typecheck, lint, boundaries e `git diff --check`.

## Commit

`feat(curriculum): expose definition tag facets`
