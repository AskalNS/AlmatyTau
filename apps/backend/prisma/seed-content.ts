/* ============================================================================
   Контентный сид по замечаниям Заказчика от 28.07.2026.

       pnpm --filter @atm/backend content:seed

   Что делает:
     - загружает в медиабиблиотеку изображения из prisma/seed-assets
       (карта кластера, рендеры зон, слайды по транспорту, фотографии);
     - перезаполняет главную: герой без кнопок и с анимированным баннером,
       текст о кластере, девять ключевых задач карточками, цифры проекта;
     - наполняет «О компании», «Алматинский горный кластер»,
       «Общественная ценность проекта» и «Организационную структуру»;
     - переименовывает раздел «Проект «Алматинский горный кластер»»
       в «Алматинский горный кластер» в меню и в заголовке страницы.

   Скрипт идемпотентен и предназначен для повторного запуска: страницы
   и секции перезаписываются по известному адресу, медиа не дублируются.
   Он намеренно отделён от prisma/seed.ts — тот создаёт каркас системы
   (администратора, меню, системные страницы) и выполняется при первом
   развёртывании, а этот наполняет разделы и запускается по необходимости.
   ========================================================================== */

import { PrismaClient, Locale, PublishStatus } from '@prisma/client';
import type { Blocks } from '@atm/contracts';
import { prepareStorage, upsertImage } from './content/media';
import { prepareDocumentStorage, upsertDocumentFile, type SeedDocument } from './content/documents';
import { reindexSearch } from './reindex-search';
import {
  HERO,
  HOME_ABOUT_TITLE,
  HOME_ABOUT_HTML,
  TASKS_TITLE,
  TASKS,
  NUMBERS_TITLE,
  NUMBERS,
  ABOUT_TITLE,
  ABOUT_HTML,
  ACTIVITIES_TITLE,
  ACTIVITIES,
  type T,
} from './content/texts';
import {
  MANAGEMENT,
  SUPERVISORY,
  ORG_NODES,
  ORG_HEADCOUNT_HTML,
  PROCUREMENT_TITLE,
  PROCUREMENT_HTML,
  CONTACTS,
  type PersonContent,
} from './content/texts-people';
import {
  PROJECT_TITLE,
  PROJECT_LEAD,
  PROJECT_INTRO_HTML,
  COMPARE_TITLE,
  COMPARE_FROM,
  COMPARE_TO,
  COMPARE_ITEMS,
  COMPARE_NOTE_HTML,
  ZONES_TITLE,
  ZONES,
  ZONES_OUTRO_HTML,
  VALUE_TITLE,
  VALUE_LEAD,
  VALUE_SECTIONS,
  STRUCTURE_TITLE,
  STRUCTURE_LEAD,
  TRANSPORT_TITLE,
  TRANSPORT_FLOW_TITLE,
  TRANSPORT_FLOW,
  TRANSPORT_STATS,
  TRANSPORT_PRINCIPLES_TITLE,
  TRANSPORT_PRINCIPLES,
  TRANSPORT_CORRIDORS_TITLE,
  TRANSPORT_CORRIDORS,
} from './content/texts-project';
import {
  TECH_TITLE,
  TRAILS_DONUT_TITLE,
  TRAILS_DONUT_CAPTION,
  TRAILS_SEGMENTS,
  TECH_STATS,
  TECH_PRINCIPLES,
  PHASES_TITLE,
  PHASES,
  ADVANTAGES_TITLE,
  ADVANTAGES,
  WORLD_TITLE,
  WORLD_LEAD,
  WORLD_CABLECARS,
  WATER_TITLE,
  WATER_HTML,
  WATER_STATS,
  CARE_TITLE,
  CARE_PRINCIPLES,
  SOCIAL_TITLE,
  SOCIAL_BENEFITS,
  TRAILS_TITLE,
  TRAILS_HTML,
  CORRIDOR_WORKS_TITLE,
  CORRIDOR_WORKS,
  CORRIDOR_WORKS_NOTE_HTML,
  APP_TITLE,
  APP_FEATURES,
  TARGETS_TITLE,
  TARGETS_FROM,
  TARGETS_TO,
  TARGETS,
  TEAM_TITLE,
  TEAM_HTML,
} from './content/texts-decks';

const prisma = new PrismaClient();
const LOCALES: Locale[] = [Locale.kk, Locale.ru, Locale.en];

/** Идентификаторы медиа по имени файла — заполняется на первом шаге. */
const media = new Map<string, string>();
const mid = (file: string): string => {
  const id = media.get(file);
  if (!id) throw new Error(`Изображение ${file} не загружено`);
  return id;
};

/* ------------------------------------------------------------------ медиа */

const IMAGES: Array<{ file: string; alt: T }> = [
  {
    file: 'hero-cablecar.jpg',
    alt: {
      ru: 'Кабина канатной дороги на фоне заснеженной вершины',
      kk: 'Қармен көмкерілген шың аясындағы аспалы жол кабинасы',
      en: 'A cable car cabin against a snow-covered peak',
    },
  },
  {
    file: 'hero-range.jpg',
    alt: {
      ru: 'Панорама заснеженных хребтов Заилийского Алатау',
      kk: 'Іле Алатауының қарлы жоталарының панорамасы',
      en: 'Panorama of the snow-covered ridges of the Ile Alatau',
    },
  },
  {
    file: 'cluster-map.jpg',
    alt: {
      ru: 'Карта развития горной инфраструктуры Алматинского горного кластера: зоны Шымбулак, Кимасар, Бутаковка, Пионер и Oi-Qaragai, существующие и планируемые канатные дороги',
      kk: 'Алматы тау кластерінің тау инфрақұрылымын дамыту картасы: Шымбұлақ, Кімасар, Бұтақты, Пионер және Oi-Qaragai аймақтары, бар және жоспарланған аспалы жолдар',
      en: 'Map of the Almaty Mountain Cluster infrastructure: the Shymbulak, Kimasar, Butakovka, Pioneer and Oi-Qaragai zones with existing and planned cable cars',
    },
  },
  {
    file: 'zone-shymbulak-plan.jpg',
    alt: {
      ru: 'План трасс и подъёмников зоны Шымбулак',
      kk: 'Шымбұлақ аймағының трассалары мен көтергіштерінің жоспары',
      en: 'Plan of runs and lifts in the Shymbulak zone',
    },
  },
  {
    file: 'zone-butakovka-plan.jpg',
    alt: {
      ru: 'План трасс и подъёмников зоны Бутаковка',
      kk: 'Бұтақты аймағының трассалары мен көтергіштерінің жоспары',
      en: 'Plan of runs and lifts in the Butakovka zone',
    },
  },
  {
    file: 'zone-kimasar-plan.jpg',
    alt: {
      ru: 'План трасс и подъёмников зоны Кимасар',
      kk: 'Кімасар аймағының трассалары мен көтергіштерінің жоспары',
      en: 'Plan of runs and lifts in the Kimasar zone',
    },
  },
  {
    file: 'zone-pioneer-plan.jpg',
    alt: {
      ru: 'План трасс и подъёмников зоны Пионер',
      kk: 'Пионер аймағының трассалары мен көтергіштерінің жоспары',
      en: 'Plan of runs and lifts in the Pioneer zone',
    },
  },
  {
    file: 'zone-oi-qaragai-plan.jpg',
    alt: {
      ru: 'План трасс и подъёмников зоны Ой-Карагай',
      kk: 'Ой-Қарағай аймағының трассалары мен көтергіштерінің жоспары',
      en: 'Plan of runs and lifts in the Oi-Qaragai zone',
    },
  },
  {
    file: 'value-health.jpg',
    alt: {
      ru: 'Пешеходный маршрут в горах над Алматы',
      kk: 'Алматы үстіндегі таудағы жаяу маршрут',
      en: 'A hiking trail in the mountains above Almaty',
    },
  },
  {
    file: 'value-eco.jpg',
    alt: {
      ru: 'Компенсационная посадка хвойных деревьев',
      kk: 'Қылқан жапырақты ағаштарды өтемақы ретінде отырғызу',
      en: 'Compensatory planting of conifers',
    },
  },
  {
    file: 'value-social.jpg',
    alt: {
      ru: 'Семья с детьми на прогулке в зимних горах',
      kk: 'Қысқы тауда серуендеп жүрген балалы отбасы',
      en: 'A family with children on a walk in the winter mountains',
    },
  },
  {
    file: 'value-economy.jpg',
    alt: {
      ru: 'Панорама Алматы на фоне горного хребта',
      kk: 'Тау жотасы аясындағы Алматы панорамасы',
      en: 'Panorama of Almaty against the mountain ridge',
    },
  },
  {
    file: 'value-sport.jpg',
    alt: {
      ru: 'Оборудованная горная тропа',
      kk: 'Жабдықталған тау соқпағы',
      en: 'An equipped mountain trail',
    },
  },
  {
    file: 'value-tourism.jpg',
    alt: {
      ru: 'Дорога к горным курортам зимой',
      kk: 'Қыста тау курорттарына апаратын жол',
      en: 'The road to the mountain resorts in winter',
    },
  },
  {
    file: 'transport-corridors.jpg',
    alt: {
      ru: 'Схема транспортных мастер-планов основных коридоров Алматинского горного кластера',
      kk: 'Алматы тау кластерінің негізгі дәліздерінің көлік мастер-жоспарларының схемасы',
      en: 'Transport master plans for the main corridors of the Almaty Mountain Cluster',
    },
  },
  {
    file: 'transport-parkings.jpg',
    alt: {
      ru: 'Схема проектируемых перехватывающих парковок и маршрутов шаттлов',
      kk: 'Жобаланған қайта бағыттаушы автотұрақтар мен шаттл маршруттарының схемасы',
      en: 'Planned park-and-ride car parks and shuttle routes',
    },
  },
  {
    file: 'transport-shuttles.jpg',
    alt: {
      ru: 'Электробусы-шаттлы: низкий пол, зона для лыж и сноубордов, интервал до 10 минут',
      kk: 'Электробус-шаттлдар: төмен еден, шаңғы мен сноубордқа арналған аймақ, аралығы 10 минутқа дейін',
      en: 'Electric shuttle buses: low floor, ski and snowboard area, intervals up to 10 minutes',
    },
  },
  {
    file: 'trail-before.jpg',
    alt: {
      ru: 'Стихийная тропа в горах до обустройства',
      kk: 'Жайластырылғанға дейінгі ретсіз тау соқпағы',
      en: 'An informal mountain path before improvement',
    },
  },
  {
    file: 'trail-after.jpg',
    alt: {
      ru: 'Обустроенная пешая тропа с твёрдым покрытием',
      kk: 'Қатты жабыны бар жайластырылған жаяу соқпақ',
      en: 'A built hiking trail with a hard surface',
    },
  },
  {
    file: 'smart-tourist.jpg',
    alt: {
      ru: 'Экраны мобильного приложения Smart Tourist: маршрут, парковки и билеты',
      kk: 'Smart Tourist мобильді қосымшасының экрандары: маршрут, автотұрақтар және билеттер',
      en: 'Smart Tourist app screens: route, parking and tickets',
    },
  },
  {
    file: 'team-mdp.jpg',
    alt: {
      ru: 'Логотип MDP Consulting & Engineering',
      kk: 'MDP Consulting & Engineering логотипі',
      en: 'MDP Consulting & Engineering logo',
    },
  },
  {
    file: 'team-engineerisk.jpg',
    alt: {
      ru: 'Логотип Engineerisk — инженерные решения по защите от лавин',
      kk: 'Engineerisk логотипі — көшкіннен қорғаудың инженерлік шешімдері',
      en: 'Engineerisk logo — avalanche protection engineering',
    },
  },
  // Визуализации зон: у каждой своё число кадров, alt строится по названию.
  ...ZONES.flatMap((z) =>
    Array.from({ length: z.assets.shots }, (_, i) => ({
      file: `${z.assets.plan.replace('-plan.jpg', '')}-${i + 1}.jpg`,
      alt: {
        ru: `Визуализация объекта зоны «${z.name.ru}»`,
        kk: `«${z.name.kk}» аймағы нысанының визуализациясы`,
        en: `Visualisation of a facility in the ${z.name.en} zone`,
      },
    })),
  ),
  // Портреты руководства: alt строится по ФИО, поэтому добавляются отдельно.
  ...[...MANAGEMENT, ...SUPERVISORY].map((p) => ({
    file: p.asset,
    alt: {
      ru: `${p.fullName.ru} — ${p.position.ru}`,
      kk: `${p.fullName.kk} — ${p.position.kk}`,
      en: `${p.fullName.en} — ${p.position.en}`,
    },
  })),
];

