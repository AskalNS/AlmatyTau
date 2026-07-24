import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type UpsertLinkRequest,
  type Link,
  type PublicLink,
  type LinkGroup,
  type Locale,
} from '@atm/contracts';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaMapper } from '../media/media.mapper';
import { CacheService } from '../../redis/cache.service';
import { AuditService, type AuditContext } from '../audit/audit.service';
import { pickTranslation } from '../../common/i18n.util';

const INCLUDE = { translations: true, logo: true } satisfies Prisma.LinkInclude;
type LinkRow = Prisma.LinkGetPayload<{ include: typeof INCLUDE }>;

/** Ссылки на внешние ресурсы: госорганы, партнёры, госзакупки (п. VI ТЗ). */
@Injectable()
export class LinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaMapper,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  async adminList(): Promise<Link[]> {
    const rows = await this.prisma.link.findMany({
      include: INCLUDE,
      orderBy: [{ group: 'asc' }, { order: 'asc' }],
    });
    return rows.map((r) => this.toAdminDto(r));
  }

  async create(dto: UpsertLinkRequest, actor: AuditContext): Promise<Link> {
    const row = await this.prisma.link.create({
      data: {
        url: dto.url, group: dto.group, logoId: dto.logoId ?? null,
        order: dto.order, isActive: dto.isActive,
        translations: { create: dto.translations.map((t) => ({ ...t })) },
      },
      include: INCLUDE,
    });
    await this.cache.invalidateTags('links', 'layout');
    await this.audit.record({ action: 'CREATE', entity: 'link', entityId: row.id, entityLabel: this.label(row), ...actor });
    return this.toAdminDto(row);
  }

  async update(id: string, dto: UpsertLinkRequest, actor: AuditContext): Promise<Link> {
    const existing = await this.prisma.link.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Ссылка не найдена');
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.linkTranslation.deleteMany({ where: { linkId: id } });
      return tx.link.update({
        where: { id },
        data: {
          url: dto.url, group: dto.group, logoId: dto.logoId ?? null,
          order: dto.order, isActive: dto.isActive,
          translations: { create: dto.translations.map((t) => ({ ...t })) },
        },
        include: INCLUDE,
      });
    });
    await this.cache.invalidateTags('links', 'layout');
    await this.audit.record({ action: 'UPDATE', entity: 'link', entityId: id, entityLabel: this.label(row), ...actor });
    return this.toAdminDto(row);
  }

  async remove(id: string, actor: AuditContext): Promise<void> {
    const row = await this.prisma.link.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw new NotFoundException('Ссылка не найдена');
    await this.prisma.link.delete({ where: { id } });
    await this.cache.invalidateTags('links', 'layout');
    await this.audit.record({ action: 'DELETE', entity: 'link', entityId: id, entityLabel: this.label(row), ...actor });
  }

  async publicList(locale: Locale, group?: LinkGroup): Promise<PublicLink[]> {
    return this.cache.wrap(`links:${locale}:${group ?? 'all'}`, 300, ['links'], async () => {
      const rows = await this.prisma.link.findMany({
        where: { isActive: true, ...(group ? { group } : {}), translations: { some: { locale } } },
        include: INCLUDE,
        orderBy: [{ group: 'asc' }, { order: 'asc' }],
      });
      return rows.map((r) => this.toPublic(r, locale)).filter((x): x is PublicLink => x !== null);
    });
  }

  private label(row: LinkRow): string {
    return (row.translations.find((t) => t.locale === 'ru') ?? row.translations[0])?.title ?? row.url;
  }

  private toAdminDto(row: LinkRow): Link {
    return {
      id: row.id, url: row.url, group: row.group, logoId: row.logoId,
      order: row.order, isActive: row.isActive,
      translations: row.translations.map((t) => ({ locale: t.locale, title: t.title, description: t.description })),
    };
  }

  private toPublic(row: LinkRow, locale: Locale): PublicLink | null {
    const tr = pickTranslation(row.translations, locale);
    if (!tr) return null;
    return {
      id: row.id, url: row.url, group: row.group, title: tr.title, description: tr.description,
      logo: row.logo ? this.media.toDto(row.logo) : null,
    };
  }
}
