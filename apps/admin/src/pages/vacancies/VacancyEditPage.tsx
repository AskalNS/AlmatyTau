import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_ROUTES,
  API,
  LOCALES,
  LOCALE_LABELS,
  slugify,
  type Vacancy,
  type UpsertVacancyRequest,
  type Locale,
} from '@atm/contracts';
import { api, ApiRequestError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

type TrState = {
  title: string;
  department: string;
  requirements: string;
  conditions: string;
  responsibilities: string;
  enabled: boolean;
};

/** Редактор вакансии. */
export function VacancyEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [deadline, setDeadline] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [activeLocale, setActiveLocale] = useState<Locale>('ru');
  const [tr, setTr] = useState<Record<Locale, TrState>>(() => emptyTranslations());
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [slugTouched, setSlugTouched] = useState(false);

  const { data } = useQuery({
    queryKey: ['admin-vacancy', id],
    queryFn: () => api.get<Vacancy>(API.admin.vacancy(id!)),
    enabled: !isNew,
  });

  useEffect(() => {
    if (!data) return;
    setSlug(data.slug);
    setStatus(data.status);
    setDeadline(data.deadline ? data.deadline.slice(0, 10) : '');
    setContactEmail(data.contactEmail ?? '');
    setSlugTouched(true);
    const next = emptyTranslations();
    for (const t of data.translations) {
      next[t.locale] = {
        title: t.title,
        department: t.department ?? '',
        requirements: t.requirements ?? '',
        conditions: t.conditions ?? '',
        responsibilities: t.responsibilities ?? '',
        enabled: true,
      };
    }
    setTr(next);
  }, [data]);

  useEffect(() => {
    if (isNew && !slugTouched && tr.ru.title) setSlug(slugify(tr.ru.title));
  }, [tr.ru.title, isNew, slugTouched]);

  const save = useMutation({
    mutationFn: (payload: UpsertVacancyRequest) =>
      isNew ? api.post<Vacancy>(API.admin.vacancies, payload) : api.put<Vacancy>(API.admin.vacancy(id!), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-vacancies'] });
      navigate(ADMIN_ROUTES.vacancies);
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
      department: tr[l].department || null,
      requirements: tr[l].requirements || null,
      conditions: tr[l].conditions || null,
      responsibilities: tr[l].responsibilities || null,
    }));

    if (translations.length === 0) {
      setErrors({ _: ['Заполните хотя бы один язык'] });
      return;
    }

    save.mutate({
      slug,
      status: publish ? 'PUBLISHED' : status,
      deadline: deadline || null,
      contactEmail: contactEmail || null,
      translations,
    } as UpsertVacancyRequest);
  }

  const cur = tr[activeLocale];
  const setCur = (patch: Partial<TrState>) =>
    setTr((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], ...patch, enabled: true } }));

  return (
    <div>
      <PageHeader
        title={isNew ? 'Новая вакансия' : 'Редактирование вакансии'}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="field">
            <label>Название · {activeLocale.toUpperCase()}</label>
            <input value={cur.title} onChange={(e) => setCur({ title: e.target.value })} />
            {errors.title && <div className="error">{errors.title[0]}</div>}
          </div>
          <div className="field">
            <label>Отдел</label>
            <input value={cur.department} onChange={(e) => setCur({ department: e.target.value })} />
          </div>
          <div className="field">
            <label>Обязанности</label>
            <textarea value={cur.responsibilities} onChange={(e) => setCur({ responsibilities: e.target.value })} style={{ minHeight: 100 }} />
          </div>
          <div className="field">
            <label>Требования</label>
            <textarea value={cur.requirements} onChange={(e) => setCur({ requirements: e.target.value })} style={{ minHeight: 100 }} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Условия</label>
            <textarea value={cur.conditions} onChange={(e) => setCur({ conditions: e.target.value })} style={{ minHeight: 100 }} />
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: 20 }}>
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
              <label>Статус</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="DRAFT">Черновик</option>
                <option value="PUBLISHED">Опубликовано</option>
                <option value="ARCHIVED">В архиве</option>
              </select>
            </div>
            <div className="field">
              <label>Приём документов до</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Контактный e-mail</label>
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              {errors.contactEmail && <div className="error">{errors.contactEmail[0]}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function emptyTranslations(): Record<Locale, TrState> {
  return {
    kk: { title: '', department: '', requirements: '', conditions: '', responsibilities: '', enabled: false },
    ru: { title: '', department: '', requirements: '', conditions: '', responsibilities: '', enabled: false },
    en: { title: '', department: '', requirements: '', conditions: '', responsibilities: '', enabled: false },
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
