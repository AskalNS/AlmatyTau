import type { Locale } from '@atm/contracts';

/**
 * Подписи интерфейса (не контент — контент приходит из БД).
 *
 * Это единственные тексты сайта, живущие в коде: кнопки, метки, служебные
 * фразы. Контент разделов редактируется в админке и приходит из API.
 */
const DICT = {
  kk: {
    home: 'Басты бет',
    news: 'Жаңалықтар',
    allNews: 'Барлық жаңалықтар',
    search: 'Іздеу',
    searchPlaceholder: 'Сайттан іздеу',
    readMore: 'Толығырақ',
    showMore: 'Тағы көрсету',
    notFound: 'Бет табылмады',
    backHome: 'Басты бетке',
    contacts: 'Байланыс',
    documents: 'Құжаттар',
    download: 'Жүктеп алу',
    vacancies: 'Бос лауазымдар',
    deadline: 'Өтінім қабылдау мерзімі',
    board: 'Басқарма',
    supervisory: 'Бақылаушы кеңес',
    a11y: 'Көру қабілеті нашарларға',
    normalVersion: 'Қалыпты нұсқа',
    nothingFound: 'Ештеңе табылмады',
    relatedNews: 'Ұқсас жаңалықтар',
    gallery: 'Медиагалерея',
    workingHours: 'Жұмыс режимі',
    phone: 'Телефон',
    email: 'Электрондық пошта',
    address: 'Мекенжай',
    feedbackName: 'Аты-жөні',
    feedbackMessage: 'Хабарлама',
    feedbackSend: 'Жіберу',
    feedbackConsent: 'Дербес деректерді өңдеуге келісемін',
    feedbackSent: 'Хабарламаңыз жіберілді. Рахмет!',
    requiredField: 'Міндетті өріс',
  },
  ru: {
    home: 'Главная',
    news: 'Новости',
    allNews: 'Все новости',
    search: 'Поиск',
    searchPlaceholder: 'Поиск по сайту',
    readMore: 'Подробнее',
    showMore: 'Показать ещё',
    notFound: 'Страница не найдена',
    backHome: 'На главную',
    contacts: 'Контакты',
    documents: 'Документы',
    download: 'Скачать',
    vacancies: 'Вакансии',
    deadline: 'Срок приёма документов',
    board: 'Правление',
    supervisory: 'Наблюдательный совет',
    a11y: 'Версия для слабовидящих',
    normalVersion: 'Обычная версия',
    nothingFound: 'Ничего не найдено',
    relatedNews: 'Похожие новости',
    gallery: 'Медиагалерея',
    workingHours: 'Режим работы',
    phone: 'Телефон',
    email: 'Электронная почта',
    address: 'Адрес',
    feedbackName: 'Имя',
    feedbackMessage: 'Сообщение',
    feedbackSend: 'Отправить',
    feedbackConsent: 'Согласен на обработку персональных данных',
    feedbackSent: 'Ваше сообщение отправлено. Спасибо!',
    requiredField: 'Обязательное поле',
  },
  en: {
    home: 'Home',
    news: 'News',
    allNews: 'All news',
    search: 'Search',
    searchPlaceholder: 'Search the site',
    readMore: 'Read more',
    showMore: 'Show more',
    notFound: 'Page not found',
    backHome: 'Back to home',
    contacts: 'Contacts',
    documents: 'Documents',
    download: 'Download',
    vacancies: 'Vacancies',
    deadline: 'Application deadline',
    board: 'Board',
    supervisory: 'Supervisory Board',
    a11y: 'Accessibility version',
    normalVersion: 'Standard version',
    nothingFound: 'Nothing found',
    relatedNews: 'Related news',
    gallery: 'Media gallery',
    workingHours: 'Working hours',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    feedbackName: 'Name',
    feedbackMessage: 'Message',
    feedbackSend: 'Send',
    feedbackConsent: 'I consent to the processing of personal data',
    feedbackSent: 'Your message has been sent. Thank you!',
    requiredField: 'Required field',
  },
} as const;

// Значения — string, а не литеральные типы: у kk/ru/en разные строки под
// одними ключами, и общий тип должен быть широким.
export type Dict = Record<keyof (typeof DICT)['ru'], string>;

export function dict(locale: Locale): Dict {
  return DICT[locale] ?? DICT.ru;
}

/** Формат даты под локаль. */
export function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return '';
  const localeTag = locale === 'kk' ? 'kk-KZ' : locale === 'en' ? 'en-GB' : 'ru-RU';
  return new Intl.DateTimeFormat(localeTag, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}