async function seedMedia(): Promise<void> {
  await prepareStorage();
  for (const image of IMAGES) {
    media.set(image.file, await upsertImage(prisma, image));
  }
  console.log(`✓ Медиабиблиотека: ${IMAGES.length} изображений`);
}

/* -------------------------------------------------------------- помощники */

let blockSeq = 0;
const bid = (): string => `sb${(++blockSeq).toString(36)}`;

/** Переводы для набора блоков: строится по языку. */
type BlocksFor = (locale: Locale) => Blocks;

async function upsertPage(input: {
  path: string;
  title: T;
  lead?: T;
  blocks: BlocksFor;
}): Promise<void> {
  const existing = await prisma.page.findUnique({ where: { path: input.path } });

  const translations = LOCALES.map((locale) => ({
    locale,
    title: input.title[locale],
    lead: input.lead?.[locale] ?? null,
    blocks: input.blocks(locale) as never,
  }));

  if (existing) {
    await prisma.$transaction([
      prisma.pageTranslation.deleteMany({ where: { pageId: existing.id } }),
      prisma.page.update({
        where: { id: existing.id },
        data: {
          status: PublishStatus.PUBLISHED,
          translations: { create: translations },
        },
      }),
    ]);
  } else {
    await prisma.page.create({
      data: {
        path: input.path,
        status: PublishStatus.PUBLISHED,
        translations: { create: translations },
      },
    });
  }
  console.log(`✓ Страница /${input.path}`);
}

/* ------------------------------------------------------------- главная --- */

async function seedHome(): Promise<void> {
  // Секции пересобираются целиком: их состав задан замечаниями, а прежний
  // набор (в том числе кнопки в герое) им противоречит.
  await prisma.homeSection.deleteMany({});

  // Кадры баннера (замечание Заказчика от 19.08.2026, п. 1): блёклую
  // спутниковую панораму (hero-range.jpg, подпись «Issyk-Kul») и гондолу с
  // фирменной надписью французского курорта «friendlyMenuires» на кабине —
  // убрали. Вместо них летний яркий кадр тропы чередуется с зимней кабиной
  // канатной дороги, как и просил Заказчик.
  const heroFrames = ['hero-cablecar.jpg', 'trail-after.jpg'];

  await prisma.homeSection.create({
    data: {
      type: 'hero',
      order: 0,
      // Постер — первый кадр баннера, он же LCP-элемент.
      heroPosterId: mid(heroFrames[0]),
      translations: {
        create: LOCALES.map((locale) => ({
          locale,
          eyebrow: HERO.eyebrow[locale],
          title: HERO.title[locale],
          subtitle: HERO.subtitle[locale],
          // Кнопки «О проекте» и «Последние новости» убраны по замечанию п. 3.
          primaryLabel: null,
          primaryHref: null,
          secondaryLabel: null,
          secondaryHref: null,
          // Галерея внутри секции — кадры анимированного баннера (п. 1 ТЗ).
          blocks: [
            { id: 'heroframes', type: 'gallery', mediaIds: heroFrames.map(mid), columns: 3 },
          ] as never,
        })),
      },
    },
  });

  await prisma.homeSection.create({
    data: {
      type: 'about',
      order: 1,
      translations: {
        create: LOCALES.map((locale) => ({
          locale,
          title: HOME_ABOUT_TITLE[locale],
          blocks: [
            { id: 'ha1', type: 'text', width: 'wide', html: HOME_ABOUT_HTML[locale] },
            {
              id: 'ha2',
              type: 'image',
              width: 'full',
              mediaId: mid('value-economy.jpg'),
              caption: null,
            },
          ] as never,
        })),
      },
    },
  });

  await prisma.homeSection.create({
    data: {
      type: 'directions',
      order: 2,
      translations: {
        create: LOCALES.map((locale) => ({
          locale,
          title: TASKS_TITLE[locale],
          blocks: [
            {
              id: 'tasks',
              type: 'cards',
              numbered: true,
              columns: 3,
              items: TASKS.map((t) => ({
                icon: t.icon,
                title: t.title[locale],
                text: t.text[locale],
              })),
            },
          ] as never,
        })),
      },
    },
  });

  await prisma.homeSection.create({
    data: {
      type: 'stats',
      order: 3,
      translations: {
        create: LOCALES.map((locale) => ({
          locale,
          title: NUMBERS_TITLE[locale],
          blocks: [
            {
              id: 'numbers',
              type: 'stats',
              items: NUMBERS.map((n) => ({
                value: n.value,
                suffix: n.suffix ?? null,
                label: n.label[locale],
              })),
            },
          ] as never,
        })),
      },
    },
  });

  await prisma.homeSection.create({
    data: {
      type: 'map',
      order: 4,
      // Кнопку «Подробнее» у карты убрали по замечанию Заказчика от
      // 19.08.2026 (п. 5) — href не задаём.
      translations: {
        create: LOCALES.map((locale) => ({
          locale,
          title: {
            ru: 'Карта Алматинского горного кластера',
            kk: 'Алматы тау кластерінің картасы',
            en: 'Map of the Almaty Mountain Cluster',
          }[locale],
          blocks: [
            { id: 'hmap', type: 'image', width: 'full', mediaId: mid('cluster-map.jpg'), caption: null },
          ] as never,
        })),
      },
    },
  });

  await prisma.homeSection.create({
    data: {
      type: 'news',
      order: 5,
      href: 'media/news',
      translations: {
        create: LOCALES.map((locale) => ({
          locale,
          title: { ru: 'Новости', kk: 'Жаңалықтар', en: 'News' }[locale],
          blocks: [] as never,
        })),
      },
    },
  });

  // Раздел «Партнёры и госресурсы» убран по замечанию Заказчика от
  // 19.08.2026 (п. 7).

  console.log('✓ Главная страница: герой, о кластере, ключевые задачи, цифры, карта, новости');
}

/* --------------------------------------------------------------- страницы */

async function seedAboutPage(): Promise<void> {
  await upsertPage({
    path: 'company/about',
    title: ABOUT_TITLE,
    blocks: (locale) => [
      { id: bid(), type: 'text', width: 'wide', html: ABOUT_HTML[locale] },
      { id: bid(), type: 'heading', level: 2, text: ACTIVITIES_TITLE[locale] },
      {
        id: bid(),
        type: 'cards',
        numbered: false,
        columns: 3,
        items: ACTIVITIES.map((a) => ({
          icon: a.icon as never,
          title: a.title[locale],
          text: a.text[locale],
        })),
      },
    ],
  });
}

