import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import tr from '@/locales/tr.json';

const supportedLanguages = ['tr', 'en'] as const;
const deviceLanguage = getLocales()[0]?.languageCode;
const initialLanguage = supportedLanguages.find((language) => language === deviceLanguage) ?? 'tr';

// Official i18next init pattern (https://react.i18next.com); `.use` is a chainable
// instance method here, not the named `use` export the linter suspects.
// eslint-disable-next-line import/no-named-as-default-member
i18next.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: 'tr',
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
