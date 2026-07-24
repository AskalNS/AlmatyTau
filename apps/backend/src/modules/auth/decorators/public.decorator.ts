import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Помечает роут доступным без авторизации.
 *
 * По умолчанию глобальный JwtAuthGuard закрывает всё — забыть защитить
 * эндпоинт невозможно. Открывать доступ приходится осознанно, этим
 * декоратором. Это безопаснее обратного подхода, где защиту навешивают
 * вручную и однажды забывают.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
