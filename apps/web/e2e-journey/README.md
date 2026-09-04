# Real golden-path homologation journey (#23)

`golden-path.spec.ts` walks one family through the entire product, end to
end, with **zero `page.route()` mocks**: register → create family → create
learner → build a curriculum (subject + objective, with the academic year
auto-provisioned) → plan and complete a lesson → log attendance → record a
mastery evaluation → upload a private evidence file through a real
presigned MinIO URL → generate an official report → log out → log back in
and confirm every artifact persisted → confirm a second, unrelated family
can never see any of it.

Every request the browser makes leaves the process for real: `next.config.ts`
proxies `/api/*` to a real NestJS API, which talks to a real Postgres
database and a real MinIO bucket. If any of those integrations regress —
the proxy, a migration, a CORS rule, an upload flow — this test fails
instead of quietly passing against a fixture. It is kept in its own
Playwright config (`playwright-journey.config.ts`) and test directory, out
of the default `pnpm test:e2e` run, because it needs that real stack up
first; the default suite intentionally mocks every API call so it can run
with nothing but `next start`.

## Running it locally

1. Start Postgres, Redis and MinIO (default ports; override `POSTGRES_PORT`
   / `REDIS_PORT` / `MINIO_API_PORT` if something on your machine already
   holds one of them):
   ```bash
   docker compose -f infra/compose.yaml up -d
   ```
2. Build and start the API against that stack:
   ```bash
   cd apps/api
   pnpm build
   DATABASE_URL="postgresql://aletheia:aletheia_local_only@127.0.0.1:5432/aletheia?schema=public" \
   JWT_SECRET="local_development_only_jwt_secret_1234567890" \
   MFA_ENCRYPTION_KEY="$(printf '0%.0s' {1..64})" \
   S3_ENDPOINT="http://127.0.0.1:9000" \
   S3_ACCESS_KEY=aletheia S3_SECRET_KEY=aletheia_local_only S3_BUCKET=aletheia \
   REDIS_URL="redis://127.0.0.1:6379" \
   CORS_ORIGIN="http://localhost:3000" WEB_ORIGIN="http://localhost:3000" \
   PORT=3001 \
   node dist/main.js
   ```
   Run `pnpm prisma migrate deploy` first if this is a fresh database.
3. From `apps/web`, run the suite — its own `webServer` builds and starts
   the Next.js app for you, proxying `/api/*` to the API from step 2
   (`API_PROXY_TARGET` defaults to `http://127.0.0.1:3001`, matching it):
   ```bash
   pnpm test:e2e:journey
   ```

On failure, Playwright keeps a trace/screenshot/video under
`test-results/` — `npx playwright show-trace <path-to-trace.zip>` replays
exactly what happened against the real backend.

## Real bugs this journey found (and fixed) before it could pass

Writing this test against real infra — rather than trusting the existing
mocked suites — surfaced product bugs that no mocked test could ever catch,
because a mock never disagrees with itself:

- No UI path ever provisioned an academic year for a new family, silently
  breaking objective creation. Fixed in `curriculum/page.tsx`.
- The MinIO bucket had no CORS configuration, so a real browser-driven
  presigned upload was blocked before it reached storage. Fixed in
  `object-storage.service.ts`.
- The web app had no reverse proxy for `/api/v1/*` at all — every existing
  Playwright spec only "worked" because it mocked every API call. Fixed
  with the `rewrites()` in `next.config.ts`.
- A confirmed file upload never got a viewable URL: `fileUrl` on a
  portfolio item is only ever the guardian-supplied external link for
  `LINK`-type evidence, never populated from a real upload — despite the
  API already exposing `GET /portfolio/:id/download-url` for exactly this.
  Fixed in `portfolio/page.tsx` by resolving a presigned download URL for
  any item with `mimeType` set but no `fileUrl`.

## CI

See the `homologation-journey` job in `.github/workflows/ci.yml`: it starts
real Postgres + MinIO services, builds and runs the API against them, then
runs this suite with `API_PROXY_TARGET` pointed at that API.
