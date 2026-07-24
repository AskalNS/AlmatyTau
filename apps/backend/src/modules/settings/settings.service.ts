import { Injectable } from '@nestjs/common';
import {
  type Settings,
  type UpdateSettingsRequest,
  type PublicSettings,
  type Locale,
  LOCALES,
} from '@atm/contracts';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../redis/cache.service';
import { AuditService, type AuditContext } from '../audit/audit.service';

const INCLUDE = { translations: true } satisfies Prisma.SettingsInclude;
type SettingsRow = Prisma.SettingsGetPayload<{ include: typeof INCLUDE }>;

/** Контакты, футер, реквизиты (п. 6 ТЗ). Единственная строка настроек. */
@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  private async ensure(): Promise<SettingsRow> {
    const existing = await this.prisma.settings.findUnique({ where: { id: 'singleton' }, include: INCLUDE });
    if (existing) return existing;
    // Подстраховка, если сид не отработал: создаём пустую запись.
    return this.prisma.settings.create({
      data: {
        id: 'singleton',
        translations: {
          create: LOCALES.map((locale) => ({
            locale, organizationName: 'ТОО «Almaty Tau Management»', address: '', workingHours: '',
          })),
        },
      },
      include: INCLUDE,
    });
  }

  async adminGet(): Promise<Settings> {
    const row = await this.ensure();
    return this.toDto(row);
  }

  async update(dto: UpdateSettingsRequest, actor: AuditContext): Promise<Settings> {
    await this.ensure();
    const row = await this.prisma.$transaction(async (tx) => {
      if (dto.translations) {
        await tx.settingsTranslation.deleteMany({ where: { settingsId: 'singleton' } });
      }
      return tx.settings.update({
        where: { id: 'singleton' },
        data: {
          phones: dto.phones,
          emails: dto.emails,
          lat: dto.lat,
          lng: dto.lng,
          socials: dto.socials ? (dto.socials as never) : undefined,
          feedbackEnabled: dto.feedbackEnabled,
          homeNewsCount: dto.homeNewsCount,
          translations: dto.translations
            ? { create: dto.translations.map((t) => ({ ...t })) }
            : undefined,
        },
        include: INCLUDE,
      });
    });
    await this.cache.invalidateTags('layout', 'home');
    await this.audit.record({ action: 'SETTINGS_UPDATED', entity: 'settings', entityId: 'singleton', entityLabel: 'Настройки сайта', ...actor });
    return this.toDto(row);
  }

  async publicGet(locale: Locale): Promise<PublicSettings> {
    const row = await this.ensure();
    const tr = row.translations.find((t) => t.locale === locale)
      ?? row.translations.find((t) => t.locale === 'ru')
      ?? row.translations[0];
    return {
      // Настройки — единственное место с фолбэком на русский: контакты
      // организации должны показываться всегда, даже если перевод забыли.
      organizationName: tr?.organizationName ?? 'ТОО «Almaty Tau Management»',
      address: tr?.address ?? '',
      workingHours: tr?.workingHours ?? '',
      footerText: tr?.footerText ?? null,
      phones: row.phones,
      emails: row.emails,
      lat: row.lat,
      lng: row.lng,
      socials: (row.socials as { kind: string; url: string }[]) ?? [],
      feedbackEnabled: row.feedbackEnabled,
    };
  }

  async isFeedbackEnabled(): Promise<boolean> {
    const row = await this.ensure();
    return row.feedbackEnabled;
  }

  async homeNewsCount(): Promise<number> {
    const row = await this.ensure();
    return row.homeNewsCount;
  }

  private toDto(row: SettingsRow): Settings {
    return {
      phones: row.phones,
      emails: row.emails,
      lat: row.lat,
      lng: row.lng,
      socials: (row.socials as { kind: string; url: string }[]) ?? [],
      feedbackEnabled: row.feedbackEnabled,
      homeNewsCount: row.homeNewsCount,
      translations: row.translations.map((t) => ({
        locale: t.locale,
        organizationName: t.organizationName,
        address: t.address,
        workingHours: t.workingHours,
        footerText: t.footerText,
      })),
    };
  }
}
