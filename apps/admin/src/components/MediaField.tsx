import { useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { API, type Media } from '@atm/contracts';
import { api } from '@/lib/api';

/**
 * Загрузка и предпросмотр одного медиафайла (обложка, фото персоны, логотип).
 *
 * Загружает файл напрямую в медиабиблиотеку и хранит только id — так же,
 * как блоки BlockEditor'а. Полноценный выбор из уже загруженных файлов
 * делает раздел «Медиабиблиотека»; здесь — быстрый путь «выбрал и готово».
 */
export function MediaField({
  label,
  mediaId,
  onChange,
  accept = 'image/*',
  keepOriginal = false,
}: {
  label: string;
  mediaId: string | null;
  onChange: (id: string | null) => void;
  accept?: string;
  /** Не сжимать и не даунскейлить загруженное фото — см. фото персон. */
  keepOriginal?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: media } = useQuery({
    queryKey: ['media-item', mediaId],
    queryFn: () => api.get<Media>(API.admin.mediaItem(mediaId!)),
    enabled: !!mediaId,
  });

  const upload = useMutation({
    mutationFn: (file: File) => api.upload<Media>(API.admin.mediaUpload, file, keepOriginal ? { keepOriginal: 'true' } : undefined),
    onSuccess: (m) => onChange(m.id),
  });

  return (
    <div className="field">
      <label>{label}</label>
      {media && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {media.kind === 'IMAGE' ? (
            <img src={media.url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--s-200)' }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: 6, background: 'var(--s-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--s-500)' }}>
              {media.kind}
            </div>
          )}
          <div style={{ fontSize: 13, color: 'var(--s-600)', flex: 1 }}>{media.originalName}</div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange(null)}>
            Убрать
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload.mutate(file);
          e.target.value = '';
        }}
        disabled={upload.isPending}
      />
      {upload.isPending && <div style={{ fontSize: 12, color: 'var(--s-500)', marginTop: 4 }}>Загрузка…</div>}
      {upload.isError && <div className="error">Не удалось загрузить файл</div>}
    </div>
  );
}
