import type { Media, Locale } from '@atm/contracts';

/**
 * Отрисовка изображения из медиабиблиотеки с srcset по вариантам.
 *
 * Отдаёт AVIF и WebP с запасным JPEG (<picture>), выставляет width/height
 * (CLS = 0) и alt из данных — прямой вклад в PageSpeed и доступность
 * (пп. VI, VIII ТЗ). Если alt пуст, картинка помечается декоративной.
 */
export function SiteImage({
  media,
  locale,
  sizes = '100vw',
  priority = false,
  className,
  ratio,
  fit = 'cover',
}: {
  media: Media | null;
  locale: Locale;
  sizes?: string;
  priority?: boolean;
  className?: string;
  ratio?: string;
  /**
   * Как вписывать кадр в заданное соотношение.
   *
   * По умолчанию cover — так ведут себя обложки и фотографии. Для схем и
   * планов нужен contain: у них по краям подписи станций и объектов, обрезка
   * их срезает. Свойство задаётся инлайново (аспект считается по месту),
   * поэтому переопределить его из CSS-модуля нельзя — только через проп.
   */
  fit?: 'cover' | 'contain';
}) {
  if (!media) {
    return <div className={className} style={{ aspectRatio: ratio, background: 'var(--green-50)' }} aria-hidden="true" />;
  }

  const alt = media.alt[locale] || media.alt.ru || media.alt.kk || media.alt.en || '';
  const variants = media.variants;
  const largest = variants[variants.length - 1];

  const avifSet = variants.map((v) => `${v.avif} ${v.width}w`).join(', ');
  const webpSet = variants.map((v) => `${v.webp} ${v.width}w`).join(', ');
  const jpgSet = variants.map((v) => `${v.fallback} ${v.width}w`).join(', ');

  return (
    <picture>
      {avifSet && <source type="image/avif" srcSet={avifSet} sizes={sizes} />}
      {webpSet && <source type="image/webp" srcSet={webpSet} sizes={sizes} />}
      <img
        src={largest?.fallback || media.url}
        srcSet={jpgSet || undefined}
        sizes={sizes}
        width={media.width || undefined}
        height={media.height || undefined}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        style={ratio ? { aspectRatio: ratio, objectFit: fit, width: '100%' } : undefined}
      />
    </picture>
  );
}
