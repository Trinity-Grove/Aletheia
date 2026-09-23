# Moderação Comunitária de Curriculum Packs (Issue #102) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o sistema completo de moderação comunitária para Curriculum Packs (UGC), incluindo perfil de reputação do autor (Trust Score determinístico), submissão pré/pós-moderada por tier, denúncias por famílias com barreira anti-brigading e gatilho de auto-suspensão em 3 denúncias distintas, fila administrativa de moderação (`PlatformAdminGuard`) e componentes web com suporte internacionalizado (`pt-BR`, `en-US`, `es-ES`).

**Architecture:** O sistema estende `CurriculumPack` com campos de autoria (`authorUserId`) e status de moderação (`moderationStatus`). Um `AuthorTrustProfile` (1:1 com `User`) calcula de forma pura e determinística a pontuação de 0 a 100 e define os tiers (`NOVICE`, `VERIFIED`, `TRUSTED`). Denúncias (`CurriculumPackReport`) possuem constraint única `[packId, reporterFamilyId]`. Uma fila de moderação administrativa permite aprovar, suspender, rejeitar e restaurar pacotes, além de julgar denúncias procedentes ou improcedentes.

**Tech Stack:** TypeScript, NestJS 11, Prisma ORM, PostgreSQL 17, Zod (`@aletheia/contracts`), Next.js 15, React 19, `@aletheia/ui`, Vitest, Jest.

**Spec:** `docs/superpowers/specs/2026-09-23-pack-community-moderation-design.md`

## Global Constraints

- Zero AI-attribution trailers (`Co-Authored-By`, `Generated-By`, `AI-Assisted`, etc.) em commits, mensagens de PR ou documentação.
- Multi-tenant strict isolation: denúncias devem ser obrigatoriamente vinculadas à família ativa (`FamilyTenantGuard` + constraint única `[packId, reporterFamilyId]`).
- RBAC inviolável: todas as rotas administrativas em `/admin/moderation/*` exigem `JwtAuthGuard` + `PlatformAdminGuard`.
- Neutralidade doutrinária: denúncias são restritas a categorias técnicas, legais e de segurança (`SPAM_COMMERCIAL`, `HARMFUL_INAPPROPRIATE`, `COPYRIGHT_PLAGIARISM`, `MALFORMED_QUALITY`, `OTHER`). Divergência teológica é intencionalmente excluída do formulário.
- Paridade i18n rigorosa: todas as strings novas no frontend devem ser adicionadas simetricamente aos dicionários de `pt-BR`, `en-US` e `es-ES`.
- 100% de cobertura de testes e zero erros de compilação no typecheck.

---

### Task 1: Contratos e DTOs no `@aletheia/contracts`

**Files:**
- Create: `packages/contracts/src/curriculum-pack-moderation.ts`
- Create: `packages/contracts/src/curriculum-pack-moderation.test.ts`
- Modify: `packages/contracts/src/index.ts`

**Interfaces:**
- Produces:
  - `curriculumPackModerationStatusSchema`, `CurriculumPackModerationStatus`
  - `authorTrustTierSchema`, `AuthorTrustTier`
  - `packReportReasonSchema`, `PackReportReason`
  - `packReportStatusSchema`, `PackReportStatus`
  - `createPackReportSchema`, `CreatePackReportDto`, `CreatePackReportOutput`
  - `packReportResponseSchema`, `PackReportResponseDto`
  - `authorTrustProfileResponseSchema`, `AuthorTrustProfileResponseDto`
  - `adminModeratePackSchema`, `AdminModeratePackDto`, `AdminModeratePackOutput`
  - `adminResolveReportSchema`, `AdminResolveReportDto`, `AdminResolveReportOutput`

- [ ] **Step 1: Escrever teste falhando para os schemas de moderação**

