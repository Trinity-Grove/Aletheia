-- Removes the never-wired-up transactional outbox table (issue #47).
-- Zero application code reads or writes this model; decision was to
-- remove rather than implement, since there is no concrete use case in
-- the current roadmap.
DROP TABLE "outbox_messages";
