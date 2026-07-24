import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { encode } from 'blurhash';
import { IMAGE_SIZES } from '@atm/contracts';

export interface ProcessedVariant {
  width: number;
  height: number;
  avif: string;
  webp: string;
  fallback: string;
}

export interface ProcessedImage {
  width: number;
  height: number;
  blurhash: string;
  variants: ProcessedVariant[];
  /** Файлы к загрузке: [{ key, body, contentType }]. */
  files: Array<{ key: string; body: Buffer; contentType: string }>;
}

/**
 * Обработка изображений при загрузке (пп. VIII, VI ТЗ).
 *
 * Каждая картинка режется на несколько ширин в трёх форматах: AVIF и WebP
 * для современных браузеров, JPEG как запасной. Это прямо выполняет
 * требования п. VIII об оптимизации изображений и позволяет фронту
 * отдавать через srcset ровно тот размер, что нужен устройству —
 * ключевой вклад в целевые баллы PageSpeed.
 *
 * blurhash — крошечная заглушка на время загрузки: убирает дёрганье
 * вёрстки и улучшает воспринимаемую скорость.
 */
@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  async process(input: Buffer, baseKey: string): Promise<ProcessedImage> {
    const image = sharp(input, { failOn: 'error' });
    const meta = await image.metadata();
    const origWidth = meta.width ?? 0;
    const origHeight = meta.height ?? 0;

    // Выравниваем по EXIF-ориентации, снимаем метаданные (в них бывает
    // геолокация съёмки — лишнее в публичном доступе).
    const normalized = await image.rotate().toBuffer();

    const blurhash = await this.makeBlurhash(normalized);

    const files: ProcessedImage['files'] = [];
    const variants: ProcessedVariant[] = [];

    // Не увеличиваем: если оригинал уже, самый крупный вариант = оригинал.
    const targetSizes: number[] = IMAGE_SIZES.filter((w) => w <= origWidth);
    if (targetSizes.length === 0) targetSizes.push(origWidth || IMAGE_SIZES[0]);

    for (const width of targetSizes) {
      const resized = sharp(normalized).resize({ width, withoutEnlargement: true });
      const vMeta = await resized.clone().metadata();
      const height = vMeta.height ?? (Math.round((origHeight / origWidth) * width) || width);

      const [avif, webp, fallback] = await Promise.all([
        resized.clone().avif({ quality: 55, effort: 4 }).toBuffer(),
        resized.clone().webp({ quality: 72 }).toBuffer(),
        resized.clone().jpeg({ quality: 78, progressive: true, mozjpeg: true }).toBuffer(),
      ]);

      const avifKey = `${baseKey}/${width}.avif`;
      const webpKey = `${baseKey}/${width}.webp`;
      const jpgKey = `${baseKey}/${width}.jpg`;

      files.push(
        { key: avifKey, body: avif, contentType: 'image/avif' },
        { key: webpKey, body: webp, contentType: 'image/webp' },
        { key: jpgKey, body: fallback, contentType: 'image/jpeg' },
      );
      variants.push({ width, height, avif: avifKey, webp: webpKey, fallback: jpgKey });
    }

    return { width: origWidth, height: origHeight, blurhash, variants, files };
  }

  private async makeBlurhash(buffer: Buffer): Promise<string> {
    try {
      const { data, info } = await sharp(buffer)
        .raw()
        .ensureAlpha()
        .resize(32, 32, { fit: 'inside' })
        .toBuffer({ resolveWithObject: true });
      return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
    } catch (e) {
      this.logger.warn(`blurhash не создан: ${(e as Error).message}`);
      return '';
    }
  }
}
