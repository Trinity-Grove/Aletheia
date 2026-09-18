# Design Document: Assistente de Planejamento Curricular Guiado, Blocos Progressivos com Guia Metodológico e Gerador Inteligente de Rotina Semanal

**Data:** 2026-09-18  
**Status:** Aprovado  
**Escopo:** `@aletheia/contracts`, `apps/api`, `apps/web`

---

## 1. Contexto & Problema

O Aletheia oferece modelos pedagógicos, disciplinas, objetivos de aprendizagem e grade horária semanal, mas a experiência atual opera como um banco de dados aberto (CRUD passivo):
1. **Falta de sequenciamento e metodologia nos blocos:** Os objetivos de aprendizagem aparecem em uma lista plana, sem progressão temporal (o que vem no início vs meio vs fim do ano letivo). Faltam orientações práticas sobre *como ensinar cada bloco* (métodos de narração, estudos da natureza, uso de livros vivos, atividades práticas).
2. **Síndrome da grade semanal vazia:** Para ter uma rotina semanal no `/schedule`, a família precisa cadastrar manualmente cada slot de segunda a sexta, horário por horário, sem saber quantas horas ou lições de cada disciplina são recomendadas para a idade dos filhos.
3. **Desamparo para famílias sem formação pedagógica:** Pais educadores que iniciam no homeschooling não possuem especialização em gestão curricular. Deixar o sistema 100% aberto gera insegurança e sensação de abandono.
4. **Opacidade na escolha de pacotes e templates:** Na página `/curriculum/packs` e no modal "Aplicar Modelo", os cards truncam informações essenciais, impossibilitando entender os pilares e os conteúdos antes de instalar.

---

## 2. Objetivos da Solução

1. **Transformar o Aletheia em um mentor educacional ativo:** Oferecer um **Assistente Guiado de Planejamento Familiar (Setup de 3 Passos)** que conduz a família desde a escolha da filosofia até a geração completa do currículo e da grade de horários.
2. **Organizar currículos em Blocos Progressivos com Guia "Como Ensinar":** Agrupar objetivos em blocos sequenciais acompanhados de cartões metodológicos práticos com dicas didáticas para os pais.
3. **Geração Sugestiva de Rotina Semanal com 1 Clique (Smart Routine):** Motor determinístico no backend que distribui automaticamente disciplinas, pausas de respiração, devocional diário e projetos práticos de acordo com o modelo pedagógico e a idade do educando.
4. **Transparência Total em Pacotes e Modelos:** Permitir que a família inspecione detalhadamente pilares, metodologia, disciplinas e competências tanto na Galeria de Pacotes (`/curriculum/packs`) quanto na aplicação de modelos (`/curriculum`).

---

## 3. Modelo de Dados e Contratos (`@aletheia/contracts`)

### 3.1. Blocos de Aprendizagem e Guia Metodológico
```ts
export const pedagogicalGuideSchema = z.object({
  primaryMethod: z.string(),
  recommendedPacing: z.string(),
  parentInstructions: z.string(),
  suggestedResources: z.array(z.string()).default([]),
});

export const learningBlockSchema = z.object({
  blockIndex: z.number().int().min(1),
  title: z.string(),
  pedagogicalGuide: pedagogicalGuideSchema,
  objectives: z.array(z.string()),
});

export type LearningBlockDto = z.infer<typeof learningBlockSchema>;
```

### 3.2. Motor de Sugestão de Rotina Semanal
```ts
export const suggestRoutineInputSchema = z.object({
  learnerId: z.string().uuid().optional(),
  pedagogicalModelCode: z.string().default('CHARLOTTE_MASON'),
  startHour: z.string().default('08:30'),
  lessonDurationMinutes: z.number().int().min(15).max(60).default(25),
  includeDevotional: z.boolean().default(true),
  fridaysForProjects: z.boolean().default(true),
});

export type SuggestRoutineInputDto = z.infer<typeof suggestRoutineInputSchema>;

export const suggestedRoutineSlotSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string(),
  endTime: z.string(),
  subjectName: z.string(),
  subjectColor: z.string(),
  slotType: z.enum(['INSTRUCTION', 'DEVOTIONAL', 'OUTDOOR_HABIT', 'PROJECT_TRADES']),
  notes: z.string().optional(),
});

export const suggestedRoutineResponseSchema = z.object({
  slots: z.array(suggestedRoutineSlotSchema),
  pedagogicalRationale: z.string(),
  totalInstructionalHoursWeekly: z.number(),
});

export type SuggestedRoutineResponseDto = z.infer<typeof suggestedRoutineResponseSchema>;

export const applySuggestedRoutineSchema = z.object({
  learnerId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  replaceExisting: z.boolean().default(true),
  slots: z.array(suggestedRoutineSlotSchema),
});

export type ApplySuggestedRoutineDto = z.infer<typeof applySuggestedRoutineSchema>;
```