async function seedProjectPage(): Promise<void> {
  await upsertPage({
    path: 'project',
    title: PROJECT_TITLE,
    lead: PROJECT_LEAD,
    blocks: (locale) => [
      { id: bid(), type: 'text', width: 'wide', html: PROJECT_INTRO_HTML[locale] },
      {
        id: bid(),
        type: 'image',
        width: 'full',
        mediaId: mid('cluster-map.jpg'),
        caption: {
          ru: 'Развитие горной инфраструктуры Алматинского горного кластера',
          kk: 'Алматы тау кластерінің тау инфрақұрылымын дамыту',
          en: 'Development of the Almaty Mountain Cluster infrastructure',
        }[locale],
      },
      { id: bid(), type: 'heading', level: 2, text: COMPARE_TITLE[locale] },
      {
        id: bid(),
        type: 'compare',
        fromLabel: COMPARE_FROM[locale],
        toLabel: COMPARE_TO[locale],
        items: COMPARE_ITEMS.map((c) => ({
          label: c.label[locale],
          from: c.from,
          to: c.to,
          suffix: c.suffix?.[locale] ?? null,
        })),
      },
      { id: bid(), type: 'text', width: 'wide', html: COMPARE_NOTE_HTML[locale] },
      { id: bid(), type: 'heading', level: 2, text: ZONES_TITLE[locale] },
      {
        id: bid(),
        type: 'zones',
        items: ZONES.map((z) => ({
          name: z.name[locale],
          kind: z.kind,
          role: z.role[locale],
          text: z.text[locale],
          mediaId: mid(z.assets.plan),
          shotIds: Array.from({ length: z.assets.shots }, (_, i) =>
            mid(`${z.assets.plan.replace('-plan.jpg', '')}-${i + 1}.jpg`),
          ),
          stats: z.stats.map((s) => ({ value: s.value, label: s.label[locale] })),
          features: z.features.map((f) => f[locale]),
        })),
      },
      { id: bid(), type: 'text', width: 'wide', html: ZONES_OUTRO_HTML[locale] },

      /* --- материал презентации «АГК_ОС», слайды 4, 7, 14 ----------------- */

      { id: bid(), type: 'heading', level: 2, text: TECH_TITLE[locale] },
      {
        id: bid(),
        type: 'donut',
        title: TRAILS_DONUT_TITLE[locale],
        caption: TRAILS_DONUT_CAPTION[locale],
        segments: TRAILS_SEGMENTS.map((s) => ({
          label: s.label[locale],
          note: s.note[locale],
          percent: s.percent,
          color: s.color,
        })),
      },
      {
        id: bid(),
        type: 'stats',
        items: TECH_STATS.map((s) => ({
          value: s.value,
          suffix: s.suffix?.[locale] ?? null,
          label: s.label[locale],
        })),
      },
      {
        id: bid(),
        type: 'cards',
        numbered: false,
        columns: 3,
        items: TECH_PRINCIPLES.map((c) => ({
          icon: c.icon as never,
          title: c.title[locale],
          text: c.text[locale],
        })),
      },

      { id: bid(), type: 'heading', level: 2, text: PHASES_TITLE[locale] },
      {
        id: bid(),
        type: 'timeline',
        items: PHASES.map((p) => ({
          period: p.period[locale],
          title: p.title[locale],
          text: p.text[locale],
          done: p.done,
        })),
      },

      { id: bid(), type: 'heading', level: 2, text: ADVANTAGES_TITLE[locale] },
      {
        id: bid(),
        type: 'cards',
        numbered: false,
        columns: 3,
        items: ADVANTAGES.map((c) => ({
          icon: c.icon as never,
          title: c.title[locale],
          text: c.text[locale],
        })),
      },

      { id: bid(), type: 'heading', level: 2, text: WORLD_TITLE[locale] },
      { id: bid(), type: 'text', width: 'wide', html: `<p>${WORLD_LEAD[locale]}</p>` },
      {
        id: bid(),
        type: 'cards',
        numbered: false,
        columns: 4,
        items: WORLD_CABLECARS.map((c) => ({
          icon: 'cablecar' as never,
          title: `${c.rank}. ${c.name[locale]}`,
          text: `${c.country[locale]}, ${c.region[locale]}. ${
            locale === 'kk' ? 'Жоғарғы станция' : locale === 'en' ? 'Top station' : 'Верхняя станция'
          } — ${c.altitude} ${locale === 'en' ? 'm' : 'м'}. ${c.note[locale]}`,
        })),
      },
      {
        id: bid(),
        type: 'cta',
        title: VALUE_TITLE[locale],
        text: VALUE_LEAD[locale],
        buttonLabel: { ru: 'Открыть раздел', kk: 'Бөлімді ашу', en: 'Open the section' }[locale],
        buttonHref: `/${locale}/project/public-value`,
        mediaId: null,
      },
    ],
  });
}

async function seedValuePage(): Promise<void> {
  await upsertPage({
    path: 'project/public-value',
    title: VALUE_TITLE,
    lead: VALUE_LEAD,
    blocks: (locale) => [
      {
        id: bid(),
        type: 'sections',
        items: VALUE_SECTIONS.map((s) => ({
          anchor: s.anchor,
          icon: s.icon as never,
          title: s.title[locale],
          html: s.html[locale],
          mediaId: s.asset ? mid(s.asset) : null,
        })),
      },
      // Транспортная схема собрана блоками, а не слайдами из презентации:
      // картинка со вшитым текстом не переводится на три языка, не читается
      // на телефоне и не доступна скринридеру.
      { id: bid(), type: 'heading', level: 2, text: TRANSPORT_TITLE[locale] },
      {
        id: bid(),
        type: 'flow',
        title: TRANSPORT_FLOW_TITLE[locale],
        steps: TRANSPORT_FLOW.map((s) => ({
          icon: s.icon as never,
          title: s.title[locale],
          text: s.text[locale],
          note: s.note?.[locale] ?? null,
        })),
      },
      {
        id: bid(),
        type: 'stats',
        items: TRANSPORT_STATS.map((s) => ({
          value: s.value,
          suffix: s.suffix?.[locale] ?? null,
          label: s.label[locale],
        })),
      },
      { id: bid(), type: 'heading', level: 3, text: TRANSPORT_PRINCIPLES_TITLE[locale] },
      {
        id: bid(),
        type: 'cards',
        numbered: false,
        columns: 3,
        items: TRANSPORT_PRINCIPLES.map((p) => ({
          icon: p.icon as never,
          title: p.title[locale],
          text: p.text[locale],
        })),
      },
      { id: bid(), type: 'heading', level: 3, text: TRANSPORT_CORRIDORS_TITLE[locale] },
      {
        id: bid(),
        type: 'timeline',
        items: TRANSPORT_CORRIDORS.map((c) => ({
          period: c.period[locale],
          title: c.title[locale],
          text: c.text[locale],
          done: c.done,
        })),
      },

      /* --- презентация «Транспорт», слайды 3, 6, 7 ------------------------- */

      { id: bid(), type: 'heading', level: 3, text: CORRIDOR_WORKS_TITLE[locale] },
      {
        id: bid(),
        type: 'cards',
        numbered: false,
        columns: 3,
        items: CORRIDOR_WORKS.map((c) => ({
          icon: c.icon as never,
          title: c.title[locale],
          text: c.text[locale],
        })),
      },
      { id: bid(), type: 'text', width: 'wide', html: CORRIDOR_WORKS_NOTE_HTML[locale] },

      { id: bid(), type: 'heading', level: 3, text: TARGETS_TITLE[locale] },
      {
        id: bid(),
        type: 'compare',
        fromLabel: TARGETS_FROM[locale],
        toLabel: TARGETS_TO[locale],
        items: TARGETS.map((t) => ({
          label: t.label[locale],
          from: t.from,
          to: t.to,
          suffix: t.suffix?.[locale] ?? null,
        })),
      },

      { id: bid(), type: 'heading', level: 3, text: APP_TITLE[locale] },
      {
        id: bid(),
        type: 'image',
        width: 'normal',
        mediaId: mid('smart-tourist.jpg'),
        caption: null,
      },
      {
        id: bid(),
        type: 'cards',
        numbered: false,
        columns: 3,
        items: APP_FEATURES.map((c) => ({
          icon: c.icon as never,
          title: c.title[locale],
          text: c.text[locale],
        })),
      },

      /* --- презентация «АГК_ОС», слайды 5, 9, 13, 15 ---------------------- */

      { id: bid(), type: 'heading', level: 2, text: WATER_TITLE[locale] },
      { id: bid(), type: 'text', width: 'wide', html: WATER_HTML[locale] },
      {
        id: bid(),
        type: 'stats',
        items: WATER_STATS.map((s) => ({
          value: s.value,
          suffix: s.suffix?.[locale] ?? null,
          label: s.label[locale],
        })),
      },

      { id: bid(), type: 'heading', level: 2, text: CARE_TITLE[locale] },
      {
        id: bid(),
        type: 'cards',
        numbered: false,
        columns: 4,
        items: CARE_PRINCIPLES.map((c) => ({
          icon: c.icon as never,
          title: c.title[locale],
          text: c.text[locale],
        })),
      },

      { id: bid(), type: 'heading', level: 2, text: SOCIAL_TITLE[locale] },
      {
        id: bid(),
        type: 'cards',
        numbered: false,
        columns: 3,
        items: SOCIAL_BENEFITS.map((c) => ({
          icon: c.icon as never,
          title: c.title[locale],
          text: null,
        })),
      },

      { id: bid(), type: 'heading', level: 2, text: TRAILS_TITLE[locale] },
      { id: bid(), type: 'text', width: 'wide', html: TRAILS_HTML[locale] },
      {
        id: bid(),
        type: 'gallery',
        columns: 4,
        mediaIds: [
          mid('trail-before.jpg'),
          mid('trail-after.jpg'),
          mid('value-health.jpg'),
          mid('value-sport.jpg'),
        ],
      },

      { id: bid(), type: 'heading', level: 2, text: TEAM_TITLE[locale] },
      { id: bid(), type: 'text', width: 'wide', html: TEAM_HTML[locale] },
      {
        id: bid(),
        type: 'gallery',
        columns: 2,
        mediaIds: [mid('team-mdp.jpg'), mid('team-engineerisk.jpg')],
      },
    ],
  });
}

/**
 * Организационная структура — по схеме из документа Заказчика «для сайта».
 *
 * Раньше здесь стояла структура, выведенная из направлений деятельности
 * по Уставу: фактической схемы в материалах не было. Теперь она есть,
 * и узлы воспроизводят её один в один — включая штатную численность.
 */
async function seedStructurePage(): Promise<void> {
  await upsertPage({
    path: 'company/structure',
    title: STRUCTURE_TITLE,
    lead: STRUCTURE_LEAD,
    blocks: (locale) => [
      {
        id: bid(),
        type: 'orgchart',
        nodes: ORG_NODES.map((n) => ({
          id: n.id,
          parentId: n.parentId,
          accent: n.accent,
          stack: n.stack,
          title: n.title[locale],
          subtitle: n.subtitle?.[locale] ?? null,
        })),
      },
      { id: bid(), type: 'text', width: 'wide', html: ORG_HEADCOUNT_HTML[locale] },
    ],
  });
}

/* ------------------------------------------------------------- персоны --- */

/**
 * Правление и Наблюдательный совет.
 *
 * Биографии Заказчик передал только на русском (`bio.ru` — дословно
 * источник). `bio.kk`/`bio.en` — рабочий машинный перевод, сделанный при
 * правках по замечанию QA от 2026-08-17 (п. III ТЗ требует независимый
 * контент по языкам, дублирование русского текста под флагом kk/en этому
 * не соответствовало). Подлежит вычитке носителем языка перед финальной
 * сдачей заказчику.
 */
async function seedPersons(list: PersonContent[], label: string): Promise<void> {
  for (const person of list) {
    const data = {
      board: person.board,
      order: person.order,
      status: PublishStatus.PUBLISHED,
      photoId: mid(person.asset),
    };

    const existing = await prisma.person.findUnique({ where: { slug: person.slug } });
    const translations = LOCALES.map((locale) => ({
      locale,
      fullName: person.fullName[locale],
      position: person.position[locale],
      bio: person.bio?.[locale] ?? null,
    }));

    if (existing) {
      await prisma.$transaction([
        prisma.personTranslation.deleteMany({ where: { personId: existing.id } }),
        prisma.person.update({
          where: { id: existing.id },
          data: { ...data, translations: { create: translations } },
        }),
      ]);
    } else {
      await prisma.person.create({
        data: { slug: person.slug, ...data, translations: { create: translations } },
      });
    }
  }
  console.log(`✓ ${label}: ${list.length} чел.`);
}

