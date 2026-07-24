import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Inter, Manrope } from 'next/font/google';
import type { PublicLayout, Locale } from '@atm/contracts';
import { LOCALES, LOCALE_HTML_LANG, API } from '@atm/contracts';
import { apiGet } from '@/lib/api';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { A11yBar } from '@/components/A11yBar';
import '../globals.css';
import './a11y.css';

/**
 * Шрифты через next/font: самохостинг (никаких запросов к Google на рантайме,
 * п. VIII ТЗ), font-display: swap, сабсет по алфавитам. cyrillic-ext покрывает
 * казахские буквы ә ғ қ ң ө ұ ү һ і — без него они «плывут».
 */
const inter = Inter({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});
const manrope = Manrope({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  weight: ['700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const dynamicParams = false;
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Рендер на запрос, а не статическая генерация на сборке.
 *
 * Весь контент приходит из БД, и бэкенд при сборке образа ещё не запущен —
 * пререндер на этапе build невозможен. Скорость обеспечивается кэшем на
 * стороне API (Redis) и nginx, а не статикой. Так же корректно для сайта,
 * контент которого Заказчик меняет в реальном времени.
 */
export const dynamic = 'force-dynamic';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(LOCALES as readonly string[]).includes(locale)) notFound();
  const loc = locale as Locale;

  const layout = await apiGet<PublicLayout>(API.public.layout, loc, {
    revalidate: 300,
    tags: ['layout'],
  });

  // Режим для слабовидящих применяется на сервере из cookie — без мигания
  // при загрузке (п. VI ТЗ).
  const cookieStore = await cookies();
  const a11y = cookieStore.get('a11y')?.value === 'on';
  const scheme = cookieStore.get('a11y-scheme')?.value || 'black-white';
  const font = cookieStore.get('a11y-font')?.value || '100';

  return (
    <html
      lang={LOCALE_HTML_LANG[loc]}
      className={`${inter.variable} ${manrope.variable}`}
      data-a11y={a11y ? 'on' : undefined}
      data-scheme={a11y ? scheme : undefined}
      style={a11y ? ({ ['--a11y-font-scale' as string]: `${Number(font) / 100}` }) : undefined}
    >
      <body>
        {a11y && <A11yBar locale={loc} scheme={scheme} font={font} />}
        <Header menu={layout.mainMenu} settings={layout.settings} locale={loc} path="" />
        <main id="main">{children}</main>
        <Footer menu={layout.footerMenu} settings={layout.settings} locale={loc} />
      </body>
    </html>
  );
}
