import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Единственная точка доступа к БД во всём приложении.
 *
 * Ни один модуль не создаёт PrismaClient сам — иначе на каждый модуль
 * открывается свой пул соединений, и они быстро исчерпывают лимит Postgres.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Соединение с PostgreSQL установлено');
    await this.applyPostgresExtras();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Объекты, которые Prisma не описывает декларативно: расширения,
   * tsvector с триггером для поиска, частичные индексы, ограничение
   * единственной строки настроек. Скрипт идемпотентен — безопасно
   * прогонять при каждом старте.
   */
  private async applyPostgresExtras(): Promise<void> {
    try {
      const sqlPath = join(__dirname, '..', '..', 'prisma', 'sql', 'postgres-extras.sql');
      const sql = readFileSync(sqlPath, 'utf-8');

      // $executeRawUnsafe использует prepared statement и не принимает несколько
      // команд в одном вызове. Поэтому дробим файл на отдельные операторы,
      // но НЕ по каждой ';': тело plpgsql-функции обёрнуто в $$…$$ и содержит
      // свои точки с запятой. Делим по ';' только вне $$-блоков.
      const statements = this.splitSqlStatements(sql);
      for (const stmt of statements) {
        await this.$executeRawUnsafe(stmt);
      }
      this.logger.log(
        `SQL-расширения применены (${statements.length} операторов: поиск, индексы, ограничения)`,
      );
    } catch (e) {
      // Не валим старт: на реплике только для чтения или при отсутствии
      // прав на CREATE EXTENSION приложение всё равно должно подняться.
      this.logger.warn(
        `Не удалось применить postgres-extras.sql: ${(e as Error).message}`,
      );
    }
  }

  /** Делит SQL-файл на отдельные операторы, учитывая $$-кавычки plpgsql. */
  private splitSqlStatements(sql: string): string[] {
    const statements: string[] = [];
    let current = '';
    let inDollar = false;
    for (let i = 0; i < sql.length; i++) {
      if (sql[i] === '$' && sql[i + 1] === '$') {
        inDollar = !inDollar;
        current += '$$';
        i++;
        continue;
      }
      if (sql[i] === ';' && !inDollar) {
        const trimmed = this.stripSqlComments(current);
        if (trimmed) statements.push(current.trim());
        current = '';
        continue;
      }
      current += sql[i];
    }
    const tail = this.stripSqlComments(current);
    if (tail) statements.push(current.trim());
    return statements;
  }

  /** Убирает строки-комментарии, чтобы отличить пустой оператор от значимого. */
  private stripSqlComments(sql: string): string {
    return sql
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .trim();
  }

  /** Удаление просроченных refresh-токенов. Вызывается по расписанию. */
  async cleanupExpiredTokens(): Promise<number> {
    const { count } = await this.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return count;
  }
}
