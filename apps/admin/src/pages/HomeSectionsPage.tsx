import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  API,
  LOCALES,
  LOCALE_LABELS,
  HOME_SECTION_LABELS,
  type HomeSection,
  type HomeSectionTranslation,
  type UpdateHomeSectionRequest,
  type Locale,
  type Blocks,
} from '@atm/contracts';
import { api, ApiRequestError } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { BlockEditor } from '@/components/BlockEditor';
import { MediaField } from '@/components/MediaField';

/**
 * Редактор главной страницы (п. 1, IV ТЗ).
 *
 * Секции — фиксированный набор (герой, «о кластере», цифры, карта, новости,
 * направления, партнёры), заданный при наполнении сайта: здесь меняется их
 * содержимое — тексты по языкам, фотографии в блоках, кадры баннера,
 * видимость секции, — а не их состав.
 */
export function HomeSectionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-home'],
    queryFn: () => api.get<HomeSection[]>(API.admin.home),
  });
  const [openId, setOpenId] = useState<string | null>(null);

  const sections = data?.slice().sort((a, b) => a.order - b.order) ?? [];

  return (
    <div>
      <PageHeader title="Главная страница" />

      {isLoading && <div style={{ color: 'var(--s-500)' }}>Загрузка…</div>}

      {sections.map((s) => (
        <SectionCard key={s.id} section={s} open={openId === s.id} onToggle={() => setOpenId(openId === s.id ? null : s.id)} />
      ))}
    </div>
  );
}

type TrState = Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    blocks: Blocks;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
  }
>;

function toTrState(translations: HomeSectionTranslation[]): TrState {
  const empty = { eyebrow: '', title: '', subtitle: '', blocks: [] as Blocks, primaryLabel: '', primaryHref: '', secondaryLabel: '', secondaryHref: '' };
  const state: TrState = { kk: { ...empty }, ru: { ...empty }, en: { ...empty } };
  for (const t of translations) {
    state[t.locale] = {
      eyebrow: t.eyebrow ?? '',
      title: t.title ?? '',
      subtitle: t.subtitle ?? '',
      blocks: t.blocks,
      primaryLabel: t.primaryLabel ?? '',
      primaryHref: t.primaryHref ?? '',
      secondaryLabel: t.secondaryLabel ?? '',
      secondaryHref: t.secondaryHref ?? '',
    };
  }
  return state;
}

