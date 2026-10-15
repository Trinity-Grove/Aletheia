# ALET-B09 — Hub comunitário de atividades entre famílias

## Objetivo

Permitir que uma família compartilhe voluntariamente uma atividade própria e
que outra família a adote como cópia editável, sem transferir o vínculo do
conteúdo original nem expor dados da família autora.

## Escopo

- Catálogo autenticado de atividades próprias marcadas como `PUBLIC`.
- Adoção em um clique para a família ativa.
- A cópia adotada começa `PRIVATE` e pertence à família adotante.
- A área de gestão mantém edição/remoção apenas dos itens da própria família.
- Atividades `PRIVATE` nunca aparecem no catálogo e não podem ser adotadas por
  chamada direta à API.
- A publicação continua sendo uma escolha explícita do autor; não há
  publicação automática, busca por pessoas ou contato entre famílias.

## Decisões de privacidade

- O catálogo não retorna `familyId`, nome da família ou dados do autor.
- O servidor verifica `visibility=PUBLIC` no momento da adoção; ocultar uma
  atividade torna novas adoções impossíveis, sem alterar cópias já adotadas.
- A cópia é criada com `visibility=PRIVATE`, portanto não é republicada por
  acidente.
- A cópia guarda apenas uma referência de proveniência em `metadata` para
  explicar ao usuário que veio da comunidade; nenhum dado pessoal é copiado.

## Experiência

- `/curriculum/activities` ganha duas visões: `Minhas atividades` e
  `Compartilhadas pela comunidade`.
- O catálogo mostra título, descrição, faixa etária, duração e supervisão.
- A CTA `Usar na minha família` confirma a adoção e retorna para a lista da
  família, onde a cópia pode ser editada.
- O estado vazio explica como publicar uma atividade ou voltar ao planejamento.

## Aceite verificável

- Uma atividade pública aparece para outra família autenticada.
- Uma atividade privada não aparece e a adoção direta retorna 404.
- A adoção cria uma cópia privada no tenant da família destino.
- A família destino consegue editar/remover a cópia sem alterar a origem.
- Testes API cobrem publicação, isolamento e adoção; testes web cobrem abas,
  CTA, loading/error e atualização da lista.
- As três traduções permanecem simétricas e boundaries/typecheck/lint passam.
