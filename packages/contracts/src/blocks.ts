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

/* ------------------------------------------------- блоки, добавленные по
   замечаниям Заказчика от 28.07.2026 --------------------------------------- */

/**
 * Иконки для карточек и вкладок.
 *
 * Не произвольная строка и не загружаемый файл: набор фиксирован, рисуется
 * инлайновым SVG на сайте. Иначе редактор получает возможность вставить
 * внешний ресурс, а вместе с ним — запрос к чужому домену на каждой странице.
 */
export const BLOCK_ICONS = [
  'eco',        // лист — экология
  'infra',      // здания — инфраструктура
  'safety',     // щит — безопасность
  'tourism',    // гора с флагом — туризм
  'inclusion',  // люди — доступность и инклюзивность
  'economy',    // рост — экономика
  'transport',  // автобус — транспорт
  'sport',      // медаль — спорт
  'education',  // диплом — кадры
  'cablecar',   // кабина канатной дороги
  'health',     // сердце — здоровый образ жизни
  'parking',    // знак парковки
  'ticket',     // единый ски-пасс, тариф
  'dot',        // нейтральный маркер
] as const;
export const blockIconSchema = z.enum(BLOCK_ICONS);
export type BlockIcon = z.infer<typeof blockIconSchema>;

export const BLOCK_ICON_LABELS: Record<BlockIcon, string> = {
  eco: 'Экология',
  infra: 'Инфраструктура',
  safety: 'Безопасность',
  tourism: 'Туризм',
  inclusion: 'Доступность',
  economy: 'Экономика',
  transport: 'Транспорт',
  sport: 'Спорт',
  education: 'Кадры',
  cablecar: 'Канатная дорога',
  health: 'Здоровый образ жизни',
  parking: 'Парковка',
  ticket: 'Ски-пасс и тариф',
  dot: 'Без иконки',
};

/**
 * Карточки с иконками — «Ключевые задачи», «Направления деятельности».
 *
 * Заменяет список из однотипных прямоугольников: у карточки есть номер,
 * иконка и заголовок, отделённый от пояснения. Замечание п. 5: девять
 * формулировок сплошным текстом одного начертания читать невозможно,
 * взгляду не за что зацепиться.
 */
export const cardsBlockSchema = z.object({
  ...base,
  type: z.literal('cards'),
  /** Нумерация карточек: для перечня задач помогает удерживать место в списке. */
  numbered: z.boolean().default(false),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  items: z
    .array(
      z.object({
        icon: blockIconSchema.default('dot'),
        title: z.string().trim().min(1).max(300),
        text: z.string().trim().max(1200).optional().nullable(),
      }),
    )
    .min(1)
    .max(24),
});

/**
 * Раздел с боковой навигацией по подразделам («Общественная ценность проекта»).
 *
 * Одна страница с якорями, а не подгрузка контента: так работает поиск по
 * странице, ссылка на подраздел остаётся рабочей, а печать и режим для
 * слабовидящих показывают материал целиком. Активный пункт подсвечивается
 * заливкой при прокрутке — замечание к разделу: список не читался как меню.
 */
export const sectionsBlockSchema = z.object({
  ...base,
  type: z.literal('sections'),
  items: z
    .array(
      z.object({
        /** Якорь в адресе страницы. */
        anchor: z.string().trim().regex(/^[a-z0-9-]+$/).max(60),
        icon: blockIconSchema.default('dot'),
        title: z.string().trim().min(1).max(200),
        html: z.string().max(30_000),
        /** Иллюстрация подраздела — «использовать визуал/картинки». */
        mediaId: z.string().min(1).optional().nullable(),
      }),
    )
    .min(2)
    .max(20),
});

/**
 * Сравнение «сейчас → после реализации».
 *
 * Отдельный тип, а не таблица: показатели «до» и «после» нужно сопоставлять
 * взглядом, и разница должна читаться без вычислений.
 */
export const compareBlockSchema = z.object({
  ...base,
  type: z.literal('compare'),
  fromLabel: z.string().trim().min(1).max(120),
  toLabel: z.string().trim().min(1).max(120),
  items: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(200),
        from: z.string().trim().min(1).max(40),
        to: z.string().trim().min(1).max(40),
        suffix: z.string().trim().max(30).optional().nullable(),
      }),
    )
    .min(1)
    .max(12),
});

/**
 * Зоны кластера: Шымбулак, Бутаковка, Кимасар, Пионер, Oi-Qaragai.
 *
 * Структура повторяет карточки зон из презентации «АГК_ОС»: специализация,
 * три показателя, описание и перечень ключевых объектов.
 */
