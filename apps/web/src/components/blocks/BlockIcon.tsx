import type { BlockIcon as IconName } from '@atm/contracts';

/* ============================================================================
   Набор иконок для карточек и подразделов.

   Инлайновый SVG, а не иконочный шрифт и не внешний спрайт: иконка красится
   currentColor (значит, работает в режиме для слабовидящих во всех схемах),
   не требует отдельного запроса и не мигает до загрузки.

   Штрих 1.7 при сетке 24 — иконки читаются и в 20 px карточки, и в 44 px
   заголовке подраздела.
   ========================================================================== */

const PATHS: Record<IconName, React.ReactNode> = {
  eco: (
    <>
      <path d="M12 21c0-6 3-10 8-11-.5 6-3.5 10-8 11Z" />
      <path d="M12 21c0-5-2.5-8.5-7-9.5.4 5 3 8.5 7 9.5Z" />
      <path d="M12 21v-4" />
    </>
  ),
  infra: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V9l5-4 5 4v12" />
      <path d="M15 21V13h4v8" />
      <path d="M9 21v-5h2v5" />
    </>
  ),
  safety: (
    <>
      <path d="M12 3 4.5 6v6c0 4.5 3.2 7.9 7.5 9 4.3-1.1 7.5-4.5 7.5-9V6L12 3Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  tourism: (
    <>
      <path d="M2.5 19h19L14 6l-3.6 6.2L8 9l-5.5 10Z" />
      <path d="M14 6V3l4 1.2L14 5.5" />
    </>
  ),
  inclusion: (
    <>
      <circle cx="9" cy="6.5" r="2.5" />
      <path d="M4 20v-3a5 5 0 0 1 10 0v3" />
      <circle cx="17.5" cy="8.5" r="2" />
      <path d="M16 20v-2.5a4 4 0 0 1 4-4" />
    </>
  ),
  economy: (
    <>
      <path d="M4 19h16" />
      <path d="M6.5 19v-5" />
      <path d="M11 19V9" />
      <path d="M15.5 19v-7" />
      <path d="M20 19V5" />
    </>
  ),
  transport: (
    <>
      <rect x="4" y="4.5" width="16" height="12" rx="2.5" />
      <path d="M4 11h16" />
      <path d="M7.5 20v-3.5M16.5 20v-3.5" />
      <circle cx="8" cy="13.8" r=".9" fill="currentColor" stroke="none" />
      <circle cx="16" cy="13.8" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  sport: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.5 13.5-1.8 7 5.3-2.8 5.3 2.8-1.8-7" />
    </>
  ),
  education: (
    <>
      <path d="m12 4 9 4.5-9 4.5-9-4.5L12 4Z" />
      <path d="M7 11v4.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V11" />
      <path d="M21 8.5V14" />
    </>
  ),
  cablecar: (
    <>
      <path d="M3 5.5 21 9" />
      <path d="M12 7.2V10" />
      <rect x="6.5" y="10" width="11" height="8" rx="2" />
      <path d="M6.5 14h11" />
    </>
  ),
  health: (
    <>
      <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z" />
    </>
  ),
  parking: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M9.5 17V7h3.2a3 3 0 0 1 0 6H9.5" />
    </>
  ),
  ticket: (
    <>
      <path d="M3.5 8.5V7a1.5 1.5 0 0 1 1.5-1.5h14A1.5 1.5 0 0 1 20.5 7v1.5a2 2 0 0 0 0 7V17a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17v-1.5a2 2 0 0 0 0-7Z" />
      <path d="M12 8.5v7" strokeDasharray="2 2.5" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="4" />,
};

export function BlockIcon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name] ?? PATHS.dot}
    </svg>
  );
}
