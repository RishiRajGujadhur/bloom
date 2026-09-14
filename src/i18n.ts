import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const common = {
  welcome: {
    eyebrow: 'A little better, every day',
    title: 'A little space to grow.',
    subtitle: 'Welcome back. Let’s make today feel a little more like you.',
    private: 'Just for you',
  },
  navigation: {
    main: 'Main navigation',
    space: 'My space',
    dashboard: 'My dashboard',
    habits: 'Daily habits',
    journal: 'Reflection journal',
    intentions: 'My intentions',
  },
  actions: {
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    exportData: 'Export my data',
    language: 'Language',
  },
  dashboard: {
    stats: 'Your Stats',
    quests: 'Daily Quests',
    settings: 'Settings',
    startJournaling: 'Start Journaling',
  },
} as const

export const resources = {
  en: { translation: common },
  fr: {
    translation: {
      welcome: {
        eyebrow: 'Un peu mieux, chaque jour',
        title: 'Un espace pour grandir.',
        subtitle: 'Bon retour. Faisons de cette journée un peu plus la vôtre.',
        private: 'Rien que pour vous',
      },
      navigation: {
        main: 'Navigation principale',
        space: 'Mon espace',
        dashboard: 'Mon tableau de bord',
        habits: 'Habitudes quotidiennes',
        journal: 'Journal de réflexion',
        intentions: 'Mes intentions',
      },
      actions: {
        lightMode: 'Mode clair',
        darkMode: 'Mode sombre',
        exportData: 'Exporter mes données',
        language: 'Langue',
      },
      dashboard: {
        stats: 'Vos statistiques',
        quests: 'Quêtes du jour',
        settings: 'Paramètres',
        startJournaling: 'Commencer à écrire',
      },
    },
  },
  'en-pirate': {
    translation: {
      welcome: {
        eyebrow: 'A wee bit better, every day',
        title: 'A cozy cove to grow in.',
        subtitle: 'Ahoy, welcome back. Let’s make today feel like your own treasure.',
        private: 'Just for ye',
      },
      navigation: {
        main: 'Main deck',
        space: 'Me own space',
        dashboard: 'Captain’s dashboard',
        habits: 'Daily deck duties',
        journal: 'Reflection log',
        intentions: 'Me intentions',
      },
      actions: {
        lightMode: 'Bright seas',
        darkMode: 'Dark seas',
        exportData: 'Stow me data',
        language: 'Tongue',
      },
      dashboard: {
        stats: 'Yer Stats',
        quests: 'Daily Quests',
        settings: 'Ship Settings',
        startJournaling: 'Start the Log',
      },
    },
  },
  'en-slang': {
    translation: {
      welcome: {
        eyebrow: 'Level up a little, every day',
        title: 'Your low-key growth zone.',
        subtitle: 'Yo, welcome back. Let’s make today feel more like your vibe.',
        private: 'Just for you, fr',
      },
      navigation: {
        main: 'Main nav',
        space: 'My zone',
        dashboard: 'My dashboard',
        habits: 'Daily habits',
        journal: 'Reflection journal',
        intentions: 'My goals',
      },
      actions: {
        lightMode: 'Light mode',
        darkMode: 'Dark mode',
        exportData: 'Grab my data',
        language: 'Language',
      },
      dashboard: {
        stats: 'Your Stats',
        quests: 'Daily Quests',
        settings: 'Settings',
        startJournaling: 'Start Journaling',
      },
    },
  },
} as const

void i18n.use(initReactI18next).init({
  resources,
  fallbackLng: 'en',
  lng: 'en',
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
})

export default i18n