export const ZONE_KINDS = ['premium', 'mass', 'hybrid', 'sport', 'family'] as const;
export const zoneKindSchema = z.enum(ZONE_KINDS);
export type ZoneKind = z.infer<typeof zoneKindSchema>;

export const zonesBlockSchema = z.object({
  ...base,
  type: z.literal('zones'),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        kind: zoneKindSchema,
        /** Роль зоны в системе — короткая строка рядом с бейджем. */
        role: z.string().trim().min(1).max(200),
        text: z.string().trim().max(1500),
        stats: z
          .array(
            z.object({
              value: z.string().trim().min(1).max(40),
              label: z.string().trim().min(1).max(120),
            }),
          )
          .max(4)
          .default([]),
        features: z.array(z.string().trim().min(1).max(300)).max(12).default([]),
        /** План трасс зоны — крупным кадром в карточке. */
        mediaId: z.string().min(1).optional().nullable(),
        /**
         * Визуализации объектов зоны — отдельными снимками, а не одной
         * склейкой: у каждой зоны свой набор, и каждый кадр должен
         * открываться целиком, а не жить миниатюрой внутри общей картинки.
         */
        shotIds: z.array(z.string().min(1)).max(12).default([]),
      }),
    )
    .min(1)
    .max(10),
});

/**
 * Кольцевая диаграмма долей — распределение трасс по уровням сложности.
 *
 * Цвет сегмента — не произвольный HEX, а имя из набора: у горнолыжных трасс
 * цветовая кодировка международная (зелёная, синяя, красная, чёрная),
 * и подменять её произвольным цветом нельзя. Значения задаются в процентах,
 * сумма проверяется на сервере не строго: части могут не покрывать 100 %
 * (например, «прочее» не показывают).
 */
export const DONUT_COLORS = ['green', 'blue', 'red', 'black', 'gold', 'brand'] as const;
export const donutColorSchema = z.enum(DONUT_COLORS);
export type DonutColor = z.infer<typeof donutColorSchema>;

export const donutBlockSchema = z.object({
  ...base,
  type: z.literal('donut'),
  title: z.string().trim().max(200).optional().nullable(),
  caption: z.string().trim().max(400).optional().nullable(),
  segments: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(120),
        /** Пояснение под подписью: «для начинающих», «для экспертов». */
        note: z.string().trim().max(160).optional().nullable(),
        percent: z.number().min(0).max(100),
        color: donutColorSchema,
      }),
    )
    .min(2)
    .max(6),
});

/**
 * Маршрут из шагов — «как добраться», порядок действий, этапы процесса.
 *
 * Отдельный тип, а не нумерованный список: у последовательности есть
 * направление, и его показывают связкой между шагами, а не цифрами в начале
 * строки. Используется для транспортной схемы кластера: посетитель должен
 * увидеть цепочку «парковка → шаттл → канатная дорога» одним взглядом.
 */
export const flowBlockSchema = z.object({
  ...base,
  type: z.literal('flow'),
  title: z.string().trim().max(200).optional().nullable(),
  steps: z
    .array(
      z.object({
        icon: blockIconSchema.default('dot'),
        title: z.string().trim().min(1).max(120),
        text: z.string().trim().max(400).optional().nullable(),
        /** Короткая приписка: интервал, вместимость, стоимость. */
        note: z.string().trim().max(80).optional().nullable(),
      }),
    )
    .min(2)
    .max(8),
});

/**
 * Организационная структура (замечание п. 7 — схемы на странице не было).
 *
 * Плоский список узлов со ссылкой на родителя, а не вложенное дерево:
 * такую структуру редактор правит по одному узлу и не рискует потерять
 * ветку при перестановке. Уровень вложенности сайт считает сам.
 */
