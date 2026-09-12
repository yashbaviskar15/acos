import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/translation.json';
import es from './locales/es/translation.json';
import de from './locales/de/translation.json';
import fr from './locales/fr/translation.json';
import ja from './locales/ja/translation.json';
import hi from './locales/hi/translation.json';

export const SUPPORTED_LANGS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
  { code: 'hi', label: 'हिंदी' },
] as const;

export type LangCode = typeof SUPPORTED_LANGS[number]['code'];

const STORAGE_KEY = 'aravanta_language';
const DEFAULT_LANG: LangCode = 'en';

function detectInitialLanguage(): LangCode {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as LangCode | null;
    if (stored && SUPPORTED_LANGS.some((l) => l.code === stored)) {
      return stored;
    }
  } catch {
    /* ignore */
  }
  try {
    const nav = (navigator.language || 'en').toLowerCase();
    const match = SUPPORTED_LANGS.find((l) => nav.startsWith(l.code));
    if (match) return match.code;
  } catch {
    /* ignore */
  }
  return DEFAULT_LANG;
}

const initialLang = detectInitialLanguage();
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      de: { translation: de },
      fr: { translation: fr },
      ja: { translation: ja },
      hi: { translation: hi },
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    debug: false,
    returnNull: false,
    returnEmptyString: false,
  });

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, lng);
    } catch {
      /* ignore */
    }
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
});

export default i18n;
