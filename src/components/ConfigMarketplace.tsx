import { useState, type Dispatch, type SetStateAction } from 'react'
import type { AppSettings } from '../settings/appSettings'
import {
  FONTS,
  THEMES,
  safeColors,
  type ThemeSettings,
} from '../utils/themeEngine'
import {
  DEFAULT_WIDGETS,
  validWidgets,
  WIDGET_EVENT,
  WIDGET_KEY,
  type Widget,
} from './dashboard/WidgetBoard'

type ConfigPack = {
  bloomConfig: 1
  id: string
  name: string
  author: string
  settings: AppSettings
  theme: ThemeSettings
  widgets: Widget[]
}
const KEY = 'bloom-config-marketplace-v1'
const MAX_FILE = 300_000
function download(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `${name.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function read(): unknown[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(value) ? value.slice(0, 50) : []
  } catch {
    return []
  }
}

export function ConfigMarketplace({
  settings,
  setSettings,
  theme,
  setTheme,
  parseSettings,
}: {
  settings: AppSettings
  setSettings: Dispatch<SetStateAction<AppSettings>>
  theme: ThemeSettings
  setTheme: Dispatch<SetStateAction<ThemeSettings>>
  parseSettings: (value: unknown) => AppSettings | null
}) {
  const normalize = (value: unknown): ConfigPack | null => {
    if (!value || typeof value !== 'object') return null
    const raw = value as Partial<ConfigPack>
    const validSettings = parseSettings(raw.settings)
    const widgets = validWidgets(raw.widgets)
    if (
      raw.bloomConfig !== 1 ||
      typeof raw.name !== 'string' ||
      !raw.name.trim() ||
      !validSettings ||
      !widgets ||
      !raw.theme ||
      typeof raw.theme !== 'object'
    )
      return null
    const safeTheme: ThemeSettings = {
      themeId: THEMES.some((entry) => entry.id === raw.theme?.themeId)
        ? raw.theme.themeId
        : 'bloom-light',
      fontId: FONTS.some((entry) => entry.id === raw.theme?.fontId)
        ? raw.theme.fontId
        : 'system',
      customColors: safeColors(raw.theme.customColors),
    }
    return {
      bloomConfig: 1,
      id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
      name: raw.name.trim().slice(0, 80),
      author:
        typeof raw.author === 'string' ? raw.author.slice(0, 80) : 'Community',
      settings: validSettings,
      theme: safeTheme,
      widgets,
    }
  }
  const [packs, setPacks] = useState<ConfigPack[]>(() =>
    read()
      .map(normalize)
      .filter((item): item is ConfigPack => !!item),
  )
  const [name, setName] = useState('My Bloom setup')
  const [message, setMessage] = useState('')
  const save = (next: ConfigPack[]) => {
    setPacks(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      setMessage(
        'Storage is unavailable; config changes will last only for this session.',
      )
    }
  }
  const currentWidgets = () => {
    try {
      return (
        validWidgets(JSON.parse(localStorage.getItem(WIDGET_KEY) || 'null')) ??
        DEFAULT_WIDGETS
      )
    } catch {
      return DEFAULT_WIDGETS
    }
  }
  const create = (): ConfigPack => ({
    bloomConfig: 1,
    id: crypto.randomUUID(),
    name: name.trim().slice(0, 80) || 'My Bloom setup',
    author: 'Me',
    settings,
    theme,
    widgets: currentWidgets(),
  })
  const apply = (pack: ConfigPack) => {
    setSettings(pack.settings)
    setTheme(pack.theme)
    try {
      localStorage.setItem(WIDGET_KEY, JSON.stringify(pack.widgets))
      window.dispatchEvent(new Event(WIDGET_EVENT))
    } catch {
      setMessage('Widget layout could not be saved.')
    }
    setMessage(`Applied ${pack.name}.`)
  }
  const importFile = async (file: File) => {
    if (file.size > MAX_FILE) {
      setMessage('Choose a config file under 300 KB.')
      return
    }
    try {
      const pack = normalize(JSON.parse(await file.text()))
      if (!pack) throw Error('This is not a valid Bloom config file.')
      save([...packs, { ...pack, id: crypto.randomUUID() }])
      setMessage(`Imported ${pack.name}.`)
    } catch {
      setMessage('This is not a valid Bloom config file.')
    }
  }
  return (
    <section
      aria-labelledby="config-marketplace-heading"
      style={{ marginBlock: 24 }}
    >
      <h2 id="config-marketplace-heading">Config marketplace</h2>
      <p>
        Save a setup with feature switches, theme colors, and home widgets.
        Export it to share with another Bloom user. Imported configs stay on
        this device until you apply or delete them.
      </p>
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <label>
          Config name{' '}
          <input
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            const pack = create()
            save([...packs, pack])
            setMessage(`Saved ${pack.name}.`)
          }}
        >
          Save current setup
        </button>
        <button
          type="button"
          onClick={() => {
            const pack = create()
            download(pack.name, pack)
          }}
        >
          Export current setup
        </button>
        <label>
          Import config JSON{' '}
          <input
            type="file"
            accept=".json,application/json"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void importFile(file)
              event.target.value = ''
            }}
          />
        </label>
      </div>
      {message && <p role="status">{message}</p>}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
          gap: 12,
          marginBlock: 16,
        }}
      >
        {packs.map((pack) => (
          <article
            key={pack.id}
            style={{
              padding: 12,
              border: '1px solid var(--border-color,#aaa6)',
              borderRadius: 10,
              background: 'var(--bg-surface)',
            }}
          >
            <h3>{pack.name}</h3>
            <p>
              by {pack.author} · {pack.widgets.length} widgets
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => apply(pack)}>
                Apply
              </button>
              <button type="button" onClick={() => download(pack.name, pack)}>
                Export
              </button>
              <button
                type="button"
                onClick={() =>
                  save(packs.filter((item) => item.id !== pack.id))
                }
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
      {!packs.length && <p>No saved configs yet.</p>}
    </section>
  )
}
