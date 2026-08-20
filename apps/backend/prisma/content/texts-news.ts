/* ============================================================================
   Тексты новостей.

   Источник — пять пресс-релизов, присланных Заказчиком в отдельных файлах
   Word («ОМ релиз», «Иле-Алатау», «Общ совет и маслихат», «Гражданский
   альянс», «Атамекен») в ответ на замечание от 19.08.2026, п. 6
   («В блоке новостей разместить релизы по дате»). Русский и казахский текст
   в каждом файле — оба языка от Заказчика, приведены дословно. Английский —
   рабочий перевод, который Заказчик вычитывает перед сдачей (см. texts.ts).

   Материалы упорядочены по дате мероприятия (не по дате файла):
   Атамекен (12.05) → Иле-Алатау (14.05) → Гражданский альянс (15.05) →
   Общественный совет и маслихат (19.05) → общественные слушания (26.05).
   ========================================================================== */

import type { T } from './texts';

/** Часть тела новости: абзацы текста либо выделенная цитата. */
export type NewsPart =
  | { kind: 'text'; html: T }
  | { kind: 'quote'; text: T; author: T; role: T };

export interface NewsArticle {
  slug: string;
  /** ISO-дата мероприятия, которому посвящён релиз. */
  publishedAt: string;
  title: T;
  excerpt: T;
  parts: NewsPart[];
}

