# Plano de implementação — ALET-B08

## 1. Contratos e backend (TDD)

- Criar schema de atualização limitado a código, nome, descrição e metadata.
- Adicionar `PATCH /api/v1/curriculum-packs/:id` e `POST /api/v1/curriculum-packs/:id/archive` com autenticação.
- Reforçar no serviço ownership e estado `DRAFT` antes de qualquer escrita.
- Cobrir service/controller com testes de sucesso, autor incorreto, pack inexistente e estado não editável.

## 2. Workspace web (TDD)

- Evoluir `MyAuthoredPacksPanel` para exibir CTA, formulário e lista de drafts.
- Reutilizar o catálogo já carregado para permitir começar de uma base pública.
- Usar criação POST, edição PATCH e arquivamento POST; atualizar a lista após cada operação.
- Exibir apenas ações compatíveis com o estado do material.

## 3. i18n e validação

- Adicionar as chaves de forma simétrica em pt-BR, en-US e es-ES.
- Rodar testes focados web/API, typecheck, lint, auditoria i18n e suíte completa correspondente.
- Validar `git diff --check`, commit convencional e CI antes do PR.
