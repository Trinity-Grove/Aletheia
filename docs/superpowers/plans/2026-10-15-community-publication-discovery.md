# Plano de implementação — ALET-B12

## 1. Contrato visual e textos

- [ ] Adicionar chaves simétricas para contexto do autor, estado vazio, timeline,
      visibilidade e retry.
- [ ] Criar um componente pequeno e testável para a progressão de publicação, sem classes
      Tailwind e usando tokens/componentes existentes.

## 2. Painel do autor

- [ ] Adicionar ações ao estado vazio e callbacks opcionais para catálogo/importação.
- [ ] Adicionar retry ao carregamento e à submissão.
- [ ] Renderizar timeline, visibilidade e notas de moderação por pack.
- [ ] Ajustar o agrupamento de ações para mobile e destacar o pack criado após publicação.

## 3. Integração com catálogo/publicação

- [ ] Ao concluir a publicação a partir de uma família, trocar para a aba de autoria e
      encaminhar o id criado.
- [ ] Diferenciar o banner de contexto da família do banner do espaço autoral.

## 4. Verificação

- [ ] Cobrir estado vazio, retry, timeline, rejeição e redirecionamento pós-publicação com
      testes Vitest.
- [ ] Executar testes web focados e completos, typecheck, lint, auditoria i18n e
      `git diff --check`.
- [ ] Commit atômico, push, abrir PR no padrão `feat(community): ...`, aguardar todos os
      checks e só então mergear.

