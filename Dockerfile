# =============================================================================
# Gadz'Connect — Build multi-stage pour Google Cloud Run
# =============================================================================

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# --- Dépendances ---
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile || pnpm install

# --- Build ---
FROM deps AS build
COPY . .
RUN pnpm --filter @gadz-connect/types build
RUN pnpm --filter @gadz-connect/web build
RUN pnpm --filter @gadz-connect/api build

# --- Runtime API (Cloud Run) ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup -S gadz && adduser -S gadz -G gadz

COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./
COPY --from=build /app/node_modules ./node_modules

USER gadz
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "dist/index.js"]
