import Link from 'next/link';

/**
 * Страница 404. Локаль здесь недоступна из params (Next ограничение
 * not-found), поэтому подписи нейтральные/трёхъязычные.
 */
export default function NotFound() {
  return (
    <div className="wrap" style={{ padding: '96px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 72, fontWeight: 800, color: 'var(--green-700)', fontFamily: 'var(--font-display)' }}>
        404
      </div>
      <h1 style={{ fontSize: 26, margin: '12px 0' }}>Страница не найдена</h1>
      <p style={{ color: 'var(--s-500)', marginBottom: 28 }}>
        Бет табылмады · Page not found
      </p>
      <Link className="btn btn-primary" href="/ru">
        На главную
      </Link>
    </div>
  );
}
