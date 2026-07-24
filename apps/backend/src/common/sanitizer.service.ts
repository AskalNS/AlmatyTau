import { Injectable } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import {
  ALLOWED_HTML_TAGS,
  ALLOWED_HTML_ATTRS,
  type Blocks,
} from '@atm/contracts';

/**
 * Очистка HTML из текстовых блоков (п. X.III ТЗ — защита от XSS).
 *
 * Редактор работает через визуальный редактор, но доверять его выводу
 * на сервере нельзя: запрос мог быть подделан в обход интерфейса.
 * Пропускаем только теги и атрибуты из белого списка в @atm/contracts,
 * скрипты, обработчики событий и опасные протоколы вырезаются.
 */
@Injectable()
export class SanitizerService {
  private readonly options: sanitizeHtml.IOptions = {
    allowedTags: [...ALLOWED_HTML_TAGS],
    allowedAttributes: ALLOWED_HTML_ATTRS,
    // Ссылки только на безопасные протоколы: javascript: и data: отсекаются.
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowProtocolRelative: false,
    // Внешние ссылки открываются в новой вкладке безопасно.
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? '';
        const external = /^https?:\/\//i.test(href);
        return {
          tagName,
          attribs: external
            ? { ...attribs, target: '_blank', rel: 'noopener noreferrer nofollow' }
            : attribs,
        };
      },
    },
  };

  clean(html: string): string {
    return sanitizeHtml(html, this.options);
  }

  /**
   * Прогоняет все текстовые поля внутри массива блоков через санитайзер.
   * Возвращает новый массив — исходный не мутируется.
   */
  cleanBlocks(blocks: Blocks): Blocks {
    return blocks.map((block) => {
      switch (block.type) {
        case 'text':
          return { ...block, html: this.clean(block.html) };
        case 'accordion':
          return {
            ...block,
            items: block.items.map((i) => ({ ...i, html: this.clean(i.html) })),
          };
        default:
          return block;
      }
    });
  }
}
