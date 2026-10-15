# Especificação: fases de projetos interdisciplinares

## Contexto

O catálogo já modela `ProjectDefinition` e seus milestones, mas todos os milestones
ficam em uma única sequência. Isso impede representar projetos com etapas pedagógicas
claras, como `PLANEJAMENTO → EXECUÇÃO → REFLEXÃO`, sem colocar a estrutura em JSONB
ou criar lógica específica para cada projeto.

## Objetivo

Permitir que um projeto seja composto por fases ordenadas e que cada milestone
existente possa, opcionalmente, pertencer a uma fase.

## Contrato

- `ProjectDefinitionPhase` é uma entidade relacional filha de `ProjectDefinition`.
- Uma fase tem `code`, `title`, descrição opcional e `order`.
- O código é estável, em upper snake/dot case, e único dentro do projeto.
- Um milestone pode referenciar `phaseId`; milestones legados sem fase continuam válidos.
- `phaseId` só pode apontar para uma fase do mesmo projeto.
- A API expõe criação/listagem de fases e criação/listagem de milestones com `phaseId`.
- Fases e milestones são ordenados por `order` e depois por `code`, garantindo uma
  resposta determinística sem depender de ordem de inserção.

## Endpoints

- `POST /admin/curriculum-definitions/project-definitions/:projectId/phases`
- `GET /admin/curriculum-definitions/project-definitions/:projectId/phases`
- Os endpoints atuais de milestones aceitam e retornam `phaseId` opcional.

## Compatibilidade e segurança

- Nenhuma coluna existente é removida ou tornada obrigatória.
- A FK usa `onDelete: Cascade` para fases e `SetNull` para milestones quando uma fase
  é removida no futuro.
- A validação de pertença ao mesmo projeto é feita na camada de aplicação com uma
  consulta escopada por `(phaseId, projectId)`, evitando referências cruzadas pela API.
- Não há UI nesta fatia; o contrato serve o futuro editor do catálogo.

## Fora de escopo

- CRUD de edição/exclusão de fases e milestones.
- Vincular atividades diretamente a fases.
- Regras de progressão, execução de projeto ou novas tabelas de evidência.
