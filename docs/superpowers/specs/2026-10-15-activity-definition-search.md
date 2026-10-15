# Activity Definition Search — ALET-96

## Objetivo

Permitir que administradores encontrem definições de atividade do catálogo sem baixar a lista inteira e filtrar fora da API. A melhoria cobre o item de descoberta/busca do catálogo do épico #96.

## Contrato

`GET /api/v1/admin/curriculum-definitions/activity-definitions`

Query opcional:

- `q`: texto de 1 a 150 caracteres, pesquisado sem diferenciar maiúsculas/minúsculas em `code`, `name` ou `description`.
- `status`: `DRAFT`, `PUBLISHED`, `DEPRECATED` ou `ARCHIVED`.
- `age`: idade inteira de 0 a 120; retorna atividades cuja faixa inclui a idade, tratando limite nulo como aberto.

Sem query, a resposta permanece exatamente uma lista ordenada por `code` e `version` descendente. Com query, o mesmo DTO é retornado, com os filtros combinados por AND.

## Regras e segurança

- A rota continua protegida por `JwtAuthGuard` e `PlatformAdminGuard`.
- Query inválida retorna 400 pelo mesmo `ZodValidationPipe` usado nos demais endpoints.
- A busca é feita no banco via Prisma; não há filtro pós-consulta nem limite implícito que altere resultados existentes.
- `age` usa interseção inclusiva: `ageMin <= age` ou `ageMin` nulo, e `ageMax >= age` ou `ageMax` nulo.

## Testes de aceitação

1. Lista sem filtros continua retornando todas as atividades na ordem atual.
2. `q` encontra por código, nome e descrição sem diferenciar caixa.
3. `status` restringe somente ao status informado.
4. `age` inclui faixas abertas e exclui faixas incompatíveis.
5. Filtros combinados aplicam AND.
6. Query inválida é rejeitada antes do repositório.
