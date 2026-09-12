# Data-driven main audit — 2026-09-12

Audited local and GitHub main at `2213a94c320022c08762e40fa6bb8241785dc668`, including PRs #119, #120 and #121. This assessment compares the original phase descriptions in issue #96 with shipped code, rather than treating narrower phase-completion comments as full acceptance.

| Phase | Shipped | Remaining against original scope |
| --- | --- | --- |
| 0: Foundation | Versioned definitions, admin catalog, published pedagogical template application and dynamic family catalog | Full legacy path replacement; current applyTemplate does read the database |
| 1: Profiles and inheritance | Versioned profiles, theological taxonomy, platform/family override resolver | Planner/content integration; no middle tenant tier; profile reference validation and actor attribution absent on audited main |
| 2: Evidence and assessment | Evidence submissions, exact competency/rubric versions, results and policy catalog | Executable progression and generic ProjectDefinition; no complete historical achievement/report integration |
| 3: Advanced theology and Bible tools | Eschatology as taxonomy data, BibleTranslationDefinition admin registry and translation comparison endpoint | Greek/Hebrew/manuscript infrastructure, explicit position relationships, theological perspectives comparison UI/content |

The latest phase-3 comment explicitly defers original-text/manuscript infrastructure. The Bible comparator integration test checks translation codes and result count, and explicitly permits empty content without a YouVersion application key. Therefore it demonstrates catalog resolution and endpoint wiring, not successful retrieval of real Bible passages. All four PR #120 CI checks reported success at inspection.

Conclusion: real deliveries exist across phases 0–3; the original four phases are not all functionally complete. This does not invalidate the delivered foundations. Future checklist updates should distinguish catalog representation, executable behavior and end-user integration.

## Work completed after this audit

Branch `feat/profile-progression` adds profile reference validation, authenticated actor attribution, serialized concurrent version allocation and read-only EVIDENCE_COUNT evaluation with prerequisites. Main `2213a94` was merged into this branch for regression verification; these additions are not part of audited main.

Verification on the integrated branch: 245 contract tests, 356 API unit tests and 126 PostgreSQL integration tests pass. API typecheck, lint and module boundaries pass. Independent code review found no actionable issues. Existing Fastify deprecation and ts-jest configuration warnings remain. No browser/product UI or live YouVersion retrieval was verified in this task.
