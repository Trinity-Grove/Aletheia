# Profile integrity and evidence progression

User approved issues #96 work items 1, 2 and 3 on 2026-09-12 after updating #36. Implement in feat/profile-progression.

## Profiles
New writes must reference published catalog entries. Validate primary and secondary pedagogical codes, preferred theological tradition, and each override position's topic. Cross-tradition overrides remain allowed. Reject duplicate secondary codes and repetition of the primary model. Invalid writes return 400 and create no history. Existing history remains readable even if definitions are deprecated later.

Every new profile version records the authenticated user. Existing rows retain a nullable actor rather than invented attribution. Serialize version allocation using a transaction and a lock on the family's row before reading the latest version and inserting. This protects concurrent requests across application instances. Preserve append-only history.

## Progression
Add a family-scoped, read-only evaluation endpoint accepting `trackingId` and exact published `policyId`. Resolve learner, exact competency version and curriculum from LearnerCompetencyTracking. The first engine operation is EVIDENCE_COUNT with positive integer minimumEvidenceCount. Count only VALIDATED submissions for that learner and exact competency version. Return tracking ID/status, activated curriculum ID, policy and competency IDs/versions, count, threshold, unmet prerequisites, and an explainable state. Unsupported types/schemas or invalid rules must never produce mastery.

Prerequisites refer to exact competency and policy IDs and must be tracked for the same learner; evaluate recursively using the same rules, reject missing references and cycles, and bound traversal. Enforce policy competency scope and exact activated curriculum scope, not merely membership in any curriculum. Tracked competencies/curricula remain evaluable after DEPRECATED/ARCHIVED; reject DRAFT and mismatched tracked versions. RETIRED tracking remains readable and explicitly identified in the response. Policies must remain PUBLISHED because tracking does not pin a policy yet. Preserve existing LearningObjective/LearningRecord flows; this endpoint exposes current computed progression without silently mutating historical achievements. Do not claim hours, mentor assessment or persisted achievement snapshots are implemented.

## Integration update — 2026-09-13

User approved adapting task 3 to main db7adb1 (#128) while preserving tasks 1/2. The existing evaluation route remains GET families/:familyId/curriculum/progression/evaluation, but its unpublished query contract now requires trackingId + policyId, rejecting arbitrary learner/competency fields. No extra tracking tables or migrations are needed. Main #127's profile settings must preserve loaded overrides/topicOverrides and remove primary/secondary duplication when switching models. No visual redesign.

## Validation
Use contract tests for payloads, real PostgreSQL integration tests for profile reference validation, actor attribution, concurrent writes, rollback/no-write on invalid references, family isolation, and progression results including unsupported policies, prerequisites/cycles, evidence validation, version isolation and scope. Run typecheck, lint and module boundaries. No deployment or merge is part of this authorization.
