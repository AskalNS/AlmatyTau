/* ============================================================================
   Материал презентаций «АГК_ОС» и «Транспорт», не вошедший в замечания.

   Заказчик просил перенести на сайт всё содержимое обеих презентаций, но не
   картинками слайдов, а собственными средствами: диаграммой, показателями,
   карточками и цепочками шагов. Здесь только данные; вёрстка — в блоках.

   Источники по разделам:
     слайд 4  «Технические данные АГК»   — уровни трасс, площадь, фазы;
     слайд 5  «Вода и экосистема»        — водный цикл и объёмы;
     слайд 7  «Новая точка притяжения»   — сравнение с мировыми канатками;
     слайд 9  «Развитие пеших троп»      — до и после обустройства;
     слайд 13 «Мы не разрушаем горы»     — принципы освоения и соц. эффекты;
     слайд 14 «Преимущества АГК»         — ски-пасс, ратраки, цифровизация;
     слайд 15 «Команда разработчиков»    — MDP и Engineerisk;
     Транспорт, слайд 3 — инфраструктурные мероприятия по коридорам;
     Транспорт, слайд 6 — раздел в приложении Smart Tourist;
     Транспорт, слайд 7 — целевые показатели Аль-Фараби — Медео.
   ========================================================================== */

import type { T } from './texts';

/* ------------------------------------------------- технические данные ---- */

export const TECH_TITLE: T = {
  ru: 'Технические данные кластера',
  kk: 'Кластердің техникалық деректері',
  en: 'Technical data of the cluster',
};

export const TRAILS_DONUT_TITLE: T = {
  ru: 'Обозначения лыжных трасс',
  kk: 'Шаңғы трассаларының белгілері',
  en: 'Ski run difficulty grades',
};

export const TRAILS_DONUT_CAPTION: T = {
  ru: 'Распределение трасс по уровням сложности соответствует международной цветовой кодировке: от зелёных склонов для первых спусков до чёрных для экспертов.',
  kk: 'Трассалардың қиындық деңгейлері бойынша бөлінуі халықаралық түстік кодтауға сай: алғашқы сырғанауға арналған жасыл беткейлерден сарапшыларға арналған қара трассаларға дейін.',
  en: 'The distribution of runs by difficulty follows the international colour coding — from green slopes for first descents to black runs for experts.',
};

export const TRAILS_SEGMENTS: Array<{ percent: number; color: 'green' | 'blue' | 'red' | 'black'; label: T; note: T }> = [
  {
    percent: 15,
    color: 'green',
    label: { ru: 'Зелёный уровень', kk: 'Жасыл деңгей', en: 'Green level' },
    note: { ru: 'для начинающих', kk: 'бастаушылар үшін', en: 'for beginners' },
  },
  {
    percent: 25,
    color: 'blue',
    label: { ru: 'Синий уровень', kk: 'Көк деңгей', en: 'Blue level' },
    note: { ru: 'для любителей', kk: 'әуесқойлар үшін', en: 'for recreational skiers' },
  },
  {
    percent: 25,
    color: 'red',
    label: { ru: 'Красный уровень', kk: 'Қызыл деңгей', en: 'Red level' },
    note: { ru: 'для профессионалов', kk: 'кәсіпқойлар үшін', en: 'for advanced skiers' },
  },
  {
    percent: 20,
    color: 'black',
    label: { ru: 'Чёрный уровень', kk: 'Қара деңгей', en: 'Black level' },
    note: { ru: 'для экспертов', kk: 'сарапшылар үшін', en: 'for experts' },
  },
];

export const TECH_STATS: Array<{ value: string; suffix?: T; label: T }> = [
  {
    value: '177',
    suffix: { ru: 'Га', kk: 'га', en: 'ha' },
    label: {
      ru: 'общая площадь застройки кластера',
      kk: 'кластердің жалпы құрылыс алаңы',
      en: 'total development footprint',
    },
  },
  {
    value: '0,1',
    suffix: { ru: '%', kk: '%', en: '%' },
    label: {
      ru: 'от площади государственного национального природного парка',
      kk: 'мемлекеттік ұлттық табиғи парк алаңынан',
      en: 'of the state national nature park area',
    },
  },
];

