/* ==========================================================================
   themeEngine.ts — the single owner of theming side effects.

   Reads/writes theme settings to the DOM (<html> attributes + inline accent)
   and to localStorage. React state is deliberately NOT kept here: changing a
   theme must not re-render the tree, so the DOM + CSS variables are the
   transport and this module is the only writer.
   ========================================================================== */

import { loadThemeFonts } from './fontLoader'

export type ThemeMode = 'light' | 'dark'

export interface ThemeSettings {
  themeId: string
  fontId: string
  customAccent?: string
  /** A font family installed on this computer (Local Font Access); used when fontId is 'local'. */
  localFont?: string
  customColors?: Record<string, string>
}

export const COLOR_TOKENS = [
  '--bg-primary',
  '--bg-surface',
  '--bg-sidebar',
  '--bg-elevated',
  '--bg-overlay',
  '--accent-color',
  '--accent-hover',
  '--accent-soft',
  '--text-primary',
  '--text-secondary',
  '--text-muted',
  '--text-on-accent',
  '--border-color',
  '--border-strong',
  '--card-hover',
  '--focus-ring',
  '--success',
  '--warning',
  '--danger',
] as const
export function safeColors(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, color]) =>
        COLOR_TOKENS.includes(key as (typeof COLOR_TOKENS)[number]) &&
        isHexColor(color),
    ),
  )
}

export interface ThemeDefinition {
  id: string
  /** Shown in the picker. */
  name: string
  mode: ThemeMode
  /** Swatch + preview colours; must match themes.css. */
  bg: string
  surface: string
  accent: string
}

export interface FontDefinition {
  id: string
  name: string
  /** Sample text rendered in the picker, in its own face. */
  sample: string
}

/** Keys are the contract with themes.css — do not rename without both files. */
export const THEME_STORAGE_KEY = 'mindfulness-dashboard-theme-settings'

/** Pre-multi-theme key, still read once so an existing choice is not lost. */
const LEGACY_THEME_STORAGE_KEY = 'mindfulness-dashboard-theme'

/** Remembers the last theme used per mode so the topbar toggle is reversible. */
const MODE_MEMORY_STORAGE_KEY = 'mindfulness-dashboard-theme-mode-memory'

/*
 * Bloom's own palettes come first on purpose: the app's original look must stay
 * the default, and the topbar light/dark toggle pairs the first palette of each
 * mode (bloom-light <-> bloom-dark) rather than jumping to an unrelated scheme.
 */
