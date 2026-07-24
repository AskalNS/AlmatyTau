# =============================================================================
#  Backend (NestJS) — многостадийная сборка на Alpine
#
#  Собирается из корня монорепозитория:
#    docker build -f apps/backend/Dockerfile -t atm-backend .
#
#  Стратегия: установка и сборка в одном слое, затем копирование всего
#  дерева /app в рантайм. Так сохраняется вся раскладка pnpm (симлинки
#  воркспейс-пакетов, hoisted-зависимости) — надёжнее, чем поштучно копировать
#  node_modules пакетов между стадиями.
# =============================================================================

FROM node:22-alpine AS base
# libc6-compat — для prebuilt-бинарей (sharp, argon2) на musl-libc.
# openssl — обязателен движку Prisma, иначе schema-engine не стартует.
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# ---- установка и сборка -----------------------------------------------------
FROM base AS build
# .dockerignore исключает node_modules, dist, .env — копируем исходники
COPY . .
RUN pnpm install --filter @atm/backend... --frozen-lockfile || pnpm install --filter @atm/backend...
RUN pnpm --filter @atm/contracts build
RUN pnpm --filter @atm/backend prisma:generate
RUN pnpm --filter @atm/backend build

# ---- рантайм ----------------------------------------------------------------
FROM base AS runner
RUN apk add --no-cache curl
# tsx нужен для прогона seed.ts при инициализации
RUN npm install -g tsx@4.19.1
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nodejs

# Всё дерево из build: node_modules (со всеми симлинками), собранные dist,
# схема Prisma и сгенерированный клиент.
COPY --from=build --chown=nodejs:nodejs /app /app
RUN chmod +x apps/backend/docker-entrypoint.sh

USER nodejs
WORKDIR /app/apps/backend
EXPOSE 4000

# Миграции накатываются при старте, затем поднимается сервер
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
