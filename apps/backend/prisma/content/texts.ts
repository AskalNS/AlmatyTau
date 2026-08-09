/* ============================================================================
   Тексты контентного сида.

   Источник русских формулировок — «Замечания по разработке сайта» Заказчика
   от 28.07.2026 и презентации «АГК_ОС» и «Транспорт». Русский текст приведён
   дословно; казахская и английская версии — рабочий перевод, который
   Заказчик вычитывает перед сдачей (в замечаниях они не приводились,
   а без перевода раздел на этом языке просто перестал бы существовать —
   п. III ТЗ запрещает подмену языка).
   ========================================================================== */

/** Строка на трёх языках сайта. */
export interface T {
  kk: string;
  ru: string;
  en: string;
}

export const LOCALE_KEYS = ['kk', 'ru', 'en'] as const;

/* ------------------------------------------------------------------ герой */

export const HERO = {
  eyebrow: {
    ru: 'Алматинский горный кластер',
    kk: 'Алматы тау кластері',
    en: 'Almaty Mountain Cluster',
  } satisfies T,
  title: {
    ru: 'Алматинский горный кластер — новый этап устойчивого развития горных территорий',
    kk: 'Алматы тау кластері — тау аумақтарын тұрақты дамытудың жаңа кезеңі',
    en: 'The Almaty Mountain Cluster — a new stage in the sustainable development of mountain areas',
  } satisfies T,
  subtitle: {
    ru: 'Создаем современную горнолыжную и туристическую инфраструктуру мирового уровня, сохраняя природу Заилийского Алатау',
    kk: 'Іле Алатауының табиғатын сақтай отырып, әлемдік деңгейдегі заманауи тау-шаңғы және туристік инфрақұрылым құрудамыз',
    en: 'We are building world-class ski and tourism infrastructure while preserving the nature of the Ile Alatau',
  } satisfies T,
};

/* ------------------------------------------- главная: о кластере (3 абзаца) */

export const HOME_ABOUT_TITLE: T = {
  ru: 'Алматинский горный кластер',
  kk: 'Алматы тау кластері',
  en: 'The Almaty Mountain Cluster',
};

export const HOME_ABOUT_HTML: T = {
  ru:
    '<p>Алматинский горный кластер — уникальный инфраструктурный проект, предусматривающий объединение курортов «Шымбулак» и «Oi-Qaragai» единой системой канатных дорог и горнолыжных трасс, проходящих через ущелья Кимасар, Бутаковку и курорт «Pioneer». Данная модель обеспечивает единые стандарты качества, безопасности и управления, расширяет туристические возможности региона.</p>' +
    '<p>Основной целью проекта является устойчивое развитие горных территорий Алматы, направленное на формирование всесезонной туристско-рекреационной и спортивной среды, создание долгосрочных социально-экономических эффектов для населения, повышение международного имиджа и инвестиционной привлекательности города.</p>' +
    '<p>ТОО «Almaty Tau Management» выступает ключевым оператором проекта Алматинского горного кластера и осуществляет комплексное управление его реализацией, включая проектирование, координацию строительства и эксплуатацию инфраструктуры, а также обеспечение безопасности и соблюдение требований экологического законодательства. Компания является дочерней организацией АО «Социально-предпринимательская корпорация «Алматы».</p>',
  kk:
    '<p>Алматы тау кластері — «Шымбұлақ» және «Oi-Qaragai» курорттарын Кімасар, Бұтақты шатқалдары мен «Pioneer» курорты арқылы өтетін біртұтас аспалы жолдар мен тау-шаңғы трассалары жүйесімен біріктіруді көздейтін бірегей инфрақұрылымдық жоба. Бұл модель сапаның, қауіпсіздіктің және басқарудың бірыңғай стандарттарын қамтамасыз етіп, өңірдің туристік мүмкіндіктерін кеңейтеді.</p>' +
    '<p>Жобаның негізгі мақсаты — Алматының тау аумақтарын тұрақты дамыту: жыл бойы жұмыс істейтін туристік-рекреациялық және спорттық орта қалыптастыру, халық үшін ұзақ мерзімді әлеуметтік-экономикалық әсер туғызу, қаланың халықаралық беделі мен инвестициялық тартымдылығын арттыру.</p>' +
    '<p>«Almaty Tau Management» ЖШС Алматы тау кластері жобасының негізгі операторы болып табылады және оның іске асырылуын кешенді басқарады: жобалау, құрылысты үйлестіру және инфрақұрылымды пайдалану, сондай-ақ қауіпсіздікті қамтамасыз ету мен экологиялық заңнама талаптарын сақтау. Компания «Алматы» әлеуметтік-кәсіпкерлік корпорациясы» АҚ-ның еншілес ұйымы.</p>',
  en:
    '<p>The Almaty Mountain Cluster is a unique infrastructure project that will link the Shymbulak and Oi-Qaragai resorts into a single system of cable cars and ski runs passing through the Kimasar and Butakovka gorges and the Pioneer resort. The model establishes common standards of quality, safety and management and broadens the tourism potential of the region.</p>' +
    '<p>The project aims at the sustainable development of Almaty’s mountain areas: creating an all-season tourism, recreation and sports environment, generating long-term social and economic benefits for residents, and strengthening the city’s international profile and investment appeal.</p>' +
    '<p>Almaty Tau Management LLP is the key operator of the Almaty Mountain Cluster. The company manages the delivery of the project end to end — design, construction coordination and infrastructure operation — and is responsible for safety and compliance with environmental legislation. It is a subsidiary of Almaty Social Entrepreneurship Corporation JSC.</p>',
};

