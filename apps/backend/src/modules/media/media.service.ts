import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
// file-type 16.x (последняя CJS-версия) экспортирует fromBuffer.
// Версии 17+ только ESM и ломают require() в CJS-бэкенде.
import { fromBuffer as fileTypeFromBuffer } from 'file-type';
import { randomBytes } from 'node:crypto';
import {
  ALLOWED_IMAGE_MIME,
  ALLOWED_VIDEO_MIME,
  ALLOWED_FILE_MIME,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  MAX_FILE_BYTES,
  type Media,
  type MediaQuery,
  type UpdateMediaRequest,
  type Paginated,
  type Locale,
} from '@atm/contracts';
import type { MediaKind } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from './storage.service';
import { ImageProcessorService } from './image-processor.service';
import { MediaMapper } from './media.mapper';
import { AuditService, type AuditContext } from '../audit/audit.service';

interface UploadInput {
  buffer: Buffer;
  originalName: string;
  /** MIME из заголовка запроса — ему НЕ доверяем, проверяем содержимое. */
  declaredMime: string;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly processor: ImageProcessorService,
    private readonly mapper: MediaMapper,
    private readonly audit: AuditService,
  ) {}

  /**
   * Загрузка файла.
   *
   * Тип определяется по сигнатуре содержимого (file-type), а не по
   * расширению или заголовку Content-Type — и то и другое подделывается,
   * а переименованный в .jpg скрипт остаётся скриптом (п. X.III ТЗ).
   * SVG не принимается: это XML с исполняемым JavaScript.
   */
  async upload(input: UploadInput, actor: AuditContext): Promise<Media> {
    const sniffed = await fileTypeFromBuffer(input.buffer);

    // Офисные форматы (docx, xlsx) file-type определяет как zip —
    // для них полагаемся на заявленный MIME, но только если он в белом списке.
    const mime = sniffed?.mime ?? input.declaredMime;
    const kind = this.classify(mime, input.declaredMime);
    if (!kind) {
      throw new BadRequestException(
        'Недопустимый тип файла. Разрешены изображения, видео и документы из установленного перечня.',
      );
    }

    this.assertSize(kind, input.buffer.length);

    const id = randomBytes(12).toString('hex');
    const baseKey = `public/${kind.toLowerCase()}/${id}`;

    if (kind === 'IMAGE') {
      return this.uploadImage(id, baseKey, input, actor);
    }
    return this.uploadRaw(id, baseKey, kind, mime, input, actor);
  }

  private async uploadImage(
    id: string,
    baseKey: string,
    input: UploadInput,
    actor: AuditContext,
  ): Promise<Media> {
    const processed = await this.processor.process(input.buffer, baseKey);

    // Грузим все варианты параллельно.
    await Promise.all(
      processed.files.map((f) => this.storage.put(f.key, f.body, f.contentType, { public: true })),
    );

    const row = await this.prisma.media.create({
      data: {
        id,
        kind: 'IMAGE',
        originalName: input.originalName.slice(0, 255),
        mime: 'image/*',
        size: input.buffer.length,
        width: processed.width,
        height: processed.height,
        storageKey: baseKey,
        blurhash: processed.blurhash,
        variants: processed.variants as never,
        uploadedById: actor.userId ?? null,
      },
    });

    await this.audit.record({
      action: 'UPLOAD',
      entity: 'media',
      entityId: id,
      entityLabel: input.originalName,
      ...actor,
    });

    return this.mapper.toDto(row);
  }

  private async uploadRaw(
    id: string,
    baseKey: string,
    kind: MediaKind,
    mime: string,
    input: UploadInput,
    actor: AuditContext,
  ): Promise<Media> {
    // Документы кладём в private/, отдаются по подписанной ссылке.
    const prefix = kind === 'FILE' ? 'private' : 'public';
    const ext = input.originalName.split('.').pop()?.slice(0, 8) ?? 'bin';
    const key = `${prefix}/${kind.toLowerCase()}/${id}.${ext}`;

    await this.storage.put(key, input.buffer, mime, { public: prefix === 'public' });

    const row = await this.prisma.media.create({
      data: {
        id,
        kind,
        originalName: input.originalName.slice(0, 255),
        mime,
        size: input.buffer.length,
        storageKey: key,
        uploadedById: actor.userId ?? null,
      },
    });

    await this.audit.record({
      action: 'UPLOAD',
      entity: 'media',
      entityId: id,
      entityLabel: input.originalName,
      ...actor,
    });

    return this.mapper.toDto(row);
  }

  private classify(mime: string, declaredMime: string): MediaKind | null {
    if ((ALLOWED_IMAGE_MIME as readonly string[]).includes(mime)) return 'IMAGE';
    if ((ALLOWED_VIDEO_MIME as readonly string[]).includes(mime)) return 'VIDEO';
    if ((ALLOWED_FILE_MIME as readonly string[]).includes(mime)) return 'FILE';
    // Резервная ветка для zip-контейнеров офисных документов.
    if (mime === 'application/zip' && (ALLOWED_FILE_MIME as readonly string[]).includes(declaredMime)) {
      return 'FILE';
    }
    return null;
  }

  private assertSize(kind: MediaKind, size: number): void {
    const max = kind === 'IMAGE' ? MAX_IMAGE_BYTES : kind === 'VIDEO' ? MAX_VIDEO_BYTES : MAX_FILE_BYTES;
    if (size > max) {
      const mb = Math.round(max / 1024 / 1024);
      throw new BadRequestException(`Файл слишком большой. Максимум для этого типа — ${mb} МБ.`);
    }
  }

  async list(query: MediaQuery): Promise<Paginated<Media>> {
    const where: Record<string, unknown> = {};
    if (query.kind) where.kind = query.kind;
    if (query.search) where.originalName = { contains: query.search, mode: 'insensitive' };

    const [rows, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      items: this.mapper.toDtoMany(rows),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page * query.limit < total,
      },
    };
  }

  async get(id: string): Promise<Media> {
    const row = await this.prisma.media.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Файл не найден');
    return this.mapper.toDto(row);
  }

  async update(id: string, dto: UpdateMediaRequest, actor: AuditContext): Promise<Media> {
    const row = await this.prisma.media.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Файл не найден');

    const row2 = await this.prisma.media.update({
      where: { id },
      data: {
        alt: dto.alt ? (dto.alt as never) : undefined,
        caption: dto.caption ? (dto.caption as never) : undefined,
        source: dto.source,
        takenAt: dto.takenAt ? new Date(dto.takenAt) : dto.takenAt === null ? null : undefined,
      },
    });

    await this.audit.record({
      action: 'UPDATE',
      entity: 'media',
      entityId: id,
      entityLabel: row.originalName,
      ...actor,
    });

    return this.mapper.toDto(row2);
  }

  async remove(id: string, actor: AuditContext): Promise<void> {
    const row = await this.prisma.media.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Файл не найден');

    // Проверяем, не используется ли файл где-либо: удаление обложки,
    // на которую ссылается опубликованная новость, оставит битую картинку.
    const usage = await this.countUsage(id);
    if (usage > 0) {
      throw new BadRequestException(
        `Файл используется в ${usage} материалах и не может быть удалён. Сначала уберите его оттуда.`,
      );
    }

    // Удаляем варианты изображения или единственный файл.
    const variants = (row.variants as unknown as { avif: string; webp: string; fallback: string }[]) ?? [];
    const keys =
      variants.length > 0
        ? variants.flatMap((v) => [v.avif, v.webp, v.fallback])
        : [row.storageKey];
    await Promise.allSettled(keys.map((k) => this.storage.delete(k)));

    await this.prisma.media.delete({ where: { id } });

    await this.audit.record({
      action: 'DELETE',
      entity: 'media',
      entityId: id,
      entityLabel: row.originalName,
      ...actor,
    });
  }

  private async countUsage(mediaId: string): Promise<number> {
    const [news, pages, persons, links, albums, docs, home] = await Promise.all([
      this.prisma.news.count({ where: { coverId: mediaId } }),
      this.prisma.page.count({ where: { coverId: mediaId } }),
      this.prisma.person.count({ where: { photoId: mediaId } }),
      this.prisma.link.count({ where: { logoId: mediaId } }),
      this.prisma.album.count({ where: { OR: [{ coverId: mediaId }, { items: { some: { mediaId } } }] } }),
      this.prisma.document.count({ where: { fileId: mediaId } }),
      this.prisma.homeSection.count({ where: { OR: [{ heroPosterId: mediaId }, { heroVideoId: mediaId }] } }),
    ]);
    return news + pages + persons + links + albums + docs + home;
    // Ссылки внутри блоков (image/gallery) не проверяются: они не мешают
    // удалению критически, а битый mediaId в блоке фронт отрисует заглушкой.
  }

  /** Публичное разрешение alt на конкретный язык — для рендера картинок. */
  static resolveAlt(alt: Record<string, string>, locale: Locale): string {
    return alt[locale] || alt.ru || alt.kk || alt.en || '';
  }
}