function SectionCard({ section, open, onToggle }: { section: HomeSection; open: boolean; onToggle: () => void }) {
  const qc = useQueryClient();
  const [activeLocale, setActiveLocale] = useState<Locale>('ru');
  const [isVisible, setIsVisible] = useState(section.isVisible);
  const [heroPosterId, setHeroPosterId] = useState<string | null>(section.heroPosterId);
  const [heroVideoId, setHeroVideoId] = useState<string | null>(section.heroVideoId);
  const [videoOnMobile, setVideoOnMobile] = useState(section.videoOnMobile);
  const [tr, setTr] = useState<TrState>(() => toTrState(section.translations));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setIsVisible(section.isVisible);
    setHeroPosterId(section.heroPosterId);
    setHeroVideoId(section.heroVideoId);
    setVideoOnMobile(section.videoOnMobile);
    setTr(toTrState(section.translations));
  }, [section]);

  const save = useMutation({
    mutationFn: (payload: UpdateHomeSectionRequest) => api.put<HomeSection>(API.admin.homeSection(section.id), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-home'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e) => {
      if (e instanceof ApiRequestError && e.fields) setErrors(e.fields);
    },
  });

  function onSave() {
    setErrors({});
    const translations = LOCALES.map((l) => ({
      locale: l,
      eyebrow: tr[l].eyebrow || null,
      title: tr[l].title || null,
      subtitle: tr[l].subtitle || null,
      blocks: tr[l].blocks,
      primaryLabel: tr[l].primaryLabel || null,
      primaryHref: tr[l].primaryHref || null,
      secondaryLabel: tr[l].secondaryLabel || null,
      secondaryHref: tr[l].secondaryHref || null,
    }));
    save.mutate({ isVisible, heroPosterId, heroVideoId, videoOnMobile, href: section.href, translations });
  }

  const cur = tr[activeLocale];
  const setCur = (patch: Partial<TrState[Locale]>) =>
    setTr((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], ...patch } }));

  return (
    <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          font: 'inherit',
        }}
      >
        <strong style={{ fontSize: 15 }}>{HOME_SECTION_LABELS[section.type]}</strong>
        <span
          className={`tag ${isVisible ? 'tag-published' : 'tag-draft'}`}
        >
          {isVisible ? 'Видима' : 'Скрыта'}
        </span>
        <span style={{ flex: 1 }} />
        {saved && <span style={{ color: 'var(--green-600)', fontSize: 13 }}>Сохранено ✓</span>}
        <span style={{ color: 'var(--s-400)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px' }}>
          {errors._ && <div style={errBox}>{errors._[0]}</div>}

          <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 320 }}>
            <input type="checkbox" id={`vis-${section.id}`} checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} style={{ width: 'auto' }} />
            <label htmlFor={`vis-${section.id}`} style={{ margin: 0 }}>Показывать секцию на сайте</label>
          </div>

          {section.type === 'hero' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
              <MediaField label="Постер баннера (первый кадр, LCP)" mediaId={heroPosterId} onChange={setHeroPosterId} />
              <div>
                <MediaField label="Фоновое видео баннера (необязательно)" mediaId={heroVideoId} onChange={setHeroVideoId} accept="video/*" />
                <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id={`vom-${section.id}`} checked={videoOnMobile} onChange={(e) => setVideoOnMobile(e.target.checked)} style={{ width: 'auto' }} />
                  <label htmlFor={`vom-${section.id}`} style={{ margin: 0 }}>Показывать видео и на мобильных</label>
                </div>
              </div>
            </div>
          )}

          <div style={tabs}>
            {LOCALES.map((l) => (
              <button key={l} onClick={() => setActiveLocale(l)} style={{ ...tab, ...(activeLocale === l ? tabActive : {}) }}>
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>

          <div className="field">
            <label>Надзаголовок · {activeLocale.toUpperCase()}</label>
            <input value={cur.eyebrow} onChange={(e) => setCur({ eyebrow: e.target.value })} />
          </div>
          <div className="field">
            <label>Заголовок</label>
            <input value={cur.title} onChange={(e) => setCur({ title: e.target.value })} />
          </div>
          <div className="field">
            <label>Подзаголовок</label>
            <textarea value={cur.subtitle} onChange={(e) => setCur({ subtitle: e.target.value })} style={{ minHeight: 60 }} />
          </div>

          {section.type === 'hero' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <div className="field">
                  <label>Кнопка 1 — текст</label>
                  <input value={cur.primaryLabel} onChange={(e) => setCur({ primaryLabel: e.target.value })} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Кнопка 1 — ссылка</label>
                  <input value={cur.primaryHref} onChange={(e) => setCur({ primaryHref: e.target.value })} />
                </div>
              </div>
              <div>
                <div className="field">
                  <label>Кнопка 2 — текст</label>
                  <input value={cur.secondaryLabel} onChange={(e) => setCur({ secondaryLabel: e.target.value })} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Кнопка 2 — ссылка</label>
                  <input value={cur.secondaryHref} onChange={(e) => setCur({ secondaryHref: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          <div className="field" style={{ marginBottom: 16 }}>
            <label>
              {section.type === 'hero'
                ? 'Кадры баннера (блок «Галерея» — чередование фото на главном экране)'
                : 'Содержание секции'}
            </label>
            <BlockEditor blocks={cur.blocks} onChange={(blocks) => setCur({ blocks })} />
          </div>

          <button className="btn btn-primary" onClick={onSave} disabled={save.isPending}>
            Сохранить секцию
          </button>
        </div>
      )}
    </div>
  );
}

const tabs: React.CSSProperties = { display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid var(--s-200)' };
const tab: React.CSSProperties = {
  padding: '8px 16px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--s-500)',
  marginBottom: -2,
  borderBottom: '2px solid transparent',
};
const tabActive: React.CSSProperties = { color: 'var(--green-700)', borderBottomColor: 'var(--green-600)' };
const errBox: React.CSSProperties = {
  background: '#fbecea',
  color: '#a8322a',
  padding: '10px 14px',
  borderRadius: 6,
  fontSize: 13,
  marginBottom: 16,
};
