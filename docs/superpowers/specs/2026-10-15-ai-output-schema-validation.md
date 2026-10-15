# AI output schema validation

## Context

The lesson-plan assistant already defines `lessonPlanDraftContentSchema`, but `AiSuggestionService` currently casts the model response to `LessonPlanDraftContent` before persisting it. A malformed or incomplete provider response can therefore reach `ai_suggestions.raw_model_output` and the review flow.

## Scope

- Parse every provider response with `lessonPlanDraftContentSchema` before quota consumption or persistence.
- Convert validation failures into a safe `BadRequestException` explaining that the generated draft could not be validated and must be regenerated.
- Preserve the existing prompt-injection scan and pseudonymization flow.
- Keep the stored and rehydrated draft typed by the validated schema.
- Add unit coverage for a valid response and for a malformed response, proving malformed output is neither persisted nor charged.

## Non-goals

- No provider changes.
- No new database columns or migration.
- No automatic repair or silent truncation of model output.
- No change to the human review contract; its Zod validation remains the boundary for edited content.

## Acceptance criteria

1. A valid provider JSON response is parsed and returned as before.
2. Missing/invalid required fields produce a `400` error.
3. Invalid output does not create an AI suggestion and does not consume quota.
4. Prompt-injection scanning still runs before schema persistence.
5. Existing contract, API typecheck, lint, and AI unit tests pass.
