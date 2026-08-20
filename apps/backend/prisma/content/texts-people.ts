/* ============================================================================
   Правление, Наблюдательный совет и организационная структура.

   Источник — документ Заказчика «для сайта.docx». Русские формулировки,
   фамилии, даты и биографии (bio.ru) приведены дословно. ФИО и должности
   переведены на все три языка. bio.kk/bio.en — рабочий машинный перевод
   русского текста биографии (тексты на этих языках Заказчик не
   предоставлял) — подлежит вычитке носителем языка перед финальной сдачей.

   Фотографии — из того же документа, приведены к портретному кадру 4:5.
   ========================================================================== */

import type { T } from './texts';

export interface PersonContent {
  slug: string;
  board: 'MANAGEMENT' | 'SUPERVISORY';
  order: number;
  asset: string;
  fullName: T;
  position: T;
  /** Многострочный текст на каждый язык: каждая строка — абзац в блоке «Подробнее». */
  bio: T | null;
}

/* --------------------------------------------------------------- Правление */

export const MANAGEMENT: PersonContent[] = [
  {
    slug: 'baralo-jean-pierre',
    board: 'MANAGEMENT',
    order: 0,
    asset: 'person-baralo.jpg',
    fullName: {
      ru: 'БАРАЛО Жан-Пьер Франсуа Этьен',
      kk: 'БАРАЛО Жан-Пьер Франсуа Этьен',
      en: 'BARALO Jean-Pierre François Étienne',
    },
    position: {
      ru: 'Председатель Правления',
      kk: 'Басқарма Төрағасы',
      en: 'Chairman of the Management Board',
    },
    bio: {
      ru: [
        'Родился 31 мая 1963 года в г. Анси, Франция.',
        'Образование: Гренобльский университет, Франция. Специальность «Языкознание», степень магистра (1981–1985 гг.). Уппсальский университет, Швеция, 1987 г.',
        'Профессиональная деятельность:',
        'С 1985 по 1987 годы — Директор Центра спортивной ортопедии, SIDAS Conformable (Гренобль, Франция).',
        'С 1987 по 1998 годы — Менеджер по продукции, международный менеджер по продажам, PR-директор, директор по коммуникациям, директор по гоночной коммуникации, SALOMON (Анси, Франция).',
        'С 1998 по 2025 годы — Генеральный директор EE&B Mountain Consulting.',
        'С 2018 по 2023 годы — Директор Кубка мира по ски- и сноуборд-кроссу, FIS; подготовка к Олимпийским зимним играм в Пекине 2022 года и чемпионатам мира в Солитьюде (США) 2019 и Бакуриани (Грузия) 2023 года.',
        'С 2025 г. по настоящее время — Председатель Правления ТОО «Almaty Tau Management».',
      ].join('\n'),
      kk: [
        '1963 жылы 31 мамырда Франциядағы Анси қаласында дүниеге келген.',
        'Білімі: Гренобль университеті, Франция. «Тіл білімі» мамандығы, магистр дәрежесі (1981–1985 жж.). Уппсала университеті, Швеция, 1987 ж.',
        'Кәсіби қызметі:',
        '1985–1987 жж. — Спорттық ортопедия орталығының директоры, SIDAS Conformable (Гренобль, Франция).',
        '1987–1998 жж. — Өнім бойынша менеджер, халықаралық сатылым менеджері, PR-директор, коммуникациялар жөніндегі директор, жарыс коммуникациясы жөніндегі директор, SALOMON (Анси, Франция).',
        '1998–2025 жж. — EE&B Mountain Consulting бас директоры.',
        '2018–2023 жж. — FIS шаңғы және сноуборд-кросс бойынша әлем кубогының директоры; 2022 жылғы Пекиндегі қысқы Олимпиада ойындарына және 2019 жылғы Солитьюдтегі (АҚШ), 2023 жылғы Бакуриани (Грузия) әлем чемпионаттарына дайындық.',
        '2025 жылдан бастап қазіргі уақытқа дейін — «Almaty Tau Management» ЖШС Басқарма Төрағасы.',
      ].join('\n'),
      en: [
        'Born on 31 May 1963 in Annecy, France.',
        "Education: University of Grenoble, France, Master's degree in Linguistics (1981–1985). Uppsala University, Sweden, 1987.",
        'Professional career:',
        '1985–1987 — Director of the Sports Orthopaedics Centre, SIDAS Conformable (Grenoble, France).',
        '1987–1998 — Product Manager, International Sales Manager, PR Director, Communications Director, Racing Communications Director, SALOMON (Annecy, France).',
        '1998–2025 — CEO of EE&B Mountain Consulting.',
        '2018–2023 — Director of the FIS Ski and Snowboard Cross World Cup; preparations for the 2022 Beijing Winter Olympics and the 2019 Solitude (USA) and 2023 Bakuriani (Georgia) World Championships.',
        'Since 2025 — Chairman of the Management Board of Almaty Tau Management LLP.',
      ].join('\n'),
    },
  },
  {
    slug: 'sagynganov-erkebulan',
    board: 'MANAGEMENT',
    order: 1,
    asset: 'person-sagynganov.jpg',
    fullName: {
      ru: 'САҒЫНҒАНОВ Еркебұлан Алтынбекұлы',
      kk: 'САҒЫНҒАНОВ Еркебұлан Алтынбекұлы',
      en: 'SAGYNGANOV Erkebulan Altynbekuly',
    },
    position: {
      ru: 'Заместитель Председателя Правления',
      kk: 'Басқарма Төрағасының орынбасары',
      en: 'Deputy Chairman of the Management Board',
    },
    bio: {
      ru: [
        'Родился 12 апреля 1986 года в Актюбинской области, Казахстан.',
        'Образование: Евразийский национальный университет им. Л. Н. Гумилева, бакалавр финансов (2003–2007 гг.). Актюбинский государственный университет им. К. Жубанова, бакалавр юриспруденции (2007–2011 гг.).',
        'Профессиональная деятельность:',
        'С апреля по сентябрь 2008 г. — Главный специалист налогового Департамента по Мангистауской области, г. Актау.',
        'С 2008 по 2013 годы — Главный специалист налогового управления по г. Актобе.',
        'С 2013 по 2015 годы — Главный специалист Департамента государственных доходов по Актюбинской области, г. Актобе.',
        'С августа по сентябрь 2015 года — Главный специалист суда по Алгинскому району, Актюбинская область, г. Алга.',
        'С 2015 по 2016 годы — Заместитель руководителя Канцелярии областного суда, г. Актобе.',
        'С 2016 по 2017 годы — Руководитель отдела ГУ «Отдел экономики и финансов города Актобе», г. Актобе.',
        'С 2017 по 2018 годы — Руководитель отдела ГУ «Отдел экономики и бюджетного планирования города Актобе», г. Актобе.',
        'С 2018 по 2021 годы — Руководитель Администратора судов по Актюбинской области, г. Актобе.',
        'С 2021 по 2023 годы — Заведующий Отделом развития инфраструктуры судов Департамента по обеспечению деятельности судов при Верховном Суде Республики Казахстан (аппарат Верховного Суда Республики Казахстан), г. Астана.',
        'С февраля по август 2023 года — Заведующий Отделом развития инфраструктуры судов, Судебная администрация Республики Казахстан, г. Астана.',
        'С 2023 по 2025 годы — Заместитель руководителя департамента Военного суда Судебной администрации Республики Казахстан, г. Астана.',
        'С 2025 г. по настоящее время — Заместитель Председателя Правления ТОО «Almaty Tau Management», г. Алматы.',
      ].join('\n'),
      kk: [
        '1986 жылы 12 сәуірде Қазақстанның Ақтөбе облысында дүниеге келген.',
        'Білімі: Л.Н.Гумилев атындағы Еуразия ұлттық университеті, қаржы бакалавры (2003–2007 жж.). Қ.Жұбанов атындағы Ақтөбе өңірлік мемлекеттік университеті, құқықтану бакалавры (2007–2011 жж.).',
        'Кәсіби қызметі:',
        '2008 жылдың сәуірінен қыркүйегіне дейін — Маңғыстау облысы бойынша салық департаментінің бас маманы, Ақтау қаласы.',
        '2008–2013 жж. — Ақтөбе қаласы бойынша салық басқармасының бас маманы.',
        '2013–2015 жж. — Ақтөбе облысы бойынша мемлекеттік кірістер департаментінің бас маманы, Ақтөбе қаласы.',
        '2015 жылдың тамызынан қыркүйегіне дейін — Алға аудандық сотының бас маманы, Ақтөбе облысы, Алға қаласы.',
        '2015–2016 жж. — Облыстық сот кеңсесі басшысының орынбасары, Ақтөбе қаласы.',
        '2016–2017 жж. — «Ақтөбе қаласының экономика және қаржы бөлімі» ММ бөлім басшысы, Ақтөбе қаласы.',
        '2017–2018 жж. — «Ақтөбе қаласының экономика және бюджеттік жоспарлау бөлімі» ММ бөлім басшысы, Ақтөбе қаласы.',
        '2018–2021 жж. — Ақтөбе облысы бойынша Соттар әкімшісінің басшысы, Ақтөбе қаласы.',
        '2021–2023 жж. — Қазақстан Республикасы Жоғарғы Сотының жанындағы соттардың қызметін қамтамасыз ету департаментінің (Қазақстан Республикасы Жоғарғы Сотының аппараты) Соттар инфрақұрылымын дамыту бөлімінің меңгерушісі, Астана қаласы.',
        '2023 жылдың ақпанынан тамызына дейін — Қазақстан Республикасы Сот әкімшілігінің Соттар инфрақұрылымын дамыту бөлімінің меңгерушісі, Астана қаласы.',
        '2023–2025 жж. — Қазақстан Республикасы Сот әкімшілігі Әскери сот департаменті басшысының орынбасары, Астана қаласы.',
        '2025 жылдан бастап қазіргі уақытқа дейін — «Almaty Tau Management» ЖШС Басқарма Төрағасының орынбасары, Алматы қаласы.',
      ].join('\n'),
      en: [
        'Born on 12 April 1986 in Aktobe Region, Kazakhstan.',
        'Education: L.N. Gumilyov Eurasian National University, Bachelor of Finance (2003–2007). K. Zhubanov Aktobe Regional State University, Bachelor of Law (2007–2011).',
        'Professional career:',
        'April–September 2008 — Chief Specialist, Tax Department for Mangystau Region, Aktau.',
        '2008–2013 — Chief Specialist, Tax Administration for Aktobe.',
        '2013–2015 — Chief Specialist, State Revenue Department for Aktobe Region, Aktobe.',
        'August–September 2015 — Chief Specialist, Alga District Court, Aktobe Region, Alga.',
        '2015–2016 — Deputy Head of Chancellery, Regional Court, Aktobe.',
        '2016–2017 — Head of Department, State Institution "Department of Economy and Finance of Aktobe City", Aktobe.',
        '2017–2018 — Head of Department, State Institution "Department of Economy and Budget Planning of Aktobe City", Aktobe.',
        '2018–2021 — Head of the Court Administrator’s Office for Aktobe Region, Aktobe.',
        '2021–2023 — Head of the Court Infrastructure Development Division, Department for Ensuring the Activity of Courts under the Supreme Court of the Republic of Kazakhstan (Office of the Supreme Court of the Republic of Kazakhstan), Astana.',
        'February–August 2023 — Head of the Court Infrastructure Development Division, Judicial Administration of the Republic of Kazakhstan, Astana.',
        '2023–2025 — Deputy Head of the Military Court Department, Judicial Administration of the Republic of Kazakhstan, Astana.',
        'Since 2025 — Deputy Chairman of the Management Board of Almaty Tau Management LLP, Almaty.',
      ].join('\n'),
    },
  },
  {
    slug: 'rudenko-aleksandr',
    board: 'MANAGEMENT',
    order: 2,
    asset: 'person-rudenko.jpg',
    fullName: {
      ru: 'РУДЕНКО Александр Валерьевич',
      kk: 'РУДЕНКО Александр Валерьевич',
      en: 'RUDENKO Aleksandr Valeryevich',
    },
    position: {
      ru: 'Заместитель Председателя Правления',
      kk: 'Басқарма Төрағасының орынбасары',
      en: 'Deputy Chairman of the Management Board',
    },
    bio: {
      ru: [
        'Родился 10 октября 1984 года в г. Алматы, Казахстан.',
        'Образование: Университет ТУРАН, специальность «Финансы и кредит, банковское дело» (2006 г.), бакалавр в области финансов.',
        'Профессиональная деятельность:',
        'С 2008 по 2025 годы — Начальник технической службы ТОО «Chimbulak Development», г. Алматы.',
        'С 2019 по 2024 годы — Главный судья соревнований FIS по могулу и акробатике.',
        'С 2025 по 2026 годы — Директор Департамента строительства и технического надзора ТОО «Almaty Tau Management», г. Алматы.',
        'С июня 2026 года по настоящее время — Заместитель Председателя Правления ТОО «Almaty Tau Management», г. Алматы.',
      ].join('\n'),
      kk: [
        '1984 жылы 10 қазанда Алматы қаласында дүниеге келген.',
        'Білімі: ТУРАН университеті, «Қаржы және несие, банк ісі» мамандығы (2006 ж.), қаржы бакалавры.',
        'Кәсіби қызметі:',
        '2008–2025 жж. — «Chimbulak Development» ЖШС техникалық қызмет бастығы, Алматы қаласы.',
        '2019–2024 жж. — FIS могул және фристайл-акробатика жарыстарының бас төрешісі.',
        '2025–2026 жж. — «Almaty Tau Management» ЖШС Құрылыс және техникалық қадағалау департаментінің директоры, Алматы қаласы.',
        '2026 жылдың маусымынан бастап қазіргі уақытқа дейін — «Almaty Tau Management» ЖШС Басқарма Төрағасының орынбасары, Алматы қаласы.',
      ].join('\n'),
      en: [
        'Born on 10 October 1984 in Almaty, Kazakhstan.',
        'Education: TURAN University, majored in "Finance and Credit, Banking" (2006), Bachelor of Finance.',
        'Professional career:',
        '2008–2025 — Head of Technical Service, "Chimbulak Development" LLP, Almaty.',
        '2019–2024 — Chief Judge, FIS Moguls and Aerials competitions.',
        '2025–2026 — Director of the Construction and Technical Supervision Department, Almaty Tau Management LLP, Almaty.',
        'Since June 2026 — Deputy Chairman of the Management Board of Almaty Tau Management LLP, Almaty.',
      ].join('\n'),
    },
  },
];

