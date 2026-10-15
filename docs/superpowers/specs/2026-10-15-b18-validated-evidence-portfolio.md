# ALET-B18 — Integrar evidências validadas ao portfólio

## Objetivo

Permitir que o responsável encontre, revise e promova uma evidência `VALIDATED` para o portfólio sem reenviar o arquivo ou duplicar o conteúdo.

## Experiência

- O portfólio oferece a ação `Adicionar evidência validada` quando há educando selecionado.
- O seletor lista somente evidências validadas do educando ativo.
- Cada item exibe tipo, data, conteúdo/mídia e o estado `Já adicionada` quando seu `evidenceSubmissionId` já aparece no portfólio.
- A confirmação abre/usa um formulário com título, descrição, destaque e tags; o arquivo, checksum, tipo e proveniência vêm do servidor.
- Erros de duplicidade, ausência de validação, URL de preview expirada e falha de rede têm mensagens compreensíveis e ação de tentar novamente.

## Limites técnicos

- Usar `POST /families/:familyId/portfolio/from-evidence-submission/:evidenceSubmissionId` como única escrita de promoção.
- Criar apenas o endpoint de leitura necessário para URL temporária de preview; ele exige a mesma família e `VALIDATED`.
- Copiar o objeto para uma nova `storageKey` própria do item de portfólio na promoção, preservando a mídia privada mesmo se uma das duas referências for excluída; nunca expor a chave de storage ao navegador como URL pública.
- Não alterar o status da submissão, não criar upload paralelo e não remover a ação manual existente do fluxo de competências.
- O contexto permanece limitado a `familyId` e `learnerId`; nenhuma evidência de outra família pode ser listada, visualizada ou promovida.

## Critérios de aceite

- API preserva checksum, tipo, conteúdo e `evidenceSubmissionId` na promoção, copiando mídia privada para uma chave independente do portfólio.
- Chaves privadas de evidência devem permanecer sob o prefixo da família e nunca podem ser assinadas para outra família.
- API impede promoção sem `VALIDATED` e repetição da mesma submissão.
- UI filtra pelo educando ativo, identifica itens já adicionados e envia apenas metadados editáveis.
- Preview usa `fileUrl` externo ou URL assinada temporária e possui estado de erro/retry.
- Testes de contrato, integração API e UI cobrem o fluxo feliz, duplicidade, contexto e falhas.
- Cobertura i18n permanece completa em `pt-BR`, `en-US` e `es-ES`.
