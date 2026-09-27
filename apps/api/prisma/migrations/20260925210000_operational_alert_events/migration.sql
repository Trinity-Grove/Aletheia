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
