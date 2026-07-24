# =============================================================================
#  Публичный сайт (Next.js) — standalone-сборка на Alpine
#
#  Собирается из корня монорепозитория:
#    docker build -f apps/web/Dockerfile -t atm-web .
#
#  Установка и сборка в одном слое (сохраняется вся раскладка pnpm), рантайм —
#  самодостаточный standalone-вывод Next.
# =============================================================================

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# ---- установка и сборка -----------------------------------------------------
FROM base AS build
# Публичные переменные Next вшиваются на этапе сборки
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG ANALYTICS_ID
ARG MAPS_PROVIDER
ARG MAPS_API_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    ANALYTICS_ID=$ANALYTICS_ID \
    MAPS_PROVIDER=$MAPS_PROVIDER \
    MAPS_API_KEY=$MAPS_API_KEY \
    NEXT_TELEMETRY_DISABLED=1

COPY . .
RUN pnpm install --filter @atm/web... --frozen-lockfile || pnpm install --filter @atm/web...
RUN pnpm --filter @atm/contracts build
RUN pnpm --filter @atm/web build

# ---- рантайм ----------------------------------------------------------------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nextjs

# standalone кладёт минимальный набор: свой node_modules и трейс зависимостей
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

# Точка входа standalone-сборки монорепозитория
CMD ["node", "apps/web/server.js"]