Criar `packages/contracts/src/curriculum-pack-moderation.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  curriculumPackModerationStatusSchema,
  authorTrustTierSchema,
  packReportReasonSchema,
  createPackReportSchema,
  adminModeratePackSchema,
  adminResolveReportSchema,
} from './curriculum-pack-moderation.js';

describe('CurriculumPack Moderation Contracts', () => {
  it('validates moderation status values', () => {
    expect(curriculumPackModerationStatusSchema.parse('DRAFT')).toBe('DRAFT');
    expect(curriculumPackModerationStatusSchema.parse('PENDING_REVIEW')).toBe('PENDING_REVIEW');
    expect(curriculumPackModerationStatusSchema.parse('APPROVED')).toBe('APPROVED');
    expect(curriculumPackModerationStatusSchema.parse('SUSPENDED')).toBe('SUSPENDED');
    expect(curriculumPackModerationStatusSchema.parse('REJECTED')).toBe('REJECTED');
    expect(() => curriculumPackModerationStatusSchema.parse('INVALID')).toThrow();
  });

  it('validates author trust tiers', () => {
    expect(authorTrustTierSchema.parse('NOVICE')).toBe('NOVICE');
    expect(authorTrustTierSchema.parse('VERIFIED')).toBe('VERIFIED');
    expect(authorTrustTierSchema.parse('TRUSTED')).toBe('TRUSTED');
    expect(() => authorTrustTierSchema.parse('SUPERUSER')).toThrow();
  });

  it('validates report reasons and rejects theological complaints', () => {
    expect(packReportReasonSchema.parse('SPAM_COMMERCIAL')).toBe('SPAM_COMMERCIAL');
    expect(packReportReasonSchema.parse('HARMFUL_INAPPROPRIATE')).toBe('HARMFUL_INAPPROPRIATE');
    expect(packReportReasonSchema.parse('COPYRIGHT_PLAGIARISM')).toBe('COPYRIGHT_PLAGIARISM');
    expect(packReportReasonSchema.parse('MALFORMED_QUALITY')).toBe('MALFORMED_QUALITY');
    expect(packReportReasonSchema.parse('OTHER')).toBe('OTHER');
    expect(() => packReportReasonSchema.parse('THEOLOGICAL_DISAGREEMENT')).toThrow();
  });

  it('validates createPackReport payload', () => {
    const valid = createPackReportSchema.parse({
      reason: 'HARMFUL_INAPPROPRIATE',
      details: 'Contém links externos impróprios para menores.',
    });
    expect(valid.reason).toBe('HARMFUL_INAPPROPRIATE');
  });

  it('validates adminModeratePack payload', () => {
    const valid = adminModeratePackSchema.parse({
      action: 'SUSPEND',
      notes: 'Suspensão preventiva devido a relatos de conteúdo malformado.',
    });
    expect(valid.action).toBe('SUSPEND');
  });

  it('validates adminResolveReport payload', () => {
    const valid = adminResolveReportSchema.parse({
      status: 'UPHELD',
      notes: 'Denúncia confirmada após auditoria técnica.',
    });
    expect(valid.status).toBe('UPHELD');
  });
});
```

- [ ] **Step 2: Rodar teste para verificar que falha**

Run: `pnpm --filter @aletheia/contracts test src/curriculum-pack-moderation.test.ts`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar schemas no `@aletheia/contracts`**