export const TECH_PRINCIPLES: Array<{ icon: string; title: T; text: T }> = [
  {
    icon: 'eco',
    title: {
      ru: 'Земли остаются в нацпарке',
      kk: 'Жерлер ұлттық парк құрамында қалады',
      en: 'The land stays within the national park',
    },
    text: {
      ru: 'Territории кластера не выводятся из состава государственного национального природного парка.',
      kk: 'Кластер аумақтары мемлекеттік ұлттық табиғи парк құрамынан шығарылмайды.',
      en: 'The cluster areas are not withdrawn from the state national nature park.',
    },
  },
  {
    icon: 'safety',
    title: {
      ru: 'Никакой частной застройки',
      kk: 'Жеке құрылыс жоқ',
      en: 'No private development',
    },
    text: {
      ru: 'Проект не предусматривает частной застройки на территории кластера.',
      kk: 'Жоба кластер аумағында жеке құрылысты көздемейді.',
      en: 'The project provides for no private housing development on the cluster territory.',
    },
  },
  {
    icon: 'cablecar',
    title: {
      ru: 'Канатные дороги вместо автодорог',
      kk: 'Автожолдардың орнына аспалы жолдар',
      en: 'Cable cars instead of roads',
    },
    text: {
      ru: 'Основная инфраструктура кластера — канатные дороги, а не новые автомобильные трассы в ущельях.',
      kk: 'Кластердің негізгі инфрақұрылымы — шатқалдардағы жаңа автожолдар емес, аспалы жолдар.',
      en: 'The backbone of the cluster is aerial ropeways, not new roads through the gorges.',
    },
  },
];

/* ------------------------------------------------------ фазы реализации --- */

export const PHASES_TITLE: T = {
  ru: 'Очерёдность освоения зон',
  kk: 'Аймақтарды игеру кезектілігі',
  en: 'Phasing of the zones',
};

export const PHASES: Array<{ period: T; title: T; text: T; done: boolean }> = [
  {
    period: { ru: 'Фаза 1', kk: '1-кезең', en: 'Phase 1' },
    title: { ru: 'Шымбулак', kk: 'Шымбұлақ', en: 'Shymbulak' },
    text: {
      ru: 'Действующий курорт: развитие существующей зоны катания и новые подъёмники.',
      kk: 'Жұмыс істеп тұрған курорт: бар сырғанау аймағын дамыту және жаңа көтергіштер.',
      en: 'An operating resort: development of the existing ski area and new lifts.',
    },
    done: true,
  },
  {
    period: { ru: 'Фаза 1', kk: '1-кезең', en: 'Phase 1' },
    title: { ru: 'Бутаковка и Кимасар', kk: 'Бұтақты және Кімасар', en: 'Butakovka and Kimasar' },
    text: {
      ru: 'Базовая массовая зона и связующее звено системы — первый этап нового строительства.',
      kk: 'Негізгі көпшілік аймағы және жүйенің байланыстырушы буыны — жаңа құрылыстың бірінші кезеңі.',
      en: 'The core mass-market zone and the connecting link — the first stage of new construction.',
    },
    done: false,
  },
  {
    period: { ru: 'Фаза 2', kk: '2-кезең', en: 'Phase 2' },
    title: { ru: 'Пионер', kk: 'Пионер', en: 'Pioneer' },
    text: {
      ru: 'Спортивно-тренировочная и инклюзивная зона.',
      kk: 'Спорттық-жаттығу және инклюзивті аймақ.',
      en: 'The sports training and inclusive zone.',
    },
    done: false,
  },
  {
    period: { ru: 'Фаза 2А', kk: '2А кезең', en: 'Phase 2A' },
    title: { ru: 'Oi-Qaragai', kk: 'Oi-Qaragai', en: 'Oi-Qaragai' },
    text: {
      ru: 'Семейный и природно-рекреационный кластер, замыкающий систему курортов.',
      kk: 'Курорттар жүйесін тұйықтайтын отбасылық және табиғи-рекреациялық кластер.',
      en: 'The family and nature-recreation cluster that closes the resort system.',
    },
    done: false,
  },
];