export const THEMES: ThemeDefinition[] = [
  {
    id: 'bloom-light',
    name: 'Bloom Light',
    mode: 'light',
    bg: '#fbf6f1',
    surface: '#fffdfb',
    accent: '#ad4e2c',
  },
  {
    id: 'bloom-dark',
    name: 'Bloom Dark',
    mode: 'dark',
    bg: '#1a1512',
    surface: '#251e1a',
    accent: '#ec8a62',
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    mode: 'dark',
    bg: '#05070d',
    surface: '#101722',
    accent: '#a6f8cf',
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    mode: 'dark',
    bg: '#0d1117',
    surface: '#161b22',
    accent: '#58a6ff',
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    mode: 'light',
    bg: '#ffffff',
    surface: '#f6f8fa',
    accent: '#0969da',
  },
  {
    id: 'dracula',
    name: 'Dracula',
    mode: 'dark',
    bg: '#282a36',
    surface: '#44475a',
    accent: '#ff79c6',
  },
  {
    id: 'nord',
    name: 'Nord',
    mode: 'dark',
    bg: '#2e3440',
    surface: '#3b4252',
    accent: '#88c0d0',
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    mode: 'dark',
    bg: '#1e1e2e',
    surface: '#313244',
    accent: '#cba6f7',
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    mode: 'dark',
    bg: '#1a1b26',
    surface: '#24283b',
    accent: '#7aa2f7',
  },
  {
    id: 'rose-pine',
    name: 'Rosé Pine',
    mode: 'dark',
    bg: '#191724',
    surface: '#1f1d2e',
    accent: '#ebbcba',
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    mode: 'dark',
    bg: '#002b36',
    surface: '#073642',
    accent: '#268bd2',
  },
  {
    id: 'synthwave-84',
    name: 'Synthwave 84',
    mode: 'dark',
    bg: '#262335',
    surface: '#34294f',
    accent: '#ff7edb',
  },
  {
    id: 'glow-purple',
    name: 'Purple Glow',
    mode: 'dark',
    bg: '#050508',
    surface: '#0d0b1f',
    accent: '#7b61ff',
  },
  {
    id: 'glow-orange',
    name: 'Orange Glow',
    mode: 'dark',
    bg: '#050508',
    surface: '#140b07',
    accent: '#ff8a3d',
  },
  {
    id: 'glow-pink',
    name: 'Pink Glow',
    mode: 'dark',
    bg: '#050508',
    surface: '#170a17',
    accent: '#f25cff',
  },
  {
    id: 'glow-green',
    name: 'Green Glow',
    mode: 'dark',
    bg: '#050508',
    surface: '#08140a',
    accent: '#3dff6e',
  },
  {
    id: 'glow-blue',
    name: 'Blue Glow',
    mode: 'dark',
    bg: '#050508',
    surface: '#070d1c',
    accent: '#3d7bff',
  },
  {
    id: 'matrix',
    name: 'Matrix',
    mode: 'dark',
    bg: '#030a05',
    surface: '#07140b',
    accent: '#39ff6a',
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Forest',
    mode: 'dark',
    bg: '#121e17',
    surface: '#1c2d23',
    accent: '#52b788',
  },
]

export const FONTS: FontDefinition[] = [
  { id: 'system', name: 'System', sample: 'Aa — calm and clear' },
  { id: 'mono', name: 'Mono', sample: 'const calm = true;' },
  { id: 'serif', name: 'Serif', sample: 'Reflection reads deeply' },
  { id: 'handwritten', name: 'Handwritten', sample: 'Today I showed up' },
  { id: 'pixel', name: 'Pixel', sample: 'LEVEL UP! +50 XP' },
  { id: 'readable', name: 'Easy to read', sample: 'bd pq Il1 — clear letters' },
]

export const DEFAULT_THEME_ID = 'bloom-light'
export const DEFAULT_FONT_ID = 'system'

const isKnownTheme = (id: unknown): id is string =>
  typeof id === 'string' && THEMES.some((theme) => theme.id === id)

const isKnownFont = (id: unknown): id is string =>
  typeof id === 'string' &&
  (id === 'local' || FONTS.some((font) => font.id === id))

/** A plausible font family name (letters, digits, spaces, a few symbols) — never injected raw. */
const isFamily = (v: unknown): v is string =>
  typeof v === 'string' && /^[\p{L}\p{N} ._'&+-]{1,80}$/u.test(v)

/** Accepts #rgb / #rrggbb only — anything else is ignored, never injected. */
const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())

export function getThemeMode(themeId: string): ThemeMode {
  return THEMES.find((theme) => theme.id === themeId)?.mode ?? 'dark'
}