/* ------------------------------------------------ государственные закупки */

async function seedProcurementPage(): Promise<void> {
  await upsertPage({
    path: 'corporate/procurement',
    title: PROCUREMENT_TITLE,
    blocks: (locale) => [
      { id: bid(), type: 'text', width: 'wide', html: PROCUREMENT_HTML[locale] },
    ],
  });
}

/* --------------------------------------------------- антикоррупция ------- */

/**
 * Раздел «Антикоррупционная комплаенс-служба» во вкладке Almaty Tau
 * Management (замечание QA от 17.08.2026, п. 7).
 *
 * ТОО «Almaty Tau Management» входит в группу компаний АО «СПК «Алматы»
 * (указано на spkalmaty.kz/companies/too-almaty-tau-management/), и
 * антикоррупционная комплаенс-служба у группы общая — контент и контакт
 * комплаенс-офицера скопированы со страницы spkalmaty.kz/about/antikor/
 * по решению заказчика. Документы — только за 2026 год, файлы лежат
 * в prisma/seed-assets/documents (скачаны с исходной страницы).
 */
const ANTICOR_TITLE: T = {
  ru: 'Антикоррупционная комплаенс-служба',
  kk: 'Сыбайлас жемқорлыққа қарсы комплаенс-қызметі',
  en: 'Anti-Corruption Compliance Service',
};

const ANTICOR_INTRO_HTML: T = {
  ru:
    '<p>Уважаемые клиенты и партнёры ТОО «Almaty Tau Management»!</p>' +
    '<p>В соответствии с антикоррупционным законодательством Республики Казахстан и методическими рекомендациями в группе компаний АО «СПК «Алматы», в которую входит ТОО «Almaty Tau Management», с 2022 года действует антикоррупционная комплаенс-служба.</p>' +
    '<p>Вы можете сообщить о фактах коррупции, мошенничества, дискриминации, неэтичного поведения сотрудников, а также направить предложения по повышению эффективности работы компании.</p>',
  kk:
    '<p>Құрметті «Almaty Tau Management» ЖШС клиенттері мен серіктестері!</p>' +
    '<p>Қазақстан Республикасының сыбайлас жемқорлыққа қарсы заңнамасына және әдістемелік ұсынымдарға сәйкес, «Almaty Tau Management» ЖШС кіретін «СПК «Алматы» АҚ компаниялар тобында 2022 жылдан бастап антикоррупциялық комплаенс-қызметі жұмыс істейді.</p>' +
    '<p>Сіз сыбайлас жемқорлық, алаяқтық, кемсітушілік, қызметкерлердің этикасыз мінез-құлқы фактілері туралы хабарлай аласыз, сондай-ақ компанияның жұмысын жетілдіру жөнінде ұсыныстар жібере аласыз.</p>',
  en:
    '<p>Dear clients and partners of Almaty Tau Management LLP,</p>' +
    "<p>In accordance with the anti-corruption legislation of the Republic of Kazakhstan and applicable methodological guidelines, an anti-corruption compliance service has been operating since 2022 across the group of companies of SPK Almaty JSC, which Almaty Tau Management LLP is part of.</p>" +
    "<p>You may report facts of corruption, fraud, discrimination or unethical conduct by employees, and submit proposals to improve the company's efficiency.</p>",
};

const ANTICOR_CONTACTS_TITLE: T = {
  ru: 'Контакты комплаенс-службы',
  kk: 'Комплаенс-қызметінің байланыстары',
  en: 'Compliance Service Contacts',
};

const ANTICOR_CONTACTS_HTML: T = {
  ru:
    '<p>Телефон: +7 (727) 225-18-91 (внутр. 510), моб.: +7 707 471-11-99</p>' +
    '<p>Email: <a href="mailto:info@spkalmaty.kz">info@spkalmaty.kz</a>, <a href="mailto:s.ospanov@spkalmaty.kz">s.ospanov@spkalmaty.kz</a></p>' +
    '<p><a href="https://spkalmaty.kz/cartogramma/index.php">Картограмма коррупции</a> — интерактивный инструмент для обозначения коррупционных рисков.</p>',
  kk:
    '<p>Телефон: +7 (727) 225-18-91 (ішкі 510), ұялы: +7 707 471-11-99</p>' +
    '<p>Email: <a href="mailto:info@spkalmaty.kz">info@spkalmaty.kz</a>, <a href="mailto:s.ospanov@spkalmaty.kz">s.ospanov@spkalmaty.kz</a></p>' +
    '<p><a href="https://spkalmaty.kz/cartogramma/index.php">Сыбайлас жемқорлық картограммасы</a> — сыбайлас жемқорлық тәуекелдерін белгілеуге арналған интерактивті құрал.</p>',
  en:
    '<p>Phone: +7 (727) 225-18-91 (ext. 510), mobile: +7 707 471-11-99</p>' +
    '<p>Email: <a href="mailto:info@spkalmaty.kz">info@spkalmaty.kz</a>, <a href="mailto:s.ospanov@spkalmaty.kz">s.ospanov@spkalmaty.kz</a></p>' +
    '<p><a href="https://spkalmaty.kz/cartogramma/index.php">Corruption Cartogram</a> — an interactive tool for mapping corruption risks.</p>',
};

const ANTICOR_DOCS_HEADING: T = {
  ru: 'Документы 2026 года',
  kk: '2026 жылғы құжаттар',
  en: '2026 Documents',
};

const ANTICOR_CATEGORY_TITLE: T = {
  ru: 'Антикоррупция',
  kk: 'Сыбайлас жемқорлыққа қарсы іс-қимыл',
  en: 'Anti-Corruption',
};

const ANTICOR_DOCS: SeedDocument[] = [
  {
    file: 'anticor-2026-compliance-program.pdf',
    order: 0,
    documentDate: new Date('2026-01-01'),
    title: {
      ru: 'Антикоррупционная комплаенс-программа на 2026 год',
      kk: '2026 жылға арналған сыбайлас жемқорлыққа қарсы комплаенс-бағдарлама',
      en: 'Anti-Corruption Compliance Programme for 2026',
    },
  },
  {
    file: 'anticor-2026-training-plan.pdf',
    order: 1,
    documentDate: new Date('2026-01-01'),
    title: {
      ru: 'Тематический план обучений на 2026 год',
      kk: '2026 жылға арналған оқыту тақырыптық жоспары',
      en: 'Thematic Training Plan for 2026',
    },
  },
  {
    file: 'anticor-2026-vakr-announcement.docx',
    order: 2,
    documentDate: new Date('2026-01-01'),
    title: {
      ru: 'Анонсирование о начале ВАКР в АО «СПК «Алматы» и ДЗО в 2026 году',
      kk: '«СПК «Алматы» АҚ және ЕҰ-да 2026 жылы ішкі сыбайлас жемқорлық тәуекелдерін талдауды (ВАКР) бастау туралы хабарландыру',
      en: 'Announcement of the Start of the 2026 Internal Corruption Risk Analysis (VAKR) at SPK Almaty JSC and its Subsidiaries',
    },
  },
  {
    file: 'anticor-2026-vakr-schedule.pdf',
    order: 3,
    documentDate: new Date('2026-01-01'),
    title: {
      ru: 'График проведения ВАКР на 2026 год',
      kk: '2026 жылға арналған ВАКР өткізу графигі',
      en: '2026 VAKR Schedule',
    },
  },
  {
    file: 'anticor-2026-vakr-analytical-report.pdf',
    order: 4,
    documentDate: new Date('2026-05-12'),
    title: {
      ru: 'Аналитическая справка по результатам ВАКР в АО «СПК «Алматы» и ДЗО',
      kk: '«СПК «Алматы» АҚ және ЕҰ-дағы ВАКР нәтижелері бойынша талдамалық анықтама',
      en: 'Analytical Report on VAKR Results at SPK Almaty JSC and its Subsidiaries',
    },
  },
  {
    file: 'anticor-2026-public-discussion-announcement.docx',
    order: 5,
    documentDate: new Date('2026-05-12'),
    title: {
      ru: 'Анонсирование о начале публичного обсуждения результатов ВАКР в АО «СПК «Алматы» и ДЗО от 12.05.2026',
      kk: '«СПК «Алматы» АҚ және ЕҰ-дағы ВАКР нәтижелерін 12.05.2026 жылдан бастап жария талқылауды бастау туралы хабарландыру',
      en: 'Announcement of Public Discussion of VAKR Results at SPK Almaty JSC and its Subsidiaries (from 12 May 2026)',
    },
  },
];

async function seedAnticorruptionPage(): Promise<void> {
  await prepareDocumentStorage();

  const category = await prisma.documentCategory.upsert({
    where: { slug: 'anticorruption' },
    update: {},
    create: {
      slug: 'anticorruption',
      order: 100,
      translations: {
        create: LOCALES.map((locale) => ({ locale, title: ANTICOR_CATEGORY_TITLE[locale] })),
      },
    },
  });

  const documentIds: string[] = [];
  for (const doc of ANTICOR_DOCS) {
    documentIds.push(await upsertDocumentFile(prisma, category.id, doc));
  }

  await upsertPage({
    path: 'company/anticorruption',
    title: ANTICOR_TITLE,
    blocks: (locale) => [
      { id: bid(), type: 'text', width: 'wide', html: ANTICOR_INTRO_HTML[locale] },
      { id: bid(), type: 'heading', level: 2, text: ANTICOR_CONTACTS_TITLE[locale] },
      { id: bid(), type: 'text', width: 'wide', html: ANTICOR_CONTACTS_HTML[locale] },
      { id: bid(), type: 'heading', level: 2, text: ANTICOR_DOCS_HEADING[locale] },
      { id: bid(), type: 'file', documentIds, title: null },
    ],
  });
  console.log('✓ Страница «Антикоррупционная комплаенс-служба»');
}

