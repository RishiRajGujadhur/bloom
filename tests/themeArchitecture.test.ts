import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { FONTS, THEMES } from '../src/utils/themeEngine'

/**
 * These are static guards for the theme architecture itself. They exist because
 * two real bugs slipped past the component tests:
 *   1. a hardcoded `z-index: 10` on the sidebar left it under the drawer
 *      backdrop, so the open drawer's own nav could not be clicked;
 *   2. colours in App.css would silently stop following the theme.
 * jsdom has no layout engine and never loads the real stylesheets, so these
 * facts have to be asserted against the CSS source.
 */
const root = join(__dirname, '..')
const read = (path: string) => readFileSync(join(root, path), 'utf8')

const appCss = read('src/App.css')
const indexCss = read('src/index.css')
const themesCss = read('src/styles/themes.css')
const variablesCss = read('src/styles/variables.css')
const token = (name: string) => {
  const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(variablesCss)
  expect(match).not.toBeNull()
  return match![1].trim()
}

describe('colour tokens', () => {
  test('the migrated stylesheets contain no hardcoded colours', () => {
    // Colours belong in themes.css only; anything else would not follow a theme.
    for (const [name, css] of [
      ['App.css', appCss],
      ['index.css', indexCss],
    ] as const) {
      const literals = css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []
      expect({ [name]: literals }).toEqual({ [name]: [] })
    }
  })

  test('the theme blocks do not declare a colour as a plain literal outside themes.css', () => {
    expect(appCss).not.toMatch(/\bcolor:\s*#[0-9a-fA-F]/)
    expect(appCss).not.toMatch(/\bbackground:\s*#[0-9a-fA-F]/)
  })
})

describe('layout tokens', () => {
  test('sidebar and main take their width from the same token', () => {
    expect(appCss).toMatch(/\.sidebar \{[\s\S]*?width: var\(--sidebar-width\)/)
    expect(appCss).toMatch(/main \{[\s\S]*?margin-left: var\(--sidebar-width\)/)
    // no leftover literals from the original fixed-width layout
    expect(appCss).not.toMatch(/width: 232px/)
    expect(appCss).not.toMatch(/margin-left: 232px/)
    expect(appCss).not.toMatch(/margin-left: 195px/)
  })

  test('the collapsed rail is driven by its own token', () => {
    expect(appCss).toMatch(
      /html\[data-sidebar='collapsed'\] \.sidebar \{[\s\S]*?width: var\(--sidebar-collapsed-width\)/,
    )
    expect(Number.parseInt(token('sidebar-collapsed-width'))).toBeLessThan(
      Number.parseInt(token('sidebar-width')),
    )
  })
})

describe('stacking order', () => {
  test('the sidebar outranks the drawer backdrop', () => {
    // Otherwise the backdrop swallows clicks meant for the drawer's own nav.
    const backdrop = Number.parseInt(token('z-backdrop'))
    const sidebar = Number.parseInt(token('z-sidebar'))
    expect(sidebar).toBeGreaterThan(backdrop)
    expect(appCss).toMatch(/\.sidebar \{[\s\S]*?z-index: var\(--z-sidebar\)/)
    expect(appCss).not.toMatch(/\.sidebar \{[\s\S]*?z-index: 10;/)
  })

  test('the hamburger stays reachable above both', () => {
    expect(Number.parseInt(token('z-hamburger'))).toBeGreaterThan(
      Number.parseInt(token('z-sidebar')),
    )
  })
})

describe('the RPG palette stays inside the game zone', () => {
  const rpgCss = read('src/rpg/rpg.css')

  test('the game zone derives its palette from the theme by default', () => {
    // Otherwise the adventure's accent and character-card panel ignore the
    // theme the user picked (the "YOUR EVERYDAY ADVENTURE" text stayed purple).
    const appShell = /\.app-shell\{([^}]*)\}/.exec(rpgCss)?.[1]
    expect(appShell).toBeDefined()
    expect(appShell).toContain('--game-accent:var(--accent-color)')
    expect(appShell).toContain('--game-soft:var(--accent-soft)')
    expect(appShell).toContain('--game-ink:var(--text-primary)')
    expect(appShell).toContain('color-mix(in oklab,var(--accent-color)')
  })

  test('the zone points its accents at the game tokens, not the theme directly', () => {
    // The zone must go through --game-* so Forest/Amber can still override it.
    expect(rpgCss).toContain('.rpg-heading>.eyebrow{color:var(--game-accent)')
    expect(rpgCss).toContain(
      'background:linear-gradient(125deg,var(--game-deep),var(--game-mid))',
    )
  })

  test('a palette cannot mask the theme accent on app chrome', () => {
    // rpg.css used to override the brand icon, primary buttons, the active nav
    // pill and the hero accent with --game-accent, which made every theme look
    // like the default purple.
    for (const chrome of [
      'brand-icon',
      'nav button.active',
      '.affirmation',
      '.welcome h1 em',
      '.checkmark.checked',
    ]) {
      expect(rpgCss).not.toContain(chrome)
    }
  })

  test('the page background belongs to the theme, not the palette', () => {
    expect(rpgCss).not.toMatch(/background:#f2f8f4/)
    expect(rpgCss).not.toMatch(/background:#fcf8ed/)
    expect(rpgCss).not.toMatch(/#15231e/)
    expect(rpgCss).not.toMatch(/#282016/)
    // the palette variables themselves are still defined
    expect(rpgCss).toMatch(/--game-accent:/)
    expect(rpgCss).toMatch(/--game-soft:/)
  })
})

describe('the minified RPG stylesheet is well-formed', () => {
  // A regex-based edit duplicated closing braces on every rule, which silently
  // broke the @media/@keyframes nesting. These two invariants catch that class
  // of damage immediately.
  const rpgCss = read('src/rpg/rpg.css')

  test('braces balance', () => {
    const opens = (rpgCss.match(/\{/g) ?? []).length
    const closes = (rpgCss.match(/\}/g) ?? []).length
    expect({ opens, closes }).toEqual({ opens, closes: opens })
  })

  test('every line is self-contained (each rule closes on its own line)', () => {
    const imbalanced = rpgCss
      .split('\n')
      .map((line, index) => ({
        line: index + 1,
        delta:
          (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length,
      }))
      .filter((entry) => entry.delta !== 0)
    expect(imbalanced).toEqual([])
  })
})

describe('theme catalogue stays in sync with the CSS', () => {
  test('every palette in the engine has a block in themes.css', () => {
    for (const theme of THEMES) {
      expect(themesCss).toContain(`[data-theme='${theme.id}']`)
    }
  })

  test('every palette declares the anchors the derived tokens need', () => {
    for (const theme of THEMES) {
      const block = new RegExp(
        `\\[data-theme='${theme.id}'\\] \\{([^}]*)\\}`,
      ).exec(themesCss)?.[1]
      expect(block).toBeDefined()
      for (const anchor of [
        '--bg-primary',
        '--bg-surface',
        '--accent-color',
        '--mode',
      ]) {
        expect(block).toContain(anchor)
      }
    }
  })

  test('every font in the engine has a [data-font] block', () => {
    for (const font of FONTS) {
      expect(themesCss).toContain(`[data-font='${font.id}']`)
    }
  })

  test('both structural layers define the full derived token set', () => {
    for (const mode of ['light', 'dark']) {
      const block = new RegExp(
        `html\\[data-mode='${mode}'\\] \\{([\\s\\S]*?)\\n\\}`,
      ).exec(themesCss)?.[1]
      expect(block).toBeDefined()
      for (const derived of [
        '--text-primary',
        '--text-secondary',
        '--border-color',
        '--bg-elevated',
        '--accent-soft',
        '--card-hover',
        '--success',
        '--danger',
        '--shadow-color',
        '--focus-ring',
      ]) {
        expect(block).toContain(derived)
      }
    }
  })
})
