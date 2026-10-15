# ALET-B10 — Editor de composição curricular para pacotes autorais

## Objetivo

Permitir que o autor de um pacote comunitário em rascunho monte a composição curricular usando definições já existentes e publicadas, com ordem explícita, validação server-side, preview antes do salvamento e histórico imutável.

O escopo é o workspace de autoria (`MyAuthoredPacksPanel`) e os `CurriculumPack` comunitários. Não altera o editor de cópias instaladas pela família (`FamilyCurriculumPackModal`), que possui revisões e autorização próprias.

## Experiência do usuário

1. Ao abrir um pacote autoral em rascunho, o autor vê a composição atual e um catálogo pesquisável de definições publicadas.
2. O autor filtra por tipo e texto, adiciona um item elegível, remove itens e reordena com controles acessíveis de subir/descer.
3. A coluna de preview mostra a ordem final que será publicada e sinaliza alterações não salvas.
4. Salvar composição envia a lista completa em uma única operação. O servidor valida tudo antes de substituir o manifesto.
5. Em conflito de edição, o servidor rejeita o salvamento com `409`; a interface informa que outra aba alterou o pacote e oferece recarregar.
6. O histórico mostra o número da revisão, data e quantidade de itens. O histórico não é editável nem apagado pelo autor.

## Contrato de dados

### Catálogo

Adicionar contratos para `CurriculumCompositionCatalogItem` (`definitionType`, `code`, `version`, `label`, `description`, `status`, `schemaVersion`) e `CurriculumCompositionCatalogQuery` (`definitionType`, `query`, `limit`). O catálogo expõe somente definições `PUBLISHED` e tipos suportados pelo exportador/importador. `ProjectDefinition` permanece fora do B10 até que a portabilidade desse tipo seja implementada.

### Composição

O item atual é `{ definitionType, code, version, position }`. A posição é persistida no banco; não usar `createdAt` como ordenação implícita.

`PUT /api/v1/curriculum-packs/:id/composition` recebe `expectedRevision` e a lista ordenada de itens. O retorno contém `revision`, `items` e `preview`, sendo `preview` a mesma composição normalizada que será usada pelo exportador.

`GET /api/v1/curriculum-packs/:id/composition` retorna a composição corrente e a revisão. `GET /api/v1/curriculum-packs/:id/composition/revisions` retorna snapshots somente leitura.

## Regras de domínio e segurança

- Somente o autor do pacote pode consultar ou alterar a composição de um pacote comunitário em `DRAFT`/`DRAFT`.
- A lista deve conter itens únicos por `(definitionType, code, version)`.
- Cada item deve existir e estar `PUBLISHED`.
- Cada item deve ser serializável pelo mecanismo de portabilidade; falha de exportação bloqueia o salvamento inteiro.
- Referências portáteis encontradas no conteúdo devem apontar para uma definição existente e publicada ou para outro item da composição.
- O servidor normaliza posições em `0..n-1` e não confia em posições manipuladas pelo cliente.
- A validação ocorre antes do `deleteMany/createMany`; qualquer falha mantém o manifesto anterior.
- `expectedRevision` implementa controle otimista. Divergência retorna `409 Conflict` com mensagem amigável.
- Cada salvamento bem-sucedido incrementa a revisão e grava snapshot imutável; salvamento sem alteração não cria revisão nova.
- Submissão para moderação continua usando o exportador atual, agora respeitando a ordem persistida.

## Persistência

- Adicionar `position Int @default(0)` em `CurriculumPackItem`.
- Adicionar `compositionRevision Int @default(0)` em `CurriculumPack`.
- Criar `CurriculumPackCompositionRevision` com `packId`, `revision`, `items Json` e `createdAt`, com unicidade `(packId, revision)`.
- A migração deve preencher posições existentes por `created_at` e manter compatibilidade com manifestos administrativos antigos.

## API e UI

- Criar serviço/repositório de composição no módulo de currículo.
- Adicionar endpoints autenticados ao controller comunitário; nunca reutilizar as rotas administrativas protegidas por `PlatformAdminGuard`.
- Adicionar componente reutilizável `CommunityPackCompositionEditor` ao workspace do autor.
- Usar componentes de `@aletheia/ui`, atributos ARIA e layout que funcione em telas estreitas; não adicionar classes Tailwind.
- Adicionar traduções em pt-BR, en-US e es-ES simultaneamente.
- Preservar testids atuais do workspace e adicionar testids estáveis para catálogo, adicionar, remover, mover, preview, estado sujo, conflito e histórico.

## Critérios de aceite verificáveis

- Autor adiciona uma definição publicada e ela aparece no preview e no manifesto.
- Autor remove e reordena itens; a ordem sobrevive a reload.
- Duplicatas, referências inválidas, definições não publicadas e combinação incompatível retornam erro sem alteração parcial.
- Preview reflete exatamente a composição enviada.
- Dois salvamentos concorrentes não sobrescrevem silenciosamente um ao outro.
- Cada salvamento com mudança gera uma revisão consultável.
- Usuário não autor não lê nem altera a composição.
- A interface é utilizável em viewport mobile.