Criar `packages/contracts/src/curriculum-pack-moderation.ts`:
```ts
import { z } from 'zod';

export const CURRICULUM_PACK_MODERATION_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'SUSPENDED',
  'REJECTED',
] as const;

export const curriculumPackModerationStatusSchema = z.enum(CURRICULUM_PACK_MODERATION_STATUSES);
export type CurriculumPackModerationStatus = z.infer<typeof curriculumPackModerationStatusSchema>;

export const AUTHOR_TRUST_TIERS = ['NOVICE', 'VERIFIED', 'TRUSTED'] as const;
export const authorTrustTierSchema = z.enum(AUTHOR_TRUST_TIERS);
export type AuthorTrustTier = z.infer<typeof authorTrustTierSchema>;

export const PACK_REPORT_REASONS = [
  'SPAM_COMMERCIAL',
  'HARMFUL_INAPPROPRIATE',
  'COPYRIGHT_PLAGIARISM',
  'MALFORMED_QUALITY',
  'OTHER',
] as const;
export const packReportReasonSchema = z.enum(PACK_REPORT_REASONS);
export type PackReportReason = z.infer<typeof packReportReasonSchema>;

export const PACK_REPORT_STATUSES = ['OPEN', 'UPHELD', 'DISMISSED'] as const;
export const packReportStatusSchema = z.enum(PACK_REPORT_STATUSES);
export type PackReportStatus = z.infer<typeof packReportStatusSchema>;

export const createPackReportSchema = z.object({
  reason: packReportReasonSchema,
  details: z.string().max(2000).nullish(),
});
export type CreatePackReportDto = z.input<typeof createPackReportSchema>;
export type CreatePackReportOutput = z.output<typeof createPackReportSchema>;

export const packReportResponseSchema = z.object({
  id: z.string().uuid(),
  packId: z.string().uuid(),
  reporterUserId: z.string().uuid(),
  reporterFamilyId: z.string().uuid(),
  reason: packReportReasonSchema,
  details: z.string().nullable(),
  status: packReportStatusSchema,
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
  resolvedByUserId: z.string().uuid().nullable(),
});
export type PackReportResponseDto = z.infer<typeof packReportResponseSchema>;

export const authorTrustProfileResponseSchema = z.object({
  userId: z.string().uuid(),
  trustScore: z.number().int().min(0).max(100),
  tier: authorTrustTierSchema,
  approvedPacksCount: z.number().int().min(0),
  rejectedPacksCount: z.number().int().min(0),
  upheldReportsCount: z.number().int().min(0),
  lastEvaluatedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AuthorTrustProfileResponseDto = z.infer<typeof authorTrustProfileResponseSchema>;

export const adminModeratePackSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'SUSPEND', 'RESTORE']),
  notes: z.string().max(2000).nullish(),
});
export type AdminModeratePackDto = z.input<typeof adminModeratePackSchema>;
export type AdminModeratePackOutput = z.output<typeof adminModeratePackSchema>;

export const adminResolveReportSchema = z.object({
  status: z.enum(['UPHELD', 'DISMISSED']),
  notes: z.string().max(2000).nullish(),
});
export type AdminResolveReportDto = z.input<typeof adminResolveReportSchema>;
export type AdminResolveReportOutput = z.output<typeof adminResolveReportSchema>;
```

Exportar em `packages/contracts/src/index.ts`.

- [ ] **Step 4: Rodar teste e build do `@aletheia/contracts`**

Run: `pnpm --filter @aletheia/contracts test`  
Run: `pnpm --filter @aletheia/contracts build`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/
git commit -m "feat(contracts): add curriculum pack moderation and author trust schemas"
```

---

### Task 2: Modelagem Prisma e Migração do Banco de Dados

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260923000000_pack_community_moderation/migration.sql`

**Interfaces:**
- Consumes: Prisma schema de `User`, `Family`, `CurriculumPack`.
- Produces: Novas tabelas `author_trust_profiles`, `curriculum_pack_reports`, novos enums e colunas em `curriculum_packs`.

- [ ] **Step 1: Adicionar enums e modelos ao `schema.prisma`**

Em `apps/api/prisma/schema.prisma`:
1. Adicionar enums:
   - `CurriculumPackModerationStatus` (`DRAFT`, `PENDING_REVIEW`, `APPROVED`, `SUSPENDED`, `REJECTED`)
   - `AuthorTrustTier` (`NOVICE`, `VERIFIED`, `TRUSTED`)
   - `PackReportReason` (`SPAM_COMMERCIAL`, `HARMFUL_INAPPROPRIATE`, `COPYRIGHT_PLAGIARISM`, `MALFORMED_QUALITY`, `OTHER`)
   - `PackReportStatus` (`OPEN`, `UPHELD`, `DISMISSED`)
2. Estender `CurriculumPack` com campos de autoria e moderação.
3. Criar modelo `AuthorTrustProfile`.
4. Criar modelo `CurriculumPackReport` com unique constraint `[packId, reporterFamilyId]`.
5. Adicionar relações reversas no modelo `User` (`authoredPacks`, `moderatedPacks`, `trustProfile`, `submittedReports`, `resolvedReports`).

