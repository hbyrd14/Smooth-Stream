# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# SmoothStream — self-hosted image
#
#   docker compose up -d          (recommended: app + Postgres + schema push)
#   docker build -t smoothstream . && docker run -e DATABASE_URL=... -p 8080:8080 smoothstream
# ---------------------------------------------------------------------------

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# ---- build: install the workspace and build frontend + API bundle ----------
FROM base AS build
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
ENV NODE_ENV=production
RUN pnpm run build:app

# ---- migrate: one-shot schema sync (drizzle-kit lives in dev deps) ---------
FROM build AS migrate
CMD ["pnpm", "--filter", "@workspace/db", "run", "push"]

# ---- runtime: just the bundled server and the static frontend --------------
# The API bundle (esbuild) includes all of its dependencies, so no
# node_modules are needed here.
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0 \
    STATIC_DIR=/app/public

COPY --from=build --chown=node:node /app/artifacts/api-server/dist ./dist
COPY --from=build --chown=node:node /app/artifacts/smoothstream/dist/public ./public

USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "--enable-source-maps", "dist/index.mjs"]
