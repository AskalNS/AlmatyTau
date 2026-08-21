import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_ROUTES,
  API,
  LOCALES,
  LOCALE_LABELS,
  slugify,
  type Page,
  type UpsertPageRequest,
  type Locale,
  type Blocks,
} from '@atm/contracts';
import { api, ApiRequestError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { BlockEditor } from '@/components/BlockEditor';
import { MediaField } from '@/components/MediaField';

type TrState = { title: string; lead: string; blocks: Blocks; enabled: boolean };

/** Редактор страницы: путь, обложка, родитель, языковые вкладки, блоки. */
export function PageEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [path, setPath] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [coverId, setCoverId] = useState<string | null>(null);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [activeLocale, setActiveLocale] = useState<Locale>('ru');
  const [tr, setTr] = useState<Record<Locale, TrState>>(() => emptyTranslations());
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pathTouched, setPathTouched] = useState(false);

  const { data } = useQuery({
    queryKey: ['admin-page', id],
    queryFn: () => api.get<Page>(API.admin.page(id!)),
    enabled: !isNew,
  });

  const { data: allPages } = useQuery({
    queryKey: ['admin-pages'],
    queryFn: () => api.get<Page[]>(API.admin.pages),
  });

  useEffect(() => {
    if (!data) return;
    setPath(data.path);
    setParentId(data.parentId ?? '');
    setCoverId(data.coverId);
    setStatus(data.status);
    setPathTouched(true);
    const next = emptyTranslations();
    for (const t of data.translations) {
      next[t.locale] = { title: t.title, lead: t.lead ?? '', blocks: t.blocks, enabled: true };
    }
    setTr(next);
  }, [data]);

  useEffect(() => {
    if (isNew && !pathTouched && tr.ru.title) setPath(slugify(tr.ru.title));
  }, [tr.ru.title, isNew, pathTouched]);

  const save = useMutation({
    mutationFn: (payload: UpsertPageRequest) =>
      isNew ? api.post<Page>(API.admin.pages, payload) : api.put<Page>(API.admin.page(id!), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pages'] });
      navigate(ADMIN_ROUTES.pages);
    },
    onError: (e) => {
      if (e instanceof ApiRequestError && e.fields) setErrors(e.fields);
    },
  });

  function onSave(publish: boolean) {
    setErrors({});
    const translations = LOCALES.filter((l) => tr[l].enabled && tr[l].title.trim()).map((l) => ({
      locale: l,
      title: tr[l].title,
      lead: tr[l].lead || null,
      blocks: tr[l].blocks,
    }));

    if (translations.length === 0) {
      setErrors({ _: ['Заполните хотя бы один язык'] });
      return;
    }

    save.mutate({
      path,
      parentId: parentId || null,
      coverId,
      status: publish ? 'PUBLISHED' : status,
      order: 0,
      translations,
    } as UpsertPageRequest);
  }

  const cur = tr[activeLocale];
  const setCur = (patch: Partial<TrState>) =>
    setTr((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], ...patch, enabled: true } }));

  return (
    <div>
      <PageHeader
        title={isNew ? 'Новая страница' : 'Редактирование страницы'}
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

      <div style={tabs}>
        {LOCALES.map((l) => (
          <button
            key={l}
            onClick={() => setActiveLocale(l)}
            style={{ ...tab, ...(activeLocale === l ? tabActive : {}) }}
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
            <label>Вводный абзац</label>
            <textarea value={cur.lead} onChange={(e) => setCur({ lead: e.target.value })} style={{ minHeight: 70 }} />
          </div>
          <div className="field">
            <label>Содержание</label>
            <BlockEditor blocks={cur.blocks} onChange={(blocks) => setCur({ blocks })} />
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div className="field">
              <label>Адрес (путь)</label>
              <input
                value={path}
                onChange={(e) => {
                  setPath(e.target.value);
                  setPathTouched(true);
                }}
                placeholder="company/about"
                disabled={data?.isSystem}
              />
              {errors.path && <div className="error">{errors.path[0]}</div>}
            </div>
            <div className="field">
              <label>Родительская страница</label>
              <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">— нет —</option>
                {allPages
                  ?.filter((p) => p.id !== id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      /{p.path}
                    </option>
                  ))}
              </select>
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

          <div className="card" style={{ padding: 20 }}>
            <MediaField label="Обложка страницы" mediaId={coverId} onChange={setCoverId} />
          </div>
        </div>
      </div>
    </div>
  );
}

function emptyTranslations(): Record<Locale, TrState> {
  return {
    kk: { title: '', lead: '', blocks: [], enabled: false },
    ru: { title: '', lead: '', blocks: [], enabled: false },
    en: { title: '', lead: '', blocks: [], enabled: false },
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
