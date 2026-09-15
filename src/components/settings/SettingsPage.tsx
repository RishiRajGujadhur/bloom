import { useTranslation } from 'react-i18next'
import {
  Moon,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { ThemePicker } from './ThemePicker'
import { flagsInGroup } from '../../utils/featureFlags'
import type { FeatureFlagId, FeatureFlagState } from '../../utils/featureFlags'
import type { ThemeSettings } from '../../utils/themeEngine'
import styles from './SettingsPage.module.css'

interface SettingsPageProps {
  settings: ThemeSettings
  onSettingsChange: (settings: ThemeSettings) => void
  flags: FeatureFlagState
  onFlagChange: (id: FeatureFlagId, value: boolean) => void
}

/**
 * Settings is its own page, not a section of the dashboard — the shell swaps
 * the whole content area for it (see App's `view` state).
 *
 * Presentational by design: it owns no storage. The shell applies and persists
 * every change through themeEngine/featureFlags, so each storage key has exactly
 * one writer and the DOM can never disagree with React state.
 */
export function SettingsPage({
  settings,
  onSettingsChange,
  flags,
  onFlagChange,
}: SettingsPageProps) {
  const { t } = useTranslation()

  const groups = [
    {
      id: 'preferences' as const,
      heading: t('settings.preferencesHeading'),
      description: t('settings.preferencesDescription'),
      Icon: SlidersHorizontal,
    },
    {
      id: 'features' as const,
      heading: t('settings.featuresHeading'),
      description: t('settings.featuresDescription'),
      Icon: Sparkles,
    },
  ]

  return (
    <div className={styles.page} id="settings">
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          <SettingsIcon size={14} aria-hidden="true" /> {t('settings.eyebrow')}
        </p>
        <h1>{t('settings.title')}</h1>
        <p className={styles.intro}>{t('settings.subtitle')}</p>
      </header>

      <section className={styles.card} aria-labelledby="settings-appearance">
        <div className={styles.cardHeader}>
          <div>
            <h2 id="settings-appearance">{t('settings.appearanceHeading')}</h2>
            <p>{t('settings.appearanceDescription')}</p>
          </div>
          <span className={styles.badge}>
            <Moon size={13} aria-hidden="true" /> {t('settings.storedLocally')}
          </span>
        </div>
        <ThemePicker settings={settings} onChange={onSettingsChange} />
      </section>

      {groups.map(({ id, heading, description, Icon }) => (
        <section
          className={styles.card}
          key={id}
          aria-labelledby={`settings-${id}`}
        >
          <div className={styles.cardHeader}>
            <div>
              <h2 id={`settings-${id}`}>{heading}</h2>
              <p>{description}</p>
            </div>
            <span className={styles.cardIcon} aria-hidden="true">
              <Icon size={17} />
            </span>
          </div>

          <div className={styles.flagList}>
            {flagsInGroup(id).map((flag) => {
              const label = t(`settings.flags.${flag.id}.title`)
              return (
                <label className={styles.flag} key={flag.id}>
                  <span className={styles.flagText}>
                    <strong>{label}</strong>
                    <small>{t(`settings.flags.${flag.id}.description`)}</small>
                  </span>
                  <span className={styles.switch}>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={flags[flag.id]}
                      aria-label={label}
                      onChange={(event) =>
                        onFlagChange(flag.id, event.target.checked)
                      }
                    />
                    <span className={styles.slider} aria-hidden="true" />
                  </span>
                </label>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