/**
 * Текст политики конфиденциальности.
 *
 * Источник — приложенный Заказчиком файл «Политика конфиденциальности.docx»
 * (замечание от 19.08.2026, п. 11). Английского перевода в исходнике нет,
 * поэтому для en страница остаётся пустой до появления перевода.
 *
 * Публично на странице пока не ссылаются: кнопка в футере временно ведёт на
 * egov.kz (п. 8) — так решил Заказчик, пока собственная политика не готова
 * к публикации. Текст здесь подготовлен заранее, чтобы вернуть ссылку можно
 * было одной правкой в Footer.tsx.
 */
const PRIVACY_BLOCKS_RU = [
      { id: "privacy-ru-h1", type: 'heading', level: 2, text: "1. Общие положения" },
      { id: "privacy-ru-t2", type: 'text', width: 'wide', html: "<p>1.1. Настоящая Политика конфиденциальности и обработки персональных данных (далее — Политика) определяет порядок сбора, обработки, хранения и защиты персональных данных пользователей официального интернет-ресурса ТОО «Almaty Tau Management» (далее — Сайт).</p><p>1.2. Политика разработана в соответствии с Законом Республики Казахстан от 21 мая 2013 года № 94-V «О персональных данных и их защите», иными нормативными правовыми актами Республики Казахстан в области персональных данных, информатизации и защиты информации.</p><p>1.3. Собственником и (или) оператором базы, содержащей персональные данные, является: ТОО «Almaty Tau Management»</p><p>1.4. Настоящая Политика применяется к персональным данным, которые Оператор получает от физических лиц при использовании ими Сайта, в том числе при направлении обращений и запросов посредством размещенных на Сайте электронных форм.</p><p>1.5. Использование отдельных функций Сайта, предусматривающих предоставление персональных данных, осуществляется при условии ознакомления Пользователя с настоящей Политикой и предоставления согласия на сбор и обработку персональных данных в случаях и порядке, предусмотренных законодательством Республики Казахстан.</p>" },
      { id: "privacy-ru-h3", type: 'heading', level: 2, text: "2. Основные понятия" },
      { id: "privacy-ru-t4", type: 'text', width: 'wide', html: "<p>2.1. Для целей настоящей Политики используются следующие основные понятия:</p><p>Пользователь — физическое лицо, посещающее и/или использующее Сайт;</p><p>персональные данные — сведения, относящиеся к определенному или определяемому на их основании субъекту персональных данных, зафиксированные на электронном, бумажном и (или) ином материальном носителе;</p><p>обработка персональных данных — действия, направленные на накопление, хранение, изменение, дополнение, использование, распространение, обезличивание, блокирование и уничтожение персональных данных;</p><p>сбор персональных данных — действия, направленные на получение персональных данных;</p><p>обезличивание персональных данных — действия, в результате которых определение принадлежности персональных данных конкретному субъекту становится невозможным;</p><p>cookie-файлы — небольшие фрагменты данных, сохраняемые на устройстве Пользователя при посещении Сайта и используемые для обеспечения его функционирования, анализа посещаемости и улучшения качества работы Сайта.</p>" },
      { id: "privacy-ru-h5", type: 'heading', level: 2, text: "3. Перечень обрабатываемых данных" },
      { id: "privacy-ru-t6", type: 'text', width: 'wide', html: "<p>3.1. При заполнении Пользователем формы обращения или запроса на Сайте Оператор может осуществлять сбор и обработку следующих персональных данных:</p><p>фамилия, имя, отчество;</p><p>адрес электронной почты;</p><p>номер телефона;</p><p>сведения, добровольно предоставленные Пользователем в тексте обращения или запроса.</p><p>3.2. Оператор осуществляет сбор только тех персональных данных, которые являются необходимыми и достаточными для достижения целей их обработки.</p><p>3.3. При посещении Сайта также могут автоматически собираться технические и обезличенные сведения, в том числе с использованием файлов cookie и сервисов интернет-статистики и веб-аналитики, включая Яндекс Метрику, Google Analytics и иные используемые Оператором сервисы.</p><p>К таким сведениям в зависимости от используемых технологий могут относиться данные о посещении Сайта, типе браузера и устройства, действиях Пользователя на Сайте, просмотренных страницах, продолжительности посещения, источнике перехода и иные технические сведения.</p>" },
      { id: "privacy-ru-h7", type: 'heading', level: 2, text: "4. Цели обработки персональных данных" },
      { id: "privacy-ru-t8", type: 'text', width: 'wide', html: "<p>4.1. Персональные данные Пользователей обрабатываются исключительно в заранее определенных и законных целях.</p><p>4.2. Персональные данные, предоставленные посредством формы обращения или запроса, могут обрабатываться в целях:</p><p>приема, регистрации и рассмотрения обращения или запроса Пользователя;</p><p>подготовки и направления ответа на обращение;</p><p>обратной связи с Пользователем по вопросам, указанным в обращении;</p><p>направления Пользователю информации по существу его запроса посредством электронной почты и/или телефонной связи;</p><p>выполнения обязанностей Оператора, установленных законодательством Республики Казахстан.</p><p>4.3. Обезличенные и технические данные, собираемые с помощью файлов cookie и сервисов интернет-статистики, используются в целях:</p><p>анализа посещаемости Сайта;</p><p>получения статистической информации об использовании Сайта;</p><p>анализа действий Пользователей на Сайте;</p><p>улучшения функциональности, качества работы и содержания Сайта;</p><p>выявления и устранения технических ошибок.</p><p>4.4. Не допускается обработка персональных данных, несовместимая с заявленными целями их сбора.</p>" },
      { id: "privacy-ru-h9", type: 'heading', level: 2, text: "5. Основания и условия обработки персональных данных" },
      { id: "privacy-ru-t10", type: 'text', width: 'wide', html: "<p>5.1. Сбор и обработка персональных данных осуществляются с согласия Пользователя, за исключением случаев, предусмотренных законодательством Республики Казахстан.</p><p>5.2. Согласие Пользователя на сбор и обработку персональных данных может предоставляться в электронной форме посредством совершения соответствующего действия на Сайте, в том числе путем установки отметки («чекбокса») в поле согласия перед отправкой формы.</p><p>5.3. До предоставления согласия Пользователю должна быть обеспечена возможность ознакомиться с настоящей Политикой.</p><p>5.4. Пользователь самостоятельно принимает решение о предоставлении своих персональных данных и дает согласие на их обработку свободно и осознанно.</p><p>5.5. Пользователь несет ответственность за достоверность и актуальность предоставляемых им сведений.</p>" },
      { id: "privacy-ru-h11", type: 'heading', level: 2, text: "6. Порядок обработки и хранения персональных данных" },
      { id: "privacy-ru-t12", type: 'text', width: 'wide', html: "<p>6.1. Оператор осуществляет сбор, накопление, хранение, изменение, дополнение, использование, обезличивание, блокирование и уничтожение персональных данных в объеме, необходимом для достижения целей, предусмотренных настоящей Политикой.</p><p>6.2. Обработка персональных данных осуществляется с соблюдением принципов законности, конфиденциальности, ограничения обработки конкретными и заранее определенными целями, а также обеспечения безопасности персональных данных.</p><p>6.3. Персональные данные хранятся не дольше, чем этого требуют цели их обработки, если иной срок хранения не установлен законодательством Республики Казахстан.</p><p>6.4. После достижения целей обработки либо при прекращении правовых оснований для обработки персональные данные подлежат уничтожению или обезличиванию в порядке, установленном законодательством Республики Казахстан.</p><p>6.5. Хранение персональных данных в электронных информационных ресурсах осуществляется с соблюдением требований законодательства Республики Казахстан к размещению и защите баз, содержащих персональные данные.</p>" },
      { id: "privacy-ru-h13", type: 'heading', level: 2, text: "7. Передача персональных данных третьим лицам" },
      { id: "privacy-ru-t14", type: 'text', width: 'wide', html: "<p>7.1. Оператор не распространяет персональные данные Пользователей и не предоставляет их третьим лицам без согласия Пользователя, за исключением случаев, прямо предусмотренных законодательством Республики Казахстан.</p><p>7.2. Доступ к персональным данным может предоставляться работникам Оператора и привлеченным лицам исключительно в объеме, необходимом для выполнения их должностных или договорных обязанностей и достижения целей обработки персональных данных.</p><p>7.3. В случае привлечения третьих лиц к обработке персональных данных Оператор принимает необходимые меры для обеспечения конфиденциальности и защиты таких данных в соответствии с законодательством Республики Казахстан.</p><p>7.4. Передача персональных данных государственным органам и иным уполномоченным лицам осуществляется в случаях и порядке, предусмотренных законодательством Республики Казахстан.</p><p>7.5. Трансграничная передача персональных данных осуществляется исключительно при наличии предусмотренных законодательством Республики Казахстан оснований и с соблюдением установленных требований.</p>" },
      { id: "privacy-ru-h15", type: 'heading', level: 2, text: "8. Использование файлов cookie и сервисов веб-аналитики" },
      { id: "privacy-ru-t16", type: 'text', width: 'wide', html: "<p>8.1. Сайт может использовать файлы cookie, необходимые для корректной работы его функциональных возможностей, а также аналитические cookie для получения статистической информации.</p><p>8.2. Для анализа посещаемости и использования Сайта могут применяться сервисы веб-аналитики, в том числе Яндекс Метрика, Google Analytics и иные аналогичные сервисы.</p><p>8.3. Информация, собираемая посредством таких технологий, используется преимущественно в обезличенном или агрегированном виде для анализа работы Сайта и его совершенствования.</p><p>8.4. Пользователь может ограничить или отключить использование файлов cookie посредством настроек своего браузера. Отключение отдельных cookie может повлиять на корректность работы некоторых функций Сайта.</p><p>8.5. В случаях, когда использование определенных файлов cookie или аналитических технологий требует получения согласия Пользователя в соответствии с применимым законодательством, такие технологии используются после получения соответствующего согласия.</p>" },
      { id: "privacy-ru-h17", type: 'heading', level: 2, text: "9. Защита персональных данных" },
      { id: "privacy-ru-t18", type: 'text', width: 'wide', html: "<p>9.1. Оператор принимает необходимые правовые, организационные и технические меры для защиты персональных данных от неправомерного или случайного доступа, изменения, блокирования, копирования, предоставления, распространения, уничтожения, а также от иных неправомерных действий.</p><p>9.2. Доступ к персональным данным предоставляется только лицам, которым он необходим для выполнения соответствующих функций.</p><p>9.3. Оператор принимает меры по обеспечению конфиденциальности, целостности и сохранности персональных данных, а также по предотвращению их незаконного сбора и обработки.</p><p>9.4. Обязанности по защите персональных данных действуют с момента их сбора до момента их уничтожения либо обезличивания.</p>" },
      { id: "privacy-ru-h19", type: 'heading', level: 2, text: "10. Права Пользователя" },
      { id: "privacy-ru-t20", type: 'text', width: 'wide', html: "<p>10.1. Пользователь вправе в порядке, предусмотренном законодательством Республики Казахстан:</p><p>получать информацию о наличии у Оператора своих персональных данных;</p><p>получать информацию, касающуюся сбора и обработки своих персональных данных;</p><p>требовать изменения и дополнения своих персональных данных при наличии оснований;</p><p>требовать блокирования персональных данных в предусмотренных законодательством случаях;</p><p>требовать уничтожения персональных данных, сбор и обработка которых произведены с нарушением законодательства Республики Казахстан;</p><p>отозвать согласие на сбор и обработку персональных данных в случаях, когда такой отзыв допускается законодательством;</p><p>осуществлять иные права, предусмотренные законодательством Республики Казахстан.</p><p>10.2. Для реализации своих прав Пользователь может направить обращение Оператору по адресу электронной почты: info@almatytm.kz</p>" },
      { id: "privacy-ru-h21", type: 'heading', level: 2, text: "11. Согласие на обработку персональных данных" },
      { id: "privacy-ru-t22", type: 'text', width: 'wide', html: "<p>11.1. Направляя заполненную форму обращения на Сайте и предоставляя согласие на обработку персональных данных, Пользователь подтверждает, что:</p><p>ознакомился с настоящей Политикой;</p><p>понимает цели и условия обработки персональных данных;</p><p>предоставляет указанные сведения добровольно;</p><p>дает согласие на их сбор и обработку в целях, предусмотренных настоящей Политикой.</p><p>11.2. Если Пользователь не согласен с условиями обработки персональных данных, он не должен предоставлять персональные данные через соответствующие формы Сайта.</p>" },
      { id: "privacy-ru-h23", type: 'heading', level: 2, text: "12. Заключительные положения" },
      { id: "privacy-ru-t24", type: 'text', width: 'wide', html: "<p>12.1. Настоящая Политика является общедоступным документом и размещается на Сайте.</p><p>12.2. Оператор вправе вносить изменения и дополнения в настоящую Политику в связи с изменением законодательства Республики Казахстан, функциональности Сайта, состава обрабатываемых данных или порядка их обработки.</p><p>12.3. Новая редакция Политики вступает в силу с момента ее размещения на Сайте, если иной срок не установлен в самой новой редакции.</p><p>12.4. Вопросы, не урегулированные настоящей Политикой, регулируются законодательством Республики Казахстан.</p><p>ТОО «Almaty Tau Management»</p><p>Адрес: 050040, г. Алматы, ул. Байзакова, 303, Дом инвестиций, 2 этаж.</p><p>E-mail по вопросам обработки персональных данных: info@almatytm.kz</p>" },
    ] as const;

