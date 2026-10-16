# Plano: projeto → evidência → progresso

## Sequência de implementação (TDD)

1. **Contrato e leitura de catálogo (RED → GREEN)**
   - Testar schemas dos DTOs de catálogo familiar e seleção enriquecida.
   - Testar repository/service: somente projetos publicados, competências em ordem determinística, seleção `enabled` atual, família sem seleção como `false`.
   - Implementar resposta e consulta Prisma sem N+1; incluir competência id/code/title/required/order.
   - Expor endpoint familiar no controller, sob os guards já aplicados.
2. **Política de seleção (RED → GREEN)**
   - Completar cobertura do serviço de seleção reversível e validar que projeto não publicado não pode ser habilitado.
   - Reutilizar o endpoint existente; adicionar competências à resposta de seleções sem alterar banco.
3. **UI de descoberta e percurso (RED → GREEN)**
   - Testar carregamento, vazio, projeto publicado, alternância e falha de rede.
   - Exibir projetos e competências em Competências, com ativar/desativar usando o endpoint existente e atualizar estado local.
   - Incluir traduções simultâneas em pt-BR/en-US/es-ES.
4. **Vínculo da evidência (RED → GREEN)**
   - Testar projeto opcional no modal, pré-seleção apenas da interseção entre competências mapeadas e acompanhadas ativas, escolha editável e submissão do `projectDefinitionId`.
   - Testar exibição do projeto em evidências submetidas.
   - Garantir regressão: evidência não validada não conta; evidência validada segue o motor existente.
5. **Verificação e revisão**
   - Executar testes direcionados de contratos, API e UI, typecheck, scanner i18n, boundaries e testes API relevantes.
   - Revisar isolamento por família, estados de falha, idempotência e inexistência de conclusão automática.

## Arquivos previstos

- `packages/contracts/src/family-project-selection.ts` (+ testes e export barrel)
- `apps/api/src/modules/curriculum/infrastructure/family-project-selection.repository.ts` (+ testes)
- `apps/api/src/modules/curriculum/application/family-project-selection.service.ts` (+ testes)
- `apps/api/src/modules/curriculum/presentation/curriculum.controller.ts` (+ testes/integration spec)
- `apps/web/src/components/records/competency-tracking-panel.tsx`
- `apps/web/src/components/records/evidence-submission-modal.tsx`
- `apps/web/tests/competency-tracking-panel.test.tsx` (e, se necessário, teste isolado do modal)
- `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/records.ts`

## Fora dos arquivos de implementação

Sem migration Prisma, alteração do motor de progressão, mudança no Diário ou leitura/escrita na worktree do mural comunitário.
