# Plano de implementação — ALET-B11

## 1. Persistência e contratos

- [ ] Criar enum/modelo append-only de histórico de ciclo de vida do pack.
- [ ] Adicionar migration idempotente, DTO de histórico e exportação pelo pacote de
      contratos.

## 2. API

- [ ] Registrar eventos de criação, edição e transições de moderação no repositório.
- [ ] Permitir edição/arquivamento de `DRAFT` ou `REJECTED`; manter demais estados
      bloqueados.
- [ ] Expor `GET /curriculum-packs/:id/moderation-history` com ownership guard.
- [ ] Cobrir serviço, repositório e controller, incluindo proteção de estados.

## 3. Frontend

- [ ] Exibir edição/submissão para rejeitados com copy orientada à correção.
- [ ] Renderizar notas e histórico do pack, com loading/erro/retry.
- [ ] Manter ações responsivas e não exibir reenvio para aprovados/suspensos/pendentes.
- [ ] Adicionar chaves simétricas pt-BR, en-US e es-ES.

## 4. Verificação e integração

- [ ] Rodar testes focados e suítes completas de contracts/API/web.
- [ ] Rodar Prisma generate/validate, lint, typecheck, auditoria i18n, boundaries e
      `git diff --check`.
- [ ] Commit, push, abrir PR `fix(community): allow rejected pack resubmission`, aguardar
      CI green e mergear.