- [ ] **Step 2: Gerar o arquivo de migração SQL**

Criar `apps/api/prisma/migrations/20260923000000_pack_community_moderation/migration.sql`:
```sql
CREATE TYPE "CurriculumPackModerationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SUSPENDED', 'REJECTED');
CREATE TYPE "AuthorTrustTier" AS ENUM ('NOVICE', 'VERIFIED', 'TRUSTED');
CREATE TYPE "PackReportReason" AS ENUM ('SPAM_COMMERCIAL', 'HARMFUL_INAPPROPRIATE', 'COPYRIGHT_PLAGIARISM', 'MALFORMED_QUALITY', 'OTHER');
CREATE TYPE "PackReportStatus" AS ENUM ('OPEN', 'UPHELD', 'DISMISSED');

ALTER TABLE "curriculum_packs" 
ADD COLUMN "author_user_id" UUID,
ADD COLUMN "moderation_status" "CurriculumPackModerationStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "moderation_notes" TEXT,
ADD COLUMN "moderated_at" TIMESTAMPTZ,
ADD COLUMN "moderated_by_user_id" UUID;

CREATE INDEX "curriculum_packs_moderation_status_idx" ON "curriculum_packs"("moderation_status");
CREATE INDEX "curriculum_packs_author_user_id_idx" ON "curriculum_packs"("author_user_id");

ALTER TABLE "curriculum_packs" ADD CONSTRAINT "curriculum_packs_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "curriculum_packs" ADD CONSTRAINT "curriculum_packs_moderated_by_user_id_fkey" FOREIGN KEY ("moderated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "author_trust_profiles" (
    "user_id" UUID NOT NULL,
    "trust_score" INTEGER NOT NULL DEFAULT 10,
    "tier" "AuthorTrustTier" NOT NULL DEFAULT 'NOVICE',
    "approved_packs_count" INTEGER NOT NULL DEFAULT 0,
    "rejected_packs_count" INTEGER NOT NULL DEFAULT 0,
    "upheld_reports_count" INTEGER NOT NULL DEFAULT 0,
    "last_evaluated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "author_trust_profiles_pkey" PRIMARY KEY ("user_id"),
    CONSTRAINT "author_trust_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "author_trust_profiles_tier_idx" ON "author_trust_profiles"("tier");

CREATE TABLE "curriculum_pack_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pack_id" UUID NOT NULL,
    "reporter_user_id" UUID NOT NULL,
    "reporter_family_id" UUID NOT NULL,
    "reason" "PackReportReason" NOT NULL,
    "details" TEXT,
    "status" "PackReportStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,
    "resolved_by_user_id" UUID,
    CONSTRAINT "curriculum_pack_reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "curriculum_pack_reports_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "curriculum_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "curriculum_pack_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "curriculum_pack_reports_reporter_family_id_fkey" FOREIGN KEY ("reporter_family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "curriculum_pack_reports_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "curriculum_pack_reports_pack_family_unique" ON "curriculum_pack_reports"("pack_id", "reporter_family_id");
CREATE INDEX "curriculum_pack_reports_pack_id_status_idx" ON "curriculum_pack_reports"("pack_id", "status");
CREATE INDEX "curriculum_pack_reports_reporter_family_id_idx" ON "curriculum_pack_reports"("reporter_family_id");
```

- [ ] **Step 3: Gerar Prisma Client e validar integridade**

