import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import es from './locales/es.json';

// Idioma salvo em localStorage (antes do React inicializar)
function getInitialLanguage(): string {
  try {
    const saved = localStorage.getItem('@tm:user-settings');
    if (saved) {
      const parsed = JSON.parse(saved) as { language?: string };
      if (parsed.language) return parsed.language;
    }
  } catch { /* ignora */ }
  const lang = navigator.language ?? 'pt-BR';
  if (lang.startsWith('pt')) return 'pt-BR';
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('es')) return 'es';
  return 'pt-BR';
}

i18n
  .use(initReactI18next)
  .init({
    lng: getInitialLanguage(),
    fallbackLng: 'pt-BR',
    defaultNS: 'translation',
    resources: {
      'pt-BR': { translation: ptBR },
      en: { translation: en },
      es: { translation: es }
    },
    interpolation: {
      escapeValue: false // React já escapa por padrão
    }
  });

export default i18n;
