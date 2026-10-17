ALTER TABLE "mentor_grants"
ADD COLUMN "can_approve_progression" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "learner_competency_approval_events" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "tracking_id" UUID NOT NULL,
    "competency_definition_id" UUID NOT NULL,
    "competency_version" INTEGER NOT NULL,
    "progression_policy_id" UUID NOT NULL,
    "policy_version" INTEGER NOT NULL,
    "assessment_result_id" UUID,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "actor_user_id" UUID NOT NULL,
    "idempotency_key" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learner_competency_approval_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "learner_competency_approval_events_decision_check" CHECK ("decision" IN ('APPROVED', 'RETURNED')),
    CONSTRAINT "learner_competency_approval_events_return_reason_check" CHECK ("decision" <> 'RETURNED' OR COALESCE(length(trim("reason")), 0) > 0),
    CONSTRAINT "learner_competency_approval_events_family_id_idempotency_key_key" UNIQUE ("family_id", "idempotency_key"),
    CONSTRAINT "learner_competency_approval_events_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "learner_competency_approval_events_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "learner_competency_approval_events_tracking_id_fkey" FOREIGN KEY ("tracking_id") REFERENCES "learner_competency_tracking"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "learner_competency_approval_events_competency_definition_id_fkey" FOREIGN KEY ("competency_definition_id") REFERENCES "competency_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "learner_competency_approval_events_progression_policy_id_fkey" FOREIGN KEY ("progression_policy_id") REFERENCES "progression_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "learner_competency_approval_events_assessment_result_id_fkey" FOREIGN KEY ("assessment_result_id") REFERENCES "assessment_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "learner_competency_approval_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "learner_competency_approval_events_family_id_learner_id_tracking_id_created_at_idx"
ON "learner_competency_approval_events"("family_id", "learner_id", "tracking_id", "created_at");

CREATE FUNCTION reject_competency_approval_event_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'learner competency approval events are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "learner_competency_approval_events_append_only"
BEFORE UPDATE OR DELETE ON "learner_competency_approval_events"
FOR EACH ROW EXECUTE FUNCTION reject_competency_approval_event_mutation();
