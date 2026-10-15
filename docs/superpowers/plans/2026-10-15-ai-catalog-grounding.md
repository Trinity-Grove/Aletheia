# Plano — grounding de IA no catálogo publicado

1. RED: adicionar campos opcionais aos contratos e testes de normalização/resposta.
2. RED: cobrir serviço para domínio publicado válido, rejeição de domínio inválido/inativo e compatibilidade sem domínio.
3. Implementar lookup do snapshot, contexto do prompt e retorno/persistência.
4. Adicionar `catalog_context` à tabela de sugestões com migração aditiva e atualizar o repositório.
5. Acrescentar cenário de integração real para domínio publicado, snapshot persistido e rejeição antes do provider.
6. Rodar contratos, unitários da API, integração focada, typecheck, lint, boundaries e `git diff --check`.

Commit esperado: `feat(ai): ground lesson drafts in published catalog context`
