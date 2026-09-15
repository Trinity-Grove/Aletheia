# Family curriculum pack customization

Published `CurriculumPack` rows are platform templates. A family never edits
that source row directly. Installing a published pack creates a
`FamilyCurriculumPack` snapshot containing the portable export document and
the exact `sourcePackId`, `sourcePackCode`, and `sourcePackVersion` used.

The family may replace the document of its own instance to remove, reorder,
or adapt definitions and metadata. Every save increments `revision` and adds
an immutable `FamilyCurriculumPackRevision` row. This preserves the exact
curriculum state used by future learner assignments and achievements while
allowing a later platform pack version to coexist with the family's current
plan.

The family routes are tenant guarded:

- `POST /api/v1/families/:familyId/curriculum-packs`
- `GET /api/v1/families/:familyId/curriculum-packs`
- `GET /api/v1/families/:familyId/curriculum-packs/:id`
- `PUT /api/v1/families/:familyId/curriculum-packs/:id`
- `GET /api/v1/families/:familyId/curriculum-packs/:id/revisions`

Curriculum media is a separate concern. The next slice should add first-class
resource records and references to this portable document, with private
uploads and validated external providers such as YouTube. A URL in arbitrary
metadata is not enough to provide provider validation, licensing, or safe
export/import behavior.
