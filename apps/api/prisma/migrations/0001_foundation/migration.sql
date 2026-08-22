CREATE TABLE "outbox_messages" (
  "id" uuid PRIMARY KEY,
  "event_type" text NOT NULL,
  "aggregate_type" text NOT NULL,
  "aggregate_id" uuid NOT NULL,
  "payload" jsonb NOT NULL,
  "occurred_at" timestamptz NOT NULL,
  "published_at" timestamptz,
  "attempts" integer NOT NULL DEFAULT 0,
  "idempotency_key" text NOT NULL UNIQUE
);

CREATE INDEX "outbox_messages_unpublished_idx"
  ON "outbox_messages" ("occurred_at")
  WHERE "published_at" IS NULL;
