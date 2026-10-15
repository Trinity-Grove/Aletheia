# Especificação: seleção de projetos pela família

## Objetivo

Permitir que cada família escolha quais projetos interdisciplinares publicados
fazem parte do seu percurso. A seleção é uma preferência explícita, reversível e
idempotente; o catálogo continua sendo governado pela plataforma.

## Contrato

- `FamilyProjectSelection` relaciona `Family` a `ProjectDefinition`.
- Uma família só pode selecionar projetos `PUBLISHED`.
- `enabled` permite ativar ou desativar a seleção sem apagar histórico.
- Repetir a mesma operação atualiza a linha existente (`familyId`, `projectId` único).
- A resposta inclui metadados mínimos do projeto (code, name, version e status).
- `FamilyTenantGuard` impede leitura ou alteração por outra família.

## Endpoints

- `PUT /families/:familyId/curriculum/projects/:projectId/selection`
- `GET /families/:familyId/curriculum/projects/selections`

## Fora de escopo

- Editar a definição catalogada ou criar uma cópia de conteúdo nesta fatia.
- Seleções por aluno ou ano letivo.
- Alterar o status do projeto ou permitir seleção de `DRAFT`/`DEPRECATED`.
- UI dedicada; o contrato fica pronto para o planner e a vitrine consumirem.
