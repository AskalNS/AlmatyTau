#!/bin/bash
# =============================================================================
#  Единственная команда для запуска проекта.
#
#    bash infra/up.sh            — сервер / боевой запуск
#    bash infra/up.sh --local    — плюс порты БД/кэша/сайта на localhost
#                                   и Mailpit, для проверки на своей машине
#
#  При первом запуске сам создаёт .env со случайно сгенерированными
#  паролями и секретами — руками ничего копировать и придумывать не нужно.
#  При повторных запусках .env не трогает.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "→ .env не найден — создаю с автосгенерированными секретами…"
  cp .env.example .env

  gen() { openssl rand -hex "$1"; }
  ADMIN_PASS=$(gen 12)

  sed -i \
    -e "s/CHANGE_ME_postgres/$(gen 20)/g" \
    -e "s/CHANGE_ME_redis/$(gen 20)/g" \
    -e "s/CHANGE_ME_minio_access/$(gen 10)/g" \
    -e "s/CHANGE_ME_minio_secret/$(gen 24)/g" \
    -e "s/CHANGE_ME_access_secret_min_48_chars/$(gen 32)/g" \
    -e "s/CHANGE_ME_refresh_secret_min_48_chars/$(gen 32)/g" \
    -e "s/CHANGE_ME_admin_password/${ADMIN_PASS}/g" \
    -e "s/CHANGE_ME_revalidate_secret/$(gen 24)/g" \
    .env

  echo ""
  echo "  Пароль первого администратора (сохраните — второй раз не покажу):"
  echo "  ${ADMIN_PASS}"
  echo ""
  echo "  Домены (atm.kz…), SMTP и карты в .env оставлены по умолчанию —"
  echo "  для боевого сервера поправьте их вручную перед следующим запуском."
  echo ""
fi

COMPOSE_FILES=(-f docker-compose.yml)
if [ "${1:-}" = "--local" ]; then
  if [ ! -f docker-compose.override.yml ]; then
    cp docker-compose.override.yml.example docker-compose.override.yml
  fi
  COMPOSE_FILES+=(-f docker-compose.override.yml)
fi

docker compose "${COMPOSE_FILES[@]}" up -d --build
docker compose ps
