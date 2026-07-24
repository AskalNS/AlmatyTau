import { z } from 'zod';

/* ============================================================================
   Блочный контент

   Тело страницы хранится не как HTML, а как массив типизированных блоков.
   Причина — п. IV ТЗ: Заказчик вправе менять структуру и состав разделов
   на любом этапе. С захардкоженной вёрсткой каждое такое изменение стало бы
   правкой кода и релизом.

   Редактор оперирует блоками из этой библиотеки и не может ввести
   произвольный HTML — это одновременно защита от XSS (п. X.III ТЗ)
   и от разрушения вёрстки.

   Схемы общие для трёх сторон: бэкенд валидирует ими вход, админка строит
   по ним редактор, сайт — рендер. Новый тип блока добавляется здесь,
   и обе стороны узнают о нём через типы.
   ========================================================================== */

/** Ширина блока в макете. */
export const blockWidthSchema = z
  .enum(['normal', 'wide', 'full'])
  .default('normal');

const base = {
  /** Стабильный идентификатор: нужен для drag-and-drop и React-ключей. */
  id: z.string().min(1),
};

/* ------------------------------------------------------------------ текст */

/**
 * Форматированный текст.
 *
 * Хранится как HTML ограниченного подмножества, который производит
 * визуальный редактор (TipTap). На сервере проходит через sanitize-html
 * с белым списком тегов — произвольная разметка, скрипты и обработчики
 * событий вырезаются. Поле руками не заполняется.
 */
export const textBlockSchema = z.object({
  ...base,
  type: z.literal('text'),
  html: z.string().max(60_000),
  width: blockWidthSchema,
});

export const headingBlockSchema = z.object({
  ...base,
  type: z.literal('heading'),
  text: z.string().trim().min(1).max(300),
  /** h1 недоступен: он занят заголовком страницы, двух h1 быть не должно. */
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(2),
});

export const quoteBlockSchema = z.object({
  ...base,
  type: z.literal('quote'),
  text: z.string().trim().min(1).max(2000),
  author: z.string().trim().max(200).optional().nullable(),
  role: z.string().trim().max(200).optional().nullable(),
});

/* ----------------------------------------------------------------- медиа */

export const imageBlockSchema = z.object({
  ...base,
  type: z.literal('image'),
  mediaId: z.string().min(1),
  caption: z.string().trim().max(500).optional().nullable(),
  width: blockWidthSchema,
});

export const galleryBlockSchema = z.object({
  ...base,
  type: z.literal('gallery'),
  mediaIds: z.array(z.string().min(1)).min(1).max(60),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
});

export const videoBlockSchema = z.object({
  ...base,
  type: z.literal('video'),
  /** Файл в хранилище либо внешняя ссылка — что-то одно. */
  mediaId: z.string().min(1).optional().nullable(),
  url: z.string().url().max(1000).optional().nullable(),
  /** Постер обязателен: без него видео тянет за собой первый кадр и рушит LCP. */
  posterId: z.string().min(1).optional().nullable(),
  caption: z.string().trim().max(500).optional().nullable(),
});

export const fileBlockSchema = z.object({
  ...base,
  type: z.literal('file'),
  documentIds: z.array(z.string().min(1)).min(1).max(50),
  title: z.string().trim().max(300).optional().nullable(),
});

/* -------------------------------------------------------------- составные */

/** Ключевые цифры проекта — п. 3 и главная страница. */
export const statsBlockSchema = z.object({
  ...base,
  type: z.literal('stats'),
  items: z
    .array(
      z.object({
        value: z.string().trim().min(1).max(30),
        label: z.string().trim().min(1).max(160),
        /** Приписка вроде «га» или «млн». */
        suffix: z.string().trim().max(20).optional().nullable(),
      }),
    )
    .min(1)
    .max(8),
});

/**
 * Интерактивная карта (п. VI ТЗ).
 *
 * Провайдер вынесен в поле, а не зашит в компонент: п. VI предполагает
 * последующее внедрение цифрового двойника АГК, и подменить реализацию
 * нужно будет без правок остального кода.
 */
export const mapBlockSchema = z.object({
  ...base,
  type: z.literal('map'),
  provider: z.enum(['2gis', 'yandex', 'google']).default('2gis'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  zoom: z.number().int().min(1).max(20).default(14),
  markers: z
    .array(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        title: z.string().trim().max(200),
      }),
    )
    .max(200)
    .default([]),
  height: z.number().int().min(200).max(900).default(420),
});

export const accordionBlockSchema = z.object({
  ...base,
  type: z.literal('accordion'),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(300),
        html: z.string().max(20_000),
      }),
    )
    .min(1)
    .max(50),
});

