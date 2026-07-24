import type { Metadata } from 'next';

/**
 * Корневой layout — сознательно пустой.
 *
 * Теги <html> и <body> рендерит app/[locale]/layout.tsx: только там доступен
 * язык, а он нужен для атрибута lang и режима слабовидящих. Это официальный
 * паттерн интернационализации Next.js App Router (пример app-dir-i18n-routing).
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://atm.kz'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