/* -------------------------------------------------- Наблюдательный совет */

const CHAIR_SUP: T = {
  ru: 'Председатель Наблюдательного совета',
  kk: 'Бақылау кеңесінің Төрағасы',
  en: 'Chairman of the Supervisory Board',
};
const MEMBER: T = {
  ru: 'Член Наблюдательного совета',
  kk: 'Бақылау кеңесінің мүшесі',
  en: 'Member of the Supervisory Board',
};
const INDEPENDENT: T = {
  ru: 'Независимый член Наблюдательного совета',
  kk: 'Бақылау кеңесінің тәуелсіз мүшесі',
  en: 'Independent Member of the Supervisory Board',
};

export const SUPERVISORY: PersonContent[] = [
  {
    slug: 'smagulov-olzhas',
    board: 'SUPERVISORY',
    order: 0,
    asset: 'person-smagulov.jpg',
    fullName: {
      ru: 'Смагулов Олжас Мухтарович',
      kk: 'Смағұлов Олжас Мұхтарұлы',
      en: 'Smagulov Olzhas Mukhtarovich',
    },
    position: CHAIR_SUP,
    bio: {
      ru: [
        'Избран 22 августа 2025 года.',
        'Родился 27 августа 1989 года в городе Алматы.',
        'Образование: Американский межконтинентальный университет, Калифорнийский государственный политехнический университет Помоны, Западно-Казахстанский аграрно-технический университет им. Жангир хана, Лондонская школа экономики и политических наук.',
        'Трудовой стаж:',
        'С 2013 по 2015 годы — главный специалист организационно-инспекторского и информационно-аналитического отдела аппарата акима Атырауской области, главный специалист, заместитель руководителя Управления предпринимательства и индустриально-инновационного развития Атырауской области.',
        'С января по октябрь 2015 года — главный эксперт социально-экономического отдела Канцелярии Премьер-Министра Республики Казахстан.',
        'С 2015 по 2017 годы — заместитель руководителя аппарата акима Актюбинской области.',
        'С 2017 по 2018 годы — руководитель Управления экономики и бюджетного планирования Актюбинской области.',
        'С 2018 по 2019 годы — заместитель акима Актюбинской области.',
        'С 2019 по 2021 годы — заместитель Руководителя Канцелярии Премьер-Министра Республики Казахстан.',
        'С июля по ноябрь 2021 года — советник Премьер-Министра Республики Казахстан.',
        'С 2021 по 2025 годы — заместитель заведующего Отделом социально-экономической политики Администрации Президента.',
        'С июня 2025 года — Заместитель акима города Алматы.',
      ].join('\n'),
      kk: [
        '2025 жылы 22 тамызда сайланды.',
        '1989 жылы 27 тамызда Алматы қаласында дүниеге келген.',
        'Білімі: Американдық трансконтиненталды университет, Калифорния мемлекеттік политехникалық университеті (Помона), Жәңгір хан атындағы Батыс Қазақстан аграрлық-техникалық университеті, Лондон экономика және саясаттану мектебі.',
        'Еңбек жолы:',
        '2013–2015 жж. — Атырау облысы әкімі аппаратының ұйымдастыру-инспекторлық және ақпараттық-талдау бөлімінің бас маманы, кейін Атырау облысының кәсіпкерлік және индустриялық-инновациялық даму басқармасының бас маманы, басшы орынбасары.',
        '2015 жылдың қаңтарынан қазанына дейін — Қазақстан Республикасы Премьер-Министрі Кеңсесінің әлеуметтік-экономикалық бөлімінің бас сарапшысы.',
        '2015–2017 жж. — Ақтөбе облысы әкімі аппараты басшысының орынбасары.',
        '2017–2018 жж. — Ақтөбе облысының экономика және бюджеттік жоспарлау басқармасының басшысы.',
        '2018–2019 жж. — Ақтөбе облысы әкімінің орынбасары.',
        '2019–2021 жж. — Қазақстан Республикасы Премьер-Министрі Кеңсесі басшысының орынбасары.',
        '2021 жылдың шілдесінен қарашасына дейін — Қазақстан Республикасы Премьер-Министрінің кеңесшісі.',
        '2021–2025 жж. — Президент Әкімшілігінің әлеуметтік-экономикалық саясат бөлімі меңгерушісінің орынбасары.',
        '2025 жылдың маусымынан бастап — Алматы қаласы әкімінің орынбасары.',
      ].join('\n'),
      en: [
        'Elected on 22 August 2025.',
        'Born on 27 August 1989 in Almaty.',
        'Education: American InterContinental University, California State Polytechnic University, Pomona, Zhangir Khan West Kazakhstan Agrarian Technical University, London School of Economics and Political Science.',
        'Career:',
        '2013–2015 — Chief Specialist, Organisational and Analytical Department, Office of the Akim of Atyrau Region; later Chief Specialist and Deputy Head, Department of Entrepreneurship and Industrial-Innovative Development of Atyrau Region.',
        'January–October 2015 — Chief Expert, Socio-Economic Department, Office of the Prime Minister of the Republic of Kazakhstan.',
        '2015–2017 — Deputy Head of the Office of the Akim of Aktobe Region.',
        '2017–2018 — Head of the Department of Economy and Budget Planning of Aktobe Region.',
        '2018–2019 — Deputy Akim of Aktobe Region.',
        '2019–2021 — Deputy Head of the Office of the Prime Minister of the Republic of Kazakhstan.',
        'July–November 2021 — Advisor to the Prime Minister of the Republic of Kazakhstan.',
        '2021–2025 — Deputy Head of the Socio-Economic Policy Department, Presidential Administration.',
        'Since June 2025 — Deputy Akim of Almaty.',
      ].join('\n'),
    },
  },
  {
    slug: 'tokseitova-galiya',
    board: 'SUPERVISORY',
    order: 1,
    asset: 'person-tokseitova.jpg',
    fullName: {
      ru: 'Токсеитова Галия Ерлановна',
      kk: 'Токсеитова Ғалия Ерланқызы',
      en: 'Tokseitova Galiya Yerlanovna',
    },
    position: MEMBER,
    bio: {
      ru: [
        'Избрана 22 августа 2025 года.',
        'Родилась 15 декабря 1991 года в г. Алматы.',
        'Образование: Казахский национальный университет имени Аль-Фараби, специальность «Экономика и бизнес».',
        'Трудовой стаж:',
        'Является членом Президентского молодежного кадрового резерва.',
        'С 2013 по 2016 годы — главный специалист Управления финансов города Алматы.',
        'С 2016 по 2019 годы — Руководитель Отдела исполнения доходов, обслуживания долга и кредитования Управления финансов города Алматы.',
        'С октября 2019 г. по май 2023 г. — Заместитель руководителя Управления государственных активов города Алматы.',
        'С мая 2023 года — Руководитель Управления туризма города Алматы.',
      ].join('\n'),
      kk: [
        '2025 жылы 22 тамызда сайланды.',
        '1991 жылы 15 желтоқсанда Алматы қаласында дүниеге келген.',
        'Білімі: Әл-Фараби атындағы Қазақ ұлттық университеті, «Экономика және бизнес» мамандығы.',
        'Еңбек жолы:',
        'Президенттің жас кадрлар резервінің мүшесі.',
        '2013–2016 жж. — Алматы қаласы қаржы басқармасының бас маманы.',
        '2016–2019 жж. — Алматы қаласы қаржы басқармасының кірістерді орындау, қарызға қызмет көрсету және несиелендіру бөлімінің басшысы.',
        '2019 жылдың қазанынан 2023 жылдың мамырына дейін — Алматы қаласы мемлекеттік активтер басқармасы басшысының орынбасары.',
        '2023 жылдың мамырынан бастап — Алматы қаласы туризм басқармасының басшысы.',
      ].join('\n'),
      en: [
        'Elected on 22 August 2025.',
        'Born on 15 December 1991 in Almaty.',
        'Education: Al-Farabi Kazakh National University, majored in Economics and Business.',
        'Career:',
        'Member of the Presidential Youth Personnel Reserve.',
        '2013–2016 — Chief Specialist, Almaty City Finance Department.',
        '2016–2019 — Head of the Revenue Execution, Debt Servicing and Lending Division, Almaty City Finance Department.',
        'October 2019 – May 2023 — Deputy Head, Almaty City State Assets Department.',
        'Since May 2023 — Head of the Almaty City Tourism Department.',
      ].join('\n'),
    },
  },
  {
    slug: 'livinskaya-natalya',
    board: 'SUPERVISORY',
    order: 2,
    asset: 'person-livinskaya.jpg',
    fullName: {
      ru: 'Ливинская Наталья Игоревна',
      kk: 'Ливинская Наталья Игоревна',
      en: 'Livinskaya Natalya Igorevna',
    },
    position: MEMBER,
    bio: {
      ru: [
        'Избрана 1 декабря 2025 года.',
        'Родилась 3 июня 1988 года.',
        'Образование: Казахстанско-Немецкий университет, Университет «Туран».',
        'Трудовой стаж:',
        'С июня по октябрь 2008 г. — Офис-менеджер ТОО «Казахстан Консалтинг».',
        'С ноября 2009 г. по декабрь 2010 г. — Менеджер по проектам ТОО «Тринити Промоушн».',
        'С января по май 2011 г. — Менеджер по работе с клиентами ТОО «Рекламное агентство Pro Triniti».',
        'С 2011 по 2016 годы — Помощник депутата Маслихата Алматы.',
        'С августа 2013 г. по декабрь 2015 г. — Ответственный секретарь ОЮЛ «Ассоциация русских, славянских и казачьих организаций Казахстана».',
        'С сентября 2014 г. по июль 2015 г. — Преподаватель кафедры регионоведения АО «Казахского университета международных отношений и мировых языков им. Абылай хана».',
        'С января 2016 г. по март 2019 г. — Руководитель Центра урбанистики АО «Центр развития города Алматы».',
        'С марта по июль 2019 г. — И. о. заместителя руководителя Управления урбанистики и городского планирования города Алматы.',
        'С июля по октябрь 2019 г. — Заместитель руководителя Управления урбанистики и городского планирования города Алматы.',
        'С октября 2019 г. по июнь 2020 г. — Советник акима города Алматы по урбанистике.',
        'С июня 2020 г. по декабрь 2025 г. — Руководитель Управления зеленой экономики города Алматы.',
        'С декабря 2025 года — Заместитель председателя правления АО «СПК «Алматы».',
      ].join('\n'),
      kk: [
        '2025 жылы 1 желтоқсанда сайланды.',
        '1988 жылы 3 маусымда дүниеге келген.',
        'Білімі: Қазақстан-Неміс университеті, «Тұран» университеті.',
        'Еңбек жолы:',
        '2008 жылдың маусымынан қазанына дейін — «Казахстан Консалтинг» ЖШС кеңсе менеджері.',
        '2009 жылдың қарашасынан 2010 жылдың желтоқсанына дейін — «Тринити Промоушн» ЖШС жобалар менеджері.',
        '2011 жылдың қаңтарынан мамырына дейін — «Pro Triniti жарнама агенттігі» ЖШС клиенттермен жұмыс менеджері.',
        '2011–2016 жж. — Алматы қалалық мәслихаты депутатының көмекшісі.',
        '2013 жылдың тамызынан 2015 жылдың желтоқсанына дейін — «Қазақстанның орыс, славян және казак ұйымдарының қауымдастығы» ЗТБ жауапты хатшысы.',
        '2014 жылдың қыркүйегінен 2015 жылдың шілдесіне дейін — Абылай хан атындағы Қазақ халықаралық қатынастар және әлем тілдері университетінің өлкетану кафедрасының оқытушысы.',
        '2016 жылдың қаңтарынан 2019 жылдың наурызына дейін — «Алматы қаласын дамыту орталығы» АҚ урбанистика орталығының басшысы.',
        '2019 жылдың наурызынан шілдесіне дейін — Алматы қаласы урбанистика және қала құрылысы басқармасы басшысының орынбасары м.а.',
        '2019 жылдың шілдесінен қазанына дейін — Алматы қаласы урбанистика және қала құрылысы басқармасы басшысының орынбасары.',
        '2019 жылдың қазанынан 2020 жылдың маусымына дейін — Алматы қаласы әкімінің урбанистика жөніндегі кеңесшісі.',
        '2020 жылдың маусымынан 2025 жылдың желтоқсанына дейін — Алматы қаласы жасыл экономика басқармасының басшысы.',
        '2025 жылдың желтоқсанынан бастап — «Алматы» АҚ басқарма төрағасының орынбасары.',
      ].join('\n'),
      en: [
        'Elected on 1 December 2025.',
        'Born on 3 June 1988.',
        'Education: Kazakh-German University, "Turan" University.',
        'Career:',
        'June–October 2008 — Office Manager, "Kazakhstan Consulting" LLP.',
        'November 2009 – December 2010 — Project Manager, "Trinity Promotion" LLP.',
        'January–May 2011 — Client Relations Manager, "Pro Triniti Advertising Agency" LLP.',
        '2011–2016 — Assistant to a Deputy of the Almaty Maslikhat.',
        'August 2013 – December 2015 — Executive Secretary, Association of Russian, Slavic and Cossack Organisations of Kazakhstan.',
        'September 2014 – July 2015 — Lecturer, Department of Regional Studies, Ablai Khan Kazakh University of International Relations and World Languages.',
        'January 2016 – March 2019 — Head of the Urbanism Centre, "Almaty Development Centre" JSC.',
        'March–July 2019 — Acting Deputy Head, Department of Urbanism and Urban Planning of Almaty.',
        'July–October 2019 — Deputy Head, Department of Urbanism and Urban Planning of Almaty.',
        'October 2019 – June 2020 — Advisor to the Akim of Almaty on Urbanism.',
        'June 2020 – December 2025 — Head of the Green Economy Department of Almaty.',
        'Since December 2025 — Deputy Chairman of the Management Board, "SPK Almaty" JSC.',
      ].join('\n'),
    },
  },
  {
    slug: 'sakenov-timur',
    board: 'SUPERVISORY',
    order: 3,
    asset: 'person-sakenov.jpg',
    fullName: {
      ru: 'Сакенов Тимур Алимович',
      kk: 'Сәкенов Тимур Әлімұлы',
      en: 'Sakenov Timur Alimovich',
    },
    position: MEMBER,
    bio: {
      ru: [
        'Избран 22 августа 2025 года.',
        'Родился 30 октября 1976 года в городе Алматы.',
        'Образование: с 1993 по 2000 годы — Франкфуртский университет, магистр «Политэкономия / Народное хозяйство / Политология».',
        'Трудовой стаж:',
        'С 2017 по 2021 годы — Менеджер по развитию бизнеса в Казахстане, Кыргызстане и Таджикистане французско-канадской железнодорожной компании ALSTOM-BOMBARDIER.',
        'С 2023 г. по настоящее время — Руководитель ГРБН «Устойчивый экономический рост» Проектного офиса Акимата города Алматы.',
      ].join('\n'),
      kk: [
        '2025 жылы 22 тамызда сайланды.',
        '1976 жылы 30 қазанда Алматы қаласында дүниеге келген.',
        'Білімі: 1993–2000 жж. — Франкфурт университеті, «Саяси экономика / Халық шаруашылығы / Саясаттану» магистрі.',
        'Еңбек жолы:',
        '2017–2021 жж. — ALSTOM-BOMBARDIER франко-канадалық теміржол компаниясының Қазақстан, Қырғызстан және Тәжікстандағы бизнесті дамыту менеджері.',
        '2023 жылдан бастап қазіргі уақытқа дейін — Алматы қаласы Әкімдігі Жобалық офисінің «Тұрақты экономикалық өсу» БМБ жетекшісі.',
      ].join('\n'),
      en: [
        'Elected on 22 August 2025.',
        'Born on 30 October 1976 in Almaty.',
        "Education: 1993–2000 — University of Frankfurt, Master's in Political Economy / National Economy / Political Science.",
        'Career:',
        '2017–2021 — Business Development Manager for Kazakhstan, Kyrgyzstan and Tajikistan, ALSTOM-BOMBARDIER (French-Canadian railway company).',
        'Since 2023 — Head of the "Sustainable Economic Growth" Budget Programme, Project Office of the Almaty City Akimat.',
      ].join('\n'),
    },
  },
  {
    slug: 'germershausen-michael',
    board: 'SUPERVISORY',
    order: 4,
    asset: 'person-germershausen.jpg',
    fullName: {
      ru: 'Михаэль Гермерсхаузен',
      kk: 'Михаэль Гермерсхаузен',
      en: 'Michael Germershausen',
    },
    position: INDEPENDENT,
    bio: {
      ru: [
        'Избран 22 августа 2025 года.',
        'Родился 4 февраля 1984 года в городе Алматы.',
        'Образование: 1995–2000 гг. — обучение в Берлине и Кембридже с присвоением степени в области европейского делового администрирования. 2004 г. — КИМЭП, специальность «Финансы и менеджмент», бакалавр делового администрирования. 2012 г. — модульная программа МВА, Маастрихтская школа менеджмента.',
        'Трудовой стаж:',
        'С 1998 по 2003 годы — Закупщик, старший менеджер по закупкам, BMW, Rolls Royce Aeroengines, Далевиц (Германия), Дерби (Великобритания).',
        'С 2003 по 2020 годы — Руководитель по региону СНГ в Antal International.',
        'С 2020 года по настоящее время — Руководитель Евразийского региона в Antal International, глобального поставщика услуг по подбору персонала и экспертов.',
        'Является членом консультативного совета и руководителем HR-комитета Торговой палаты германского бизнеса в Казахстане и Центральной Азии.',
      ].join('\n'),
      kk: [
        '2025 жылы 22 тамызда сайланды.',
        '1984 жылы 4 ақпанда Алматы қаласында дүниеге келген.',
        'Білімі: 1995–2000 жж. — Берлин мен Кембриджде оқу, еуропалық іскерлік әкімшілендіру бойынша дәреже алды. 2004 ж. — КИМЭП, «Қаржы және менеджмент» мамандығы, іскерлік әкімшілендіру бакалавры. 2012 ж. — Маастрихт менеджмент мектебінің модульдік МВА бағдарламасы.',
        'Еңбек жолы:',
        '1998–2003 жж. — Сатып алушы, сатып алу жөніндегі аға менеджер, BMW, Rolls Royce Aeroengines, Дальвиц (Германия), Дерби (Ұлыбритания).',
        '2003–2020 жж. — Antal International компаниясындағы ТМД өңірі жөніндегі жетекші.',
        '2020 жылдан бастап қазіргі уақытқа дейін — персонал іріктеу және сарапшылар жеткізу жөніндегі жаһандық қызмет көрсетуші Antal International компаниясындағы Еуразия өңірінің жетекшісі.',
        'Қазақстан мен Орталық Азиядағы Герман бизнесінің сауда палатасы кеңесінің мүшесі және HR-комитетінің жетекшісі.',
      ].join('\n'),
      en: [
        'Elected on 22 August 2025.',
        'Born on 4 February 1984 in Almaty.',
        'Education: 1995–2000 — studied in Berlin and Cambridge, earning a degree in European Business Administration. 2004 — KIMEP, majored in Finance and Management, Bachelor of Business Administration. 2012 — modular MBA programme, Maastricht School of Management.',
        'Career:',
        '1998–2003 — Buyer, Senior Procurement Manager, BMW, Rolls-Royce Aeroengines, Dahlewitz (Germany), Derby (United Kingdom).',
        '2003–2020 — Head of the CIS Region at Antal International.',
        'Since 2020 — Head of the Eurasia Region at Antal International, a global recruitment and expert-staffing provider.',
        'Member of the Advisory Board and Head of the HR Committee, Chamber of Commerce of German Business in Kazakhstan and Central Asia.',
      ].join('\n'),
    },
  },
  {
    slug: 'karatay-murat',
    board: 'SUPERVISORY',
    order: 5,
    asset: 'person-karatay.jpg',
    fullName: {
      ru: 'Каратай Мурат Насибуллаевич',
      kk: 'Қаратай Мұрат Насибуллаұлы',
      en: 'Karatay Murat Nasibullayevich',
    },
    position: INDEPENDENT,
    bio: {
      ru: [
        'Избран 22 августа 2025 года.',
        'Родился 25 апреля 1970 года в Павлодарской области.',
        'Образование: высшее юридическое.',
        'Карьера:',
        'С 2004 по 2007 годы — Руководитель ТОО «Тулпар-ПВ» (строительство гражданских объектов).',
        'С 2007 по 2010 годы — Управляющий директор АО «Кедентранссервис» (логистика).',
        'С 2010 по 2018 годы — Руководитель ТОО «Asia Positive Commerce» (строительство гражданских объектов).',
        'С 2018 по 2025 годы — Основатель и руководитель Семейного горного курорта «Пионер».',
        'Организовал и реализовал ряд социальных проектов в сфере инклюзии, включая создание центров помощи детям с ограниченными возможностями.',
      ].join('\n'),
      kk: [
        '2025 жылы 22 тамызда сайланды.',
        '1970 жылы 25 сәуірде Павлодар облысында дүниеге келген.',
        'Білімі: жоғары заң білімі.',
        'Мансабы:',
        '2004–2007 жж. — «Тұлпар-ПВ» ЖШС басшысы (азаматтық құрылыс).',
        '2007–2010 жж. — «Кедентранссервис» АҚ басқарушы директоры (логистика).',
        '2010–2018 жж. — «Asia Positive Commerce» ЖШС басшысы (азаматтық құрылыс).',
        '2018–2025 жж. — «Пионер» отбасылық тау курортының негізін қалаушы және басшысы.',
        'Мүмкіндігі шектеулі балаларға көмек көрсету орталықтарын құруды қоса алғанда, инклюзия саласында бірқатар әлеуметтік жобаларды ұйымдастырды және жүзеге асырды.',
      ].join('\n'),
      en: [
        'Elected on 22 August 2025.',
        'Born on 25 April 1970 in Pavlodar Region.',
        'Education: higher legal education.',
        'Career:',
        '2004–2007 — Head of "Tulpar-PV" LLP (civil construction).',
        '2007–2010 — Managing Director, "Kedentransservice" JSC (logistics).',
        '2010–2018 — Head of "Asia Positive Commerce" LLP (civil construction).',
        '2018–2025 — Founder and Head of the "Pioneer" Family Mountain Resort.',
        'Organised and delivered a number of social projects in the field of inclusion, including the establishment of support centres for children with disabilities.',
      ].join('\n'),
    },
  },
  {
    slug: 'leitner-gernot',
    board: 'SUPERVISORY',
    order: 6,
    asset: 'person-leitner.jpg',
    fullName: {
      ru: 'Ляйтнер Гернот',
      kk: 'Ляйтнер Гернот',
      en: 'Gernot Leitner',
    },
    position: INDEPENDENT,
    // Биография в документе Заказчика не приведена.
    bio: {
      ru: 'Избран 22 августа 2025 года.',
      kk: '2025 жылы 22 тамызда сайланды.',
      en: 'Elected on 22 August 2025.',
    },
  },
  {
    slug: 'valiev-askar',
    board: 'SUPERVISORY',
    order: 7,
    asset: 'person-valiev.jpg',
    fullName: {
      ru: 'Валиев Аскар Казбекович',
      kk: 'Валиев Асқар Қазбекұлы',
      en: 'Valiyev Askar Kazbekovich',
    },
    position: INDEPENDENT,
    // Биография в документе Заказчика не приведена.
    bio: {
      ru: 'Избран 22 августа 2025 года.',
      kk: '2025 жылы 22 тамызда сайланды.',
      en: 'Elected on 22 August 2025.',
    },
  },
  {
    slug: 'kankurov-stanislav',
    board: 'SUPERVISORY',
    order: 8,
    asset: 'person-kankurov.jpg',
    fullName: {
      ru: 'Канкуров Станислав Владимирович',
      kk: 'Канкуров Станислав Владимирович',
      en: 'Kankurov Stanislav Vladimirovich',
    },
    // В документе Заказчика должность не указана — персона идёт в перечне
    // Наблюдательного совета последней. Требуется подтверждение статуса.
    position: MEMBER,
    bio: {
      ru: [
        'Образование: КБТУ (Doctor of Business Administration), МГУ им. Ломоносова (MBA), Университет им. Д. Кунаева, Центрально-Азиатский университет.',
        'Трудовой стаж:',
        'С 2005 по 2006 годы — Специалист, главный специалист, директор ТОО «Техническая инвентаризация имущества».',
        'С 2006 по 2010 годы — Вице-президент АО «ПСТК Бителеком».',
        'С 2010 по 2011 годы — Вице-президент Общественного фонда «Поддержки программы Президента Республики Казахстан «Казахстан-2030».',
        'С 2011 по 2013 годы — Первый заместитель председателя Бостандыкского районного филиала партии «Нұр Отан».',
        'С 2013 по 2018 годы — Заместитель председателя Алматинского городского филиала партии «Нұр Отан».',
        'С 2018 по 2021 годы — Первый заместитель председателя Алматинского городского филиала партии «Нұр Отан».',
        'С 2021 по 2023 годы — Председатель Маслихата города Алматы.',
        'С 2023 по 01.07.2026 — Председатель Алматинского городского филиала партии «AMANAT».',
        'С 01.07.2026 года по настоящее время — Председатель Алматинского городского филиала партии «Әділет».',
      ].join('\n'),
      kk: [
        'Білімі: ҚБТУ (Doctor of Business Administration), М.В.Ломоносов атындағы ММУ (MBA), Д.Қонаев атындағы университет, Орталық Азия университеті.',
        'Еңбек жолы:',
        '2005–2006 жж. — «Мүлікті техникалық түгендеу» ЖШС маманы, бас маманы, директоры.',
        '2006–2010 жж. — «ПСТК Бителеком» АҚ вице-президенті.',
        '2010–2011 жж. — Қазақстан Республикасы Президентінің «Қазақстан-2030» бағдарламасын қолдау қоғамдық қорының вице-президенті.',
        '2011–2013 жж. — «Нұр Отан» партиясы Бостандық аудандық филиалы төрағасының бірінші орынбасары.',
        '2013–2018 жж. — «Нұр Отан» партиясы Алматы қалалық филиалы төрағасының орынбасары.',
        '2018–2021 жж. — «Нұр Отан» партиясы Алматы қалалық филиалы төрағасының бірінші орынбасары.',
        '2021–2023 жж. — Алматы қаласы Мәслихатының төрағасы.',
        '2023 жылдан 01.07.2026 ж. дейін — «AMANAT» партиясы Алматы қалалық филиалының төрағасы.',
        '01.07.2026 жылдан бастап қазіргі уақытқа дейін — «Әділет» партиясы Алматы қалалық филиалының төрағасы.',
      ].join('\n'),
      en: [
        'Education: KBTU (Doctor of Business Administration), Lomonosov Moscow State University (MBA), D. Kunayev University, Central Asian University.',
        'Career:',
        '2005–2006 — Specialist, Chief Specialist, Director, "Technical Inventory of Property" LLP.',
        '2006–2010 — Vice-President, "PSTK Bitelecom" JSC.',
        '2010–2011 — Vice-President, "Kazakhstan-2030" Presidential Programme Support Public Foundation.',
        '2011–2013 — First Deputy Chairman, Bostandyk District Branch of the "Nur Otan" party.',
        '2013–2018 — Deputy Chairman, Almaty City Branch of the "Nur Otan" party.',
        '2018–2021 — First Deputy Chairman, Almaty City Branch of the "Nur Otan" party.',
        '2021–2023 — Chairman of the Almaty City Maslikhat.',
        '2023 – 1 July 2026 — Chairman, Almaty City Branch of the "AMANAT" party.',
        'Since 1 July 2026 — Chairman, Almaty City Branch of the "Adilet" party.',
      ].join('\n'),
    },
  },
];

