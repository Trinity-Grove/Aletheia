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

Curriculum media is a separate concern from the revisioned portable document.
`FamilyCurriculumPackMedia` records are owned by the family pack and can be
added or removed without rewriting the curriculum revision history. An
external item stores an HTTPS URL and the API identifies YouTube links as the
`YOUTUBE` provider; uploaded items store a storage reference plus optional
MIME and size metadata so binary storage can be provided independently.

Media routes are tenant guarded:

- `POST /api/v1/families/:familyId/curriculum-packs/:packId/media`
- `GET /api/v1/families/:familyId/curriculum-packs/:packId/media`
- `DELETE /api/v1/families/:familyId/curriculum-packs/:packId/media/:id`
- `POST /api/v1/families/:familyId/curriculum-packs/:packId/media/upload-url`
- `POST /api/v1/families/:familyId/curriculum-packs/:packId/media/:id/confirm-upload`

External URLs must use HTTPS. YouTube URLs are accepted only for video
items; other HTTPS providers remain represented as `OTHER` until a provider
specific validator is added. Binary upload uses the existing S3-compatible
storage service: the API creates a pending media row, returns a short-lived
presigned PUT URL, and only completes the item after `confirm-upload` verifies
the stored object's actual MIME type and size. Storage keys are generated
server-side under the family and pack namespace.
