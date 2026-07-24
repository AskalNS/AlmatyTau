-- =============================================================================
--  Объекты PostgreSQL, которые Prisma не умеет описывать декларативно.
--
--  Скрипт идемпотентен и выполняется при каждом старте бэкенда после
--  `prisma migrate deploy`. Повторный запуск безопасен.
-- =============================================================================

-- Нечёткий поиск: помогает при опечатках и поиске по части слова.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Снятие диакритики. Нужен, чтобы «Алматы» находилось по запросу «алматы»
-- в любой раскладке казахских букв.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- =============================================================================
--  Полнотекстовый поиск (п. VI ТЗ)
--
--  Словарь выбирается по языку записи:
--    ru — 'russian', со стеммингом;
--    kk — 'simple', стеммера казахского языка в PostgreSQL нет;
--    en — 'english'.
--
--  Отдельный поисковый движок (Elasticsearch и подобные) для объёма
--  этого сайта избыточен: он добавил бы ещё один сервис в сопровождение
--  на все 12 месяцев гарантии ради нескольких тысяч документов.
-- =============================================================================

ALTER TABLE search_documents
  ADD COLUMN IF NOT EXISTS tsv tsvector;

CREATE OR REPLACE FUNCTION search_documents_tsv_update()
RETURNS trigger AS $$
DECLARE
  cfg regconfig;
BEGIN
  cfg := CASE NEW.locale::text
           WHEN 'ru' THEN 'russian'::regconfig
           WHEN 'en' THEN 'english'::regconfig
           ELSE 'simple'::regconfig
         END;

  -- Заголовок весит больше тела: совпадение в названии документа
  -- релевантнее совпадения где-то в середине текста.
  NEW.tsv :=
      setweight(to_tsvector(cfg, unaccent(coalesce(NEW.title, ''))), 'A')
   || setweight(to_tsvector(cfg, unaccent(coalesce(NEW.content, ''))), 'B');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS search_documents_tsv_trigger ON search_documents;
CREATE TRIGGER search_documents_tsv_trigger
  BEFORE INSERT OR UPDATE OF title, content, locale
  ON search_documents
  FOR EACH ROW
  EXECUTE FUNCTION search_documents_tsv_update();

CREATE INDEX IF NOT EXISTS search_documents_tsv_idx
  ON search_documents USING GIN (tsv);

-- Поиск по части слова и с опечатками — дополняет полнотекстовый.
CREATE INDEX IF NOT EXISTS search_documents_title_trgm_idx
  ON search_documents USING GIN (title gin_trgm_ops);

-- Пересчёт вектора для строк, вставленных до появления триггера.
UPDATE search_documents SET title = title WHERE tsv IS NULL;

-- =============================================================================
--  Настройки сайта — ровно одна строка
--
--  Без этого ограничения вторая строка настроек рано или поздно появится
--  (гонка при параллельном запросе, ошибка миграции), и сайт начнёт
--  показывать разные контакты в зависимости от того, какую строку
--  вернул планировщик.
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS settings_singleton_idx
  ON settings ((id = 'singleton'))
  WHERE id = 'singleton';

ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_singleton_check;
ALTER TABLE settings ADD CONSTRAINT settings_singleton_check
  CHECK (id = 'singleton');

-- =============================================================================
--  Частичные индексы под публичные выборки
--
--  Публичное API всегда фильтрует по status = 'PUBLISHED'. Частичный индекс
--  меньше полного и не обслуживает черновики, которых со временем
--  накапливается заметная доля.
-- =============================================================================

CREATE INDEX IF NOT EXISTS news_published_idx
  ON news ("publishedAt" DESC)
  WHERE status = 'PUBLISHED';

CREATE INDEX IF NOT EXISTS vacancies_published_idx
  ON vacancies ("publishedAt" DESC)
  WHERE status = 'PUBLISHED';

CREATE INDEX IF NOT EXISTS documents_published_idx
  ON documents ("categoryId", "order")
  WHERE status = 'PUBLISHED';

CREATE INDEX IF NOT EXISTS persons_published_idx
  ON persons (board, "order")
  WHERE status = 'PUBLISHED';

CREATE INDEX IF NOT EXISTS albums_published_idx
  ON albums ("publishedAt" DESC)
  WHERE status = 'PUBLISHED';

-- =============================================================================
--  Очистка просроченных токенов
--
--  Таблица refresh_tokens растёт при каждом входе. Индекс по expiresAt
--  позволяет удалять просроченные пакетно, не сканируя таблицу целиком.
-- =============================================================================

CREATE INDEX IF NOT EXISTS refresh_tokens_cleanup_idx
  ON refresh_tokens ("expiresAt")
  WHERE "revokedAt" IS NULL;
