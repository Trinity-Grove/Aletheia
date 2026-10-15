# Activity safety context for AI lesson drafts

## Context

Activity definitions already carry cataloged age bounds, risk level, and supervision requirements. The lesson-plan assistant does not currently know which activity the family is adapting, so it cannot enforce those constraints before asking the model for a draft.

## Scope

- Add an optional `activityDefinitionId` to the lesson-draft request.
- Resolve only a `PUBLISHED` activity definition.
- When an activity is supplied and the learner age is known, reject requests outside `ageMin`/`ageMax`.
- Include only structured activity safety fields in the prompt: activity name, age range, risk level, and supervision requirement.
- Keep the existing flow unchanged when no activity is supplied.

## Safety rules

- Unknown, draft, deprecated, or archived activity IDs are rejected; unpublished catalog data must not guide the model.
- Age checks happen before the provider call and before quota consumption.
- Do not copy arbitrary activity metadata into the prompt.
- This is an assistance guard, not a replacement for adult supervision or the human review step.

## Non-goals

- No new database model or migration.
- No client UI redesign; the optional field is backward-compatible and can be wired into an activity picker separately.
- No automatic approval of generated lesson plans.

## Acceptance criteria

1. A published activity with compatible age produces a draft with safety context.
2. An out-of-range learner is rejected before the provider call and quota charge.
3. An unpublished or unknown activity is rejected.
4. Existing requests without an activity continue to work.