/** Safe on private-mode / disabled storage: always returns usable settings. */
export function getStoredTheme(): ThemeSettings {
  const fallback: ThemeSettings = {
    themeId: DEFAULT_THEME_ID,
    fontId: DEFAULT_FONT_ID,
  }
  let raw: string | null
  try {
    raw = localStorage.getItem(THEME_STORAGE_KEY)
  } catch {
    return fallback
  }

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<ThemeSettings>
      const customColors = safeColors(parsed.customColors)
      return {
        themeId: isKnownTheme(parsed.themeId)
          ? parsed.themeId
          : DEFAULT_THEME_ID,
        fontId: isKnownFont(parsed.fontId) ? parsed.fontId : DEFAULT_FONT_ID,
        ...(isHexColor(parsed.customAccent)
          ? { customAccent: parsed.customAccent }
          : {}),
        ...(isFamily(parsed.localFont) ? { localFont: parsed.localFont } : {}),
        ...(Object.keys(customColors).length ? { customColors } : {}),
      }
    } catch {
      // fall through to legacy migration / defaults
    }
  }

  // Migrate the pre-multi-theme light/dark choice to its Bloom equivalent.
  try {
    const legacy = localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
    if (legacy === 'light' || legacy === 'dark') {
      return {
        themeId: legacy === 'light' ? 'bloom-light' : 'bloom-dark',
        fontId: DEFAULT_FONT_ID,
      }
    }
  } catch {
    /* ignore */
  }
  return fallback
}

/**
 * The only function that touches the document. Applies palette, font, mode and
 * an optional custom accent, then persists. No React state is involved, so a
 * theme change repaints without re-rendering a single component.
 */
export function applyTheme(settings: ThemeSettings): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  const themeId = isKnownTheme(settings.themeId)
    ? settings.themeId
    : DEFAULT_THEME_ID
  const fontId = isKnownFont(settings.fontId)
    ? settings.fontId
    : DEFAULT_FONT_ID
  const mode = getThemeMode(themeId)
  loadThemeFonts(fontId, themeId)

  root.setAttribute('data-theme', themeId)
  const local =
    fontId === 'local' && isFamily(settings.localFont)
      ? settings.localFont
      : null
  root.setAttribute(
    'data-font',
    local ? 'local' : fontId === 'local' ? DEFAULT_FONT_ID : fontId,
  )
  if (local)
    root.style.setProperty('--font-local', `"${local.replace(/"/g, '')}"`)
  else root.style.removeProperty('--font-local')
  root.setAttribute('data-mode', mode)
  root.style.colorScheme = mode

  // Inline style outranks the palette block; clearing it restores the theme's
  // own accent.
  if (isHexColor(settings.customAccent)) {
    root.style.setProperty('--accent-color', settings.customAccent.trim())
  } else {
    root.style.removeProperty('--accent-color')
  }
  const colors = safeColors(settings.customColors)
  for (const token of COLOR_TOKENS) {
    if (colors[token]) root.style.setProperty(token, colors[token])
    else if (token === '--accent-color' && isHexColor(settings.customAccent)) continue
    else root.style.removeProperty(token)
  }

  try {
    const base: ThemeSettings = isHexColor(settings.customAccent)
      ? { themeId, fontId, customAccent: settings.customAccent.trim() }
      : { themeId, fontId }
    const persisted: ThemeSettings = {
      ...base,
      ...(local ? { localFont: local } : {}),
      ...(Object.keys(colors).length ? { customColors: colors } : {}),
    }
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(persisted))
  } catch {
    /* storage unavailable — theme still applied for this session */
  }
}

/** Light/dark counterpart for the topbar toggle, remembering each side. */
export function toggleThemeMode(current: ThemeSettings): ThemeSettings {
  const targetMode: ThemeMode =
    getThemeMode(current.themeId) === 'dark' ? 'light' : 'dark'
  let memory: Record<string, string>
  try {
    memory = JSON.parse(
      localStorage.getItem(MODE_MEMORY_STORAGE_KEY) ?? '{}',
    ) as Record<string, string>
  } catch {
    memory = {}
  }

  const remembered = memory[targetMode]
  const themeId =
    isKnownTheme(remembered) && getThemeMode(remembered) === targetMode
      ? remembered
      : (THEMES.find((theme) => theme.mode === targetMode)?.id ??
        DEFAULT_THEME_ID)

  memory[getThemeMode(current.themeId)] = current.themeId
  try {
    localStorage.setItem(MODE_MEMORY_STORAGE_KEY, JSON.stringify(memory))
  } catch {
    /* ignore */
  }

  return { ...current, themeId }
}
