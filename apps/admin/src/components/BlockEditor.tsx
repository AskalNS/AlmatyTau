import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  API,
  BLOCK_LABELS,
  BLOCK_ORDER,
  BLOCK_ICONS,
  BLOCK_ICON_LABELS,
  ZONE_KINDS,
  DONUT_COLORS,
  emptyBlock,
  type Block,
  type Blocks,
  type BlockType,
  type BlockIcon,
  type Media,
  type Document,
  type Paginated,
} from '@atm/contracts';
import { api } from '@/lib/api';
import { MediaField } from './MediaField';

const ZONE_KIND_LABELS: Record<(typeof ZONE_KINDS)[number], string> = {
  premium: 'Премиум',
  mass: 'Массовая',
  hybrid: 'Гибридная',
  sport: 'Спортивная',
  family: 'Семейная',
};

const DONUT_COLOR_LABELS: Record<(typeof DONUT_COLORS)[number], string> = {
  green: 'Зелёный',
  blue: 'Синий',
  red: 'Красный',
  black: 'Чёрный',
  gold: 'Золотой',
  brand: 'Фирменный',
};

/** Кнопки ↑ ↓ ✕ для одного элемента произвольного массива — переместить/удалить сам себя. */
function ItemControls<T>({ items, i, onChange }: { items: T[]; i: number; onChange: (items: T[]) => void }) {
  return (
    <>
      <button
        type="button"
        style={iconBtn}
        title="Вверх"
        disabled={i === 0}
        onClick={() => {
          const next = [...items];
          [next[i - 1], next[i]] = [next[i], next[i - 1]];
          onChange(next);
        }}
      >
        ↑
      </button>
      <button
        type="button"
        style={iconBtn}
        title="Вниз"
        disabled={i === items.length - 1}
        onClick={() => {
          const next = [...items];
          [next[i], next[i + 1]] = [next[i + 1], next[i]];
          onChange(next);
        }}
      >
        ↓
      </button>
      <button
        type="button"
        style={{ ...iconBtn, color: 'var(--red)' }}
        title="Удалить"
        onClick={() => onChange(items.filter((_, idx) => idx !== i))}
      >
        ✕
      </button>
    </>
  );
}

/**
 * Блочный редактор (п. IV ТЗ).
 *
 * Редактор оперирует блоками из библиотеки @atm/contracts, а не произвольным
 * HTML — это и защита от XSS (п. X.III), и гарантия, что вёрстку не сломать.
 * Блоки-медиа (фото, галерея, видео) выбираются прямо здесь из уже
 * загруженных файлов или загружаются на месте — п. VI ТЗ («размещать
 * фотографии... прямо на панели»).
 */
export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: Blocks;
  onChange: (blocks: Blocks) => void;
}) {
  const [adding, setAdding] = useState(false);

  const add = (type: BlockType) => {
    const id = `b${Date.now()}${Math.floor(performance.now())}`;
    onChange([...blocks, emptyBlock(type, id)]);
    setAdding(false);
  };
  const update = (i: number, block: Block) => {
    const next = [...blocks];
    next[i] = block;
    onChange(next);
  };
  const remove = (i: number) => onChange(blocks.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      {blocks.map((block, i) => (
        <div key={block.id} style={row}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={badge}>{BLOCK_LABELS[block.type]}</span>
            <span style={{ flex: 1 }} />
            <button style={iconBtn} onClick={() => move(i, -1)} title="Вверх" disabled={i === 0}>↑</button>
            <button style={iconBtn} onClick={() => move(i, 1)} title="Вниз" disabled={i === blocks.length - 1}>↓</button>
            <button style={{ ...iconBtn, color: 'var(--red)' }} onClick={() => remove(i)} title="Удалить">✕</button>
          </div>
          <BlockFields block={block} onChange={(b) => update(i, b)} />
        </div>
      ))}

      {adding ? (
        <div style={picker}>
          {BLOCK_ORDER.map((type) => (
            <button key={type} style={pickerItem} onClick={() => add(type)}>
              {BLOCK_LABELS[type]}
            </button>
          ))}
          <button style={{ ...pickerItem, color: 'var(--s-500)' }} onClick={() => setAdding(false)}>
            Отмена
          </button>
        </div>
      ) : (
        <button style={addBtn} onClick={() => setAdding(true)}>
          + Добавить блок
        </button>
      )}
    </div>
  );
}

