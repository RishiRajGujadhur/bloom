import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from './i18n'

export function LanguageSelector() {
  const { i18n, t } = useTranslation()

  return (
    <div className="language-selector">
      <select
        value={i18n.resolvedLanguage ?? 'en'}
        onChange={(e) => void i18n.changeLanguage(e.target.value)}
        aria-label={t('language.select')}
        className="language-select"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  )
}