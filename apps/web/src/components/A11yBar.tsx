'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import type { Locale } from '@atm/contracts';
import { dict } from '@/lib/dictionary';

/* ============================================================================
   Панель управления версией для слабовидящих (п. VI ТЗ).

   Настройки пишутся в cookie и применяются на сервере (см. [locale]/layout),
   поэтому страница не мигает при загрузке и режим сохраняется между визитами.
   Это не сторонний виджет и не CSS-фильтр поверх обычной вёрстки, а отдельная
   тема сайта: перекрашиваются карточки, таблицы, шапка и подвал, отключаются
   декоративные тени и анимации.

   Состав настроек — обязательный минимум для государственных ресурсов:
   размер шрифта, цветовая схема, межбуквенный интервал, показ изображений
   и возврат к обычной версии.
   ========================================================================== */

const FONTS = ['100', '130', '160'] as const;

const SCHEMES: Array<{ id: string; label: string; title: string }> = [
  { id: 'black-white', label: 'Ч', title: 'Чёрным по белому' },
  { id: 'white-black', label: 'Б', title: 'Белым по чёрному' },
  { id: 'yellow-black', label: 'Ж', title: 'Жёлтым по чёрному' },
  { id: 'blue-cyan', label: 'С', title: 'Тёмно-синим по голубому' },
];

const SPACINGS: Array<{ id: string; label: string; title: string }> = [
  { id: 'normal', label: 'Об', title: 'Обычный интервал' },
  { id: 'medium', label: 'Ср', title: 'Средний интервал' },
  { id: 'large', label: 'Бо', title: 'Большой интервал' },
];

export function A11yBar({
  locale,
  scheme,
  font,
  spacing,
  images,
}: {
  locale: Locale;
  scheme: string;
  font: string;
  spacing: string;
  images: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const t = dict(locale);

  const setCookie = (name: string, value: string) => {
    document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  };

  return (
    <div className="a11y-bar" role="region" aria-label={t.a11y}>
      <div className="a11y-inner">
        <span className="a11y-label">{t.a11y}</span>

        <div className="a11y-group" role="group" aria-label="Размер шрифта">
          {FONTS.map((f) => (
            <button
              key={f}
              type="button"
              className={font === f ? 'on' : ''}
              onClick={() => setCookie('a11y-font', f)}
              aria-pressed={font === f}
              title={f === '100' ? 'Обычный размер' : f === '130' ? 'Крупный' : 'Очень крупный'}
            >
              А{f === '130' ? '+' : f === '160' ? '++' : ''}
            </button>
          ))}
        </div>

        <div className="a11y-group" role="group" aria-label="Цветовая схема">
          {SCHEMES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={scheme === s.id ? 'on' : ''}
              onClick={() => setCookie('a11y-scheme', s.id)}
              aria-pressed={scheme === s.id}
              aria-label={s.title}
              title={s.title}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="a11y-group" role="group" aria-label="Межбуквенный интервал">
          {SPACINGS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={spacing === s.id ? 'on' : ''}
              onClick={() => setCookie('a11y-spacing', s.id)}
              aria-pressed={spacing === s.id}
              aria-label={s.title}
              title={s.title}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="a11y-group" role="group" aria-label="Изображения">
          <button
            type="button"
            className={images ? 'on' : ''}
            onClick={() => setCookie('a11y-images', images ? 'off' : 'on')}
            aria-pressed={images}
            title={images ? 'Скрыть изображения' : 'Показать изображения'}
          >
            {images ? 'Изображения вкл.' : 'Изображения выкл.'}
          </button>
        </div>

        {/* Выключение — обычной ссылкой: режимом пользуются в том числе
            без JavaScript, а сброс cookie делает middleware. */}
        <a className="a11y-off" href={`${pathname}?a11y=off`}>
          {t.normalVersion}
        </a>
      </div>
    </div>
  );
}
