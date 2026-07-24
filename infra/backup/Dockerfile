# =============================================================================
#  Сервис резервного копирования (п. XI ТЗ)
#
#  Alpine с pg_dump и mc (MinIO client). Запускает crond, который по
#  расписанию снимает дамп БД и копию медиа.
# =============================================================================
FROM alpine:3.20

# postgresql-client даёт pg_dump той же мажорной версии, что и сервер (16)
RUN apk add --no-cache postgresql16-client bash tzdata curl \
    && curl -sSL https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc \
    && chmod +x /usr/local/bin/mc

COPY backup.sh /usr/local/bin/backup.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
