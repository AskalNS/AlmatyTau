import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';
import { ERROR_CODES } from '@atm/contracts';

/**
 * Валидация входа схемами Zod из @atm/contracts.
 *
 * Это тот же пакет, которым типизируются фронтенды, — значит правила
 * валидации на клиенте и сервере физически одни и те же, и не могут
 * разойтись. Ошибки складываются по полям, чтобы админка подсветила
 * конкретные инпуты, а не показала одну строку сверху.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    throw new BadRequestException(this.format(result.error));
  }

  private format(error: ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join('.') || '_';
      (fields[key] ??= []).push(issue.message);
    }
    return {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION,
      message: 'Проверьте правильность заполнения полей',
      fields,
    };
  }
}

/** Фабрика для точечного применения на параметре: @Body(zodBody(schema)) */
export function zodBody(schema: ZodSchema): ZodValidationPipe {
  return new ZodValidationPipe(schema);
}
