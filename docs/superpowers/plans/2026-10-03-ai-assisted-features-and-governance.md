# Recursos Assistidos por IA & Governança Pedagógica (Fase 2 da Issue #252) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o subsistema de Inteligência Artificial assistida com governança human-in-the-loop, proteção de dados de crianças (COPPA/LGPD), mitigação ativa de prompt injection, controle de cotas de tokens e auditoria completa de sugestões de planos de aula.

**Architecture:** Módulo centralizado `AiModule` em `apps/api/src/modules/ai` expondo `AI_PUBLIC_API` via `application/public-api.ts`. Integra-se a `PrivacyPublicApi` para validação de consentimento parental obrigatório, aplica pseudonimização transitória em memória antes de despachar chamadas a um gateway de provedor agnóstico (`LlmProvider`: `MockLlmProvider` determinístico e `OpenAiCompatibleProvider`), audita rascunhos na tabela `ai_suggestions` com status `PENDING_REVIEW`, e só cria lições oficiais em `modules/lessons` após revisão e aprovação humana explícita (`ACCEPT` ou `MODIFY`).

**Tech Stack:** TypeScript 5.9, NestJS 11, Prisma 6, PostgreSQL, Zod 3, Next.js 16 App Router, React Testing Library, Jest.

**Spec:** `docs/superpowers/specs/2026-10-03-ai-assisted-features-and-governance-design.md`

## Global Constraints
- ZERO AI attribution trailers (`Co-Authored-By`, `Generated-By`, etc.) in commits, comments, and PRs.
- TypeScript 5.9 strict typing, NodeNext imports with explicit `.js` extensions in backend packages.
- Strict 100% i18n parity across `pt-BR`, `en-US`, and `es-ES`.
- Clean module boundaries (`pnpm check:boundaries` passing 14/14).
- Offline determinism: All automated unit and integration tests must run without external network access or real API keys using `MockLlmProvider`.
- Under NO circumstances can an AI draft be published or scheduled automatically without explicit human review.

---

### Task 1: Contratos Zod em `@aletheia/contracts` (`ai.ts`)

**Files:**
- Create: `packages/contracts/src/ai.ts`
- Create: `packages/contracts/src/ai.test.ts`
- Modify: `packages/contracts/src/index.ts`

**Interfaces:**
- Consumes: `@aletheia/contracts` standard patterns.
- Produces: `AiSuggestionStatus`, `AiFeatureType`, `AiProviderName`, `GenerateLessonPlanDraftRequestDto`, `AiLessonPlanDraftResponseDto`, `ReviewAiSuggestionRequestDto`, `AiUsageQuotaResponseDto`.

- [ ] **Step 1: Escrever testes unitários que falham em `packages/contracts/src/ai.test.ts`**