export const ctaBlockSchema = z.object({
  ...base,
  type: z.literal('cta'),
  title: z.string().trim().min(1).max(300),
  text: z.string().trim().max(1000).optional().nullable(),
  buttonLabel: z.string().trim().min(1).max(80),
  buttonHref: z.string().min(1).max(1000),
  mediaId: z.string().min(1).optional().nullable(),
});

/** Таймлайн этапов реализации проекта — п. 3 ТЗ. */
export const timelineBlockSchema = z.object({
  ...base,
  type: z.literal('timeline'),
  items: z
    .array(
      z.object({
        period: z.string().trim().min(1).max(60),
        title: z.string().trim().min(1).max(300),
        text: z.string().trim().max(1500).optional().nullable(),
        done: z.boolean().default(false),
      }),
    )
    .min(1)
    .max(30),
});

/**
 * Встраивание внешнего материала.
 *
 * Белый список доменов, а не произвольный iframe: чужой скрипт на странице
 * означает и дыру в безопасности (п. X.III), и потерю баллов PageSpeed (п. VIII).
 */
export const embedBlockSchema = z.object({
  ...base,
  type: z.literal('embed'),
  provider: z.enum(['youtube', 'vimeo', 'yandex-map', '2gis-map']),
  /** Идентификатор ролика или карты, а не полный URL. */
  externalId: z.string().trim().min(1).max(300),
  title: z.string().trim().max(300).optional().nullable(),
  ratio: z.enum(['16:9', '4:3', '1:1']).default('16:9'),
});

/* ------------------------------------------------------------ объединение */

export const blockSchema = z.discriminatedUnion('type', [
  textBlockSchema,
  headingBlockSchema,
  quoteBlockSchema,
  imageBlockSchema,
  galleryBlockSchema,
  videoBlockSchema,
  fileBlockSchema,
  statsBlockSchema,
  mapBlockSchema,
  accordionBlockSchema,
  ctaBlockSchema,
  timelineBlockSchema,
  embedBlockSchema,
]);

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block['type'];

/** Тело страницы или новости. */
export const blocksSchema = z.array(blockSchema).max(200);
export type Blocks = z.infer<typeof blocksSchema>;

/** Сужение типа блока по его type. */
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>;

/* ------------------------------------------------- метаданные для админки */

export const BLOCK_LABELS: Record<BlockType, string> = {
  text: 'Текст',
  heading: 'Заголовок',
  quote: 'Цитата',
  image: 'Изображение',
  gallery: 'Галерея',
  video: 'Видео',
  file: 'Документы',
  stats: 'Показатели',
  map: 'Карта',
  accordion: 'Раскрывающийся список',
  cta: 'Призыв к действию',
  timeline: 'Таймлайн',
  embed: 'Внешний материал',
};

/** Порядок в меню «добавить блок»: сверху то, чем пользуются каждый день. */
export const BLOCK_ORDER: BlockType[] = [
  'text',
  'heading',
  'image',
  'gallery',
  'video',
  'file',
  'stats',
  'quote',
  'accordion',
  'timeline',
  'map',
  'cta',
  'embed',
];

/** Заготовка нового блока. Id подставляет админка. */
export function emptyBlock(type: BlockType, id: string): Block {
  switch (type) {
    case 'text':
      return { id, type, html: '', width: 'normal' };
    case 'heading':
      return { id, type, text: '', level: 2 };
    case 'quote':
      return { id, type, text: '', author: null, role: null };
    case 'image':
      return { id, type, mediaId: '', caption: null, width: 'normal' };
    case 'gallery':
      return { id, type, mediaIds: [], columns: 3 };
    case 'video':
      return { id, type, mediaId: null, url: null, posterId: null, caption: null };
    case 'file':
      return { id, type, documentIds: [], title: null };
    case 'stats':
      return { id, type, items: [{ value: '', label: '', suffix: null }] };
    case 'map':
      // Координаты офиса из п. 6 ТЗ: г. Алматы, ул. Байзакова 303
      return { id, type, provider: '2gis', lat: 43.2447, lng: 76.9128, zoom: 16, markers: [], height: 420 };
    case 'accordion':
      return { id, type, items: [{ title: '', html: '' }] };
    case 'cta':
      return { id, type, title: '', text: null, buttonLabel: '', buttonHref: '', mediaId: null };
    case 'timeline':
      return { id, type, items: [{ period: '', title: '', text: null, done: false }] };
    case 'embed':
      return { id, type, provider: 'youtube', externalId: '', title: null, ratio: '16:9' };
  }
}

/* ------------------------------------------------------------- санитайзер */

/**
 * Белый список HTML для текстовых блоков.
 * Применяется на сервере при сохранении — доверять входу из админки нельзя,
 * даже если запрос пришёл от авторизованного редактора (п. X.III ТЗ).
 */
export const ALLOWED_HTML_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's',
  'ul', 'ol', 'li',
  'a', 'sub', 'sup', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
] as const;

export const ALLOWED_HTML_ATTRS: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan', 'scope'],
};
