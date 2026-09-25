# Backoffice e Dashboard Operacional (#254) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar o frontend de administração e governança da plataforma em uma aplicação dedicada (`apps/backoffice`), desacoplar o produto do usuário final (`apps/web`), e implementar o Dashboard Operacional da Issue #254 com monitoramento de saturação da API/banco, links profundos para métricas nativas do Railway e recepção de webhooks para alertas de infraestrutura.

**Architecture:** O monorepo passa a ter duas superfícies web clientes (`apps/web` na porta 3000 para famílias/educandos e `apps/backoffice` na porta 3001 para platform admins) consumindo uma única API backend central (`apps/api`). A API agrega status de dependências e saturação (Postgres connection pool, MinIO, processo Node.js) em `/api/v1/admin/operations/status`, expõe endpoint seguro `/api/v1/webhooks/railway` para capturar alertas pré-configurados do Railway persistidos no Prisma (`OperationalAlertEvent`), e o Backoffice provê o cockpit operacional integrado com deep links para os gráficos de latência (p50/p95/p99) e erros nativos do Railway.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5.9, NestJS 11, Fastify 5, Prisma ORM 6, PostgreSQL, Zod, `@aletheia/ui`, `@aletheia/contracts`.

**Spec:** [`docs/superpowers/specs/2026-09-25-backoffice-and-operational-dashboard-design.md`](file:///C:/Users/wende/Projects/Covenant-Grove/Aletheia/docs/superpowers/specs/2026-09-25-backoffice-and-operational-dashboard-design.md)

## Global Constraints
- Zero AI-attribution trailers (`Co-Authored-By`, `Generated-By`, etc.) in commits, PRs, or comments.
- Manter RIGOROSAMENTE uma única API central (`apps/api`), sem duplicar serviços de backend.
- Autenticação e rotas em `apps/backoffice` estritamente restritas a usuários com `isPlatformAdmin === true`.
- Zero código ou componentes de administração restantes no `apps/web`.
- Tipagem 100% estrita e validação Zod via `@aletheia/contracts`.
- Não violar as regras de fronteira arquitetural (`pnpm check:boundaries`).

---

### Task 1: Contratos Zod em `@aletheia/contracts` e Modelo Prisma em `apps/api`

**Files:**
- Create: `packages/contracts/src/operations.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/contracts/tests/operations.test.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260925210000_operational_alert_events/migration.sql`

**Interfaces:**
- Produces: `OperationalStatusResponseSchema`, `OperationalStatusResponseDto`, `OperationalAlertEventSchema`, `OperationalAlertEventDto`, `AcknowledgeAlertSchema`, `AcknowledgeAlertDto`, `RailwayWebhookPayloadSchema`, `RailwayWebhookPayloadDto`
- Produces: Prisma model `OperationalAlertEvent` (tabela `operational_alert_events`)

- [ ] **Step 1: Escrever teste de falha para os contratos em `@aletheia/contracts`**

Criar `packages/contracts/tests/operations.test.ts`:
```typescript
import { describe, expect, it } from 'vitest';
import {
  OperationalStatusResponseSchema,
  OperationalAlertEventSchema,
  AcknowledgeAlertSchema,
  RailwayWebhookPayloadSchema,
} from '../src/operations.js';

describe('Operational Contracts & Schemas', () => {
  it('validates a valid OperationalStatusResponse payload', () => {
    const valid = {
      service: 'aletheia-api',
      version: '0.1.0',
      uptimeSeconds: 3600,
      timestamp: new Date().toISOString(),
      overallHealth: 'HEALTHY',
      dependencies: {
        postgres: { status: 'UP', responseTimeMs: 4, activeConnections: 5 },
        objectStorage: { status: 'UP', responseTimeMs: 12 },
        redis: { status: 'NOT_CONFIGURED', responseTimeMs: 0 },
      },
      resources: {
        memoryHeapUsedMb: 64,
        memoryHeapTotalMb: 128,
        memoryRssMb: 180,
        nodeVersion: 'v24.13.3',
      },
      railwayDashboardLinks: {
        projectUrl: 'https://railway.com/project/123',
        metricsUrl: 'https://railway.com/project/123/metrics',
        logsUrl: 'https://railway.com/project/123/logs',
      },
    };

    const parsed = OperationalStatusResponseSchema.parse(valid);
    expect(parsed.service).toBe('aletheia-api');
    expect(parsed.overallHealth).toBe('HEALTHY');
  });

  it('validates RailwayWebhookPayloadSchema with passthrough', () => {
    const webhook = {
      type: 'CRASH',
      environment: 'production',
      service: { id: 'srv-1', name: 'api' },
      message: 'Container exited with code 1',
      severity: 'CRITICAL',
      customField: 123,
    };

    const parsed = RailwayWebhookPayloadSchema.parse(webhook);
    expect(parsed.type).toBe('CRASH');
    expect((parsed as any).customField).toBe(123);
  });
});
```

- [ ] **Step 2: Executar teste para verificar falha**

Run: `pnpm --filter @aletheia/contracts test packages/contracts/tests/operations.test.ts`
Expected: FAIL (módulo `../src/operations.js` não encontrado).

- [ ] **Step 3: Implementar schemas em `packages/contracts/src/operations.ts` e exportar em `index.ts`**

Criar `packages/contracts/src/operations.ts`:
```typescript
import { z } from 'zod';

export const DependencyProbeStatusSchema = z.object({
  status: z.enum(['UP', 'DOWN', 'DEGRADED', 'NOT_CONFIGURED']),
  responseTimeMs: z.number().nonnegative(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const OperationalStatusResponseSchema = z.object({
  service: z.literal('aletheia-api'),
  version: z.string(),
  uptimeSeconds: z.number().nonnegative(),
  timestamp: z.string().datetime(),
  overallHealth: z.enum(['HEALTHY', 'DEGRADED', 'CRITICAL']),
  dependencies: z.object({
    postgres: DependencyProbeStatusSchema.extend({
      activeConnections: z.number().int().nonnegative().optional(),
    }),
    objectStorage: DependencyProbeStatusSchema,
    redis: DependencyProbeStatusSchema,
  }),
  resources: z.object({
    memoryHeapUsedMb: z.number().nonnegative(),
    memoryHeapTotalMb: z.number().nonnegative(),
    memoryRssMb: z.number().nonnegative(),
    nodeVersion: z.string(),
  }),
  railwayDashboardLinks: z.object({
    projectUrl: z.string().url().optional(),
    metricsUrl: z.string().url().optional(),
    logsUrl: z.string().url().optional(),
  }),
});
export type OperationalStatusResponseDto = z.infer<typeof OperationalStatusResponseSchema>;

export const OperationalAlertEventSchema = z.object({
  id: z.string().uuid(),
  source: z.string(),
  eventType: z.string(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  serviceName: z.string().nullable(),
  message: z.string(),
  payload: z.record(z.string(), z.unknown()),
  receivedAt: z.string().datetime(),
  acknowledgedAt: z.string().datetime().nullable(),
  acknowledgedBy: z.string().uuid().nullable(),
});
export type OperationalAlertEventDto = z.infer<typeof OperationalAlertEventSchema>;

export const AcknowledgeAlertSchema = z.object({
  notes: z.string().optional(),
});
export type AcknowledgeAlertDto = z.infer<typeof AcknowledgeAlertSchema>;

export const RailwayWebhookPayloadSchema = z.object({
  type: z.string(),
  environment: z.string().optional(),
  project: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
  }).optional(),
  service: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
  }).optional(),
  deployment: z.object({
    id: z.string().optional(),
    status: z.string().optional(),
  }).optional(),
  message: z.string().optional(),
  text: z.string().optional(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
}).passthrough();
export type RailwayWebhookPayloadDto = z.infer<typeof RailwayWebhookPayloadSchema>;
```
Exportar no `packages/contracts/src/index.ts`:
```typescript
export * from './operations.js';
```

- [ ] **Step 4: Executar testes de contratos e build**

Run: `pnpm --filter @aletheia/contracts test && pnpm --filter @aletheia/contracts build`
Expected: PASS (todos os testes passando, build limpo).

- [ ] **Step 5: Adicionar modelo `OperationalAlertEvent` no Prisma e gerar migration**

Em `apps/api/prisma/schema.prisma`, adicionar:
```prisma
enum AlertSeverity {
  INFO
  WARNING
  CRITICAL
}

model OperationalAlertEvent {
  id              String        @id @default(uuid()) @db.Uuid
  source          String        @default("RAILWAY")
  eventType       String        @map("event_type")
  severity        AlertSeverity @default(WARNING)
  serviceName     String?       @map("service_name")
  message         String
  payload         Json          @default("{}")
  receivedAt      DateTime      @default(now()) @map("received_at") @db.Timestamptz
  acknowledgedAt  DateTime?     @map("acknowledged_at") @db.Timestamptz
  acknowledgedBy  String?       @map("acknowledged_by") @db.Uuid

  @@index([receivedAt(sort: Desc)])
  @@index([severity])
  @@index([eventType])
  @@map("operational_alert_events")
}
```

Criar `apps/api/prisma/migrations/20260925210000_operational_alert_events/migration.sql`:
```sql
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

CREATE TABLE "operational_alert_events" (
    "id" UUID NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'RAILWAY',
    "event_type" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'WARNING',
    "service_name" TEXT,
    "message" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "received_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMPTZ,
    "acknowledged_by" UUID,

    CONSTRAINT "operational_alert_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "operational_alert_events_received_at_idx" ON "operational_alert_events"("received_at" DESC);
CREATE INDEX "operational_alert_events_severity_idx" ON "operational_alert_events"("severity");
CREATE INDEX "operational_alert_events_event_type_idx" ON "operational_alert_events"("event_type");
```

Executar: `pnpm --filter @aletheia/api prisma:generate`

- [ ] **Step 6: Commit**

```bash
git add packages/contracts/ apps/api/prisma/
git commit -m "feat(contracts,api): add operational contracts and alert events schema"
```

---

### Task 2: Backend `apps/api` — `OperationsModule` e Receptor de Webhooks do Railway

**Files:**
- Create: `apps/api/src/modules/operations/operations.service.ts`
- Create: `apps/api/src/modules/operations/operations.controller.ts`
- Create: `apps/api/src/modules/operations/railway-webhook.guard.ts`
- Create: `apps/api/src/modules/operations/railway-webhook.controller.ts`
- Create: `apps/api/src/modules/operations/operations.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/src/modules/operations/operations.service.spec.ts`
- Create: `apps/api/src/modules/operations/operations.controller.spec.ts`
- Create: `apps/api/src/modules/operations/railway-webhook.controller.spec.ts`

**Interfaces:**
- Consumes: `@aletheia/contracts` (`OperationalStatusResponseDto`, etc.)
- Consumes: `DependencyProbe` de `apps/api/src/health/dependency-probe.ts`
- Produces: Endpoints `GET /api/v1/admin/operations/status`, `GET /api/v1/admin/operations/alerts`, `POST /api/v1/admin/operations/alerts/:id/acknowledge`
- Produces: Endpoint `POST /api/v1/webhooks/railway`

- [ ] **Step 1: Escrever testes unitários para `OperationsService`**

Criar `apps/api/src/modules/operations/operations.service.spec.ts`:
Validar agregação de probes (Postgres, MinIO), cálculo de uptime, memória e persistência de alertas.

- [ ] **Step 2: Executar teste para verificar falha**

Run: `pnpm --filter @aletheia/api test operations.service.spec.ts`
Expected: FAIL (serviço não encontrado).

- [ ] **Step 3: Implementar `OperationsService`**

Criar `apps/api/src/modules/operations/operations.service.ts`:
- Injetar `PrismaService`, `POSTGRES_PROBE`, `OBJECT_STORAGE_PROBE`, `REDIS_PROBE`.
- Medir tempo de resposta com `performance.now()`.
- Montar `OperationalStatusResponseDto` com links do Railway via env (`RAILWAY_PROJECT_URL`, `RAILWAY_METRICS_URL`, `RAILWAY_LOGS_URL`).
- Métodos: `getStatus()`, `listAlerts(limit, acknowledged?)`, `acknowledgeAlert(id, userId, notes?)`, `handleRailwayWebhook(payload)`.

- [ ] **Step 4: Implementar `RailwayWebhookGuard` e `RailwayWebhookController`**

Criar `railway-webhook.guard.ts` verificando header `x-railway-signature` ou `x-railway-secret` contra `process.env.RAILWAY_WEBHOOK_SECRET`. Se não coincidir, lançar `UnauthorizedException`.
Criar `railway-webhook.controller.ts` expondo `POST /api/v1/webhooks/railway` chamando `operationsService.handleRailwayWebhook()`.

- [ ] **Step 5: Implementar `OperationsController`**

Criar `operations.controller.ts` expondo rotas protegidas sob `/api/v1/admin/operations`:
- `GET /status` (@UseGuards(JwtAuthGuard, PlatformAdminGuard))
- `GET /alerts` (@UseGuards(JwtAuthGuard, PlatformAdminGuard))
- `POST /alerts/:id/acknowledge` (@UseGuards(JwtAuthGuard, PlatformAdminGuard))

- [ ] **Step 6: Criar `OperationsModule` e registrar no `AppModule`**

Conectar os controllers e providers no `OperationsModule`, e importar no `AppModule`.

- [ ] **Step 7: Executar testes de unidade e integração da API**

Run: `pnpm --filter @aletheia/api test`
Expected: PASS com 0 erros.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/
git commit -m "feat(api): add operations module, health saturation probes, and railway webhook handler"
```

---

### Task 3: Criação de `apps/backoffice` (Scaffolding, Auth Guard e Shell Corporativo)

**Files:**
- Create: `apps/backoffice/package.json`
- Create: `apps/backoffice/tsconfig.json`
- Create: `apps/backoffice/next.config.mjs`
- Create: `apps/backoffice/app/layout.tsx`
- Create: `apps/backoffice/app/page.tsx`
- Create: `apps/backoffice/app/login/page.tsx`
- Create: `apps/backoffice/src/lib/auth/admin-auth-context.tsx`
- Create: `apps/backoffice/src/components/layout/admin-shell.tsx`
- Create: `apps/backoffice/tests/admin-auth.test.tsx`

**Interfaces:**
- Consumes: `@aletheia/ui`, `@aletheia/contracts`
- Consumes: API `/api/v1/auth/me`, `/api/v1/auth/login`
- Produces: `AdminAuthContext`, `AdminShell`, rotas protegidas por `isPlatformAdmin`

- [ ] **Step 1: Criar `package.json` e configuração do `apps/backoffice`**

Configurar `apps/backoffice/package.json` com porta `3001` no script `dev`:
`"dev": "next dev -p 3001"`, `"build": "next build"`, dependências `@aletheia/ui: "workspace:*"`, `@aletheia/contracts: "workspace:*"`, `next: "16.3.2"`, `react: "19.0.0"`.

- [ ] **Step 2: Escrever teste de falha para `AdminAuthContext` e bloqueio de não-admin**

Criar `apps/backoffice/tests/admin-auth.test.tsx`:
- Renderizar componente protegido com usuário sem `isPlatformAdmin: false` -> verificar exibição de tela de "Acesso Não Autorizado".
- Renderizar com usuário com `isPlatformAdmin: true` -> renderizar conteúdo normalmente.

- [ ] **Step 3: Implementar `AdminAuthContext` e `AdminShell`**

Criar `apps/backoffice/src/lib/auth/admin-auth-context.tsx`:
Validar sessão via `/api/v1/auth/me`. Se `isPlatformAdmin !== true`, bloquear visualização.
Criar `apps/backoffice/src/components/layout/admin-shell.tsx`:
Sidebar corporativa com links para `/operations`, `/catalog` e `/moderation`, e indicador de usuário logado.

- [ ] **Step 4: Executar testes do Backoffice**

Run: `pnpm --filter @aletheia/backoffice test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backoffice/
git commit -m "feat(backoffice): scaffold apps/backoffice with admin auth guard and shell"
```

---

### Task 4: Migração das Telas de Catálogo e Moderação para `apps/backoffice`

**Files:**
- Create: `apps/backoffice/app/catalog/page.tsx`
- Create: `apps/backoffice/src/components/catalog/admin-catalog.tsx`
- Create: `apps/backoffice/app/moderation/page.tsx`
- Create: `apps/backoffice/src/components/moderation/pack-moderation-dashboard.tsx`
- Create: `apps/backoffice/tests/catalog-moderation.test.tsx`

**Interfaces:**
- Consumes: `@aletheia/ui`, `@aletheia/contracts`
- Consumes: `/api/v1/admin/curriculum-definitions/*`, `/api/v1/admin/moderation/*`

- [ ] **Step 1: Migrar `admin-catalog.tsx` para `apps/backoffice`**

Copiar `apps/web/src/components/admin/admin-catalog.tsx` para `apps/backoffice/src/components/catalog/admin-catalog.tsx`.
Criar página `apps/backoffice/app/catalog/page.tsx` renderizando dentro de `AdminShell`.

- [ ] **Step 2: Migrar `pack-moderation-dashboard.tsx` para `apps/backoffice`**

Copiar `apps/web/src/components/admin/pack-moderation-dashboard.tsx` para `apps/backoffice/src/components/moderation/pack-moderation-dashboard.tsx`.
Criar página `apps/backoffice/app/moderation/page.tsx` renderizando dentro de `AdminShell`.

- [ ] **Step 3: Criar testes de regressão no `apps/backoffice`**

Criar `apps/backoffice/tests/catalog-moderation.test.tsx` testando renderização de catálogo e moderação sob `AdminShell`.

- [ ] **Step 4: Executar testes**

Run: `pnpm --filter @aletheia/backoffice test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backoffice/
git commit -m "feat(backoffice): migrate catalog management and community moderation views"
```

---

### Task 5: Dashboard Operacional no Backoffice (`/operations`) e Cockpit Railway

**Files:**
- Create: `apps/backoffice/app/operations/page.tsx`
- Create: `apps/backoffice/src/components/operations/operational-dashboard.tsx`
- Create: `apps/backoffice/src/components/operations/railway-metrics-card.tsx`
- Create: `apps/backoffice/src/components/operations/operational-alerts-feed.tsx`
- Create: `apps/backoffice/tests/operations-dashboard.test.tsx`

**Interfaces:**
- Consumes: `GET /api/v1/admin/operations/status`
- Consumes: `GET /api/v1/admin/operations/alerts`
- Consumes: `POST /api/v1/admin/operations/alerts/:id/acknowledge`
- Produces: Interface completa do Dashboard Operacional (Issue #254)

- [ ] **Step 1: Escrever teste de falha para o Dashboard Operacional**

Criar `apps/backoffice/tests/operations-dashboard.test.tsx`:
- Mockar `/api/v1/admin/operations/status` e `/api/v1/admin/operations/alerts`.
- Verificar se cards de saúde do Postgres, MinIO e processo são renderizados.
- Verificar se os links para o Railway (latência p50/p95/p99, erros HTTP, CPU/RAM) são exibidos corretamente.
- Verificar interação com o botão de Acknowledge de alerta.

- [ ] **Step 2: Executar teste para verificar falha**

Run: `pnpm --filter @aletheia/backoffice test operations-dashboard.test.tsx`
Expected: FAIL (componentes não encontrados).

- [ ] **Step 3: Implementar componentes do Dashboard Operacional**

Criar:
- `railway-metrics-card.tsx`: Cartões informativos de métricas externas com badges e botões de atalho direto para o painel do Railway (p50/p95/p99, HTTP Error Rate, CPU/RAM, Logs).
- `operational-alerts-feed.tsx`: Feed de alertas recebidos do webhook do Railway, com filtros por severidade e ação de Acknowledge.
- `operational-dashboard.tsx`: Grid consolidado integrando status de dependências, cockpit do Railway e feed de alertas.
- `app/operations/page.tsx`: Página que carrega os dados via fetch autenticado e renderiza o dashboard dentro do `AdminShell`.

- [ ] **Step 4: Executar testes e build**

Run: `pnpm --filter @aletheia/backoffice test && pnpm --filter @aletheia/backoffice build`
Expected: PASS com 0 erros.

- [ ] **Step 5: Commit**

```bash
git add apps/backoffice/
git commit -m "feat(backoffice): implement operational dashboard, railway cockpit, and alert feed"
```

---

### Task 6: Desacoplamento do `apps/web` e Redirecionamentos HTTP

**Files:**
- Modify: `apps/web/next.config.mjs`
- Modify: `apps/web/src/components/layout/product-shell.tsx`
- Delete: `apps/web/app/(dashboard)/admin/catalog/page.tsx`
- Delete: `apps/web/app/(dashboard)/admin/moderation/page.tsx`
- Delete: `apps/web/src/components/admin/admin-catalog.tsx`
- Delete: `apps/web/src/components/admin/pack-moderation-dashboard.tsx`
- Delete: `apps/web/tests/admin-catalog.test.tsx`
- Delete: `apps/web/tests/admin-moderation.test.tsx`
- Create: `apps/web/tests/web-admin-decoupling.test.tsx`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_BACKOFFICE_URL` (default: `http://localhost:3001`)
- Produces: `apps/web` 100% livre de código administrativo; redirects HTTP para o Backoffice.

- [ ] **Step 1: Remover rotas e componentes admin do `apps/web`**

Excluir:
- `apps/web/app/(dashboard)/admin/`
- `apps/web/src/components/admin/`
- `apps/web/tests/admin-catalog.test.tsx`
- `apps/web/tests/admin-moderation.test.tsx`

- [ ] **Step 2: Remover links admin da barra de navegação do `apps/web`**

Em `apps/web/src/components/layout/product-shell.tsx`, remover quaisquer itens de menu apontando para `/admin/catalog` ou `/admin/moderation`.

- [ ] **Step 3: Adicionar regras de redirecionamento em `apps/web/next.config.mjs`**

Configurar `redirects()` apontando `/admin/:path*` para `${process.env.NEXT_PUBLIC_BACKOFFICE_URL || 'http://localhost:3001'}/:path*`.

- [ ] **Step 4: Escrever teste garantindo que o `apps/web` não possui links de admin**

Criar `apps/web/tests/web-admin-decoupling.test.tsx`:
Verificar que `MAIN_NAV_ITEMS` não contém rotas administrativas e que a navegação do produto está limpa.

- [ ] **Step 5: Executar testes e build do `apps/web`**

Run: `pnpm --filter @aletheia/web test && pnpm --filter @aletheia/web build`
Expected: PASS com 0 erros.

- [ ] **Step 6: Commit**

```bash
git add apps/web/
git commit -m "refactor(web): decouple administrative routes and add redirects to backoffice"
```

---

### Task 7: Verificação Global e Gate de Qualidade

**Files:**
- None (apenas verificação e documentação)

- [ ] **Step 1: Verificar limites arquiteturais**

Run: `pnpm check:boundaries`
Expected: 14/14 tests passing, 0 violations.

- [ ] **Step 2: Executar typecheck em todos os pacotes**

Run: `pnpm -r typecheck`
Expected: PASS sem erros em contracts, api, web e backoffice.

- [ ] **Step 3: Executar linter em todos os pacotes**

Run: `pnpm -r --if-present lint`
Expected: PASS sem erros/avisos.

- [ ] **Step 4: Atualizar documentação operacional**

Atualizar `docs/operations/observability.md` (ou criar se não existir) documentando o Railway como fonte de métricas de infraestrutura (latência p50/p95/p99, erro HTTP, CPU/RAM), o Backoffice como cockpit operacional consolidado e o webhook de alertas configurado.

- [ ] **Step 5: Commit final**

```bash
git add docs/
git commit -m "docs(operations): update observability runbook with railway metrics and backoffice cockpit"
```
