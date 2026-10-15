# AI lesson draft grounding explainability

## Context

The lesson-draft flow already grounds prompts in published catalog context and family profiles, but the review response only exposes the selected learning domain. The educator cannot see the complete set of server-side sources that influenced the draft, and the persisted suggestion cannot be audited for that provenance.

## Goal

Expose a machine-readable, server-generated grounding snapshot with every lesson draft and present it in the human review step. The snapshot must describe only contexts actually loaded by the API; it must never be generated or edited by the LLM.

## Scope

- Add a versioned `groundingContext` JSON snapshot to `AiSuggestion`.
- Return the snapshot in `AiLessonPlanDraftResponseDto` through a shared contract.
- Include stable source types and safe references for:
  - the selected published learning domain;
  - the latest pedagogical profile used;
  - the latest theological profile used;
  - the selected published activity and its safety context.
- Keep profile source references to stable codes/versions only; do not expose raw profile metadata, learner PII, prompts, or model output.
- Render a concise “why this draft” section in the existing review screen, with translated labels in `pt-BR`, `en-US`, and `es-ES`.
- Treat missing grounding on legacy rows/responses as an empty source list and keep the legacy generation request compatible.

## Non-goals

- No automatic recommendation or ranking.
- No LLM-authored rationale.
- No changes to published definitions.
- No new authorization surface; the existing family-scoped AI endpoint and repository isolation remain authoritative.

## Data contract

```ts
type AiGroundingSource = {
  type: 'LEARNING_DOMAIN' | 'PEDAGOGICAL_PROFILE' | 'THEOLOGICAL_PROFILE' | 'ACTIVITY_DEFINITION';
  code: string;
  version: number;
  label: string;
};

type AiGroundingContext = {
  sources: AiGroundingSource[];
};
```

`sources` is ordered deterministically: learning domain, pedagogical profile, theological profile, activity definition. A source is present only when the corresponding record was actually loaded and contributed to the prompt. The API builds the snapshot before persistence and returns the same snapshot after persistence.

## Acceptance criteria

1. A draft with a selected domain and available profiles/activity returns and persists exactly the server-built sources with code, version, label, and type.
2. A legacy request without optional context still succeeds and returns `groundingContext.sources` as an empty array (or omits the optional response field only if the contract explicitly normalizes it); no fake source is emitted.
3. The LLM response cannot inject grounding entries because the grounding snapshot is assembled outside provider output parsing.
4. The review UI explains the source list without exposing learner names, raw prompts, profile metadata, or model output.
5. All new contract and UI copy is present in `pt-BR`, `en-US`, and `es-ES`; i18n audit remains at 100%.
6. Existing family isolation, human approval, API validation, and full repository tests remain green.

## Verification

- Contract tests for source/context schemas and response compatibility.
- API service/repository tests for deterministic source assembly and persistence.
- Migration/schema validation for nullable JSON legacy rows.
- Frontend test for translated grounding display and empty fallback.
- Full contracts, API, web, lint, boundaries, typecheck, i18n, and CI gates before merge.
