# Plano — ALET-B08 Linha do tempo de memórias

## 1. Contrato visual e testes RED

- Criar teste da nova visão com eventos de foto, reflexão, livro e marco.
- Verificar filtro por educando, ordenação descendente, agrupamento anual e
  estado vazio.
- Verificar que a URL de mídia só é solicitada quando o callback existente é
  usado pelo item visual.

## 2. Componente derivado

- Implementar `PortfolioTimelineView` sem chamadas próprias à API.
- Classificar os DTOs existentes em eventos tipados e deduplicar registros que
  já tenham uma memória vinculada apenas quando isso for necessário para a
  apresentação.
- Usar componentes e tokens do design system, sem utilitários Tailwind no JSX.

## 3. Integração no Portfólio

- Adicionar alternância acessível Galeria/Linha do tempo.
- Passar o educando ativo, itens filtrados e callback de mídia.
- Manter modais e ações da galeria intactos.

## 4. i18n e responsividade

- Adicionar as chaves em pt-BR, en-US e es-ES.
- Adicionar estilos BEM em `globals.css` para a linha central, marcadores,
  mídia e breakpoint mobile.

## 5. Verificação

- Rodar teste novo e testes de Portfólio.
- Rodar typecheck/lint web, auditoria i18n, boundaries e `git diff --check`.
- Fazer revisão independente antes de abrir PR.
