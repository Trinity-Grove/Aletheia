# Plano — ALET-B09 Hub comunitário de atividades

## 1. Contratos e testes RED

- Adicionar DTO público sem identificadores da família e schema de adoção.
- Escrever testes de serviço/repositório para listar apenas `PUBLIC` e copiar
  uma atividade para outro tenant como `PRIVATE`.
- Adicionar cenário de integração para impedir adoção de atividade privada.

## 2. API

- Criar repositório/serviço de comunidade sobre `FamilyActivity` existente.
- Criar controller autenticado para catálogo público e adoção tenant-guarded.
- Registrar providers/controllers no `CurriculumModule`.

## 3. Frontend

- Expandir `FamilyActivitiesGallery` com aba comunitária e CTA de adoção.
- Reutilizar o formulário existente para editar apenas cópias da família.
- Tratar loading, erro e sucesso sem perder a lista local.

## 4. i18n e verificação

- Adicionar chaves pt-BR, en-US e es-ES.
- Rodar testes web e API focados, typechecks, lint, i18n, boundaries e diff
  check.
- Fazer revisão independente antes do PR; só mergear com CI verde.