const PRIVACY_BLOCKS_KK = [
      { id: "privacy-kk-h1", type: 'heading', level: 2, text: "1. Жалпы ережелер" },
      { id: "privacy-kk-t2", type: 'text', width: 'wide', html: "<p>1.1. Осы Құпиялылық және дербес деректерді өңдеу саясаты (бұдан әрі — Саясат) «Almaty Tau Management» ЖШС-нің ресми интернет-ресурсын (бұдан әрі — Сайт) пайдаланушылардың дербес деректерін жинау, өңдеу, сақтау және қорғау тәртібін айқындайды.</p><p>1.2. Саясат Қазақстан Республикасының 2013 жылғы 21 мамырдағы № 94-V «Дербес деректер және оларды қорғау туралы» Заңына, сондай-ақ Қазақстан Республикасының дербес деректер, ақпараттандыру және ақпаратты қорғау саласындағы өзге де нормативтік құқықтық актілеріне сәйкес әзірленді.</p><p>1.3. Дербес деректерді қамтитын базаның меншік иесі және (немесе) операторы:</p><p>«Almaty Tau Management» ЖШС</p><p>бұдан әрі — Оператор.</p><p>1.4. Осы Саясат Оператор Сайтты пайдалану барысында жеке тұлғалардан, оның ішінде Сайтта орналастырылған электрондық нысандар арқылы өтініштер мен сұрау салуларды жіберу кезінде алатын дербес деректерге қолданылады.</p><p>1.5. Дербес деректерді ұсынуды көздейтін Сайттың жекелеген функцияларын пайдалану Пайдаланушының осы Саясатпен танысуы және Қазақстан Республикасының заңнамасында көзделген жағдайларда және тәртіппен дербес деректерді жинауға және өңдеуге келісім беруі шартымен жүзеге асырылады.</p>" },
      { id: "privacy-kk-h3", type: 'heading', level: 2, text: "2. Негізгі ұғымдар" },
      { id: "privacy-kk-t4", type: 'text', width: 'wide', html: "<p>2.1. Осы Саясаттың мақсаттары үшін мынадай негізгі ұғымдар пайдаланылады:</p><p>Пайдаланушы — Сайтқа кіретін және/немесе оны пайдаланатын жеке тұлға;</p><p>дербес деректер — белгілі бір немесе солардың негізінде айқындалатын дербес деректер субъектісіне қатысты, электрондық, қағаз және (немесе) өзге де материалдық жеткізгіште тіркелген мәліметтер;</p><p>дербес деректерді өңдеу — дербес деректерді жинақтауға, сақтауға, өзгертуге, толықтыруға, пайдалануға, таратуға, иесіздендіруге, бұғаттауға және жоюға бағытталған әрекеттер;</p><p>дербес деректерді жинау — дербес деректерді алуға бағытталған әрекеттер;</p><p>дербес деректерді иесіздендіру — нәтижесінде дербес деректердің нақты дербес деректер субъектісіне тиесілілігін айқындау мүмкін болмайтын әрекеттер;</p><p>cookie-файлдар — Пайдаланушы Сайтқа кірген кезде оның құрылғысында сақталатын және Сайттың жұмыс істеуін қамтамасыз ету, кірушілер санын талдау және Сайт жұмысының сапасын жақсарту үшін пайдаланылатын шағын деректер фрагменттері.</p>" },
      { id: "privacy-kk-h5", type: 'heading', level: 2, text: "3. Өңделетін деректердің тізбесі" },
      { id: "privacy-kk-t6", type: 'text', width: 'wide', html: "<p>3.1. Пайдаланушы Сайттағы өтініш немесе сұрау салу нысанын толтырған кезде Оператор мынадай дербес деректерді жинауды және өңдеуді жүзеге асыра алады:</p><p>тегі, аты, әкесінің аты;</p><p>электрондық пошта мекенжайы;</p><p>телефон нөмірі;</p><p>Пайдаланушы өтініштің немесе сұрау салудың мәтінінде ерікті түрде ұсынған мәліметтер.</p><p>3.2. Оператор дербес деректерді өңдеу мақсаттарына қол жеткізу үшін қажетті және жеткілікті дербес деректерді ғана жинауды жүзеге асырады.</p><p>3.3. Сайтқа кірген кезде техникалық және иесіздендірілген мәліметтер, оның ішінде cookie-файлдар, интернет-статистика және веб-талдау сервистері, соның ішінде Яндекс Метрика, Google Analytics және Оператор пайдаланатын өзге де сервистер арқылы автоматты түрде жиналуы мүмкін.</p><p>Пайдаланылатын технологияларға байланысты мұндай мәліметтерге Сайтқа кіру туралы деректер, браузер мен құрылғының түрі, Пайдаланушының Сайттағы әрекеттері, қаралған беттер, Сайтта болу ұзақтығы, Сайтқа өту көзі және өзге де техникалық мәліметтер жатуы мүмкін.</p>" },
      { id: "privacy-kk-h7", type: 'heading', level: 2, text: "4. Дербес деректерді өңдеу мақсаттары" },
      { id: "privacy-kk-t8", type: 'text', width: 'wide', html: "<p>4.1. Пайдаланушылардың дербес деректері тек алдын ала айқындалған және заңды мақсаттарда өңделеді.</p><p>4.2. Өтініш немесе сұрау салу нысаны арқылы ұсынылған дербес деректер мынадай мақсаттарда өңделуі мүмкін:</p><p>Пайдаланушының өтінішін немесе сұрау салуын қабылдау, тіркеу және қарау;</p><p>өтінішке жауап дайындау және жіберу;</p><p>өтініште көрсетілген мәселелер бойынша Пайдаланушымен кері байланыс орнату;</p><p>Пайдаланушының сұрау салуының мәні бойынша ақпаратты электрондық пошта және/немесе телефон байланысы арқылы жіберу;</p><p>Қазақстан Республикасының заңнамасында белгіленген Оператор міндеттерін орындау.</p><p>4.3. Cookie-файлдар мен интернет-статистика сервистері арқылы жиналатын иесіздендірілген және техникалық деректер мынадай мақсаттарда пайдаланылады:</p><p>Сайтқа кіру статистикасын талдау;</p><p>Сайтты пайдалану туралы статистикалық ақпарат алу;</p><p>Пайдаланушылардың Сайттағы әрекеттерін талдау;</p><p>Сайттың функционалдық мүмкіндіктерін, жұмыс сапасын және мазмұнын жақсарту;</p><p>техникалық қателерді анықтау және жою.</p><p>4.4. Дербес деректерді оларды жинаудың мәлімделген мақсаттарына сәйкес келмейтін мақсаттарда өңдеуге жол берілмейді.</p>" },
      { id: "privacy-kk-h9", type: 'heading', level: 2, text: "5. Дербес деректерді өңдеудің негіздері мен шарттары" },
      { id: "privacy-kk-t10", type: 'text', width: 'wide', html: "<p>5.1. Дербес деректерді жинау және өңдеу Қазақстан Республикасының заңнамасында көзделген жағдайларды қоспағанда, Пайдаланушының келісімімен жүзеге асырылады.</p><p>5.2. Пайдаланушының дербес деректерді жинауға және өңдеуге келісімі Сайтта тиісті әрекет жасау арқылы электрондық нысанда, оның ішінде нысанды жіберер алдында келісім жолағына тиісті белгі («чекбокс») қою арқылы берілуі мүмкін.</p><p>5.3. Келісім бергенге дейін Пайдаланушыға осы Саясатпен танысу мүмкіндігі қамтамасыз етілуге тиіс.</p><p>5.4. Пайдаланушы өзінің дербес деректерін ұсыну туралы шешімді дербес қабылдайды және оларды өңдеуге еркін әрі саналы түрде келісім береді.</p><p>5.5. Пайдаланушы өзі ұсынған мәліметтердің дұрыстығы мен өзектілігі үшін жауапты болады.</p>" },
      { id: "privacy-kk-h11", type: 'heading', level: 2, text: "6. Дербес деректерді өңдеу және сақтау тәртібі" },
      { id: "privacy-kk-t12", type: 'text', width: 'wide', html: "<p>6.1. Оператор осы Саясатта көзделген мақсаттарға қол жеткізу үшін қажетті көлемде дербес деректерді жинауды, жинақтауды, сақтауды, өзгертуді, толықтыруды, пайдалануды, иесіздендіруді, бұғаттауды және жоюды жүзеге асырады.</p><p>6.2. Дербес деректерді өңдеу заңдылық, құпиялылық, өңдеуді нақты және алдын ала айқындалған мақсаттармен шектеу, сондай-ақ дербес деректердің қауіпсіздігін қамтамасыз ету қағидаттарын сақтай отырып жүзеге асырылады.</p><p>6.3. Егер Қазақстан Республикасының заңнамасында өзге сақтау мерзімі белгіленбесе, дербес деректер оларды өңдеу мақсаттары талап ететін мерзімнен артық сақталмайды.</p><p>6.4. Өңдеу мақсаттарына қол жеткізілгеннен кейін не дербес деректерді өңдеудің құқықтық негіздері тоқтатылған жағдайда, дербес деректер Қазақстан Республикасының заңнамасында белгіленген тәртіппен жойылуға немесе иесіздендірілуге тиіс.</p><p>6.5. Электрондық ақпараттық ресурстардағы дербес деректерді сақтау Қазақстан Республикасының дербес деректерді қамтитын базаларды орналастыру және қорғау жөніндегі заңнама талаптарын сақтай отырып жүзеге асырылады.</p>" },
      { id: "privacy-kk-h13", type: 'heading', level: 2, text: "7. Дербес деректерді үшінші тұлғаларға беру" },
      { id: "privacy-kk-t14", type: 'text', width: 'wide', html: "<p>7.1. Қазақстан Республикасының заңнамасында тікелей көзделген жағдайларды қоспағанда, Оператор Пайдаланушылардың дербес деректерін олардың келісімінсіз таратпайды және үшінші тұлғаларға бермейді.</p><p>7.2. Дербес деректерге қол жеткізу Оператордың қызметкерлеріне және тартылған тұлғаларға олардың лауазымдық немесе шарттық міндеттерін орындау және дербес деректерді өңдеу мақсаттарына қол жеткізу үшін қажетті көлемде ғана берілуі мүмкін.</p><p>7.3. Дербес деректерді өңдеуге үшінші тұлғалар тартылған жағдайда Оператор Қазақстан Республикасының заңнамасына сәйкес мұндай деректердің құпиялылығы мен қорғалуын қамтамасыз ету үшін қажетті шараларды қабылдайды.</p><p>7.4. Дербес деректерді мемлекеттік органдарға және өзге де уәкілетті тұлғаларға беру Қазақстан Республикасының заңнамасында көзделген жағдайларда және тәртіппен жүзеге асырылады.</p><p>7.5. Дербес деректерді трансшекаралық беру Қазақстан Республикасының заңнамасында көзделген негіздер болған кезде және белгіленген талаптарды сақтай отырып қана жүзеге асырылады.</p>" },
      { id: "privacy-kk-h15", type: 'heading', level: 2, text: "8. Cookie-файлдар мен веб-талдау сервистерін пайдалану" },
      { id: "privacy-kk-t16", type: 'text', width: 'wide', html: "<p>8.1. Сайт өзінің функционалдық мүмкіндіктерінің дұрыс жұмыс істеуі үшін қажетті cookie-файлдарды, сондай-ақ статистикалық ақпарат алу үшін аналитикалық cookie-файлдарды пайдалана алады.</p><p>8.2. Сайтқа кіру мен оны пайдалануды талдау үшін Яндекс Метрика, Google Analytics және өзге де осыған ұқсас веб-талдау сервистері қолданылуы мүмкін.</p><p>8.3. Осындай технологиялар арқылы жиналатын ақпарат негізінен Сайттың жұмысын талдау және оны жетілдіру мақсатында иесіздендірілген немесе жинақталған түрде пайдаланылады.</p><p>8.4. Пайдаланушы өз браузерінің баптаулары арқылы cookie-файлдарды пайдалануды шектей немесе өшіре алады. Жекелеген cookie-файлдарды өшіру Сайттың кейбір функцияларының дұрыс жұмыс істеуіне әсер етуі мүмкін.</p><p>8.5. Қолданылатын заңнамаға сәйкес белгілі бір cookie-файлдарды немесе аналитикалық технологияларды пайдалану үшін Пайдаланушының келісімін алу талап етілетін жағдайларда, мұндай технологиялар тиісті келісім алынғаннан кейін пайдаланылады.</p>" },
      { id: "privacy-kk-h17", type: 'heading', level: 2, text: "9. Дербес деректерді қорғау" },
      { id: "privacy-kk-t18", type: 'text', width: 'wide', html: "<p>9.1. Оператор дербес деректерді заңсыз немесе кездейсоқ қол жеткізуден, өзгертуден, бұғаттаудан, көшіруден, беруден, таратудан, жоюдан, сондай-ақ өзге де заңсыз әрекеттерден қорғау үшін қажетті құқықтық, ұйымдастырушылық және техникалық шараларды қабылдайды.</p><p>9.2. Дербес деректерге қол жеткізу тиісті функцияларды орындау үшін мұндай қолжетімділік қажет тұлғаларға ғана беріледі.</p><p>9.3. Оператор дербес деректердің құпиялылығын, тұтастығын және сақталуын қамтамасыз ету, сондай-ақ оларды заңсыз жинау мен өңдеуге жол бермеу жөніндегі шараларды қабылдайды.</p><p>9.4. Дербес деректерді қорғау жөніндегі міндеттер оларды жинаған сәттен бастап жойылған немесе иесіздендірілген сәтке дейін қолданылады.</p>" },
      { id: "privacy-kk-h19", type: 'heading', level: 2, text: "10. Пайдаланушының құқықтары" },
      { id: "privacy-kk-t20", type: 'text', width: 'wide', html: "<p>10.1. Пайдаланушы Қазақстан Республикасының заңнамасында көзделген тәртіппен:</p><p>Операторда өзінің дербес деректерінің бар-жоғы туралы ақпарат алуға;</p><p>өзінің дербес деректерін жинауға және өңдеуге қатысты ақпарат алуға;</p><p>негіздер болған жағдайда өзінің дербес деректерін өзгертуді және толықтыруды талап етуге;</p><p>заңнамада көзделген жағдайларда дербес деректерді бұғаттауды талап етуге;</p><p>Қазақстан Республикасының заңнамасын бұза отырып жиналған және өңделген дербес деректерді жоюды талап етуге;</p><p>заңнамада мұндай кері қайтарып алуға жол берілетін жағдайларда дербес деректерді жинауға және өңдеуге берген келісімін кері қайтарып алуға;</p><p>Қазақстан Республикасының заңнамасында көзделген өзге де құқықтарды жүзеге асыруға құқылы.</p><p>10.2. Өз құқықтарын іске асыру үшін Пайдаланушы Операторға мына электрондық пошта мекенжайы бойынша өтініш жібере алады: info@almatytm.kz.</p>" },
      { id: "privacy-kk-h21", type: 'heading', level: 2, text: "11. Дербес деректерді өңдеуге келісім" },
      { id: "privacy-kk-t22", type: 'text', width: 'wide', html: "<p>11.1. Сайтта толтырылған өтініш нысанын жіберу және дербес деректерді өңдеуге келісім беру арқылы Пайдаланушы:</p><p>осы Саясатпен танысқанын;</p><p>дербес деректерді өңдеудің мақсаттары мен шарттарын түсінетінін;</p><p>көрсетілген мәліметтерді ерікті түрде ұсынатынын;</p><p>осы Саясатта көзделген мақсаттарда оларды жинауға және өңдеуге келісім беретінін растайды.</p><p>11.2. Егер Пайдаланушы дербес деректерді өңдеу шарттарымен келіспесе, ол Сайттағы тиісті нысандар арқылы дербес деректерін ұсынбауға тиіс.</p>" },
      { id: "privacy-kk-h23", type: 'heading', level: 2, text: "12. Қорытынды ережелер" },
      { id: "privacy-kk-t24", type: 'text', width: 'wide', html: "<p>12.1. Осы Саясат жалпыға қолжетімді құжат болып табылады және Сайтта орналастырылады.</p><p>12.2. Оператор Қазақстан Республикасының заңнамасы, Сайттың функционалдық мүмкіндіктері, өңделетін деректердің құрамы немесе оларды өңдеу тәртібі өзгерген жағдайда осы Саясатқа өзгерістер мен толықтырулар енгізуге құқылы.</p><p>12.3. Егер Саясаттың жаңа редакциясында өзге мерзім белгіленбесе, оның жаңа редакциясы Сайтта орналастырылған сәттен бастап күшіне енеді.</p><p>12.4. Осы Саясатпен реттелмеген мәселелер Қазақстан Республикасының заңнамасына сәйкес реттеледі.</p><p>«Almaty Tau Management» ЖШС</p><p>Мекенжайы: 050040, Алматы қаласы, Байзақов көшесі, 303, Инвестициялар үйі, 2-қабат</p><p>Дербес деректерді өңдеу мәселелері бойынша электрондық пошта: info@almatytm.kz</p>" },
    ] as const;