```typescript
import { describe, it, expect } from '@jest/globals';
import {
  generateLessonPlanDraftRequestSchema,
  reviewAiSuggestionRequestSchema,
  aiLessonPlanDraftResponseSchema,
  aiUsageQuotaResponseSchema,
} from './ai.js';

describe('AI Contracts Zod Schemas', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  describe('generateLessonPlanDraftRequestSchema', () => {
    it('should validate valid request', () => {
      const parsed = generateLessonPlanDraftRequestSchema.safeParse({
        learnerId: validUuid,
        subject: 'História',
        topic: 'Civilização Grega',
        targetAge: 10,
        gradeLevel: '5º Ano',
        durationMinutes: 45,
        objectives: ['Compreender a pólis'],
        additionalInstructions: 'Focar em Atenas',
      });
      expect(parsed.success).toBe(true);
    });

    it('should reject duration under 5 minutes or over 240 minutes', () => {
      expect(
        generateLessonPlanDraftRequestSchema.safeParse({
          learnerId: validUuid,
          subject: 'História',
          topic: 'Civilização Grega',
          durationMinutes: 3,
        }).success,
      ).toBe(false);

      expect(
        generateLessonPlanDraftRequestSchema.safeParse({
          learnerId: validUuid,
          subject: 'História',
          topic: 'Civilização Grega',
          durationMinutes: 300,
        }).success,
      ).toBe(false);
    });

    it('should reject invalid learner UUID', () => {
      expect(
        generateLessonPlanDraftRequestSchema.safeParse({
          learnerId: 'not-a-uuid',
          subject: 'História',
          topic: 'Civilização Grega',
        }).success,
      ).toBe(false);
    });
  });

  describe('reviewAiSuggestionRequestSchema', () => {
    it('should validate ACCEPT action', () => {
      const parsed = reviewAiSuggestionRequestSchema.safeParse({
        action: 'ACCEPT',
      });
      expect(parsed.success).toBe(true);
    });

    it('should validate MODIFY action with finalContent', () => {
      const parsed = reviewAiSuggestionRequestSchema.safeParse({
        action: 'MODIFY',
        finalContent: {
          title: 'História Ajustada',
          summary: 'Resumo editado',
          materials: ['Livro'],
          steps: [{ order: 1, title: 'Início', durationMinutes: 15, instructions: 'Ler' }],
        },
      });
      expect(parsed.success).toBe(true);
    });

    it('should reject MODIFY action without finalContent', () => {
      const parsed = reviewAiSuggestionRequestSchema.safeParse({
        action: 'MODIFY',
      });
      expect(parsed.success).toBe(false);
    });

    it('should validate REJECT action with optional reason', () => {
      const parsed = reviewAiSuggestionRequestSchema.safeParse({
        action: 'REJECT',
        rejectionReason: 'Muito complexo para a idade',
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe('aiLessonPlanDraftResponseSchema', () => {
    it('should validate draft response payload', () => {
      const parsed = aiLessonPlanDraftResponseSchema.safeParse({
        suggestionId: validUuid,
        status: 'PENDING_REVIEW',
        draft: {
          title: 'Aula de História',
          summary: 'Visão geral da Grécia antiga',
          materials: ['Mapas', 'Caderno'],
          steps: [
            {
              order: 1,
              title: 'Introdução',
              durationMinutes: 10,
              instructions: 'Apresentar o mapa',
              narrationPrompt: 'O que você notou no relevo grego?',
            },
          ],
          assessmentObservations: 'Verificar interesse e compreensão oral.',
        },
        metadata: {
          provider: 'MOCK',
          model: 'mock-deterministic',
          promptTokens: 120,
          completionTokens: 250,
          estimatedCostMicrosUsd: 0,
        },
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe('aiUsageQuotaResponseSchema', () => {
    it('should validate quota response', () => {
      const parsed = aiUsageQuotaResponseSchema.safeParse({
        familyId: validUuid,
        period: '2026-10',
        tokensUsed: 15000,
        tokensLimit: 100000,
        requestsUsed: 12,
        requestsLimit: 200,
        resetAt: new Date().toISOString(),
      });
      expect(parsed.success).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Executar teste para verificar falha (RED)**

```bash
pnpm --filter @aletheia/contracts test -- src/ai.test.ts
```
Esperado: FALHA com erro "Cannot find module './ai.js'".

- [ ] **Step 3: Implementar `packages/contracts/src/ai.ts` e exportar em `index.ts`**

Em `packages/contracts/src/ai.ts`:
```typescript
import { z } from 'zod';

export const aiSuggestionStatusSchema = z.enum([
  'PENDING_REVIEW',
  'ACCEPTED',
  'MODIFIED',
  'REJECTED',
]);
export type AiSuggestionStatus = z.infer<typeof aiSuggestionStatusSchema>;

export const aiFeatureTypeSchema = z.enum([
  'LESSON_PLAN_DRAFT',
  'ACTIVITY_ADAPTATION',
]);
export type AiFeatureType = z.infer<typeof aiFeatureTypeSchema>;

export const aiProviderNameSchema = z.enum(['MOCK', 'OPENAI', 'ANTHROPIC', 'GEMINI']);
export type AiProviderName = z.infer<typeof aiProviderNameSchema>;

export const generateLessonPlanDraftRequestSchema = z.object({
  learnerId: z.string().uuid(),
  subject: z.string().min(2).max(80),
  topic: z.string().min(3).max(200),
  targetAge: z.number().int().min(3).max(25).optional(),
  gradeLevel: z.string().max(60).optional(),
  durationMinutes: z.number().int().min(5).max(240).default(45),
  objectives: z.array(z.string().min(2).max(200)).max(10).optional(),
  additionalInstructions: z.string().max(1000).optional(),
});
export type GenerateLessonPlanDraftRequestDto = z.infer<
  typeof generateLessonPlanDraftRequestSchema
>;

export const lessonPlanDraftStepSchema = z.object({
  order: z.number().int().min(1),
  title: z.string().min(2).max(120),
  durationMinutes: z.number().int().min(1).max(240),
  instructions: z.string().min(5),
  narrationPrompt: z.string().max(300).optional(),
});
export type LessonPlanDraftStep = z.infer<typeof lessonPlanDraftStepSchema>;

export const lessonPlanDraftContentSchema = z.object({
  title: z.string().min(3).max(150),
  summary: z.string().min(10),
  materials: z.array(z.string().min(1)).default([]),
  steps: z.array(lessonPlanDraftStepSchema).min(1),
  assessmentObservations: z.string().optional(),
});
export type LessonPlanDraftContent = z.infer<typeof lessonPlanDraftContentSchema>;

export const aiLessonPlanDraftResponseSchema = z.object({
  suggestionId: z.string().uuid(),
  status: z.literal('PENDING_REVIEW'),
  draft: lessonPlanDraftContentSchema,
  metadata: z.object({
    provider: z.string(),
    model: z.string(),
    promptTokens: z.number().int().nonnegative(),
    completionTokens: z.number().int().nonnegative(),
    estimatedCostMicrosUsd: z.number().int().nonnegative(),
  }),
});
export type AiLessonPlanDraftResponseDto = z.infer<
  typeof aiLessonPlanDraftResponseSchema
