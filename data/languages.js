/* languages.js — language labels, flags, options */

const LANG_LABELS = {
  ko: '한국어', en: 'English', ja: '日本語',
  'zh-tw': '繁體中文', 'zh-cn': '简体中文',
  fr: 'Français', es: 'Español', de: 'Deutsch',
  ru: 'Русский', pt: 'Português'
};
const LANG_FLAGS = {
  ko: '🇰🇷', en: '🇺🇸', ja: '🇯🇵',
  'zh-tw': '🇹🇼', 'zh-cn': '🇨🇳',
  fr: '🇫🇷', es: '🇪🇸', de: '🇩🇪',
  ru: '🇷🇺', pt: '🇵🇹'
};

const LANG_OPTIONS = [
  { value: 'ko',    label: '한국어' },
  { value: 'en',    label: '영어 (English)' },
  { value: 'ja',    label: '일본어 (日本語)' },
  { value: 'zh-tw', label: '중국어 번체 (繁體中文)' },
  { value: 'zh-cn', label: '중국어 간체 (简体中文)' },
  { value: 'fr',    label: '프랑스어 (Français)' },
  { value: 'es',    label: '스페인어 (Español)' },
  { value: 'de',    label: '독일어 (Deutsch)' },
  { value: 'ru',    label: '러시아어 (Русский)' },
  { value: 'pt',    label: '포르투갈어 (Português)' }
];
const CC_LANGUAGE_OPTIONS = [
  { value: 'ko',    label: '한국어' },
  { value: 'en',    label: '영어' },
  { value: 'ja',    label: '일본어' },
  { value: 'zh-cn', label: '중국어 간체' },
  { value: 'zh-tw', label: '중국어 번체' },
  { value: 'fr',    label: '프랑스어' },
  { value: 'de',    label: '독일어' },
  { value: 'es',    label: '스페인어' }
];
