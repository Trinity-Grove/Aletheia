# Family profile context for AI lesson drafts

## Context

The family can already save versioned pedagogical and theological profiles, and the curriculum engine uses the pedagogical profile. The lesson-plan assistant currently ignores both profiles, so a generated draft can use a teaching approach or theological framing that the family did not choose.

## Scope

- Load the latest pedagogical and theological profile for the authenticated family.
- Add only structured, non-PII context to the lesson-generation prompt:
  - pedagogical primary model code;
  - secondary model codes and weights;
  - preferred theological tradition code;
  - topic-to-position override codes.
- Explicitly frame those values as preferences to respect, not as system instructions.
- Preserve behavior when either profile is absent.
- Add unit tests proving the latest version is selected and its context is passed to the provider.

## Safety and privacy

- Query profiles by `familyId` and highest version only.
- Do not include profile IDs, creator IDs, raw overrides, learner PII, or arbitrary profile metadata in the prompt.
- Keep the existing prompt-injection scan for user input and generated output.

## Non-goals

- No schema or migration changes.
- No change to how profiles are created or versioned.
- No automatic theological adjudication; the profile only supplies the family's selected framing.

## Acceptance criteria

1. A family with profiles sends the latest structured preferences to the LLM provider.
2. A family without profiles generates drafts exactly as before.
3. The prompt contains no raw `overrides` JSON or profile identifiers.
4. Existing consent, quota, injection, schema-validation, review, and persistence behavior remains intact.