/** Выбор нескольких фото из библиотеки — для блока «Галерея». */
function GalleryPicker({ mediaIds, onChange }: { mediaIds: string[]; onChange: (ids: string[]) => void }) {
  const { data: library } = useQuery({
    queryKey: ['admin-media', 'IMAGE'],
    queryFn: () => api.get<Paginated<Media>>(`${API.admin.media}?limit=100&kind=IMAGE`),
  });

  function toggle(id: string) {
    onChange(mediaIds.includes(id) ? mediaIds.filter((x) => x !== id) : [...mediaIds, id]);
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--s-500)', marginBottom: 8 }}>
        Выбрано: {mediaIds.length}. Загрузить новое фото — в разделе «Медиабиблиотека».
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 6 }}>
        {library?.items.map((m) => {
          const on = mediaIds.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              title={m.originalName}
              style={{
                position: 'relative',
                border: on ? '2px solid var(--green-600)' : '1px solid var(--s-200)',
                borderRadius: 6,
                padding: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#fff',
              }}
            >
              <img src={m.url} alt="" style={{ width: '100%', height: 64, objectFit: 'cover', display: 'block', opacity: on ? 1 : 0.5 }} />
              {on && (
                <span style={{ position: 'absolute', top: 2, right: 2, background: 'var(--green-600)', color: '#fff', borderRadius: 999, width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Выбор нескольких документов из библиотеки — для блока «Документы». */
function DocumentPicker({ documentIds, onChange }: { documentIds: string[]; onChange: (ids: string[]) => void }) {
  const { data: library } = useQuery({
    queryKey: ['admin-documents'],
    queryFn: () => api.get<Paginated<Document>>(`${API.admin.documents}?limit=100`),
  });

  function toggle(id: string) {
    onChange(documentIds.includes(id) ? documentIds.filter((x) => x !== id) : [...documentIds, id]);
  }

  function titleOf(d: Document) {
    return d.translations.find((t) => t.locale === 'ru')?.title ?? d.translations[0]?.title ?? d.fileName;
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--s-500)', marginBottom: 8 }}>
        Выбрано: {documentIds.length}. Загрузить новый документ — в разделе «Документы».
      </div>
      <div>
        {library?.items.map((d) => {
          const on = documentIds.includes(d.id);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => toggle(d.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                textAlign: 'left',
                border: on ? '1px solid var(--green-600)' : '1px solid var(--s-200)',
                borderRadius: 6,
                padding: '6px 10px',
                marginBottom: 4,
                cursor: 'pointer',
                background: on ? 'var(--green-50)' : '#fff',
                fontSize: 13,
              }}
            >
              <span style={{ flex: 1 }}>{titleOf(d)}</span>
              {on && <span style={{ color: 'var(--green-600)' }}>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Базовые поля для правки блока. Медиа-блоки — выбор/загрузка из библиотеки. */
function BlockFields({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  switch (block.type) {
    case 'text':
      return (
        <textarea
          style={ta}
          value={block.html}
          placeholder="Текст (поддерживается простая разметка)"
          onChange={(e) => onChange({ ...block, html: e.target.value })}
        />
      );
    case 'heading':
      return (
        <input
          style={inp}
          value={block.text}
          placeholder="Заголовок"
          onChange={(e) => onChange({ ...block, text: e.target.value })}
        />
      );
    case 'quote':
      return (
        <>
          <textarea style={ta} value={block.text} placeholder="Текст цитаты" onChange={(e) => onChange({ ...block, text: e.target.value })} />
          <input style={inp} value={block.author ?? ''} placeholder="Автор" onChange={(e) => onChange({ ...block, author: e.target.value })} />
        </>
      );
    case 'image':
      return (
        <div style={mediaBox}>
          <MediaField
            label="Фото"
            mediaId={block.mediaId || null}
            onChange={(id) => onChange({ ...block, mediaId: id ?? '' })}
          />
          <input
            style={inp}
            value={block.caption ?? ''}
            placeholder="Подпись под фото (необязательно)"
            onChange={(e) => onChange({ ...block, caption: e.target.value || null })}
          />
        </div>
      );
    case 'gallery':
      return (
        <div style={mediaBox}>
          <GalleryPicker mediaIds={block.mediaIds} onChange={(ids) => onChange({ ...block, mediaIds: ids })} />
        </div>
      );
    case 'video':
      return (
        <div style={mediaBox}>
          <MediaField
            label="Видеофайл"
            mediaId={block.mediaId ?? null}
            onChange={(id) => onChange({ ...block, mediaId: id })}
            accept="video/*"
          />
          <MediaField
            label="Постер (кадр до загрузки видео)"
            mediaId={block.posterId ?? null}
            onChange={(id) => onChange({ ...block, posterId: id })}
          />
          <input
            style={inp}
            value={block.caption ?? ''}
            placeholder="Подпись (необязательно)"
            onChange={(e) => onChange({ ...block, caption: e.target.value || null })}
          />
        </div>
      );
    case 'stats':
      return (
        <div>
          {block.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
              <input
                style={{ ...inp, flex: '0 0 120px', marginBottom: 0 }}
                value={item.value}
                placeholder="000"
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...item, value: e.target.value };
                  onChange({ ...block, items });
                }}
              />
              <input
                style={{ ...inp, marginBottom: 0 }}
                value={item.label}
                placeholder="Подпись показателя"
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...item, label: e.target.value };
                  onChange({ ...block, items });
                }}
              />
              <ItemControls items={block.items} i={i} onChange={(items) => onChange({ ...block, items })} />
            </div>
          ))}
          <button
            style={smallBtn}
            onClick={() => onChange({ ...block, items: [...block.items, { value: '', label: '', suffix: null }] })}
          >
            + Показатель
          </button>
        </div>
      );
    case 'file':
      return (
        <div style={mediaBox}>
          <input
            style={inp}
            value={block.title ?? ''}
            placeholder="Заголовок списка документов (необязательно)"
            onChange={(e) => onChange({ ...block, title: e.target.value || null })}
          />
          <DocumentPicker documentIds={block.documentIds} onChange={(ids) => onChange({ ...block, documentIds: ids })} />
        </div>
      );
    case 'map':
      return (
        <div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              style={{ ...inp, flex: '0 0 160px' }}
              value={block.provider}
              onChange={(e) => onChange({ ...block, provider: e.target.value as typeof block.provider })}
            >
              <option value="2gis">2GIS</option>
              <option value="yandex">Яндекс.Карты</option>
              <option value="google">Google Maps</option>
            </select>
            <input
              style={{ ...inp, flex: '0 0 100px' }}
              type="number"
              value={block.zoom}
              placeholder="Масштаб"
              onChange={(e) => onChange({ ...block, zoom: Number(e.target.value) })}
            />
            <input
              style={{ ...inp, flex: '0 0 120px' }}
              type="number"
              value={block.height}
              placeholder="Высота, px"
              onChange={(e) => onChange({ ...block, height: Number(e.target.value) })}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={inp}
              type="number"
              step="0.000001"
              value={block.lat}
              placeholder="Широта"
              onChange={(e) => onChange({ ...block, lat: Number(e.target.value) })}
            />
            <input
              style={inp}
              type="number"
              step="0.000001"
              value={block.lng}
              placeholder="Долгота"
              onChange={(e) => onChange({ ...block, lng: Number(e.target.value) })}
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--s-500)', margin: '8px 0 4px' }}>Метки на карте</div>
          {block.markers.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
              <input
                style={{ ...inp, flex: '0 0 110px', marginBottom: 0 }}
                type="number"
                step="0.000001"
                value={m.lat}
                placeholder="Широта"
                onChange={(e) => {
                  const markers = [...block.markers];
                  markers[i] = { ...m, lat: Number(e.target.value) };
                  onChange({ ...block, markers });
                }}
              />
              <input
                style={{ ...inp, flex: '0 0 110px', marginBottom: 0 }}
                type="number"
                step="0.000001"
                value={m.lng}
                placeholder="Долгота"
                onChange={(e) => {
                  const markers = [...block.markers];
                  markers[i] = { ...m, lng: Number(e.target.value) };
                  onChange({ ...block, markers });
                }}
              />
              <input
                style={{ ...inp, marginBottom: 0 }}
                value={m.title}
                placeholder="Подпись метки"
                onChange={(e) => {
                  const markers = [...block.markers];
                  markers[i] = { ...m, title: e.target.value };
                  onChange({ ...block, markers });
                }}
              />
              <ItemControls items={block.markers} i={i} onChange={(markers) => onChange({ ...block, markers })} />
            </div>
          ))}
          <button
            style={smallBtn}
            onClick={() => onChange({ ...block, markers: [...block.markers, { lat: block.lat, lng: block.lng, title: '' }] })}
          >
            + Метка
          </button>
        </div>
      );
    case 'accordion':
      return (
        <div>
          {block.items.map((item, i) => (
            <div key={i} style={subRow}>
              <div style={subHeader}>
                <span style={{ flex: 1 }} />
                <ItemControls items={block.items} i={i} onChange={(items) => onChange({ ...block, items })} />
              </div>
              <input
                style={inp}
                value={item.title}
                placeholder="Заголовок пункта"
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...item, title: e.target.value };
                  onChange({ ...block, items });
                }}
              />
              <textarea
                style={ta}
                value={item.html}
                placeholder="Текст"
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...item, html: e.target.value };
                  onChange({ ...block, items });
                }}
              />
            </div>
          ))}
          <button style={smallBtn} onClick={() => onChange({ ...block, items: [...block.items, { title: '', html: '' }] })}>
            + Пункт
          </button>
        </div>
      );
    case 'cta':
      return (
        <div style={mediaBox}>
          <input style={inp} value={block.title} placeholder="Заголовок" onChange={(e) => onChange({ ...block, title: e.target.value })} />
          <textarea
            style={ta}
            value={block.text ?? ''}
            placeholder="Текст (необязательно)"
            onChange={(e) => onChange({ ...block, text: e.target.value || null })}
          />
          <input
            style={inp}
            value={block.buttonLabel}
            placeholder="Текст кнопки"
            onChange={(e) => onChange({ ...block, buttonLabel: e.target.value })}
          />
          <input
            style={inp}
            value={block.buttonHref}
            placeholder="Ссылка кнопки"
            onChange={(e) => onChange({ ...block, buttonHref: e.target.value })}
          />
          <MediaField label="Фон (необязательно)" mediaId={block.mediaId ?? null} onChange={(id) => onChange({ ...block, mediaId: id })} />
        </div>
      );
    case 'timeline':
      return (
        <div>
          {block.items.map((item, i) => (
            <div key={i} style={subRow}>
              <div style={subHeader}>
                <span style={{ flex: 1 }} />
                <ItemControls items={block.items} i={i} onChange={(items) => onChange({ ...block, items })} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inp, flex: '0 0 140px' }}
                  value={item.period}
                  placeholder="Период"
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...item, period: e.target.value };
                    onChange({ ...block, items });
                  }}
                />
                <input
                  style={inp}
                  value={item.title}
                  placeholder="Заголовок этапа"
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...item, title: e.target.value };
                    onChange({ ...block, items });
                  }}
                />
              </div>
              <textarea
                style={ta}
                value={item.text ?? ''}
                placeholder="Описание (необязательно)"
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...item, text: e.target.value || null };
                  onChange({ ...block, items });
                }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={item.done}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...item, done: e.target.checked };
                    onChange({ ...block, items });
                  }}
                />
                Этап завершён
              </label>
            </div>
          ))}
          <button
            style={smallBtn}
            onClick={() => onChange({ ...block, items: [...block.items, { period: '', title: '', text: null, done: false }] })}
          >
            + Этап
          </button>
        </div>
      );
    case 'embed':
      return (
        <div style={mediaBox}>
          <select
            style={inp}
            value={block.provider}
            onChange={(e) => onChange({ ...block, provider: e.target.value as typeof block.provider })}
          >
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
            <option value="yandex-map">Яндекс.Карта</option>
            <option value="2gis-map">2GIS</option>
          </select>
          <input
            style={inp}
            value={block.externalId}
            placeholder="ID видео или карты"
            onChange={(e) => onChange({ ...block, externalId: e.target.value })}
          />
          <input
            style={inp}
            value={block.title ?? ''}
            placeholder="Заголовок (необязательно)"
            onChange={(e) => onChange({ ...block, title: e.target.value || null })}
          />
          <select style={{ ...inp, marginBottom: 0 }} value={block.ratio} onChange={(e) => onChange({ ...block, ratio: e.target.value as typeof block.ratio })}>
            <option value="16:9">16:9</option>
            <option value="4:3">4:3</option>
            <option value="1:1">1:1</option>
          </select>
        </div>
      );
    case 'cards':
      return (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input
                type="checkbox"
                style={{ width: 'auto' }}
                checked={block.numbered}
                onChange={(e) => onChange({ ...block, numbered: e.target.checked })}
              />
              Нумеровать карточки
            </label>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              Колонок:
              <select
                style={{ ...inp, width: 70, marginBottom: 0 }}
                value={block.columns}
                onChange={(e) => onChange({ ...block, columns: Number(e.target.value) as 2 | 3 | 4 })}
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </label>
          </div>
          {block.items.map((item, i) => (
            <div key={i} style={subRow}>
              <div style={subHeader}>
                <span style={{ flex: 1 }} />
                <ItemControls items={block.items} i={i} onChange={(items) => onChange({ ...block, items })} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  style={{ ...inp, flex: '0 0 170px' }}
                  value={item.icon}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...item, icon: e.target.value as BlockIcon };
                    onChange({ ...block, items });
                  }}
                >
                  {BLOCK_ICONS.map((ic) => (
                    <option key={ic} value={ic}>
                      {BLOCK_ICON_LABELS[ic]}
                    </option>
                  ))}
                </select>
                <input
                  style={inp}
                  value={item.title}
                  placeholder="Заголовок"
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...item, title: e.target.value };
                    onChange({ ...block, items });
                  }}
                />
              </div>
              <textarea
                style={ta}
                value={item.text ?? ''}
                placeholder="Текст (необязательно)"
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...item, text: e.target.value || null };
                  onChange({ ...block, items });
                }}
              />
            </div>
          ))}
          <button
            style={smallBtn}
            onClick={() => onChange({ ...block, items: [...block.items, { icon: 'dot', title: '', text: null }] })}
          >
            + Карточка
          </button>
        </div>
      );
    case 'sections':
      return (
        <div>
          {block.items.map((item, i) => (
            <div key={i} style={subRow}>
              <div style={subHeader}>
                <span style={{ flex: 1 }} />
                <ItemControls items={block.items} i={i} onChange={(items) => onChange({ ...block, items })} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inp, flex: '0 0 160px' }}
                  value={item.anchor}
                  placeholder="Якорь (латиница, дефисы)"
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...item, anchor: e.target.value };
                    onChange({ ...block, items });
                  }}
                />
                <select
                  style={{ ...inp, flex: '0 0 170px' }}
                  value={item.icon}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...item, icon: e.target.value as BlockIcon };
                    onChange({ ...block, items });
                  }}
                >
                  {BLOCK_ICONS.map((ic) => (
                    <option key={ic} value={ic}>
                      {BLOCK_ICON_LABELS[ic]}
                    </option>
                  ))}
                </select>
                <input
                  style={inp}
                  value={item.title}
                  placeholder="Заголовок подраздела"
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...item, title: e.target.value };
                    onChange({ ...block, items });
                  }}
                />
              </div>
              <textarea
                style={ta}
                value={item.html}
                placeholder="Текст подраздела"
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...item, html: e.target.value };
                  onChange({ ...block, items });
                }}
              />
              <MediaField
                label="Иллюстрация (необязательно)"
                mediaId={item.mediaId ?? null}
                onChange={(id) => {
                  const items = [...block.items];
                  items[i] = { ...item, mediaId: id };
                  onChange({ ...block, items });
                }}
              />
            </div>
          ))}
          <button
            style={smallBtn}
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { anchor: `razdel-${block.items.length + 1}`, icon: 'dot', title: '', html: '', mediaId: null }],
              })
            }
          >
            + Подраздел
          </button>
        </div>
      );
    case 'compare':
      return (
        <div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={inp}
              value={block.fromLabel}
              placeholder="Подпись «сейчас»"
              onChange={(e) => onChange({ ...block, fromLabel: e.target.value })}
            />
            <input
              style={inp}
              value={block.toLabel}
              placeholder="Подпись «после»"
              onChange={(e) => onChange({ ...block, toLabel: e.target.value })}
            />
          </div>
          {block.items.map((item, i) => (
            <div key={i} style={subRow}>
              <div style={subHeader}>
                <span style={{ flex: 1 }} />
                <ItemControls items={block.items} i={i} onChange={(items) => onChange({ ...block, items })} />
              </div>
              <input
                style={inp}
                value={item.label}
                placeholder="Показатель"
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...item, label: e.target.value };
                  onChange({ ...block, items });
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={inp}
                  value={item.from}
                  placeholder="Сейчас"
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...item, from: e.target.value };
                    onChange({ ...block, items });
                  }}
                />
                <input
                  style={inp}
                  value={item.to}
                  placeholder="После"
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...item, to: e.target.value };
                    onChange({ ...block, items });
                  }}
                />
                <input
                  style={{ ...inp, flex: '0 0 100px' }}
                  value={item.suffix ?? ''}
                  placeholder="Приписка"
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...item, suffix: e.target.value || null };
                    onChange({ ...block, items });
                  }}
                />
              </div>
            </div>
          ))}
          <button
            style={smallBtn}
            onClick={() => onChange({ ...block, items: [...block.items, { label: '', from: '', to: '', suffix: null }] })}
          >
            + Показатель
          </button>
        </div>
      );
    case 'zones':
      return (
        <div>
          {block.items.map((item, i) => (
            <div key={i} style={subRow}>
              <div style={subHeader}>
                <strong style={{ fontSize: 13 }}>{item.name || `Зона ${i + 1}`}</strong>
                <span style={{ flex: 1 }} />
                <ItemControls items={block.items} i={i} onChange={(items) => onChange({ ...block, items })} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={inp}
                  value={item.name}
                  placeholder="Название зоны"
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...item, name: e.target.value };
                    onChange({ ...block, items });
                  }}
                />
                <select
                  style={{ ...inp, flex: '0 0 160px' }}
                  value={item.kind}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...item, kind: e.target.value as typeof item.kind };
                    onChange({ ...block, items });
                  }}
                >
                  {ZONE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {ZONE_KIND_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <input
                style={inp}
                value={item.role}
                placeholder="Роль зоны в системе"
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...item, role: e.target.value };
                  onChange({ ...block, items });
                }}
              />
              <textarea
                style={ta}
                value={item.text}
                placeholder="Описание зоны"
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...item, text: e.target.value };
                  onChange({ ...block, items });
                }}
              />

              <div style={subLabel}>Показатели зоны</div>
              {item.stats.map((st, j) => (
                <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                  <input
                    style={{ ...inp, flex: '0 0 100px', marginBottom: 0 }}
                    value={st.value}
                    placeholder="000"
                    onChange={(e) => {
                      const items = [...block.items];
                      const stats = [...item.stats];
                      stats[j] = { ...st, value: e.target.value };
                      items[i] = { ...item, stats };
                      onChange({ ...block, items });
                    }}
                  />
                  <input
                    style={{ ...inp, marginBottom: 0 }}
                    value={st.label}
                    placeholder="Подпись"
                    onChange={(e) => {
                      const items = [...block.items];
                      const stats = [...item.stats];
                      stats[j] = { ...st, label: e.target.value };
                      items[i] = { ...item, stats };
                      onChange({ ...block, items });
                    }}
                  />
                  <button
                    type="button"
                    style={{ ...iconBtn, color: 'var(--red)' }}
                    title="Удалить показатель"
                    onClick={() => {
                      const items = [...block.items];
                      items[i] = { ...item, stats: item.stats.filter((_, idx) => idx !== j) };
                      onChange({ ...block, items });
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {item.stats.length < 4 && (
                <button
                  style={smallBtn}
                  onClick={() => {
                    const items = [...block.items];
                    items[i] = { ...item, stats: [...item.stats, { value: '', label: '' }] };
                    onChange({ ...block, items });
                  }}
                >
                  + Показатель зоны
                </button>
              )}

              <div style={subLabel}>Ключевые объекты</div>
              {item.features.map((f, j) => (
                <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input
                    style={{ ...inp, marginBottom: 0 }}
                    value={f}
                    placeholder="Объект"
                    onChange={(e) => {
                      const items = [...block.items];
                      const features = [...item.features];
                      features[j] = e.target.value;
                      items[i] = { ...item, features };
                      onChange({ ...block, items });
                    }}
                  />
                  <button
                    type="button"
                    style={{ ...iconBtn, color: 'var(--red)' }}
                    title="Удалить объект"
                    onClick={() => {
                      const items = [...block.items];
                      items[i] = { ...item, features: item.features.filter((_, idx) => idx !== j) };
                      onChange({ ...block, items });
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {item.features.length < 12 && (
                <button
                  style={smallBtn}
                  onClick={() => {
                    const items = [...block.items];
                    items[i] = { ...item, features: [...item.features, ''] };
                    onChange({ ...block, items });
                  }}
                >
                  + Объект
                </button>
              )}

              <div style={{ ...mediaBox, marginTop: 12 }}>
                <MediaField
                  label="План трасс зоны"
                  mediaId={item.mediaId ?? null}
                  onChange={(id) => {
                    const items = [...block.items];
                    items[i] = { ...item, mediaId: id };
                    onChange({ ...block, items });
                  }}
                />
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--s-500)', marginBottom: 6 }}>Визуализации зоны</div>
                  <GalleryPicker
                    mediaIds={item.shotIds}
                    onChange={(ids) => {
                      const items = [...block.items];
                      items[i] = { ...item, shotIds: ids };
                      onChange({ ...block, items });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            style={smallBtn}
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { name: '', kind: 'mass', role: '', text: '', stats: [], features: [], mediaId: null, shotIds: [] }],
              })
            }
          >
            + Зона
          </button>
        </div>
      );
    case 'orgchart':
      return (
        <div>
          {block.nodes.map((node, i) => (
            <div key={i} style={subRow}>
              <div style={subHeader}>
                <span style={{ flex: 1 }} />
                <ItemControls items={block.nodes} i={i} onChange={(nodes) => onChange({ ...block, nodes })} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inp, flex: '0 0 120px' }}
                  value={node.id}
                  placeholder="ID узла"
                  onChange={(e) => {
                    const nodes = [...block.nodes];
                    nodes[i] = { ...node, id: e.target.value };
                    onChange({ ...block, nodes });
                  }}
                />
                <select
                  style={inp}
                  value={node.parentId ?? ''}
                  onChange={(e) => {
                    const nodes = [...block.nodes];
                    nodes[i] = { ...node, parentId: e.target.value || null };
                    onChange({ ...block, nodes });
                  }}
                >
                  <option value="">— без родителя —</option>
                  {block.nodes
                    .filter((n) => n.id !== node.id)
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title || n.id}
                      </option>
                    ))}
                </select>
              </div>
              <input
                style={inp}
                value={node.title}
                placeholder="Название"
                onChange={(e) => {
                  const nodes = [...block.nodes];
                  nodes[i] = { ...node, title: e.target.value };
                  onChange({ ...block, nodes });
                }}
              />
              <input
                style={inp}
                value={node.subtitle ?? ''}
                placeholder="Подпись (необязательно)"
                onChange={(e) => {
                  const nodes = [...block.nodes];
                  nodes[i] = { ...node, subtitle: e.target.value || null };
                  onChange({ ...block, nodes });
                }}
              />
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    checked={node.accent}
                    onChange={(e) => {
                      const nodes = [...block.nodes];
                      nodes[i] = { ...node, accent: e.target.checked };
                      onChange({ ...block, nodes });
                    }}
                  />
                  Выделить уровень
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    checked={node.stack}
                    onChange={(e) => {
                      const nodes = [...block.nodes];
                      nodes[i] = { ...node, stack: e.target.checked };
                      onChange({ ...block, nodes });
                    }}
                  />
                  Подчинённые колонкой
                </label>
              </div>
            </div>
          ))}
          <button
            style={smallBtn}
            onClick={() =>
              onChange({
                ...block,
                nodes: [...block.nodes, { id: `n${block.nodes.length + 1}`, parentId: null, title: '', subtitle: null, accent: false, stack: false }],
              })
            }
          >
            + Узел
          </button>
        </div>
      );
    case 'flow':
      return (
        <div>
          <input
            style={inp}
            value={block.title ?? ''}
            placeholder="Заголовок (необязательно)"
            onChange={(e) => onChange({ ...block, title: e.target.value || null })}
          />
          {block.steps.map((step, i) => (
            <div key={i} style={subRow}>
              <div style={subHeader}>
                <span style={{ flex: 1 }} />
                <ItemControls items={block.steps} i={i} onChange={(steps) => onChange({ ...block, steps })} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  style={{ ...inp, flex: '0 0 170px' }}
                  value={step.icon}
                  onChange={(e) => {
                    const steps = [...block.steps];
                    steps[i] = { ...step, icon: e.target.value as BlockIcon };
                    onChange({ ...block, steps });
                  }}
                >
                  {BLOCK_ICONS.map((ic) => (
                    <option key={ic} value={ic}>
                      {BLOCK_ICON_LABELS[ic]}
                    </option>
                  ))}
                </select>
                <input
                  style={inp}
                  value={step.title}
                  placeholder="Заголовок шага"
                  onChange={(e) => {
                    const steps = [...block.steps];
                    steps[i] = { ...step, title: e.target.value };
                    onChange({ ...block, steps });
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={inp}
                  value={step.text ?? ''}
                  placeholder="Текст (необязательно)"
                  onChange={(e) => {
                    const steps = [...block.steps];
                    steps[i] = { ...step, text: e.target.value || null };
                    onChange({ ...block, steps });
                  }}
                />
                <input
                  style={{ ...inp, flex: '0 0 120px' }}
                  value={step.note ?? ''}
                  placeholder="Приписка"
                  onChange={(e) => {
                    const steps = [...block.steps];
                    steps[i] = { ...step, note: e.target.value || null };
                    onChange({ ...block, steps });
                  }}
                />
              </div>
            </div>
          ))}
          <button
            style={smallBtn}
            onClick={() => onChange({ ...block, steps: [...block.steps, { icon: 'dot', title: '', text: null, note: null }] })}
          >
            + Шаг
          </button>
        </div>
      );
    case 'donut':
      return (
        <div>
          <input
            style={inp}
            value={block.title ?? ''}
            placeholder="Заголовок (необязательно)"
            onChange={(e) => onChange({ ...block, title: e.target.value || null })}
          />
          <input
            style={inp}
            value={block.caption ?? ''}
            placeholder="Подпись под диаграммой (необязательно)"
            onChange={(e) => onChange({ ...block, caption: e.target.value || null })}
          />
          {block.segments.map((seg, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
              <input
                style={{ ...inp, marginBottom: 0 }}
                value={seg.label}
                placeholder="Подпись сегмента"
                onChange={(e) => {
                  const segments = [...block.segments];
                  segments[i] = { ...seg, label: e.target.value };
                  onChange({ ...block, segments });
                }}
              />
              <input
                style={{ ...inp, flex: '0 0 90px', marginBottom: 0 }}
                type="number"
                min={0}
                max={100}
                value={seg.percent}
                placeholder="%"
                onChange={(e) => {
                  const segments = [...block.segments];
                  segments[i] = { ...seg, percent: Number(e.target.value) };
                  onChange({ ...block, segments });
                }}
              />
              <select
                style={{ ...inp, flex: '0 0 130px', marginBottom: 0 }}
                value={seg.color}
                onChange={(e) => {
                  const segments = [...block.segments];
                  segments[i] = { ...seg, color: e.target.value as typeof seg.color };
                  onChange({ ...block, segments });
                }}
              >
                {DONUT_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {DONUT_COLOR_LABELS[c]}
                  </option>
                ))}
              </select>
              <ItemControls items={block.segments} i={i} onChange={(segments) => onChange({ ...block, segments })} />
            </div>
          ))}
          <button
            style={smallBtn}
            onClick={() => onChange({ ...block, segments: [...block.segments, { label: '', note: null, percent: 0, color: 'green' }] })}
          >
            + Сегмент
          </button>
        </div>
      );
  }
}

