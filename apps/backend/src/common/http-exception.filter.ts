import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ERROR_CODES, type ApiError } from '@atm/contracts';

/**
 * Единый формат ошибок для всего API.
 *
 * Клиент всегда получает { statusCode, code, message, fields? } — фронт
 * решает по code, что делать, а message уже на русском и готов к показу.
 * Технические подробности (стек, текст исключения БД) в ответ не попадают:
 * это и утечка внутренностей, и бесполезный для пользователя шум.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const body = this.toApiError(exception);

    if (body.statusCode >= 500) {
      // 5xx логируем с деталями — это наши баги.
      this.logger.error(
        `${req.method} ${req.url} → ${body.statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (body.statusCode !== 401) {
      // 4xx, кроме рутинных 401, — на уровне warn.
      this.logger.warn(`${req.method} ${req.url} → ${body.statusCode} ${body.code}`);
    }

    res.status(body.statusCode).json(body);
  }

  private toApiError(exception: unknown): ApiError {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      // Ответ уже в нашем формате (например, из ZodValidationPipe).
      if (
        typeof response === 'object' &&
        response !== null &&
        'code' in response
      ) {
        return response as ApiError;
      }

      const message =
        typeof response === 'string'
          ? response
          : ((response as Record<string, unknown>)?.message as string) ??
            exception.message;

      return {
        statusCode: status,
        code: this.codeForStatus(status),
        message: this.humanize(status, message),
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL,
      message: 'Внутренняя ошибка сервера. Повторите попытку позже.',
    };
  }

  private codeForStatus(status: number): string {
    switch (status) {
      case 400: return ERROR_CODES.VALIDATION;
      case 401: return ERROR_CODES.UNAUTHORIZED;
      case 403: return ERROR_CODES.FORBIDDEN;
      case 404: return ERROR_CODES.NOT_FOUND;
      case 409: return ERROR_CODES.CONFLICT;
      case 429: return ERROR_CODES.RATE_LIMITED;
      default: return ERROR_CODES.INTERNAL;
    }
  }

  /**
   * Стандартные англоязычные сообщения Nest заменяем на русские.
   *
   * Важно: наш код (гварды, сервисы) всегда бросает исключения с уже
   * готовым русским текстом — его нельзя затирать общей фразой, иначе
   * теряются конкретные причины («неверный пароль», «сессия истекла»,
   * «такой email уже занят»). Подменяем только генерические сообщения
   * самого Nest/библиотек (они всегда на английском).
   */
  private humanize(status: number, fallback: string): string {
    if (/[а-яё]/i.test(fallback)) return fallback;
    switch (status) {
      case 401: return 'Требуется авторизация';
      case 403: return 'Недостаточно прав для этого действия';
      case 404: return 'Запрашиваемый ресурс не найден';
      case 409: return 'Конфликт: такая запись уже существует';
      case 429: return 'Слишком много запросов. Повторите позже.';
      default: return fallback;
    }
  }
}