Run: `pnpm prisma:generate`  
Expected: `Generated Prisma Client` com sucesso.

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/
git commit -m "feat(api): add database schema and migration for pack moderation and author trust"
```

---

### Task 3: Motor e Serviço de Confiabilidade do Autor (`AuthorTrustService`)

**Files:**
- Create: `apps/api/src/modules/curriculum/infrastructure/author-trust.repository.ts`
- Create: `apps/api/src/modules/curriculum/application/author-trust.service.ts`
- Create: `apps/api/src/modules/curriculum/application/author-trust.service.spec.ts`
- Modify: `apps/api/src/modules/curriculum/curriculum.module.ts`

**Interfaces:**
- Produces:
  - `AuthorTrustService.getOrCreateProfile(userId: string): Promise<AuthorTrustProfile>`
  - `AuthorTrustService.recalculateScore(userId: string, createdAt: Date): Promise<AuthorTrustProfile>`
  - `AuthorTrustService.computeTier(score: number): AuthorTrustTier`
  - `AuthorTrustService.onPackApproved(userId: string): Promise<AuthorTrustProfile>`
  - `AuthorTrustService.onPackRejected(userId: string): Promise<AuthorTrustProfile>`
  - `AuthorTrustService.onReportUpheld(userId: string): Promise<AuthorTrustProfile>`

- [ ] **Step 1: Escrever teste unitário do cálculo determinístico de score e transições de tier**

Criar `apps/api/src/modules/curriculum/application/author-trust.service.spec.ts`:
- Testa score inicial `10` -> `NOVICE`.
- Testa bônus por pack aprovado (+15).
- Testa bônus por tempo de conta (+5 a cada 30 dias, max +20).
- Testa penalidade por denúncia procedente (-20).
- Testa penalidade por pack rejeitado (-30).
- Testa transição para `VERIFIED` ao atingir 40 pontos.
- Testa transição para `TRUSTED` ao atingir 80 pontos.
- Testa limites mínimos (0) e máximos (100).

- [ ] **Step 2: Rodar teste para verificar falha**

Run: `pnpm --filter @aletheia/api test src/modules/curriculum/application/author-trust.service.spec.ts`  
Expected: FAIL.

- [ ] **Step 3: Implementar `AuthorTrustRepository` e `AuthorTrustService`**

Implementar cálculo determinístico em `author-trust.service.ts`:
```ts
export function computeTrustScore(factors: {
  accountAgeDays: number;
  approvedCount: number;
  rejectedCount: number;
  upheldReportsCount: number;
}): { score: number; tier: AuthorTrustTier } {
  const base = 10;
  const accountBonus = Math.min(20, Math.floor(factors.accountAgeDays / 30) * 5);
  const approvedBonus = factors.approvedCount * 15;
  const reportPenalty = factors.upheldReportsCount * 20;
  const rejectionPenalty = factors.rejectedCount * 30;

  const raw = base + accountBonus + approvedBonus - reportPenalty - rejectionPenalty;
  const score = Math.max(0, Math.min(100, raw));

  let tier: AuthorTrustTier = 'NOVICE';
  if (score >= 80) tier = 'TRUSTED';
  else if (score >= 40) tier = 'VERIFIED';

  return { score, tier };
}
```

- [ ] **Step 4: Rodar teste e verificar aprovação**

Run: `pnpm --filter @aletheia/api test src/modules/curriculum/application/author-trust.service.spec.ts`  
Expected: PASS (todos os casos de borda e transições verdes).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/curriculum/
git commit -m "feat(curriculum): implement AuthorTrustService and deterministic scoring algorithm"
```

---

### Task 4: Submissão de Packs Comunitários e Filtro da Galeria Pública

**Files:**
- Modify: `apps/api/src/modules/curriculum/infrastructure/curriculum-pack.repository.ts`
- Modify: `apps/api/src/modules/curriculum/application/curriculum-pack.service.ts`
- Modify: `apps/api/src/modules/curriculum/presentation/curriculum-pack.controller.ts`
- Modify: `apps/api/src/modules/curriculum/application/curriculum.service.spec.ts`

**Interfaces:**
- Consumes: `AuthorTrustService`
- Produces:
  - `CurriculumPackService.createCommunityPack(userId, dto): Promise<CurriculumPackResponseDto>`
  - `CurriculumPackService.submitPack(packId, userId): Promise<CurriculumPackResponseDto>`
  - `CurriculumPackService.listPublicPacks(): Promise<CurriculumPackResponseDto[]>`
  - `CurriculumPackService.listMyAuthoredPacks(userId): Promise<CurriculumPackResponseDto[]>`

- [ ] **Step 1: Escrever testes unitários para o fluxo de submissão**

