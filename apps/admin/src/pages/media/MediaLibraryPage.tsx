import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API, LOCALES, LOCALE_LABELS, type Paginated, type Media, type Locale } from '@atm/contracts';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

/** Медиабиблиотека: загрузка, alt-текст, подписи, источник (п. VI, 5.2 ТЗ). */
export function MediaLibraryPage() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<'' | 'IMAGE' | 'VIDEO' | 'FILE'>('');
  const [selected, setSelected] = useState<Media | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-media', kind],
    queryFn: () => api.get<Paginated<Media>>(`${API.admin.media}?limit=100${kind ? `&kind=${kind}` : ''}`),
  });

  const upload = useMutation({
    mutationFn: (file: File) => api.upload<Media>(API.admin.mediaUpload, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-media'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(API.admin.mediaItem(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-media'] });
      setSelected(null);
    },
  });

  return (
    <div>
      <PageHeader
        title="Медиабиблиотека"
        action={
          <>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload.mutate(file);
                e.target.value = '';
              }}
            />
            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={upload.isPending}>
              {upload.isPending ? 'Загрузка…' : '+ Загрузить'}
            </button>
          </>
        }
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['', 'IMAGE', 'VIDEO', 'FILE'] as const).map((k) => (
          <button
            key={k}
            className={`btn btn-sm ${kind === k ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setKind(k)}
          >
            {k === '' ? 'Все' : k === 'IMAGE' ? 'Фото' : k === 'VIDEO' ? 'Видео' : 'Файлы'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: 24 }}>
        <div
          className="card"
          style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}
        >
          {isLoading && <div style={{ color: 'var(--s-500)' }}>Загрузка…</div>}
          {data?.items.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              style={{
                border: selected?.id === m.id ? '2px solid var(--green-600)' : '1px solid var(--s-200)',
                borderRadius: 8,
                padding: 0,
                overflow: 'hidden',
                background: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {m.kind === 'IMAGE' ? (
                <img src={m.url} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: 100, background: 'var(--s-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--s-500)' }}>
                  {m.kind}
                </div>
              )}
              <div style={{ padding: 6, fontSize: 11, color: 'var(--s-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.originalName}
              </div>
            </button>
          ))}
          {data?.items.length === 0 && <div style={{ color: 'var(--s-500)' }}>Файлов пока нет</div>}
        </div>

        {selected && (
          <MediaDetails
            media={selected}
            onClose={() => setSelected(null)}
            onDeleted={() => remove.mutate(selected.id)}
          />
        )}
      </div>
    </div>
  );
}

function MediaDetails({ media, onClose, onDeleted }: { media: Media; onClose: () => void; onDeleted: () => void }) {
  const qc = useQueryClient();
  const [activeLocale, setActiveLocale] = useState<Locale>('ru');
  const [alt, setAlt] = useState<Record<Locale, string>>(() => ({
    kk: media.alt.kk ?? '',
    ru: media.alt.ru ?? '',
    en: media.alt.en ?? '',
  }));
  const [caption, setCaption] = useState<Record<Locale, string>>(() => ({
    kk: media.caption?.kk ?? '',
    ru: media.caption?.ru ?? '',
    en: media.caption?.en ?? '',
  }));
  const [source, setSource] = useState(media.source ?? '');

  const save = useMutation({
    mutationFn: () =>
      api.patch<Media>(API.admin.mediaItem(media.id), {
        alt: Object.fromEntries(LOCALES.filter((l) => alt[l].trim()).map((l) => [l, alt[l]])),
        caption: Object.fromEntries(LOCALES.filter((l) => caption[l].trim()).map((l) => [l, caption[l]])),
        source: source || null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-media'] }),
  });

  return (
    <div className="card" style={{ padding: 20, alignSelf: 'start' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <strong style={{ fontSize: 14 }}>Свойства файла</strong>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
      </div>

      {media.kind === 'IMAGE' && (
        <img src={media.url} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 12 }} />
      )}
      <div style={{ fontSize: 12, color: 'var(--s-500)', marginBottom: 12, wordBreak: 'break-all' }}>
        {media.originalName} · {(media.size / 1024).toFixed(0)} КБ
        {media.width && media.height ? ` · ${media.width}×${media.height}` : ''}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {LOCALES.map((l) => (
          <button
            key={l}
            className={`btn btn-sm ${activeLocale === l ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveLocale(l)}
          >
            {LOCALE_LABELS[l]}
          </button>
        ))}
      </div>

      <div className="field">
        <label>Alt-текст · {activeLocale.toUpperCase()} (для слабовидящих, п. VI ТЗ)</label>
        <input value={alt[activeLocale]} onChange={(e) => setAlt((p) => ({ ...p, [activeLocale]: e.target.value }))} />
      </div>
      <div className="field">
        <label>Подпись</label>
        <input value={caption[activeLocale]} onChange={(e) => setCaption((p) => ({ ...p, [activeLocale]: e.target.value }))} />
      </div>
      <div className="field">
        <label>Источник / автор</label>
        <input value={source} onChange={(e) => setSource(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>
          Сохранить
        </button>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (confirm('Удалить файл из библиотеки?')) onDeleted();
          }}
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
