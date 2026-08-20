/* ============================================================================
   Восстановление поискового индекса (п. VI ТЗ).

       pnpm --filter @atm/backend reindex:search

   Зачем: search_documents наполняется только через SearchIndexerService при
   создании/публикации сущностей через API (см. afterWrite() в
   pages/news/persons/documents/vacancies.service.ts). Контент из seed.ts и
   seed-content.ts создаётся прямыми Prisma-вызовами в обход индексатора —
   без этого скрипта поиск по сайту возвращает 0 результатов даже при
   заполненной базе.

   Скрипт проходит по всем опубликованным сущностям и делает те же upsert'ы
   в search_documents, что и afterWrite() каждого модуля — по одной записи
   на каждый язык, у которого есть перевод. Безопасно перезапускать (upsert
   по entity+entityId+locale). Вызывается автоматически в конце
   seed-content.ts, отдельная команда — на случай, если контент попадёт
   в базу мимо API ещё раз.
   ========================================================================== */

import { PrismaClient, PublishStatus, type Locale } from '@prisma/client';
import { ROUTES } from '@atm/contracts';
import { SearchIndexerService } from '../src/modules/search/search-indexer.service';

const prisma = new PrismaClient();
const blocksToText = SearchIndexerService.blocksToText;

async function index(input: {
  entity: string;
  entityId: string;
  locale: Locale;
  title: string;
  content: string;
  href: string;
  date?: Date | null;
}): Promise<void> {
  await prisma.searchDocument.upsert({
    where: {
      entity_entityId_locale: { entity: input.entity, entityId: input.entityId, locale: input.locale },
    },
    create: { ...input, date: input.date ?? null },
    update: {
      title: input.title,
      content: input.content,
      href: input.href,
      date: input.date ?? null,
    },
  });
}

async function reindexPages(): Promise<void> {
  const rows = await prisma.page.findMany({
    where: { status: PublishStatus.PUBLISHED },
    include: { translations: true },
  });
  let n = 0;
  for (const row of rows) {
    for (const tr of row.translations) {
      await index({
        entity: 'page',
        entityId: row.id,
        locale: tr.locale,
        title: tr.title,
        content: `${tr.lead ?? ''} ${blocksToText(tr.blocks)}`,
        href: row.path,
        date: null,
      });
      n++;
    }
  }
  console.log(`✓ Страницы: ${n} записей индекса`);
}

async function reindexNews(): Promise<void> {
  const rows = await prisma.news.findMany({
    where: { status: PublishStatus.PUBLISHED },
    include: { translations: true },
  });
  let n = 0;
  for (const row of rows) {
    for (const tr of row.translations) {
      await index({
        entity: 'news',
        entityId: row.id,
        locale: tr.locale,
        title: tr.title,
        content: `${tr.excerpt ?? ''} ${blocksToText(tr.blocks)}`,
        href: ROUTES.newsItem(row.slug),
        date: row.publishedAt,
      });
      n++;
    }
  }
  console.log(`✓ Новости: ${n} записей индекса`);
}

async function reindexPersons(): Promise<void> {
  const rows = await prisma.person.findMany({
    where: { status: PublishStatus.PUBLISHED },
    include: { translations: true },
  });
  let n = 0;
  for (const row of rows) {
    const base = row.board === 'MANAGEMENT' ? 'company/board' : 'company/supervisory-board';
    for (const tr of row.translations) {
      await index({
        entity: 'person',
        entityId: row.id,
        locale: tr.locale,
        title: tr.fullName,
        content: `${tr.position} ${tr.bio ?? ''}`,
        href: `${base}/${row.slug}`,
        date: null,
      });
      n++;
    }
  }
  console.log(`✓ Персоны: ${n} записей индекса`);
}

async function reindexDocuments(): Promise<void> {
  const rows = await prisma.document.findMany({
    where: { status: PublishStatus.PUBLISHED },
    include: { translations: true },
  });
  let n = 0;
  for (const row of rows) {
    for (const tr of row.translations) {
      await index({
        entity: 'document',
        entityId: row.id,
        locale: tr.locale,
        title: tr.title,
        content: tr.description ?? '',
        href: 'corporate/documents',
        date: row.documentDate,
      });
      n++;
    }
  }
  console.log(`✓ Документы: ${n} записей индекса`);
}

async function reindexVacancies(): Promise<void> {
  const rows = await prisma.vacancy.findMany({
    where: { status: PublishStatus.PUBLISHED },
    include: { translations: true },
  });
  let n = 0;
  for (const row of rows) {
    for (const tr of row.translations) {
      await index({
        entity: 'vacancy',
        entityId: row.id,
        locale: tr.locale,
        title: tr.title,
        content: `${tr.department ?? ''} ${tr.requirements ?? ''} ${tr.conditions ?? ''}`,
        href: ROUTES.vacancy(row.slug),
        date: row.publishedAt,
      });
      n++;
    }
  }
  console.log(`✓ Вакансии: ${n} записей индекса`);
}

export async function reindexSearch(): Promise<void> {
  await reindexPages();
  await reindexNews();
  await reindexPersons();
  await reindexDocuments();
  await reindexVacancies();
}

if (require.main === module) {
  reindexSearch()
    .catch((e) => {
      console.error('Ошибка переиндексации поиска:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
