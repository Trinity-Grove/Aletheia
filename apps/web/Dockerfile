# Build context is the monorepo root (see infra/compose.full.yaml).
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile --filter=@aletheia/web...
RUN pnpm --filter @aletheia/web build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
