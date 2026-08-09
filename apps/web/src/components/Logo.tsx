import Image from 'next/image';

/* ============================================================================
   Логотип ТОО «Almaty Tau Management».

   Файл — утверждённое Заказчиком изображение из фирменных материалов
   (презентация «АГК_ОС»), а не перерисовка. Замечание от 28.07.2026, п. 2:
   допускается исключительно утверждённая версия знака, любые изменения
   согласуются отдельно. Поэтому знак не собирается из SVG-примитивов
   и не перекрашивается под палитру сайта.

   logo-atm.png       — основной, для светлого фона (шапка).
   logo-atm-light.png — реверсивный, для тёмного подвала: словесная часть
                        выворачивается в белый, фирменный знак сохраняет
                        синий цвет.
   ========================================================================== */

const RATIO = 494 / 141;

export function LogoMark({
  className,
  light = false,
  height = 40,
}: {
  className?: string;
  light?: boolean;
  height?: number;
}) {
  return (
    <Image
      className={className}
      src={light ? '/logo-atm-light.png' : '/logo-atm.png'}
      alt="Almaty Tau Management"
      width={Math.round(height * RATIO)}
      height={height}
      priority
      unoptimized
    />
  );
}
