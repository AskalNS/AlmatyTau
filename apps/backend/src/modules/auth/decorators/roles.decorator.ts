import { SetMetadata } from '@nestjs/common';
import type { Role } from '@atm/contracts';

export const ROLES_KEY = 'roles';

/**
 * Ограничивает роут ролями. Без декоратора роут доступен любому
 * авторизованному пользователю (обе роли).
 *
 * Решение о доступе принимает ТОЛЬКО сервер: админка прячет недоступные
 * разделы для удобства, но защищает их этот декоратор (п. V ТЗ).
 *
 * @example @Roles('ADMIN')  — только Администратор
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
