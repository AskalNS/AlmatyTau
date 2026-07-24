import Link from 'next/link';
import type { Locale } from '@atm/contracts';
import { LOCALES, LOCALE_SHORT } from '@atm/contracts';
import styles from './header.module.css';
import langStyles from './lang.module.css';

/**
 * Переключатель языка (п. III ТЗ).
 *
 * Ведёт на тот же путь на другом языке. Порядок из LOCALES: казахский
 * первым как государственный.
 */
export function LanguageSwitcher({ locale, path }: { locale: Locale; path: string }) {
  const clean = path.replace(/^\/+/, '');
  return (
    <div className={langStyles.lang} role="group" aria-label="Выбор языка">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={clean ? `/${l}/${clean}` : `/${l}`}
          className={l === locale ? langStyles.on : ''}
          hrefLang={l}
          aria-current={l === locale ? 'true' : undefined}
        >
          {LOCALE_SHORT[l]}
        </Link>
      ))}
    </div>
  );
}
