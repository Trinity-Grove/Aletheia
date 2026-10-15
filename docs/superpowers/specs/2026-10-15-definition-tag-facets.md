# Definition Tag Facets — ALET-96 / #346

## Objetivo

Permitir que consumidores administrativos descubram as tags existentes no catálogo, agrupadas por namespace e tipo de definição. Isso transforma tags em uma base reutilizável para filtros, organização editorial e futuras recomendações, sem introduzir recomendação automática neste recorte.

## Contrato

`GET /api/v1/admin/curriculum-definitions/tags/facets`

Query opcional:

- `namespace`: restringe uma taxonomia.
- `entityType`: restringe o tipo de definição packageable.
- `q`: prefixo de tag, sem diferenciar maiúsculas/minúsculas.

Resposta:

```json
[
  {
    "namespace": "theme",
    "tag": "apiculture",
    "entityType": "LearningPath",
    "definitionCount": 3
  }
]
```

Os resultados são agrupados por `namespace`, `tag` e `entityType`, ordenados de forma determinística. `definitionCount` conta definições distintas porque a tabela garante uma única associação para cada combinação.

## Segurança e compatibilidade

- Usa os mesmos `JwtAuthGuard` e `PlatformAdminGuard` da API de tags existente.
- Query inválida retorna 400 via `ZodValidationPipe`.
- Criação, listagem por definição e busca exata permanecem inalteradas.
- A agregação ocorre no banco; não carrega todas as tags para filtrar em memória.

## Aceite

1. Facetas sem filtros retornam todas as combinações agrupadas.
2. Namespace e tipo de entidade podem ser combinados.
3. `q` faz busca por prefixo sem diferenciar caixa.
4. Contagens refletem definições distintas por faceta.
5. Query inválida é rejeitada antes do repositório.
