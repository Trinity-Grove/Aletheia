# Voluntary Support & Community Donations (PIX & Google Pay) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement voluntary patronage, PIX and Google Pay donations without paywalls, limits or feature gating, keeping 100% of Aletheia free and accessible to all families.

**Architecture:** Add domain schemas in `@aletheia/contracts` for donation intents, records, and subscriptions. Create database models in Prisma with migration. Build decoupled `DonationsModule` in `apps/api` with pluggable `DonationGateway` (defaulting to testable `MockDonationGateway` with Mercado Pago / Asaas support) and idempotent webhooks. Implement dedicated `/support` page, settings tab, and receipt history in `apps/web`.

**Tech Stack:** TypeScript, NestJS, Prisma, PostgreSQL, Next.js (App Router), React, Tailwind CSS, Vitest, Jest.

**Spec:** [`docs/superpowers/specs/2026-09-18-voluntary-support-and-donations-design.md`](file:///C:/Users/wende/Projects/Covenant-Grove/Aletheia/docs/superpowers/specs/2026-09-18-voluntary-support-and-donations-design.md)  
**Reference Issue:** [Issue #32](https://github.com/Trinity-Grove/Aletheia/issues/32)

## Global Constraints
- Zero AI-attribution trailers (`Co-Authored-By`, `Generated-By`, etc.) in commits, PRs, or comments.
- 100% feature equality: NO paywalls, NO gates, NO limits on children/subjects/usage.
- Multi-tenant strict isolation: every donation record and subscription is scoped to `familyId`.
- Strictly follow TDD: write failing test, verify failure, implement minimal code, verify pass.
- 100% test pass rate before pull request and squash merge.

---

### Task 1: Contratos e Schemas Zod (`@aletheia/contracts`)

**Files:**
- Create: `packages/contracts/src/donation.ts`
- Create: `packages/contracts/src/donation.test.ts`
- Modify: `packages/contracts/src/index.ts`

**Interfaces:**
- Produces:
  - `donationFrequencySchema`, `DonationFrequency` ('ONE_TIME' | 'MONTHLY')
  - `donationPaymentMethodSchema`, `DonationPaymentMethod` ('PIX' | 'GOOGLE_PAY' | 'CREDIT_CARD')
  - `donationStatusSchema`, `DonationStatus` ('PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED')
  - `createDonationIntentSchema`, `CreateDonationIntentDto`
  - `donationIntentResponseSchema`, `DonationIntentResponseDto`
  - `donationRecordResponseSchema`, `DonationRecordResponseDto`
  - `supporterSubscriptionResponseSchema`, `SupporterSubscriptionResponseDto`
  - `donationWebhookPayloadSchema`, `DonationWebhookPayloadDto`

- [ ] **Step 1: Write failing unit tests for donation schemas in `donation.test.ts`**
- [ ] **Step 2: Implement schemas in `donation.ts` and export from `index.ts`**
- [ ] **Step 3: Run contracts tests: `pnpm --filter @aletheia/contracts test`**
- [ ] **Step 4: Commit changes: `feat(contracts): add schemas and dtos for voluntary donations and subscriptions`**

---

### Task 2: Prisma Schema & Migração de Banco de Dados (`apps/api`)

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260918190000_add_donations_and_subscriptions/migration.sql`

**Interfaces:**
- Produces:
  - Table `donation_records` with UUID, family_id, amount_cents, status, gateway_provider, pix_qr_code_url, pix_copia_e_cola, confirmed_at.
  - Table `supporter_subscriptions` with UUID, family_id, amount_cents, status, gateway_subscription_id, cancelled_at.
  - Relations on `Family.donations` and `Family.supporterSubscriptions`.

- [ ] **Step 1: Add Prisma models `DonationRecord` and `SupporterSubscription` and enums to `schema.prisma`**
- [ ] **Step 2: Create SQL migration file `migration.sql` with indices and foreign keys**
- [ ] **Step 3: Run prisma generate: `pnpm --filter @aletheia/api prisma:generate`**
- [ ] **Step 4: Commit changes: `feat(api): add prisma models and migration for donations and subscriptions`**

---

### Task 3: Camada de Gateway de Doações (`DonationGateway`) & Driver Mock (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/donations/infrastructure/donation-gateway.interface.ts`
- Create: `apps/api/src/modules/donations/infrastructure/mock-donation-gateway.ts`
- Create: `apps/api/src/modules/donations/infrastructure/mock-donation-gateway.spec.ts`
- Create: `apps/api/src/modules/donations/infrastructure/mercadopago-donation-gateway.ts`
- Create: `apps/api/src/modules/donations/infrastructure/donation-gateway.factory.ts`

**Interfaces:**
- Produces:
  - `DonationGateway` interface: `createOneTimeIntent`, `createSubscriptionIntent`, `cancelSubscription`, `parseWebhook`.
  - `MockDonationGateway` generating instant test PIX QR code and mock payment confirmation.
  - `MercadoPagoDonationGateway` for real PIX & Google Pay processing.

- [ ] **Step 1: Write failing unit test for `MockDonationGateway`**
- [ ] **Step 2: Implement `DonationGateway` interface and `MockDonationGateway`**
- [ ] **Step 3: Implement `MercadoPagoDonationGateway` and factory**
- [ ] **Step 4: Run gateway tests: `pnpm --filter @aletheia/api test src/modules/donations/infrastructure`**
- [ ] **Step 5: Commit changes: `feat(api): implement donation gateway abstraction and mock provider`**

---

### Task 4: Serviço, Controladores e Webhooks Idempotentes (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/donations/domain/donation.entity.ts`
- Create: `apps/api/src/modules/donations/infrastructure/donations.repository.ts`
- Create: `apps/api/src/modules/donations/application/donations.service.ts`
- Create: `apps/api/src/modules/donations/application/donations.service.spec.ts`
- Create: `apps/api/src/modules/donations/presentation/donations.controller.ts`
- Create: `apps/api/src/modules/donations/presentation/donation-webhooks.controller.ts`
- Create: `apps/api/src/modules/donations/presentation/donations.controller.spec.ts`
- Create: `apps/api/src/modules/donations/donations.module.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Produces:
  - `POST /api/v1/families/:familyId/donations/create-intent`
  - `GET /api/v1/families/:familyId/donations/:id/status`
  - `GET /api/v1/families/:familyId/donations/history`
  - `GET /api/v1/families/:familyId/donations/subscriptions`
  - `DELETE /api/v1/families/:familyId/donations/subscriptions/:id`
  - `POST /api/v1/donations/webhooks/:provider` (idempotent confirmation)

- [ ] **Step 1: Write failing unit tests for `DonationsService`**
- [ ] **Step 2: Implement `DonationsRepository` and `DonationsService`**
- [ ] **Step 3: Implement `DonationsController` and `DonationWebhooksController` with `FamilyTenantGuard`**
- [ ] **Step 4: Register `DonationsModule` in `app.module.ts`**
- [ ] **Step 5: Run tests: `pnpm --filter @aletheia/api test src/modules/donations`**
- [ ] **Step 6: Commit changes: `feat(api): add donations service, controllers, and webhook handling`**

---

### Task 5: Interface de Apoio Voluntário, Recibos e Configurações (`apps/web`)

**Files:**
- Create: `apps/web/src/components/support/donation-form-card.tsx`
- Create: `apps/web/src/components/support/donation-receipts-table.tsx`
- Create: `apps/web/app/(dashboard)/support/page.tsx`
- Create: `apps/web/src/components/settings/supporter-settings-card.tsx`
- Modify: `apps/web/src/components/settings/family-general-settings.tsx`
- Modify: `apps/web/src/components/product-shell/navigation.tsx`
- Create: `apps/web/tests/donation-support.test.tsx`

**Interfaces:**
- Produces:
  - Dedicada `/support` page with philosophy banner, suggested amounts, PIX QR code + copia-e-cola with live status checker, and Google Pay option.
  - Supporter receipt table showing history and cancel subscription option.
  - Settings card in `/settings` allowing families to manage their voluntary contributions.
  - Friendly link "Apoiar o Projeto ❤️" in navigation.

- [ ] **Step 1: Write failing frontend tests in `apps/web/tests/donation-support.test.tsx`**
- [ ] **Step 2: Implement `DonationFormCard` with quick amounts, PIX copy-to-clipboard, and Google Pay**
- [ ] **Step 3: Implement `DonationReceiptsTable` and `/support` page**
- [ ] **Step 4: Integrate `SupporterSettingsCard` and navigation link**
- [ ] **Step 5: Run frontend tests: `pnpm --filter @aletheia/web test tests/donation-support.test.tsx`**
- [ ] **Step 6: Commit changes: `feat(web): add support page, donation form, and receipts history`**

---

### Task 6: Validação Completa, Regressão, PR e Merge

- [ ] **Step 1: Run full test suite: contracts, api, web**
- [ ] **Step 2: Push branch to remote origin**
- [ ] **Step 3: Open PR using `gh pr create` referencing Issue #32**
- [ ] **Step 4: Squash merge PR using `gh pr merge --squash --delete-branch`**
- [ ] **Step 5: Clean up worktree, prune, update `main`**
