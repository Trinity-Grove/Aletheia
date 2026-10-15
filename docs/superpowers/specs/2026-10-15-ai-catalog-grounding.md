# AI catalog grounding — ALET-96 / #348

## Objetivo

Permitir que a geração de rascunhos de aula seja ancorada, quando solicitado, em um `LearningDomain` publicado e ativo. O sistema deve rejeitar contexto inexistente, não publicado, depreciado ou desativado antes de chamar o provedor de IA.

## Contrato

- `GenerateLessonPlanDraftRequestDto.learningDomainCode`: campo opcional, código estável do domínio.
- `AiLessonPlanDraftResponseDto.catalogContext`: snapshot opcional com `id`, `code`, `version`, `name` e `description`.
- Chamadas sem `learningDomainCode` permanecem compatíveis.

## Fluxo

1. Validar o request e as políticas já existentes.
2. Se houver `learningDomainCode`, buscar a maior versão com `status=PUBLISHED` e `isActive=true`.
3. Se não houver correspondência, lançar erro de domínio antes de quota/provider/persistência.
4. Adicionar ao prompt somente os campos públicos do snapshot.
5. Persistir o mesmo snapshot em `AiSuggestion.catalogContext` e devolvê-lo na resposta.

## Segurança e compatibilidade

- O código do domínio nunca é aceito como prova de existência; a autoridade é o catálogo publicado atual.
- Descrição e nome são tratados como contexto de catálogo, não como instrução do sistema.
- O snapshot é imutável para a sugestão mesmo que o catálogo seja alterado depois.
- O escopo não inclui ranking, recomendação automática, competências ou alteração de definitions.

## Aceite

1. Domínio válido usa a maior versão publicada e ativa.
2. Código inexistente, não publicado ou desativado não chega ao LLM.
3. O snapshot aparece na resposta e no registro persistido.
4. Chamadas legadas sem domínio continuam funcionando.
5. A integração comprova isolamento por família e ausência de lesson plan criado na geração.
