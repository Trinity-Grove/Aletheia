# Badges e gamificação do educando

**Data:** 2026-10-05
**Status:** implementado

## Objetivo

Motivar o educando a estudar com constância e a perceber o próprio crescimento,
usando medalhas (badges), um nível de crescimento e uma sequência de estudos,
todos visíveis no Portal do Aluno (`/aluno/agenda`, aba **Conquistas**).

## Princípios

1. **Só autocomparação.** Nenhum número é comparado com outro educando. Não há
   ranking, placar nem leaderboard (guardrail "No Sibling Ranking /
   Comparisons", verificado por `pnpm check:no-sibling-comparison`).
2. **Esforço, não perfeição.** As medalhas premiam constância, trabalho feito e
   exploração. Nenhuma depende de nota.
3. **Nada é tirado.** Uma medalha ganha é permanente, mesmo que o registro que a
   desbloqueou seja apagado depois.
4. **Descanso não pune.** Fins de semana e dias marcados como feriado, doença
   ou falta justificada não quebram a sequência. O dia de hoje também não
   quebra, porque ainda não terminou.
5. **Sem trabalho extra para os pais.** Todas as métricas saem dos dados que a
   família já registra: registros de aprendizagem, frequência, evidências,
   portfólio, competências e pedidos de oração.

## Catálogo de medalhas

Fonte: `apps/api/src/modules/gamification/application/badge-catalog.ts`.
O código é um identificador persistido e não deve ser renomeado. Os textos
ficam no i18n (`learnerBadges.items.<CODE>`).

| Categoria | Código | Medalha (pt-BR) | Critério | Nível |
|---|---|---|---|---|
| Constância | `FIRST_STEP` | 🌱 Primeiro Passo | 1 dia de estudo | Bronze |
| Constância | `STREAK_3` | ✨ Faísca | sequência de 3 dias | Bronze |
| Constância | `STREAK_7` | 🔥 Chama Acesa | sequência de 7 dias | Prata |
| Constância | `STREAK_30` | 🌟 Lâmpada que Não se Apaga | sequência de 30 dias | Ouro |
| Constância | `DAYS_30` | 📅 Mês Fiel | 30 dias de estudo | Prata |
| Constância | `DAYS_100` | 🗓️ Cem Dias de Jornada | 100 dias de estudo | Ouro |
| Jornada | `LESSONS_10` | 📘 Aprendiz Dedicado | 10 atividades | Bronze |
| Jornada | `LESSONS_50` | 📚 Estudante Perseverante | 50 atividades | Prata |
| Jornada | `LESSONS_150` | 🎓 Mestre da Rotina | 150 atividades | Ouro |
| Jornada | `HOURS_10` | ⏳ 10 Horas de Estudo | 600 min | Bronze |
| Jornada | `HOURS_50` | ⌛ 50 Horas de Estudo | 3.000 min | Prata |
| Jornada | `HOURS_200` | 🕰️ 200 Horas de Estudo | 12.000 min | Ouro |
| Jornada | `READER_5` | 📖 Leitor Curioso | 5 registros de leitura | Bronze |
| Jornada | `READER_25` | 🦉 Devorador de Livros | 25 registros de leitura | Prata |
| Mãos à Obra | `FIRST_EVIDENCE` | 📸 Primeira Obra | 1 evidência enviada | Bronze |
| Mãos à Obra | `EVIDENCE_10` | 🎨 Artesão | 10 evidências enviadas | Prata |
| Mãos à Obra | `VALIDATED_10` | ✅ Trabalho Aprovado | 10 evidências validadas | Ouro |
| Mãos à Obra | `PORTFOLIO_STAR` | ⭐ Estrela do Portfólio | 1 item destacado no portfólio | Prata |
| Mãos à Obra | `PROJECT_BUILDER` | 🛠️ Construtor de Projetos | 3 registros de projeto | Prata |
| Domínio | `FIRST_MASTERY` | 🏅 Primeira Competência | 1 competência conquistada | Bronze |
| Domínio | `MASTERY_5` | 🏆 Cinco Competências | 5 competências | Prata |
| Domínio | `MASTERY_15` | 👑 Sábio em Formação | 15 competências | Ouro |
| Exploração | `EXPLORER_3` | 🧭 Explorador | 3 matérias diferentes | Bronze |
| Exploração | `EXPLORER_6` | 🗺️ Desbravador | 6 matérias diferentes | Prata |
| Caráter e Fé | `HABIT_5` | 🌿 Bom Hábito | 5 práticas de hábito | Bronze |
| Caráter e Fé | `HABIT_25` | 🌳 Raízes Profundas | 25 práticas de hábito | Prata |
| Caráter e Fé | `ANSWERED_PRAYER` | 🙏 Testemunho de Oração | 1 pedido de oração respondido | Prata |

### Métricas

| Métrica | Origem |
|---|---|
| `LEARNING_DAYS` | datas distintas de `learning_records` + frequência `PRESENT`/`FIELD_TRIP` |
| `LONGEST_STREAK` | maior sequência (regras do princípio 4) |
| `LEARNING_RECORDS` | total de `learning_records` |
| `LEARNING_MINUTES` | soma de `duration_minutes` dos registros |
| `READING_LOGS` / `PROJECTS` | registros do tipo `READING_LOG` / `PROJECT_WORK` |
| `HABIT_PRACTICES` | registros `HABIT_PRACTICE` ou com `character_habit_growth` |
| `EVIDENCE_SUBMITTED` / `EVIDENCE_VALIDATED` | `evidence_submissions` (todas / `VALIDATED`) |
| `PORTFOLIO_HIGHLIGHTS` | `portfolio_items` destacados e não excluídos |
| `COMPETENCIES_ACHIEVED` | `learner_competency_achievements` |
| `SUBJECTS_EXPLORED` | `subject_id` distintos nos registros |
| `PRAYERS_ANSWERED` | `prayer_requests` do educando com `is_answered` |

## Nível de crescimento (XP)

O XP vem só do esforço: 5 por dia de estudo, 10 por atividade, 15 por evidência
enviada, +10 quando validada, 100 por competência conquistada, mais um bônus por
medalha (Bronze 20, Prata 50, Ouro 100). Métricas derivadas (minutos, sequência,
matérias) não geram XP, para o mesmo esforço não contar duas vezes.

Os estágios seguem a imagem do Salmo 1:3, "como árvore plantada junto a
ribeiros de águas":

| Nº | Código | Estágio | XP mínimo |
|---|---|---|---|
| 1 | `SEED` | 🌰 Semente | 0 |
| 2 | `SPROUT` | 🌱 Broto | 100 |
| 3 | `SEEDLING` | 🌿 Muda | 300 |
| 4 | `SAPLING` | 🪴 Arvorezinha | 600 |
| 5 | `YOUNG_TREE` | 🌲 Árvore Jovem | 1.000 |
| 6 | `FLOURISHING_TREE` | 🌳 Árvore Frondosa | 1.600 |
| 7 | `FRUITFUL_TREE` | 🍎 Árvore Frutífera | 2.500 |
| 8 | `MIGHTY_OAK` | 🏞️ Carvalho Firme | 4.000 |

## Arquitetura

- **Módulo `gamification`** (API): `badge-catalog.ts` (dados), `badge-engine.ts`
  (regras puras: sequência, nível, resumo), `GamificationService` e
  `LearnerBadgeRepository` (leitura agregada das tabelas e escrita em
  `learner_badge_awards`). Exposto aos outros módulos só por
  `GAMIFICATION_PUBLIC_API`.
- **Avaliação na leitura.** Como o código não tem barramento de eventos e todas
  as métricas são deriváveis, ler o resumo é o que concede medalhas novas
  (`createMany ... skipDuplicates` sobre a chave única `(learner_id, badge_code)`,
  o que também deixa leituras concorrentes idempotentes).
- **Tabela `learner_badge_awards`**: append-only por (educando, medalha), com
  `acknowledged_at`, que marca quando o educando viu a celebração.

### Endpoints

| Método | Rota | Quem |
|---|---|---|
| `GET` | `/api/v1/learner-access/learners/:learnerId/badges` | educando (sessão própria) |
| `POST` | `/api/v1/learner-access/learners/:learnerId/badges/acknowledge` | educando |
| `GET` | `/api/v1/families/:familyId/learners/:learnerId/badges` | responsável |

A rota do responsável é somente leitura em relação ao `isNew`: quem consulta
não "rouba" a celebração da criança.

### Frontend

- Aba **Conquistas** no portal: cartão de estágio com barra de XP, cartão de
  sequência, contagem "X de Y" e medalhas agrupadas por categoria. Medalhas
  bloqueadas aparecem em cinza, com barra de progresso.
- Modal de celebração quando há medalhas novas. Ele é verificado ao abrir a aba,
  depois de concluir uma atividade e depois de enviar uma evidência. Se essa
  verificação falhar, nenhum erro aparece. A animação respeita
  `prefers-reduced-motion`.
- Modal de conquistas do responsável: seção "Conquistas do Portal" com o
  estágio e as medalhas já ganhas.
- Textos em `learnerBadges` (pt-BR, en-US, es-ES).

## Fora do escopo / próximos passos

- Catálogo de medalhas editável pelo backoffice (hoje fica em código).
- Medalhas personalizadas criadas pela família.
- Celebração também ao entrar no portal: hoje a verificação acontece ao abrir
  a aba e depois de concluir uma atividade ou enviar uma evidência.
- Notificação ao responsável quando o educando ganha uma medalha.