/* --------------------------------------------------- ключевые задачи (9)  */

export const TASKS_TITLE: T = {
  ru: 'Ключевые задачи развития Алматинского горного кластера',
  kk: 'Алматы тау кластерін дамытудың негізгі міндеттері',
  en: 'Key objectives for the Almaty Mountain Cluster',
};

export interface TaskItem {
  icon: string;
  title: T;
  text: T;
}

export const TASKS: TaskItem[] = [
  {
    icon: 'eco',
    title: {
      ru: 'Экологическая устойчивость',
      kk: 'Экологиялық тұрақтылық',
      en: 'Environmental sustainability',
    },
    text: {
      ru: 'Обеспечение экологически устойчивого развития горных территорий.',
      kk: 'Тау аумақтарының экологиялық тұрақты дамуын қамтамасыз ету.',
      en: 'Ensuring the environmentally sustainable development of mountain areas.',
    },
  },
  {
    icon: 'health',
    title: {
      ru: 'Здоровый образ жизни',
      kk: 'Салауатты өмір салты',
      en: 'Healthy lifestyle',
    },
    text: {
      ru: 'Создание современной инфраструктуры для активного и здорового образа жизни населения.',
      kk: 'Халықтың белсенді және салауатты өмір салты үшін заманауи инфрақұрылым құру.',
      en: 'Building modern infrastructure for an active and healthy lifestyle.',
    },
  },
  {
    icon: 'safety',
    title: {
      ru: 'Безопасность посетителей',
      kk: 'Келушілердің қауіпсіздігі',
      en: 'Visitor safety',
    },
    text: {
      ru: 'Повышение уровня безопасности посетителей на горных территориях.',
      kk: 'Тау аумақтарындағы келушілер қауіпсіздігінің деңгейін арттыру.',
      en: 'Raising the level of visitor safety in the mountains.',
    },
  },
  {
    icon: 'tourism',
    title: {
      ru: 'Международный центр туризма',
      kk: 'Халықаралық туризм орталығы',
      en: 'International tourism hub',
    },
    text: {
      ru: 'Формирование международного центра горного и всесезонного туризма с развитием широкого спектра туристических продуктов мирового уровня.',
      kk: 'Әлемдік деңгейдегі туристік өнімдердің кең спектрін дамыта отырып, таулы және жыл бойғы туризмнің халықаралық орталығын қалыптастыру.',
      en: 'Establishing an international centre of mountain and all-season tourism with a broad range of world-class tourism products.',
    },
  },
  {
    icon: 'inclusion',
    title: {
      ru: 'Доступность и инклюзивность',
      kk: 'Қолжетімділік және инклюзивтілік',
      en: 'Accessibility and inclusion',
    },
    text: {
      ru: 'Обеспечение социальной доступности и инклюзивности горной инфраструктуры.',
      kk: 'Тау инфрақұрылымының әлеуметтік қолжетімділігі мен инклюзивтілігін қамтамасыз ету.',
      en: 'Making mountain infrastructure socially accessible and inclusive.',
    },
  },
  {
    icon: 'economy',
    title: {
      ru: 'Экономика и инвестиции',
      kk: 'Экономика және инвестициялар',
      en: 'Economy and investment',
    },
    text: {
      ru: 'Развитие экономического и инвестиционного потенциала города и региона.',
      kk: 'Қала мен өңірдің экономикалық және инвестициялық әлеуетін дамыту.',
      en: 'Developing the economic and investment potential of the city and the region.',
    },
  },
  {
    icon: 'transport',
    title: {
      ru: 'Транспортная система',
      kk: 'Көлік жүйесі',
      en: 'Transport system',
    },
    text: {
      ru: 'Формирование современной транспортной системы и повышение доступности горных территорий.',
      kk: 'Заманауи көлік жүйесін қалыптастыру және тау аумақтарының қолжетімділігін арттыру.',
      en: 'Creating a modern transport system and improving access to the mountains.',
    },
  },
  {
    icon: 'sport',
    title: {
      ru: 'Спорт мирового уровня',
      kk: 'Әлемдік деңгейдегі спорт',
      en: 'World-class sport',
    },
    text: {
      ru: 'Развитие спортивной инфраструктуры международного уровня и создание условий для проведения международных соревнований.',
      kk: 'Халықаралық деңгейдегі спорт инфрақұрылымын дамыту және халықаралық жарыстар өткізуге жағдай жасау.',
      en: 'Developing international-standard sports facilities and enabling international competitions.',
    },
  },
  {
    icon: 'education',
    title: {
      ru: 'Кадры и человеческий капитал',
      kk: 'Кадрлар және адами капитал',
      en: 'Skills and human capital',
    },
    text: {
      ru: 'Подготовка квалифицированных кадров и укрепление человеческого капитала в туристической и горной отрасли.',
      kk: 'Туристік және тау саласында білікті кадрлар даярлау және адами капиталды нығайту.',
      en: 'Training qualified professionals and strengthening human capital in tourism and the mountain industry.',
    },
  },
];

