import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { auditQuerySchema, type AuditQuery, type Paginated, type AuditEntry } from '@atm/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { zodBody } from '../../common/zod-validation.pipe';

/**
 * Просмотр журнала действий. Только Администратор (п. V, X.IV ТЗ).
 */
@ApiTags('Журнал действий')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Журнал действий пользователей' })
  async list(
    @Query(zodBody(auditQuerySchema)) query: AuditQuery,
  ): Promise<Paginated<AuditEntry>> {
    const where: Record<string, unknown> = {};
    if (query.action) where.action = query.action;
    if (query.userId) where.userId = query.userId;
    if (query.entity) where.entity = query.entity;
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: rows.map((r) => ({
        id: r.id,
        action: r.action,
        entity: r.entity,
        entityId: r.entityId,
        entityLabel: r.entityLabel,
        userId: r.userId,
        userEmail: r.userEmail,
        userName: r.userName,
        ip: r.ip,
        userAgent: r.userAgent,
        changes: r.changes as AuditEntry['changes'],
        createdAt: r.createdAt.toISOString(),
      })),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page * query.limit < total,
      },
    };
  }
}
