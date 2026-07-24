import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env';

/**
 * Объектное хранилище (MinIO, S3-совместимое).
 *
 * Разделение по префиксам критично для безопасности (п. X.III ТЗ):
 *   public/   — открыто на чтение анонимно, сюда кладутся изображения
 *               и обложки, которые и так видны на сайте;
 *   private/  — документы и всё, что отдаётся по подписанной ссылке
 *               с ограниченным сроком жизни.
 *
 * Файлы отдаются с отдельного домена (S3_PUBLIC_URL), не с домена сайта:
 * даже если злоумышленник загрузит вредоносный файл, он не исполнится
 * в контексте основного домена.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket = env().S3_BUCKET;

  constructor() {
    this.client = new S3Client({
      endpoint: env().S3_ENDPOINT,
      region: env().S3_REGION,
      credentials: {
        accessKeyId: env().S3_ACCESS_KEY,
        secretAccessKey: env().S3_SECRET_KEY,
      },
      // MinIO работает по пути, а не по поддомену бакета.
      forcePathStyle: true,
    });
  }

  async onModuleInit(): Promise<void> {
    // Бакет обычно создаёт minio-init из docker-compose, но при локальном
    // запуске без него подстрахуемся.
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Создан бакет ${this.bucket}`);
      } catch (e) {
        this.logger.warn(`Не удалось проверить/создать бакет: ${(e as Error).message}`);
      }
    }
  }

  async put(
    key: string,
    body: Buffer,
    contentType: string,
    opts: { public?: boolean; cache?: boolean } = {},
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Медиа не меняется после загрузки — год иммутабельного кэша (п. VIII ТЗ).
        CacheControl: opts.cache === false ? 'no-cache' : 'public, max-age=31536000, immutable',
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  /** Публичный URL для файла в префиксе public/. */
  publicUrl(key: string): string {
    return `${env().S3_PUBLIC_URL.replace(/\/$/, '')}/${this.bucket}/${key}`;
  }

  /**
   * Подписанная ссылка на приватный файл (документы). Срок жизни ограничен,
   * поэтому её нельзя просто расшарить навсегда.
   */
  signedUrl(key: string, expiresInSeconds = 300): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }
}
