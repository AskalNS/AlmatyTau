/* ============================================================================
   Заполнение базы начальными данными.

   Запускается один раз при первом развёртывании и повторно безопасен:
   всё через upsert по уникальным ключам, existing данные не затираются.

   Создаёт:
     - первичного администратора из SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD;
     - структуру меню и системные страницы (контакты, поиск, политика);
     - настройки сайта на трёх языках;
     - секции главной страницы;
     - демо-новости и персон — чтобы Заказчику было что смотреть при приёмке.

   Демо-контент помечается в консоли: его удаляют перед сдачей.
   ========================================================================== */

import { PrismaClient, Role, Locale, PublishStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const LOCALES: Locale[] = [Locale.kk, Locale.ru, Locale.en];

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Переменная окружения ${name} обязательна для сида`);
  return v;
}

async function seedAdmin() {
  const email = req('SEED_ADMIN_EMAIL').toLowerCase();
  const password = req('SEED_ADMIN_PASSWORD');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✓ Администратор ${email} уже существует — пропускаем`);
    return;
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await prisma.user.create({
    data: {
      email,
      name: 'Администратор',
      passwordHash,
      role: Role.ADMIN,
      // Пароль из .env временный — сменить при первом входе (п. X.II ТЗ).
      mustChangePassword: true,
    },
  });
  console.log(`✓ Создан администратор ${email}`);
  console.log('  ВАЖНО: смените пароль и включите 2FA при первом входе.');
}

async function seedSettings() {
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      phones: ['+7 (727) 000-00-00'],
      emails: ['info@atm.kz'],
      // г. Алматы, ул. Байзакова 303 (п. 6 и место поставки из ТЗ)
      lat: 43.2447,
      lng: 76.9128,
      socials: [],
      feedbackEnabled: true,
      homeNewsCount: 3,
      translations: {
        create: [
          {
            locale: Locale.ru,
            organizationName: 'ТОО «Almaty Tau Management»',
            address: 'г. Алматы, ул. Байзакова, 303, 2 этаж',
            workingHours: 'Пн–Пт, 09:00–18:00',
            footerText: 'Официальный сайт оператора проекта «Алматинский горный кластер».',
          },
          {
            locale: Locale.kk,
            organizationName: '«Almaty Tau Management» ЖШС',
            address: 'Алматы қаласы, Байзақов көшесі, 303, 2-қабат',
            workingHours: 'Дс–Жм, 09:00–18:00',
            footerText: '«Алматы тау кластері» жобасы операторының ресми сайты.',
          },
          {
            locale: Locale.en,
            organizationName: 'Almaty Tau Management LLP',
            address: '303 Baizakov St., 2nd floor, Almaty',
            workingHours: 'Mon–Fri, 09:00–18:00',
            footerText: 'Official website of the Almaty Mountain Cluster project operator.',
          },
        ],
      },
    },
  });
  console.log('✓ Настройки сайта');
}

/** Системные страницы: удалять нельзя, на них завязана навигация. */
async function seedSystemPages() {
  const pages: Array<{
    path: string;
    titles: Record<Locale, string>;
  }> = [
    { path: 'contacts', titles: { kk: 'Байланыс', ru: 'Контакты', en: 'Contacts' } },
    { path: 'search', titles: { kk: 'Іздеу', ru: 'Поиск', en: 'Search' } },
    {
      path: 'privacy',
      titles: {
        kk: 'Құпиялылық саясаты',
        ru: 'Политика конфиденциальности',
        en: 'Privacy Policy',
      },
    },
  ];

  for (const p of pages) {
    await prisma.page.upsert({
      where: { path: p.path },
      update: {},
      create: {
        path: p.path,
        isSystem: true,
        status: PublishStatus.PUBLISHED,
        translations: {
          create: LOCALES.map((locale) => ({
            locale,
            title: p.titles[locale],
            blocks: [],
          })),
        },
      },
    });
  }
  console.log('✓ Системные страницы (контакты, поиск, политика)');
}

/** Хабы разделов — нужны, чтобы родительский пункт меню имел свой URL (п. IV). */
async function seedHubPages() {
  const hubs: Array<{ path: string; titles: Record<Locale, string> }> = [
    { path: 'company', titles: { kk: 'Almaty Tau Management', ru: 'Almaty Tau Management', en: 'Almaty Tau Management' } },
    { path: 'company/about', titles: { kk: 'Компания туралы', ru: 'О компании', en: 'About' } },
    { path: 'company/structure', titles: { kk: 'Ұйымдық құрылым', ru: 'Организационная структура', en: 'Organizational Structure' } },
    { path: 'project', titles: { kk: '«Алматы тау кластері» жобасы', ru: 'Проект «Алматинский горный кластер»', en: 'Almaty Mountain Cluster Project' } },
    { path: 'corporate', titles: { kk: 'Корпоративтік ақпарат', ru: 'Корпоративная информация', en: 'Corporate Information' } },
    { path: 'corporate/procurement', titles: { kk: 'Мемлекеттік сатып алу', ru: 'Государственные закупки', en: 'Public Procurement' } },
    { path: 'media', titles: { kk: 'Медиаорталық', ru: 'Медиацентр', en: 'Media Center' } },
  ];

  for (const h of hubs) {
    await prisma.page.upsert({
      where: { path: h.path },
      update: {},
      create: {
        path: h.path,
        status: PublishStatus.PUBLISHED,
        translations: {
          create: LOCALES.map((locale) => ({ locale, title: h.titles[locale], blocks: [] })),
        },
      },
    });
  }
  console.log('✓ Страницы-хабы разделов');
}

