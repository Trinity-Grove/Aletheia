# ALET-B08 — Espaço do autor para materiais comunitários

## Objetivo

Dar ao educador um fluxo explícito para criar e manter materiais comunitários sem depender de uma família ativa ou de instalar um pacote antes.

## Contrato funcional

- A aba comunitária apresenta a CTA `Criar material`.
- O autor pode começar em branco ou selecionar um pack público como base para preencher o formulário.
- Salvar cria sempre um `CurriculumPack` próprio em `DRAFT`; não publica e não envia para moderação.
- Rascunhos próprios podem ser abertos e editados enquanto permanecerem em `DRAFT`.
- Rascunhos próprios podem ser arquivados; arquivamento é reversível apenas por fluxo administrativo futuro e não apaga evidência de autoria.
- Packs `PENDING_REVIEW`, `APPROVED`, `REJECTED` ou `SUSPENDED` não são editáveis pelo workspace desta issue.
- A lista continua sendo filtrada pelo `userId` autenticado.

## Segurança

- Criar, editar e arquivar exigem `JwtAuthGuard`.
- O serviço confirma `authorUserId === userId` antes de editar ou arquivar.
- O serviço rejeita edição/arquivamento de packs que não sejam rascunhos.
- Nenhuma rota recebe `familyId`; customizações familiares continuam em controllers tenant-guarded.
- O scanner de prompt continua sendo executado na criação e na submissão.

## Fora de escopo

- Editor de itens/disciplinas do manifesto completo.
- Publicação ou submissão automática.
- Alteração da moderação ou do catálogo público.
- Criação de uma nova tabela de autoria.

## Critérios de aceite

1. A CTA e o formulário existem nos três idiomas.
2. Criação em branco e baseada em pack público enviam payload `DRAFT`.
3. O autor consegue reabrir e salvar alterações em seu draft.
4. Outro usuário não consegue editar ou arquivar o draft.
5. O autor consegue arquivar seu draft sem removê-lo da rastreabilidade.
6. Testes cobrem API, ownership, estados protegidos e integração do workspace.
