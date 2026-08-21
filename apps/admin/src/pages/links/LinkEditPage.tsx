import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_ROUTES,
  API,
  LOCALES,
  LOCALE_LABELS,
  LINK_GROUPS,
  LINK_GROUP_LABELS,
  type Link,
  type UpsertLinkRequest,
  type Locale,
  type LinkGroup,
} from '@atm/contracts';
import { api, ApiRequestError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { MediaField } from '@/components/MediaField';

type TrState = { title: string; description: string; enabled: boolean };

/** Редактор внешней ссылки. */
export function LinkEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [url, setUrl] = useState('');
  const [group, setGroup] = useState<LinkGroup>('OTHER');
  const [logoId, setLogoId] = useState<string | null>(null);
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [activeLocale, setActiveLocale] = useState<Locale>('ru');
  const [tr, setTr] = useState<Record<Locale, TrState>>(() => emptyTranslations());
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const { data } = useQuery({
    queryKey: ['admin-link', id],
    queryFn: () => api.get<Link>(API.admin.link(id!)),
    enabled: !isNew,
  });

  useEffect(() => {
    if (!data) return;
    setUrl(data.url);
    setGroup(data.group);
    setLogoId(data.logoId);
    setOrder(data.order);
    setIsActive(data.isActive);
    const next = emptyTranslations();
    for (const t of data.translations) {
      next[t.locale] = { title: t.title, description: t.description ?? '', enabled: true };
    }
    setTr(next);
  }, [data]);

  const save = useMutation({
    mutationFn: (payload: UpsertLinkRequest) =>
      isNew ? api.post<Link>(API.admin.links, payload) : api.put<Link>(API.admin.link(id!), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-links'] });
      navigate(ADMIN_ROUTES.links);
    },
    onError: (e) => {
      if (e instanceof ApiRequestError && e.fields) setErrors(e.fields);
    },
  });

  function onSave() {
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

    save.mutate({ url, group, logoId, order, isActive, translations } as UpsertLinkRequest);
  }

  const cur = tr[activeLocale];
  const setCur = (patch: Partial<TrState>) =>
    setTr((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], ...patch, enabled: true } }));

  return (
    <div>
      <PageHeader
        title={isNew ? 'Новая ссылка' : 'Редактирование ссылки'}
        action={
          <button className="btn btn-primary" onClick={onSave} disabled={save.isPending}>
            Сохранить
          </button>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="field">
            <label>Название · {activeLocale.toUpperCase()}</label>
            <input value={cur.title} onChange={(e) => setCur({ title: e.target.value })} />
            {errors.title && <div className="error">{errors.title[0]}</div>}
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Описание</label>
            <textarea value={cur.description} onChange={(e) => setCur({ description: e.target.value })} style={{ minHeight: 90 }} />
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div className="field">
              <label>Адрес (URL)</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
              {errors.url && <div className="error">{errors.url[0]}</div>}
            </div>
            <div className="field">
              <label>Группа</label>
              <select value={group} onChange={(e) => setGroup(e.target.value as LinkGroup)}>
                {LINK_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {LINK_GROUP_LABELS[g]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Порядок отображения</label>
              <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
            </div>
            <div className="field" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: 'auto' }} />
              <label htmlFor="isActive" style={{ margin: 0 }}>Активна на сайте</label>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <MediaField label="Логотип" mediaId={logoId} onChange={setLogoId} />
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