async function seedMenu() {
  const count = await prisma.menuItem.count();
  if (count > 0) {
    console.log('✓ Меню уже заполнено — пропускаем');
    return;
  }

  type Node = {
    href: string;
    titles: Record<Locale, string>;
    children?: Node[];
  };

  const main: Node[] = [
    { href: '', titles: { kk: 'Басты бет', ru: 'Главная', en: 'Home' } },
    {
      href: 'company',
      titles: { kk: 'Almaty Tau Management', ru: 'Almaty Tau Management', en: 'Almaty Tau Management' },
      children: [
        { href: 'company/about', titles: { kk: 'Компания туралы', ru: 'О компании', en: 'About' } },
        { href: 'company/board', titles: { kk: 'Басқарма', ru: 'Правление', en: 'Board' } },
        { href: 'company/supervisory-board', titles: { kk: 'Бақылаушы кеңес', ru: 'Наблюдательный совет', en: 'Supervisory Board' } },
        { href: 'company/structure', titles: { kk: 'Ұйымдық құрылым', ru: 'Организационная структура', en: 'Structure' } },
      ],
    },
    { href: 'project', titles: { kk: 'АТК жобасы', ru: 'Проект АГК', en: 'The Project' } },
    {
      href: 'corporate',
      titles: { kk: 'Корпоративтік ақпарат', ru: 'Корпоративная информация', en: 'Corporate' },
      children: [
        { href: 'corporate/documents', titles: { kk: 'Ішкі құжаттар', ru: 'Внутренние документы', en: 'Documents' } },
        { href: 'corporate/procurement', titles: { kk: 'Мемлекеттік сатып алу', ru: 'Государственные закупки', en: 'Procurement' } },
        { href: 'corporate/vacancies', titles: { kk: 'Бос лауазымдар', ru: 'Вакансии', en: 'Vacancies' } },
      ],
    },
    {
      href: 'media',
      titles: { kk: 'Медиаорталық', ru: 'Медиацентр', en: 'Media' },
      children: [
        { href: 'media/news', titles: { kk: 'Жаңалықтар', ru: 'Новости', en: 'News' } },
        { href: 'media/gallery', titles: { kk: 'Медиагалерея', ru: 'Медиагалерея', en: 'Gallery' } },
      ],
    },
    { href: 'contacts', titles: { kk: 'Байланыс', ru: 'Контакты', en: 'Contacts' } },
  ];

  let order = 0;
  for (const node of main) {
    const parent = await prisma.menuItem.create({
      data: {
        location: 'MAIN',
        href: node.href,
        order: order++,
        translations: {
          create: LOCALES.map((locale) => ({ locale, title: node.titles[locale] })),
        },
      },
    });

    let childOrder = 0;
    for (const child of node.children ?? []) {
      await prisma.menuItem.create({
        data: {
          location: 'MAIN',
          parentId: parent.id,
          href: child.href,
          order: childOrder++,
          translations: {
            create: LOCALES.map((locale) => ({ locale, title: child.titles[locale] })),
          },
        },
      });
    }
  }
  console.log('✓ Структура главного меню');
}

