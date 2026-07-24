import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { env } from '../../config/env';

/**
 * Двухфакторная аутентификация по TOTP (п. X.II ТЗ).
 *
 * Секрет каждого пользователя хранится в БД зашифрованным: одной утечки
 * дампа не хватит, чтобы генерировать чужие коды — нужен ещё ключ
 * из окружения. Ключ выводится из JWT_ACCESS_SECRET, отдельную переменную
 * не заводим, чтобы не плодить секреты, которые администратор забудет задать.
 */
@Injectable()
export class TotpService {
  private readonly key = createHash('sha256')
    .update(env().JWT_ACCESS_SECRET + ':totp')
    .digest(); // 32 байта для aes-256

  constructor() {
    // Допуск ±1 шаг (±30 с): компенсирует расхождение часов телефона.
    authenticator.options = { window: 1 };
  }

  generateSecret(): string {
    return authenticator.generateSecret();
  }

  /** otpauth://-ссылка для приложения-аутентификатора. */
  keyUri(email: string, secret: string): string {
    return authenticator.keyuri(email, env().TOTP_ISSUER, secret);
  }

  async qrDataUrl(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl, { margin: 1, width: 240 });
  }

  verify(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch {
      return false;
    }
  }

  // --- Шифрование секрета для хранения ---

  encryptSecret(secret: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // iv.tag.ciphertext в base64 — самодостаточная строка для БД.
    return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.');
  }

  decryptSecret(stored: string): string {
    const [ivB64, tagB64, dataB64] = stored.split('.');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }
}
