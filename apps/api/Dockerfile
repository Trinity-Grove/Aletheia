# Build context is the monorepo root (see infra/compose.full.yaml).
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile --filter=@aletheia/api...
RUN pnpm --filter @aletheia/api build

FROM node:24-alpine AS runtime
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo ./

WORKDIR /repo/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
