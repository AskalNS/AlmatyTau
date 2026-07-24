import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_ROUTES,
  API,
  LOCALES,
  LOCALE_LABELS,
  slugify,
  type News,
  type UpsertNewsRequest,
  type Locale,
  type Blocks,
} from '@atm/contracts';
import { api, ApiRequestError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { BlockEditor } from '@/components/BlockEditor';

type TrState = {
  title: string;
  excerpt: string;
  blocks: Blocks;
  /** Присутствует ли перевод на этот язык. Пустой = не переведено. */
  enabled: boolean;
};

/**
 * Редактор новости — ключевой экран админки.
 *
 * Языковые вкладки KK / RU / EN со статусом перевода (п. III ТЗ): галочка,
 * если язык заполнен. Публикуются только заполненные языки — незаполненный
 * не отправляется в переводах и не появится на сайте на этом языке.
 */
export function NewsEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [activeLocale, setActiveLocale] = useState<Locale>('ru');
  const [tr, setTr] = useState<Record<Locale, TrState>>(() => emptyTranslations());
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [slugTouched, setSlugTouched] = useState(false);

  // Загрузка существующей новости.
  const { data } = useQuery({
    queryKey: ['admin-news', id],
    queryFn: () => api.get<News>(API.admin.newsItem(id!)),
    enabled: !isNew,
  });

  useEffect(() => {
    if (!data) return;
    setSlug(data.slug);
    setStatus(data.status);
    setSlugTouched(true);
    const next = emptyTranslations();
    for (const t of data.translations) {
      next[t.locale] = {
        title: t.title,
        excerpt: t.excerpt ?? '',
        blocks: t.blocks,
        enabled: true,
      };
    }
    setTr(next);
  }, [data]);

  // Автогенерация slug из русского заголовка, пока адрес не правили руками.
  useEffect(() => {
    if (isNew && !slugTouched && tr.ru.title) setSlug(slugify(tr.ru.title));
  }, [tr.ru.title, isNew, slugTouched]);

  const save = useMutation({
    mutationFn: (payload: UpsertNewsRequest) =>
      isNew ? api.post<News>(API.admin.news, payload) : api.put<News>(API.admin.newsItem(id!), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-news'] });
      navigate(ADMIN_ROUTES.news);
    },
    onError: (e) => {
      if (e instanceof ApiRequestError && e.fields) setErrors(e.fields);
    },
  });

  function onSave(publish: boolean) {
    setErrors({});
    // В переводы попадают только заполненные языки (п. III ТЗ).
    const translations = LOCALES.filter((l) => tr[l].enabled && tr[l].title.trim()).map((l) => ({
      locale: l,
      title: tr[l].title,
      excerpt: tr[l].excerpt || null,
      blocks: tr[l].blocks,
    }));

    if (translations.length === 0) {
      setErrors({ _: ['Заполните хотя бы один язык'] });
      return;
    }

    save.mutate({
      slug,
      status: publish ? 'PUBLISHED' : status,
      isPinned: false,
      translations,
    } as UpsertNewsRequest);
  }

  const cur = tr[activeLocale];
  const setCur = (patch: Partial<TrState>) =>
    setTr((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], ...patch, enabled: true } }));

  return (
    <div>
      <PageHeader
        title={isNew ? 'Новая новость' : 'Редактирование новости'}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => onSave(false)} disabled={save.isPending}>
              Сохранить черновик
            </button>
            <button className="btn btn-primary" onClick={() => onSave(true)} disabled={save.isPending}>
              Опубликовать
            </button>
          </div>
        }
      />

      {errors._ && <div style={errBox}>{errors._[0]}</div>}

      {/* Языковые вкладки со статусом перевода */}
      <div style={tabs}>
        {LOCALES.map((l) => (
          <button
            key={l}
            onClick={() => setActiveLocale(l)}
            style={{
              ...tab,
              ...(activeLocale === l ? tabActive : {}),
            }}
          >
            {LOCALE_LABELS[l]}{' '}
            {tr[l].enabled && tr[l].title.trim() ? (
              <span style={{ color: 'var(--green-600)' }}>✓</span>
            ) : (
              <span style={{ color: 'var(--s-400)' }}>—</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="field">
            <label>Заголовок · {activeLocale.toUpperCase()}</label>
            <input value={cur.title} onChange={(e) => setCur({ title: e.target.value })} />
            {errors.title && <div className="error">{errors.title[0]}</div>}
          </div>
          <div className="field">
            <label>Анонс для ленты</label>
            <textarea
              value={cur.excerpt}
              onChange={(e) => setCur({ excerpt: e.target.value })}
              style={{ minHeight: 70 }}
            />
          </div>
          <div className="field">
            <label>Содержание</label>
            <BlockEditor blocks={cur.blocks} onChange={(blocks) => setCur({ blocks })} />
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div className="field">
              <label>Адрес (slug)</label>
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
              />
              {errors.slug && <div className="error">{errors.slug[0]}</div>}
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Статус</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="DRAFT">Черновик</option>
                <option value="PUBLISHED">Опубликовано</option>
                <option value="ARCHIVED">В архиве</option>
              </select>
            </div>
          </div>

          <div className="card" style={{ padding: 16, fontSize: 13, color: 'var(--s-500)', lineHeight: 1.6 }}>
            Языковая версия публикуется только если её заголовок заполнен.
            Незаполненный язык не появится на сайте (п. III ТЗ).
          </div>
        </div>
      </div>
    </div>
  );
}

function emptyTranslations(): Record<Locale, TrState> {
  return {
    kk: { title: '', excerpt: '', blocks: [], enabled: false },
    ru: { title: '', excerpt: '', blocks: [], enabled: false },
    en: { title: '', excerpt: '', blocks: [], enabled: false },
  };
}

const tabs: React.CSSProperties = { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--s-200)' };
const tab: React.CSSProperties = {
  padding: '10px 18px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--s-500)',
  marginBottom: -2,
  borderBottom: '2px solid transparent',
};
const tabActive: React.CSSProperties = { color: 'var(--green-700)', borderBottomColor: 'var(--green-600)' };
const errBox: React.CSSProperties = {
  background: '#fbecea',
  color: '#a8322a',
  padding: '10px 14px',
  borderRadius: 6,
  fontSize: 13,
  marginBottom: 16,
};
