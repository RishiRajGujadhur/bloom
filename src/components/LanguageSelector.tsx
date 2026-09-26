import { subOn } from '../features/subFeatures'
import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Select } from './ui/Menu'

const languages = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'en-pirate', label: 'Pirate English' },
  { value: 'en-slang', label: 'Slang English' },
]

export function LanguageSelector() {
  const { i18n, t } = useTranslation()
  const selectedLanguage = languages.some(({ value }) => value === i18n.language)
    ? i18n.language
    : 'en'

  return (
    <Select
      className="language-selector"
      label={t('actions.language')}
      value={selectedLanguage}
      options={languages.map((l) =>
        l.value === 'fr' && !subOn('languageSelector', 'nativeNames') ? { ...l, label: 'French' } : l,
      ).filter(
        (l) =>
          l.value === 'en' ||
          (l.value === 'fr' ? subOn('languageSelector', 'french') : subOn('languageSelector', 'dialects')),
      )}
      icon={subOn('languageSelector', 'icon') ? <Languages size={16} aria-hidden="true" /> : undefined}
      onValueChange={(value) => {
        void i18n.changeLanguage(value)
      }}
    />
  )
}