async function seedPrivacyPage(): Promise<void> {
  await upsertPage({
    path: 'privacy',
    title: { ru: 'Политика конфиденциальности', kk: 'Құпиялылық саясаты', en: 'Privacy Policy' },
    blocks: (locale) =>
      (locale === 'ru' ? PRIVACY_BLOCKS_RU : locale === 'kk' ? PRIVACY_BLOCKS_KK : []) as never,
  });
}

/**
 * Пункт меню «Антикоррупционная комплаенс-служба» под «Almaty Tau Management».
 *
 * seedMenu() в seed.ts заполняет меню только один раз (пропускает себя, если
 * пунктов уже больше нуля) — на уже развёрнутой базе новые узлы в его массиве
 * не появятся повторным запуском. Добавляем недостающий пункт отдельно и
 * идемпотентно: ищем родителя «company», проверяем, нет ли уже ребёнка
 * с этим href, и только тогда создаём.
 */
async function addAnticorruptionMenuItem(): Promise<void> {
  // Родителя ищем по устойчивому дочернему пункту, а не по собственному href
  // родителя: последний по замечанию Заказчика от 19.08.2026 (п. 10) может
  // быть пустым (пункт ведёт на главную), а не 'company'.
  const aboutChild = await prisma.menuItem.findFirst({ where: { location: 'MAIN', href: 'company/about' } });
  const parent = aboutChild?.parentId
    ? await prisma.menuItem.findUnique({ where: { id: aboutChild.parentId } })
    : null;
  if (!parent) {
    console.log('⚠ Пункт меню «company» не найден — пункт «Антикоррупция» не добавлен');
    return;
  }

  const existing = await prisma.menuItem.findFirst({ where: { parentId: parent.id, href: 'company/anticorruption' } });
  if (existing) {
    console.log('✓ Пункт меню «Антикоррупция» уже существует — пропускаем');
    return;
  }

  const siblingsCount = await prisma.menuItem.count({ where: { parentId: parent.id } });
  await prisma.menuItem.create({
    data: {
      location: 'MAIN',
      href: 'company/anticorruption',
      parentId: parent.id,
      order: siblingsCount,
      translations: { create: LOCALES.map((locale) => ({ locale, title: ANTICOR_TITLE[locale] })) },
    },
  });
  console.log('✓ Пункт меню «Антикоррупция» добавлен под «Almaty Tau Management»');
}