Testar em `curriculum-pack.service.spec.ts`:
- Autor `NOVICE` submete pack -> status fica `PENDING_REVIEW` e não aparece em `listPublicPacks()`.
- Autor `TRUSTED` submete pack -> auto-aprova com status `APPROVED` e aparece em `listPublicPacks()`.
- Autor tenta submeter pack de outro usuário -> lança `ForbiddenException`.

- [ ] **Step 2: Rodar teste para verificar falha**

Run: `pnpm --filter @aletheia/api test src/modules/curriculum/application/curriculum-pack.service.spec.ts`  
Expected: FAIL.

- [ ] **Step 3: Implementar métodos de submissão e listagem com filtro de moderação**

Em `CurriculumPackService`:
- `listPublicPacks`: filtra `{ status: 'PUBLISHED', moderationStatus: 'APPROVED' }`.
- `submitPack`: recupera o `AuthorTrustProfile` do usuário via `AuthorTrustService.getOrCreateProfile(userId)`. Se `profile.tier === 'TRUSTED'`, seta `moderationStatus = 'APPROVED'` e `status = 'PUBLISHED'`. Se `NOVICE` ou `VERIFIED`, seta `moderationStatus = 'PENDING_REVIEW'`.

- [ ] **Step 4: Rodar teste e verificar aprovação**

Run: `pnpm --filter @aletheia/api test src/modules/curriculum/application/curriculum-pack.service.spec.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/curriculum/
git commit -m "feat(curriculum): implement community pack submission and public gallery moderation filter"
```

---

### Task 5: Motor de Denúncias e Gatilho de Auto-Suspensão

**Files:**
- Create: `apps/api/src/modules/curriculum/infrastructure/curriculum-pack-report.repository.ts`
- Create: `apps/api/src/modules/curriculum/application/curriculum-pack-report.service.ts`
- Create: `apps/api/src/modules/curriculum/application/curriculum-pack-report.service.spec.ts`
- Create: `apps/api/src/modules/curriculum/presentation/curriculum-pack-report.controller.ts`
- Modify: `apps/api/src/modules/curriculum/curriculum.module.ts`

**Interfaces:**
- Produces:
  - `POST /api/v1/curriculum-packs/:id/reports` (Protegido por `JwtAuthGuard` e `FamilyTenantGuard`)
  - Gatilho automático: se `countOpenDistinctReports(packId) >= 3`, transiciona pack para `SUSPENDED`.

- [ ] **Step 1: Escrever teste unitário para denúncias e auto-suspensão**

Testar em `curriculum-pack-report.service.spec.ts`:
- Família A denuncia pack -> Report criado com status `OPEN`, pack continua `APPROVED`.
- Família A tenta denunciar o mesmo pack novamente -> lança `ConflictException` (anti-brigading).
- Família B denuncia o mesmo pack -> 2 denúncias, pack continua `APPROVED`.
- Família C denuncia o mesmo pack -> 3ª denúncia atinge limiar: pack automaticamente muda para `SUSPENDED`.

- [ ] **Step 2: Rodar teste para verificar falha**

Run: `pnpm --filter @aletheia/api test src/modules/curriculum/application/curriculum-pack-report.service.spec.ts`  
Expected: FAIL.

- [ ] **Step 3: Implementar serviço e controller de denúncias**

Implementar `CurriculumPackReportService`:
- `createReport(packId, userId, familyId, dto)`
- Checa duplicidade via `findReportByPackAndFamily(packId, familyId)`.
- Salva denúncia.
- Consulta contagem de denúncias abertas de famílias distintas. Se $\ge 3$, invoca `curriculumPackRepository.updateModerationStatus(packId, 'SUSPENDED', 'Suspenso preventivamente por acúmulo de denúncias')`.

- [ ] **Step 4: Rodar teste e verificar aprovação**

Run: `pnpm --filter @aletheia/api test src/modules/curriculum/application/curriculum-pack-report.service.spec.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/curriculum/
git commit -m "feat(curriculum): implement reporting engine and 3-report auto-suspension trigger"
```

---

