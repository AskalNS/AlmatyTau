import { NextRequest, NextResponse } from 'next/server';
import { LOCALES, DEFAULT_LOCALE } from '@atm/contracts';

/**
 * Языковая маршрутизация.
 *
 * Каждый URL начинается с /kk, /ru или /en (п. IV ТЗ — отдельный URL
 * на язык). Заход без префикса перенаправляется на язык из Accept-Language,
 * по умолчанию русский.
 */
const PUBLIC_FILE = /\.(.*)$/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Пропускаем статику, api-прокси и внутренние пути Next.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocale) return NextResponse.next();

  const locale = detectLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

function detectLocale(req: NextRequest): string {
  const header = req.headers.get('accept-language');
  if (header) {
    const preferred = header.split(',').map((p) => p.split(';')[0].trim().slice(0, 2).toLowerCase());
    for (const p of preferred) {
      if ((LOCALES as readonly string[]).includes(p)) return p;
    }
  }
  return DEFAULT_LOCALE;
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
