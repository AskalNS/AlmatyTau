import type { Block, Blocks, Locale, Media, PublicDocument } from '@atm/contracts';
import { SiteImage } from '../SiteMedia';
import { BlockIcon } from './BlockIcon';
import { SectionsBlock } from './SectionsBlock';
import { AlbumGrid } from '../AlbumGrid';
import styles from './blocks.module.css';

/**
 * Рендер блочного контента.
 *
 * Каждый тип блока — свой компонент, выбор по block.type. Новый тип блока
 * в @atm/contracts требует добавить сюда ветку — и TypeScript напомнит
 * об этом на этапе сборки (exhaustive switch). Так контент из БД
 * (п. IV ТЗ) рисуется без захардкоженной под каждый раздел вёрстки.
 *
 * mediaMap — предзагруженные медиа по id: блоки хранят только идентификаторы,
 * а сервер отдаёт словарь используемых медиа, чтобы не делать запрос на каждую
 * картинку.
 */
export function BlockRenderer({
  blocks,
  locale,
  mediaMap = {},
  documentsMap = {},
}: {
  blocks: Blocks;
  locale: Locale;
  mediaMap?: Record<string, Media>;
  documentsMap?: Record<string, PublicDocument>;
}) {
  return (
    <div className={styles.flow}>
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} locale={locale} mediaMap={mediaMap} documentsMap={documentsMap} />
      ))}
    </div>
  );
}

