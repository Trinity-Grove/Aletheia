# Plano: seleção de projetos pela família

1. **Contrato e persistência (RED)**
   - Criar DTOs de upsert/resposta com metadados do projeto.
   - Criar tabela relacional com unicidade família/projeto e FKs restritivas.
   - Adicionar migration idempotente no fluxo Prisma.

2. **Aplicação**
   - Implementar repository com upsert somente para projetos publicados.
   - Implementar service e rotas protegidas por `FamilyTenantGuard`.
   - Listar seleções com ordenação determinística.

3. **Testes**
   - Cobrir contrato e service.
   - Cobrir integração real: habilitar, desabilitar, listar, rejeitar draft e bloquear outra família.

4. **Verificação e entrega**
   - Rodar contratos, typecheck, lint, boundaries e integração disponível.
   - Abrir PR referenciando #96; aguardar os quatro checks e fazer merge somente com todos verdes.
