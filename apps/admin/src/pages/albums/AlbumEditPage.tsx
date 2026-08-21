import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_ROUTES,
  API,
  LOCALES,
  LOCALE_LABELS,
  slugify,
  type Album,
  type UpsertAlbumRequest,
  type Locale,
  type Media,
  type Paginated,
} from '@atm/contracts';
import { api, ApiRequestError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

type TrState = { title: string; description: string; enabled: boolean };

/** Редактор альбома: набор фото/видео из медиабиблиотеки, обложка. */
export function AlbumEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [slug, setSlug] = useState('');
  const [coverId, setCoverId] = useState<string | null>(null);
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [activeLocale, setActiveLocale] = useState<Locale>('ru');
  const [tr, setTr] = useState<Record<Locale, TrState>>(() => emptyTranslations());
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [slugTouched, setSlugTouched] = useState(false);

  const { data } = useQuery({
    queryKey: ['admin-album', id],
    queryFn: () => api.get<Album>(API.admin.album(id!)),
    enabled: !isNew,
  });
  const { data: library } = useQuery({
    queryKey: ['admin-media', 'IMAGE'],
    queryFn: () => api.get<Paginated<Media>>(`${API.admin.media}?limit=100&kind=IMAGE`),
  });

  useEffect(() => {
    if (!data) return;
    setSlug(data.slug);
    setCoverId(data.coverId);
    setMediaIds(data.mediaIds);
    setStatus(data.status);
    setSlugTouched(true);
    const next = emptyTranslations();
    for (const t of data.translations) {
      next[t.locale] = { title: t.title, description: t.description ?? '', enabled: true };
    }
    setTr(next);
  }, [data]);

  useEffect(() => {
    if (isNew && !slugTouched && tr.ru.title) setSlug(slugify(tr.ru.title));
  }, [tr.ru.title, isNew, slugTouched]);

  const upload = useMutation({
    mutationFn: (file: File) => api.upload<Media>(API.admin.mediaUpload, file),
    onSuccess: (m) => {
      setMediaIds((prev) => [...prev, m.id]);
      qc.invalidateQueries({ queryKey: ['admin-media'] });
    },
  });

  const save = useMutation({
    mutationFn: (payload: UpsertAlbumRequest) =>
      isNew ? api.post<Album>(API.admin.albums, payload) : api.put<Album>(API.admin.album(id!), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-albums'] });
      navigate(ADMIN_ROUTES.albums);
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
      description: tr[l].description || null,
    }));

    if (translations.length === 0) {
      setErrors({ _: ['Заполните хотя бы один язык'] });
      return;
    }

    save.mutate({
      slug,
      coverId: coverId ?? mediaIds[0] ?? null,
      mediaIds,
      status: publish ? 'PUBLISHED' : status,
      order: 0,
      translations,
    } as UpsertAlbumRequest);
  }

  function toggle(mid: string) {
    setMediaIds((prev) => (prev.includes(mid) ? prev.filter((x) => x !== mid) : [...prev, mid]));
  }

  const cur = tr[activeLocale];
  const setCur = (patch: Partial<TrState>) =>
    setTr((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], ...patch, enabled: true } }));

  return (
    <div>
      <PageHeader
        title={isNew ? 'Новый альбом' : 'Редактирование альбома'}
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
          <button key={l} onClick={() => setActiveLocale(l)} style={{ ...tab, ...(activeLocale === l ? tabActive : {}) }}>
            {LOCALE_LABELS[l]}{' '}
            {tr[l].enabled && tr[l].title.trim() ? (
              <span style={{ color: 'var(--green-600)' }}>✓</span>
            ) : (
              <span style={{ color: 'var(--s-400)' }}>—</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
        <div>
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <div className="field">
              <label>Название · {activeLocale.toUpperCase()}</label>
              <input value={cur.title} onChange={(e) => setCur({ title: e.target.value })} />
              {errors.title && <div className="error">{errors.title[0]}</div>}
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Описание</label>
              <textarea value={cur.description} onChange={(e) => setCur({ description: e.target.value })} style={{ minHeight: 80 }} />
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ fontSize: 14 }}>Файлы альбома ({mediaIds.length})</strong>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload.mutate(file);
                    e.target.value = '';
                  }}
                />
                <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={upload.isPending}>
                  {upload.isPending ? 'Загрузка…' : '+ Загрузить фото'}
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
              {library?.items.map((m) => {
                const inAlbum = mediaIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggle(m.id)}
                    title={m.originalName}
                    style={{
                      position: 'relative',
                      border: inAlbum ? '2px solid var(--green-600)' : '1px solid var(--s-200)',
                      borderRadius: 8,
                      padding: 0,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: '#fff',
                    }}
                  >
                    <img src={m.url} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block', opacity: inAlbum ? 1 : 0.55 }} />
                    {inAlbum && (
                      <span style={{ position: 'absolute', top: 4, right: 4, background: 'var(--green-600)', color: '#fff', borderRadius: 999, width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20, alignSelf: 'start' }}>
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
          <div className="field">
            <label>Обложка</label>
            <select value={coverId ?? ''} onChange={(e) => setCoverId(e.target.value || null)}>
              <option value="">— первое фото в альбоме —</option>
              {mediaIds.map((mid) => {
                const m = library?.items.find((x) => x.id === mid);
                return (
                  <option key={mid} value={mid}>
                    {m?.originalName ?? mid}
                  </option>
                );
              })}
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
      </div>
    </div>
  );
}

function emptyTranslations(): Record<Locale, TrState> {
  return {
    kk: { title: '', description: '', enabled: false },
    ru: { title: '', description: '', enabled: false },
    en: { title: '', description: '', enabled: false },
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