/* ------------------------------------------------------ преимущества АГК -- */

export const ADVANTAGES_TITLE: T = {
  ru: 'Преимущества кластера',
  kk: 'Кластердің артықшылықтары',
  en: 'Advantages of the cluster',
};

export const ADVANTAGES: Array<{ icon: string; title: T; text: T }> = [
  {
    icon: 'ticket',
    title: {
      ru: 'Единая экосистема ски-пассов',
      kk: 'Ски-пасстардың біртұтас экожүйесі',
      en: 'A single ski-pass ecosystem',
    },
    text: {
      ru: 'Один пропуск открывает доступ ко всем подъёмникам, парковкам, отелям и премиальному сервису кластера.',
      kk: 'Бір рұқсат кластердің барлық көтергіштеріне, автотұрақтарына, қонақүйлеріне және премиум сервисіне қолжетімділік береді.',
      en: 'One pass gives access to every lift, car park, hotel and premium service in the cluster.',
    },
  },
  {
    icon: 'eco',
    title: {
      ru: 'Ратраки нового поколения',
      kk: 'Жаңа буын ратрактары',
      en: 'New-generation snow groomers',
    },
    text: {
      ru: 'Подготовка склонов полностью на электрической тяге — без выбросов и шума в ущельях.',
      kk: 'Беткейлерді дайындау толықтай электртартқышпен — шатқалдарда шығарылым мен шусыз.',
      en: 'Slope grooming runs entirely on electric power — no emissions or noise in the gorges.',
    },
  },
  {
    icon: 'safety',
    title: {
      ru: 'Умная система доступа',
      kk: 'Қолжетімділіктің ақылды жүйесі',
      en: 'A smart access system',
    },
    text: {
      ru: 'Полная цифровизация: электронный доступ к трассам и тропам через единое приложение.',
      kk: 'Толық цифрландыру: біртұтас қосымша арқылы трассалар мен соқпақтарға электрондық қолжетімділік.',
      en: 'Full digitalisation: electronic access to runs and trails through a single app.',
    },
  },
];

/* ------------------------------------- мировые канатные дороги (слайд 7) -- */

export const WORLD_TITLE: T = {
  ru: 'Новая точка притяжения туризма',
  kk: 'Туризмнің жаңа тартылыс нүктесі',
  en: 'A new tourism landmark',
};

export const WORLD_LEAD: T = {
  ru: 'Канатная дорога к пику Чкалова выводит Алматы в один ряд с самыми высокими маятниковыми подъёмами мира.',
  kk: 'Шкалов шыңына апаратын аспалы жол Алматыны әлемнің ең биік маятниктік көтергіштерімен бір қатарға қояды.',
  en: 'The ropeway to Chkalov Peak places Almaty alongside the world’s highest aerial tramways.',
};

