# Plano — busca de definições de atividade

## Escopo

Implementar a busca administrativa de `ActivityDefinition` no contrato, repositório, serviço e controller, preservando o comportamento atual quando nenhum filtro é informado.

## Tarefas

1. Adicionar schema de query e tipos no pacote de contratos, com testes RED para defaults, enum e limites.
2. Alterar o repositório para receber filtros opcionais e compor um `where` Prisma indexável, incluindo interseção de faixa etária.
3. Encaminhar a query validada pelo serviço e controller, mantendo o DTO de resposta e a autorização existentes.
4. Cobrir service/controller e integração administrativa com busca textual, status, idade, combinação e erro de validação.
5. Rodar testes focados, suite API, contratos, typecheck, lint, boundaries e `git diff --check` antes do commit.

## Commit

Um commit atômico: `feat(curriculum): add activity definition search`.
