/** robots.txt (п. IX ТЗ). */
export function GET(): Response {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://atm.kz').replace(/\/$/, '');
  const body = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
