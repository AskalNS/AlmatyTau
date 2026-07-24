'use client';

import { useRouter } from 'next/navigation';
import type { Locale } from '@atm/contracts';
import { dict } from '@/lib/dictionary';

/**
 * Панель управления версией для слабовидящих (п. VI ТЗ).
 *
 * Настройки пишутся в cookie и применяются на сервере (см. [locale]/layout),
 * поэтому страница не мигает при загрузке. Это не сторонний виджет и не
 * CSS-фильтр, а полноценная тема сайта.
 */
export function A11yBar({ locale, scheme, font }: { locale: Locale; scheme: string; font: string }) {
  const router = useRouter();
  const t = dict(locale);

  const setCookie = (name: string, value: string) => {
    document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  };

  const schemes: Array<{ id: string; label: string }> = [
    { id: 'black-white', label: 'Ч' },
    { id: 'white-black', label: 'Б' },
    { id: 'yellow-black', label: 'Ж' },
    { id: 'blue-cyan', label: 'С' },
  ];

  return (
    <div className="a11y-bar" role="region" aria-label={t.a11y}>
      <div className="a11y-inner">
        <span className="a11y-label">{t.a11y}</span>

        <div className="a11y-group" role="group" aria-label="Размер шрифта">
          {['100', '130', '160'].map((f) => (
            <button
              key={f}
              className={font === f ? 'on' : ''}
              onClick={() => setCookie('a11y-font', f)}
              aria-pressed={font === f}
            >
              А{f === '130' ? '+' : f === '160' ? '++' : ''}
            </button>
          ))}
        </div>

        <div className="a11y-group" role="group" aria-label="Цветовая схема">
          {schemes.map((s) => (
            <button
              key={s.id}
              className={scheme === s.id ? 'on' : ''}
              onClick={() => setCookie('a11y-scheme', s.id)}
              aria-pressed={scheme === s.id}
              aria-label={`Схема ${s.label}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          className="a11y-off"
          onClick={() => {
            document.cookie = 'a11y=; path=/; max-age=0';
            router.refresh();
          }}
        >
          {t.normalVersion}
        </button>
      </div>
    </div>
  );
}
