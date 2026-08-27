import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './vi.json';
import en from './en.json';

const resources = {
  vi: { translation: vi },
  en: { translation: en },
};

const savedLanguage = localStorage.getItem('app_language') || 'vi';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false, // React already escapes XSS
    },
  });

export default i18n;
