import { useState } from 'react';
import {
  BLOCK_LABELS,
  BLOCK_ORDER,
  emptyBlock,
  type Block,
  type Blocks,
  type BlockType,
} from '@atm/contracts';

/**
 * Блочный редактор (п. IV ТЗ).
 *
 * Редактор оперирует блоками из библиотеки @atm/contracts, а не произвольным
 * HTML — это и защита от XSS (п. X.III), и гарантия, что вёрстку не сломать.
 * Полноценные редакторы для каждого типа блока (TipTap для текста, выбор из
 * медиабиблиотеки для картинок) подключаются по этому же каркасу; здесь —
 * добавление, удаление, перестановка и правка базовых полей.
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

/** Базовые поля для правки блока. Медиа-блоки показывают выбор из библиотеки. */
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
    case 'gallery':
    case 'video':
      return (
        <div style={mediaHint}>
          Выбор из медиабиблиотеки. Идентификаторы файлов сохраняются в блок;
          alt задаётся при загрузке в медиабиблиотеке (п. VI ТЗ).
        </div>
      );
    case 'stats':
      return (
        <div>
          {block.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input
                style={{ ...inp, flex: '0 0 120px' }}
                value={item.value}
                placeholder="000"
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...item, value: e.target.value };
                  onChange({ ...block, items });
                }}
              />
              <input
                style={inp}
                value={item.label}
                placeholder="Подпись показателя"
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = { ...item, label: e.target.value };
                  onChange({ ...block, items });
                }}
              />
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
    default:
      return <div style={mediaHint}>Параметры блока «{BLOCK_LABELS[block.type]}» задаются в специализированном редакторе.</div>;
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
const mediaHint: React.CSSProperties = { fontSize: 13, color: 'var(--s-500)', padding: 10, background: '#fff', borderRadius: 6, lineHeight: 1.5 };
const smallBtn: React.CSSProperties = { ...pickerItem, fontSize: 12 };
