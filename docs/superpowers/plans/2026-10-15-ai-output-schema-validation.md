# Plan: validate AI lesson-plan output before persistence

## Task 1 — red tests

- Extend `ai-suggestion.service.spec.ts` with a malformed provider response case.
- Assert the service rejects with `BadRequestException` and does not call suggestion creation or quota recording.
- Keep the existing happy-path test as the regression test for successful parsing.

## Task 2 — minimal implementation

- Import `lessonPlanDraftContentSchema` in `AiSuggestionService`.
- Parse `llmResult.parsedJson ?? JSON.parse(llmResult.text)` immediately after the output safety scan.
- Map `ZodError` and invalid JSON to a stable `BadRequestException` without exposing raw model output.
- Use the parsed value for persistence and rehydration.

## Task 3 — verification

- Run the focused AI service tests.
- Run the contracts build/lint, API typecheck/lint, full API unit tests if practical, and module-boundary checks.
- Run the integration test only when local PostgreSQL is available; otherwise report that environment limitation and rely on CI's database-backed checks.

## Commit

`fix(ai): validate lesson draft output before persistence`
