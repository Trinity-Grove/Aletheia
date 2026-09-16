# Design Specification: Versioned Consents & Privacy Terms (Issue #27)

- **Date:** 2026-09-16
- **Status:** Approved
- **Issue Reference:** [Issue #27: [P1] Implementar privacidade, consentimento e auditoria para dados de menores](https://github.com/Trinity-Grove/Aletheia/issues/27)
- **Slice:** Slice 1 — Versioned Consent Definitions & Immutable Family Consent Records

---

## 1. Overview and Problem Statement

Aletheia handles sensitive educational, developmental, and spiritual data of minor students and their families. In compliance with LGPD (Lei Geral de Proteção de Dados - Lei 13.709/2018, Art. 14 e Art. 8º § 2º) and international standards (COPPA/FERPA), the platform must establish verifiable, auditable proof of consent given by parents/legal guardians.

Currently, terms of service and consent lack versioned definitions, immutable decision trails, and granular scopes (family-wide vs. learner-specific). This specification establishes:
1. A versioned catalog of consent definitions (`ConsentDefinition`), tracking legal policy versions, purposes, and scopes.
2. An append-only audit trail (`ConsentRecord`), ensuring every grant or revocation by a guardian is immutably recorded with actor, timestamp, IP address, and user-agent.
3. Multi-tenant family isolation, ensuring guardians can only act upon their own family and verified children.

---

## 2. Data Model

### 2.1 Enums
* **`DefinitionStatus`**: `DRAFT`, `PUBLISHED`, `DEPRECATED`, `ARCHIVED` (Standard catalog lifecycle).
* **`ConsentScope`**:
  * `FAMILY`: Terms binding the family unit (e.g., General Terms of Service, Platform Privacy Policy).
  * `LEARNER`: Terms specific to an individual student (e.g., Student Portal access, AI-assisted tutoring, external portfolio sharing).
* **`ConsentAction`**: `GRANTED`, `REVOKED`.

### 2.2 Prisma Schema Additions

```prisma
enum ConsentScope {
  FAMILY
  LEARNER
}

enum ConsentAction {
  GRANTED
  REVOKED
}

model ConsentDefinition {
  id              String           @id @default(uuid())
  code            String           // e.g. "TERMS_OF_SERVICE", "STUDENT_DATA_PROCESSING", "AI_TUTOR_SHARING"
  version         Int              @default(1)
  status          DefinitionStatus @default(DRAFT)
  schemaVersion   Int              @default(1)
  scope           ConsentScope     @default(FAMILY)
  mandatory       Boolean          @default(false)
  title           String
  description     String?
  content         String           @db.Text
  purposes        String[]         // Specified purposes (LGPD Art. 8 § 4)
  metadata        Json?
  publishedAt     DateTime?
  deprecatedAt    DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  records         ConsentRecord[]

  @@unique([code, version])
  @@index([status, code])
}

model ConsentRecord {
  id                    String            @id @default(uuid())
  familyId              String
  learnerId             String?           // Optional, required if definition scope is LEARNER
  consentDefinitionId   String
  action                ConsentAction     @default(GRANTED)
  consentedByUserId     String            // Legal guardian ID
  ipAddress             String?           // Authenticity context
  userAgent             String?           // Client context
  createdAt             DateTime          @default(now()) // Immutable timestamp

  family                Family            @relation(fields: [familyId], references: [id], onDelete: Cascade)
  learner               Learner?          @relation(fields: [learnerId], references: [id], onDelete: Cascade)
  consentDefinition     ConsentDefinition @relation(fields: [consentDefinitionId], references: [id], onDelete: Restrict)
  consentedByUser       User              @relation(fields: [consentedByUserId], references: [id], onDelete: Restrict)

  @@index([familyId, learnerId, consentDefinitionId, createdAt(sort: Desc)])
  @@index([consentedByUserId, createdAt])
}
```

---

## 3. Business Rules and Architecture

### 3.1 Immutability Discipline
* `ConsentRecord` has no `UPDATE` or `DELETE` path.
* A revocation is recorded as a new row with `action: REVOKED`.
* Re-granting after a revocation creates a new row with `action: GRANTED`.
* At any point in time $t$, the active state is determined by the most recent record for `(familyId, learnerId?, consentDefinitionId)`.

### 3.2 State Transition of Definitions
* Follows pure function `computeStatusTransition`:
  * `DRAFT` $\to$ `PUBLISHED` (activates term for guardian consent)
  * `PUBLISHED` $\to$ `DEPRECATED` (no new grants allowed; existing grants stay audited)
  * `DEPRECATED` $\to$ `ARCHIVED`
* Guard: Consent can only be granted to a definition with status `PUBLISHED`.

### 3.3 Scoping and Multi-Tenant Integrity
* If definition `scope === LEARNER`, `learnerId` is required. The service must verify that `learner.familyId === familyId`. A mismatch throws `BadRequestException`.
* If definition `scope === FAMILY`, `learnerId` must be `null` or omitted.
* Mandatory terms (`mandatory === true`) cannot be individually revoked via the revocation endpoint; doing so throws `BadRequestException`.

### 3.4 Active Status Resolution
Given a family $F$, an optional learner $L$, and a published definition $D$ with code $C$ and active version $V_{\text{active}}$:
1. Find latest `ConsentRecord` matching $F$, $L$, and $D.\text{code} === C$.
2. If record exists and record.version $=== V_{\text{active}}$ and record.action $=== \text{GRANTED} \implies$ **`ACTIVE`**.
3. If record exists and record.version $< V_{\text{active}}$ and record.action $=== \text{GRANTED} \implies$ **`OUTDATED`** (pending new version).
4. If record exists and record.action $=== \text{REVOKED} \implies$ **`REVOKED`**.
5. If no record exists $\implies$ **`PENDING`**.

---

## 4. API Endpoints

### 4.1 Admin Endpoints (Platform Admin Only)
* `POST /api/v1/admin/consent-definitions` — Create draft definition.
* `GET /api/v1/admin/consent-definitions` — List all definitions/versions.
* `GET /api/v1/admin/consent-definitions/:id` — Get definition details.
* `PATCH /api/v1/admin/consent-definitions/:id/status` — Status transition (`PUBLISHED`, `DEPRECATED`, `ARCHIVED`).

### 4.2 Public Endpoints
* `GET /api/v1/consent-definitions/published` — List current active terms and policies for public and client rendering.

### 4.3 Family Endpoints (Guardians Only, Scoped by `FamilyTenantGuard`)
* `GET /api/v1/families/:familyId/consents` — Overview of family and learner consents.
* `POST /api/v1/families/:familyId/consents/grant` — Submit consent agreement (`{ consentDefinitionId, learnerId? }`). Captures `req.ip` and `req.headers['user-agent']`.
* `POST /api/v1/families/:familyId/consents/revoke` — Revoke consent (`{ consentDefinitionId, learnerId? }`).
* `GET /api/v1/families/:familyId/consents/compliance` — Fast check returning `{ compliant: boolean, pendingMandatoryTerms: [...] }`.

### 4.4 Module Public Interface (`PRIVACY_PUBLIC_API`)
Exported interface for other modules:
```typescript
export interface PrivacyPublicApi {
  isConsentActive(familyId: string, consentCode: string, learnerId?: string): Promise<boolean>;
  getPendingMandatoryTerms(familyId: string): Promise<ConsentDefinitionDto[]>;
}
```

---

## 5. Testing and Verification Plan

1. **Contracts Suite (`packages/contracts`):**
   * Schema tests for DTO validation: `CreateConsentDefinitionSchema`, `GrantConsentSchema`, `RevokeConsentSchema`.
2. **Unit Tests (`apps/api`):**
   * State transition unit tests (`definition-status-transition.spec.ts`).
   * Service unit tests for catalog and family consent operations (`family-consent.service.spec.ts`, `consent-definitions.service.spec.ts`).
   * Enforcement of `scope` matching (`FAMILY` vs `LEARNER`).
   * Mandatory revocation prevention.
3. **Integration Tests (`privacy-consent.integration-spec.ts` against real Postgres):**
   * **Full flow:** Admin creates and publishes definition $\to$ Guardian grants consent $\to$ Context (`ipAddress`, `userAgent`, `consentedByUserId`) verified in DB.
   * **Immutability:** Guardian revokes then re-grants $\to$ exactly two distinct timestamped records exist.
   * **Multi-Tenant Isolation:** Guardian A cannot grant/revoke consent for Family B (`403 Forbidden`). Guardian A cannot attach Family B's child to a consent.
   * **New Version Compliance:** Publishing v2 of a mandatory term causes `/compliance` to return `compliant: false` until v2 is consented.
