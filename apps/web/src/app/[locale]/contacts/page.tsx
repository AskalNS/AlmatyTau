import type { Metadata } from 'next';
import type { PublicSettings, PublicLayout, Locale } from '@atm/contracts';
import { API } from '@atm/contracts';
import { apiGet } from '@/lib/api';
import { dict } from '@/lib/dictionary';
import { FeedbackForm } from '@/components/FeedbackForm';
import { ContactMap } from '@/components/ContactMap';
import styles from './contacts.module.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: dict(locale as Locale).contacts };
}

export default async function ContactsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as Locale;
  const t = dict(loc);
  // Настройки сайта: контакты, координаты, включена ли форма (п. 6 ТЗ).
  const layout = await apiGet<PublicLayout>(API.public.layout, loc, {
    revalidate: 300,
    tags: ['layout'],
  });
  const settings: PublicSettings = layout.settings;

  return (
    <div className="wrap section">
      <div className="eyebrow">{t.contacts}</div>
      <h1 className={styles.title}>{t.contacts}</h1>

      <div className={styles.grid}>
        <div>
          <div className={styles.card}>
            <h2 className={styles.org}>{settings.organizationName}</h2>
            <dl className={styles.details}>
              {settings.address && (
                <div>
                  <dt>{t.address}</dt>
                  <dd>{settings.address}</dd>
                </div>
              )}
              {settings.phones.length > 0 && (
                <div>
                  <dt>{t.phone}</dt>
                  <dd>
                    {settings.phones.map((p) => (
                      <a key={p} href={`tel:${p.replace(/[^+\d]/g, '')}`}>{p}</a>
                    ))}
                  </dd>
                </div>
              )}
              {settings.emails.length > 0 && (
                <div>
                  <dt>{t.email}</dt>
                  <dd>
                    {settings.emails.map((e) => (
                      <a key={e} href={`mailto:${e}`}>{e}</a>
                    ))}
                  </dd>
                </div>
              )}
              {settings.workingHours && (
                <div>
                  <dt>{t.workingHours}</dt>
                  <dd>{settings.workingHours}</dd>
                </div>
              )}
            </dl>
          </div>

          {settings.feedbackEnabled && <FeedbackForm locale={loc} />}
        </div>

        <ContactMap lat={settings.lat} lng={settings.lng} address={settings.address} />
      </div>
    </div>
  );
}