export const NEWS_ARTICLES: NewsArticle[] = [
  /* -------------------------------------------------------- Атамекен, 12.05 */
  {
    slug: 'atameken-release',
    publishedAt: '2026-05-12T09:00:00.000Z',
    title: {
      ru: 'Представители бизнеса и туристской отрасли поддержали развитие проектов Алматинского горного кластера и «Almaty Superski»',
      kk: 'Бизнес және туризм саласының өкілдері Алматы тау кластері мен «Almaty Superski» жобаларын дамытуды қолдады',
      en: 'Business and tourism industry representatives back the Almaty Mountain Cluster and Almaty Superski projects',
    },
    excerpt: {
      ru: 'НПП РК «Атамекен» провела совещание с участием госорганов, бизнеса и научных институтов, посвящённое развитию Алматинского горного кластера и проекта «Almaty Superski».',
      kk: 'ҚР «Атамекен» ҰКП мемлекеттік органдар, бизнес және ғылыми институттар қатысқан, Алматы тау кластері мен «Almaty Superski» жобасын дамытуға арналған кеңес өткізді.',
      en: 'The Atameken National Chamber of Entrepreneurs hosted a meeting with government bodies, business and research institutes on developing the Almaty Mountain Cluster and the Almaty Superski project.',
    },
    parts: [
      {
        kind: 'text',
        html: {
          ru:
            '<p>12 мая в Алматы на площадке НИИ «Алматыгенплан» состоялось масштабное совещание, посвящённое развитию Алматинского горного кластера и стратегического проекта «Almaty Superski» — крупнейшей туристической инициативы Казахстана, способной сформировать новый международный центр горного туризма в Центральной Азии. Организатором мероприятия выступила Национальная палата предпринимателей Республики Казахстан «Атамекен».</p>' +
            '<p>В обсуждении приняли участие представители центральных государственных органов, акимата Алматы, национальных компаний, туристической индустрии, бизнес-сообщества, отраслевых ассоциаций, научных институтов и экспертного сообщества. Встреча стала знаковым этапом в формировании долгосрочного видения развития Алматы как современного глобального туристического и инвестиционного центра.</p>' +
            '<p>Участники совещания выразили широкую поддержку реализации проектов Алматинского горного кластера и «Almaty Superski», подчеркнув их стратегическое значение для экономики страны, развития несырьевых отраслей и укрепления международных позиций Казахстана в сфере туризма.</p>' +
            '<p>Председатель Президиума НПП РК «Атамекен» Канат Шарлапаев отметил, что развитие горного кластера Алматы является проектом национального масштаба, способным стать новой точкой экономического роста страны:</p>',
          kk:
            '<p>12 мамырда Алматы қаласында «Алматыгенплан» ғылыми-зерттеу институтының алаңында Алматы тау кластерін және Қазақстандағы ең ірі туристік бастамалардың бірі — Орталық Азияда жаңа халықаралық тау туризмі орталығын қалыптастыруға мүмкіндік беретін «Almaty Superski» стратегиялық жобасын дамыту мәселелеріне арналған ауқымды кеңес өтті. Іс-шараны Қазақстан Республикасының «Атамекен» Ұлттық кәсіпкерлер палатасы ұйымдастырды.</p>' +
            '<p>Талқылауға орталық мемлекеттік органдардың, Алматы қаласы әкімдігінің, ұлттық компаниялардың, туристік индустрияның, бизнес-қоғамдастықтың, салалық қауымдастықтардың, ғылыми-зерттеу институттары мен сарапшылар қауымдастығының өкілдері қатысты. Кездесу Алматы қаласын заманауи жаһандық туристік және инвестициялық орталық ретінде дамытудың ұзақмерзімді пайымын қалыптастырудағы маңызды кезең болды.</p>' +
            '<p>Кеңеске қатысушылар Алматы тау кластері мен «Almaty Superski» жобаларын іске асыруға жан-жақты қолдау білдіріп, олардың ел экономикасы, шикізаттық емес салаларды дамыту және Қазақстанның туризм саласындағы халықаралық ұстанымдарын нығайту үшін стратегиялық маңызын атап өтті.</p>' +
            '<p>Қазақстан Республикасы «Атамекен» Ұлттық кәсіпкерлер палатасы Төралқасының төрағасы Қанат Шарлапаев Алматы тау кластерін дамыту ел экономикасының жаңа өсу нүктесіне айналуға қабілетті ұлттық ауқымдағы жоба екенін атап өтті:</p>',
          en:
            '<p>On 12 May, Almaty hosted a large-scale conference at the Almatygenplan research institute dedicated to the development of the Almaty Mountain Cluster and the strategic Almaty Superski project — one of Kazakhstan’s largest tourism initiatives, capable of forming a new international mountain tourism hub in Central Asia. The event was organised by the Atameken National Chamber of Entrepreneurs of the Republic of Kazakhstan.</p>' +
            '<p>The discussion brought together representatives of central government bodies, the Almaty city administration, national companies, the tourism industry, the business community, industry associations, research institutes and the expert community. The meeting marked a significant step in shaping a long-term vision for Almaty’s development as a modern global tourism and investment hub.</p>' +
            '<p>Participants voiced broad support for the Almaty Mountain Cluster and Almaty Superski projects, underscoring their strategic importance for the national economy, the growth of non-resource sectors and the strengthening of Kazakhstan’s international standing in tourism.</p>' +
            '<p>Kanat Sharlapayev, Chairman of the Presidium of the Atameken National Chamber of Entrepreneurs, noted that developing Almaty’s mountain cluster is a project of national scale capable of becoming a new driver of economic growth for the country:</p>',
        },
      },
      {
        kind: 'quote',
        text: {
          ru: 'Развитие горного кластера Алматы — это создание современной экономической экосистемы, которая обеспечит устойчивый рост туризма, бизнеса, занятости и инвестиций. Алматы должен стать ведущим туристическим и предпринимательским центром Центральной Азии и одним из ключевых горных направлений Евразии.',
          kk: 'Алматы тау кластерін дамыту — туризмнің, бизнестің, жұмыспен қамтудың және инвестициялардың тұрақты өсуін қамтамасыз ететін заманауи экономикалық экожүйені қалыптастыру. Алматы Орталық Азиядағы жетекші туристік және кәсіпкерлік орталыққа, сондай-ақ Еуразиядағы негізгі тау туризмі бағыттарының біріне айналуға тиіс.',
          en: 'Developing Almaty’s mountain cluster means building a modern economic ecosystem that will ensure sustained growth in tourism, business, employment and investment. Almaty should become a leading tourism and business hub in Central Asia and one of the key mountain destinations in Eurasia.',
        },
        author: { ru: 'Канат Шарлапаев', kk: 'Қанат Шарлапаев', en: 'Kanat Sharlapayev' },
        role: {
          ru: 'Председатель Президиума НПП РК «Атамекен»',
          kk: 'ҚР «Атамекен» ҰКП Төралқасының төрағасы',
          en: 'Chairman of the Presidium, Atameken National Chamber of Entrepreneurs',
        },
      },
      {
        kind: 'text',
        html: {
          ru:
            '<p>В ходе совещания была представлена концепция развития Алматинского горного кластера, предусматривающая создание единой высокотехнологичной инфраструктуры мирового уровня с интеграцией туристических, спортивных, экологических и рекреационных объектов.</p>' +
            '<p>Ключевым направлением станет объединение курортов «Шымбулак» и «Oi-Qaragai» через базовую станцию «Медеу» в единую крупнейшую горнолыжную систему региона. Проект предусматривает строительство 30 современных канатных дорог и создание 151 километра трасс. Реализация инфраструктуры позволит увеличить пропускную способность горного кластера в пять раз — с 6 до 30 тысяч туристов в сутки.</p>' +
            '<p>Отдельно подчеркивалось, что Алматинский горный кластер рассматривается не только как центр зимнего туризма, но и как круглогодичная туристическая экосистема международного уровня. Проект включает развитие сети хайкинг-маршрутов, велосипедных и маунтинбайк-трасс, создание современных визит-центров, развитие экологического туризма, цифровых сервисов и единой системы безопасности в горах.</p>' +
            '<p>Одним из центральных элементов обсуждения стал проект «Almaty Superski», ориентированный на формирование крупнейшего всесезонного горного курорта Центральной Азии. Главный исполнительный директор Kazakh Tourism Development Ержан Еркинбаев отметил, что реализация проекта позволит вывести туристическую отрасль Алматы на качественно новый уровень и создать новую международную точку притяжения для туристов, инвесторов и мировых спортивных событий.</p>' +
            '<p>По мнению участников встречи, Алматы обладает уникальным природным, географическим и инфраструктурным потенциалом для формирования конкурентоспособного горного туристического направления мирового уровня. На фоне активного развития современных горных курортов в странах Центральной Азии участники подчеркнули необходимость ускоренного развития аналогичной инфраструктуры в Казахстане для укрепления лидерских позиций региона.</p>' +
            '<p>Особое внимание в рамках совещания было уделено вопросам экологической устойчивости. Разработчики отметили, что проект реализуется в тесном взаимодействии с профильными научными институтами и экспертами в области экологии, гидрологии, зоологии и устойчивого природопользования. Предусмотренные решения направлены на создание организованной современной инфраструктуры, регулирование туристических потоков и снижение антропогенной нагрузки на природную среду.</p>' +
            '<p>Участники встречи подчеркнули, что реализация Алматинского горного кластера станет мощным драйвером развития малого и среднего бизнеса, гостиничной отрасли, транспорта, общественного питания, цифровых сервисов и индустрии гостеприимства в целом. Проект также позволит создать тысячи новых рабочих мест, привлечь значительные инвестиции и повысить глобальную узнаваемость Алматы и Казахстана.</p>' +
            '<p>По итогам совещания было отмечено, что развитие Алматинского горного кластера и проекта «Almaty Superski» является стратегическим шагом к формированию новой туристической экономики Казахстана и укреплению статуса Алматы как одного из ведущих международных центров горного туризма Евразии.</p>',
          kk:
            '<p>Кеңес барысында туристік, спорттық, экологиялық және рекреациялық нысандарды біріктіретін әлемдік деңгейдегі бірыңғай жоғары технологиялық инфрақұрылымды құруды көздейтін Алматы тау кластерін дамыту тұжырымдамасы таныстырылды.</p>' +
            '<p>Жобаның негізгі бағыттарының бірі — «Шымбұлақ» және «Oi-Qaragai» курорттарын «Медеу» базалық станциясы арқылы өңірдегі ірі бірыңғай тау шаңғысы жүйесіне біріктіру. Жоба 30 заманауи аспалы жол салуды және жалпы ұзындығы 151 шақырым болатын тау шаңғысы трассаларын құруды көздейді. Инфрақұрылымды іске асыру тау кластерінің өткізу қабілетін бес есеге — тәулігіне 6 мыңнан 30 мың туристке дейін арттыруға мүмкіндік береді.</p>' +
            '<p>Сонымен қатар, Алматы тау кластері тек қысқы туризм орталығы ретінде ғана емес, халықаралық деңгейдегі жыл бойы жұмыс істейтін туристік экожүйе ретінде қарастырылатыны атап өтілді. Жоба хайкинг бағыттарының, велосипед және маунтинбайк трассаларының желісін дамытуды, заманауи визит-орталықтар құруды, экотуризмді, цифрлық сервистерді және таудағы бірыңғай қауіпсіздік жүйесін дамытуды қамтиды.</p>' +
            '<p>Талқылаудың негізгі тақырыптарының бірі Орталық Азиядағы ең ірі жыл бойы жұмыс істейтін тау курортын қалыптастыруға бағытталған «Almaty Superski» жобасы болды. Kazakh Tourism Development компаниясының бас атқарушы директоры Ержан Еркінбаев жобаны іске асыру Алматының туристік саласын сапалық жаңа деңгейге көтеруге және туристерді, инвесторларды, сондай-ақ әлемдік деңгейдегі спорттық іс-шараларды тартатын жаңа халықаралық орталық қалыптастыруға мүмкіндік беретінін атап өтті.</p>' +
            '<p>Кездесуге қатысушылардың пікірінше, Алматы әлемдік деңгейде бәсекеге қабілетті тау туризмі бағытын қалыптастыру үшін бірегей табиғи, географиялық және инфрақұрылымдық әлеуетке ие. Орталық Азия елдерінде заманауи тау курорттарының белсенді дамып келе жатқанын ескере отырып, қатысушылар Қазақстанның өңірдегі көшбасшылық ұстанымдарын нығайту мақсатында осыған ұқсас инфрақұрылымды жедел дамыту қажеттігін атап өтті.</p>' +
            '<p>Кеңес барысында экологиялық тұрақтылық мәселелеріне ерекше назар аударылды. Жобаны әзірлеушілер оның экология, гидрология, зоология және табиғи ресурстарды орнықты пайдалану салаларындағы бейінді ғылыми-зерттеу институттары және сарапшылармен тығыз өзара іс-қимыл негізінде іске асырылып жатқанын атап өтті. Жобада көзделген шешімдер заманауи әрі реттелген инфрақұрылымды қалыптастыруға, туристік ағындарды басқаруға және табиғи ортаға түсетін антропогендік жүктемені азайтуға бағытталған.</p>' +
            '<p>Кездесуге қатысушылар Алматы тау кластерін іске асыру шағын және орта бизнесті, қонақүй саласын, көлік инфрақұрылымын, қоғамдық тамақтану секторын, цифрлық сервистерді және жалпы қонақжайлылық индустриясын дамытудың қуатты драйверіне айналатынын атап өтті. Сондай-ақ жоба мыңдаған жаңа жұмыс орнын ашуға, елеулі инвестициялар тартуға және Алматы мен Қазақстанның жаһандық деңгейдегі танымалдығын арттыруға мүмкіндік береді.</p>' +
            '<p>Кеңес қорытындысы бойынша Алматы тау кластері мен «Almaty Superski» жобасын дамыту Қазақстанның жаңа туристік экономикасын қалыптастыру және Алматының Еуразиядағы жетекші халықаралық тау туризмі орталықтарының бірі ретіндегі мәртебесін нығайту жолындағы стратегиялық қадам екені атап өтілді.</p>',
          en:
            '<p>The conference presented the concept for developing the Almaty Mountain Cluster, which envisages a single, world-class, high-technology infrastructure integrating tourism, sports, environmental and recreational facilities.</p>' +
            '<p>A key focus will be linking the Shymbulak and Oi-Qaragai resorts through the Medeu base station into the region’s largest unified ski system. The project provides for the construction of 30 modern cable cars and 151 kilometres of runs. The new infrastructure will increase the cluster’s capacity fivefold — from 6,000 to 30,000 visitors per day.</p>' +
            '<p>Speakers stressed that the Almaty Mountain Cluster is envisioned not only as a winter tourism hub but as a year-round, international-standard tourism ecosystem. The project includes a network of hiking trails, cycling and mountain-bike routes, modern visitor centres, ecological tourism, digital services and a unified mountain safety system.</p>' +
            '<p>One of the central topics of discussion was the Almaty Superski project, aimed at creating the largest year-round mountain resort in Central Asia. Yerzhan Yerkinbayev, CEO of Kazakh Tourism Development, noted that the project will raise Almaty’s tourism industry to a qualitatively new level and create a new international draw for tourists, investors and major sporting events.</p>' +
            '<p>Participants agreed that Almaty has unique natural, geographic and infrastructural potential to become a globally competitive mountain tourism destination. Given the active development of modern mountain resorts across Central Asia, participants stressed the need to accelerate the development of comparable infrastructure in Kazakhstan to strengthen the region’s leadership position.</p>' +
            '<p>Particular attention was paid to environmental sustainability. Developers noted that the project is being carried out in close cooperation with specialised research institutes and experts in ecology, hydrology, zoology and sustainable land use. The proposed solutions are aimed at creating organised modern infrastructure, managing tourist flows and reducing the human impact on the natural environment.</p>' +
            '<p>Participants emphasised that implementing the Almaty Mountain Cluster will become a powerful driver for small and medium-sized business, the hotel industry, transport, catering, digital services and the hospitality sector as a whole. The project will also create thousands of new jobs, attract significant investment and raise the global profile of Almaty and Kazakhstan.</p>' +
            '<p>The meeting concluded that developing the Almaty Mountain Cluster and the Almaty Superski project is a strategic step toward building Kazakhstan’s new tourism economy and reinforcing Almaty’s status as one of Eurasia’s leading international mountain tourism centres.</p>',
        },
      },
    ],
  },

  /* ---------------------------------------------------- Иле-Алатау, 14.05 */
  {
    slug: 'koordinacionny-sovet-ile-alatau',
    publishedAt: '2026-05-14T09:00:00.000Z',
    title: {
      ru: 'Координационный совет при Иле-Алатауском государственном национальном природном парке поддержал проект развития Алматинского горного кластера',
      kk: 'Іле-Алатауы мемлекеттік ұлттық табиғи паркінің жанындағы Үйлестіру кеңесі Алматы тау кластерін дамыту жобасын қолдады',
      en: 'Coordination Council at the Ile-Alatau State National Nature Park backs the Almaty Mountain Cluster development project',
    },
    excerpt: {
      ru: 'Координационный совет при Иле-Алатауском ГНПП рассмотрел проект Алматинского горного кластера и поддержал его дальнейшую реализацию.',
      kk: 'Іле-Алатауы МҰТП жанындағы Үйлестіру кеңесі Алматы тау кластері жобасын қарап, оны одан әрі іске асыруды қолдады.',
      en: 'The Coordination Council at the Ile-Alatau State National Nature Park reviewed the Almaty Mountain Cluster project and backed its further implementation.',
    },
    parts: [
      {
        kind: 'text',
        html: {
          ru:
            '<p>14 мая 2026 года на территории визит-центра «Аюсай» состоялось заседание Координационного совета при Иле-Алатауском ГНПП по вопросам развития Алматинского горного кластера.</p>' +
            '<p>В заседании приняли участие председатель Координационного совета, к.э.н., общественный деятель Мухтар Тайжан, руководитель Управления туризма г. Алматы Галия Токсеитова, заместитель генерального директора ГНПП «Іле-Алатауы» Аркау Шантаев, старший преподаватель кафедры рекреационной географии и туризма КазНУ им. аль-Фараби Жанар Алчимбаева и другие.</p>' +
            '<p>Помимо членов Координационного совета, в обсуждении приняли участие представители РГП на ПХВ «Институт зоологии», ТОО «Институт гидрогеологии и геоэкологии им. У.М. Ахмедсафина», РГП «Государственный институт проведения работ по обследованию земель», спортивной отрасли и экспертного сообщества.</p>' +
            '<p>В рамках повестки заседания состоялась презентация проекта Алматинского горного кластера. Председатель правления ТОО «Almaty Tau Management» Жан Пьер Барало и его заместитель Александр Руденко представили международный опыт развития горных курортов, детальный план реализации проекта, специализацию будущих курортных зон, а также ожидаемые социально-экономические эффекты для населения и экономики города.</p>' +
            '<p>Отдельное внимание было уделено вопросам экологической устойчивости и сохранения природного баланса. В ходе обсуждения было подчеркнуто, что вся территория Алматинского горного кластера сохранит статус особо охраняемых природных территорий.</p>' +
            '<p>Реализация проекта предусматривает комплексный научный подход с участием профильных институтов в области зоологии, археологии, гидрологии и других направлений экологических исследований.</p>' +
            '<p>Также участникам заседания были представлены проекты по реконструкции и развитию транспортной инфраструктуры, направленные на повышение доступности объектов Алматинского горного кластера и регулирование туристических потоков в горной местности. С докладом выступил руководитель отдела перспективного развития и проектирования Управления развития дорожной инфраструктуры города Алматы Данияр Надырканов.</p>' +
            '<p>В ходе обсуждения отмечено, что в рамках проекта планируется сохранение социальной ориентированности курортной инфраструктуры, включая льготные условия для детей, пенсионеров и людей с ограниченными возможностями, а также формирование приемлемой ценовой политики для посетителей.</p>' +
            '<p>Членами Координационного совета и представителями экспертного сообщества были поставлены вопросы, а также озвучены замечания и конструктивные предложения по дальнейшей реализации проекта.</p>' +
            '<p>По итогам заседания участники выразили поддержку развитию Алматинского горного кластера, подчеркнув, что реализация проекта позволит создать новые рабочие места, откроет возможности для развития туризма, малого и среднего бизнеса, а также повысит международную туристическую и инвестиционную привлекательность Алматы.</p>',
          kk:
            '<p>2026 жылғы 14 мамырда «Аюсай» визит-орталығының аумағында Іле-Алатауы мемлекеттік ұлттық табиғи паркінің жанындағы Үйлестіру кеңесінің Алматы тау кластерін дамыту мәселелеріне арналған отырысы өтті.</p>' +
            '<p>Отырысқа Үйлестіру кеңесінің төрағасы, экономика ғылымдарының кандидаты, қоғам қайраткері Мұхтар Тайжан, Алматы қаласы Туризм басқармасының басшысы Ғалия Тоқсеитова, «Іле-Алатауы» мемлекеттік ұлттық табиғи паркі бас директорының орынбасары Арқау Шантаев, әл-Фараби атындағы Қазақ ұлттық университетінің рекреациялық география және туризм кафедрасының аға оқытушысы Жанар Алчимбаева және басқа да өкілдер қатысты.</p>' +
            '<p>Үйлестіру кеңесінің мүшелерімен қатар талқылауға «Зоология институты» ШЖҚ РМК, У.М. Ахмедсафин атындағы Гидрогеология және геоэкология институты» ЖШС, «Жерлерді зерттеп-қарау жұмыстарын жүргізу мемлекеттік институты» РМК, спорт саласы мен сарапшылар қауымдастығының өкілдері қатысты.</p>' +
            '<p>Отырыс күн тәртібі аясында Алматы тау кластерінің жобасы таныстырылды. «Almaty Tau Management» ЖШС Басқарма төрағасы Жан Пьер Барало және оның орынбасары Александр Руденко тау курорттарын дамытудың халықаралық тәжірибесі, жобаны іске асырудың егжей-тегжейлі жоспары, болашақ курорттық аймақтардың мамандануы, сондай-ақ қала тұрғындары мен экономикасы үшін күтілетін әлеуметтік-экономикалық әсерлер туралы баяндады.</p>' +
            '<p>Экологиялық тұрақтылық пен табиғи тепе-теңдікті сақтау мәселелеріне ерекше назар аударылды. Талқылау барысында Алматы тау кластерінің бүкіл аумағында ерекше қорғалатын табиғи аумақ мәртебесі сақталатыны атап өтілді.</p>' +
            '<p>Жобаны іске асыру зоология, археология, гидрология және экологиялық зерттеулердің басқа да бағыттары бойынша бейінді ғылыми-зерттеу институттарының қатысуымен кешенді ғылыми тәсілді көздейді.</p>' +
            '<p>Сонымен қатар, отырысқа қатысушыларға Алматы тау кластері нысандарының қолжетімділігін арттыруға және таулы аумақтардағы туристік ағындарды реттеуге бағытталған көлік инфрақұрылымын реконструкциялау және дамыту жобалары таныстырылды. Осы мәселе бойынша Алматы қаласы Жол инфрақұрылымын дамыту басқармасының перспективалық даму және жобалау бөлімінің басшысы Данияр Надырқанов баяндама жасады.</p>' +
            '<p>Талқылау барысында жоба аясында курорттық инфрақұрылымның әлеуметтік бағдарлануын сақтау жоспарланып отырғаны атап өтілді. Атап айтқанда, балаларға, зейнеткерлерге және мүмкіндігі шектеулі адамдарға жеңілдікті жағдайлар қарастыру, сондай-ақ келушілер үшін қолжетімді баға саясатын қалыптастыру көзделген.</p>' +
            '<p>Үйлестіру кеңесінің мүшелері мен сарапшылар қауымдастығының өкілдері жобаны одан әрі іске асыруға қатысты бірқатар сұрақтар қойып, ескертулер мен сындарлы ұсыныстарын білдірді.</p>' +
            '<p>Отырыс қорытындысы бойынша қатысушылар Алматы тау кластерін дамытуға қолдау білдіріп, жобаны іске асыру жаңа жұмыс орындарын ашуға, туризм мен шағын және орта бизнесті дамытуға жаңа мүмкіндіктер беруге, сондай-ақ Алматы қаласының халықаралық туристік және инвестициялық тартымдылығын арттыруға ықпал ететінін атап өтті.</p>',
          en:
            '<p>On 14 May 2026, the Coordination Council at the Ile-Alatau State National Nature Park held a session at the Ayusai visitor centre to discuss the development of the Almaty Mountain Cluster.</p>' +
            '<p>The session was attended by the Council’s chairman, PhD in Economics and public figure Mukhtar Taizhan; the head of the Almaty Tourism Department, Galiya Toxeitova; the deputy director general of the Ile-Alatau State National Nature Park, Arkau Shantayev; a senior lecturer of the Department of Recreational Geography and Tourism at al-Farabi Kazakh National University, Zhanar Alchimbayeva; and other representatives.</p>' +
            '<p>Alongside Council members, the discussion involved representatives of the Institute of Zoology, the Akhmedsafin Institute of Hydrogeology and Geoecology, the State Institute for Land Survey Works, the sports sector and the expert community.</p>' +
            '<p>The session included a presentation of the Almaty Mountain Cluster project. Jean-Pierre Barrallo, Chairman of the Board of Almaty Tau Management LLP, and his deputy Alexander Rudenko presented international experience in mountain resort development, a detailed implementation plan, the specialisation of future resort zones, and the expected social and economic effects for residents and the city’s economy.</p>' +
            '<p>Particular attention was paid to environmental sustainability and preserving the natural balance. It was emphasised that the entire territory of the Almaty Mountain Cluster will retain its status as a specially protected natural area.</p>' +
            '<p>Implementation of the project envisages a comprehensive scientific approach involving specialised research institutes in zoology, archaeology, hydrology and other areas of environmental research.</p>' +
            '<p>Session participants were also presented with plans for reconstructing and developing transport infrastructure aimed at improving access to Almaty Mountain Cluster facilities and managing tourist flows in mountain areas. The presentation was delivered by Daniyar Nadyrkanov, head of the strategic development and design department at the Almaty Road Infrastructure Development Department.</p>' +
            '<p>Discussion participants noted that the project plans to preserve the social orientation of the resort infrastructure, including preferential terms for children, pensioners and people with disabilities, as well as an affordable pricing policy for visitors.</p>' +
            '<p>Members of the Coordination Council and representatives of the expert community raised questions and voiced comments and constructive proposals regarding the project’s further implementation.</p>' +
            '<p>Following the session, participants expressed support for the development of the Almaty Mountain Cluster, noting that the project will create new jobs, open up opportunities for tourism and small and medium-sized business, and enhance Almaty’s international tourism and investment appeal.</p>',
        },
      },
    ],
  },

  /* ------------------------------------------------- Гражданский альянс, 15.05 */
  {
    slug: 'grazhdanskiy-alyans-podderzhka',
    publishedAt: '2026-05-15T09:00:00.000Z',
    title: {
      ru: 'Представители общественности поддержали проекты Алматинского горного кластера и «Almaty Superski»',
      kk: 'Қоғам өкілдері Алматы тау кластері мен «Almaty Superski» жобаларын қолдады',
      en: 'Civil society representatives back the Almaty Mountain Cluster and Almaty Superski projects',
    },
    excerpt: {
      ru: 'Гражданский альянс города Алматы совместно с акиматом провёл совещание с представителями общественных организаций по проектам Алматинского горного кластера и «Almaty Superski».',
      kk: 'Алматы қаласының Азаматтық альянсы қала әкімдігімен бірлесіп, қоғамдық ұйымдар өкілдерінің қатысуымен Алматы тау кластері мен «Almaty Superski» жобалары бойынша кеңес өткізді.',
      en: 'The Almaty Civic Alliance, together with the city administration, held a meeting with civil society organisations on the Almaty Mountain Cluster and Almaty Superski projects.',
    },
    parts: [
      {
        kind: 'text',
        html: {
          ru:
            '<p>15 мая 2026 года состоялось совещание по вопросам развития проектов Алматинского горного кластера и «Almaty Superski». Организаторами мероприятия выступили Гражданский альянс г. Алматы совместно с акиматом города.</p>' +
            '<p>В мероприятии приняли участие представители общественных организаций, в том числе члены Общественного совета города Алматы, ОЮЛ «Almaty Azamattyq Alliance», ОФ «Жастар Үні», ОФ «Reliance», ОФ «Международный благотворительный фонд «Жанашыр», ОО «Неправительственная организация «Человек и общество» и других организаций.</p>' +
            '<p>С приветственным словом к участникам обратился Председатель ОЮЛ «Almaty Azamattyq Alliance» Нуржан Жакупов, подчеркнув необходимость комплексного и устойчивого развития горных территорий Алматы с учетом интересов жителей, экологии и туристического потенциала города.</p>' +
            '<p>В ходе встречи были представлены две ключевые инициативы по развитию горного туризма Алматы.</p>' +
            '<p>Заместитель председателя правления ТОО «Almaty Tau Management» Александр Руденко представил детальную презентацию проекта Алматинского горного кластера. Проект предусматривает комплексное развитие горных территорий Алматы, что откроет новые возможности для туризма, экономики региона и привлечения инвестиций. В рамках проекта курорты «Шымбулак» и «Oi-Qaragai» планируется соединить сетью канатных дорог и горнолыжных трасс через ущелья Кимасар, Бутаковку и курорт «Pioneer». При этом курорт «Pioneer» сохранит свою направленность как инклюзивное и круглогодичное пространство, где также впервые будет предусмотрено размещение современного противолавинного оборудования.</p>' +
            '<p>Вместе с тем директор по работе с государственными органами «Kazakh Tourism Development Ltd» Маргулан Байгужин представил проект «Almaty Superski» — масштабную инициативу по созданию современной круглогодичной горной экосистемы международного уровня. Проект предусматривает строительство новых подъёмников, широкой сети трасс различного уровня сложности, а также современной горной деревни с развитой инфраструктурой. Помимо зимнего туризма, концепция включает развитие хайкинг-маршрутов, велотрасс, инфраструктуры для маунтинбайка, а также создание единого контура безопасности в горах.</p>' +
            '<p>Особое внимание в ходе презентаций было уделено вопросам экологической устойчивости. Отмечено, что в рамках подготовки проектов ведётся системная работа с научными институтами в области зоологии, ботаники, почвоведения и других направлений экологических исследований. Организованная туристическая инфраструктура позволит более эффективно управлять туристическими потоками и снизить антропогенную нагрузку на горную экосистему.</p>' +
            '<p>После презентаций состоялось обсуждение проектов, в ходе которого участники смогли задать интересующие вопросы и обменяться мнениями.</p>' +
            '<p>По итогам встречи участники выразили поддержку развитию Алматинского горного кластера, подчеркнув, что реализация проектов позволит создать новые рабочие места, откроет дополнительные возможности для развития туризма, малого и среднего бизнеса, а также повысит международную туристическую и инвестиционную привлекательность Алматы.</p>',
          kk:
            '<p>2026 жылғы 15 мамырда Алматы тау кластері мен «Almaty Superski» жобаларын дамыту мәселелері бойынша кеңес өтті. Іс-шараны Алматы қаласының Азаматтық альянсы қала әкімдігімен бірлесіп ұйымдастырды.</p>' +
            '<p>Іс-шараға қоғамдық ұйымдардың өкілдері, оның ішінде Алматы қаласы Қоғамдық кеңесінің мүшелері, «Almaty Azamattyq Alliance» Заңды тұлғалар бірлестігі, «Жастар Үні» ҚҚ, «Reliance» ҚҚ, «Жанашыр» халықаралық қайырымдылық қоры» ҚҚ, «Адам және қоғам» үкіметтік емес ұйымы» ҚБ және басқа да ұйымдардың өкілдері қатысты.</p>' +
            '<p>Қатысушыларға «Almaty Azamattyq Alliance» ЗТБ төрағасы Нұржан Жақыпов құттықтау сөз сөйлеп, қала тұрғындарының мүдделерін, экологиялық талаптарды және Алматының туристік әлеуетін ескере отырып, таулы аумақтарды кешенді әрі орнықты дамытудың маңыздылығын атап өтті.</p>' +
            '<p>Кездесу барысында Алматыдағы тау туризмін дамытуға бағытталған екі негізгі бастама таныстырылды.</p>' +
            '<p>«Almaty Tau Management» ЖШС Басқарма төрағасының орынбасары Александр Руденко Алматы тау кластері жобасының егжей-тегжейлі таныстырылымын өткізді. Жоба Алматының таулы аумақтарын кешенді дамытуды көздейді, бұл туризмді, өңір экономикасын дамытуға және инвестициялар тартуға жаңа мүмкіндіктер ашады. Жоба аясында «Шымбұлақ» және «Oi-Qaragai» курорттарын Кімасар, Бутаковка шатқалдары және «Pioneer» курорты арқылы аспалы жолдар мен тау шаңғысы трассаларының желісімен байланыстыру жоспарлануда. Бұл ретте «Pioneer» курорты инклюзивті әрі жыл бойы жұмыс істейтін кеңістік ретіндегі бағытын сақтайды. Сондай-ақ мұнда алғаш рет заманауи көшкінге қарсы жабдықтарды орналастыру көзделген.</p>' +
            '<p>Сонымен қатар, «Kazakh Tourism Development Ltd» компаниясының мемлекеттік органдармен жұмыс жөніндегі директоры Марғұлан Байғұжин «Almaty Superski» жобасын — халықаралық деңгейдегі заманауи, жыл бойы жұмыс істейтін тау экожүйесін құруға бағытталған ауқымды бастаманы таныстырды. Жоба жаңа көтергіштерді, күрделілік деңгейі әртүрлі тау шаңғысы трассаларының кең желісін, сондай-ақ дамыған инфрақұрылымы бар заманауи тау ауылын салуды көздейді. Қысқы туризммен қатар, тұжырымдама хайкинг бағыттарын, велосипед жолдарын, маунтинбайк инфрақұрылымын дамытуды, сондай-ақ таудағы бірыңғай қауіпсіздік жүйесін қалыптастыруды қамтиды.</p>' +
            '<p>Таныстырылымдар барысында экологиялық тұрақтылық мәселелеріне ерекше назар аударылды. Жобаларды дайындау аясында зоология, ботаника, топырақтану және экологиялық зерттеулердің басқа да бағыттары бойынша ғылыми-зерттеу институттарымен жүйелі жұмыс жүргізіліп жатқаны атап өтілді. Ұйымдастырылған туристік инфрақұрылым туристік ағындарды неғұрлым тиімді басқаруға және таулы экожүйеге түсетін антропогендік жүктемені азайтуға мүмкіндік береді.</p>' +
            '<p>Таныстырылымдардан кейін жобалар бойынша талқылау өтіп, қатысушылар өздерін қызықтырған сұрақтарын қойып, пікір алмасты.</p>' +
            '<p>Кездесу қорытындысы бойынша қатысушылар Алматы тау кластерін дамытуға қолдау білдіріп, жобаларды іске асыру жаңа жұмыс орындарын ашуға, туризмді, шағын және орта бизнесті дамытуға қосымша мүмкіндіктер беруге, сондай-ақ Алматының халықаралық туристік және инвестициялық тартымдылығын арттыруға ықпал ететінін атап өтті.</p>',
          en:
            '<p>On 15 May 2026, a meeting was held on the development of the Almaty Mountain Cluster and Almaty Superski projects. The event was organised by the Almaty Civic Alliance together with the city administration.</p>' +
            '<p>Participants included representatives of civil society organisations, among them members of the Almaty Public Council, the Almaty Azamattyq Alliance association, the Zhastar Uni foundation, the Reliance foundation, the Zhanashyr International Charitable Foundation, the “Man and Society” NGO, and other organisations.</p>' +
            '<p>Nurzhan Zhakupov, Chairman of the Almaty Azamattyq Alliance, welcomed participants and stressed the need for the comprehensive and sustainable development of Almaty’s mountain areas, taking into account residents’ interests, environmental requirements and the city’s tourism potential.</p>' +
            '<p>Two key initiatives for developing mountain tourism in Almaty were presented during the meeting.</p>' +
            '<p>Alexander Rudenko, Deputy Chairman of the Board of Almaty Tau Management LLP, gave a detailed presentation of the Almaty Mountain Cluster project. The project provides for the comprehensive development of Almaty’s mountain areas, opening new opportunities for tourism, the regional economy and investment. It envisages linking the Shymbulak and Oi-Qaragai resorts with a network of cable cars and ski runs through the Kimasar and Butakovka gorges and the Pioneer resort. Pioneer will retain its focus as an inclusive, year-round space, and will also be the first site to host modern avalanche-control equipment.</p>' +
            '<p>Margulan Baigozhin, director for government relations at Kazakh Tourism Development Ltd, presented the Almaty Superski project — a large-scale initiative to create a modern, year-round mountain ecosystem of international standard. The project envisages new lifts, an extensive network of runs of varying difficulty, and a modern mountain village with developed infrastructure. Alongside winter tourism, the concept includes hiking trails, cycling routes, mountain-bike infrastructure and a unified mountain safety system.</p>' +
            '<p>Particular attention during the presentations was paid to environmental sustainability. It was noted that project preparation involves systematic work with research institutes in zoology, botany, soil science and other environmental fields. Organised tourism infrastructure will allow more effective management of tourist flows and reduce the human impact on the mountain ecosystem.</p>' +
            '<p>Following the presentations, participants discussed the projects, asking questions and exchanging views.</p>' +
            '<p>At the conclusion of the meeting, participants expressed support for the development of the Almaty Mountain Cluster, noting that implementing the projects will create new jobs, open additional opportunities for tourism and small and medium-sized business, and enhance Almaty’s international tourism and investment appeal.</p>',
        },
      },
    ],
  },

  /* ---------------------------------------------- Общ. совет и маслихат, 19.05 */
  {
    slug: 'obshchestvenny-sovet-maslikhat',
    publishedAt: '2026-05-19T09:00:00.000Z',
    title: {
      ru: 'Проекты Алматинского горного кластера и «Almaty Superski» получили поддержку Общественного совета и депутатов Маслихата города Алматы',
      kk: 'Алматы тау кластері мен «Almaty Superski» жобалары Алматы қаласы Қоғамдық кеңесі мен мәслихат депутаттарының қолдауына ие болды',
      en: 'The Almaty Mountain Cluster and Almaty Superski projects win support from the Public Council and Maslikhat deputies',
    },
    excerpt: {
      ru: 'На совместном заседании Общественного совета и Маслихата Алматы представлены проекты Алматинского горного кластера и «Almaty Superski», получившие поддержку депутатов.',
      kk: 'Алматы Қоғамдық кеңесі мен мәслихатының бірлескен отырысында Алматы тау кластері мен «Almaty Superski» жобалары таныстырылып, депутаттардың қолдауына ие болды.',
      en: 'A joint session of the Almaty Public Council and Maslikhat presented the Almaty Mountain Cluster and Almaty Superski projects, which received deputies’ support.',
    },
    parts: [
      {
        kind: 'text',
        html: {
          ru:
            '<p>19 мая 2026 года в Доме дружбы состоялось совместное заседание Общественного совета и Маслихата города Алматы, посвящённое вопросам развития проектов Алматинского горного кластера и «Almaty Superski».</p>' +
            '<p>В ходе заседания были представлены две ключевые инициативы, направленные на развитие горного туризма и создание современной круглогодичной инфраструктуры Алматы.</p>' +
            '<p>Представленная концепция развития Алматинского горного кластера направлена на комплексное развитие горных территорий и формирование современной взаимосвязанной инфраструктуры. Проект предусматривает соединение курортов «Шымбулак» и «Oi-Qaragai» системой канатных дорог и трасс через ущелья Кимасар, Бутаковка и курорт «Pioneer», который сохранит свою социальную и инклюзивную направленность. Кроме того, были представлены инициативы «500К» по развитию массового спорта на природе, а также проект «Горная академия Алматы» по подготовке специалистов в сфере горного туризма.</p>' +
            '<p>В свою очередь проект «Almaty Superski» предусматривает создание современной круглогодичной горной экосистемы международного уровня. В рамках проекта планируется строительство новых подъёмников, сети трасс различного уровня сложности, современной горной деревни с развитой туристической инфраструктурой, а также развитие летних видов отдыха — хайкинг-маршрутов, велотрасс и других активностей.</p>' +
            '<p>Принципиально важно, что экологическая устойчивость заложена в основу обоих проектов. В настоящее время ведётся системная работа с научными институтами и профильными экспертами в области гидрологии, зоологии, почвоведения и других направлений экологических исследований.</p>' +
            '<p>Отдельно отмечено, что в рамках реализации проектов предусматривается сохранение социальной ориентированности курортной инфраструктуры, включая льготные условия для детей, пенсионеров и людей с ограниченными возможностями, а также формирование доступной ценовой политики для посетителей.</p>' +
            '<p>По итогам заседания депутаты Маслихата и члены Общественного совета выразили поддержку дальнейшей реализации проектов Алматинского горного кластера и «Almaty Superski», подчеркнув, что их реализация позволит обеспечить дополнительный вклад в экономику города на уровне порядка 300 млрд тенге ежегодно, а также создать более 10 тысяч рабочих мест в туристической отрасли и смежных секторах экономики.</p>',
          kk:
            '<p>2026 жылғы 19 мамырда Достық үйінде Алматы тау кластері мен «Almaty Superski» жобаларын дамыту мәселелеріне арналған Алматы қаласы Қоғамдық кеңесі мен мәслихатының бірлескен отырысы өтті.</p>' +
            '<p>Отырыс барысында тау туризмін дамытуға және Алматыда заманауи жыл бойы жұмыс істейтін инфрақұрылымды қалыптастыруға бағытталған екі негізгі бастама таныстырылды.</p>' +
            '<p>Алматы тау кластерін дамытудың ұсынылған тұжырымдамасы таулы аумақтарды кешенді дамытуға және өзара байланысқан заманауи инфрақұрылымды қалыптастыруға бағытталған. Жоба «Шымбұлақ» және «Oi-Qaragai» курорттарын Кімасар, Бутаковка шатқалдары және өзінің әлеуметтік әрі инклюзивті бағытын сақтайтын «Pioneer» курорты арқылы аспалы жолдар мен тау шаңғысы трассаларының бірыңғай жүйесімен байланыстыруды көздейді. Сонымен қатар, табиғат аясында бұқаралық спортты дамытуға бағытталған «500К» бастамасы және тау туризмі саласындағы мамандарды даярлауға арналған «Алматы тау академиясы» жобасы таныстырылды.</p>' +
            '<p>Өз кезегінде, «Almaty Superski» жобасы халықаралық деңгейдегі заманауи, жыл бойы жұмыс істейтін тау экожүйесін қалыптастыруды көздейді. Жоба аясында жаңа көтергіштер салу, күрделілік деңгейі әртүрлі трассалар желісін құру, дамыған туристік инфрақұрылымы бар заманауи тау ауылын қалыптастыру, сондай-ақ жазғы демалыс түрлерін — хайкинг бағыттарын, велосипед жолдарын және басқа да белсенді демалыс бағыттарын дамыту жоспарланған.</p>' +
            '<p>Екі жобаның да негізіне экологиялық тұрақтылық қағидаттарының енгізілуі айрықша маңызға ие. Қазіргі уақытта гидрология, зоология, топырақтану және экологиялық зерттеулердің басқа да бағыттары бойынша ғылыми-зерттеу институттарымен және бейінді сарапшылармен жүйелі жұмыс жүргізілуде.</p>' +
            '<p>Сонымен қатар, жобаларды іске асыру аясында курорттық инфрақұрылымның әлеуметтік бағдарлануын сақтау көзделетіні атап өтілді. Атап айтқанда, балаларға, зейнеткерлерге және мүмкіндігі шектеулі адамдарға жеңілдікті жағдайлар жасау, сондай-ақ келушілер үшін қолжетімді баға саясатын қалыптастыру жоспарланған.</p>' +
            '<p>Отырыс қорытындысы бойынша мәслихат депутаттары мен Қоғамдық кеңес мүшелері Алматы тау кластері мен «Almaty Superski» жобаларын одан әрі іске асыруға қолдау білдірді. Олар жобаларды іске асыру қала экономикасына жыл сайын шамамен 300 млрд теңге көлемінде қосымша үлес қосуға, сондай-ақ туристік сала мен экономиканың сабақтас секторларында 10 мыңнан астам жұмыс орнын құруға мүмкіндік беретінін атап өтті.</p>',
          en:
            '<p>On 19 May 2026, the House of Friendship hosted a joint session of the Almaty Public Council and the Almaty Maslikhat dedicated to the development of the Almaty Mountain Cluster and Almaty Superski projects.</p>' +
            '<p>The session presented two key initiatives aimed at developing mountain tourism and creating modern, year-round infrastructure in Almaty.</p>' +
            '<p>The presented concept for the Almaty Mountain Cluster focuses on the comprehensive development of mountain areas and the creation of modern, interconnected infrastructure. The project provides for linking the Shymbulak and Oi-Qaragai resorts with a system of cable cars and runs through the Kimasar and Butakovka gorges and the Pioneer resort, which will retain its social and inclusive focus. The “500K” initiative to develop mass outdoor sports and the “Almaty Mountain Academy” project to train specialists in mountain tourism were also presented.</p>' +
            '<p>The Almaty Superski project, in turn, envisages the creation of a modern, year-round mountain ecosystem of international standard. It provides for new lifts, a network of runs of varying difficulty, a modern mountain village with developed tourism infrastructure, and the development of summer activities — hiking trails, cycling routes and other pursuits.</p>' +
            '<p>Crucially, environmental sustainability underpins both projects. Systematic work is currently under way with research institutes and specialised experts in hydrology, zoology, soil science and other environmental fields.</p>' +
            '<p>It was also noted that project implementation envisages preserving the social orientation of the resort infrastructure, including preferential terms for children, pensioners and people with disabilities, as well as an accessible pricing policy for visitors.</p>' +
            '<p>At the conclusion of the session, Maslikhat deputies and Public Council members expressed support for the further implementation of the Almaty Mountain Cluster and Almaty Superski projects, noting that they will contribute roughly 300 billion tenge annually to the city’s economy and create more than 10,000 jobs in tourism and related sectors.</p>',
        },
      },
    ],
  },

  /* -------------------------------------------------- ОМ релиз, 26.05 */
  {
    slug: 'obshchestvennye-slushaniya',
    publishedAt: '2026-05-26T09:00:00.000Z',
    title: {
      ru: 'Алматы выбирает будущее: состоялись общественные слушания по проекту Алматинского горного кластера',
      kk: 'Алматы болашақты таңдайды: Алматы тау кластері жобасы бойынша қоғамдық тыңдаулар өтті',
      en: 'Almaty chooses its future: public hearings held on the Almaty Mountain Cluster project',
    },
    excerpt: {
      ru: 'В Алматы прошли общественные слушания по проекту Алматинского горного кластера с участием жителей, экспертов и представителей акимата.',
      kk: 'Алматыда тұрғындар, сарапшылар және әкімдік өкілдері қатысқан Алматы тау кластері жобасы бойынша қоғамдық тыңдаулар өтті.',
      en: 'Almaty held public hearings on the Almaty Mountain Cluster project, bringing together residents, experts and city administration officials.',
    },
    parts: [
      {
        kind: 'text',
        html: {
          ru:
            '<p>26 мая т.г. в Алматы состоялись общественные слушания по проекту Алматинского горного кластера. Концепцию развития представил заместитель акима города Алматы Олжас Смагулов, отметив, что проект является одним из ключевых направлений долгосрочного развития мегаполиса.</p>' +
            '<p>Сегодня Алматы сталкивается с беспрецедентным ростом интереса к горному отдыху. За последние шесть лет посещаемость гор выросла в 4,5 раза и приблизилась к одному миллиону человек в год. По прогнозам, уже в ближайшие пять лет этот показатель может достичь двух миллионов посетителей ежегодно.</p>' +
            '<p>При этом существующая инфраструктура работает на пределе возможностей. В пиковые дни Шымбулак принимает до 15 тысяч посетителей при проектной мощности 6,5 тысячи человек. Это приводит к очередям, транспортным заторам, росту нагрузки на природную среду и снижению качества сервиса.</p>' +
            '<p>Реализация проекта Алматинского горного кластера позволит перераспределить туристические потоки, создать более 10 тысяч новых рабочих мест в сфере туризма, сервиса, строительства, транспорта и малого бизнеса. Совокупный вклад проекта в экономику города может превысить 500 млрд тенге ежегодно.</p>' +
            '<p>Особое внимание в ходе общественных слушаний уделено вопросам экологии и сохранения природного наследия. По данным разработчиков проекта, территория будущих горнолыжных трасс составит около 177 гектаров, что эквивалентно лишь 0,09% площади Иле-Алатауского национального парка.</p>' +
            '<p>В акимате подчеркнули, что развитие кластера не предусматривает хаотичную жилую застройку горных территорий.</p>',
          kk:
            '<p>А.ж. 26 мамырында Алматы қаласында Алматы тау кластері жобасы бойынша қоғамдық тыңдаулар өтті. Даму тұжырымдамасын Алматы қаласы әкімінің орынбасары Олжас Смағұлов таныстырып, жобаның мегаполисті ұзақ мерзімді дамытудағы негізгі бағыттардың бірі екенін атап өтті.</p>' +
            '<p>Бүгінде Алматыда таулы аймақтардағы демалысқа деген қызығушылық бұрын-соңды болмаған деңгейде артып келеді. Соңғы алты жылда тауларға келушілер саны 4,5 есеге өсіп, жылына бір миллион адамға жуықтады. Болжамдарға сәйкес, алдағы бес жылдың өзінде бұл көрсеткіш жылына екі миллион келушіге жетуі мүмкін.</p>' +
            '<p>Сонымен қатар қолданыстағы инфрақұрылым мүмкіндіктерінің шегінде жұмыс істеп отыр. Қарбалас күндері «Шымбұлаққа» жобалық қуаты 6,5 мың адам болғанына қарамастан, 15 мыңға дейін келуші келеді. Бұл кезектердің пайда болуына, көлік кептелістеріне, табиғи ортаға түсетін жүктеменің артуына және қызмет көрсету сапасының төмендеуіне алып келеді.</p>' +
            '<p>Алматы тау кластері жобасын іске асыру туристік ағындарды қайта бөлуге, туризм, қызмет көрсету, құрылыс, көлік және шағын бизнес салаларында 10 мыңнан астам жаңа жұмыс орнын құруға мүмкіндік береді. Жобаның қала экономикасына жиынтық үлесі жыл сайын 500 млрд теңгеден асуы мүмкін.</p>' +
            '<p>Қоғамдық тыңдаулар барысында экология және табиғи мұраны сақтау мәселелеріне ерекше назар аударылды. Жоба әзірлеушілерінің мәліметінше, болашақ тау шаңғысы трассаларының аумағы шамамен 177 гектарды құрайды. Бұл Іле-Алатауы мемлекеттік ұлттық табиғи паркінің жалпы аумағының небәрі 0,09%-ына тең.</p>' +
            '<p>Әкімдік өкілдері кластерді дамыту таулы аумақтарда ретсіз тұрғын үй құрылысын жүргізуді көздемейтінін атап өтті.</p>',
          en:
            '<p>On 26 May, Almaty held public hearings on the Almaty Mountain Cluster project. Deputy Mayor of Almaty Olzhas Smagulov presented the development concept, noting that the project is one of the key directions for the city’s long-term development.</p>' +
            '<p>Almaty is currently experiencing an unprecedented surge of interest in mountain recreation. Over the past six years, the number of visitors to the mountains has grown 4.5-fold, approaching one million people a year. Forecasts suggest this figure could reach two million annual visitors within the next five years.</p>' +
            '<p>At the same time, existing infrastructure is operating at the limits of its capacity. On peak days, Shymbulak receives up to 15,000 visitors against a designed capacity of 6,500. This leads to queues, traffic congestion, increased pressure on the natural environment and declining service quality.</p>' +
            '<p>Implementing the Almaty Mountain Cluster project will help redistribute tourist flows and create more than 10,000 new jobs in tourism, services, construction, transport and small business. The project’s overall contribution to the city’s economy could exceed 500 billion tenge annually.</p>' +
            '<p>Particular attention during the hearings was paid to environmental issues and the preservation of natural heritage. According to the project’s developers, the future ski runs will cover around 177 hectares — equivalent to just 0.09% of the area of the Ile-Alatau National Park.</p>' +
            '<p>City officials stressed that developing the cluster does not involve chaotic residential construction in mountain areas.</p>',
        },
      },
      {
        kind: 'quote',
        text: {
          ru: 'Никаких частных вилл. Никаких домов. Никакой стихийной застройки. Проект будет реализовываться исключительно в рамках утвержденного мастер-плана с четким экологическим и архитектурным регулированием.',
          kk: 'Жеке виллалар болмайды. Жеке үйлер болмайды. Ретсіз құрылысқа жол берілмейді. Жоба нақты экологиялық және сәулеттік талаптар белгіленген бекітілген бас жоспар аясында ғана жүзеге асырылады.',
          en: 'No private villas. No houses. No unplanned construction. The project will be implemented strictly within the approved master plan, with clear environmental and architectural controls.',
        },
        author: { ru: 'Олжас Смагулов', kk: 'Олжас Смағұлов', en: 'Olzhas Smagulov' },
        role: {
          ru: 'заместитель акима города Алматы',
          kk: 'қала әкімінің орынбасары',
          en: 'Deputy Mayor of Almaty',
        },
      },
      {
        kind: 'text',
        html: {
          ru: '<p>Проект также предусматривает минимизацию воздействия на окружающую среду, сохранение природных ландшафтов, создание экологических коридоров для животных, компенсационное озеленение и внедрение современных водосберегающих технологий.</p>',
          kk: '<p>Жоба қоршаған ортаға әсерді барынша азайтуды, табиғи ландшафттарды сақтауды, жануарлардың қозғалысына арналған экологиялық дәліздер құруды, өтемдік көгалдандыру жұмыстарын жүргізуді және су ресурстарын үнемдейтін заманауи технологияларды енгізуді де қарастырады.</p>',
          en: '<p>The project also provides for minimising environmental impact, preserving natural landscapes, creating ecological corridors for wildlife, compensatory landscaping and the introduction of modern water-saving technologies.</p>',
        },
      },
      {
        kind: 'quote',
        text: {
          ru: 'Алматинский горный кластер — это не просто туристический проект. Это новый этап развития Алматы, новые возможности для экономики, бизнеса, спорта и качества жизни горожан.',
          kk: 'Алматы тау кластері — бұл жай ғана туристік жоба емес. Бұл Алматының дамуындағы жаңа кезең, экономика, бизнес, спорт және қала тұрғындарының өмір сүру сапасын жақсарту үшін жаңа мүмкіндіктер.',
          en: 'The Almaty Mountain Cluster is not just a tourism project. It is a new stage in Almaty’s development, new opportunities for the economy, business, sport and the quality of life of residents.',
        },
        author: { ru: 'Олжас Смагулов', kk: 'Олжас Смағұлов', en: 'Olzhas Smagulov' },
        role: {
          ru: 'заместитель акима города Алматы',
          kk: 'қала әкімінің орынбасары',
          en: 'Deputy Mayor of Almaty',
        },
      },
      {
        kind: 'text',
        html: {
          ru: '<p>В общественных слушаниях приняли участие жители города, представители экспертного сообщества, экологических организаций, бизнеса и общественных объединений. Все поступившие предложения и замечания будут рассмотрены при дальнейшей доработке проекта.</p>',
          kk: '<p>Қоғамдық тыңдауларға қала тұрғындары, сарапшылар қауымдастығының өкілдері, экологиялық ұйымдар, бизнес өкілдері және қоғамдық бірлестіктер қатысты. Түскен барлық ұсыныстар мен ескертулер жобаны одан әрі жетілдіру барысында қаралатын болады.</p>',
          en: '<p>The public hearings brought together city residents, representatives of the expert community, environmental organisations, business and public associations. All proposals and comments received will be reviewed as the project is further refined.</p>',
        },
      },
    ],
  },
];
