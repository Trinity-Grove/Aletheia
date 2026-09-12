-- Cross-cutting eschatological schools of thought (issue #96 section 15)
-- aren't owned by one denomination/tradition the way most doctrinal
-- positions are. Relaxing this NOT NULL constraint is additive: no data
-- is lost, no existing row's traditionId changes, and no behavior of any
-- existing read/write path changes (nothing currently rejects or
-- requires a null traditionId at the application layer either way).
ALTER TABLE "theological_position_definitions" ALTER COLUMN "tradition_id" DROP NOT NULL;
