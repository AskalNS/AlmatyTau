import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { env } from '../../config/env';

/**
 * Отправка почты: приглашения пользователей и уведомления из формы
 * обратной связи.
 *
 * Локально SMTP можно указать на Mailpit (см. docker-compose.override.yml.example),
 * и письма никуда не уходят — их видно на http://localhost:8025.
 * Если SMTP_HOST пуст, отправка молча пропускается: запуск
 * без почтового сервера не должен падать.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  private get transport(): nodemailer.Transporter | null {
    if (!env().SMTP_HOST) return null;
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: env().SMTP_HOST,
        port: env().SMTP_PORT,
        secure: env().SMTP_SECURE,
        auth: env().SMTP_USER
          ? { user: env().SMTP_USER, pass: env().SMTP_PASSWORD }
          : undefined,
      });
    }
    return this.transporter;
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const transport = this.transport;
    if (!transport) {
      this.logger.warn(`SMTP не настроен — письмо «${subject}» для ${to} не отправлено`);
      return;
    }
    try {
      await transport.sendMail({ from: env().MAIL_FROM, to, subject, html });
    } catch (e) {
      this.logger.error(`Ошибка отправки письма для ${to}: ${(e as Error).message}`);
    }
  }

  async sendInvite(email: string, name: string, token: string): Promise<void> {
    const url = `${env().PUBLIC_WEB_URL.replace(/\/$/, '')}/../admin/invite?token=${token}`;
    // Ссылка ведёт в админку; точный адрес подставит фронт по своему домену.
    const link = `${adminBase()}/invite?token=${encodeURIComponent(token)}`;
    await this.send(
      email,
      'Приглашение в систему управления сайтом ATM',
      `<p>Здравствуйте, ${escapeHtml(name)}!</p>
       <p>Вас пригласили в систему управления официальным сайтом
          ТОО «Almaty Tau Management».</p>
       <p>Чтобы задать пароль и войти, перейдите по ссылке
          (действительна 48 часов):</p>
       <p><a href="${link}">${link}</a></p>
       <p>Если вы не ожидали это письмо, просто проигнорируйте его.</p>`,
    );
    void url;
  }

  async sendFeedback(data: {
    name: string;
    email: string;
    phone?: string | null;
    subject?: string | null;
    message: string;
  }): Promise<void> {
    await this.send(
      env().FEEDBACK_TO,
      `Обращение с сайта: ${data.subject || 'без темы'}`,
      `<h3>Новое обращение через форму обратной связи</h3>
       <p><b>Имя:</b> ${escapeHtml(data.name)}</p>
       <p><b>E-mail:</b> ${escapeHtml(data.email)}</p>
       ${data.phone ? `<p><b>Телефон:</b> ${escapeHtml(data.phone)}</p>` : ''}
       ${data.subject ? `<p><b>Тема:</b> ${escapeHtml(data.subject)}</p>` : ''}
       <p><b>Сообщение:</b></p>
       <p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>`,
    );
  }
}

function adminBase(): string {
  // admin.<домен>, выведенный из PUBLIC_WEB_URL.
  try {
    const u = new URL(env().PUBLIC_WEB_URL);
    return `${u.protocol}//admin.${u.host.replace(/^www\./, '')}`;
  } catch {
    return env().PUBLIC_WEB_URL;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