const row: React.CSSProperties = { border: '1px solid var(--s-200)', borderRadius: 8, padding: 12, marginBottom: 8, background: 'var(--s-50)' };
const badge: React.CSSProperties = { fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 999, background: 'var(--green-50)', color: 'var(--green-700)' };
const iconBtn: React.CSSProperties = { border: '1px solid var(--s-200)', background: '#fff', borderRadius: 4, width: 28, height: 28, cursor: 'pointer', color: 'var(--s-600)' };
const addBtn: React.CSSProperties = { width: '100%', padding: 12, border: '1px dashed var(--s-300)', background: '#fff', borderRadius: 8, cursor: 'pointer', color: 'var(--s-600)', fontWeight: 600 };
const picker: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 6, padding: 12, border: '1px solid var(--s-200)', borderRadius: 8 };
const pickerItem: React.CSSProperties = { padding: '7px 14px', border: '1px solid var(--s-200)', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 13 };
const inp: React.CSSProperties = { width: '100%', font: 'inherit', fontSize: 14, padding: '8px 10px', border: '1px solid var(--s-300)', borderRadius: 6, marginBottom: 6 };
const ta: React.CSSProperties = { ...inp, minHeight: 80, resize: 'vertical' };
const mediaBox: React.CSSProperties = { background: '#fff', borderRadius: 6, padding: 10, border: '1px solid var(--s-200)' };
const smallBtn: React.CSSProperties = { ...pickerItem, fontSize: 12 };
const subRow: React.CSSProperties = { background: '#fff', border: '1px solid var(--s-200)', borderRadius: 6, padding: 10, marginBottom: 8 };
const subHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 };
const subLabel: React.CSSProperties = { fontSize: 12, color: 'var(--s-500)', margin: '8px 0 4px' };
