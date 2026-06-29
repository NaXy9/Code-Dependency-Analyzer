# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm@9

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/api/package.json  ./packages/api/
COPY packages/web/package.json  ./packages/web/

RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY packages/ ./packages/

RUN pnpm --filter @dep-analyzer/core build
RUN pnpm --filter @dep-analyzer/api build
RUN VITE_BASE_URL=/cda/ pnpm --filter @dep-analyzer/web build
RUN pnpm --filter @dep-analyzer/api --prod deploy /prod-api

# ─── Stage 2: Run ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /prod-api/dist        ./dist
COPY --from=builder /prod-api/node_modules ./node_modules
COPY --from=builder /app/packages/web/dist ./web-dist

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