/* ------------------------------------------------------- кластер в цифрах */

export const NUMBERS_TITLE: T = {
  ru: 'Алматинский горный кластер в цифрах',
  kk: 'Алматы тау кластері сандармен',
  en: 'The Almaty Mountain Cluster in figures',
};

export const NUMBERS: Array<{ value: string; suffix?: string; label: T }> = [
  {
    value: '32',
    label: { ru: 'Канатные дороги', kk: 'Аспалы жолдар', en: 'Cable cars' },
  },
  {
    value: '104',
    label: { ru: 'Лыжные трассы', kk: 'Шаңғы трассалары', en: 'Ski runs' },
  },
  {
    value: '90',
    suffix: 'км',
    label: { ru: 'Протяжённость трасс', kk: 'Трассалардың ұзындығы', en: 'Total length of runs' },
  },
  {
    value: '30 000',
    label: {
      ru: 'Пропускная способность, чел./день',
      kk: 'Өткізу қабілеті, адам/тәулігіне',
      en: 'Capacity, people per day',
    },
  },
  {
    value: '74',
    label: {
      ru: 'Объекты туристической и инженерной инфраструктуры',
      kk: 'Туристік және инженерлік инфрақұрылым нысандары',
      en: 'Tourism and engineering infrastructure facilities',
    },
  },
];

/* ------------------------------------------------------------- о компании */

export const ABOUT_TITLE: T = {
  ru: 'О компании',
  kk: 'Компания туралы',
  en: 'About the company',
};

