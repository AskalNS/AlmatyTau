import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type UpsertVacancyRequest,
  type Vacancy,
  type PublicVacancy,
  type Locale,
  ROUTES,
} from '@atm/contracts';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchIndexerService } from '../search/search-indexer.service';
import { CacheService } from '../../redis/cache.service';
import { AuditService, type AuditContext } from '../audit/audit.service';
import { pickTranslation } from '../../common/i18n.util';

const INCLUDE = { translations: true } satisfies Prisma.VacancyInclude;
type VacRow = Prisma.VacancyGetPayload<{ include: typeof INCLUDE }>;

/** Вакансии (п. 4.3 ТЗ). По истечении deadline уходят из публичного списка. */
@Injectable()
export class VacanciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly indexer: SearchIndexerService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  async adminList(): Promise<Vacancy[]> {
    const rows = await this.prisma.vacancy.findMany({
      include: INCLUDE,
      orderBy: [{ status: 'asc' }, { publishedAt: 'desc' }],
    });
    return rows.map((r) => this.toAdminDto(r));
  }

  async adminGet(id: string): Promise<Vacancy> {
    const row = await this.prisma.vacancy.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw new NotFoundException('Вакансия не найдена');
    return this.toAdminDto(row);
  }

  async create(dto: UpsertVacancyRequest, actor: AuditContext): Promise<Vacancy> {
    const row = await this.prisma.vacancy.create({
      data: this.writeData(dto),
      include: INCLUDE,
    });
    await this.afterWrite(row, 'CREATE', actor);
    return this.toAdminDto(row);
  }

  async update(id: string, dto: UpsertVacancyRequest, actor: AuditContext): Promise<Vacancy> {
    const existing = await this.prisma.vacancy.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Вакансия не найдена');
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.vacancyTranslation.deleteMany({ where: { vacancyId: id } });
      return tx.vacancy.update({ where: { id }, data: this.writeData(dto), include: INCLUDE });
    });
    await this.afterWrite(row, 'UPDATE', actor);
    return this.toAdminDto(row);
  }

  async remove(id: string, actor: AuditContext): Promise<void> {
    const row = await this.prisma.vacancy.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw new NotFoundException('Вакансия не найдена');
    await this.prisma.vacancy.delete({ where: { id } });
    await this.indexer.remove('vacancy', id);
    await this.cache.invalidateTags('vacancies');
    await this.audit.record({ action: 'DELETE', entity: 'vacancy', entityId: id, entityLabel: this.label(row), ...actor });
  }

  async publicList(locale: Locale): Promise<PublicVacancy[]> {
    return this.cache.wrap(`vacancies:${locale}`, 120, ['vacancies'], async () => {
      const rows = await this.prisma.vacancy.findMany({
        where: {
          status: 'PUBLISHED',
          translations: { some: { locale } },
          // Срок приёма ещё не истёк либо не задан.
          OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
        },
        include: INCLUDE,
        orderBy: { publishedAt: 'desc' },
      });
      return rows.map((r) => this.toPublic(r, locale)).filter((x): x is PublicVacancy => x !== null);
    });
  }

  async publicGet(slug: string, locale: Locale): Promise<PublicVacancy> {
    const row = await this.prisma.vacancy.findUnique({ where: { slug }, include: INCLUDE });
    if (!row || row.status !== 'PUBLISHED') throw new NotFoundException('Вакансия не найдена');
    const dto = this.toPublic(row, locale);
    if (!dto) throw new NotFoundException('Вакансия не найдена');
    return dto;
  }

  private writeData(dto: UpsertVacancyRequest): Prisma.VacancyCreateInput {
    return {
      slug: dto.slug,
      status: dto.status,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : dto.status === 'PUBLISHED' ? new Date() : null,
      deadline: dto.deadline ? new Date(dto.deadline) : null,
      contactEmail: dto.contactEmail || null,
      translations: {
        create: dto.translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          department: t.department ?? null,
          requirements: t.requirements ?? null,
          conditions: t.conditions ?? null,
          responsibilities: t.responsibilities ?? null,
          seoTitle: t.seo?.title ?? null,
          seoDescription: t.seo?.description ?? null,
        })),
      },
    };
  }

  private async afterWrite(row: VacRow, action: 'CREATE' | 'UPDATE', actor: AuditContext) {
    if (row.status === 'PUBLISHED') {
      for (const tr of row.translations) {
        await this.indexer.index({
          entity: 'vacancy', entityId: row.id, locale: tr.locale, title: tr.title,
          content: `${tr.department ?? ''} ${tr.requirements ?? ''} ${tr.conditions ?? ''}`,
          href: ROUTES.vacancy(row.slug), date: row.publishedAt,
        });
      }
    } else {
      await this.indexer.remove('vacancy', row.id);
    }
    await this.cache.invalidateTags('vacancies');
    await this.audit.record({
      action: row.status === 'PUBLISHED' ? 'PUBLISH' : action,
      entity: 'vacancy', entityId: row.id, entityLabel: this.label(row), ...actor,
    });
  }

  private label(row: VacRow): string {
    return (row.translations.find((t) => t.locale === 'ru') ?? row.translations[0])?.title ?? row.slug;
  }

  private toAdminDto(row: VacRow): Vacancy {
    return {
      id: row.id, slug: row.slug, status: row.status,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      deadline: row.deadline?.toISOString() ?? null,
      contactEmail: row.contactEmail,
      translations: row.translations.map((t) => ({
        locale: t.locale, title: t.title, department: t.department,
        requirements: t.requirements, conditions: t.conditions, responsibilities: t.responsibilities,
      })),
      createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toPublic(row: VacRow, locale: Locale): PublicVacancy | null {
    const tr = pickTranslation(row.translations, locale);
    if (!tr) return null;
    return {
      id: row.id, slug: row.slug, title: tr.title, department: tr.department,
      requirements: tr.requirements, conditions: tr.conditions, responsibilities: tr.responsibilities,
      deadline: row.deadline?.toISOString() ?? null, contactEmail: row.contactEmail,
      publishedAt: row.publishedAt?.toISOString() ?? null,
    };
  }
}
