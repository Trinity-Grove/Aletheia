# Plano: fases de projetos interdisciplinares

1. **Contratos primeiro (RED)**
   - Adicionar schemas de fase.
   - Adicionar `phaseId` opcional ao milestone.
   - Cobrir defaults, códigos inválidos e resposta com fase.

2. **Persistência (RED)**
   - Criar `ProjectDefinitionPhase`.
   - Adicionar a FK opcional do milestone com integridade composta no mesmo projeto.
   - Criar migration SQL segura para bancos já existentes.

3. **Aplicação e API**
   - Adicionar métodos de repository/service/controller para criar/listar fases.
   - Propagar `phaseId` ao criar e listar milestones.
   - Manter milestones sem fase compatíveis.

4. **Integração**
   - Estender o teste administrativo para criar um projeto, fases e milestones por fase.
   - Verificar que a API rejeita milestone ligado a fase de outro projeto.

5. **Verificação**
   - Rodar contratos, API typecheck/lint, boundaries, auditoria i18n e testes de integração.
   - Fazer commit atômico por contratos/persistência e por API/testes.
   - Abrir PR referenciando #96, aguardar todos os checks e só então fazer merge.
