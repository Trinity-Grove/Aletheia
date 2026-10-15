# Plano de implementação — ALET-B13

## 1. Contrato e testes

- Adicionar testes para a galeria sem `familyId`: chamada somente ao catálogo público, catálogo visível, ações familiares ausentes e aba de autoria independente disponível.
- Adicionar teste de troca entre famílias: a galeria consulta os endpoints apenas do novo `familyId` e não reutiliza dados instalados do contexto anterior.
- Preservar os testes existentes do fluxo familiar.

## 2. Ajuste da página

- Fazer a página buscar learners apenas quando houver família ativa.
- Renderizar `CurriculumPacksGallery` também quando não houver família, em vez de interromper na mensagem de bloqueio.

## 3. Ajuste da galeria

- Tornar `familyId` opcional/nulo.
- Com família: manter endpoints e ações atuais.
- Sem família: buscar o endpoint público, limpar instalações e ocultar ações que exigem tenant.
- Manter `MyAuthoredPacksPanel` acessível nos dois contextos.
- Adicionar mensagens de contexto traduzidas.

## 4. Validação

- Rodar testes focados da galeria e componentes afetados.
- Rodar typecheck e lint do web.
- Rodar `pnpm audit:i18n` e `git diff --check`.
- Rodar a suíte web completa antes do commit.

## Commits esperados

- `test(community): cover authorship without family context`
- `feat(community): decouple authorship from family context`
- `docs(community): define family and community pack contexts`
