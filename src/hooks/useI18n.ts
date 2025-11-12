import { useTranslation as useTranslationOriginal } from 'react-i18next';

/**
 * Custom hook wrapper for react-i18next's useTranslation
 * Provides type-safe translations and additional utilities
 */
export const useI18n = () => {
  const { t, i18n } = useTranslationOriginal();

  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  const isRTL = rtlLanguages.includes(i18n.language);

  const changeLanguage = (lng: string) => {
    return i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language;

  return {
    t,
    i18n,
    isRTL,
    changeLanguage,
    currentLanguage,
  };
};

// Export the original useTranslation for backward compatibility
export { useTranslation } from 'react-i18next';
