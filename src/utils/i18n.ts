import i18n from 'i18next';

/**
 * Creates a bare i18next instance for the server renderer.
 *
 * @returns A new i18next instance.
 */
export function createI18nInstance() {
  return i18n.createInstance();
}

i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {},
  interpolation: { escapeValue: false },
});

export default i18n;