export const WORLD_CABLECARS: Array<{ rank: string; name: T; country: T; region: T; altitude: string; note: T }> = [
  {
    rank: '1',
    name: { ru: 'Mukumbarí — Teleférico de Mérida', kk: 'Mukumbarí — Teleférico de Mérida', en: 'Mukumbarí — Teleférico de Mérida' },
    country: { ru: 'Венесуэла', kk: 'Венесуэла', en: 'Venezuela' },
    region: { ru: 'штат Мерида, Анды', kk: 'Мерида штаты, Анд таулары', en: 'Mérida State, the Andes' },
    altitude: '4 765',
    note: { ru: '№1 в мире среди маятниковых', kk: 'маятниктілер арасында әлемде №1', en: 'the world’s highest aerial tramway' },
  },
  {
    rank: '2',
    name: { ru: 'Пик Чкалова', kk: 'Шкалов шыңы', en: 'Chkalov Peak' },
    country: { ru: 'Казахстан', kk: 'Қазақстан', en: 'Kazakhstan' },
    region: { ru: 'Алматы, Шымбулак', kk: 'Алматы, Шымбұлақ', en: 'Almaty, Shymbulak' },
    altitude: '3 870',
    note: { ru: 'проект Алматинского горного кластера', kk: 'Алматы тау кластерінің жобасы', en: 'an Almaty Mountain Cluster project' },
  },
  {
    rank: '3',
    name: { ru: 'Aiguille du Midi', kk: 'Aiguille du Midi', en: 'Aiguille du Midi' },
    country: { ru: 'Франция', kk: 'Франция', en: 'France' },
    region: { ru: 'Шамони', kk: 'Шамони', en: 'Chamonix' },
    altitude: '3 842',
    note: {
      ru: 'эталон высокогорного маятникового подъёма в Европе',
      kk: 'Еуропадағы биік таулы маятниктік көтергіштің эталоны',
      en: 'the European benchmark for high-alpine tramways',
    },
  },
  {
    rank: '4',
    name: { ru: 'Teleférico del Teide', kk: 'Teleférico del Teide', en: 'Teleférico del Teide' },
    country: { ru: 'Испания', kk: 'Испания', en: 'Spain' },
    region: { ru: 'Тенерифе', kk: 'Тенерифе', en: 'Tenerife' },
    altitude: '3 555',
    note: { ru: 'подъём на вулкан Тейде', kk: 'Тейде жанартауына көтерілу', en: 'the ascent of Mount Teide' },
  },
];

/* ------------------------------------------ вода и экосистема (слайд 5) --- */

export const WATER_TITLE: T = {
  ru: 'Вода и экосистема',
  kk: 'Су және экожүйе',
  en: 'Water and the ecosystem',
};

export const WATER_HTML: T = {
  ru:
    '<p><strong>Мы не забираем воду у города.</strong> Вода для системы оснежения не забирается напрямую из городских сетей или рек в период эксплуатации.</p>' +
    '<ul>' +
    '<li>для работы используются специальные накопительные резервуары, которые наполняются заранее;</li>' +
    '<li>система работает по принципу замкнутого природного цикла: снег образуется зимой, а весной вода постепенно возвращается в окружающую среду;</li>' +
    '<li>объёмы строго регламентированы и контролируются, что исключает риск подтоплений или неконтролируемого сброса воды;</li>' +
    '<li>в процессе используется только вода и сжатый воздух без каких-либо химических добавок.</li>' +
    '</ul>',
  kk:
    '<p><strong>Біз қаладан су алмаймыз.</strong> Пайдалану кезеңінде қар жасау жүйесіне су қала желілерінен немесе өзендерден тікелей алынмайды.</p>' +
    '<ul>' +
    '<li>жұмыс үшін алдын ала толтырылатын арнайы жинақтаушы резервуарлар пайдаланылады;</li>' +
    '<li>жүйе тұйық табиғи цикл қағидатымен жұмыс істейді: қыста қар түзіледі, көктемде су біртіндеп қоршаған ортаға қайтады;</li>' +
    '<li>көлемдер қатаң реттеледі және бақыланады, бұл су тасқыны немесе бақылаусыз су жіберу қаупін жоққа шығарады;</li>' +
    '<li>процесте кез келген химиялық қоспасыз тек су мен сығылған ауа қолданылады.</li>' +
    '</ul>',
  en:
    '<p><strong>We take no water from the city.</strong> Water for snowmaking is not drawn directly from municipal networks or rivers during operation.</p>' +
    '<ul>' +
    '<li>dedicated storage reservoirs are filled in advance;</li>' +
    '<li>the system follows a closed natural cycle: snow forms in winter and the water gradually returns to the environment in spring;</li>' +
    '<li>volumes are strictly regulated and monitored, ruling out flooding or uncontrolled discharge;</li>' +
    '<li>only water and compressed air are used — no chemical additives.</li>' +
    '</ul>',
};