/* ------------------------------------------ организационная структура ---- */

export interface OrgNodeContent {
  id: string;
  parentId: string | null;
  accent: boolean;
  /** Подчинённые выстраиваются колонкой — как в утверждённой схеме. */
  stack: boolean;
  title: T;
  subtitle?: T;
}

/** Схема из документа «для сайта.docx», воспроизведена узел в узел. */
export const ORG_NODES: OrgNodeContent[] = [
  {
    id: 'supervisory',
    parentId: null,
    accent: true,
    stack: false,
    title: { ru: 'Наблюдательный совет', kk: 'Бақылау кеңесі', en: 'Supervisory Board' },
  },
  {
    id: 'chair',
    parentId: 'supervisory',
    accent: true,
    stack: false,
    title: {
      ru: 'Председатель Правления',
      kk: 'Басқарма Төрағасы',
      en: 'Chairman of the Management Board',
    },
  },
  {
    id: 'pr',
    parentId: 'chair',
    accent: false,
    stack: true,
    title: { ru: 'Директор по PR и GR', kk: 'PR және GR директоры', en: 'PR and GR Director' },
  },
  {
    id: 'press',
    parentId: 'pr',
    accent: false,
    stack: false,
    title: { ru: 'Пресс-служба', kk: 'Баспасөз қызметі', en: 'Press Office' },
  },
  {
    id: 'deputy1',
    parentId: 'chair',
    accent: true,
    stack: true,
    title: {
      ru: 'Заместитель Председателя Правления',
      kk: 'Басқарма Төрағасының орынбасары',
      en: 'Deputy Chairman of the Management Board',
    },
  },
  {
    id: 'accounting',
    parentId: 'deputy1',
    accent: false,
    stack: false,
    title: { ru: 'Главный бухгалтер', kk: 'Бас бухгалтер', en: 'Chief Accountant' },
  },
  {
    id: 'budget',
    parentId: 'deputy1',
    accent: false,
    stack: false,
    title: {
      ru: 'Департамент бюджетного планирования',
      kk: 'Бюджеттік жоспарлау департаменті',
      en: 'Budget Planning Department',
    },
  },
  {
    id: 'orgdep',
    parentId: 'deputy1',
    accent: false,
    stack: false,
    title: {
      ru: 'Департамент организационной деятельности',
      kk: 'Ұйымдастыру қызметі департаменті',
      en: 'Organisational Affairs Department',
    },
  },
  {
    id: 'legal',
    parentId: 'deputy1',
    accent: false,
    stack: false,
    title: {
      ru: 'Департамент правового обеспечения',
      kk: 'Құқықтық қамтамасыз ету департаменті',
      en: 'Legal Support Department',
    },
  },
  {
    id: 'procurement',
    parentId: 'deputy1',
    accent: false,
    stack: false,
    title: { ru: 'Служба закупок', kk: 'Сатып алу қызметі', en: 'Procurement Service' },
  },
  {
    id: 'deputy2',
    parentId: 'chair',
    accent: true,
    stack: true,
    title: {
      ru: 'Заместитель Председателя Правления',
      kk: 'Басқарма Төрағасының орынбасары',
      en: 'Deputy Chairman of the Management Board',
    },
  },
  {
    id: 'design',
    parentId: 'deputy2',
    accent: false,
    stack: false,
    title: {
      ru: 'Департамент проектирования и архитектуры',
      kk: 'Жобалау және сәулет департаменті',
      en: 'Design and Architecture Department',
    },
  },
  {
    id: 'ecology',
    parentId: 'deputy2',
    accent: false,
    stack: false,
    title: { ru: 'Департамент экологии', kk: 'Экология департаменті', en: 'Environment Department' },
  },
  {
    id: 'construction',
    parentId: 'deputy2',
    accent: false,
    stack: false,
    title: {
      ru: 'Департамент строительства и технического надзора',
      kk: 'Құрылыс және техникалық қадағалау департаменті',
      en: 'Construction and Technical Supervision Department',
    },
  },
];

