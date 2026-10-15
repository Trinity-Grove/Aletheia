# Plan: Competency Definition Description

1. Add a failing contract test proving description is accepted and returned.
2. Add the nullable Prisma column and additive migration.
3. Thread description through repository persistence and service DTO mapping.
4. Add an API regression test and a version-diff assertion for description changes.
5. Run targeted tests, then the repository quality gates before opening the PR.

Commit scope: one atomic feature commit, no AI trailers. PR references #96 and updates the issue only after CI is green.
