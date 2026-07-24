import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Вебхук ревалидации ISR.
 *
 * Бэкенд дёргает его при публикации контента, чтобы сайт обновился сразу,
 * а не по истечении времени кэша. Защищён общим секретом REVALIDATE_SECRET —
 * без него кто угодно смог бы сбрасывать кэш и создавать нагрузку.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-revalidate-secret');
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { tags?: string[] };
  const tags = body.tags ?? ['layout', 'home', 'news', 'pages'];
  for (const tag of tags) revalidateTag(tag);

  return NextResponse.json({ revalidated: true, tags });
}
