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
    file: 'hero-gondola.jpg',
    alt: {
      ru: 'Гондола канатной дороги над горным хребтом',
      kk: 'Тау жотасының үстіндегі аспалы жол гондоласы',
      en: 'A gondola lift above a mountain ridge',
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

  const heroFrames = ['hero-cablecar.jpg', 'hero-gondola.jpg', 'hero-range.jpg'];

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
      href: 'project',
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

  await prisma.homeSection.create({
    data: {
      type: 'partners',
      order: 6,
      translations: {
        create: LOCALES.map((locale) => ({
          locale,
          title: {
            ru: 'Партнёры и госресурсы',
            kk: 'Серіктестер және мемлекеттік ресурстар',
            en: 'Partners and government resources',
          }[locale],
          blocks: [] as never,
        })),
      },
    },
  });

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
 * Биографии Заказчик передал только на русском. Их же выводим и в казахской,
 * и в английской версии: п. III ТЗ не даёт подменять язык, но при отсутствии
 * перевода персона исчезла бы со страницы целиком — а состав органов
 * управления обязан быть виден на всех языках. ФИО и должности переведены.
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
      bio: person.bio,
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
      'hero-cablecar.jpg',
      'hero-gondola.jpg',
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
  await seedContacts();
  await seedAlbums();
  await seedNewsDrafts();
  await renameProjectMenu();
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
