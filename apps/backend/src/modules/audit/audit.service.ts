import { Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuditAction } from '@atm/contracts';

export interface AuditContext {
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

interface RecordInput extends AuditContext {
  action: AuditAction;
  entity?: string | null;
  entityId?: string | null;
  entityLabel?: string | null;
  changes?: Record<string, [unknown, unknown]> | null;
}

/**
 * Журнал действий пользователей (п. X.IV ТЗ).
 *
 * Запись в журнал никогда не должна ронять само действие: если логирование
 * упало, пользователь всё равно должен получить результат своей операции.
 * Поэтому все ошибки здесь гасятся и уходят в лог, а не наружу.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: input.action,
          entity: input.entity ?? null,
          entityId: input.entityId ?? null,
          entityLabel: input.entityLabel ?? null,
          userId: input.userId ?? null,
          userEmail: input.userEmail ?? null,
          userName: input.userName ?? null,
          ip: input.ip ?? null,
          userAgent: input.userAgent ?? null,
          changes: (input.changes ?? undefined) as never,
        },
      });
    } catch (e) {
      this.logger.error(`Не удалось записать в журнал: ${(e as Error).message}`);
    }
  }

  /** Извлекает IP и User-Agent из запроса с учётом прокси nginx. */
  static contextFromRequest(req: Request): Pick<AuditContext, 'ip' | 'userAgent'> {
    // req.ip, а не самостоятельный разбор X-Forwarded-For: nginx ДОБАВЛЯЕТ
    // реальный IP клиента в конец цепочки XFF, а не заменяет её — значение,
    // присланное самим клиентом, остаётся первым. Раньше здесь брался именно
    // первый адрес цепочки, то есть любой клиент мог подделать IP в журнале
    // действий заголовком `X-Forwarded-For: 1.2.3.4` (не обход rate-limit —
    // тот считается по TCP-адресу в nginx/ThrottlerGuard — а порча судебного
    // следа после инцидента). `trust proxy=1` в main.ts заставляет Express
    // доверять ровно одному хопу (nginx) и брать req.ip как адрес ПЕРЕД ним —
    // то есть последний непроверяемый, настоящий IP клиента.
    const ip = req.ip || req.socket.remoteAddress || null;
    const ua = req.headers['user-agent'] ?? null;
    return { ip, userAgent: ua };
  }

  /**
   * Вычисляет разницу между старым и новым состоянием для поля changes.
   * Сравниваются только поля, присутствующие в next.
   */
  static diff(
    prev: Record<string, unknown>,
    next: Record<string, unknown>,
  ): Record<string, [unknown, unknown]> | null {
    const changes: Record<string, [unknown, unknown]> = {};
    for (const key of Object.keys(next)) {
      const before = prev[key];
      const after = next[key];
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        changes[key] = [before, after];
      }
    }
    return Object.keys(changes).length > 0 ? changes : null;
  }
}
