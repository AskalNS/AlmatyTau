import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type UpsertPersonRequest,
  type Person,
  type PublicPerson,
  type PersonBoard,
  type Locale,
} from '@atm/contracts';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaMapper } from '../media/media.mapper';
import { SearchIndexerService } from '../search/search-indexer.service';
import { CacheService } from '../../redis/cache.service';
import { AuditService, type AuditContext } from '../audit/audit.service';
import { pickTranslation } from '../../common/i18n.util';

const INCLUDE = { translations: true, photo: true } satisfies Prisma.PersonInclude;
type PersonRow = Prisma.PersonGetPayload<{ include: typeof INCLUDE }>;

/** Правление и Наблюдательный совет (пп. 2.2, 2.3 ТЗ). */
@Injectable()
export class PersonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaMapper,
    private readonly indexer: SearchIndexerService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  async adminList(): Promise<Person[]> {
    const rows = await this.prisma.person.findMany({
      include: INCLUDE,
      orderBy: [{ board: 'asc' }, { order: 'asc' }],
    });
    return rows.map((r) => this.toAdminDto(r));
  }

  async adminGet(id: string): Promise<Person> {
    const row = await this.prisma.person.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw new NotFoundException('Персона не найдена');
    return this.toAdminDto(row);
  }

  async create(dto: UpsertPersonRequest, actor: AuditContext): Promise<Person> {
    const row = await this.prisma.person.create({
      data: {
        slug: dto.slug,
        board: dto.board,
        photoId: dto.photoId ?? null,
        order: dto.order,
        status: dto.status,
        translations: { create: dto.translations.map((t) => ({ ...t })) },
      },
      include: INCLUDE,
    });
    await this.afterWrite(row, 'CREATE', actor);
    return this.toAdminDto(row);
  }

  async update(id: string, dto: UpsertPersonRequest, actor: AuditContext): Promise<Person> {
    const existing = await this.prisma.person.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Персона не найдена');

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.personTranslation.deleteMany({ where: { personId: id } });
      return tx.person.update({
        where: { id },
        data: {
          slug: dto.slug,
          board: dto.board,
          photoId: dto.photoId ?? null,
          order: dto.order,
          status: dto.status,
          translations: { create: dto.translations.map((t) => ({ ...t })) },
        },
        include: INCLUDE,
      });
    });
    await this.afterWrite(row, 'UPDATE', actor);
    return this.toAdminDto(row);
  }

  async remove(id: string, actor: AuditContext): Promise<void> {
    const row = await this.prisma.person.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw new NotFoundException('Персона не найдена');
    await this.prisma.person.delete({ where: { id } });
    await this.indexer.remove('person', id);
    await this.cache.invalidateTags('persons');
    await this.audit.record({ action: 'DELETE', entity: 'person', entityId: id, entityLabel: this.label(row), ...actor });
  }

  async publicList(board: PersonBoard, locale: Locale): Promise<PublicPerson[]> {
    return this.cache.wrap(`persons:${board}:${locale}`, 300, ['persons'], async () => {
      const rows = await this.prisma.person.findMany({
        where: { board, status: 'PUBLISHED', translations: { some: { locale } } },
        include: INCLUDE,
        orderBy: { order: 'asc' },
      });
      return rows.map((r) => this.toPublic(r, locale)).filter((x): x is PublicPerson => x !== null);
    });
  }

  async publicGet(slug: string, locale: Locale): Promise<PublicPerson> {
    const row = await this.prisma.person.findUnique({ where: { slug }, include: INCLUDE });
    if (!row || row.status !== 'PUBLISHED') throw new NotFoundException('Персона не найдена');
    const dto = this.toPublic(row, locale);
    if (!dto) throw new NotFoundException('Персона не найдена');
    return dto;
  }

  private async afterWrite(row: PersonRow, action: 'CREATE' | 'UPDATE', actor: AuditContext) {
    if (row.status === 'PUBLISHED') {
      for (const tr of row.translations) {
        const base = row.board === 'MANAGEMENT' ? 'company/board' : 'company/supervisory-board';
        await this.indexer.index({
          entity: 'person', entityId: row.id, locale: tr.locale,
          title: tr.fullName, content: `${tr.position} ${tr.bio ?? ''}`,
          href: `${base}/${row.slug}`, date: null,
        });
      }
    } else {
      await this.indexer.remove('person', row.id);
    }
    await this.cache.invalidateTags('persons');
    await this.audit.record({
      action: row.status === 'PUBLISHED' ? 'PUBLISH' : action,
      entity: 'person', entityId: row.id, entityLabel: this.label(row), ...actor,
    });
  }

  private label(row: PersonRow): string {
    return (row.translations.find((t) => t.locale === 'ru') ?? row.translations[0])?.fullName ?? row.slug;
  }

  private toAdminDto(row: PersonRow): Person {
    return {
      id: row.id,
      slug: row.slug,
      board: row.board,
      photoId: row.photoId,
      order: row.order,
      status: row.status,
      translations: row.translations.map((t) => ({
        locale: t.locale, fullName: t.fullName, position: t.position, bio: t.bio,
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toPublic(row: PersonRow, locale: Locale): PublicPerson | null {
    const tr = pickTranslation(row.translations, locale);
    if (!tr) return null;
    return {
      id: row.id, slug: row.slug, board: row.board,
      fullName: tr.fullName, position: tr.position, bio: tr.bio,
      photo: row.photo ? this.media.toDto(row.photo) : null,
    };
  }
}
