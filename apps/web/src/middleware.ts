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

/** Год: настройки режима для слабовидящих не должны сбрасываться между визитами. */
const A11Y_MAX_AGE = 60 * 60 * 24 * 365;

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

  // Включение и выключение режима для слабовидящих ссылкой ?a11y=on|off.
  //
  // Обрабатывается здесь, а не в браузере: режим нужен ровно тем, кто может
  // работать без JavaScript и через вспомогательные технологии. Параметр
  // снимается редиректом, чтобы он не тянулся в закладки и в поисковую выдачу.
  const a11yParam = req.nextUrl.searchParams.get('a11y');
  if (a11yParam === 'on' || a11yParam === 'off') {
    const url = req.nextUrl.clone();
    url.searchParams.delete('a11y');
    const res = NextResponse.redirect(url);
    if (a11yParam === 'on') {
      res.cookies.set('a11y', 'on', { path: '/', maxAge: A11Y_MAX_AGE, sameSite: 'lax' });
    } else {
      res.cookies.set('a11y', '', { path: '/', maxAge: 0 });
    }
    return res;
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
