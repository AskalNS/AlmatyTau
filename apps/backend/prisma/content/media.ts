/* ============================================================================
   Загрузка изображений контентного сида в медиабиблиотеку.

   Повторяет то, что делает MediaService при загрузке через админку: режет
   картинку на ширины из IMAGE_SIZES в трёх форматах (AVIF, WebP, JPEG),
   считает blurhash и кладёт файлы в S3/MinIO. Иначе изображения сида
   отдавались бы одним тяжёлым файлом и ломали показатели п. VIII ТЗ.

   Идентификаторы медиа детерминированы (производные от имени файла), поэтому
   повторный запуск сида не плодит дубликаты и не перезаписывает то, что
   Заказчик мог заменить сам: существующая запись пропускается.
   ========================================================================== */

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { encode } from 'blurhash';
import { IMAGE_SIZES } from '@atm/contracts';
import type { PrismaClient } from '@prisma/client';

const ASSETS_DIR = path.join(__dirname, '..', 'seed-assets');

function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Переменная окружения ${name} обязательна`);
  return v;
}

const bucket = env('S3_BUCKET', 'atm-media');

const s3 = new S3Client({
  endpoint: env('S3_ENDPOINT', 'http://localhost:9000'),
  region: env('S3_REGION', 'us-east-1'),
  credentials: {
    accessKeyId: env('S3_ACCESS_KEY', 'atmadmin'),
    secretAccessKey: env('S3_SECRET_KEY', 'atmadmin123'),
  },
  forcePathStyle: true,
});

async function ensureBucket(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}

/** Стабильный id по имени файла: 24 hex-символа, как у случайных id медиа. */
function idFor(fileName: string): string {
  return createHash('sha256').update(`seed:${fileName}`).digest('hex').slice(0, 24);
}

async function blurhashOf(buffer: Buffer): Promise<string> {
  try {
    const { data, info } = await sharp(buffer)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true });
    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
  } catch {
    return '';
  }
}

export interface SeedImage {
  /** Имя файла в prisma/seed-assets. */
  file: string;
  /** Альтернативный текст по языкам — обязателен для доступности (п. VI ТЗ). */
  alt: { kk: string; ru: string; en: string };
  /**
   * Источник/автор фото. По умолчанию — Заказчик (собственные материалы).
   * Для фото, взятых из внешних источников со свободной лицензией (например,
   * Wikimedia Commons), указывается автор и лицензия — обязательное условие
   * CC BY-SA.
   */
  source?: string;
}

/**
 * Загружает изображение и возвращает id медиазаписи.
 *
 * Идентификатор стабилен (производная от имени файла), поэтому блоки страниц
 * не приходится переписывать при обновлении картинки. Если файл в seed-assets
 * заменили — сравниваем размер с сохранённым и перегенерируем варианты под тем
 * же id. Без этой проверки замена исходника ничего не меняла на сайте: запись
 * уже есть, значит «загружать нечего».
 */
export async function upsertImage(prisma: PrismaClient, image: SeedImage): Promise<string> {
  const id = idFor(image.file);
  const source = await readFile(path.join(ASSETS_DIR, image.file));

  const existing = await prisma.media.findUnique({ where: { id } });
  if (existing && existing.size === source.length) return id;

  const baseKey = `public/image/${id}`;

  const pipeline = sharp(source, { failOn: 'error' });
  const meta = await pipeline.metadata();
  const origWidth = meta.width ?? 0;
  const origHeight = meta.height ?? 0;
  const normalized = await pipeline.rotate().toBuffer();

  const sizes = IMAGE_SIZES.filter((w) => w <= origWidth);
  if (sizes.length === 0) sizes.push(origWidth || IMAGE_SIZES[0]);

  const variants: Array<{ width: number; height: number; avif: string; webp: string; fallback: string }> = [];
  const uploads: Array<Promise<unknown>> = [];

  for (const width of sizes) {
    const resized = sharp(normalized).resize({ width, withoutEnlargement: true });
    const vMeta = await resized.clone().metadata();
    const height = vMeta.height ?? Math.round((origHeight / origWidth) * width);

    const [avif, webp, fallback] = await Promise.all([
      resized.clone().avif({ quality: 55, effort: 4 }).toBuffer(),
      resized.clone().webp({ quality: 72 }).toBuffer(),
      resized.clone().jpeg({ quality: 78, progressive: true, mozjpeg: true }).toBuffer(),
    ]);

    const keys = {
      avif: `${baseKey}/${width}.avif`,
      webp: `${baseKey}/${width}.webp`,
      fallback: `${baseKey}/${width}.jpg`,
    };

    uploads.push(
      put(keys.avif, avif, 'image/avif'),
      put(keys.webp, webp, 'image/webp'),
      put(keys.fallback, fallback, 'image/jpeg'),
    );
    variants.push({ width, height, ...keys });
  }

  await Promise.all(uploads);

  const data = {
    kind: 'IMAGE' as const,
    originalName: image.file,
    mime: 'image/*',
    size: source.length,
    width: origWidth,
    height: origHeight,
    storageKey: baseKey,
    blurhash: await blurhashOf(normalized),
    variants: variants as never,
    alt: image.alt as never,
    source: image.source ?? 'ТОО «Almaty Tau Management»',
  };

  if (existing) {
    await prisma.media.update({ where: { id }, data });
  } else {
    await prisma.media.create({ data: { id, ...data } });
  }

  return id;
}

function put(key: string, body: Buffer, contentType: string): Promise<unknown> {
  return s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
}

export async function prepareStorage(): Promise<void> {
  await ensureBucket();
}
