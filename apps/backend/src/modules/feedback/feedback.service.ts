import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { type FeedbackRequest, type Paginated } from '@atm/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';

interface Meta {
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Форма обратной связи (п. 6 ТЗ).
 *
 * Согласие на обработку персональных данных фиксируется с отметкой времени
 * как доказательство по Закону РК «О персональных данных». Honeypot-поле
 * website отсекает ботов без капчи, которая мешала бы пользователям
 * скринридеров (п. VI ТЗ).
 */
@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly settings: SettingsService,
  ) {}

  async submit(dto: FeedbackRequest, meta: Meta): Promise<void> {
    // Форму можно отключить в настройках — п. 6 ТЗ помечает её «при необходимости».
    if (!(await this.settings.isFeedbackEnabled())) {
      throw new ForbiddenException('Форма обратной связи отключена');
    }

    // Honeypot: скрытое поле заполнил бот.
    if (dto.website && dto.website.length > 0) {
      // Тихо принимаем, чтобы бот не понял, что отсеян.
      return;
    }

    await this.prisma.feedback.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone ?? null,
        subject: dto.subject ?? null,
        message: dto.message,
        consentAt: new Date(),
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
      },
    });

    await this.mail.sendFeedback({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      subject: dto.subject,
      message: dto.message,
    });
  }

  async list(page = 1, limit = 30): Promise<Paginated<Record<string, unknown>>> {
    const [rows, total] = await Promise.all([
      this.prisma.feedback.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.feedback.count(),
    ]);
    return {
      items: rows.map((r) => ({
        id: r.id, name: r.name, email: r.email, phone: r.phone,
        subject: r.subject, message: r.message,
        isProcessed: r.isProcessed, createdAt: r.createdAt.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total },
    };
  }

  async markProcessed(id: string): Promise<void> {
    const row = await this.prisma.feedback.findUnique({ where: { id } });
    if (!row) throw new BadRequestException('Обращение не найдено');
    await this.prisma.feedback.update({
      where: { id },
      data: { isProcessed: true, processedAt: new Date() },
    });
  }
}
