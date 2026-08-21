import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_ROUTES,
  API,
  LOCALES,
  LOCALE_LABELS,
  PERSON_BOARD_LABELS,
  PERSON_BOARDS,
  slugify,
  type Person,
  type UpsertPersonRequest,
  type Locale,
  type PersonBoard,
} from '@atm/contracts';
import { api, ApiRequestError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { MediaField } from '@/components/MediaField';

type TrState = { fullName: string; position: string; bio: string; enabled: boolean };

/** Редактор персоны — Правление / Наблюдательный совет. */
export function PersonEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [slug, setSlug] = useState('');
  const [board, setBoard] = useState<PersonBoard>('MANAGEMENT');
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [order, setOrder] = useState(0);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [activeLocale, setActiveLocale] = useState<Locale>('ru');
  const [tr, setTr] = useState<Record<Locale, TrState>>(() => emptyTranslations());
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [slugTouched, setSlugTouched] = useState(false);

  const { data } = useQuery({
    queryKey: ['admin-person', id],
    queryFn: () => api.get<Person>(API.admin.person(id!)),
    enabled: !isNew,
  });

  useEffect(() => {
    if (!data) return;
    setSlug(data.slug);
    setBoard(data.board);
    setPhotoId(data.photoId);
    setOrder(data.order);
    setStatus(data.status);
    setSlugTouched(true);
    const next = emptyTranslations();
    for (const t of data.translations) {
      next[t.locale] = { fullName: t.fullName, position: t.position, bio: t.bio ?? '', enabled: true };
    }
    setTr(next);
  }, [data]);

  useEffect(() => {
    if (isNew && !slugTouched && tr.ru.fullName) setSlug(slugify(tr.ru.fullName));
  }, [tr.ru.fullName, isNew, slugTouched]);

  const save = useMutation({
    mutationFn: (payload: UpsertPersonRequest) =>
      isNew ? api.post<Person>(API.admin.persons, payload) : api.put<Person>(API.admin.person(id!), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-persons'] });
      navigate(ADMIN_ROUTES.persons);
    },
    onError: (e) => {
      if (e instanceof ApiRequestError && e.fields) setErrors(e.fields);
    },
  });

  function onSave(publish: boolean) {
    setErrors({});
    const translations = LOCALES.filter((l) => tr[l].enabled && tr[l].fullName.trim()).map((l) => ({
      locale: l,
      fullName: tr[l].fullName,
      position: tr[l].position,
      bio: tr[l].bio || null,
    }));

    if (translations.length === 0) {
      setErrors({ _: ['Заполните хотя бы один язык'] });
      return;
    }

    save.mutate({
      slug,
      board,
      photoId,
      order,
      status: publish ? 'PUBLISHED' : status,
      translations,
    } as UpsertPersonRequest);
  }

  const cur = tr[activeLocale];
  const setCur = (patch: Partial<TrState>) =>
    setTr((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], ...patch, enabled: true } }));

  return (
    <div>
      <PageHeader
        title={isNew ? 'Новая персона' : 'Редактирование персоны'}
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
            {tr[l].enabled && tr[l].fullName.trim() ? (
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
            <label>ФИО · {activeLocale.toUpperCase()}</label>
            <input value={cur.fullName} onChange={(e) => setCur({ fullName: e.target.value })} />
            {errors.fullName && <div className="error">{errors.fullName[0]}</div>}
          </div>
          <div className="field">
            <label>Должность</label>
            <input value={cur.position} onChange={(e) => setCur({ position: e.target.value })} />
            {errors.position && <div className="error">{errors.position[0]}</div>}
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Биография</label>
            <textarea value={cur.bio} onChange={(e) => setCur({ bio: e.target.value })} style={{ minHeight: 160 }} />
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div className="field">
              <label>Совет</label>
              <select value={board} onChange={(e) => setBoard(e.target.value as PersonBoard)}>
                {PERSON_BOARDS.map((b) => (
                  <option key={b} value={b}>
                    {PERSON_BOARD_LABELS[b]}
                  </option>
                ))}
              </select>
            </div>
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
              <label>Порядок отображения</label>
              <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
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
            <MediaField label="Фотография" mediaId={photoId} onChange={setPhotoId} keepOriginal />
          </div>
        </div>
      </div>
    </div>
  );
}

function emptyTranslations(): Record<Locale, TrState> {
  return {
    kk: { fullName: '', position: '', bio: '', enabled: false },
    ru: { fullName: '', position: '', bio: '', enabled: false },
    en: { fullName: '', position: '', bio: '', enabled: false },
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
