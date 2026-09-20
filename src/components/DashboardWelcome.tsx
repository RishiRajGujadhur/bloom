import { useTranslation } from 'react-i18next'

type DashboardWelcomeProps = {
  date: string
}

export function DashboardWelcome({ date }: DashboardWelcomeProps) {
  const { t } = useTranslation()

  return (
    <div className="welcome flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="eyebrow">{date}</div>
        <h1>{t('welcome.title')}</h1>
        <p>{t('welcome.subtitle')}</p>
      </div>
      <div className="private-badge">
        <span className="tiny-dot" /> {t('welcome.private')}
      </div>
    </div>
  )
}
