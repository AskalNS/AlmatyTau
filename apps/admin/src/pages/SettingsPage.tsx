import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API, LOCALES, LOCALE_LABELS, type Settings, type UpdateSettingsRequest, type Locale } from '@atm/contracts';
import { api, ApiRequestError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

type TrState = { organizationName: string; address: string; workingHours: string; footerText: string };

/** Настройки сайта: контакты, подвал, реквизиты (п. 6 ТЗ). Только Администратор. */
export function SettingsPage() {
  const qc = useQueryClient();
  const [activeLocale, setActiveLocale] = useState<Locale>('ru');
  const [phones, setPhones] = useState<string[]>(['']);
  const [emails, setEmails] = useState<string[]>(['']);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const [homeNewsCount, setHomeNewsCount] = useState(3);
  const [tr, setTr] = useState<Record<Locale, TrState>>(() => emptyTranslations());
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const { data } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get<Settings>(API.admin.settings),
  });

  useEffect(() => {
    if (!data) return;
    setPhones(data.phones.length ? data.phones : ['']);
    setEmails(data.emails.length ? data.emails : ['']);
    setLat(data.lat != null ? String(data.lat) : '');
    setLng(data.lng != null ? String(data.lng) : '');
    setFeedbackEnabled(data.feedbackEnabled);
    setHomeNewsCount(data.homeNewsCount);
    const next = emptyTranslations();
    for (const t of data.translations) {
      next[t.locale] = {
        organizationName: t.organizationName,
        address: t.address,
        workingHours: t.workingHours,
        footerText: t.footerText ?? '',
      };
    }
    setTr(next);
  }, [data]);

  const save = useMutation({
    mutationFn: (payload: UpdateSettingsRequest) => api.put<Settings>(API.admin.settings, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e) => {
      if (e instanceof ApiRequestError && e.fields) setErrors(e.fields);
    },
  });

  function onSave() {
    setErrors({});
    save.mutate({
      phones: phones.filter((p) => p.trim()),
      emails: emails.filter((e) => e.trim()),
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      socials: data?.socials ?? [],
      feedbackEnabled,
      homeNewsCount,
      translations: LOCALES.map((l) => ({ locale: l, ...tr[l] })),
    });
  }

  const cur = tr[activeLocale];
  const setCur = (patch: Partial<TrState>) =>
    setTr((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], ...patch } }));

  return (
    <div>
      <PageHeader
        title="Настройки сайта"
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {saved && <span style={{ color: 'var(--green-600)', fontSize: 13 }}>Сохранено ✓</span>}
            <button className="btn btn-primary" onClick={onSave} disabled={save.isPending}>
              Сохранить
            </button>
          </div>
        }
      />

      {errors._ && <div style={errBox}>{errors._[0]}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <div>
          <div style={tabs}>
            {LOCALES.map((l) => (
              <button key={l} onClick={() => setActiveLocale(l)} style={{ ...tab, ...(activeLocale === l ? tabActive : {}) }}>
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div className="field">
              <label>Название организации · {activeLocale.toUpperCase()}</label>
              <input value={cur.organizationName} onChange={(e) => setCur({ organizationName: e.target.value })} />
            </div>
            <div className="field">
              <label>Адрес</label>
              <input value={cur.address} onChange={(e) => setCur({ address: e.target.value })} />
            </div>
            <div className="field">
              <label>Часы работы</label>
              <input value={cur.workingHours} onChange={(e) => setCur({ workingHours: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Текст в подвале сайта</label>
              <textarea value={cur.footerText} onChange={(e) => setCur({ footerText: e.target.value })} style={{ minHeight: 80 }} />
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div className="field">
              <label>Телефоны (по одному в строке)</label>
              {phones.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input
                    value={p}
                    onChange={(e) => setPhones((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
                    style={{ marginBottom: 0 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    title="Удалить телефон"
                    onClick={() => setPhones((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={() => setPhones((p) => [...p, ''])}>
                + Телефон
              </button>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>E-mail (по одному в строке)</label>
              {emails.map((em, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input
                    value={em}
                    onChange={(e) => setEmails((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
                    style={{ marginBottom: 0 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    title="Удалить e-mail"
                    onClick={() => setEmails((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={() => setEmails((e) => [...e, ''])}>
                + E-mail
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div className="field">
              <label>Широта карты (lat)</label>
              <input value={lat} onChange={(e) => setLat(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Долгота карты (lng)</label>
              <input value={lng} onChange={(e) => setLng(e.target.value)} />
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="feedbackEnabled" checked={feedbackEnabled} onChange={(e) => setFeedbackEnabled(e.target.checked)} style={{ width: 'auto' }} />
              <label htmlFor="feedbackEnabled" style={{ margin: 0 }}>Форма обратной связи включена</label>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Новостей на главной (3–5)</label>
              <input type="number" min={3} max={5} value={homeNewsCount} onChange={(e) => setHomeNewsCount(Number(e.target.value))} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function emptyTranslations(): Record<Locale, TrState> {
  return {
    kk: { organizationName: '', address: '', workingHours: '', footerText: '' },
    ru: { organizationName: '', address: '', workingHours: '', footerText: '' },
    en: { organizationName: '', address: '', workingHours: '', footerText: '' },
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
