# Privacy profile catalog — ALET-248 first slice

## Context

The current consent resolver maps a country directly to a small `PrivacyRegime`
union using a `switch`. That behavior is already used by consent definitions and
must remain backward compatible. ALET-248 calls for a future
`Jurisdiction → Regulation → Obligation → Control` model, but data residency,
state-level resolution, legal obligations, and operational controls require
separate legal and infrastructure decisions.

## Scope

This slice introduces a stable, metadata-only privacy profile catalog in the
contracts package and resolves a country to a profile without adding legal
claims or changing consent behavior.

In scope:

- define a small set of profile codes from the approved issue taxonomy;
- map known ISO alpha-3 country codes to profiles;
- preserve `resolvePrivacyRegime()` and all existing outputs for consent flows;
- expose whether a profile needs sub-national review or data-residency review;
- test known countries and the generic fallback.

Out of scope:

- legal advice or new rights/obligations;
- jurisdiction database migrations;
- state/province collection in the family model;
- data residency enforcement;
- changing consent copy or publication rules;
- replacing the existing consent regime codes.

## Acceptance criteria

1. Existing `resolvePrivacyRegime()` tests and outputs remain unchanged.
2. `resolvePrivacyProfile()` is table-driven and returns a stable profile for
   Brazil, the EU, the United States, India, and an unknown country.
3. Profile metadata is descriptive only and does not cause a consent or access
   decision by itself.
4. Contracts build and tests pass.

