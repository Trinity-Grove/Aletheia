# ALET-B09 — Mídias na publicação comunitária

## Objetivo

Preservar links e arquivos anexados ao snapshot familiar quando o educador o publica como material comunitário, mantendo separação entre dados privados da família e a cópia pública.

## Decisões arquiteturais

- `CurriculumPackMedia` será uma entidade pública própria, relacionada a `CurriculumPack` e com proveniência opcional em `FamilyCurriculumPackMedia`.
- `CurriculumPack.originFamilyCurriculumPackId` será único e opcional. Ele permite que uma nova tentativa da mesma publicação retorne o pacote já criado, sem criar um segundo pacote ou duplicar mídias.
- Links externos serão copiados como metadados; arquivos serão copiados para uma chave comunitária opaca e distinta da chave `families/...` privada.
- A cópia dos arquivos acontecerá antes da importação do pacote. Qualquer falha limpa os objetos comunitários já copiados e impede a criação da submissão.
- A criação dos registros públicos de mídia será atômica. Em falha posterior, a submissão recém-criada e os objetos copiados serão compensados/removidos.
- O endpoint público de mídia só responde para pacotes `PUBLISHED` e `APPROVED`; uploads recebem URL pré-assinada sob demanda e links externos permanecem HTTPS.
- A API pública não expõe `storageKey` nem `sourceFamilyMediaId`.

## Fluxo

1. Validar a família, o snapshot e a publicação existente por proveniência.
2. Listar as mídias privadas do snapshot e validar novamente URL HTTPS, MIME, tamanho e existência dos uploads.
3. Copiar cada upload confirmado para namespace comunitário determinístico; links externos não acessam storage.
4. Importar o documento como `DRAFT`, gravando a proveniência do snapshot.
5. Criar as linhas `CurriculumPackMedia` em uma transação, com `sourceFamilyMediaId` único por pacote.
6. Retornar o pacote; moderação continua responsável por torná-lo público.
7. Após aprovação, `GET /api/v1/curriculum-packs/:id/media` apresenta links e arquivos no detalhe público.

## Segurança e invariantes

- Nenhuma chave `families/...` é retornada ou gravada na mídia pública.
- Upload pendente, inexistente, maior que 25 MiB ou com MIME incompatível bloqueia a publicação.
- Pacote não aprovado não possui endpoint público de mídia.
- Reenvio do mesmo snapshot é idempotente pelo `originFamilyCurriculumPackId`.
- Repetição da cópia usa chave comunitária determinística e não cria registros duplicados.
- Falhas de cópia não deixam `CurriculumPack` nem `CurriculumPackMedia` publicados.

## Fora de escopo

- Edição de mídia pública após aprovação.
- Tornar uploads publicamente legíveis sem URL pré-assinada.
- Alterar regras de moderação, trust score ou o editor completo de conteúdo.

## Critérios de aceite

1. Links externos aparecem no detalhe aprovado.
2. Uploads aparecem no detalhe aprovado através de URL pré-assinada comunitária.
3. Falha em qualquer upload impede a submissão e limpa cópias.
4. Reenvio idempotente não duplica pacote, arquivo ou linha de mídia.
5. Pacotes não aprovados não expõem mídias.
6. Testes cobrem validação de URL/MIME/tamanho, cópia, falha, idempotência, endpoint e detalhe web.