export const ABOUT_HTML: T = {
  ru:
    '<p>ТОО «Almaty Tau Management» выступает ключевым оператором проекта Алматинского горного кластера и осуществляет комплексное управление его реализацией, включая проектирование, координацию строительства и эксплуатацию инфраструктуры. Компания является дочерней организацией АО «Социально-предпринимательская корпорация «Алматы».</p>',
  kk:
    '<p>«Almaty Tau Management» ЖШС Алматы тау кластері жобасының негізгі операторы болып табылады және оның іске асырылуын кешенді басқарады: жобалау, құрылысты үйлестіру және инфрақұрылымды пайдалану. Компания «Алматы» әлеуметтік-кәсіпкерлік корпорациясы» АҚ-ның еншілес ұйымы.</p>',
  en:
    '<p>Almaty Tau Management LLP is the key operator of the Almaty Mountain Cluster project and manages its delivery end to end, including design, construction coordination and infrastructure operation. The company is a subsidiary of Almaty Social Entrepreneurship Corporation JSC.</p>',
};

export const ACTIVITIES_TITLE: T = {
  ru: 'Основные направления деятельности по Уставу',
  kk: 'Жарғы бойынша қызметтің негізгі бағыттары',
  en: 'Principal activities under the Charter',
};

export const ACTIVITIES: Array<{ icon: string; title: T; text: T }> = [
  {
    icon: 'infra',
    title: { ru: 'Архитектура и строительство', kk: 'Сәулет және құрылыс', en: 'Architecture and construction' },
    text: {
      ru: 'Деятельность в области архитектуры, градостроительства и строительства.',
      kk: 'Сәулет, қала құрылысы және құрылыс саласындағы қызмет.',
      en: 'Activities in architecture, urban planning and construction.',
    },
  },
  {
    icon: 'cablecar',
    title: { ru: 'Канатные дороги', kk: 'Аспалы жолдар', en: 'Cable cars' },
    text: {
      ru: 'Создание и развитие подвесной канатной дороги.',
      kk: 'Аспалы арқанжолды құру және дамыту.',
      en: 'Construction and development of aerial ropeways.',
    },
  },
  {
    icon: 'tourism',
    title: {
      ru: 'Объекты социального и культурного назначения',
      kk: 'Әлеуметтік және мәдени мақсаттағы нысандар',
      en: 'Social and cultural facilities',
    },
    text: {
      ru: 'Развитие объектов социального и культурного назначения, торговых центров, магазинов, ресторанов, кафе, интернет-кафе и управление ими, а также иная деятельность, связанная с развитием Алматинского горного кластера.',
      kk: 'Әлеуметтік және мәдени мақсаттағы нысандарды, сауда орталықтарын, дүкендерді, мейрамханаларды, дәмханаларды, интернет-кафелерді дамыту және оларды басқару, сондай-ақ Алматы тау кластерін дамытуға байланысты өзге де қызмет.',
      en: 'Development and management of social and cultural facilities, shopping centres, shops, restaurants, cafés and internet cafés, and other activities related to the Almaty Mountain Cluster.',
    },
  },
  {
    icon: 'economy',
    title: {
      ru: 'Внешнеэкономическая и инвестиционная деятельность',
      kk: 'Сыртқы экономикалық және инвестициялық қызмет',
      en: 'Foreign economic and investment activity',
    },
    text: {
      ru: 'Внешнеэкономическая и инвестиционная деятельность в соответствии с законодательством Республики Казахстан.',
      kk: 'Қазақстан Республикасының заңнамасына сәйкес сыртқы экономикалық және инвестициялық қызмет.',
      en: 'Foreign economic and investment activity in accordance with the legislation of the Republic of Kazakhstan.',
    },
  },
  {
    icon: 'education',
    title: {
      ru: 'Консультационная деятельность',
      kk: 'Консультациялық қызмет',
      en: 'Advisory services',
    },
    text: {
      ru: 'Консультирование по вопросам коммерческой деятельности, а также иные виды деятельности, предусмотренные Уставом.',
      kk: 'Коммерциялық қызмет мәселелері бойынша консультация беру, сондай-ақ Жарғыда көзделген өзге де қызмет түрлері.',
      en: 'Business consultancy and other activities provided for by the Charter.',
    },
  },
];
