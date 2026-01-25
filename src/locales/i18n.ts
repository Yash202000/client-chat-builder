import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './en/translation.json';
import zhTranslation from './zh/translation.json';
import hiTranslation from './hi/translation.json';
import esTranslation from './es/translation.json';
import arTranslation from './ar/translation.json';
import frTranslation from './fr/translation.json';
import bnTranslation from './bn/translation.json';
import ptTranslation from './pt/translation.json';
import ruTranslation from './ru/translation.json';
import idTranslation from './id/translation.json';
import urTranslation from './ur/translation.json';
import deTranslation from './de/translation.json';
import jaTranslation from './ja/translation.json';
import pcmTranslation from './pcm/translation.json';
import mrTranslation from './mr/translation.json';
import teTranslation from './te/translation.json';
import trTranslation from './tr/translation.json';
import taTranslation from './ta/translation.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  zh: {
    translation: zhTranslation,
  },
  hi: {
    translation: hiTranslation,
  },
  es: {
    translation: esTranslation,
  },
  ar: {
    translation: arTranslation,
  },
  fr: {
    translation: frTranslation,
  },
  bn: {
    translation: bnTranslation,
  },
  pt: {
    translation: ptTranslation,
  },
  ru: {
    translation: ruTranslation,
  },
  id: {
    translation: idTranslation,
  },
  ur: {
    translation: urTranslation,
  },
  de: {
    translation: deTranslation,
  },
  ja: {
    translation: jaTranslation,
  },
  pcm: {
    translation: pcmTranslation,
  },
  mr: {
    translation: mrTranslation,
  },
  te: {
    translation: teTranslation,
  },
  tr: {
    translation: trTranslation,
  },
  ta: {
    translation: taTranslation,
  },
};

// RTL languages list
export const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

i18n
  .use(LanguageDetector) // Detects user language
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false, // React already safes from xss
    },

    react: {
      useSuspense: true,
    },
  });

// Update HTML dir and lang attributes when language changes
i18n.on('languageChanged', (lng) => {
  const dir = rtlLanguages.includes(lng) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
});

// Set initial direction
const currentLang = i18n.language;
const initialDir = rtlLanguages.includes(currentLang) ? 'rtl' : 'ltr';
document.documentElement.dir = initialDir;
document.documentElement.lang = currentLang;

export default i18n;
