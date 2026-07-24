'use client';

import { useState } from 'react';
import type { Locale } from '@atm/contracts';
import { API } from '@atm/contracts';
import { dict } from '@/lib/dictionary';
import styles from './feedback.module.css';

/**
 * Форма обратной связи (п. 6 ТЗ).
 *
 * Согласие на обработку персональных данных обязательно (Закон РК
 * «О персональных данных»). Скрытое поле website — honeypot против ботов:
 * человек его не видит и не заполняет.
 */
export function FeedbackForm({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    setErrors({});

    const form = e.currentTarget;
    const data = new FormData(form);
    // Отправляем как есть — валидацию (включая обязательность согласия)
    // выполняет сервер Zod-схемой feedbackRequestSchema.
    const payload = {
      name: String(data.get('name') || ''),
      email: String(data.get('email') || ''),
      phone: String(data.get('phone') || '') || null,
      subject: String(data.get('subject') || '') || null,
      message: String(data.get('message') || ''),
      consent: data.get('consent') === 'on',
      website: String(data.get('website') || ''),
    };

    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const res = await fetch(`${apiBase}${API.public.feedback}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setState('sent');
      form.reset();
    } else {
      const body = await res.json().catch(() => ({}));
      setErrors(body.fields || {});
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <div className={styles.success} role="status">
        {t.feedbackSent}
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <h2 className={styles.formTitle}>{t.feedbackName === 'Имя' ? 'Форма обратной связи' : t.contacts}</h2>

      <div className={styles.field}>
        <label htmlFor="fb-name">
          {t.feedbackName} <span aria-hidden="true">*</span>
        </label>
        <input id="fb-name" name="name" required aria-invalid={!!errors.name} />
        {errors.name && <span className={styles.error}>{errors.name[0]}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="fb-email">
          {t.email} <span aria-hidden="true">*</span>
        </label>
        <input id="fb-email" name="email" type="email" required aria-invalid={!!errors.email} />
        {errors.email && <span className={styles.error}>{errors.email[0]}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="fb-message">
          {t.feedbackMessage} <span aria-hidden="true">*</span>
        </label>
        <textarea id="fb-message" name="message" required aria-invalid={!!errors.message} />
        {errors.message && <span className={styles.error}>{errors.message[0]}</span>}
      </div>

      {/* honeypot: скрыт от людей, заполняется только ботами */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className={styles.consent}>
        <input type="checkbox" name="consent" required />
        <span>{t.feedbackConsent}</span>
      </label>
      {errors.consent && <span className={styles.error}>{errors.consent[0]}</span>}

      <button className="btn btn-primary" type="submit" disabled={state === 'sending'}>
        {t.feedbackSend}
      </button>
    </form>
  );
}
