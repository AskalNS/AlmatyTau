/* ============================================================================
   Загрузка документов контентного сида в объектное хранилище.

   По образцу content/media.ts (upsertImage/prepareStorage), но для
   документов: без нарезки на форматы/размеры — кладём файл как есть в
   private/ (документы отдаются по подписанной ссылке, см. StorageService и
   DocumentsService.download), создаём Media (kind: FILE) и Document с
   переводами названия.

   Идентификаторы медиа и документов детерминированы (производная от имени
   файла в seed-assets/documents), поэтому повторный запуск сида не плодит
   дубликаты.
   ========================================================================== */

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import type { PrismaClient, Locale } from '@prisma/client';
import { PublishStatus } from '@prisma/client';

const ASSETS_DIR = path.join(__dirname, '..', 'seed-assets', 'documents');

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

export async function prepareDocumentStorage(): Promise<void> {
  await ensureBucket();
}

/** Стабильный id по имени файла: 24 hex-символа, как у случайных id медиа/документов. */
function idFor(prefix: string, fileName: string): string {
  return createHash('sha256').update(`${prefix}:${fileName}`).digest('hex').slice(0, 24);
}

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export interface SeedDocument {
  /** Имя файла в prisma/seed-assets/documents. */
  file: string;
  order: number;
  documentDate: Date;
  title: { kk: string; ru: string; en: string };
}

/**
 * Загружает файл документа и создаёт/обновляет Media + Document.
 *
 * Возвращает id документа (для документов в блоке `file` странице нужен
 * documentId, не mediaId).
 */
export async function upsertDocumentFile(
  prisma: PrismaClient,
  categoryDbId: string,
  input: SeedDocument,
): Promise<string> {
  const mediaId = idFor('seed-doc-media', input.file);
  const documentId = idFor('seed-doc', input.file);
  const source = await readFile(path.join(ASSETS_DIR, input.file));
  const ext = input.file.split('.').pop()?.toLowerCase() ?? 'bin';
  const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream';

  const existingMedia = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!existingMedia || existingMedia.size !== source.length) {
    const key = `private/file/${mediaId}.${ext}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: source,
        ContentType: mime,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    const data = {
      kind: 'FILE' as const,
      originalName: input.file,
      mime,
      size: source.length,
      storageKey: key,
    };

    if (existingMedia) {
      await prisma.media.update({ where: { id: mediaId }, data });
    } else {
      await prisma.media.create({ data: { id: mediaId, ...data } });
    }
  }

  const translations = (Object.entries(input.title) as [Locale, string][]).map(([locale, title]) => ({
    locale,
    title,
  }));

  const existingDoc = await prisma.document.findUnique({ where: { id: documentId } });
  const docData = {
    categoryId: categoryDbId,
    fileId: mediaId,
    fileName: input.file,
    fileSize: source.length,
    fileMime: mime,
    documentDate: input.documentDate,
    order: input.order,
    status: PublishStatus.PUBLISHED,
  };

  if (existingDoc) {
    await prisma.$transaction([
      prisma.documentTranslation.deleteMany({ where: { documentId } }),
      prisma.document.update({ where: { id: documentId }, data: { ...docData, translations: { create: translations } } }),
    ]);
  } else {
    await prisma.document.create({ data: { id: documentId, ...docData, translations: { create: translations } } });
  }

  return documentId;
}
