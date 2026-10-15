# ALET-B12 — Descoberta e feedback do fluxo de publicação

## Objetivo

Tornar a autoria comunitária autoexplicativa para educadores: a pessoa deve encontrar a
próxima ação, entender a diferença entre o currículo da família e o material comunitário,
acompanhar o caminho de rascunho até moderação e receber mensagens que indiquem como
continuar quando algo falhar.

## Escopo

- Melhorar o estado vazio de **Meus Packs Comunitários** com ações para criar material,
  voltar ao catálogo e importar quando houver uma família ativa.
- Após criar um material pela publicação a partir de uma família, abrir automaticamente a
  aba de autoria e destacar o material recém-criado, deixando o botão de submissão visível.
- Exibir uma linha do tempo acessível e responsiva: `Rascunho → Em revisão → Aprovado`
  ou `Rascunho → Em revisão → Rejeitado`.
- Explicar, em linguagem simples, se o material é privado/da família, está aguardando
  moderação ou já está público.
- Tornar falhas de carregamento e submissão acionáveis, com retry/reload ou instrução da
  próxima ação.
- Manter textos simétricos em pt-BR, en-US e es-ES.

## Fora de escopo

- Alterar transições de moderação, permissões ou o endpoint de submissão.
- Permitir editar/reenviar material rejeitado; isso pertence ao ALET-B11.
- Misturar o editor de composição do B10 com o catálogo familiar.

## Critérios de aceite

1. Sem materiais autorais, o painel mostra CTA para criar, catálogo e, quando aplicável,
   importar material.
2. O sucesso de `publish-to-community` leva o usuário para **Meus Packs Comunitários** e
   apresenta o material criado com a ação de submissão.
3. Cada material autoral mostra seu status atual, uma progressão visual/semântica e uma
   explicação de visibilidade pública.
4. A rejeição mostra as notas da moderação e informa que a próxima etapa é revisar o
   conteúdo; não promete uma ação que o B11 ainda não implementa.
5. Erros de carregar ou enviar para revisão permitem tentar novamente sem perder o
   contexto.
6. Ações principais continuam utilizáveis em viewport estreito, sem overflow horizontal.
7. Testes focados, typecheck, lint e auditoria i18n permanecem verdes.

