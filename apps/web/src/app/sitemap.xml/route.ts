import type { SitemapEntry } from '@atm/contracts';
import { API, LOCALE_HTML_LANG, href as buildHref } from '@atm/contracts';

/**
 * sitemap.xml с alternate-ссылками hreflang (п. IX ТЗ).
 *
 * Данные собирает бэкенд (SiteService.sitemap): каждая страница попадает
 * по одному разу на каждый язык, на котором реально переведена. Здесь
 * только сериализация в XML.
 */
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://atm.kz').replace(/\/$/, '');
  const apiUrl = process.env.API_INTERNAL_URL || 'http://localhost:4000';

  let entries: SitemapEntry[] = [];
  try {
    const res = await fetch(`${apiUrl}${API.public.sitemap}`, { next: { revalidate: 3600 } });
    if (res.ok) entries = await res.json();
  } catch {
    // При недоступности API отдаём хотя бы корни — sitemap не должен падать.
  }

  const urls = entries
    .map((e) => {
      const loc = `${siteUrl}${buildHref(e.locale, e.path)}`;
      const alternates = e.alternates
        .map(
          (alt) =>
            `<xhtml:link rel="alternate" hreflang="${LOCALE_HTML_LANG[alt]}" href="${siteUrl}${buildHref(alt, e.path)}"/>`,
        )
        .join('');
      return `<url><loc>${loc}</loc><lastmod>${e.updatedAt}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority>${alternates}</url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
