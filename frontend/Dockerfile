# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
# Фиксируем pnpm в базовом слое одним разом — иначе каждый следующий
# `FROM base AS ...` заново лениво тянет бинарник pnpm через corepack при
# первом вызове.
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

# --- зависимости отдельным слоем ---
FROM base AS deps
WORKDIR /app
# CI=true — pnpm иначе интерактивно спрашивает подтверждение на некоторые
# вещи (напр. approve-builds для нативных postinstall-скриптов) и падает
# без TTY в докер-сборке.
ENV CI=true
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# --- сборка ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* вшивается в клиентский бандл на этапе билда, поэтому
# должен быть передан как build-arg (см. docker-compose.yml).
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN pnpm build

# --- минимальный рантайм-образ (output: "standalone" в next.config.ts) ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV PORT=3000 \
    HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
