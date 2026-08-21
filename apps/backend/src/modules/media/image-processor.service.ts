import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { encode } from 'blurhash';
import { IMAGE_SIZES } from '@atm/contracts';

// Явный, осознанный потолок пикселей на декодирование (в дефолте sharp/libvips
// это тоже есть, ~268 Мп, но неявно). Ограничивает decompression bomb —
// компактный по байтам файл с огромными заявленными width×height, на
// раскодировании которого сервер тратит гигабайты памяти в один момент.
// 100 Мп с запасом покрывает кадр с любой реальной камеры (топовый
// полнокадровый сенсор — около 60 Мп).
const MAX_INPUT_PIXELS = 100_000_000;
const SHARP_INPUT_OPTIONS = { failOn: 'error', limitInputPixels: MAX_INPUT_PIXELS } as const;

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
    // Выравниваем по EXIF-ориентации, снимаем метаданные (в них бывает
    // геолокация съёмки — лишнее в публичном доступе).
    const normalized = await sharp(input, SHARP_INPUT_OPTIONS).rotate().toBuffer();

    // Ширину/высоту читаем ИЗ УЖЕ ПОВЁРНУТОГО буфера, а не из исходника:
    // sharp().metadata() отдаёт сырые размеры пикселей до применения тега
    // EXIF-ориентации, без транспонирования. Для портретного фото с телефона
    // (тег orientation 6/8) это давало landscape width/height у визуально
    // портретного кадра — фронтенд строил рамку под неверное соотношение
    // сторон и картинка выглядела сплющенной/растянутой.
    const meta = await sharp(normalized).metadata();
    const origWidth = meta.width ?? 0;
    const origHeight = meta.height ?? 0;

    const blurhash = await this.makeBlurhash(normalized);

    const files: ProcessedImage['files'] = [];
    const variants: ProcessedVariant[] = [];

    // Не увеличиваем: если оригинал уже, самый крупный вариант = оригинал.
    const targetSizes: number[] = IMAGE_SIZES.filter((w) => w <= origWidth);
    if (targetSizes.length === 0) targetSizes.push(origWidth || IMAGE_SIZES[0]);

    for (const width of targetSizes) {
      const resized = sharp(normalized).resize({ width, withoutEnlargement: true });

      // sharp().metadata(), даже вызванный на пайплайне с уже поставленным в
      // очередь .resize(), возвращает размеры ИСХОДНОГО изображения — resize
      // ещё не выполнен, это ленивая операция. Раньше высота варианта бралась
      // именно так и получала непропорциональную, равную высоте оригинала —
      // на сайте под уменьшенную по ширине картинку строилась рамка/srcset
      // с завышенной высотой (сплющенное или растянутое изображение). Реальную
      // высоту после ресайза можно узнать только выполнив пайплайн — берём её
      // из `info` результата кодирования JPEG-фолбэка, который всё равно нужен.
      const [avif, webp, fallbackResult] = await Promise.all([
        resized.clone().avif({ quality: 68, effort: 5 }).toBuffer(),
        resized.clone().webp({ quality: 84 }).toBuffer(),
        resized.clone().jpeg({ quality: 86, progressive: true, mozjpeg: true }).toBuffer({ resolveWithObject: true }),
      ]);
      const fallback = fallbackResult.data;
      const height = fallbackResult.info.height;

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

  /**
   * Метаданные и блёрхэш без изменения самого файла.
   *
   * Для фото людей сжатие и даунскейл не нужны: заказчик отвечает за то,
   * какое разрешение выложено, кадрировать или пережимать лицо — не наше
   * дело. Блёрхэш не трогает исходные байты, это лишь заглушка на время
   * загрузки, поэтому её можно оставить и здесь.
   */
  async keepOriginal(input: Buffer): Promise<{ width: number; height: number; blurhash: string }> {
    // Сами байты не трогаем и не пережимаем (см. комментарий выше), но
    // ширину/высоту и блёрхэш считаем с поворотом по EXIF — иначе для
    // портретного фото с телефона в базу уходят непроставленные (landscape)
    // размеры, хотя браузер отрисовывает файл уже с учётом EXIF-поворота:
    // фронтенд строит рамку под чужое соотношение сторон.
    const rotated = await sharp(input, SHARP_INPUT_OPTIONS).rotate().toBuffer();
    const meta = await sharp(rotated).metadata();
    const blurhash = await this.makeBlurhash(rotated);
    return { width: meta.width ?? 0, height: meta.height ?? 0, blurhash };
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
