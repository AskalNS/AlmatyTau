#!/bin/bash
# =============================================================================
#  Резервное копирование БД и медиа (п. XI ТЗ).
#
#  - ежедневный дамп PostgreSQL (сжатый)
#  - зеркало медиабакета MinIO
#  - оба архива шифруются AES-256 паролем из BACKUP_ENCRYPTION_PASSPHRASE,
#    если он задан (дамп содержит всю базу сайта целиком — хранить его на
#    диске открытым текстом на постоянной основе недопустимо)
#  - хранение BACKUP_RETENTION_DAYS суток (по умолчанию 30)
#
#  Каталог /backups по замыслу монтируется на ОТДЕЛЬНОЕ от основного сервера
#  хранилище (сетевой диск, бакет хостинг-провайдера) — требование ТЗ хранить
#  копии отдельно. Смотрите комментарий у тома backup в docker-compose.yml.
# =============================================================================
set -euo pipefail

STAMP=$(date +%Y-%m-%d_%H%M%S)
DAY=$(date +%Y-%m-%d)
DIR="/backups/${DAY}"
mkdir -p "$DIR"

echo "[$(date)] Резервное копирование начато"

# Шифрует файл на месте (заменяет его на file.enc), если пароль задан.
# Без пароля явно предупреждаем в лог, а не молчим — чтобы отсутствие
# шифрования не осталось незамеченным при первом развёртывании.
encrypt_if_configured() {
  local plain="$1"
  if [ -n "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ]; then
    openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt \
      -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
      -in "$plain" -out "${plain}.enc"
    rm -f "$plain"
    echo "${plain}.enc"
  else
    echo "  предупреждение: BACKUP_ENCRYPTION_PASSPHRASE не задана — ${plain} сохранён БЕЗ шифрования" >&2
    echo "$plain"
  fi
}

# --- PostgreSQL --------------------------------------------------------------
DB_FILE="${DIR}/db_${STAMP}.sql.gz"
echo "  дамп базы данных → ${DB_FILE}"
pg_dump --no-owner --no-privileges | gzip > "$DB_FILE"

# Проверяем, что дамп не пустой — молчаливо битый бэкап хуже отсутствия бэкапа.
if [ ! -s "$DB_FILE" ]; then
  echo "  ОШИБКА: дамп БД пуст" >&2
  exit 1
fi
DB_FILE=$(encrypt_if_configured "$DB_FILE")

# --- Медиа (MinIO) -----------------------------------------------------------
echo "  зеркалирование медиа…"
mc alias set src "${S3_ENDPOINT}" "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}" >/dev/null 2>&1
MEDIA_DIR="${DIR}/media"
mc mirror --overwrite --quiet "src/${S3_BUCKET}" "$MEDIA_DIR" || echo "  предупреждение: медиа скопировано не полностью"

# Зеркало — россыпь файлов, шифровать имеет смысл только единым архивом.
MEDIA_ARCHIVE="н/д"
if [ -d "$MEDIA_DIR" ]; then
  MEDIA_ARCHIVE="${DIR}/media_${STAMP}.tar.gz"
  tar -czf "$MEDIA_ARCHIVE" -C "$DIR" "media"
  rm -rf "$MEDIA_DIR"
  MEDIA_ARCHIVE=$(encrypt_if_configured "$MEDIA_ARCHIVE")
fi

# --- Манифест ----------------------------------------------------------------
{
  echo "Дата: $(date)"
  echo "База: ${PGDATABASE}"
  echo "Дамп: ${DB_FILE} ($(du -h "$DB_FILE" 2>/dev/null | cut -f1))"
  echo "Медиа: ${MEDIA_ARCHIVE} ($(du -h "$MEDIA_ARCHIVE" 2>/dev/null | cut -f1 || echo 'н/д'))"
  if [ -n "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ]; then
    echo "Шифрование: включено (AES-256)"
  else
    echo "Шифрование: ВЫКЛЮЧЕНО — задайте BACKUP_ENCRYPTION_PASSPHRASE"
  fi
} > "${DIR}/manifest.txt"

# --- Очистка старых копий ----------------------------------------------------
RETENTION="${BACKUP_RETENTION_DAYS:-30}"
echo "  удаление копий старше ${RETENTION} дней"
find /backups -maxdepth 1 -type d -name '20*' -mtime "+${RETENTION}" -exec rm -rf {} + 2>/dev/null || true

echo "[$(date)] Резервное копирование завершено: ${DIR}"