export const WATER_STATS: Array<{ value: string; suffix?: T; label: T }> = [
  {
    value: '355,3',
    suffix: { ru: 'тыс. м³', kk: 'мың м³', en: 'thousand m³' },
    label: {
      ru: 'объём воды для разового снежного покрытия',
      kk: 'бір мәрте қар жабуға арналған су көлемі',
      en: 'water for a single snow cover',
    },
  },
  {
    value: '710,6',
    suffix: { ru: 'тыс. м³', kk: 'мың м³', en: 'thousand m³' },
    label: {
      ru: 'объём воды на весь зимний сезон',
      kk: 'бүкіл қысқы маусымға арналған су көлемі',
      en: 'water for the whole winter season',
    },
  },
  {
    value: '6',
    label: {
      ru: 'искусственных водоёмов в системе',
      kk: 'жүйедегі жасанды су айдындары',
      en: 'artificial reservoirs in the system',
    },
  },
  {
    value: '826 000',
    suffix: { ru: 'м³', kk: 'м³', en: 'm³' },
    label: {
      ru: 'суммарный объём искусственных водоёмов',
      kk: 'жасанды су айдындарының жиынтық көлемі',
      en: 'total capacity of the reservoirs',
    },
  },
];

/* ------------------------------- мы не разрушаем горы (слайд 13, левая) --- */

export const CARE_TITLE: T = {
  ru: 'Мы не разрушаем горы',
  kk: 'Біз тауларды бүлдірмейміз',
  en: 'We do not destroy the mountains',
};

export const CARE_PRINCIPLES: Array<{ icon: string; title: T; text: T }> = [
  {
    icon: 'cablecar',
    title: {
      ru: 'Основная инфраструктура — канатные дороги',
      kk: 'Негізгі инфрақұрылым — аспалы жолдар',
      en: 'Ropeways, not roads',
    },
    text: {
      ru: 'Связь между зонами обеспечивают подъёмники, а не новые автомобильные дороги в ущельях.',
      kk: 'Аймақтар арасындағы байланысты шатқалдардағы жаңа автожолдар емес, көтергіштер қамтамасыз етеді.',
      en: 'Lifts connect the zones instead of new roads cut through the gorges.',
    },
  },
  {
    icon: 'eco',
    title: {
      ru: 'Маршруты по существующим просекам',
      kk: 'Бағыттар бар алаңқайлар бойымен',
      en: 'Routes along existing clearings',
    },
    text: {
      ru: 'Трассы и линии подъёмников прокладываются по уже существующим просекам.',
      kk: 'Трассалар мен көтергіш желілері бұрыннан бар алаңқайлар бойымен салынады.',
      en: 'Runs and lift lines follow clearings that already exist.',
    },
  },
  {
    icon: 'infra',
    title: {
      ru: 'Локальное развитие',
      kk: 'Жергілікті даму',
      en: 'Local footprint',
    },
    text: {
      ru: 'Развитие ведётся локально, без разрушения природного ландшафта.',
      kk: 'Даму табиғи ландшафтты бүлдірмей, жергілікті түрде жүргізіледі.',
      en: 'Development is local and does not destroy the natural landscape.',
    },
  },
  {
    icon: 'health',
    title: {
      ru: 'Восстановление после монтажа',
      kk: 'Монтаждан кейін қалпына келтіру',
      en: 'Restoration after construction',
    },
    text: {
      ru: 'После монтажа территория восстанавливается, проводится высадка деревьев.',
      kk: 'Монтаждан кейін аумақ қалпына келтіріледі, ағаш отырғызылады.',
      en: 'After installation the site is restored and trees are planted.',
    },
  },
];

/* ---------------------------- социальные преимущества (слайд 13, правая) -- */

export const SOCIAL_TITLE: T = {
  ru: 'Социальные преимущества',
  kk: 'Әлеуметтік артықшылықтар',
  en: 'Social benefits',
};