async function seedHomeSections() {
  const count = await prisma.homeSection.count();
  if (count > 0) {
    console.log('✓ Главная страница уже настроена — пропускаем');
    return;
  }

  // Порядок секций по прототипу этапа 1. Заказчик меняет его из админки.
  await prisma.homeSection.create({
    data: {
      type: 'hero',
      order: 0,
      translations: {
        create: [
          {
            locale: Locale.ru,
            eyebrow: 'Алматинский горный кластер',
            title: 'Горы Алматы — новая точка притяжения',
            subtitle:
              'Создаём современный горнолыжный и туристический кластер мирового уровня, сохраняя природу Заилийского Алатау.',
            primaryLabel: 'О проекте',
            primaryHref: 'project',
            secondaryLabel: 'Последние новости',
            secondaryHref: 'media/news',
          },
          {
            locale: Locale.kk,
            eyebrow: 'Алматы тау кластері',
            title: 'Алматы таулары — жаңа тартылыс нүктесі',
            subtitle:
              'Іле Алатауының табиғатын сақтай отырып, әлемдік деңгейдегі заманауи тау-шаңғы және туристік кластер құрудамыз.',
            primaryLabel: 'Жоба туралы',
            primaryHref: 'project',
            secondaryLabel: 'Соңғы жаңалықтар',
            secondaryHref: 'media/news',
          },
          {
            locale: Locale.en,
            eyebrow: 'Almaty Mountain Cluster',
            title: 'The mountains of Almaty — a new destination',
            subtitle:
              'We are building a world-class ski and tourism cluster while preserving the nature of the Ile Alatau.',
            primaryLabel: 'About the project',
            primaryHref: 'project',
            secondaryLabel: 'Latest news',
            secondaryHref: 'media/news',
          },
        ],
      },
    },
  });

  const simple: Array<{
    type: 'about' | 'stats' | 'map' | 'news' | 'partners';
    titles: Partial<Record<Locale, string>>;
    href?: string;
  }> = [
    {
      type: 'about',
      titles: { ru: 'О проекте', kk: 'Жоба туралы', en: 'About the project' },
      href: 'project',
    },
    { type: 'stats', titles: { ru: 'Проект в цифрах', kk: 'Сандармен', en: 'By the numbers' } },
    { type: 'map', titles: { ru: 'Интерактивная карта кластера', kk: 'Кластердің картасы', en: 'Cluster map' } },
    { type: 'news', titles: { ru: 'Последние новости', kk: 'Соңғы жаңалықтар', en: 'Latest news' }, href: 'media/news' },
    { type: 'partners', titles: { ru: 'Партнёры и госресурсы', kk: 'Серіктестер', en: 'Partners' } },
  ];

  let order = 1;
  for (const s of simple) {
    await prisma.homeSection.create({
      data: {
        type: s.type,
        order: order++,
        href: s.href,
        translations: {
          create: LOCALES.map((locale) => ({
            locale,
            title: s.titles[locale] ?? s.titles.ru ?? '',
          })),
        },
      },
    });
  }
  console.log('✓ Секции главной страницы');
}

/** Демонстрационные новости для приёмки. Удаляются перед сдачей. */
async function seedDemoNews() {
  const count = await prisma.news.count();
  if (count > 0) {
    console.log('✓ Новости уже есть — демо пропускаем');
    return;
  }

  const demo: Array<{
    slug: string;
    daysAgo: number;
    titles: Record<Locale, string>;
  }> = [
    {
      slug: 'canatnaya-doroga-start',
      daysAgo: 8,
      titles: {
        ru: 'Начаты работы по строительству первой очереди канатной дороги',
        kk: 'Аспалы жолдың бірінші кезегін салу жұмыстары басталды',
        en: 'Construction of the first cable car line has begun',
      },
    },
    {
      slug: 'memorandum-operator',
      daysAgo: 15,
      titles: {
        ru: 'Подписан меморандум с международным оператором курортов',
        kk: 'Халықаралық курорт операторымен меморандумға қол қойылды',
        en: 'A memorandum signed with an international resort operator',
      },
    },
    {
      slug: 'master-plan-2030',
      daysAgo: 22,
      titles: {
        ru: 'Утверждён мастер-план развития территории до 2030 года',
        kk: '2030 жылға дейінгі аумақты дамыту бас жоспары бекітілді',
        en: 'The territory master plan through 2030 has been approved',
      },
    },
  ];

  const now = Date.now();
  for (const d of demo) {
    const publishedAt = new Date(now - d.daysAgo * 24 * 60 * 60 * 1000);
    await prisma.news.create({
      data: {
        slug: d.slug,
        status: PublishStatus.PUBLISHED,
        publishedAt,
        translations: {
          create: LOCALES.map((locale) => ({
            locale,
            title: d.titles[locale],
            excerpt: d.titles[locale],
            blocks: [
              {
                id: 'b1',
                type: 'text',
                width: 'normal',
                html: `<p>${d.titles[locale]}. ${
                  locale === 'ru'
                    ? 'Демонстрационный материал для приёмки. Будет заменён реальным контентом Заказчика.'
                    : locale === 'kk'
                      ? 'Қабылдауға арналған көрсетілім материалы. Тапсырыс берушінің нақты контентімен ауыстырылады.'
                      : 'Demonstration content for acceptance. To be replaced with the client’s real content.'
                }</p>`,
              },
            ],
          })),
        },
      },
    });
  }
  console.log('✓ Демо-новости (3 шт.) — УДАЛИТЬ перед сдачей');
}

async function main() {
  console.log('Заполнение базы данных…\n');
  await seedAdmin();
  await seedSettings();
  await seedSystemPages();
  await seedHubPages();
  await seedMenu();
  await seedHomeSections();
  await seedDemoNews();
  console.log('\nГотово.');
}

main()
  .catch((e) => {
    console.error('Ошибка сида:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
