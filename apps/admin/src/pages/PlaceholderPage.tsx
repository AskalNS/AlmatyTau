import { PageHeader } from '@/components/PageHeader';

/**
 * Заглушка для разделов, чьи экраны реализуются по образцу «Новостей».
 *
 * Бэкенд для всех этих сущностей уже готов и документирован в Swagger
 * (/api/docs). Экран строится по тому же шаблону, что NewsListPage +
 * NewsEditPage: список с языковыми вкладками и блочным редактором.
 */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--s-500)' }}>
        <p style={{ maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
          Раздел «{title}» использует тот же шаблон, что и «Новости»:
          список сущностей, языковые вкладки KK / RU / EN со статусом перевода
          и блочный редактор. API этого раздела готов — см.&nbsp;
          <code>/api/docs</code>.
        </p>
      </div>
    </div>
  );
}
