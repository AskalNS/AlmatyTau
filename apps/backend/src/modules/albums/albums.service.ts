import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type UpsertAlbumRequest,
  type Album,
  type PublicAlbum,
  type PublicAlbumCard,
  type Locale,
} from '@atm/contracts';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaMapper } from '../media/media.mapper';
import { CacheService } from '../../redis/cache.service';
import { AuditService, type AuditContext } from '../audit/audit.service';
import { pickTranslation } from '../../common/i18n.util';

const INCLUDE = {
  translations: true,
  cover: true,
  items: { include: { media: true }, orderBy: { order: 'asc' } },
} satisfies Prisma.AlbumInclude;
type AlbumRow = Prisma.AlbumGetPayload<{ include: typeof INCLUDE }>;

/**
 * Медиагалерея (п. 5.2 ТЗ).
 *
 * Альбом не хранит файлы, а ссылается на медиабиблиотеку: одна фотография
 * может входить в несколько альбомов и одновременно использоваться в блоках
 * страниц, не занимая место повторно.
 */
@Injectable()
export class AlbumsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaMapper,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  async adminList(): Promise<Album[]> {
    const rows = await this.prisma.album.findMany({
      include: INCLUDE,
      orderBy: [{ order: 'asc' }, { publishedAt: 'desc' }],
    });
    return rows.map((r) => this.toAdminDto(r));
  }

  async adminGet(id: string): Promise<Album> {
    const row = await this.prisma.album.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw new NotFoundException('Альбом не найден');
    return this.toAdminDto(row);
  }

  async create(dto: UpsertAlbumRequest, actor: AuditContext): Promise<Album> {
    const clash = await this.prisma.album.findUnique({ where: { slug: dto.slug } });
    if (clash) throw new NotFoundException('Альбом с таким адресом уже существует');

    const row = await this.prisma.album.create({ data: this.writeData(dto), include: INCLUDE });
    await this.afterWrite(row, 'CREATE', actor);
    return this.toAdminDto(row);
  }

  async update(id: string, dto: UpsertAlbumRequest, actor: AuditContext): Promise<Album> {
    const existing = await this.prisma.album.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Альбом не найден');

    const row = await this.prisma.$transaction(async (tx) => {
      // Переводы и состав пересоздаются целиком: так порядок файлов в альбоме
      // всегда соответствует присланному, без сверки «что добавили, что убрали».
      await tx.albumTranslation.deleteMany({ where: { albumId: id } });
      await tx.albumMedia.deleteMany({ where: { albumId: id } });
      return tx.album.update({ where: { id }, data: this.writeData(dto), include: INCLUDE });
    });
    await this.afterWrite(row, 'UPDATE', actor);
    return this.toAdminDto(row);
  }

  async remove(id: string, actor: AuditContext): Promise<void> {
    const row = await this.prisma.album.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw new NotFoundException('Альбом не найден');
    await this.prisma.album.delete({ where: { id } });
    await this.cache.invalidateTags('albums');
    await this.audit.record({
      action: 'DELETE', entity: 'album', entityId: id, entityLabel: this.label(row), ...actor,
    });
  }

  async publicList(locale: Locale): Promise<PublicAlbumCard[]> {
    return this.cache.wrap(`albums:${locale}`, 300, ['albums'], async () => {
      const rows = await this.prisma.album.findMany({
        where: { status: 'PUBLISHED', translations: { some: { locale } } },
        include: INCLUDE,
        orderBy: [{ order: 'asc' }, { publishedAt: 'desc' }],
      });
      return rows
        .map((r) => this.toCard(r, locale))
        .filter((x): x is PublicAlbumCard => x !== null);
    });
  }

  async publicGet(slug: string, locale: Locale): Promise<PublicAlbum> {
    const key = `album:${locale}:${slug}`;
    const result = await this.cache.wrap(key, 300, ['albums'], async () => {
      const row = await this.prisma.album.findUnique({ where: { slug }, include: INCLUDE });
      if (!row || row.status !== 'PUBLISHED') return null;
      const card = this.toCard(row, locale);
      if (!card) return null;

      const dto: PublicAlbum = {
        ...card,
        items: row.items.map((i) => this.media.toDto(i.media)),
      };
      return dto;
    });
    if (!result) throw new NotFoundException('Альбом не найден');
    return result;
  }

  private writeData(dto: UpsertAlbumRequest): Prisma.AlbumCreateInput {
    return {
      slug: dto.slug,
      status: dto.status,
      publishedAt: dto.publishedAt
        ? new Date(dto.publishedAt)
        : dto.status === 'PUBLISHED'
          ? new Date()
          : null,
      order: dto.order,
      cover: dto.coverId ? { connect: { id: dto.coverId } } : undefined,
      translations: {
        create: dto.translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          description: t.description ?? null,
        })),
      },
      items: {
        create: dto.mediaIds.map((mediaId, order) => ({ mediaId, order })),
      },
    };
  }

  private async afterWrite(row: AlbumRow, action: 'CREATE' | 'UPDATE', actor: AuditContext) {
    await this.cache.invalidateTags('albums');
    await this.audit.record({
      action: row.status === 'PUBLISHED' ? 'PUBLISH' : action,
      entity: 'album', entityId: row.id, entityLabel: this.label(row), ...actor,
    });
  }

  private label(row: AlbumRow): string {
    return (row.translations.find((t) => t.locale === 'ru') ?? row.translations[0])?.title ?? row.slug;
  }

  private toAdminDto(row: AlbumRow): Album {
    return {
      id: row.id,
      slug: row.slug,
      status: row.status,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      coverId: row.coverId,
      order: row.order,
      mediaIds: row.items.map((i) => i.mediaId),
      translations: row.translations.map((t) => ({
        locale: t.locale, title: t.title, description: t.description,
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toCard(row: AlbumRow, locale: Locale): PublicAlbumCard | null {
    const tr = pickTranslation(row.translations, locale);
    if (!tr) return null;
    // Обложка не задана — берём первый файл альбома: карточка без картинки
    // в галерее выглядит поломкой.
    const cover = row.cover ?? row.items[0]?.media ?? null;
    return {
      id: row.id,
      slug: row.slug,
      title: tr.title,
      description: tr.description,
      cover: cover ? this.media.toDto(cover) : null,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      count: row.items.length,
    };
  }
}
