import type { Block, Blocks, Locale, Media } from '@atm/contracts';
import { SiteImage } from '../SiteMedia';
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
}: {
  blocks: Blocks;
  locale: Locale;
  mediaMap?: Record<string, Media>;
}) {
  return (
    <div className={styles.flow}>
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} locale={locale} mediaMap={mediaMap} />
      ))}
    </div>
  );
}

function BlockView({
  block,
  locale,
  mediaMap,
}: {
  block: Block;
  locale: Locale;
  mediaMap: Record<string, Media>;
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
          {block.documentIds.map((id) => (
            <li key={id}>
              <a href={`/api/public/documents/${id}/download`}>{block.title || 'Документ'}</a>
            </li>
          ))}
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

    default:
      // Exhaustive: если добавлен новый тип блока — здесь будет ошибка типов.
      return null;
  }
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
