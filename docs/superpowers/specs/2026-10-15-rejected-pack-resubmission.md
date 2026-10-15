# ALET-B11 — Correção e reenvio de pacotes rejeitados

## Objetivo

Permitir que o autor corrija um material comunitário rejeitado, entenda o motivo da
rejeição e o envie novamente para moderação, sem abrir uma brecha para reenviar materiais
aprovados ou suspensos.

## Diagnóstico

- `submitPack` já aceita um pack `status=DRAFT` com `moderationStatus=REJECTED`.
- `requireEditableCommunityPack` restringe edição a `moderationStatus=DRAFT`, prendendo o
  autor após uma rejeição.
- O frontend só mostra editar/submeter quando o status de moderação é `DRAFT`.
- Os campos atuais guardam apenas a última decisão; não existe histórico append-only.

## Escopo

- Permitir edição e arquivamento somente de packs próprios em `DRAFT`/`REJECTED`.
- Mostrar ação de correção e `Enviar novamente para revisão` apenas para `REJECTED`.
- Manter aprovados, publicados, pendentes e suspensos protegidos contra reenvio.
- Persistir histórico de criação, edição, submissão, aprovação, rejeição, suspensão,
  restauração e arquivamento.
- Expor o histórico apenas ao autor do pack no endpoint autenticado e renderizá-lo no
  workspace com textos localizados.
- Preservar as notas de rejeição até nova decisão, para orientar a correção.

## Fora de escopo

- Alterar regras de confiança, moderação administrativa ou autoaprovação.
- Permitir edição de `APPROVED`, `PUBLISHED` ou `SUSPENDED`.
- Criar uma nova cópia do pack para cada tentativa.

## Critérios de aceite

1. Um `REJECTED` próprio pode ser aberto e corrigido nos metadados/composição.
2. O botão de reenvio aparece somente após rejeição e mantém proteção de ownership.
3. O reenvio retorna a `PENDING_REVIEW` ou `APPROVED` conforme a regra atual.
4. A UI mostra as notas da rejeição e o histórico com rejeição, edição e novo envio.
5. A API rejeita tentativas de editar/reenviar packs aprovados, suspensos, pendentes ou de
   outro autor.
6. Testes API/frontend cobrem sucesso, proteção e estados de erro.