---

## 4. Backend (`apps/api`)

### 4.1. `RoutineGeneratorService`
Localizado em `apps/api/src/modules/lessons/application/routine-generator.service.ts`:
- **Algoritmo Pedagógico de Distribuição:**
  1. Se `includeDevotional === true`, aloca bloco de Devocional Familiar às `startHour` (15 min).
  2. Aloca primeiras horas matinais para disciplinas analíticas densas (Matemática, Gramática / Linguagem).
  3. Insere pausa de transição/lanche de 15 a 20 min.
  4. Aloca bloco do meio da manhã para disciplinas narrativas e de exploração (História viva, Ciências/Natureza, Leitura em voz alta).
  5. Aloca final da manhã ou tardes para artes, ofícios práticos e música.
  6. Se `fridaysForProjects === true`, a sexta-feira é estruturada para Projetos Práticos, Estudo da Natureza e Revisão Semanal.
  7. Ajusta a alternância de disciplinas de acordo com a filosofia:
     - `CHARLOTTE_MASON`: Lições curtas de 15 a 25 min com rápida alternância de estímulos.
     - `CLASSICAL`: Foco no Trivium matinal (gramática e memorização) e leitura intensiva.
     - `MONTESSORI` / `UNIT_STUDIES`: Blocos maiores de imersão (45 a 60 min).

### 4.2. Endpoints em `ScheduleController`
- `POST /api/v1/families/:familyId/schedule/suggest-routine`: Gera a grade sem salvar, retornando `SuggestedRoutineResponseDto` para conferência do usuário.
- `POST /api/v1/families/:familyId/schedule/apply-suggested-routine`: Persiste os slots no banco de dados (`WeeklyScheduleSlot`), resolvendo os IDs de disciplinas correspondentes na família.

---

## 5. Frontend (`apps/web`)

### 5.1. `CurriculumPlanningWizardModal`
Modal em 3 passos interativos:
- **Passo 1 — Filosofia & Diagnóstico:**
  - Cards explicativos dos modelos pedagógicos com linguagem amigável.
  - Questionário opcional de 3 perguntas para recomendar a melhor abordagem a pais iniciantes.
- **Passo 2 — Currículo em Blocos Progressivos com Guia "Como Ensinar":**
  - Exibição das disciplinas estruturadas em 3 ou 4 blocos sequenciais.
  - Cartão didático em cada bloco explicando as técnicas de ensino recomendadas (ex.: narração, cadernos vivos).
  - Opção rápida para ativar ou desativar disciplinas complementares (Música, Culinária, Ofícios).
- **Passo 3 — Rotina Semanal Inteligente (1 Clique):**
  - Visualização da grade semanal sugerida com horários e disciplinas coloridas.
  - Ajuste simples do horário de início da rotina.
  - Botão de ação único: *"Aprovar e Ativar Planejamento Familiar"*.

### 5.2. Melhorias nos Painéis Existentes
- **`WeeklyRoutineGrid` (`/schedule`):**
  - Banner de auxílio quando a grade estiver vazia com o botão **"⚡ Gerar Grade Semanal Sugerida"**.
- **`CurriculumPacksGallery` (`/curriculum/packs`):**
  - Adição do botão **"Conhecer Pacote 🔍"** abrindo o novo `CurriculumPackDetailModal` com pilares metodológicos, lições estimadas e relação de conteúdos do manifesto.
- **`TemplateModal` (`/curriculum`):**
  - Visualização expansível de disciplinas e objetivos iniciais antes da confirmação.

---

## 6. Estratégia de Testes

- **`@aletheia/contracts`:** Testes de validação dos novos schemas (`routine-generator.test.ts`, `learning-block.test.ts`).
- **`apps/api`:**
  - `routine-generator.service.spec.ts`: cobertura da distribuição semanal, alternância cognitiva e modelos pedagógicos.
  - `schedule.controller.spec.ts`: cobertura das rotas de sugestão e aplicação com validação de tenant.
- **`apps/web`:**
  - `curriculum-planning-wizard.test.tsx`: testes de renderização, navegação entre os 3 passos e aplicação da rotina.
  - `curriculum-packs.test.tsx`: testes do modal de detalhamento de pacotes.

---

## 7. Critérios de Não-Regressão e Governança
- Zero trailers sintéticos de IA (`Co-Authored-By`, `Generated-By`, etc.) em commits, código ou PRs.
- 100% dos testes da suíte (`contracts`, `api`, `web`) devem passar antes do merge.
