import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_ROUTES,
  API,
  LOCALES,
  LOCALE_LABELS,
  type MenuItem,
  type UpsertMenuItemRequest,
  type Locale,
} from '@atm/contracts';
import { api, ApiRequestError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

/** Редактор пункта меню (п. IV ТЗ): адрес, родитель, видимость по языкам. */
export function MenuEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [parentId, setParentId] = useState('');
  const [href, setHref] = useState('');
  const [isExternal, setIsExternal] = useState(false);
  const [order, setOrder] = useState(0);
  const [location, setLocation] = useState<'MAIN' | 'FOOTER'>('MAIN');
  const [visibleLocales, setVisibleLocales] = useState<Locale[]>(['kk', 'ru', 'en']);
  const [titles, setTitles] = useState<Record<Locale, string>>({ kk: '', ru: '', en: '' });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const { data } = useQuery({
    queryKey: ['admin-menu-item', id],
    queryFn: () => api.get<MenuItem>(API.admin.menuItem(id!)),
    enabled: !isNew,
  });
  const { data: allItems } = useQuery({
    queryKey: ['admin-menu'],
    queryFn: () => api.get<MenuItem[]>(API.admin.menu),
  });

  useEffect(() => {
    if (!data) return;
    setParentId(data.parentId ?? '');
    setHref(data.href);
    setIsExternal(data.isExternal);
    setOrder(data.order);
    setLocation(data.location);
    setVisibleLocales(data.visibleLocales);
    const next: Record<Locale, string> = { kk: '', ru: '', en: '' };
    for (const t of data.translations) next[t.locale] = t.title;
    setTitles(next);
  }, [data]);

  const save = useMutation({
    mutationFn: (payload: UpsertMenuItemRequest) =>
      isNew ? api.post<MenuItem>(API.admin.menu, payload) : api.put<MenuItem>(API.admin.menuItem(id!), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-menu'] });
      navigate(ADMIN_ROUTES.menu);
    },
    onError: (e) => {
      if (e instanceof ApiRequestError && e.fields) setErrors(e.fields);
    },
  });

  function onSave() {
    setErrors({});
    const translations = LOCALES.filter((l) => titles[l].trim()).map((l) => ({ locale: l, title: titles[l] }));
    if (translations.length === 0) {
      setErrors({ _: ['Заполните название хотя бы на одном языке'] });
      return;
    }
    save.mutate({
      parentId: parentId || null,
      href,
      isExternal,
      order,
      location,
      visibleLocales,
      translations,
    } as UpsertMenuItemRequest);
  }

  function toggleLocale(l: Locale) {
    setVisibleLocales((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  }

  return (
    <div>
      <PageHeader
        title={isNew ? 'Новый пункт меню' : 'Редактирование пункта меню'}
        action={
          <button className="btn btn-primary" onClick={onSave} disabled={save.isPending}>
            Сохранить
          </button>
        }
      />

      {errors._ && <div style={errBox}>{errors._[0]}</div>}

      <div className="card" style={{ padding: 24, maxWidth: 560 }}>
        {LOCALES.map((l) => (
          <div className="field" key={l}>
            <label>Название · {LOCALE_LABELS[l]}</label>
            <input value={titles[l]} onChange={(e) => setTitles((p) => ({ ...p, [l]: e.target.value }))} />
          </div>
        ))}
        {errors.translations && <div className="error">{errors.translations[0]}</div>}

        <div className="field">
          <label>Адрес (внутренний путь без /ru или внешний URL)</label>
          <input value={href} onChange={(e) => setHref(e.target.value)} placeholder="project или https://..." />
          {errors.href && <div className="error">{errors.href[0]}</div>}
        </div>

        <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" id="isExternal" checked={isExternal} onChange={(e) => setIsExternal(e.target.checked)} style={{ width: 'auto' }} />
          <label htmlFor="isExternal" style={{ margin: 0 }}>Внешняя ссылка</label>
        </div>

        <div className="field">
          <label>Расположение</label>
          <select value={location} onChange={(e) => setLocation(e.target.value as typeof location)}>
            <option value="MAIN">Главное меню</option>
            <option value="FOOTER">Подвал</option>
          </select>
        </div>

        <div className="field">
          <label>Родительский пункт</label>
          <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">— верхний уровень —</option>
            {allItems
              ?.filter((i) => i.id !== id && i.location === location)
              .map((i) => {
                const ru = i.translations.find((t) => t.locale === 'ru') ?? i.translations[0];
                return (
                  <option key={i.id} value={i.id}>
                    {ru?.title}
                  </option>
                );
              })}
          </select>
        </div>

        <div className="field">
          <label>Порядок отображения</label>
          <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>Видимость по языкам</label>
          <div style={{ display: 'flex', gap: 12 }}>
            {LOCALES.map((l) => (
              <label key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
                <input type="checkbox" checked={visibleLocales.includes(l)} onChange={() => toggleLocale(l)} style={{ width: 'auto' }} />
                {LOCALE_LABELS[l]}
              </label>
            ))}
          </div>
          {errors.visibleLocales && <div className="error">{errors.visibleLocales[0]}</div>}
        </div>
      </div>
    </div>
  );
}

const errBox: React.CSSProperties = {
  background: '#fbecea',
  color: '#a8322a',
  padding: '10px 14px',
  borderRadius: 6,
  fontSize: 13,
  marginBottom: 16,
};