### Task 6: Painel e Fila de Moderação Administrativa (`PlatformAdminGuard`)

**Files:**
- Create: `apps/api/src/modules/curriculum/application/curriculum-pack-moderation.service.ts`
- Create: `apps/api/src/modules/curriculum/application/curriculum-pack-moderation.service.spec.ts`
- Create: `apps/api/src/modules/curriculum/presentation/curriculum-pack-moderation-admin.controller.ts`
- Modify: `apps/api/src/modules/curriculum/curriculum.module.ts`

**Interfaces:**
- Consumes: `CurriculumPackRepository`, `CurriculumPackReportRepository`, `AuthorTrustService`.
- Produces:
  - `GET /api/v1/admin/moderation/queue` (retorna packs `PENDING_REVIEW` e `SUSPENDED`).
  - `POST /api/v1/admin/moderation/packs/:id/moderate` (ações `APPROVE`, `REJECT`, `SUSPEND`, `RESTORE`).
  - `GET /api/v1/admin/moderation/reports` (lista denúncias abertas).
  - `POST /api/v1/admin/moderation/reports/:id/resolve` (`UPHELD` ou `DISMISSED`).

- [ ] **Step 1: Escrever testes unitários e de RBAC para a moderação admin**

Testar em `curriculum-pack-moderation.service.spec.ts`:
- Fila de moderação lista apenas packs que requerem intervenção.
- Ação `APPROVE` aprova pack e invoca `AuthorTrustService.onPackApproved(authorId)`.
- Ação `REJECT` rejeita pack e invoca `AuthorTrustService.onPackRejected(authorId)`.
- Resolução de denúncia como `UPHELD` aplica penalidade de reputação ao autor.
- Bloqueio de acesso para guardião comum (sem `isPlatformAdmin`).

- [ ] **Step 2: Rodar teste para verificar falha**

Run: `pnpm --filter @aletheia/api test src/modules/curriculum/application/curriculum-pack-moderation.service.spec.ts`  
Expected: FAIL.

- [ ] **Step 3: Implementar serviço e controller administrativo de moderação**

Implementar `CurriculumPackModerationService` e expor em `CurriculumPackModerationAdminController` com `UseGuards(JwtAuthGuard, PlatformAdminGuard)`.

- [ ] **Step 4: Rodar teste e verificar aprovação**

Run: `pnpm --filter @aletheia/api test src/modules/curriculum/application/curriculum-pack-moderation.service.spec.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/curriculum/
git commit -m "feat(curriculum): implement admin moderation queue, pack actions and report resolution"
```

---

### Task 7: Frontend Web - Modal de Denúncia, Badges de Reputação e Internacionalização

**Files:**
- Create: `apps/web/src/components/curriculum/pack-report-modal.tsx`
- Create: `apps/web/src/components/curriculum/author-trust-badge.tsx`
- Modify: `apps/web/src/components/curriculum/curriculum-packs-gallery.tsx`
- Modify: `apps/web/src/lib/i18n/dictionaries/pt-BR/curriculum.ts` (ou novo arquivo de domínio)
- Modify: `apps/web/src/lib/i18n/dictionaries/en-US/curriculum.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/es-ES/curriculum.ts`
- Modify: `apps/web/tests/curriculum-packs.test.tsx`
- Modify: `apps/web/tests/i18n.test.tsx`

**Interfaces:**
- Produces:
  - `<PackReportModal isOpen onClose packId packTitle onSuccess />`
  - `<AuthorTrustBadge tier trustScore />`
  - Botão "Denunciar" nos cards da galeria.

- [ ] **Step 1: Adicionar traduções nos dicionários (`pt-BR`, `en-US`, `es-ES`)**