export const SOCIAL_BENEFITS: Array<{ icon: string; title: T }> = [
  {
    icon: 'health',
    title: {
      ru: 'Пространство для активного отдыха, спорта и семейного досуга',
      kk: 'Белсенді демалыс, спорт және отбасылық бос уақыт кеңістігі',
      en: 'Space for outdoor activity, sport and family leisure',
    },
  },
  {
    icon: 'tourism',
    title: { ru: 'Развитие пеших маршрутов', kk: 'Жаяу бағыттарды дамыту', en: 'Development of hiking routes' },
  },
  {
    icon: 'infra',
    title: {
      ru: 'Всесезонная дестинация для туризма',
      kk: 'Туризмге арналған жыл бойғы дестинация',
      en: 'An all-season tourism destination',
    },
  },
  {
    icon: 'sport',
    title: {
      ru: 'Спортивная и культурная направленность',
      kk: 'Спорттық және мәдени бағыттылық',
      en: 'A sporting and cultural focus',
    },
  },
  {
    icon: 'safety',
    title: {
      ru: 'Безопасность и гармония с природой',
      kk: 'Қауіпсіздік және табиғатпен үйлесім',
      en: 'Safety and harmony with nature',
    },
  },
];

/* ------------------------------------------- развитие пеших троп (слайд 9) */

export const TRAILS_TITLE: T = {
  ru: 'Развитие пеших троп',
  kk: 'Жаяу соқпақтарды дамыту',
  en: 'Development of hiking trails',
};

export const TRAILS_HTML: T = {
  ru: '<p>Стихийные тропы заменяются обустроенными маршрутами с твёрдым покрытием, ступенями и ограждениями на крутых участках. Это снижает эрозию склонов, убирает вытаптывание в стороны от тропы и делает горы доступными круглый год.</p>',
  kk: '<p>Ретсіз соқпақтар қатты жабыны, баспалдақтары және тік бөліктерде қоршауы бар жайластырылған бағыттармен ауыстырылады. Бұл беткейлердің эрозиясын азайтады, соқпақтан тыс жерлердің тапталуын болдырмайды және тауларды жыл бойы қолжетімді етеді.</p>',
  en: '<p>Informal paths are replaced by properly built trails with a hard surface, steps and railings on steep sections. This reduces slope erosion, stops trampling beside the path and keeps the mountains accessible all year.</p>',
};

/* ----------------------------- инфраструктурные мероприятия (транспорт 3) - */

export const CORRIDOR_WORKS_TITLE: T = {
  ru: 'Инфраструктурные мероприятия по коридорам',
  kk: 'Дәліздер бойынша инфрақұрылымдық шаралар',
  en: 'Infrastructure works by corridor',
};

export const CORRIDOR_WORKS: Array<{ icon: string; title: T; text: T }> = [
  {
    icon: 'transport',
    title: { ru: 'Медео', kk: 'Медеу', en: 'Medeu' },
    text: {
      ru: 'Реконструкция дорог — 9 км. Перехватывающие парковки: 5 объектов на 2 450 машиномест. Усиление маршрутов 12 и 21.',
      kk: 'Жолдарды қайта жаңғырту — 9 км. Қайта бағыттаушы автотұрақтар: 2 450 көлік орнына 5 нысан. 12 және 21 маршруттарды күшейту.',
      en: 'Road reconstruction — 9 km. Park-and-ride: 5 sites for 2,450 vehicles. Reinforcement of routes 12 and 21.',
    },
  },
  {
    icon: 'parking',
    title: {
      ru: 'Большое Алматинское ущелье',
      kk: 'Үлкен Алматы шатқалы',
      en: 'Bolshoye Almatinskoye gorge',
    },
    text: {
      ru: 'Реконструкция дороги — 6 км. Парковки на 1 670 машиномест, из которых 1 300 — у Аль-Фараби. Усиление маршрутов 28 и 211, новый экспресс-маршрут из центра города.',
      kk: 'Жолды қайта жаңғырту — 6 км. 1 670 көлік орнына автотұрақтар, оның 1 300-і — Әл-Фараби бойында. 28 және 211 маршруттарды күшейту, қала орталығынан жаңа экспресс-маршрут.',
      en: 'Road reconstruction — 6 km. Car parks for 1,670 vehicles, 1,300 of them at Al-Farabi. Reinforcement of routes 28 and 211 and a new express service from the city centre.',
    },
  },
  {
    icon: 'transport',
    title: { ru: 'Бутаковское ущелье', kk: 'Бұтақты шатқалы', en: 'Butakovka gorge' },
    text: {
      ru: 'Реконструкция дороги — 4,25 км. Парковки на 150–300 машиномест в дополнение к коридору Медео. Усиление и продление маршрута 29Р.',
      kk: 'Жолды қайта жаңғырту — 4,25 км. Медеу дәлізіне қосымша 150–300 көлік орнына автотұрақтар. 29Р маршрутын күшейту және ұзарту.',
      en: 'Road reconstruction — 4.25 km. Car parks for 150–300 vehicles in addition to the Medeu corridor. Reinforcement and extension of route 29R.',
    },
  },
];

