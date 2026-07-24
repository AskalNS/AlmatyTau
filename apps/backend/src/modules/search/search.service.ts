import { Injectable } from '@nestjs/common';
import {
  type SearchQuery,
  type SearchResult,
  type Paginated,
  type Locale,
  href as buildHref,
} from '@atm/contracts';
import { PrismaService } from '../../prisma/prisma.service';

interface Row {
  entity: string;
  entityId: string;
  title: string;
  snippet: string;
  href: string;
  date: Date | null;
  rank: number;
}

/**
 * Сквозной поиск по сайту (п. VI ТЗ).
 *
 * Использует tsvector с весами (заголовок важнее тела) и ts_headline
 * для подсветки совпадений во фрагменте. Словарь подбирается по языку
 * запроса: русский со стеммингом, казахский и английский — simple,
 * поскольку стеммера казахского в PostgreSQL нет.
 */
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  private config(locale: Locale): string {
    return locale === 'ru' ? 'russian' : locale === 'en' ? 'english' : 'simple';
  }

  async search(query: SearchQuery, locale: Locale): Promise<Paginated<SearchResult>> {
    const cfg = this.config(locale);
    const offset = (query.page - 1) * query.limit;

    // websearch_to_tsquery понимает естественный ввод: кавычки, минус, OR.
    // Параметры через $-плейсхолдеры — защита от инъекций (п. X.III ТЗ);
    // имя конфигурации подставляется из белого списка выше, не из ввода.
    const entityFilter = query.type ? `AND entity = $4` : '';
    const params: unknown[] = [locale, query.q, query.limit, ...(query.type ? [query.type] : [])];

    const rows = await this.prisma.$queryRawUnsafe<Row[]>(
      `
      SELECT
        entity, "entityId", title, href, date,
        ts_headline(
          '${cfg}', content, websearch_to_tsquery('${cfg}', unaccent($2)),
          'MaxFragments=1, MaxWords=28, MinWords=12, StartSel=<mark>, StopSel=</mark>'
        ) AS snippet,
        ts_rank(tsv, websearch_to_tsquery('${cfg}', unaccent($2))) AS rank
      FROM search_documents
      WHERE locale = $1::"Locale"
        AND tsv @@ websearch_to_tsquery('${cfg}', unaccent($2))
        ${entityFilter}
      ORDER BY rank DESC, date DESC NULLS LAST
      LIMIT $3 OFFSET ${offset}
      `,
      ...params,
    );

    const countRows = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `
      SELECT COUNT(*)::bigint AS count
      FROM search_documents
      WHERE locale = $1::"Locale"
        AND tsv @@ websearch_to_tsquery('${cfg}', unaccent($2))
        ${query.type ? 'AND entity = $3' : ''}
      `,
      ...[locale, query.q, ...(query.type ? [query.type] : [])],
    );
    const total = Number(countRows[0]?.count ?? 0);

    const items: SearchResult[] = rows.map((r) => ({
      type: r.entity as SearchResult['type'],
      id: r.entityId,
      title: r.title,
      snippet: r.snippet || '',
      // href в индексе хранится без языкового префикса — добавляем.
      href: buildHref(locale, r.href),
      date: r.date ? r.date.toISOString() : null,
    }));

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: offset + items.length < total,
      },
    };
  }
}
