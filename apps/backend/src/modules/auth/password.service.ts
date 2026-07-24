import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';

/**
 * Хеширование паролей и кодов.
 *
 * argon2id — победитель Password Hashing Competition и текущая рекомендация
 * OWASP. Медленный и память-затратный по замыслу: это и есть защита
 * от перебора украденного дампа (п. X.II ТЗ).
 */
@Injectable()
export class PasswordService {
  // Параметры из рекомендаций OWASP: 19 МБ памяти, 2 прохода.
  private readonly opts: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  };

  hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.opts);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  /** Токен приглашения/сброса. URL-безопасный. */
  randomToken(bytes = 32): string {
    return randomBytes(bytes).toString('base64url');
  }

  /**
   * Коды восстановления 2FA. Показываются один раз, хранятся хешами:
   * дамп БД не должен давать возможность обойти второй фактор.
   */
  async generateRecoveryCodes(count = 10): Promise<{ plain: string[]; hashed: string[] }> {
    const plain: string[] = [];
    for (let i = 0; i < count; i++) {
      const raw = randomBytes(5).toString('hex'); // 10 hex-символов
      plain.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
    }
    const hashed = await Promise.all(plain.map((c) => this.hash(c)));
    return { plain, hashed };
  }
}
