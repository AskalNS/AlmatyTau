import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_ROUTES,
  API,
  LOCALES,
  LOCALE_LABELS,
  type Document,
  type DocumentCategory,
  type UpsertDocumentRequest,
  type Locale,
  type Media,
} from '@atm/contracts';
import { api, ApiRequestError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

type TrState = { title: string; description: string; enabled: boolean };

/** Редактор документа: файл, категория, языковые вкладки (п. 4.1 ТЗ). */
export function DocumentEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileId, setFileId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [order, setOrder] = useState(0);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('PUBLISHED');
  const [activeLocale, setActiveLocale] = useState<Locale>('ru');
  const [tr, setTr] = useState<Record<Locale, TrState>>(() => emptyTranslations());
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const { data } = useQuery({
    queryKey: ['admin-document', id],
    queryFn: () => api.get<Document>(API.admin.document(id!)),
    enabled: !isNew,
  });
  const { data: categories } = useQuery({
    queryKey: ['admin-document-categories'],
    queryFn: () => api.get<DocumentCategory[]>(API.admin.documentCategories),
  });

  useEffect(() => {
    if (!data) return;
    setFileId(data.fileId);
    setFileName(data.fileName);
    setCategoryId(data.categoryId ?? '');
    setDocumentDate(data.documentDate ? data.documentDate.slice(0, 10) : '');
    setOrder(data.order);
    setStatus(data.status);
    const next = emptyTranslations();
    for (const t of data.translations) {
      next[t.locale] = { title: t.title, description: t.description ?? '', enabled: true };
    }
    setTr(next);
  }, [data]);

  const upload = useMutation({
    mutationFn: (file: File) => api.upload<Media>(API.admin.mediaUpload, file),
    onSuccess: (m) => {
      setFileId(m.id);
      setFileName(m.originalName);
    },
  });

  const save = useMutation({
    mutationFn: (payload: UpsertDocumentRequest) =>
      isNew ? api.post<Document>(API.admin.documents, payload) : api.put<Document>(API.admin.document(id!), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-documents'] });
      navigate(ADMIN_ROUTES.documents);
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
    if (!fileId) {
      setErrors({ _: ['Загрузите файл'] });
      return;
    }

    save.mutate({
      fileId,
      categoryId: categoryId || null,
      documentDate: documentDate || null,
      status,
      order,
      translations,
    } as UpsertDocumentRequest);
  }

  const cur = tr[activeLocale];
  const setCur = (patch: Partial<TrState>) =>
    setTr((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], ...patch, enabled: true } }));

  return (
    <div>
      <PageHeader
        title={isNew ? 'Новый документ' : 'Редактирование документа'}
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
              <label>Файл</label>
              {fileName && (
                <div style={{ fontSize: 13, color: 'var(--s-600)', marginBottom: 8, wordBreak: 'break-all' }}>
                  📄 {fileName}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) upload.mutate(file);
                  e.target.value = '';
                }}
                disabled={upload.isPending}
              />
              {upload.isPending && <div style={{ fontSize: 12, color: 'var(--s-500)', marginTop: 4 }}>Загрузка…</div>}
              {!isNew && (
                <div style={{ fontSize: 12, color: 'var(--s-500)', marginTop: 4 }}>
                  Загрузка нового файла заменит текущий (номер редакции увеличится, ссылка останется прежней).
                </div>
              )}
            </div>
            <div className="field">
              <label>Категория</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">— без категории —</option>
                {categories?.map((c) => {
                  const ru = c.translations.find((t) => t.locale === 'ru') ?? c.translations[0];
                  return (
                    <option key={c.id} value={c.id}>
                      {ru?.title}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="field">
              <label>Дата документа</label>
              <input type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} />
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
