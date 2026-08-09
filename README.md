# Официальный веб-сайт ТОО «Almaty Tau Management»

Информационный ресурс проекта «Алматинский горный кластер».
Разработан по технической спецификации, код ЕНС ТРУ 631112.000.000000.

---

## Состав

```
apps/
  backend/    NestJS + Prisma + PostgreSQL — REST API, единственный владелец БД
  web/        Next.js 15 (SSR/ISR)         — публичный сайт, kk/ru/en
  admin/      React 19 + Vite (SPA)        — административная панель
packages/
  contracts/  Общие типы и Zod-схемы API
infra/
  nginx/      Конфигурация обратного прокси, TLS, заголовки безопасности
  backup/     Ежедневное резервное копирование БД и медиа (п. XI ТЗ)
ux/           Этап 1 приёмки: карта сайта и прототипы
ui/           Этап 2 приёмки: дизайн-система и макеты
publish/      Материалы для показа Заказчику
```

Бэкенд — модульный монолит: каждый раздел сайта живёт в отдельном модуле
`apps/backend/src/modules/*` и не импортирует внутренности соседей.
Обоснование архитектуры — в `ARCHITECTURE.md`.

---

## Требования

- Docker Engine 24+ и Docker Compose v2 (Linux)
- Для разработки дополнительно: Node.js 22+, pnpm 9+

---

## Развёртывание (Linux, Docker)

```bash
git clone <репозиторий> atm && cd atm

cp .env.example .env
# заполнить .env — все значения CHANGE_ME обязательны к замене
# секреты генерируются так:  openssl rand -base64 48

docker compose up -d --build
docker compose logs -f backend
```

> **Если путь к проекту содержит не-ASCII символы** (кириллицу и т.п.),
> сборщик BuildKit может падать с ошибкой `changes out of order`. В этом
> случае отключите BuildKit — работает штатный сборщик:
> ```bash
> DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 docker compose up -d --build
> ```
> На сервере с латинским путём это не требуется.

Миграции БД накатываются автоматически при старте контейнера `backend`.
Первичный администратор создаётся из `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
при первом запуске — **смените пароль сразу после входа**.

Наружу открыт только `nginx` (порты 80 и 443). PostgreSQL, Redis и MinIO
портов на хост не публикуют и доступны исключительно внутри сети Docker.

### Проверка после запуска

```bash
docker compose ps                       # все сервисы healthy
curl -f http://localhost/api/health     # {"status":"ok"}
```

### TLS-сертификат

```bash
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d atm.kz -d www.atm.kz -d admin.atm.kz -d api.atm.kz \
  --email <почта> --agree-tos --no-eff-email

docker compose exec nginx nginx -s reload
```

Продление автоматическое — контейнер `certbot` проверяет его дважды в сутки.

---

## Разработка

Приложения запускаются на хосте, инфраструктура — в Docker.

```bash
pnpm install
pnpm dev:infra          # postgres, redis, minio, mailpit

cp .env.example .env    # для локальной работы правки не нужны:
                        # значения по умолчанию совпадают с dev-инфраструктурой

pnpm db:migrate
pnpm db:seed            # демо-контент на трёх языках
pnpm dev                # все три приложения параллельно
```

| Адрес | Что |
|---|---|
| http://localhost:3000 | публичный сайт |
| http://localhost:3001 | админка |
| http://localhost:4000/api/docs | Swagger — документация API (п. II ТЗ) |
| http://localhost:8025 | Mailpit — перехваченная почта |
| http://localhost:9001 | консоль MinIO |

### Полезные команды

```bash
pnpm db:studio      # визуальный просмотр БД
pnpm typecheck      # проверка типов во всех пакетах
pnpm test           # тесты
pnpm lint
```

---

## Разработка на Windows, развёртывание на Linux

Репозиторий рассчитан на такую связку, но два момента критичны:

1. **Переводы строк.** `.gitattributes` принудительно ставит LF всем файлам,
   кроме `.ps1`. Без этого CRLF попадает в образ, и контейнер падает
   с `no such file or directory` на строке shebang. Если репозиторий
   клонировали до появления `.gitattributes`:
   ```bash
   git add --renormalize . && git commit -m "normalize line endings"
   ```

2. **Регистр в путях.** Файловая система Linux регистрозависима, Windows — нет.
   `import './Button'` при файле `button.tsx` соберётся на Windows и упадёт
   в Docker. Ловится командой `pnpm typecheck` и сборкой в CI.

---

## Резервное копирование (п. XI ТЗ)

Контейнер `backup` ежедневно в 03:00 снимает дамп PostgreSQL и копию медиафайлов
в каталог `./backups`, храня их `BACKUP_RETENTION_DAYS` суток (по умолчанию 30).

ТЗ требует хранить копии **отдельно от основного сервера** — смонтируйте
в `./backups` сетевой диск или бакет хостинг-провайдера.

Восстановление описано в `infra/backup/README.md`.

---

## Передача Заказчику (п. XV ТЗ)

Проект не содержит вендор-лока: исходный код, база данных и все доступы
передаются целиком, сторонние платные компоненты не используются.
Шрифты Golos Text и Inter распространяются по лицензии SIL OFL.

Состав передачи и порядок приёмки — в `DELIVERY.md`.
