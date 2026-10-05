# Spec: Auditoria de Cobertura e Plano de Migração Completa para i18n

- **Status:** Approved
- **Data:** 2026-10-04
- **Autor:** Trinity Grove Engineering
- **Alvo:** `apps/web/app/` (páginas), `apps/web/src/components/` (componentes), `scripts/audit-i18n-coverage.mjs`

---

## 1. Visão Geral e Contexto

O Aletheia foi concebido como uma plataforma de soberania familiar multilíngue com suporte nativo e paritário a três localidades: `pt-BR` (padrão), `en-US` e `es-ES`.

A arquitetura fundacional de i18n (`apps/web/src/lib/i18n/`) dispõe de:
1. `LocaleContext` reativo com persistência em `localStorage` e sincronização assíncrona com `FamilySettings.language`.
2. Dicionários modularizados por domínio (`pt-BR`, `en-US`, `es-ES`).
3. Formatadores universais de data, horário, moeda e números via `Intl`.
4. Teste de paridade estrita (`apps/web/tests/i18n.test.tsx`) que valida ausência de chaves vazias e simetria matemática das variáveis de interpolação `{var}`.

### O Desafio
Apesar da fundação arquitetural sólida:
- De **30 páginas** em `apps/web/app/`, apenas **11 páginas** utilizam `useLocale` (19 páginas possuem strings literais em português hardcoded).
- De **92 componentes** em `apps/web/src/components/`, apenas **33 componentes** utilizam `useLocale` (59 componentes dependem de textos fixos).
- Não há ferramenta automatizada no pipeline de CI/CD para escanear a base de código e alertar quando novas strings hardcoded são introduzidas.

---

## 2. Metas e Não-Metas

### Metas (In-Scope)
1. **Ferramenta de Auditoria Automatizada (`scripts/audit-i18n-coverage.mjs`):**
   - Varredura estática determinística de todas as páginas (`apps/web/app/**/*.tsx`) e componentes (`apps/web/src/components/**/*.tsx`).
   - Detecção de textos literais em JSX (`>Texto aqui<`) e atributos voltados ao usuário (`placeholder`, `title`, `aria-label`, `label`, `helperText`, etc.).
   - Geração de relatório consolidado com status por arquivo, linhas com literais e porcentagem de cobertura.
   - Script companion de testes (`scripts/audit-i18n-coverage.test.mjs`) executado via `node --test`.
2. **Comando de CI (`pnpm audit:i18n`):**
   - Integração no `package.json` da raiz para monitoramento contínuo.
   - Suporte a flags `--json`, `--markdown` e saída formatada no terminal.
3. **Plano de Execução em Ondas (Waves):**
   - Agrupamento dos 78 arquivos pendentes em 5 ondas temáticas com critérios de aceitação, estrutura de dicionários e testes unitários dedicados.

### Não-Metas (Out-of-Scope)
- Tradução de conteúdo dinâmico salvo no banco de dados (ex: títulos de tarefas criadas pelo próprio usuário).
- Alteração de rotas do Next.js (as URLs permanecem canônicas e a localidade é gerenciada pelo contexto da sessão da família).

---

## 3. Especificação do Scanner de Auditoria (`scripts/audit-i18n-coverage.mjs`)

### 3.1. Heurística de Detecção de Strings Hardcoded

O scanner analisa arquivos `.tsx` procurando dois padrões principais:
1. **Filhos de Elementos JSX (JSX Text Content):**
   - Fragmentos de texto entre tags que contenham palavras com 3 ou mais caracteres alfabéticos (exclui whitespace, pontuações isoladas, números puros e entidades HTML).
   - Ignora blocos delimitados por `{t('...')}` ou chamadas de formatadores.
2. **Atributos Literais Voltados ao Usuário (JSX Attributes):**
   - Atributos literais conhecidos: `placeholder="Texto"`, `title="Texto"`, `aria-label="Texto"`, `label="Texto"`, `helperText="Texto"`, `description="Texto"`, `alt="Texto"`.
   - Ignora atributos técnicos como `className`, `data-testid`, `id`, `name`, `type`, `role`, `href`, `style`, `key`.

### 3.2. Formato de Saída (Markdown Matrix)

O scanner gera o sumário no seguinte formato:

```markdown
# Relatório de Cobertura de Internacionalização (i18n)

- **Total de Páginas:** 30 (11 traduzidas, 19 pendentes - 36.7%)
- **Total de Componentes:** 92 (33 traduzidos, 59 pendentes - 35.9%)
- **Cobertura Total de Frontend:** 44 / 122 arquivos (36.1%)

| Tipo | Caminho | Status i18n | Literais Detectados |
| :--- | :--- | :--- | :--- |
| Página | `apps/web/app/(dashboard)/attendance/page.tsx` | ❌ Pendente | 14 strings |
| Componente | `apps/web/src/components/records/records-list.tsx` | ❌ Pendente | 22 strings |
...
```

---

## 4. Estrutura de Dicionários e Convenção de Nomes

Todas as novas traduções devem seguir rigorosamente o padrão existente:
- Diretórios: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/<dominio>.ts`
- Novos domínios a criar:
  1. `attendance.ts` (Frequência escolar, calendário e presenças)
  2. `records.ts` (Histórico escolar, transcrições e portfólio)
  3. `reports.ts` (Relatórios de conformidade e dossiês MEC/Estaduais)
  4. `devotional.ts` (Devocionais diários e comparador de versões bíblicas)
  5. `activities.ts` (Atividades pedagógicas e rubricas de avaliação)
  6. `portfolio.ts` (Evidências de aprendizagem e galeria de trabalhos)

---

## 5. Fases de Execução da Migração (Roadmap)

- **Onda 1: Infraestrutura de Auditoria & CI (Script + Testes)**
  - Implementação de `scripts/audit-i18n-coverage.mjs` e `scripts/audit-i18n-coverage.test.mjs`.
  - Adição de `pnpm audit:i18n` ao `package.json`.
- **Onda 2: Frequência, Registros e Portfólio (`attendance`, `records`, `portfolio`)**
- **Onda 3: Currículo e Atividades (`curriculum`, `activities`, `packs`)**
- **Onda 4: Devocional e Comparador Bíblico (`devotional`, `comparador`)**
- **Onda 5: Relatórios, Conformidade e Convites (`reports`, `compliance`, `invitations`)**

---

## 6. Governança e Regras de Qualidade

1. **Simetria Obrigatória de Dicionários:** Toda chave introduzida em `pt-BR` deve existir com valores traduzidos e idênticas variáveis de interpolação em `en-US` e `es-ES`.
2. **Zero Atribuição de IA:** Nenhum trailer de IA (`Co-Authored-By`, `Generated-By`, etc.) é permitido em commits, PRs ou código.
3. **Branch e PR:** Todo trabalho deve ser executado em branch de feature com PR squash-merged e sincronização imediata de `main` com `origin/main`.
