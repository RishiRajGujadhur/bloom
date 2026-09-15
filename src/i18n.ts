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
  ui: {
    everydaySpace: 'Your everyday space', mySpace: 'My space', growAtYourOwnPace: 'Grow at your own pace.', progressMessage: 'You don’t need a perfect day to make a little progress.', oneSmallStep: 'One small step at a time', personalSpace: 'Your personal space', noAccount: 'No account needed', skipToDashboard: 'Skip to dashboard', switchToLight: 'Switch to light mode', switchToDark: 'Switch to dark mode', savingAttention: 'Saving needs your attention', exportOriginal: 'Export original data', useFreshData: 'Use fresh data & enable saving', habitsToday: 'Habits nurtured today', intentionsToday: 'Intentions followed through', reflections: 'Moments of reflection', addHabit: 'Add habit', addSmallHabit: 'Add a small habit', statFor: 'Stat for {{title}}', comboExp: '+10 EXP × combo', todaysProgress: 'Today’s progress', lastSevenDays: 'Your last 7 days', habitsCompleted: '{{count}} habits completed', addIntention: 'Add intention', setIntention: 'Set an intention', intentionHeading: 'A little intention', intentionDescription: 'What deserves your energy today?', freshPage: 'A fresh page for your day.', chooseMeaningful: 'Choose something meaningful, however small.', edit: 'Edit {{title}}', editAffirmation: 'Edit affirmation', reminder: 'A reminder, just for you.', storyUnfolding: 'Your story is unfolding', revisit: 'Revisit your reflections and see how far you’ve come.', reflectionCount: '{{count}} reflections', madeForGrowth: 'Made for your own kind of growth.', savedBrowser: 'Saved in this browser', keepBackup: 'Keep a backup', plantHabit: 'Plant a small habit', practiceQuestion: 'What would you like to practice?', makeRoom: 'Make room for what matters', oneIntention: 'One intention for today', editIntention: 'Edit your intention', yourIntention: 'Your intention', wordsLikeYou: 'Words that feel like you', personalAffirmation: 'Your personal affirmation', reflectionJournal: 'Your reflection journal', backToReflections: 'Back to reflections', momentForYou: 'A moment for yourself', storyStarts: 'Your story starts with one check-in. Saved reflections will appear here.', save: 'Save',
  },
  forms: { required: 'Please add a little text.', maxLength: 'Use {{max}} characters or fewer.' },
  journal: {
    daybook: 'The daybook', choosePage: 'Choose a page for this moment.', differentDays: 'Different days need different kinds of attention. Pick a mode and make it yours.', searchModes: 'Search modes', searchLabel: 'Search journal modes', noPages: 'No pages match “{{query}}”. Try a gentler search.', allModes: 'All modes', saved: 'Saved', savePage: 'Save page', savedPrivately: 'Saved privately on this device', unsaved: 'Unsaved changes', closePage: 'Close page', oneThing: 'My one thing today is…', rapidToolbar: 'Rapid logging toolbar', startRapid: 'Start rapid logging here…', whatsInHead: 'What’s in my head', whatToDo: 'What I want to do with it', journalPage: 'Journal page', holdThought: 'Let the page hold the first thought…', reflectionSpace: 'Your reflection space', clarity: 'A little check-in. A little clarity.', makeRoom: 'Make a little room for yourself.', checkIn: 'Begin a check-in', guidedPrivate: 'Guided prompts · Private to this browser', showedUp: 'You showed up for yourself. That matters.', tags: 'Tags, separated by commas', tagsPlaceholder: 'Gratitude, rest, growth', viewSaved: 'View saved reflection', saveReview: 'Save & review reflection', anotherCheckIn: 'Start another check-in', sendReflection: 'Send reflection', journalConversation: 'Journal conversation', suggestedReplies: 'Suggested replies', preparing: 'Preparing next reflection', mood: 'How’s your mood?', energy: 'Your energy level', lowGreat: 'Low → Great', drainedEnergized: 'Drained → Energized',
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
      ui: {
        everydaySpace: 'Votre espace quotidien', mySpace: 'Mon espace', growAtYourOwnPace: 'Grandissez à votre rythme.', progressMessage: 'Vous n’avez pas besoin d’une journée parfaite pour avancer un peu.', oneSmallStep: 'Un petit pas à la fois', personalSpace: 'Votre espace personnel', noAccount: 'Aucun compte requis', skipToDashboard: 'Aller au tableau de bord', switchToLight: 'Passer au mode clair', switchToDark: 'Passer au mode sombre', savingAttention: 'L’enregistrement nécessite votre attention', exportOriginal: 'Exporter les données originales', useFreshData: 'Utiliser de nouvelles données et activer l’enregistrement', habitsToday: 'Habitudes cultivées aujourd’hui', intentionsToday: 'Intentions réalisées', reflections: 'Moments de réflexion', addHabit: 'Ajouter une habitude', addSmallHabit: 'Ajouter une petite habitude', statFor: 'Statistique pour {{title}}', comboExp: '+10 EXP × combo', todaysProgress: 'Progrès du jour', lastSevenDays: 'Vos 7 derniers jours', habitsCompleted: '{{count}} habitudes terminées', addIntention: 'Ajouter une intention', setIntention: 'Définir une intention', intentionHeading: 'Une petite intention', intentionDescription: 'Qu’est-ce qui mérite votre énergie aujourd’hui ?', freshPage: 'Une page blanche pour votre journée.', chooseMeaningful: 'Choisissez quelque chose de significatif, aussi petit soit-il.', edit: 'Modifier {{title}}', editAffirmation: 'Modifier l’affirmation', reminder: 'Un rappel, rien que pour vous.', storyUnfolding: 'Votre histoire se construit', revisit: 'Revoyez vos réflexions et mesurez le chemin parcouru.', reflectionCount: '{{count}} réflexions', madeForGrowth: 'Créé pour votre propre façon de grandir.', savedBrowser: 'Enregistré dans ce navigateur', keepBackup: 'Garder une sauvegarde', plantHabit: 'Planter une petite habitude', practiceQuestion: 'Que souhaitez-vous pratiquer ?', makeRoom: 'Faire de la place à l’essentiel', oneIntention: 'Une intention pour aujourd’hui', editIntention: 'Modifier votre intention', yourIntention: 'Votre intention', wordsLikeYou: 'Des mots qui vous ressemblent', personalAffirmation: 'Votre affirmation personnelle', reflectionJournal: 'Votre journal de réflexion', backToReflections: 'Retour aux réflexions', momentForYou: 'Un moment pour vous', storyStarts: 'Votre histoire commence par un moment. Vos réflexions enregistrées apparaîtront ici.', save: 'Enregistrer',
      },
      forms: { required: 'Ajoutez un peu de texte.', maxLength: 'Utilisez {{max}} caractères ou moins.' },
      journal: { daybook: 'Le carnet', choosePage: 'Choisissez une page pour ce moment.', differentDays: 'Chaque jour demande une attention différente. Choisissez un mode et faites-le vôtre.', searchModes: 'Rechercher des modes', searchLabel: 'Rechercher des modes de journal', noPages: 'Aucune page ne correspond à « {{query}} ». Essayez une recherche plus douce.', allModes: 'Tous les modes', saved: 'Enregistré', savePage: 'Enregistrer la page', savedPrivately: 'Enregistré en privé sur cet appareil', unsaved: 'Modifications non enregistrées', closePage: 'Fermer la page', oneThing: 'La seule chose que je veux faire aujourd’hui…', rapidToolbar: 'Barre de journal rapide', startRapid: 'Commencez votre journal rapide ici…', whatsInHead: 'Ce que j’ai en tête', whatToDo: 'Ce que je veux en faire', journalPage: 'Page de journal', holdThought: 'Laissez la page accueillir votre première pensée…', reflectionSpace: 'Votre espace de réflexion', clarity: 'Un petit bilan. Un peu de clarté.', makeRoom: 'Faites un peu de place pour vous.', checkIn: 'Commencer un bilan', guidedPrivate: 'Questions guidées · Privé sur ce navigateur', showedUp: 'Vous avez été présent pour vous-même. Cela compte.', tags: 'Tags, séparés par des virgules', tagsPlaceholder: 'Gratitude, repos, croissance', viewSaved: 'Voir la réflexion enregistrée', saveReview: 'Enregistrer et revoir la réflexion', anotherCheckIn: 'Commencer un autre bilan', sendReflection: 'Envoyer la réflexion', journalConversation: 'Conversation du journal', suggestedReplies: 'Réponses suggérées', preparing: 'Préparation de la prochaine réflexion', mood: 'Comment vous sentez-vous ?', energy: 'Votre niveau d’énergie', lowGreat: 'Bas → Excellent', drainedEnergized: 'Épuisé → Énergique' },
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
      ui: common.ui,
      forms: common.forms,
      journal: common.journal,
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
      ui: common.ui,
      forms: common.forms,
      journal: common.journal,
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
