# ALET-B08 — Linha do tempo de memórias do educando

## Objetivo

Adicionar ao Portfólio uma visão longitudinal, simples e responsiva, que reúna
as memórias já registradas para um educando: fotos e outros trabalhos,
reflexões, livros concluídos e marcos de aprendizagem.

## Decisões de produto

- A timeline é uma visão derivada de `PortfolioItemResponseDto` e
  `LearningRecordResponseDto`; não haverá tabela ou endpoint paralelo.
- O contexto ativo continua sendo o da família e do educando selecionado pelo
  `ProductShell`. Nenhum dado de outro educando deve aparecer.
- `PortfolioItem` representa uma memória/evidência visual; `type=IMAGE` recebe
  tratamento de foto e usa a mesma URL temporária protegida do Portfólio.
- `LearningRecord.type=READING_LOG` aparece como livro concluído.
- Registros com notas, descrição, pontos fortes, áreas de crescimento ou
  hábito de caráter aparecem como reflexão.
- Registros com `masteryLevel=MASTERED` aparecem como marcos. Isso é uma
  interpretação visual de um estado já existente, sem alterar o domínio.
- Eventos sem texto continuam visíveis com título e data; a timeline nunca
  depende da existência de uma foto.

## Experiência

- `/portfolio` passa a oferecer as visões `Galeria` e `Linha do tempo`.
- A visão inicia na galeria para preservar o fluxo atual e oferece uma CTA
  clara para a timeline.
- A timeline agrupa eventos por ano, ordena do mais recente para o mais antigo
  e usa marcadores visuais distintos para foto, reflexão, livro e marco.
- A seleção de educando do shell atualiza a visão sem navegação adicional.
- Em telas estreitas, os cards ocupam uma coluna; em telas largas, a linha
  central e os conteúdos não provocam rolagem horizontal.
- Estado vazio explica como começar: registrar uma aprendizagem ou adicionar
  uma memória ao Portfólio.

## Segurança e performance

- Nenhuma chamada nova ao backend é necessária; a tela reutiliza as respostas
  já protegidas por `FamilyTenantGuard`.
- URLs de mídia continuam sendo obtidas sob demanda pelo callback existente,
  com cache e deduplicação de requisições.
- A filtragem por educando acontece antes da renderização.
- A timeline não deve expor `storageKey`, URLs permanentes ou dados de outro
  tenant.

## Critérios de aceite verificáveis

- O usuário consegue alternar entre Galeria e Linha do tempo no Portfólio.
- A timeline mostra fotos/trabalhos, reflexões, livros (`READING_LOG`) e
  marcos (`MASTERED`) quando existirem.
- O filtro de educando é respeitado e o estado vazio é acessível.
- Os três idiomas possuem todas as chaves novas.
- Testes cobrem filtragem, classificação, ordenação, mídia e responsividade
  estrutural; typecheck, lint e auditoria de i18n permanecem verdes.