>;

export const reviewAiSuggestionRequestSchema = z
  .object({
    action: z.enum(['ACCEPT', 'MODIFY', 'REJECT']),
    scheduledDate: z.string().datetime().optional(),
    finalContent: lessonPlanDraftContentSchema.optional(),
    rejectionReason: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.action === 'MODIFY' && !data.finalContent) {
        return false;
      }
      return true;
    },
    {
      message: 'finalContent is required when action is MODIFY',
      path: ['finalContent'],
    },
  );
export type ReviewAiSuggestionRequestDto = z.infer<
  typeof reviewAiSuggestionRequestSchema
>;

export const aiUsageQuotaResponseSchema = z.object({
  familyId: z.string().uuid(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  tokensUsed: z.number().int().nonnegative(),
  tokensLimit: z.number().int().positive(),
  requestsUsed: z.number().int().nonnegative(),
  requestsLimit: z.number().int().positive(),
  resetAt: z.string().datetime(),
});
export type AiUsageQuotaResponseDto = z.infer<typeof aiUsageQuotaResponseSchema>;
```

Atualizar `packages/contracts/src/index.ts` adicionando exportações de `./ai.js`.

- [ ] **Step 4: Executar testes e build para verificar sucesso (GREEN)**

```bash
pnpm --filter @aletheia/contracts test
pnpm --filter @aletheia/contracts build
```
Esperado: Todos os testes passam (100% GREEN) e pacote compilado com sucesso.

- [ ] **Step 5: Commit das alterações**

```bash
git add packages/contracts/src/ai.ts packages/contracts/src/ai.test.ts packages/contracts/src/index.ts
git commit -m "feat(contracts): add ai suggestion, draft review, and quota schemas"
```

---

### Task 2: Modelagem Prisma e Migração de Banco de Dados (`apps/api`)

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20261003140000_add_ai_suggestions_and_usage/migration.sql`

**Interfaces:**
- Consumes: Modelos `Family`, `Learner`, `User` em `schema.prisma`.
- Produces: Tabelas `ai_suggestions` e `ai_family_usages` com índices e integridade referencial.

- [ ] **Step 1: Adicionar enums e modelos em `apps/api/prisma/schema.prisma`**

No arquivo `apps/api/prisma/schema.prisma`:
```prisma
enum AiSuggestionStatus {
  PENDING_REVIEW
  ACCEPTED
  MODIFIED
  REJECTED

  @@map("ai_suggestion_statuses")
}

enum AiFeatureType {
  LESSON_PLAN_DRAFT
  ACTIVITY_ADAPTATION

  @@map("ai_feature_types")
}

model AiSuggestion {
  id                 String             @id @default(uuid()) @db.Uuid
  familyId           String             @map("family_id") @db.Uuid
  learnerId          String?            @map("learner_id") @db.Uuid
  actorUserId        String             @map("actor_user_id") @db.Uuid
  featureType        AiFeatureType      @map("feature_type")
  status             AiSuggestionStatus @default(PENDING_REVIEW)
  sanitizedPrompt    String             @map("sanitized_prompt") @db.Text
  rawModelOutput     Json               @map("raw_model_output")
  finalHumanOutput   Json?              @map("final_human_output")
  createdEntityId    String?            @map("created_entity_id") @db.Uuid
  provider           String             @db.VarChar(50)
  model              String             @db.VarChar(100)
  promptTokens       Int                @map("prompt_tokens")
  completionTokens   Int                @map("completion_tokens")
  costMicrosUsd      Int                @map("cost_micros_usd")
  rejectionReason    String?            @map("rejection_reason") @db.VarChar(500)
  reviewedAt         DateTime?          @map("reviewed_at") @db.Timestamptz
  createdAt          DateTime           @default(now()) @map("created_at") @db.Timestamptz

  family             Family             @relation(fields: [familyId], references: [id], onDelete: Cascade)
  learner            Learner?           @relation(fields: [learnerId], references: [id], onDelete: SetNull)
  actor              User               @relation(fields: [actorUserId], references: [id], onDelete: Restrict)

  @@index([familyId, createdAt])
  @@index([learnerId, createdAt])
  @@index([status])
  @@map("ai_suggestions")
}

model AiFamilyUsage {
  id            String   @id @default(uuid()) @db.Uuid
  familyId      String   @map("family_id") @db.Uuid
  period        String   @db.VarChar(7)
  tokensUsed    Int      @default(0) @map("tokens_used")
  tokensLimit   Int      @default(100000) @map("tokens_limit")
  requestsUsed  Int      @default(0) @map("requests_used")
  requestsLimit Int      @default(200) @map("requests_limit")
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz

  family        Family   @relation(fields: [familyId], references: [id], onDelete: Cascade)

  @@unique([familyId, period])
  @@index([familyId])
  @@map("ai_family_usages")
}
```

E adicionar os relations inversos nos modelos `Family`, `Learner` e `User`:
- Em `Family`:
  `aiSuggestions AiSuggestion[]`
  `aiFamilyUsages AiFamilyUsage[]`
- Em `Learner`:
  `aiSuggestions AiSuggestion[]`
- Em `User`:
  `aiSuggestionsCreated AiSuggestion[]`

- [ ] **Step 2: Gerar arquivo de migração SQL `apps/api/prisma/migrations/20261003140000_add_ai_suggestions_and_usage/migration.sql`**

Criar arquivo SQL correspondente para criação dos tipos e tabelas com foreign keys corretas:
```sql
-- CreateEnum
CREATE TYPE "ai_suggestion_statuses" AS ENUM ('PENDING_REVIEW', 'ACCEPTED', 'MODIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ai_feature_types" AS ENUM ('LESSON_PLAN_DRAFT', 'ACTIVITY_ADAPTATION');

-- CreateTable
CREATE TABLE "ai_suggestions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "learner_id" UUID,
    "actor_user_id" UUID NOT NULL,
    "feature_type" "ai_feature_types" NOT NULL,
    "status" "ai_suggestion_statuses" NOT NULL DEFAULT 'PENDING_REVIEW',
    "sanitized_prompt" TEXT NOT NULL,
    "raw_model_output" JSONB NOT NULL,
    "final_human_output" JSONB,
    "created_entity_id" UUID,
    "provider" VARCHAR(50) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "prompt_tokens" INTEGER NOT NULL,
    "completion_tokens" INTEGER NOT NULL,
    "cost_micros_usd" INTEGER NOT NULL,
    "rejection_reason" VARCHAR(500),
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_family_usages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "period" VARCHAR(7) NOT NULL,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "tokens_limit" INTEGER NOT NULL DEFAULT 100000,
    "requests_used" INTEGER NOT NULL DEFAULT 0,
    "requests_limit" INTEGER NOT NULL DEFAULT 200,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ai_family_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_suggestions_family_id_created_at_idx" ON "ai_suggestions"("family_id", "created_at");
CREATE INDEX "ai_suggestions_learner_id_created_at_idx" ON "ai_suggestions"("learner_id", "created_at");
CREATE INDEX "ai_suggestions_status_idx" ON "ai_suggestions"("status");

-- CreateIndex
CREATE INDEX "ai_family_usages_family_id_idx" ON "ai_family_usages"("family_id");
CREATE UNIQUE INDEX "ai_family_usages_family_id_period_key" ON "ai_family_usages"("family_id", "period");

-- AddForeignKey
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_family_usages" ADD CONSTRAINT "ai_family_usages_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 3: Executar `prisma generate` e verificar integridade de compilação**

```bash
pnpm --filter @aletheia/api prisma:generate
```
Esperado: Prisma Client gerado com sucesso incluindo os novos modelos e types.

- [ ] **Step 4: Commit das alterações**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/20261003140000_add_ai_suggestions_and_usage/migration.sql
git commit -m "feat(api): add ai suggestions and family usage prisma models and migration"
```

---

### Task 3: Domínio de IA, Pseudonimização e Provedor Mock Offline (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/ai/domain/llm-provider.interface.ts`
- Create: `apps/api/src/modules/ai/domain/pseudonymizer.ts`
- Create: `apps/api/src/modules/ai/domain/pseudonymizer.spec.ts`
- Create: `apps/api/src/modules/ai/infrastructure/mock-llm-provider.ts`
- Create: `apps/api/src/modules/ai/infrastructure/mock-llm-provider.spec.ts`

**Interfaces:**
- Consumes: Types de `@aletheia/contracts`.
- Produces: `PseudonymizationService` (mascaramento e re-hidratação de PIIs), `LlmProvider` (interface), `MockLlmProvider` (geração estruturada determinística offline).

- [ ] **Step 1: Escrever testes unitários em `apps/api/src/modules/ai/domain/pseudonymizer.spec.ts`**

```typescript
import { PseudonymizationService } from './pseudonymizer.js';

describe('PseudonymizationService', () => {
  let service: PseudonymizationService;

  beforeEach(() => {
    service = new PseudonymizationService();
  });

  it('should mask real learner name and family surname with opaque tokens', () => {
    const session = service.createSession({
      learnerName: 'João da Silva Santos',
      familyName: 'Família Santos',
      ageYears: 9,
      gradeLevel: '4º Ano',
    });

    const rawPrompt = 'Crie uma aula para o João da Silva Santos da Família Santos sobre frações.';
    const maskedPrompt = session.mask(rawPrompt);

    expect(maskedPrompt).not.toContain('João da Silva Santos');
    expect(maskedPrompt).not.toContain('Família Santos');
    expect(maskedPrompt).toContain('[Aluno 1]');
    expect(maskedPrompt).toContain('[Família 1]');
  });

  it('should rehydrate tokens back to real names in the generated response', () => {
    const session = service.createSession({
      learnerName: 'Maria Clara Pereira',
      familyName: 'Família Pereira',
      ageYears: 7,
      gradeLevel: '2º Ano',
    });

    const aiOutput = {
      title: 'Aula de Leitura para [Aluno 1]',
      summary: 'Atividade desenvolvida para [Aluno 1] e a [Família 1].',
    };

    const rehydrated = session.rehydrate(aiOutput);

    expect(rehydrated.title).toBe('Aula de Leitura para Maria Clara Pereira');
    expect(rehydrated.summary).toBe('Atividade desenvolvida para Maria Clara Pereira e a Família Pereira.');
  });
});
```

- [ ] **Step 2: Escrever testes unitários em `apps/api/src/modules/ai/infrastructure/mock-llm-provider.spec.ts`**

```typescript
import { MockLlmProvider } from './mock-llm-provider.js';

describe('MockLlmProvider', () => {
  let provider: MockLlmProvider;

  beforeEach(() => {
    provider = new MockLlmProvider();
  });

  it('should generate structured JSON lesson plan deterministically', async () => {
    const result = await provider.generateDraft(
      'Instrução: Crie plano para [Aluno 1] sobre Botânica e Fotossíntese com 45 minutos.',
      {
        responseFormat: 'json',
      },
    );

    expect(result.provider).toBe('MOCK');
    expect(result.model).toBe('mock-deterministic');
    expect(result.promptTokens).toBeGreaterThan(0);
    expect(result.completionTokens).toBeGreaterThan(0);
    expect(result.parsedJson).toBeDefined();
    expect(result.parsedJson?.title).toContain('Fotossíntese');
    expect(Array.isArray(result.parsedJson?.steps)).toBe(true);
    expect((result.parsedJson?.steps as unknown[]).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Executar testes para verificar falha (RED)**

```bash
pnpm --filter @aletheia/api test -- src/modules/ai/domain/pseudonymizer.spec.ts src/modules/ai/infrastructure/mock-llm-provider.spec.ts
```
Esperado: FALHA com arquivos ausentes.

- [ ] **Step 4: Implementar `llm-provider.interface.ts`, `pseudonymizer.ts` e `mock-llm-provider.ts`**

Em `apps/api/src/modules/ai/domain/llm-provider.interface.ts`:
```typescript
export interface LlmGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
  systemPrompt?: string;
}

