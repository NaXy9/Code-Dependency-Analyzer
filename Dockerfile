# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm@9

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/api/package.json  ./packages/api/
COPY packages/web/package.json  ./packages/web/

RUN pnpm install --frozen-lockfile

# Copy all sources
COPY tsconfig.json ./
COPY packages/ ./packages/

# 1. Build shared core library (TS → dist/)
RUN pnpm --filter @dep-analyzer/core build
# 2. Build Express API (TS → dist/)
RUN pnpm --filter @dep-analyzer/api build
# 3. Build the React frontend with /cda/ as the public base path
RUN VITE_BASE_URL=/cda/ pnpm --filter @dep-analyzer/web build

# 4. Bundle the API with its resolved production dependencies
RUN pnpm --filter @dep-analyzer/api --prod deploy /prod-api

# ─── Stage 2: Run ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# API production bundle
COPY --from=builder /prod-api/dist        ./dist
COPY --from=builder /prod-api/node_modules ./node_modules
# React static build — served by Express in production
COPY --from=builder /app/packages/web/dist ./web-dist
# Persistent data directory (mount a Docker volume here)
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