export const CORRIDOR_WORKS_NOTE_HTML: T = {
  ru: '<p>Новая инфраструктура заработает в полную силу только при изменении транспортного поведения: привлекательность общественного транспорта должна вырасти, а его доля в поездках — достигнуть 70 %. В этом случае провозная способность трёх коридоров составит около 12 тыс. человек в час при ожидаемом спросе в час пик около 10 тыс. человек.</p>',
  kk: '<p>Жаңа инфрақұрылым көлік мінез-құлқы өзгергенде ғана толық күшіне енеді: қоғамдық көліктің тартымдылығы артып, сапарлардағы үлесі 70 %-ға жетуі керек. Бұл жағдайда үш дәліздің тасымалдау қабілеті сағатына шамамен 12 мың адамды құрайды, ал қарбалас сағаттағы күтілетін сұраныс — шамамен 10 мың адам.</p>',
  en: '<p>The new infrastructure will only work at full strength if travel behaviour changes: public transport must become more attractive and reach a 70 % share of trips. In that case the three corridors will carry around 12,000 people per hour against expected peak demand of about 10,000.</p>',
};

/* --------------------------------------------- Smart Tourist (транспорт 6) */

export const APP_TITLE: T = {
  ru: 'Раздел кластера в приложении Smart Tourist',
  kk: 'Smart Tourist қосымшасындағы кластер бөлімі',
  en: 'The cluster section in the Smart Tourist app',
};

export const APP_FEATURES: Array<{ icon: string; title: T; text: T }> = [
  {
    icon: 'transport',
    title: { ru: 'Маршрут с пересадками', kk: 'Ауысулармен маршрут', en: 'Route with transfers' },
    text: {
      ru: 'Подбор оптимального маршрута до горных зон с учётом пересадок на шаттлы и канатные дороги.',
      kk: 'Шаттлдар мен аспалы жолдарға ауысуды ескере отырып, тау аймақтарына дейінгі оңтайлы маршрутты таңдау.',
      en: 'The best route to the mountain areas, including transfers to shuttles and cable cars.',
    },
  },
  {
    icon: 'parking',
    title: { ru: 'Наличие мест на парковках', kk: 'Автотұрақтардағы орындар', en: 'Live parking availability' },
    text: {
      ru: 'Информация о свободных местах на перехватывающих парковках в реальном времени.',
      kk: 'Қайта бағыттаушы автотұрақтардағы бос орындар туралы нақты уақыттағы ақпарат.',
      en: 'Real-time information on free spaces at the park-and-ride sites.',
    },
  },
  {
    icon: 'ticket',
    title: { ru: 'Бронирование и оплата', kk: 'Броньдау және төлеу', en: 'Booking and payment' },
    text: {
      ru: 'Бронирование места на перехвате, оплата парковки и оформление билетов на шаттл.',
      kk: 'Қайта бағыттаушы тұрақта орын броньдау, тұрақ ақысын төлеу және шаттл билеттерін рәсімдеу.',
      en: 'Reserve a space, pay for parking and buy shuttle tickets.',
    },
  },
];

/* ---------------------------------- целевые показатели (транспорт 7) ------ */

export const TARGETS_TITLE: T = {
  ru: 'Целевые показатели: Аль-Фараби — Медео',
  kk: 'Нысаналы көрсеткіштер: Әл-Фараби — Медеу',
  en: 'Targets: Al-Farabi — Medeu',
};

export const TARGETS_FROM: T = { ru: 'Сейчас', kk: 'Қазір', en: 'Today' };
export const TARGETS_TO: T = { ru: 'Целевой показатель', kk: 'Нысаналы көрсеткіш', en: 'Target' };