export interface LlmGenerationResult {
  text: string;
  parsedJson?: Record<string, unknown>;
  promptTokens: number;
  completionTokens: number;
  model: string;
  provider: string;
  durationMs: number;
}

export interface LlmProvider {
  readonly name: string;
  generateDraft(prompt: string, options?: LlmGenerationOptions): Promise<LlmGenerationResult>;
}
```

Em `apps/api/src/modules/ai/domain/pseudonymizer.ts`:
```typescript
import { Injectable } from '@nestjs/common';

export interface LearnerIdentityContext {
  learnerName: string;
  familyName?: string;
  ageYears?: number;
  gradeLevel?: string;
}

export class PseudonymizationSession {
  private readonly forwardMap = new Map<string, string>();
  private readonly reverseMap = new Map<string, string>();

  constructor(context: LearnerIdentityContext) {
    if (context.learnerName) {
      this.forwardMap.set(context.learnerName, '[Aluno 1]');
      this.reverseMap.set('[Aluno 1]', context.learnerName);
    }
    if (context.familyName) {
      this.forwardMap.set(context.familyName, '[Família 1]');
      this.reverseMap.set('[Família 1]', context.familyName);
    }
  }

  mask(text: string): string {
    let result = text;
    for (const [real, pseudonym] of this.forwardMap.entries()) {
      result = result.split(real).join(pseudonym);
    }
    return result;
  }