/* --------------------------------------------------------------- контакты */

/**
 * Реальные контакты вместо заглушек.
 *
 * В сиде стояли «+7 (727) 000-00-00» и info@atm.kz — очевидные заполнители.
 * Настоящие данные есть только в документе «для сайта», поэтому берём их
 * оттуда. Адрес и координаты не трогаем: они уже выставлены по замечаниям.
 */
async function seedContacts(): Promise<void> {
  const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
  if (!settings) {
    console.log('! Настройки сайта не найдены — сначала выполните pnpm db:seed');
    return;
  }

  await prisma.settings.update({
    where: { id: 'singleton' },
    data: { phones: CONTACTS.phones, emails: CONTACTS.emails },
  });

  for (const locale of LOCALES) {
    await prisma.settingsTranslation.updateMany({
      where: { settingsId: 'singleton', locale },
      data: { workingHours: CONTACTS.workingHours[locale] },
    });
  }
  console.log(`✓ Контакты: ${CONTACTS.phones[0]}, ${CONTACTS.emails[0]}`);
}

/* ------------------------------------------------------------ медиагалерея */

/**
 * Альбомы галереи.
 *
 * Раздел «Медиагалерея» отдавал 404 — ни API, ни страниц не существовало.
 * Чтобы раздел не открывался пустым, собираем два альбома из уже загруженных
 * материалов Заказчика; новые альбомы добавляются из админки.
 */
const ALBUMS: Array<{ slug: string; order: number; title: T; description: T; files: string[] }> = [
  {
    slug: 'proektnye-resheniya',
    order: 0,
    title: {
      ru: 'Проектные решения кластера',
      kk: 'Кластердің жобалық шешімдері',
      en: 'Design solutions of the cluster',
    },
    description: {
      ru: 'Визуализации объектов по зонам кластера и карта развития горной инфраструктуры.',
      kk: 'Кластер аймақтары бойынша нысандардың визуализациялары және тау инфрақұрылымын дамыту картасы.',
      en: 'Visualisations of facilities by cluster zone and the infrastructure development map.',
    },
    // Карта кластера, планы трасс по зонам и все визуализации объектов.
    files: [
      'cluster-map.jpg',
      ...ZONES.flatMap((z) => [
        z.assets.plan,
        ...Array.from({ length: z.assets.shots }, (_, i) =>
          `${z.assets.plan.replace('-plan.jpg', '')}-${i + 1}.jpg`,
        ),
      ]),
    ],
  },
  {
    slug: 'gory-almaty',
    order: 1,
    title: { ru: 'Горы Алматы', kk: 'Алматы таулары', en: 'The mountains of Almaty' },
    description: {
      ru: 'Заилийский Алатау, канатные дороги и маршруты активного отдыха.',
      kk: 'Іле Алатауы, аспалы жолдар және белсенді демалыс бағыттары.',
      en: 'The Ile Alatau, cable cars and outdoor recreation routes.',
    },
    files: [
      // hero-gondola.jpg исключена из публичной галереи (замечание Заказчика
      // от 19.08.2026, п. 1): на кабине — фирменная надпись французского
      // курорта «friendlyMenuires», к Алматинскому горному кластеру
      // отношения не имеющая.
      'hero-cablecar.jpg',
      'hero-range.jpg',
      'value-health.jpg',
      'value-sport.jpg',
      'value-tourism.jpg',
      'value-eco.jpg',
      'value-economy.jpg',
    ],
  },
];

async function seedAlbums(): Promise<void> {
  for (const album of ALBUMS) {
    const translations = LOCALES.map((locale) => ({
      locale,
      title: album.title[locale],
      description: album.description[locale],
    }));
    const items = album.files.map((f, order) => ({ mediaId: mid(f), order }));

    const existing = await prisma.album.findUnique({ where: { slug: album.slug } });
    if (existing) {
      await prisma.$transaction([
        prisma.albumTranslation.deleteMany({ where: { albumId: existing.id } }),
        prisma.albumMedia.deleteMany({ where: { albumId: existing.id } }),
        prisma.album.update({
          where: { id: existing.id },
          data: {
            status: PublishStatus.PUBLISHED,
            publishedAt: existing.publishedAt ?? new Date(),
            order: album.order,
            coverId: mid(album.files[0]),
            translations: { create: translations },
            items: { create: items },
          },
        }),
      ]);
    } else {
      await prisma.album.create({
        data: {
          slug: album.slug,
          status: PublishStatus.PUBLISHED,
          publishedAt: new Date(),
          order: album.order,
          coverId: mid(album.files[0]),
          translations: { create: translations },
          items: { create: items },
        },
      });
    }
  }
  console.log(`✓ Медиагалерея: ${ALBUMS.length} альбома`);
}

/* ---------------------------------------------------------------- новости */

/**
 * Новости, названные в замечании п. 3 («Атамекен (релиз)», «Общественные
 * слушания»), создаются ЧЕРНОВИКАМИ.
 *
 * Заголовки и структура готовы, тело — за Заказчиком: содержания пресс-релиза
 * и итогов слушаний в замечаниях нет, а придумывать факты для официального
 * сайта оператора городского проекта нельзя. Черновик виден в админке
 * («Медиацентр → Новости»), публикуется одной кнопкой после вычитки.
 */
const NEWS_DRAFTS: Array<{ slug: string; title: T }> = [
  {
    slug: 'atameken-release',
    title: {
      ru: 'Атамекен: пресс-релиз',
      kk: 'Атамекен: баспасөз хабарламасы',
      en: 'Atameken: press release',
    },
  },
  {
    slug: 'obshchestvennye-slushaniya',
    title: {
      ru: 'Общественные слушания по проекту Алматинского горного кластера',
      kk: 'Алматы тау кластері жобасы бойынша қоғамдық тыңдаулар',
      en: 'Public hearings on the Almaty Mountain Cluster project',
    },
  },
];

const DRAFT_PLACEHOLDER: T = {
  ru: '<p>Текст материала заполняется Заказчиком. После вычитки новость публикуется из раздела «Медиацентр → Новости».</p>',
  kk: '<p>Материал мәтінін Тапсырыс беруші толтырады. Тексерілгеннен кейін жаңалық «Медиаорталық → Жаңалықтар» бөлімінен жарияланады.</p>',
  en: '<p>The body of this item is to be provided by the client. Once reviewed, it is published from Media Centre → News.</p>',
};

async function seedNewsDrafts(): Promise<void> {
  for (const item of NEWS_DRAFTS) {
    const existing = await prisma.news.findUnique({ where: { slug: item.slug } });
    if (existing) continue;

    await prisma.news.create({
      data: {
        slug: item.slug,
        status: PublishStatus.DRAFT,
        publishedAt: null,
        translations: {
          create: LOCALES.map((locale) => ({
            locale,
            title: item.title[locale],
            excerpt: null,
            blocks: [
              { id: 'draft', type: 'text', width: 'normal', html: DRAFT_PLACEHOLDER[locale] },
            ] as never,
          })),
        },
      },
    });
  }
  console.log('✓ Новости «Атамекен» и «Общественные слушания» созданы черновиками — требуется текст Заказчика');
}

/* ------------------------------------------------------------------- меню */

async function renameProjectMenu(): Promise<void> {
  const item = await prisma.menuItem.findFirst({ where: { href: 'project', parentId: null } });
  if (!item) return;

  for (const locale of LOCALES) {
    await prisma.menuItemTranslation.updateMany({
      where: { itemId: item.id, locale },
      data: { title: PROJECT_TITLE[locale] },
    });
  }

  // Подраздел «Общественная ценность проекта» — по замечанию это
  // самостоятельный раздел со своей навигацией.
  const child = await prisma.menuItem.findFirst({ where: { href: 'project/public-value' } });
  if (!child) {
    await prisma.menuItem.create({
      data: {
        location: 'MAIN',
        parentId: item.id,
        href: 'project/public-value',
        order: 0,
        translations: { create: LOCALES.map((locale) => ({ locale, title: VALUE_TITLE[locale] })) },
      },
    });
  }
  console.log('✓ Меню: раздел переименован в «Алматинский горный кластер»');
}

/* -------------------------------------------------------------------- run */

async function main(): Promise<void> {
  console.log('Наполнение контентом по замечаниям от 28.07.2026…\n');
  await seedMedia();
  await seedHome();
  await seedAboutPage();
  await seedProjectPage();
  await seedValuePage();
  await seedStructurePage();
  await seedPersons(MANAGEMENT, 'Правление');
  await seedPersons(SUPERVISORY, 'Наблюдательный совет');
  await seedProcurementPage();
  await seedAnticorruptionPage();
  await addAnticorruptionMenuItem();
  await seedPrivacyPage();
  await seedContacts();
  await seedAlbums();
  await seedNewsDrafts();
  await renameProjectMenu();
  await reindexSearch();
  console.log('\nГотово. Кэш публичного API сбрасывается автоматически по TTL (до 5 минут).');
}

main()
  .catch((e) => {
    console.error('Ошибка контентного сида:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
