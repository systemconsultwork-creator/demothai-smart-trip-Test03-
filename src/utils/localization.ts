import { Language } from '../types';

/**
 * Localizes legacy single-language opening-hours values without changing the
 * existing JSON schema. Numeric/time-only values are returned unchanged.
 */
export function localizeHours(hours: string | undefined | null, lang: Language): string {
  const value = String(hours || '').trim();
  if (!value || lang === 'th') return value;

  const replacements: Array<[RegExp, Record<Language, string>]> = [
    [/^ทุกวัน$/i, { th: 'ทุกวัน', en: 'Every day', zh: '每天' }],
    [/^ทุกวัน\s*$/i, { th: 'ทุกวัน', en: 'Every day', zh: '每天' }],
    [/^จ-อา$/i, { th: 'จ-อา', en: 'Mon–Sun', zh: '周一至周日' }],
    [/^จ\.?\s*-\s*ศ\.?$/i, { th: 'จ-ศ', en: 'Mon–Fri', zh: '周一至周五' }],
    [/^จันทร์\s*-\s*ศุกร์$/i, { th: 'จันทร์-ศุกร์', en: 'Monday–Friday', zh: '周一至周五' }],
    [/^เสาร์\s*-\s*อาทิตย์$/i, { th: 'เสาร์-อาทิตย์', en: 'Saturday–Sunday', zh: '周六至周日' }],
    [/^เปิด\s*24\s*ชั่วโมง$/i, { th: 'เปิด 24 ชั่วโมง', en: 'Open 24 hours', zh: '24小时开放' }],
    [/^24\s*ชั่วโมง$/i, { th: '24 ชั่วโมง', en: '24 hours', zh: '24小时' }],
  ];

  for (const [pattern, values] of replacements) {
    if (pattern.test(value)) return values[lang];
  }

  return value
    .replace(/จันทร์/gi, lang === 'en' ? 'Monday' : '星期一')
    .replace(/อังคาร/gi, lang === 'en' ? 'Tuesday' : '星期二')
    .replace(/พุธ/gi, lang === 'en' ? 'Wednesday' : '星期三')
    .replace(/พฤหัสบดี/gi, lang === 'en' ? 'Thursday' : '星期四')
    .replace(/ศุกร์/gi, lang === 'en' ? 'Friday' : '星期五')
    .replace(/เสาร์/gi, lang === 'en' ? 'Saturday' : '星期六')
    .replace(/อาทิตย์/gi, lang === 'en' ? 'Sunday' : '星期日')
    .replace(/ทุกวัน/gi, lang === 'en' ? 'Every day' : '每天')
    .replace(/24\s*ชั่วโมง/gi, lang === 'en' ? '24 hours' : '24小时');
}

/** Localizes the project's standard TAT hotline while preserving custom contacts. */
export function localizeContact(contact: string | undefined | null, lang: Language, fallback: string): string {
  const value = String(contact || '').trim();
  if (!value) return fallback;

  const isTatContact = /TAT\s*Call\s*Center|ททท\.?|1672/i.test(value);
  if (!isTatContact) return value;

  if (lang === 'th') return 'ศูนย์บริการนักท่องเที่ยว ททท. โทร 1672';
  if (lang === 'zh') return '泰国国家旅游局咨询热线：1672';
  return 'Tourism Authority of Thailand Hotline: 1672';
}
