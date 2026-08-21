'use client';

import { usePathname } from 'next/navigation';

/**
 * Ссылка «Версия для слабовидящих» в шапке.
 *
 * Ведёт на текущий адрес с параметром ?a11y=on — режим включает middleware
 * и снимает параметр редиректом. Раньше ссылка вела на главную и режим
 * не включался вовсе: обработчика параметра не было.
 *
 * Клиентский компонент нужен только ради usePathname; ссылка отрисовывается
 * на сервере с готовым href, поэтому работает и без JavaScript.
 */
export function A11yLink({
  className,
  textClassName,
  label,
}: {
  className?: string;
  /** На узких экранах подпись визуально прячется — иконка остаётся кликабельной. */
  textClassName?: string;
  label: string;
}) {
  const pathname = usePathname() || '/';
  return (
    <a className={className} href={`${pathname}?a11y=on`}>
      <span aria-hidden="true">◐</span> <span className={textClassName}>{label}</span>
    </a>
  );
}
