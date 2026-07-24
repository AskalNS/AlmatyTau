/** Знак ATM: три вершины со снежными шапками и точка канатной дороги. */
export function LogoMark({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true" width="36" height="36">
      <path d="M2 32 L13 12 L20 24 L27 8 L38 32 Z" fill={light ? '#ffffff' : '#14483C'} />
      <path d="M27 8 L31.4 16 L22.6 16 Z" fill={light ? '#14483C' : '#ffffff'} />
      <path d="M13 12 L16.2 17.7 L9.8 17.7 Z" fill={light ? '#14483C' : '#ffffff'} />
      <circle cx="20" cy="35.5" r="2.2" fill="#C8912F" />
    </svg>
  );
}