  rehydrate<T>(obj: T): T {
    if (typeof obj === 'string') {
      let result = obj;
      for (const [pseudonym, real] of this.reverseMap.entries()) {
        result = result.split(pseudonym).join(real);
      }
      return result as unknown as T;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.rehydrate(item)) as unknown as T;
    }
    if (obj !== null && typeof obj === 'object') {
      const cloned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        cloned[k] = this.rehydrate(v);
      }
      return cloned as T;
    }
    return obj;
  }
}

@Injectable()
export class PseudonymizationService {
  createSession(context: LearnerIdentityContext): PseudonymizationSession {
    return new PseudonymizationSession(context);
  }
}
```

Em `apps/api/src/modules/ai/infrastructure/mock-llm-provider.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import type {
  LlmGenerationOptions,
  LlmGenerationResult,
  LlmProvider,
} from '../domain/llm-provider.interface.js';

@Injectable()
export class MockLlmProvider implements LlmProvider {
  readonly name = 'MOCK';

  async generateDraft(prompt: string, options?: LlmGenerationOptions): Promise<LlmGenerationResult> {
    const startTime = Date.now();
    
    // Extrai tópico ou palavra-chave para personalizar o mock
    const topicMatch = prompt.match(/sobre ([\w\sãõáéíóúâêôç]+)/i);
    const topic = topicMatch ? topicMatch[1].trim() : 'Ciências da Natureza';

    const mockContent = {
      title: `Plano de Aula: ${topic}`,
      summary: `Exploração formativa e investigativa sobre ${topic}, focando em observação ativa, narrativa e registro no diário.`,
      materials: ['Caderno da Natureza', 'Lápis de cor', 'Amostras para observação'],
      steps: [
        {
          order: 1,
          title: 'Introdução e Conexão',
          durationMinutes: 10,
          instructions: `Apresentar o tema ${topic} através de uma pergunta investigativa e recapitulação do conhecimento prévio.`,
          narrationPrompt: `O que você já reparou no cotidiano sobre ${topic}?`,
        },
        {
          order: 2,
          title: 'Leitura Viva e Prática',
          durationMinutes: 20,
          instructions: 'Leitura de um trecho de livro vivo ou demonstração prática dos conceitos principais.',
          narrationPrompt: 'Explique com suas palavras o que aconteceu na demonstração.',
        },
        {
          order: 3,
          title: 'Registro e Narração',
          durationMinutes: 15,
          instructions: 'Desenho e resumo oral com registro no caderno da lição.',
        },
      ],
      assessmentObservations: 'Observe o engajamento na narração e o capricho no registro gráfico.',
    };

    const text = JSON.stringify(mockContent, null, 2);
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(text.length / 4);

    return {
      text,
      parsedJson: mockContent,
      promptTokens,
      completionTokens,
      model: 'mock-deterministic',
      provider: 'MOCK',
      durationMs: Date.now() - startTime,
    };
  }
}
```

- [ ] **Step 5: Executar testes para verificar sucesso (GREEN)**

```bash
pnpm --filter @aletheia/api test -- src/modules/ai/domain/pseudonymizer.spec.ts src/modules/ai/infrastructure/mock-llm-provider.spec.ts
```
Esperado: 100% dos testes passando.

- [ ] **Step 6: Commit das alterações**

```bash
git add apps/api/src/modules/ai/domain/llm-provider.interface.ts apps/api/src/modules/ai/domain/pseudonymizer.ts apps/api/src/modules/ai/domain/pseudonymizer.spec.ts apps/api/src/modules/ai/infrastructure/mock-llm-provider.ts apps/api/src/modules/ai/infrastructure/mock-llm-provider.spec.ts
git commit -m "feat(api): implement pseudonymizer service and deterministic mock llm provider"
```

---

### Task 4: Controle de Cota e Orquestração Human-in-the-Loop (`AiSuggestionService`)

**Files:**
- Create: `apps/api/src/modules/ai/infrastructure/ai-suggestion.repository.ts`
- Create: `apps/api/src/modules/ai/infrastructure/ai-family-usage.repository.ts`
- Create: `apps/api/src/modules/ai/application/ai-quota.service.ts`
- Create: `apps/api/src/modules/ai/application/ai-suggestion.service.ts`
- Create: `apps/api/src/modules/ai/application/public-api.ts`
- Create: `apps/api/src/modules/ai/application/ai-quota.service.spec.ts`
- Create: `apps/api/src/modules/ai/application/ai-suggestion.service.spec.ts`

**Interfaces:**
- Consumes:
  - `PRIVACY_PUBLIC_API` (`PrivacyPublicApi`) de `apps/api/src/modules/privacy/application/public-api.js`.
  - `LESSON_PLAN_PUBLIC_API` (`LessonPlanPublicApi`) de `apps/api/src/modules/lessons/application/public-api.js`.
  - `PromptInjectionScanner` de `apps/api/src/modules/curriculum/domain/prompt-injection-scanner.js`.
- Produces:
  - `AI_PUBLIC_API` (`AiPublicApi`) para consumo modular.
  - Métodos `generateLessonPlanDraft`, `reviewSuggestion` e `getFamilyQuota`.

- [ ] **Step 1: Escrever testes unitários em `apps/api/src/modules/ai/application/ai-quota.service.spec.ts`**

```typescript
import { AiQuotaService } from './ai-quota.service.js';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AiQuotaService', () => {
  let service: AiQuotaService;
  let mockUsageRepo: any;

  beforeEach(() => {
    mockUsageRepo = {
      findOrCreate: jest.fn(),
      incrementUsage: jest.fn(),
    };
    service = new AiQuotaService(mockUsageRepo);
  });

  it('should allow request when family has available quota', async () => {
    mockUsageRepo.findOrCreate.mockResolvedValue({
      familyId: 'fam-1',
      period: '2026-10',
      tokensUsed: 1000,
      tokensLimit: 100000,
      requestsUsed: 5,
      requestsLimit: 200,
    });

    await expect(service.verifyQuota('fam-1')).resolves.not.toThrow();
  });

  it('should throw HTTP 429 when tokens limit is exceeded', async () => {
    mockUsageRepo.findOrCreate.mockResolvedValue({
      familyId: 'fam-1',
      period: '2026-10',
      tokensUsed: 100000,
      tokensLimit: 100000,
      requestsUsed: 5,
      requestsLimit: 200,
    });

    await expect(service.verifyQuota('fam-1')).rejects.toThrow(
      new HttpException('Monthly AI token quota exceeded for this family', HttpStatus.TOO_MANY_REQUESTS),
    );
  });
});
```

- [ ] **Step 2: Escrever testes unitários em `apps/api/src/modules/ai/application/ai-suggestion.service.spec.ts`**

Testar cenários:
- Rejeição por falta de consentimento parental (lança `ForbiddenException` / `ConsentRequiredException`).
- Rejeição por injeção de prompt nas instruções extras (`BadRequestException`).
- Geração com status `PENDING_REVIEW` debitando cotas.
- Revisão `ACCEPT`: cria aula em `LessonPlanService` e atualiza para `ACCEPTED`.
- Revisão `MODIFY`: cria aula com dados editados e atualiza para `MODIFIED` com `finalHumanOutput`.
- Revisão `REJECT`: atualiza para `REJECTED` sem criar aula.

- [ ] **Step 3: Executar testes para verificar falha (RED)**

```bash
pnpm --filter @aletheia/api test -- src/modules/ai/application/ai-quota.service.spec.ts src/modules/ai/application/ai-suggestion.service.spec.ts
```
Esperado: FALHA com classes não encontradas.

- [ ] **Step 4: Implementar Repositórios, `AiQuotaService`, `AiSuggestionService` e `public-api.ts`**

Implementar os repositórios Prisma, o `AiQuotaService`, o `AiSuggestionService` injetando `PRIVACY_PUBLIC_API`, `LESSON_PLAN_PUBLIC_API`, `PseudonymizationService`, `MockLlmProvider`, e `PromptInjectionScanner`.

- [ ] **Step 5: Executar testes para verificar sucesso (GREEN)**

```bash
pnpm --filter @aletheia/api test -- src/modules/ai/application/ai-quota.service.spec.ts src/modules/ai/application/ai-suggestion.service.spec.ts
```
Esperado: 100% dos testes passando.

- [ ] **Step 6: Verificar integridade de fronteiras (`check:boundaries`)**

```bash
pnpm check:boundaries
```
Esperado: 14/14 regras de fronteira respeitadas.

- [ ] **Step 7: Commit das alterações**

```bash
git add apps/api/src/modules/ai/infrastructure/ai-suggestion.repository.ts apps/api/src/modules/ai/infrastructure/ai-family-usage.repository.ts apps/api/src/modules/ai/application/ai-quota.service.ts apps/api/src/modules/ai/application/ai-suggestion.service.ts apps/api/src/modules/ai/application/public-api.ts apps/api/src/modules/ai/application/ai-quota.service.spec.ts apps/api/src/modules/ai/application/ai-suggestion.service.spec.ts
git commit -m "feat(api): implement ai quota service, suggestion lifecycle service and public api"
```

---

### Task 5: Endpoints HTTP, Módulo NestJS e Testes de Integração (`AiController`, `AiModule`)

**Files:**
- Create: `apps/api/src/modules/ai/infrastructure/ai.controller.ts`
- Create: `apps/api/src/modules/ai/infrastructure/ai.controller.spec.ts`
- Create: `apps/api/src/modules/ai/ai.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/test/ai.integration.spec.ts`

**Interfaces:**
- Consumes: `AiSuggestionService`, `AiQuotaService`, `FamilyTenantGuard`, `JwtAuthGuard`.
- Produces: Rotas HTTP protegidas em `/families/:familyId/ai`.

- [ ] **Step 1: Escrever testes unitários em `apps/api/src/modules/ai/infrastructure/ai.controller.spec.ts`**

Validar chamadas do controller para o service, autenticação e validação de parâmetros.

- [ ] **Step 2: Escrever testes de integração em `apps/api/test/ai.integration.spec.ts`**

Validar jornada completa via HTTP com Postgres e isolamento de família via `FamilyTenantGuard`.

- [ ] **Step 3: Implementar `AiController`, `AiModule` e registrar em `AppModule`**

Implementar endpoints:
- `POST /families/:familyId/ai/lesson-plan-draft`
- `POST /families/:familyId/ai/suggestions/:id/review`
- `GET /families/:familyId/ai/quota`

- [ ] **Step 4: Executar testes de controller e integração**

```bash
pnpm --filter @aletheia/api test -- src/modules/ai/infrastructure/ai.controller.spec.ts
pnpm check:boundaries
```
Esperado: 100% dos testes e fronteiras validadas.

- [ ] **Step 5: Commit das alterações**

```bash
git add apps/api/src/modules/ai/infrastructure/ai.controller.ts apps/api/src/modules/ai/infrastructure/ai.controller.spec.ts apps/api/src/modules/ai/ai.module.ts apps/api/src/app.module.ts apps/api/test/ai.integration.spec.ts
git commit -m "feat(api): implement ai controller, ai module, and integration test suite"
```

---

### Task 6: Frontend: Modal de Assistente Pedagógico e Painel de Revisão (`apps/web` & i18n)

**Files:**
- Create: `apps/web/src/components/lessons/ai-lesson-draft-modal.tsx`
- Create: `apps/web/src/components/lessons/ai-consent-notice-modal.tsx`
- Modify: `apps/web/src/app/(dashboard)/lessons/lessons-view.tsx`
- Modify: `apps/web/src/lib/i18n/dictionaries/pt-BR/lessons.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/en-US/lessons.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/es-ES/lessons.ts`
- Create: `apps/web/tests/ai-lesson-draft-modal.test.tsx`
- Create: `apps/web/tests/i18n-lessons-ai.test.tsx`

**Interfaces:**
- Consumes: DTOs de `@aletheia/contracts` (`GenerateLessonPlanDraftRequestDto`, `AiLessonPlanDraftResponseDto`, `ReviewAiSuggestionRequestDto`), `useLocale()` e `t()`.
- Produces: Interface amigável de rascunho de aula por IA com revisão obrigatória antes de agendar.

- [ ] **Step 1: Escrever testes unitários e de componente em `apps/web/tests/ai-lesson-draft-modal.test.tsx`**

Testar:
1. Renderização do botão disparador e abertura do modal.
2. Entrada de parâmetros e disparo da geração.
3. Exibição do rascunho com campos editáveis.
4. Clique em "Aprovar e Agendar" disparando review com `ACCEPT` ou `MODIFY`.
5. Clique em "Descartar" disparando review com `REJECT`.
6. Exibição do aviso de consentimento quando a API retornar 403.

- [ ] **Step 2: Escrever teste de paridade de i18n em `apps/web/tests/i18n-lessons-ai.test.tsx`**

Verificar que todas as novas chaves de tradução adicionadas em `pt-BR` existem com valores não vazios em `en-US` e `es-ES`.

- [ ] **Step 3: Implementar dicionários em `pt-BR`, `en-US` e `es-ES`**

Adicionar chaves sob o namespace `lessons.aiAssistant.*`.

- [ ] **Step 4: Implementar `AiConsentNoticeModal` e `AiLessonDraftModal`**

Implementar os componentes acessíveis com `data-testid` e manipulação de estado.

- [ ] **Step 5: Integrar botão disparador na página `/lessons`**

Adicionar o botão *"Assistente IA (Rascunho)"* ao lado de *"Novo Plano de Aula"*.

- [ ] **Step 6: Executar testes de frontend e typecheck**

```bash
pnpm --filter @aletheia/web test -- tests/ai-lesson-draft-modal.test.tsx tests/i18n-lessons-ai.test.tsx
pnpm --filter @aletheia/web typecheck
```
Esperado: 100% dos testes de frontend passando e 0 erros de tipagem.

- [ ] **Step 7: Commit das alterações**

```bash
git add apps/web/src/components/lessons/ai-lesson-draft-modal.tsx apps/web/src/components/lessons/ai-consent-notice-modal.tsx apps/web/src/app/(dashboard)/lessons/lessons-view.tsx apps/web/src/lib/i18n/dictionaries/*/lessons.ts apps/web/tests/ai-lesson-draft-modal.test.tsx apps/web/tests/i18n-lessons-ai.test.tsx
git commit -m "feat(web): add ai lesson draft modal, review panel, and 100% i18n parity"
```

---

### Task 7: Verificação Geral do Monorepo e Esteira CI

**Files:**
- N/A (Execução de verificação abrangente)

- [ ] **Step 1: Executar verificação de fronteiras modulares**
```bash
pnpm check:boundaries
```
Esperado: 14/14 regras de fronteira respeitadas.

- [ ] **Step 2: Executar verificação de tipos em todo o monorepo**
```bash
pnpm -r typecheck
```
Esperado: 0 erros em todos os pacotes.

- [ ] **Step 3: Executar suíte de testes do monorepo**
```bash
pnpm -r test
```
Esperado: Todos os testes verdes.

- [ ] **Step 4: Validar ausência de trailers de atribuição de IA nos commits**
```bash
git log -n 10 --format="%B"
```
Esperado: Nenhuma ocorrência de `Co-Authored-By`, `Generated-By` ou similares.
