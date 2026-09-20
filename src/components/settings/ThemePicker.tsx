import { Check, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FONTS, THEMES } from '../../utils/themeEngine'
import type { ThemeSettings } from '../../utils/themeEngine'
import styles from './ThemePicker.module.css'

interface ThemePickerProps {
  settings: ThemeSettings
  /** Called for every change; the parent applies + persists it. */
  onChange: (settings: ThemeSettings) => void
}

/**
 * Colour palette grid and font selector.
 *
 * The swatches deliberately read `var(--bg-primary)` & co. while carrying a
 * `data-theme` attribute of their own: the palette blocks in themes.css apply
 * to any element, so each swatch renders the *actual* tokens for that theme.
 * If someone edits themes.css, these previews follow automatically instead of
 * silently drifting from a duplicated hex table.
 */
export function ThemePicker({ settings, onChange }: ThemePickerProps) {
  const { t } = useTranslation()
  const activeTheme = THEMES.find((theme) => theme.id === settings.themeId)
  const currentAccent =
    settings.customAccent ?? activeTheme?.accent ?? THEMES[0].accent

  return (
    <div className={`${styles.picker} flex flex-col gap-6`}>
      <section className={styles.block} aria-labelledby="settings-colors">
        <h3 id="settings-colors">{t('settings.colors')}</h3>
        <p className={styles.hint}>{t('settings.colorsHint')}</p>

        <div className={`${styles.themeGrid} grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3`}>
          {THEMES.map((theme) => {
            const isActive = theme.id === settings.themeId
            return (
              <button
                key={theme.id}
                type="button"
                className={styles.themeCard}
                data-active={isActive}
                aria-pressed={isActive}
                onClick={() => onChange({ ...settings, themeId: theme.id })}
              >
                <span
                  className={styles.swatch}
                  data-theme={theme.id}
                  aria-hidden="true"
                >
                  <span
                    className={styles.swatchBg}
                    style={{ background: 'var(--bg-primary)' }}
                  >
                    <span
                      className={styles.swatchSurface}
                      style={{ background: 'var(--bg-surface)' }}
                    />
                    <span
                      className={styles.swatchAccent}
                      style={{ background: 'var(--accent-color)' }}
                    />
                  </span>
                </span>
                <span className={styles.themeMeta}>
                  <strong>{theme.name}</strong>
                  <small>
                    {theme.mode === 'dark'
                      ? t('settings.dark')
                      : t('settings.light')}
                  </small>
                </span>
                {isActive && (
                  <Check
                    size={16}
                    className={styles.check}
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}
        </div>

        <div className={styles.accentRow}>
          <label htmlFor="custom-accent">
            <span>{t('settings.customAccent')}</span>
            <small>{t('settings.customAccentHint')}</small>
          </label>
          <div className={styles.accentControls}>
            <input
              id="custom-accent"
              type="color"
              value={currentAccent}
              onChange={(event) =>
                onChange({ ...settings, customAccent: event.target.value })
              }
            />
            {settings.customAccent && (
              <button
                type="button"
                className={styles.resetAccent}
                onClick={() =>
                  onChange({
                    themeId: settings.themeId,
                    fontId: settings.fontId,
                  })
                }
              >
                <RotateCcw size={14} aria-hidden="true" />
                {t('settings.resetAccent')}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className={styles.block} aria-labelledby="settings-fonts">
        <h3 id="settings-fonts">{t('settings.fonts')}</h3>
        <p className={styles.hint}>{t('settings.fontsHint')}</p>

        <div className={`${styles.fontList} grid grid-cols-1 gap-3 md:grid-cols-2`}>
          {FONTS.map((font) => {
            const isActive = font.id === settings.fontId
            return (
              <button
                key={font.id}
                type="button"
                className={styles.fontOption}
                data-active={isActive}
                aria-pressed={isActive}
                onClick={() => onChange({ ...settings, fontId: font.id })}
              >
                <span className={styles.fontName}>{font.name}</span>
                {/* data-font on the sample makes the fonts block in themes.css
                    supply --font-family locally — no duplicated stacks. */}
                <span
                  className={styles.fontSample}
                  data-font={font.id}
                  aria-hidden="true"
                >
                  {font.sample}
                </span>
                {isActive && (
                  <Check
                    size={15}
                    className={styles.check}
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