Adicionar chaves sob `curriculum.moderation`:
- `reportModalTitle`: 'Denunciar Pacote Curricular' / 'Report Curriculum Pack' / 'Denunciar Paquete Curricular'
- `reasonLabel`: 'Motivo da Denúncia' / 'Report Reason' / 'Motivo de la Denuncia'
- `reasons`: `{ SPAM_COMMERCIAL, HARMFUL_INAPPROPRIATE, COPYRIGHT_PLAGIARISM, MALFORMED_QUALITY, OTHER }`
- `detailsLabel`: 'Detalhes (opcional)' / 'Details (optional)' / 'Detalles (opcional)'
- `submitReport`: 'Enviar Denúncia' / 'Submit Report' / 'Enviar Denuncia'
- `reportSuccessMsg`: 'Denúncia enviada aos moderadores da plataforma.'
- `badgeNovice`: 'Autor Iniciante' / 'Novice Author' / 'Autor Principiante'
- `badgeVerified`: 'Autor Verificado' / 'Verified Author' / 'Autor Verificado'
- `badgeTrusted`: 'Autor Confiável' / 'Trusted Author' / 'Autor Confiable'

- [ ] **Step 2: Escrever testes para `PackReportModal` e `AuthorTrustBadge`**

Testar em `apps/web/tests/curriculum-packs.test.tsx`:
- Renderiza botão de denúncia no card do pack.
- Abre `PackReportModal` ao clicar em denunciar.
- Valida envio de denúncia via `POST /api/v1/curriculum-packs/:id/reports` e exibe mensagem de sucesso.
- Valida que `i18n.test.tsx` mantém 100% de paridade simétrica entre os 3 idiomas.

- [ ] **Step 3: Implementar componentes no frontend**

Implementar `pack-report-modal.tsx` e `author-trust-badge.tsx` utilizando tokens de design de `@aletheia/ui` e `useLocale()`.

- [ ] **Step 4: Rodar testes do web**

Run: `pnpm --filter @aletheia/web test tests/curriculum-packs.test.tsx tests/i18n.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/
git commit -m "feat(web): add pack report modal, author trust badges and i18n support"
```

---

### Task 8: Frontend Web - Dashboard de Moderação da Plataforma (`/admin/moderation`)

**Files:**
- Create: `apps/web/app/(dashboard)/admin/moderation/page.tsx`
- Create: `apps/web/src/components/admin/pack-moderation-dashboard.tsx`
- Create: `apps/web/tests/admin-moderation.test.tsx`

**Interfaces:**
- Consumes: Endpoints `/api/v1/admin/moderation/*`
- Produces: Visão administrativa para moderação de packs e resolução de denúncias.

- [ ] **Step 1: Escrever teste de renderização e ações da fila de moderação**

Testar em `tests/admin-moderation.test.tsx`:
- Exibe lista de packs pendentes (`PENDING_REVIEW`) e suspensos (`SUSPENDED`).
- Aciona ação de aprovação (`APPROVE`) e atualiza o estado da tabela.
- Aciona ação de suspensão/rejeição com justificativa.
- Lista denúncias abertas e permite julgá-las como `UPHELD` ou `DISMISSED`.

- [ ] **Step 2: Rodar teste para verificar falha**

Run: `pnpm --filter @aletheia/web test tests/admin-moderation.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implementar o dashboard administrativo de moderação**

Criar `pack-moderation-dashboard.tsx` e a rota `apps/web/app/(dashboard)/admin/moderation/page.tsx`, integrados ao layout administrativo e com chamadas à API via `apiClient`.

- [ ] **Step 4: Rodar teste e validar aprovação**

Run: `pnpm --filter @aletheia/web test tests/admin-moderation.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/
git commit -m "feat(web): implement platform admin moderation dashboard"
```

---

### Task 9: Verificação Completa e Integração End-to-End

**Files:**
- Run: Suíte completa de testes de todos os pacotes.

- [ ] **Step 1: Executar typecheck e linter em todo o monorepo**

Run: `pnpm typecheck`  
Run: `pnpm lint`  
Expected: 0 erros, código limpo.

- [ ] **Step 2: Executar todos os testes do monorepo**

Run: `pnpm --filter @aletheia/contracts test`  
Run: `pnpm --filter @aletheia/api test`  
Run: `pnpm --filter @aletheia/web test`  
Expected: 100% dos testes passando.

- [ ] **Step 3: Commit final e verificação de git log**

Verificar que não existem trailers de IA:
Run: `git log -n 5 --format=full`