export const ORG_HEADCOUNT_HTML: T = {
  ru: '<p><strong>Штатная численность — 16 единиц.</strong></p>',
  kk: '<p><strong>Штат саны — 16 бірлік.</strong></p>',
  en: '<p><strong>Headcount — 16 positions.</strong></p>',
};

/* ------------------------------------------------- государственные закупки */

export const PROCUREMENT_TITLE: T = {
  ru: 'Государственные закупки',
  kk: 'Мемлекеттік сатып алу',
  en: 'Public procurement',
};

export const PROCUREMENT_HTML: T = {
  ru:
    '<p>Уважаемые потенциальные поставщики!</p>' +
    '<p>Настоящим доводим до Вашего сведения, что ТОО «Almaty Tau Management» осуществляет закупки товаров, работ и услуг на веб-портале государственных закупок Республики Казахстан по адресу: <a href="https://goszakup.gov.kz/">https://goszakup.gov.kz/</a></p>' +
    '<p>Заинтересованные потенциальные поставщики могут зарегистрироваться на портале государственных закупок и участвовать в проводимых закупках.</p>' +
    '<ul>' +
    '<li>Закон Республики Казахстан «О государственных закупках» от 4 декабря 2015 года № 434-V</li>' +
    '<li>Правила осуществления государственных закупок, приказ Министра финансов Республики Казахстан от 11 декабря 2015 года № 648</li>' +
    '</ul>',
  kk:
    '<p>Құрметті әлеуетті жеткізушілер!</p>' +
    '<p>Осы арқылы «Almaty Tau Management» ЖШС тауарларды, жұмыстарды және қызметтерді Қазақстан Республикасының мемлекеттік сатып алу веб-порталында жүзеге асыратынын хабарлаймыз: <a href="https://goszakup.gov.kz/">https://goszakup.gov.kz/</a></p>' +
    '<p>Мүдделі әлеуетті жеткізушілер мемлекеттік сатып алу порталында тіркеліп, өткізілетін сатып алуларға қатыса алады.</p>' +
    '<ul>' +
    '<li>«Мемлекеттік сатып алу туралы» Қазақстан Республикасының 2015 жылғы 4 желтоқсандағы № 434-V Заңы</li>' +
    '<li>Мемлекеттік сатып алуды жүзеге асыру қағидалары, Қазақстан Республикасы Қаржы министрінің 2015 жылғы 11 желтоқсандағы № 648 бұйрығы</li>' +
    '</ul>',
  en:
    '<p>Dear potential suppliers,</p>' +
    '<p>Almaty Tau Management LLP procures goods, works and services through the public procurement web portal of the Republic of Kazakhstan: <a href="https://goszakup.gov.kz/">https://goszakup.gov.kz/</a></p>' +
    '<p>Interested suppliers may register on the portal and take part in the procurement procedures.</p>' +
    '<ul>' +
    '<li>Law of the Republic of Kazakhstan “On Public Procurement” of 4 December 2015, No. 434-V</li>' +
    '<li>Rules for conducting public procurement, Order of the Minister of Finance of the Republic of Kazakhstan of 11 December 2015, No. 648</li>' +
    '</ul>',
};

/* ------------------------------------------------------------- контакты */

export const CONTACTS = {
  phones: ['+7 (727) 225-18-91'],
  emails: ['info@almatytm.kz'],
  workingHours: {
    ru: 'Пн–Пт: 08:30–18:00; Сб–Вс: выходной',
    kk: 'Дс–Жм: 08:30–18:00; Сб–Жс: демалыс',
    en: 'Mon–Fri: 08:30–18:00; Sat–Sun: closed',
  } satisfies T,
  address: {
    ru: 'г. Алматы, ул. Байзакова, 303 (2 этаж)',
    kk: 'Алматы қаласы, Байзақов көшесі, 303 (2-қабат)',
    en: '303 Baizakov St. (2nd floor), Almaty',
  } satisfies T,
};
