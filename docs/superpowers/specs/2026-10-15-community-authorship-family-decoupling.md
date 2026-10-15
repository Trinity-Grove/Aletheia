# ALET-B13 — Autoria comunitária independente do contexto de família

## Objetivo

Permitir que qualquer usuário autenticado explore a vitrine comunitária e acompanhe seus próprios rascunhos de materiais sem precisar ter uma família ativa. Operações que alteram o currículo ou os materiais privados de uma família continuam vinculadas ao `familyId` ativo e protegidas pelo `FamilyTenantGuard`.

## Comportamento esperado

### Sem família ativa

- `/curriculum/packs` continua renderizando a vitrine pública usando `GET /api/v1/curriculum-packs`.
- A aba de materiais do próprio autor usa os endpoints autenticados `my-packs` e `author-profile`.
- A tela identifica claramente que está no espaço comunitário.
- Não são chamados endpoints `/families/:familyId/...`.
- Não são exibidas ações de instalar, gerenciar, atualizar, publicar a partir de uma cópia familiar ou denunciar vinculando uma família.

### Com família ativa

- A vitrine preserva o fluxo atual e usa somente endpoints da família ativa.
- Instalação, gerenciamento, atualização e publicação permanecem operações protegidas da família.
- A tela identifica claramente o contexto da família.

### Segurança e isolamento

- O frontend nunca escolhe uma família diferente da fornecida pelo contexto de autenticação.
- A API de operações familiares não será enfraquecida nem receberá fallback comunitário.
- A vitrine pública não expõe dados privados ou instalados de nenhuma família.
- Alterar a família ativa recarrega apenas os dados da nova família.

## Fora de escopo

- Criar novos endpoints de autoria comunitária.
- Remover ou alterar `FamilyTenantGuard`.
- Permitir publicação comunitária universal a partir de um currículo que não pertence a uma família.
- Alterar o menu principal ou o modelo de dados.

## Critérios de aceite

1. Usuário autenticado sem família ativa vê catálogo público e seus rascunhos.
2. Usuário com uma ou mais famílias usa exclusivamente a família ativa para operações privadas.
3. Testes cobrem ausência de família, contexto familiar e troca de contexto sem vazamento.
4. As três traduções suportadas possuem as novas mensagens.
5. Typecheck, lint, auditoria i18n e testes web passam.
