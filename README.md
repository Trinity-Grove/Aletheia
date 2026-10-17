# Aletheia

<div align="center">

> **A parent-first platform for faithful, thoughtful home education.**  
> *Uma plataforma soberana e centrada na família para a educação domiciliar cristã e clássica.*

[![CI](https://github.com/Trinity-Grove/Aletheia/actions/workflows/ci.yml/badge.svg)](https://github.com/Trinity-Grove/Aletheia/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24-brightgreen?logo=node.js)](package.json)
[![pnpm](https://img.shields.io/badge/pnpm-11-orange?logo=pnpm)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](tsconfig.json)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](apps/web)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)](apps/api)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](prisma)
[![i18n](https://img.shields.io/badge/i18n-100%25%20(pt--BR%20%7C%20en--US%20%7C%20es--ES)-059669)](apps/web/src/lib/i18n)
[![Architecture](https://img.shields.io/badge/Hexagonal%20Boundaries-14%2F14%20Pass-7C3AED)](scripts/check-module-boundaries.mjs)

<br />

[Visão Geral](#-visão-geral) • [Funcionalidades](#-principais-funcionalidades) • [Arquitetura](#-arquitetura--monorepo) • [Guia Rápido](#-guia-rápido) • [Testes & Qualidade](#-testes--qualidade) • [Licença](#-licença)

</div>

---

## 📖 Visão Geral

O **Aletheia** é uma plataforma aberta, soberana e profundamente pedagógica projetada para servir famílias educadoras em todo o mundo. Construído sobre uma **arquitetura hexagonal rigorosa** e isolamento absoluto de dados entre lares (*multi-tenant family boundary*), o Aletheia combina:

- **Espiritualidade e Vida em Família:** Devocionais diários, mural de orações e comparador de traduções bíblicas.
- **Riqueza Pedagógica:** Amparo aos métodos Clássico (*Trivium*), Charlotte Mason (*livros vivos, estudos da natureza, narração oral e hábitos*) e Tradicional/Eclético.
- **Mural de Inspiração Comunitária:** Compartilhamento anônimo e voluntário de atividades práticas e adoção em 1 clique para a agenda da família.
- **Segurança Jurídica & Primeiros Passos:** Dossiê anual de conformidade, metas de dias/horas por jurisdição e checklist interativo dos primeiros 30 dias.
- **Avaliação Não-Punitiva:** Domínio qualitativo de competências, portfólio multimídia de evidências e zero ranqueamento entre irmãos.
- **Soberania Digital:** Exportação integral dos dados familiares em formato JSON aberto e portabilidade irrestrita.

> **Status do Projeto:** O Aletheia é um projeto open-source sob licença MIT em desenvolvimento ativo pela comunidade. Não há planos de assinatura ou recursos pagos — veja as [Issues Abertas](https://github.com/Trinity-Grove/Aletheia/issues) para acompanhar nosso roadmap.

---

## ✨ Principais Funcionalidades

### 🌿 1. Mural de Inspiração & Hub Comunitário
- **Descoberta por Pilares Pedagógicos:** Filtros rápidos com contadores para *Estudos da Natureza*, *Leituras Vivas*, *Trabalhos Manuais*, *História Estacional* e *Projetos em Família*.
- **Acervo Semente Curado:** Ideias ricas e prontas para uso, com lista de materiais domésticos, duração e faixa etária.
- **Adoção em 1 Clique:** Criação de cópias privadas e isoladas diretamente no tenant e na agenda da família.
- **Compartilhamento Anônimo:** As famílias compartilham ideias práticas sem qualquer exposição de nomes, filhos ou dados pessoais.

### ⚖️ 2. Hub 'Por Onde Começar' & Amparo Legal
- **Enquadramento Constitucional & Jurisprudência:** Fundamentação jurídica nos arts. 226/229 da CF/88 e no julgamento do STF (RE 888.815).
- **Metas Anuais da Jurisdição:** Acompanhamento automático de 200 dias letivos e 800 horas anuais.
- **Checklist dos Primeiros 30 Dias:** 6 etapas interativas com persistência local e auto-detecção de educandos cadastrados.
- **Dossiê de Conformidade Anual:** Emissão consolidada de evidências com hash verificável para prestação de contas.

### 🧭 3. Tour Interativo Guiado (Spotlight)
- **Onboarding Acolhedor:** Destaque dinâmico de elementos-chave da tela com efeito de foco e backdrop escuro.
- **Gamificação de Boas-Vindas:** Atribuição da insígnia *"Primeiro Passo"* ao concluir o tour.
- **Autonomia Total:** Controle para reativar o tour a qualquer momento na barra superior ou nas configurações da família.

### 📚 4. Currículo & Planejamento de Rotinas
- **Assistente de Planejamento Curricular:** Diagnóstico da filosofia educacional da família e blocos pedagógicos estruturados.
- **Grade Curricular Flexível:** Suporte a múltiplos anos letivos, matérias e árvores hierárquicas de objetivos de aprendizagem.
- **Agenda de Estudos e Rotina Inteligente:** Planejamento semanal por blocos de horários e checklist diário de lições por educando.

### 📖 5. Devocional Familiar & Comparador Bíblico
- **Devocional Diário:** Leitura bíblica integrada com versículo do dia, anotações de reflexão e oração em família.
- **Comparador Bíblico Lado a Lado:** Análise comparativa entre diferentes traduções bíblicas para estudo aprofundado.
- **Mural de Oração:** Registro de pedidos, tags de acompanhamento e celebração de orações respondidas.

### 🎓 6. Portal do Educando (Modo Aluno) & Gamificação
- **Interface Focada:** Visão dedicada para a criança realizar suas lições, registrar narrações orais e reflexões diárias.
- **Insígnias e Conquistas:** Incentivos lúdicos e construtivos baseados em hábitos, constância e crescimento pessoal.

### 🎨 7. Diário de Aprendizagem & Portfólio de Evidências
- **Avaliação Qualitativa:** Progressão pedagógica positiva (*Exposição*, *Em Desenvolvimento*, *Com Auxílio*, *Autônomo*, *Dominado*).
- **Galeria de Evidências Multimídia:** Upload e organização de fotos, áudios, textos e documentos com marcação de destaques.

### 🌐 8. Internacionalização Integral (i18n)
- **100% de Cobertura Simétrica:** Suporte completo e paritário a Português do Brasil (`pt-BR`), Inglês (`en-US`) e Espanhol (`es-ES`).
- **Auditoria Automatizada:** Scanner estático (`audit-i18n-coverage.mjs`) garantindo zero strings hardcoded na interface.

---

## 🏛️ Arquitetura & Monorepo

O Aletheia adota o modelo de **Monorepo pnpm** com separação estrita de camadas e limites de dependência verificados via CI:

```
aletheia/
├── apps/
│   ├── api/          # Backend NestJS 11 + Fastify, Prisma ORM, PostgreSQL (Arquitetura Hexagonal)
│   └── web/          # Frontend Next.js 15 (App Router, Turbopack), React 19, BEM Design System
├── packages/
│   ├── contracts/    # Contratos de Domínio compartilhados, DTOs & Schemas de Validação Zod
│   ├── ui/           # Biblioteca de Componentes de Design System e Ícones (@aletheia/ui)
│   ├── eslint-config/# Configurações compartilhadas de ESLint 9 Flat Config
│   └── tsconfig/     # Configurações TypeScript estritas (exactOptionalPropertyTypes: true)
├── docs/             # Especificações de arquitetura, ADRs e planos de implementação
└── scripts/          # Verificação de fronteiras modulares, auditoria i18n e integridade
```

### Stack Tecnológica

| Camada | Tecnologia | Detalhes |
| :--- | :--- | :--- |
| **Linguagem** | TypeScript 5.9 | Modo estrito, `exactOptionalPropertyTypes: true`, `noImplicitAny` |
| **Backend** | NestJS 11 + Fastify | Alta performance, modular, injeção de dependência nativa |
| **Banco de Dados** | PostgreSQL 16 + Prisma ORM | Modelagem relacional estrita, migrações automatizadas |
| **Frontend** | Next.js 15 + React 19 | Server & Client Components, Turbopack, App Router |
| **Design System** | `@aletheia/ui` + BEM CSS | Tokens semânticos, acessibilidade, zero dependência de utilitários no JSX |
| **Testes** | Vitest + Jest + Supertest | Testes unitários de alta velocidade, integração de API e componentes |
| **Governança** | Node Test Runner + ESLint 9 | Verificação de fronteiras modulares (14/14 regras) e auditoria i18n contínua |

---

## 🛡️ Princípios & Salvaguardas Éticas

- 🚫 **Proibição de Ranqueamento entre Irmãos:** É proibido por design qualquer gráfico comparativo de desempenho ou ranking entre filhos.
- 💚 **Avaliação Não-Punitiva:** O aprendizado foca na maestria qualitativa e no encorajamento do caráter.
- 🔒 **Privacidade Absoluta:** O isolamento multi-tenant assegura que nenhum dado familiar vaze entre contas.
- 📂 **Soberania dos Dados:** As famílias têm a garantia de exportar todo o seu histórico em formato aberto a qualquer momento.

---

## 🚀 Guia Rápido

### Pré-requisitos
- **Node.js:** `>= 24.18.1 < 25` (ou Node 22+)
- **pnpm:** `>= 9.0.0` (recomendado: `pnpm 11`)
- **PostgreSQL:** `>= 16.0` (ou via Docker Compose)

### 1. Clonar o Repositório e Instalar Dependências

```bash
git clone git@github.com:Trinity-Grove/Aletheia.git
cd Aletheia
pnpm install
```

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env` em `apps/api/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aletheia?schema=public"
JWT_SECRET="sua-chave-secreta-jwt-super-segura"
PORT=3333
NODE_ENV=development
```

### 3. Banco de Dados e Migrações

```bash
# Gerar o cliente Prisma
pnpm prisma:generate

# Aplicar migrações ao banco de dados
pnpm --filter @aletheia/api prisma migrate deploy
```

### 4. Executar os Servidores de Desenvolvimento

```bash
# Inicia simultaneamente o Frontend (porta 3000) e a API (porta 3333):
pnpm dev
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **API Backend:** [http://localhost:3333](http://localhost:3333)
- **Documentação Swagger:** [http://localhost:3333/api/docs](http://localhost:3333/api/docs)

---

## 🧪 Testes & Qualidade

O projeto conta com uma esteira rigorosa de validação local e em CI:

```bash
# Executa a esteira completa de verificação (fronteiras, lint, types, testes e build)
pnpm verify

# Validação de fronteiras modulares hexagonais (14 verificações estritas)
pnpm check:boundaries

# Auditoria estática de internacionalização (100% de cobertura nos 3 idiomas)
pnpm audit:i18n

# Verificação de tipos TypeScript em todo o monorepo
pnpm typecheck

# Linter em todos os pacotes
pnpm lint

# Testes unitários de contratos
pnpm --filter @aletheia/contracts test

# Testes de componentes frontend
pnpm --filter @aletheia/web test

# Testes E2E da API
pnpm --filter @aletheia/api test:e2e
```

---

## 🤝 Como Contribuir

Contribuições são muito bem-vindas! Se você deseja colaborar:
1. Faça um Fork do projeto.
2. Crie uma branch para a sua feature (`git checkout -b feat/minha-melhoria`).
3. Certifique-se de que `pnpm verify` e `pnpm check:boundaries` passam com 100% de sucesso.
4. Abra um Pull Request detalhado com a descrição das mudanças.

---

## 📄 Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).
