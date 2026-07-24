import { Injectable } from '@nestjs/common';
import type { Media as MediaRow } from '@prisma/client';
import type { Media, ImageVariant } from '@atm/contracts';
import { StorageService } from './storage.service';

/**
 * Превращает строку БД Media в публичный DTO с готовыми URL.
 *
 * Вынесено в отдельный сервис, потому что нужно почти всем контентным
 * модулям: новость возвращает обложку, персона — фото, страница — картинки
 * в блоках. Единая точка гарантирует, что URL и варианты собираются
 * одинаково везде.
 */
@Injectable()
export class MediaMapper {
  constructor(private readonly storage: StorageService) {}

  toDto(row: MediaRow): Media {
    const variants = (row.variants as unknown as ImageVariant[]) ?? [];

    // URL исходника: самый крупный запасной формат, либо ключ файла (видео/док).
    const largest = variants[variants.length - 1];
    const url = largest
      ? this.storage.publicUrl(largest.fallback)
      : this.storage.publicUrl(row.storageKey);

    return {
      id: row.id,
      kind: row.kind,
      originalName: row.originalName,
      mime: row.mime,
      size: row.size,
      width: row.width,
      height: row.height,
      duration: row.duration,
      url,
      blurhash: row.blurhash,
      variants: variants.map((v) => ({
        width: v.width,
        height: v.height,
        avif: this.storage.publicUrl(v.avif),
        webp: this.storage.publicUrl(v.webp),
        fallback: this.storage.publicUrl(v.fallback),
      })),
      alt: (row.alt as Record<string, string>) ?? {},
      caption: (row.caption as Record<string, string>) ?? null,
      source: row.source,
      takenAt: row.takenAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      uploadedById: row.uploadedById,
    };
  }

  /** Массовое преобразование с сохранением порядка. */
  toDtoMany(rows: MediaRow[]): Media[] {
    return rows.map((r) => this.toDto(r));
  }
}
