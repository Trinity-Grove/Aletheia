# Auto-Frequência na Conclusão de Lição & Guia de Primeiros Passos — Design Specification

- **Data:** 2026-10-09
- **Status:** Aprovado
- **Autor:** Jackson Sá
- **Issue de Referência:** [#290](https://github.com/Trinity-Grove/Aletheia/issues/290) (`[ALET-B03]` e `[ALET-B04]`)

---

## 1. Contexto e Motivação

Em testes de usabilidade com famílias praticantes de homeschooling, a proposta de valor do Aletheia (gestão integrada de conteúdos, tracking com YouVersion e amparo de conformidade legal) foi fortemente validada. No entanto, dois atritos críticos de ativação e retenção foram identificados:

1. **Desorientação no Primeiro Uso (D1 Churn):**
   Ao concluir o cadastro da família e adicionar o primeiro educando, o responsável cai em um dashboard vazio sem indicação clara da ordem recomendada de ações (currículo? agenda? diário?).
2. **Sobrecarga Burocrática e Redundância Operacional (D3–D7 Churn):**
   Pais homeschoolers possuem rotinas intensas de ensino e gestão doméstica. Exigir que o responsável planeje a lição, confirme sua realização no diário e, adicionalmente, navegue até outra aba para lançar presença diária gera sentimento de retrabalho burocrático.

### Objetivos
- **Reduzir o overhead operacional a zero:** Transformar a presença diária e o portfólio em subprodutos automáticos e invisíveis do ato de ensinar. Concluir uma lição (ou registrar evidência) deve alimentar a frequência do dia sem cliques extras.
- **Guiar os primeiros passos:** Oferecer um checklist visual leve e acolhedor no topo do Dashboard com 4 marcos fundamentais, atalhos diretos e opção de dispensar a qualquer momento.

---

## 2. Contratos Compartilhados (`@aletheia/contracts`)

### 2.1 Origem da Frequência (`AttendanceSource`)
Em `packages/contracts/src/reports.ts`:

```typescript
export const attendanceSourceSchema = z.enum(['MANUAL', 'AUTO_LESSON', 'BULK_IMPORT']);
export type AttendanceSource = z.infer<typeof attendanceSourceSchema>;

// Extensão em logAttendanceSchema
export const logAttendanceSchema = z.object({
  learnerId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: attendanceStatusSchema,
  notes: z.string().max(500).optional(),
  source: attendanceSourceSchema.default('MANUAL'),
});

// Extensão em attendanceResponseSchema
export const attendanceResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  learnerId: z.string().uuid(),
  date: z.string(),
  status: attendanceStatusSchema,
  notes: z.string().nullable(),
  source: attendanceSourceSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
```

### 2.2 Estrutura do Checklist de Onboarding (`OnboardingChecklistDto`)
Em `packages/contracts/src/dashboard.ts`:

```typescript
export const onboardingStepIdSchema = z.enum([
  'create_learner',
  'choose_curriculum',
  'schedule_lesson',
  'complete_first_activity',
]);
export type OnboardingStepId = z.infer<typeof onboardingStepIdSchema>;

export const onboardingStepSchema = z.object({
  id: onboardingStepIdSchema,
  completed: z.boolean(),
  actionUrl: z.string(),
});
export type OnboardingStepDto = z.infer<typeof onboardingStepSchema>;

export const onboardingChecklistSchema = z.object({
  dismissed: z.boolean(),
  completedCount: z.number().int().min(0).max(4),
  totalCount: z.literal(4),
  steps: z.array(onboardingStepSchema).length(4),
});
export type OnboardingChecklistDto = z.infer<typeof onboardingChecklistSchema>;

// dashboardResponseSchema ganha onboarding opcional
export const dashboardResponseSchema = z.object({
  date: dashboardDateSchema,
  family: z.object({ id: z.string().uuid(), name: z.string() }),
  learners: z.array(z.object({ id: z.string().uuid(), displayName: z.string() })),
  activeLearnerId: z.string().uuid().nullable(),
  journey: z.object({
    completedMinutes: z.number().int().min(0),
    targetMinutes: z.number().int().min(0),
    completedLessons: z.number().int().min(0),
    totalLessons: z.number().int().min(0),
    daySequence: z.number().int().min(0),
  }),
  activities: z.array(dashboardActivitySchema),
  onboarding: onboardingChecklistSchema.optional(),
});
```

### 2.3 Preferência de Ocultação do Guia (`FamilySettings`)
Em `packages/contracts/src/settings.ts`:
- Adicionar `onboardingDismissed: z.boolean().optional()` tanto em `familySettingsResponseSchema` quanto em `updateFamilySettingsSchema`.

---

## 3. Modelo de Dados e Banco de Dados (`apps/api/prisma`)

### 3.1 Alterações no Schema Prisma
Em `apps/api/prisma/schema.prisma`:

1. Na tabela `attendance_records`:
   ```prisma
   source String @default("MANUAL") @db.VarChar(32)
   ```
2. Na tabela `family_settings`:
   ```prisma
   onboardingDismissed Boolean @default(false)
   ```

### 3.2 Migração de Banco de Dados
- Migração limpa gerada via Prisma CLI (`add_auto_attendance_and_onboarding_dismissed`).
- Adiciona valores padrão retrocompatíveis para registros pré-existentes (`source = 'MANUAL'`, `onboardingDismissed = false`).

---

## 4. Lógica de Backend e Limites Modulares

### 4.1 Orquestração da Auto-Frequência (`LessonPlanService`)
Local: `apps/api/src/modules/lessons/application/lesson-plan.service.ts`

- **Injeção Modular:**
  ```typescript
  @Optional()
  @Inject(COMPLIANCE_REPORTS_PUBLIC_API)
  private readonly complianceApi?: ComplianceReportsPublicApi,
  ```
- **Conformidade de Limites:**
  O arquivo `lessons.module.ts` importa `ReportsModule`. O script `scripts/check-module-boundaries.mjs` valida isso como composição canônica de módulos Nest e uso de `application/public-api`.

- **Fluxo do Método `completeLesson`:**
  1. Conclui a lição e atualiza `completedAt`.
  2. Cria o registro no diário de aprendizagem via `recordsApi`.
  3. Invoca `autoLogAttendanceForCompletion(familyId, response, learnerId, completedAt)`.
  4. Retorna a resposta da lição.

- **Regras de Negócio do Auto-Log:**
  ```typescript
  private async autoLogAttendanceForCompletion(
    familyId: string,
    lesson: LessonPlanResponseDto,
    learnerId?: string,
    completedAt: Date = new Date(),
  ): Promise<void> {
    if (!this.complianceApi) return;
    const targetLearnerId = learnerId ?? lesson.learnerId;
    if (!targetLearnerId) return;

    const dateStr = completedAt.toISOString().slice(0, 10);

    try {
      const existingRecords = await this.complianceApi.listAttendance(familyId, {
        learnerId: targetLearnerId,
        date: dateStr,
      });

      // Se já existe registro para o educando nesta data
      if (existingRecords.length > 0) {
        const primary = existingRecords[0];
        // Se já está PRESENT, operação é estritamente idempotente
        if (primary.status === 'PRESENT') return;
        // Se o pai marcou ABSENT ou EXCUSED explicitamente, respeita a decisão manual
        return;
      }

      // Se não há registro, registra a presença automaticamente
      await this.complianceApi.logAttendance(familyId, {
        learnerId: targetLearnerId,
        date: dateStr,
        status: 'PRESENT',
        source: 'AUTO_LESSON',
        notes: `Presença registrada automaticamente pela conclusão da lição "${lesson.title}".`,
      });
    } catch (error) {
      // Falha transiente na frequência não pode bloquear a conclusão da lição
      this.logger.warn(`Falha ao registrar auto-frequência para lição ${lesson.id}: ${error}`);
    }
  }
  ```

### 4.2 Lógica do Checklist no `DashboardService`
Local: `apps/api/src/modules/dashboard/application/dashboard.service.ts`

- Avaliação dos 4 passos:
  1. `create_learner`: `learners.length > 0` (ação: `/learners`)
  2. `choose_curriculum`: Família possui ao menos 1 objetivo ou trilha em andamento (`curriculumObjectivesCount > 0` via `CurriculumPublicApi` ou checagem de objetivos vinculados) (ação: `/curriculum`)
  3. `schedule_lesson`: Atividades agendadas na data ou planos na agenda (`activities.length > 0` ou agendamentos futuros) (ação: `/schedule`)
  4. `complete_first_activity`: `journey.completedLessons > 0` (ação: `/aluno/agenda` ou dashboard)
- Se a preferência `onboardingDismissed` da família for `true` ou se os 4 passos já estiverem concluídos, o payload retorna `dismissed: true` ou `completedCount: 4`.

---

## 5. Interface de Usuário & Experiência (`apps/web`)

### 5.1 Componente `<GettingStartedCard>`
Local: `apps/web/src/components/dashboard/getting-started-card.tsx`

- Renderizado no topo da página `apps/web/app/(dashboard)/page.tsx`.
- Visibilidade: Exibido apenas se `onboarding && !onboarding.dismissed && onboarding.completedCount < 4`.
- Elementos visuais:
  - Header: Ícone ilustrativo (`Compass`), título e subtítulo amigáveis, e botão de fechar (`X` / "Ocultar guia").
  - Barra de progresso visual com Tailwind (`bg-emerald-500`) indicando `completedCount / totalCount`.
  - Grid ou lista dos 4 cartões com ícones de estado:
    - Estado concluído: Check verde preenchido, texto em tom suave.
    - Estado atual pendente: Destaque com borda primária e botão de ação (*"Ir para a ação"*, *"Explorar currículos"*, etc.).
- Ação de dispensar: Faz `PATCH /families/:familyId/settings` com `{ onboardingDismissed: true }` e remove o card da visualização com transição suave.

### 5.2 Feedback de Auto-Frequência
1. **No Modal de Conclusão de Lição (`learner-reflection-modal.tsx`):**
   - Ao confirmar a reflexão ou conclusão da lição, mensagem de sucesso explícita:
     *"✓ Lição concluída! A presença do educando foi registrada automaticamente para o dia de hoje."*
2. **Na Tabela de Frequência (`attendance-tracker-view.tsx`):**
   - Na listagem de registros, se `source === 'AUTO_LESSON'`, exibir badge visual:
     `<Badge variant="outline" className="text-xs">Auto (Lição)</Badge>`

---

## 6. Internacionalização (i18n)

Todas as novas strings são inseridas simetricamente nos dicionários:
- `apps/web/src/lib/i18n/dictionaries/pt-BR/dashboard.ts`, `en-US/dashboard.ts`, `es-ES/dashboard.ts`:
  - `dashboard.gettingStarted.title`
  - `dashboard.gettingStarted.subtitle`
  - `dashboard.gettingStarted.progress`
  - `dashboard.gettingStarted.dismiss`
  - `dashboard.gettingStarted.steps.createLearner.title`
  - `dashboard.gettingStarted.steps.createLearner.description`
  - `dashboard.gettingStarted.steps.chooseCurriculum.title`
  - `dashboard.gettingStarted.steps.chooseCurriculum.description`
  - `dashboard.gettingStarted.steps.scheduleLesson.title`
  - `dashboard.gettingStarted.steps.scheduleLesson.description`
  - `dashboard.gettingStarted.steps.completeFirstActivity.title`
  - `dashboard.gettingStarted.steps.completeFirstActivity.description`
- `apps/web/src/lib/i18n/dictionaries/*/lessons.ts`:
  - `lessons.completion.autoAttendanceNotice`
- `apps/web/src/lib/i18n/dictionaries/*/reports.ts`:
  - `reports.attendance.source.autoLesson`
  - `reports.attendance.source.manual`

Cobertura verificada por `node scripts/audit-i18n-coverage.mjs` mantendo 100.0% e 0 pendências.

---

## 7. Critérios de Aceite e Verificação

1. **Auto-Frequência:**
   - [ ] Concluir uma lição (`completeLesson`) com data de hoje sem registro prévio cria registro em `attendance_records` com `status: 'PRESENT'` e `source: 'AUTO_LESSON'`.
   - [ ] Concluir múltiplas lições no mesmo dia não duplica registros de presença (idempotência confirmada).
   - [ ] Se o dia já possuir registro manual `ABSENT` ou `EXCUSED`, o auto-log não sobrescreve a anotação manual dos pais.
   - [ ] Erros no módulo de frequência são capturados sem quebrar a conclusão da lição.
2. **Checklist de Primeiros Passos:**
   - [ ] Família recém-criada visualiza os 4 passos no Dashboard.
   - [ ] Conforme passos são executados, barra de progresso e checkboxes atualizam corretamente.
   - [ ] Clicar em "Ocultar guia" persiste `onboardingDismissed: true` e esconde o card.
3. **Portões de Qualidade:**
   - [ ] `pnpm check:boundaries` aprova 14/14 testes.
   - [ ] `pnpm -r --workspace-concurrency=1 typecheck` com 0 erros.
   - [ ] `pnpm lint` com 0 erros nos 6 pacotes do workspace.
   - [ ] Testes unitários Jest (`src/modules/lessons`) e de integração com Postgres real verdes.
   - [ ] Testes Vitest da web verdes com cobertura do `<GettingStartedCard>`.
   - [ ] ZERO trailers de atribuição de IA em commits, comentários ou PRs.
