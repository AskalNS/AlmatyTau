import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type UpsertMenuItemRequest,
  type ReorderMenuRequest,
  type MenuItem,
  type PublicMenuNode,
  type Locale,
} from '@atm/contracts';
import type { Prisma, MenuLocation } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../redis/cache.service';
import { AuditService, type AuditContext } from '../audit/audit.service';

const INCLUDE = { translations: true } satisfies Prisma.MenuItemInclude;
type MenuRow = Prisma.MenuItemGetPayload<{ include: typeof INCLUDE }>;

/**
 * Меню сайта (п. IV ТЗ).
 *
 * Хранится деревом в БД: ТЗ разрешает Заказчику менять структуру и названия
 * разделов на любом этапе, и переименование пункта не должно быть релизом.
 */
@Injectable()
export class MenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  async adminList(): Promise<MenuItem[]> {
    const rows = await this.prisma.menuItem.findMany({
      include: INCLUDE,
      orderBy: [{ location: 'asc' }, { order: 'asc' }],
    });
    return rows.map((r) => this.toDto(r));
  }

  async create(dto: UpsertMenuItemRequest, actor: AuditContext): Promise<MenuItem> {
    const row = await this.prisma.menuItem.create({
      data: {
        parentId: dto.parentId ?? null,
        location: dto.location,
        href: dto.href,
        isExternal: dto.isExternal,
        order: dto.order,
        visibleLocales: dto.visibleLocales,
        translations: { create: dto.translations.map((t) => ({ ...t })) },
      },
      include: INCLUDE,
    });
    await this.invalidate();
    await this.audit.record({ action: 'CREATE', entity: 'menu', entityId: row.id, entityLabel: this.label(row), ...actor });
    return this.toDto(row);
  }

  async update(id: string, dto: UpsertMenuItemRequest, actor: AuditContext): Promise<MenuItem> {
    const existing = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Пункт меню не найден');
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.menuItemTranslation.deleteMany({ where: { itemId: id } });
      return tx.menuItem.update({
        where: { id },
        data: {
          parentId: dto.parentId ?? null,
          location: dto.location,
          href: dto.href,
          isExternal: dto.isExternal,
          order: dto.order,
          visibleLocales: dto.visibleLocales,
          translations: { create: dto.translations.map((t) => ({ ...t })) },
        },
        include: INCLUDE,
      });
    });
    await this.invalidate();
    await this.audit.record({ action: 'UPDATE', entity: 'menu', entityId: id, entityLabel: this.label(row), ...actor });
    return this.toDto(row);
  }

  async remove(id: string, actor: AuditContext): Promise<void> {
    const row = await this.prisma.menuItem.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw new NotFoundException('Пункт меню не найден');
    // Дети удаляются каскадом (onDelete: Cascade в схеме).
    await this.prisma.menuItem.delete({ where: { id } });
    await this.invalidate();
    await this.audit.record({ action: 'DELETE', entity: 'menu', entityId: id, entityLabel: this.label(row), ...actor });
  }

  /** Перестановка после drag-and-drop: массовое обновление parentId и order. */
  async reorder(dto: ReorderMenuRequest, actor: AuditContext): Promise<void> {
    await this.prisma.$transaction(
      dto.items.map((i) =>
        this.prisma.menuItem.update({
          where: { id: i.id },
          data: { parentId: i.parentId, order: i.order },
        }),
      ),
    );
    await this.invalidate();
    await this.audit.record({ action: 'UPDATE', entity: 'menu', entityId: null, entityLabel: 'Порядок меню', ...actor });
  }

  /** Публичное дерево на одном языке, отфильтрованное по видимости. */
  async publicTree(location: MenuLocation, locale: Locale): Promise<PublicMenuNode[]> {
    const rows = await this.prisma.menuItem.findMany({
      where: { location, visibleLocales: { has: locale } },
      include: INCLUDE,
      orderBy: { order: 'asc' },
    });
    return this.buildTree(rows, null, locale);
  }

  private buildTree(rows: MenuRow[], parentId: string | null, locale: Locale): PublicMenuNode[] {
    return rows
      .filter((r) => r.parentId === parentId)
      .map((r) => {
        const tr = r.translations.find((t) => t.locale === locale);
        // Пункт без перевода на язык пропускаем: показывать чужой язык
        // в меню госресурса нельзя (п. III ТЗ).
        if (!tr) return null;
        return {
          id: r.id,
          title: tr.title,
          href: r.href,
          isExternal: r.isExternal,
          children: this.buildTree(rows, r.id, locale),
        };
      })
      .filter((x): x is PublicMenuNode => x !== null);
  }

  private async invalidate() {
    await this.cache.invalidateTags('layout');
  }

  private label(row: MenuRow): string {
    return (row.translations.find((t) => t.locale === 'ru') ?? row.translations[0])?.title ?? row.href;
  }

  private toDto(row: MenuRow): MenuItem {
    return {
      id: row.id,
      parentId: row.parentId,
      href: row.href,
      isExternal: row.isExternal,
      order: row.order,
      visibleLocales: row.visibleLocales,
      location: row.location,
      translations: row.translations.map((t) => ({ locale: t.locale, title: t.title })),
    };
  }
}
