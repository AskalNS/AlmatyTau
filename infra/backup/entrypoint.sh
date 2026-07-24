#!/bin/bash
# Настраивает cron по расписанию из BACKUP_CRON и запускает демона.
set -e

CRON="${BACKUP_CRON:-0 3 * * *}"

# Пробрасываем переменные окружения в cron-задание: crond запускает задачи
# в чистом окружении, поэтому сохраняем их в файл и подгружаем перед запуском.
printenv | grep -E '^(PG|S3_|BACKUP_)' > /etc/backup.env

cat > /etc/crontabs/root <<EOF
${CRON} . /etc/backup.env; /usr/local/bin/backup.sh >> /backups/backup.log 2>&1
EOF

echo "Сервис резервного копирования запущен. Расписание: ${CRON}"
echo "Первый прогон выполняется сейчас для проверки конфигурации…"
/usr/local/bin/backup.sh >> /backups/backup.log 2>&1 || echo "Предупреждение: пробный бэкап завершился с ошибкой, смотрите /backups/backup.log"

# crond на переднем плане, чтобы контейнер жил
exec crond -f -l 8
