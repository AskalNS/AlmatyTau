# =============================================================================
#  Админка (React + Vite) — статическая SPA за nginx
#
#  Собирается из корня монорепозитория:
#    docker build -f apps/admin/Dockerfile -t atm-admin .
# =============================================================================

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# ---- установка и сборка -----------------------------------------------------
FROM base AS build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY . .
RUN pnpm install --filter @atm/admin... --frozen-lockfile || pnpm install --filter @atm/admin...
RUN pnpm --filter @atm/contracts build
RUN pnpm --filter @atm/admin build

# ---- отдача статики ---------------------------------------------------------
FROM nginx:1.27-alpine AS runner
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