function BlockView({
  block,
  locale,
  mediaMap,
  documentsMap,
}: {
  block: Block;
  locale: Locale;
  mediaMap: Record<string, Media>;
  documentsMap: Record<string, PublicDocument>;
}) {
  switch (block.type) {
    case 'text':
      // HTML уже очищен санитайзером на сервере при сохранении (п. X.III ТЗ).
      return (
        <div
          className={`${styles.text} ${styles[block.width]}`}
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );

    case 'heading': {
      const Tag = `h${block.level}` as 'h2' | 'h3' | 'h4';
      return <Tag className={styles.heading}>{block.text}</Tag>;
    }

    case 'quote':
      return (
        <blockquote className={styles.quote}>
          <p>{block.text}</p>
          {block.author && (
            <footer>
              {block.author}
              {block.role ? <span>, {block.role}</span> : null}
            </footer>
          )}
        </blockquote>
      );

    case 'image': {
      const media = mediaMap[block.mediaId] ?? null;
      return (
        <figure className={`${styles.figure} ${styles[block.width]}`}>
          <SiteImage media={media} locale={locale} sizes="(max-width: 768px) 100vw, 760px" />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    }

    case 'gallery':
      return (
        <div className={styles.gallery} data-cols={block.columns}>
          {block.mediaIds.map((id) => (
            <SiteImage key={id} media={mediaMap[id] ?? null} locale={locale} ratio="4/3" sizes="(max-width: 768px) 50vw, 360px" />
          ))}
        </div>
      );

    case 'video': {
      const poster = block.posterId ? mediaMap[block.posterId] ?? null : null;
      const src = block.mediaId ? mediaMap[block.mediaId]?.url : block.url;
      return (
        <figure className={styles.figure}>
          {src ? (
            <video controls poster={poster?.url} preload="none" style={{ width: '100%', borderRadius: 8 }}>
              <source src={src} />
            </video>
          ) : null}
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    }

    case 'file':
      return (
        <ul className={styles.files}>
          {block.title && <p className={styles.filesTitle}>{block.title}</p>}
          {block.documentIds.map((id) => {
            const doc = documentsMap[id];
            return (
              <li key={id}>
                <a href={`/api/public/documents/${id}/download`}>{doc?.title || doc?.fileName || 'Документ'}</a>
              </li>
            );
          })}
        </ul>
      );

    case 'stats':
      return (
        <div className={styles.stats}>
          {block.items.map((item, i) => (
            <div key={i} className={styles.stat}>
              <b>
                {item.value}
                {item.suffix ? <span> {item.suffix}</span> : null}
              </b>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      );

    case 'accordion':
      return (
        <div className={styles.accordion}>
          {block.items.map((item, i) => (
            <details key={i}>
              <summary>{item.title}</summary>
              <div dangerouslySetInnerHTML={{ __html: item.html }} />
            </details>
          ))}
        </div>
      );

    case 'timeline':
      return (
        <ol className={styles.timeline}>
          {block.items.map((item, i) => (
            <li key={i} data-done={item.done}>
              <span className={styles.period}>{item.period}</span>
              <strong>{item.title}</strong>
              {item.text && <p>{item.text}</p>}
            </li>
          ))}
        </ol>
      );

    case 'cta': {
      const media = block.mediaId ? mediaMap[block.mediaId] ?? null : null;
      return (
        <div className={styles.cta}>
          {media && <SiteImage media={media} locale={locale} className={styles.ctaBg} />}
          <div className={styles.ctaBody}>
            <h3>{block.title}</h3>
            {block.text && <p>{block.text}</p>}
            <a className="btn btn-primary" href={block.buttonHref}>
              {block.buttonLabel}
            </a>
          </div>
        </div>
      );
    }

    case 'map':
      // Карта грузится клиентским компонентом по данным блока (п. VI ТЗ).
      return (
        <div
          className={styles.map}
          data-provider={block.provider}
          data-lat={block.lat}
          data-lng={block.lng}
          data-zoom={block.zoom}
          style={{ height: block.height }}
        >
          <noscript>Для отображения карты включите JavaScript</noscript>
        </div>
      );

    case 'embed':
      return <EmbedBlock block={block} />;

    /* --- блоки, добавленные по замечаниям Заказчика от 28.07.2026 --------- */

    case 'cards':
      // Иерархия внутри карточки: номер и иконка → заголовок → пояснение.
      // Акцентная полоса сверху убирает «серую массу» из одинаковых рамок.
      return (
        <ul className={styles.cards} data-cols={block.columns}>
          {block.items.map((item, i) => (
            <li key={i} className={styles.card} style={{ ['--card-i' as string]: i }}>
              <div className={styles.cardTop}>
                <span className={styles.cardIcon}>
                  <BlockIcon name={item.icon} size={26} />
                </span>
                {block.numbered && <span className={styles.cardNum}>{String(i + 1).padStart(2, '0')}</span>}
              </div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              {item.text && <p className={styles.cardText}>{item.text}</p>}
            </li>
          ))}
        </ul>
      );

    case 'sections':
      return <SectionsBlock block={block} locale={locale} mediaMap={mediaMap} />;

    case 'compare':
      return (
        <div className={styles.compare}>
          <div className={styles.compareHead}>
            <span className={styles.compareFromLabel}>{block.fromLabel}</span>
            <span className={styles.compareToLabel}>{block.toLabel}</span>
          </div>
          <ul className={styles.compareList}>
            {block.items.map((item, i) => (
              <li key={i} className={styles.compareRow}>
                <span className={styles.compareFrom}>
                  {item.from}
                  {item.suffix ? <small> {item.suffix}</small> : null}
                </span>
                <span className={styles.compareArrow} aria-hidden="true" />
                <span className={styles.compareTo}>
                  {item.to}
                  {item.suffix ? <small> {item.suffix}</small> : null}
                </span>
                <span className={styles.compareLabel}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'zones':
      return (
        <div className={styles.zones}>
          {block.items.map((zone, i) => {
            const media = zone.mediaId ? mediaMap[zone.mediaId] ?? null : null;
            const shots = zone.shotIds
              .map((id) => mediaMap[id])
              .filter((m): m is Media => !!m);
            return (
              <article key={i} className={styles.zone} data-kind={zone.kind}>
                {media && (
                  // Панель зоны из презентации — вертикальная: план трасс
                  // сверху, визуализации объектов снизу. Вписывается целиком,
                  // без обрезки: обрезать план по краям бессмысленно.
                  <div className={styles.zoneMedia}>
                    <SiteImage
                      media={media}
                      locale={locale}
                      ratio="5/6"
                      fit="contain"
                      sizes="(max-width: 900px) 100vw, 420px"
                    />
                  </div>
                )}
                <div className={styles.zoneBody}>
                  <div className={styles.zoneHead}>
                    <h3 className={styles.zoneName}>{zone.name}</h3>
                    <span className={styles.zoneBadge}>{ZONE_BADGE[zone.kind]}</span>
                  </div>
                  <div className={styles.zoneRole}>{zone.role}</div>

                  {zone.stats.length > 0 && (
                    <dl className={styles.zoneStats}>
                      {zone.stats.map((s, j) => (
                        <div key={j}>
                          <dt>{s.value}</dt>
                          <dd>{s.label}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  <p className={styles.zoneText}>{zone.text}</p>

                  {zone.features.length > 0 && (
                    <ul className={styles.zoneFeatures}>
                      {zone.features.map((f, j) => (
                        <li key={j}>{f}</li>
                      ))}
                    </ul>
                  )}

                  {shots.length > 0 && (
                    // Визуализации зоны отдельными кадрами: каждый
                    // открывается на весь экран целиком.
                    <div className={styles.zoneShots}>
                      <AlbumGrid items={shots} locale={locale} />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      );

    case 'orgchart':
      return <OrgChart block={block} />;

    case 'donut':
      return <Donut block={block} />;

    case 'flow':
      // Цепочка шагов: на широком экране идёт слева направо со связками
      // между шагами, на узком разворачивается в вертикальный маршрут.
      return (
        <div className={styles.flowBlock}>
          {block.title && <div className={styles.flowTitle}>{block.title}</div>}
          <ol className={styles.flowSteps}>
            {block.steps.map((step, i) => (
              <li key={i} className={styles.flowStep}>
                <span className={styles.flowIcon}>
                  <BlockIcon name={step.icon} size={24} />
                </span>
                <span className={styles.flowNum}>{i + 1}</span>
                <strong className={styles.flowStepTitle}>{step.title}</strong>
                {step.text && <span className={styles.flowText}>{step.text}</span>}
                {step.note && <span className={styles.flowNote}>{step.note}</span>}
              </li>
            ))}
          </ol>
        </div>
      );

    default:
      // Exhaustive: если добавлен новый тип блока — здесь будет ошибка типов.
      return null;
  }
}

/** Подписи специализаций зон — из презентации «АГК_ОС». */
const ZONE_BADGE: Record<Extract<Block, { type: 'zones' }>['items'][number]['kind'], string> = {
  premium: 'PREMIUM',
  mass: 'MASS',
  hybrid: 'HYBRID',
  sport: 'SPORT',
  family: 'FAMILY',
};

/**
 * Организационная структура (замечание п. 7).
 *
 * Дерево строится из плоского списка узлов и выводится вложенными списками:
 * скринридер читает подчинённость как есть, без ARIA-костылей, а линии связи
 * рисует CSS. На узком экране схема разворачивается в вертикальный список —
 * горизонтальную схему на телефоне пришлось бы масштабировать до нечитаемости.
 */
function OrgChart({ block }: { block: Extract<Block, { type: 'orgchart' }> }) {
  const childrenOf = (parentId: string | null) =>
    block.nodes.filter((n) => (n.parentId || null) === parentId);

  const render = (parentId: string | null, depth: number, stacked = false): React.ReactNode => {
    const items = childrenOf(parentId);
    if (items.length === 0) return null;
    // Колонка — когда так задано у руководителя (реальная схема ТОО).
    // Иначе больше четырёх подчинённых в ряд не влезают: уровень
    // раскладывается сеткой, а связь показывает горизонтальная линия
    // вместо отдельных «усов» к каждому узлу.
    const wide = !stacked && items.length > 4;
    return (
      <ul
        className={styles.orgLevel}
        data-depth={depth}
        data-wide={wide ? 'on' : undefined}
        data-stack={stacked ? 'on' : undefined}
      >
        {items.map((node) => (
          <li key={node.id} className={styles.orgItem}>
            <div className={styles.orgNode} data-accent={node.accent ? 'on' : undefined}>
              <strong>{node.title}</strong>
              {node.subtitle && <span>{node.subtitle}</span>}
            </div>
            {render(node.id, depth + 1, node.stack)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={styles.orgchart} role="group" aria-label="Организационная структура">
      {render(null, 0)}
    </div>
  );
}

/**
 * Кольцевая диаграмма долей.
 *
 * Кольцо рисуется одним conic-gradient, а не библиотекой графиков: это ноль
 * килобайт скрипта и никакого мигания при загрузке. Сегменты дублируются
 * подписями с процентами — диаграмма без легенды недоступна для скринридера
 * и для схем режима слабовидящих, где цвет перестаёт различаться.
 */
function Donut({ block }: { block: Extract<Block, { type: 'donut' }> }) {
  const total = block.segments.reduce((sum, s) => sum + s.percent, 0) || 100;
  let acc = 0;
  const stops = block.segments
    .map((s) => {
      const from = (acc / total) * 100;
      acc += s.percent;
      const to = (acc / total) * 100;
      return `var(--donut-${s.color}) ${from}% ${to}%`;
    })
    .join(', ');

  return (
    <div className={styles.donutBlock}>
      {block.title && <div className={styles.donutTitle}>{block.title}</div>}
      <div className={styles.donutBody}>
        <div
          className={styles.donutRing}
          style={{ ['--donut-stops' as string]: stops }}
          role="img"
          aria-label={block.segments.map((s) => `${s.label} — ${s.percent}%`).join('; ')}
        />
        <ul className={styles.donutLegend}>
          {block.segments.map((s, i) => (
            <li key={i} data-color={s.color}>
              <span className={styles.donutPercent}>{s.percent}%</span>
              <span className={styles.donutLabel}>
                <strong>{s.label}</strong>
                {s.note && <em>{s.note}</em>}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {block.caption && <p className={styles.donutCaption}>{block.caption}</p>}
    </div>
  );
}

function EmbedBlock({ block }: { block: Extract<Block, { type: 'embed' }> }) {
  const src =
    block.provider === 'youtube'
      ? `https://www.youtube-nocookie.com/embed/${block.externalId}`
      : block.provider === 'vimeo'
        ? `https://player.vimeo.com/video/${block.externalId}`
        : '';
  if (!src) return null;
  const [w, h] = block.ratio.split(':').map(Number);
  return (
    <div className={styles.embed} style={{ aspectRatio: `${w} / ${h}` }}>
      <iframe
        src={src}
        title={block.title || 'Встроенный материал'}
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