export const orgchartBlockSchema = z.object({
  ...base,
  type: z.literal('orgchart'),
  nodes: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(60),
        parentId: z.string().trim().max(60).optional().nullable(),
        title: z.string().trim().min(1).max(200),
        subtitle: z.string().trim().max(300).optional().nullable(),
        /** Выделение уровня органов управления от исполнительного аппарата. */
        accent: z.boolean().default(false),
        /**
         * Подчинённые узлы выстраиваются вертикальной колонкой, а не в ряд.
         *
         * Нужно для реальной схемы ТОО: заместители Председателя возглавляют
         * колонки департаментов. В ряд девять департаментов не помещаются,
         * а колонка повторяет утверждённую схему один в один.
         */
        stack: z.boolean().default(false),
      }),
    )
    .min(1)
    .max(60),
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
  cardsBlockSchema,
  sectionsBlockSchema,
  compareBlockSchema,
  zonesBlockSchema,
  orgchartBlockSchema,
  flowBlockSchema,
  donutBlockSchema,
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
  cards: 'Карточки с иконками',
  sections: 'Подразделы с боковым меню',
  compare: 'Сравнение «сейчас → станет»',
  zones: 'Зоны кластера',
  orgchart: 'Организационная структура',
  flow: 'Последовательность шагов',
  donut: 'Кольцевая диаграмма',
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
  'cards',
  'compare',
  'sections',
  'zones',
  'orgchart',
  'flow',
  'donut',
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
      return { id, type, provider: '2gis', lat: 43.230043, lng: 76.914806, zoom: 16, markers: [], height: 420 };
    case 'accordion':
      return { id, type, items: [{ title: '', html: '' }] };
    case 'cta':
      return { id, type, title: '', text: null, buttonLabel: '', buttonHref: '', mediaId: null };
    case 'timeline':
      return { id, type, items: [{ period: '', title: '', text: null, done: false }] };
    case 'embed':
      return { id, type, provider: 'youtube', externalId: '', title: null, ratio: '16:9' };
    case 'cards':
      return { id, type, numbered: false, columns: 3, items: [{ icon: 'dot', title: '', text: null }] };
    case 'sections':
      return {
        id,
        type,
        items: [
          { anchor: 'razdel-1', icon: 'dot', title: '', html: '', mediaId: null },
          { anchor: 'razdel-2', icon: 'dot', title: '', html: '', mediaId: null },
        ],
      };
    case 'compare':
      return {
        id,
        type,
        fromLabel: 'Сейчас',
        toLabel: 'После реализации',
        items: [{ label: '', from: '', to: '', suffix: null }],
      };
    case 'zones':
      return {
        id,
        type,
        items: [
          { name: '', kind: 'mass', role: '', text: '', stats: [], features: [], mediaId: null, shotIds: [] },
        ],
      };
    case 'orgchart':
      return {
        id,
        type,
        nodes: [{ id: 'n1', parentId: null, title: '', subtitle: null, accent: true, stack: false }],
      };
    case 'flow':
      return {
        id,
        type,
        title: null,
        steps: [
          { icon: 'dot', title: '', text: null, note: null },
          { icon: 'dot', title: '', text: null, note: null },
        ],
      };
    case 'donut':
      return {
        id,
        type,
        title: null,
        caption: null,
        segments: [
          { label: '', note: null, percent: 50, color: 'green' },
          { label: '', note: null, percent: 50, color: 'blue' },
        ],
      };
  }
}

/* -------------------------------------------------------- ссылки на медиа */

/**
 * Идентификаторы медиафайлов, на которые ссылается блочный контент.
 *
 * Блоки хранят только id, поэтому сервер обязан приложить к странице словарь
 * используемых файлов — иначе картинка в блоке рисуется пустотой. Собирать
 * их приходится централизованно: каждый новый тип блока со своим полем
 * mediaId легко забыть, а на странице это выглядит как «пропали изображения».
 */
export function collectMediaIds(blocks: Blocks): string[] {
  const ids = new Set<string>();
  const add = (v?: string | null) => {
    if (v) ids.add(v);
  };

  for (const b of blocks) {
    switch (b.type) {
      case 'image':
        add(b.mediaId);
        break;
      case 'gallery':
        b.mediaIds.forEach(add);
        break;
      case 'video':
        add(b.mediaId);
        add(b.posterId);
        break;
      case 'cta':
        add(b.mediaId);
        break;
      case 'sections':
        b.items.forEach((i) => add(i.mediaId));
        break;
      case 'zones':
        b.items.forEach((i) => {
          add(i.mediaId);
          i.shotIds.forEach(add);
        });
        break;
      default:
        break;
    }
  }
  return [...ids];
}

/**
 * Идентификаторы документов, на которые ссылается блок `file`.
 *
 * Тот же приём, что и с collectMediaIds: блок хранит только id, страница
 * обязана приложить словарь документов целиком — иначе список в блоке
 * рисуется без названий файлов.
 */
export function collectDocumentIds(blocks: Blocks): string[] {
  const ids = new Set<string>();
  for (const b of blocks) {
    if (b.type === 'file') b.documentIds.forEach((id) => ids.add(id));
  }
  return [...ids];
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
