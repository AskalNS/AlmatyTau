import Link from 'next/link';
import type { PublicMenuNode, PublicSettings, Locale } from '@atm/contracts';
import { href as buildHref, ROUTES } from '@atm/contracts';
import { dict } from '@/lib/dictionary';
import { LogoMark } from './Logo';
import styles from './footer.module.css';

/** Подвал (п. IV ТЗ): контакты, ссылки на разделы, политика конфиденциальности. */
export function Footer({
  menu,
  settings,
  locale,
}: {
  menu: PublicMenuNode[];
  settings: PublicSettings;
  locale: Locale;
}) {
  const t = dict(locale);
  const year = 2026;

  // Ссылки на госресурсы в подвале (замечание Заказчика от 19.08.2026, п. 11).
  const GOV_LINKS: Array<{ title: Record<Locale, string>; url: string }> = [
    {
      title: { ru: 'Конституция Республики Казахстан', kk: 'Қазақстан Республикасының Конституциясы', en: 'Constitution of the Republic of Kazakhstan' },
      url: 'https://www.gov.kz/article/232335?lang=ru',
    },
    {
      title: { ru: 'Послания Президента РК', kk: 'ҚР Президентінің Жолдаулары', en: "President's Addresses" },
      url: 'https://www.akorda.kz/ru/addresses',
    },
    {
      title: { ru: 'Государственные символы РК', kk: 'ҚР мемлекеттік рәміздері', en: 'State Symbols of the RK' },
      url: 'https://www.gov.kz/article/128915?lang=ru',
    },
    {
      title: { ru: 'Сайт Президента РК', kk: 'ҚР Президентінің сайты', en: "President's website" },
      url: 'https://www.akorda.kz/ru',
    },
    {
      title: { ru: 'Сайт Премьер-Министра', kk: 'Премьер-Министрдің сайты', en: "Prime Minister's website" },
      url: 'https://primeminister.kz/ru',
    },
    {
      title: { ru: 'Закон «О доступе к информации»', kk: '«Ақпаратқа қол жеткізу туралы» Заң', en: 'Law "On Access to Information"' },
      url: 'https://adilet.zan.kz/rus/docs/Z1500000401#z16',
    },
  ];

  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <div className={styles.cols}>
          <div>
            <Link href={buildHref(locale, ROUTES.home)} className={styles.logo}>
              <LogoMark light height={40} />
            </Link>
            {settings.footerText && <p className={styles.about}>{settings.footerText}</p>}
          </div>

          {menu.slice(0, 2).map((group) => (
            <div key={group.id}>
              <h4>{group.title}</h4>
              {group.children.map((c) => (
                <Link key={c.id} href={c.isExternal ? c.href : buildHref(locale, c.href)}>
                  {c.title}
                </Link>
              ))}
            </div>
          ))}

          <div>
            <h4>{t.contacts}</h4>
            {settings.address && <p className={styles.contactLine}>{settings.address}</p>}
            {settings.phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/[^+\d]/g, '')}`}>{p}</a>
            ))}
            {settings.emails.map((e) => (
              <a key={e} href={`mailto:${e}`}>{e}</a>
            ))}
            {settings.workingHours && <p className={styles.hours}>{settings.workingHours}</p>}
          </div>

          <div>
            <h4>{locale === 'kk' ? 'Мемлекеттік ресурстар' : locale === 'en' ? 'Government resources' : 'Государственные ресурсы'}</h4>
            {GOV_LINKS.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">
                {l.title[locale]}
              </a>
            ))}
          </div>
        </div>

        <div className={styles.bottom}>
          <span>© {year} {settings.organizationName}</span>
          <span className={styles.spacer} />
          {/* Замечание Заказчика от 19.08.2026 (п. 8): пока политика
              конфиденциальности не готова к публикации, кнопка временно
              ведёт на egov.kz. Текст политики уже подготовлен на странице
              /privacy — когда решат вернуть свою страницу, здесь достаточно
              заменить ссылку обратно на buildHref(locale, ROUTES.privacy). */}
          <a href="https://egov.kz/kk" target="_blank" rel="noopener noreferrer">
            {locale === 'kk' ? 'Құпиялылық саясаты' : locale === 'en' ? 'Privacy Policy' : 'Политика конфиденциальности'}
          </a>
          <Link href={buildHref(locale, ROUTES.sitemap)}>
            {locale === 'kk' ? 'Сайт картасы' : locale === 'en' ? 'Sitemap' : 'Карта сайта'}
          </Link>
        </div>
      </div>
    </footer>
  );
}