export const TARGETS: Array<{ label: T; from: string; to: string; suffix?: T }> = [
  {
    label: {
      ru: 'Личный транспорт: время поездки в час пик',
      kk: 'Жеке көлік: қарбалас сәттегі жол жүру уақыты',
      en: 'Private car: peak-hour travel time',
    },
    from: 'от 47',
    to: '22',
    suffix: { ru: 'мин', kk: 'мин', en: 'min' },
  },
  {
    label: {
      ru: 'Время ожидания парковочного места в час пик',
      kk: 'Қарбалас сәттегі тұрақ орнын күту уақыты',
      en: 'Peak-hour wait for a parking space',
    },
    from: 'до 30',
    to: '0',
    suffix: { ru: 'мин', kk: 'мин', en: 'min' },
  },
  {
    label: {
      ru: 'Общественный транспорт: время поездки в час пик',
      kk: 'Қоғамдық көлік: қарбалас сәттегі жол жүру уақыты',
      en: 'Public transport: peak-hour travel time',
    },
    from: '75',
    to: '35',
    suffix: { ru: 'мин', kk: 'мин', en: 'min' },
  },
  {
    label: {
      ru: 'Загрузка автобусов в час пик',
      kk: 'Қарбалас сәттегі автобустардың жүктемесі',
      en: 'Peak-hour bus occupancy',
    },
    from: '128',
    to: '70',
    suffix: { ru: '%', kk: '%', en: '%' },
  },
];

/* ------------------------------------------ команда разработчиков (сл. 15) */

export const TEAM_TITLE: T = {
  ru: 'Команда разработчиков проекта',
  kk: 'Жоба әзірлеушілерінің командасы',
  en: 'The project design team',
};

export const TEAM_HTML: T = {
  ru:
    '<p><strong>MDP Consulting &amp; Engineering</strong> — международная консалтинговая и инженерная компания, специализирующаяся на проектировании и реализации инфраструктурных решений для горных курортов и туристических территорий. Обладает экспертизой в области канатных дорог, горнолыжной инфраструктуры, мастер-планирования, инженерных систем и устойчивого развития курортов, сопровождая проекты от концепции до реализации на международном уровне.</p>' +
    '<p><strong>Engineerisk</strong> — консалтинговая компания, специализирующаяся на инженерных решениях в области защиты от снежных лавин. Сохраняя узкую специализацию исключительно на рисках, связанных со снегом и лавинами, Engineerisk выступает экспертом в этой области как во Франции, так и на международном уровне.</p>',
  kk:
    '<p><strong>MDP Consulting &amp; Engineering</strong> — тау курорттары мен туристік аумақтарға арналған инфрақұрылымдық шешімдерді жобалау және іске асыруға маманданған халықаралық консалтингтік және инженерлік компания. Аспалы жолдар, тау-шаңғы инфрақұрылымы, мастер-жоспарлау, инженерлік жүйелер және курорттардың тұрақты дамуы саласында тәжірибесі бар, жобаларды тұжырымдамадан іске асыруға дейін халықаралық деңгейде сүйемелдейді.</p>' +
    '<p><strong>Engineerisk</strong> — қар көшкінінен қорғау саласындағы инженерлік шешімдерге маманданған консалтингтік компания. Қар мен көшкінге байланысты тәуекелдерге ғана шоғырлана отырып, Engineerisk бұл салада Францияда да, халықаралық деңгейде де сарапшы ретінде танылады.</p>',
  en:
    '<p><strong>MDP Consulting &amp; Engineering</strong> is an international consulting and engineering firm specialising in the design and delivery of infrastructure for mountain resorts and tourism areas. It brings expertise in ropeways, ski infrastructure, master planning, engineering systems and sustainable resort development, guiding projects from concept to completion worldwide.</p>' +
    '<p><strong>Engineerisk</strong> is a consultancy specialising in engineering solutions for snow avalanche protection. Focused exclusively on snow and avalanche risk, Engineerisk is recognised as an expert in the field both in France and internationally.</p>',
};
