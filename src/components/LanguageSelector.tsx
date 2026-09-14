import { useTranslation } from 'react-i18next'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'en-pirate', label: 'Pirate English' },
  { code: 'en-slang', label: 'Slang English' },
] as const

export function LanguageSelector() {
  const { i18n, t } = useTranslation()
  const selectedLanguage = languages.some(({ code }) => code === i18n.language)
    ? i18n.language
    : 'en'

  return (
    <label className="language-selector">
      <span>{t('actions.language')}</span>
      <select
        aria-label={t('actions.language')}
        value={selectedLanguage}
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value)
        }}
      >
        {languages.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </label>
  )
}
