# Spec: Arquitetura Fundacional e Governança de Internacionalização (i18n)

**Data:** 2026-09-21  
**Status:** Approved  
**Autor:** Pair Programming Session  

---

## 1. Visão Geral e Declaração do Problema

A plataforma educacional Aletheia possui um motor reativo de internacionalização (`LocaleProvider` e hook `useLocale()` em `apps/web/src/lib/i18n/locale-context.tsx`) com suporte a três locales: `pt-BR` (padrão), `en-US` e `es-ES`. O compilador TypeScript já impõe paridade de tipos via `Dictionary = Widen<typeof ptBR>`.

No entanto, atualmente:
1. **Falta de Governança Formal:** Não há instrução explícita em `AGENTS.md` proibindo textos hardcoded em JSX, o que permitiu que novas telas fossem criadas com strings fixas em português.
2. **Dicionários Monolíticos:** Todas as traduções residem em arquivos únicos (`pt-BR.ts`, `en-US.ts`, `es-ES.ts`) contendo apenas 4 domínios básicos (`common`, `nav`, `notifications`, `learnerFocus`). Esse modelo gera gargalos de merge e desorganização conforme o app cresce.
3. **Ausência de Guardrails de Interpolação e Strings Vazias:** O compilador valida que as chaves existem, mas não detecta strings vazias ou discrepâncias em variáveis interpoladas como `{count}` vs `{total}`.

---

## 2. Requisitos e Diretrizes Arquiteturais

### Requisito 1: Governança Inegociável em `AGENTS.md`
- Estabelecer regra canônica para agentes e desenvolvedores:
  - Todo componente frontend DEVE consumir textos via `const { t } = useLocale()`.
  - Proibido texto fixo hardcoded em JSX para conteúdo voltado ao usuário.
  - Toda nova string inserida em `pt-BR` DEVE conter sua respectiva tradução em `en-US` e `es-ES` no mesmo commit.
  - Datas, horários, números e moedas DEVEM utilizar os formatadores do `useLocale()`.

### Requisito 2: Modularização dos Dicionários por Domínio
- Reestruturar `apps/web/src/lib/i18n/dictionaries/` em submódulos tipados por domínio:
  ```
  apps/web/src/lib/i18n/dictionaries/
  ├── pt-BR/
  │   ├── common.ts
  │   ├── nav.ts
  │   ├── notifications.ts
  │   ├── learner-focus.ts
  │   └── index.ts
  ├── en-US/
  │   ├── common.ts
  │   ├── nav.ts
  │   ├── notifications.ts
  │   ├── learner-focus.ts
  │   └── index.ts
  ├── es-ES/
  │   ├── common.ts
  │   ├── nav.ts
  │   ├── notifications.ts
  │   ├── learner-focus.ts
  │   └── index.ts
  ├── pt-BR.ts (reexporta ptBR e define `Dictionary`)
  ├── en-US.ts (reexporta enUS validado contra `Dictionary`)
  └── es-ES.ts (reexporta esES validado contra `Dictionary`)
  ```
- Cada submódulo (ex: `en-US/common.ts`) é tipado como `Dictionary['common']`, garantindo autocomplete e validação granular por arquivo.

### Requisito 3: Guardrails Automatizados de Teste
- Expandir `apps/web/tests/i18n.test.tsx` com testes de paridade profunda:
  - **Não-vacuidade:** Nenhuma chave em `pt-BR`, `en-US` ou `es-ES` pode ser uma string vazia ou conter apenas espaços.
  - **Simetria de Interpolação:** Se uma mensagem em `pt-BR` utiliza `{name}` ou `{count}`, as versões `en-US` e `es-ES` devem conter exatamente as mesmas variáveis de interpolação.
  - **Paridade Estrutural 1:1:** O conjunto de nós e chaves folha deve ser idêntico nos 3 idiomas.

### Requisito 4: Roteiro de Migração Gradual
- **Fase 1 (Este Design):** Fundação, governança em `AGENTS.md`, modularização e guardrails de teste.
- **Fase 2 (Próximo Passo):** Telas de Entrada (Auth: Login, Registro, Recuperação de Senha; Onboarding: Setup da Família, País, Educandos).
- **Fase 3:** Portal do Aluno (`/aluno`).
- **Fase 4:** Módulos de Gestão Familiar (Agenda, Diário, Frequência, Educandos, Relatórios).

---

## 3. Critérios de Sucesso e Verificação

1. `pnpm --filter @aletheia/web test tests/i18n.test.tsx` passa com 100% de sucesso incluindo os novos testes estruturais.
2. `pnpm --filter @aletheia/web typecheck` executa sem erros com os dicionários modularizados.
3. `AGENTS.md` contém a diretriz formal de i18n preservando todas as diretrizes anteriores.
4. Zero regressão na interface existente.
