# Especificação: projeto → evidência → progresso

## Objetivo

Conectar projetos interdisciplinares publicados ao caminho real de aprendizagem da família: descobrir e ativar um projeto, registrar evidência produzida nele e acompanhar o progresso das competências relacionadas.

## Decisões de produto preservadas

- Projetos são opcionais e não substituem o Diário de Aprendizagem.
- Projetos não concedem competência nem conquista por conclusão de etapas.
- A evidência continua `UNVALIDATED` até que um responsável a valide.
- A política existente `EVIDENCE_COUNT` continua sendo a única regra de progresso nesta fatia: só conta evidência validada, vinculada à versão da competência acompanhada.
- A família pode desativar um projeto; evidências já registradas permanecem intactas.

## Experiência

1. Na área de Competências, a família vê projetos publicados, uma descrição e as competências catalogadas.
2. Pode adicionar/remover um projeto do percurso familiar sem apagar registros anteriores.
3. Ao enviar evidência, pode associá-la a um projeto ativo; competências acompanhadas que também estejam mapeadas ao projeto são sugeridas, mas a família controla a seleção final.
4. A evidência aparece com o projeto associado e estado de validação. Após validação do responsável, o fluxo já existente atualiza contagem, progresso e conquista conforme a política ativa.

## Contrato técnico

- Novo `GET /families/:familyId/curriculum/projects/catalog`, protegido por `FamilyTenantGuard`, lista somente projetos `PUBLISHED`, com competências mapeadas e estado `enabled` da seleção da família.
- Reutilizar `PUT /families/:familyId/curriculum/projects/:projectId/selection` e `GET .../projects/selections`; não criar tabela ou semântica paralela.
- A API de seleção familiar inclui as competências do projeto em leitura para que a UI possa associar e explicar o fluxo.
- Envio continua usando `projectDefinitionId` já existente em `CreateEvidenceSubmissionDto`.
- Exibição do identificador do projeto em evidências reutiliza a resposta atualmente retornada pela API; não altera o mecanismo de progresso.

## Fora de escopo

- Motor `PROJECTS`, `MASTERY`, `MENTOR_APPROVAL` ou `HOURS`.
- Conclusão de marcos, agenda/planejamento de projeto, geração por IA ou avaliação automática.
- Alterar o Diário, conquistas existentes, contratos de evidência ou esquema do banco.
- Fluxo de administração/publicação do catálogo.

## Critérios de aceite

- Família só descobre projetos publicados, isolados por tenant e com competências catalogadas.
- Seleção habilitar/desabilitar é idempotente e reversível.
- Projeto ativo pode ser associado à evidência; projeto desativado não pode ser selecionado em novo envio.
- Competências mapeadas só são pré-selecionadas quando já estão ativas para o educando; escolha final permanece editável.
- Evidência de projeto não validada não aumenta progresso nem cria conquista; depois de validada, o fluxo existente conta exatamente como antes.
- UI, estados de erro/vazio e mensagens disponíveis em pt-BR, en-US e es-ES.
