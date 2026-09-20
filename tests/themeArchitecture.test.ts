import fs from 'node:fs'
import path from 'node:path'

/**
 * Static guards for the theming contract.
 *
 * jsdom never loads a stylesheet, so nothing in the component tests can notice
 * a stylesheet that stops using tokens, or a codemod that corrupted the braces.
 * These read the CSS as text and assert the invariants directly.
 */

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8')

/** UI chrome: must be token-driven, since the user can restyle all of it. */
const TOKENISED = ['src/App.css', 'src/index.css', 'src/settings.module.css']

/** The RPG zone keeps its own art palettes (bloom/forest/amber) by design. */
const ART_FILES = ['src/rpg/rpg.css']

const braceDepth = (css: string) => {
  let depth = 0
  let lowest = 0
  for (const char of css) {
    if (char === '{') depth += 1
    else if (char === '}') {
      depth -= 1
      lowest = Math.min(lowest, depth)
    }
  }
  return { depth, lowest }
}

describe('UI chrome carries no hardcoded colour', () => {
  for (const file of TOKENISED) {
    test(`${file} uses custom properties only`, () => {
      const hex = read(file).match(/#[0-9a-fA-F]{3,8}\b/g) ?? []
      expect(hex).toEqual([])
    })
  }
})

describe('every custom property in use is defined somewhere', () => {
  test('no dangling tokens', () => {
    const used = new Set<string>()
    for (const file of TOKENISED) {
      for (const match of read(file).matchAll(/var\((--[a-z0-9-]+)/g)) {
        used.add(match[1])
      }
    }

    const defined = new Set<string>()
    for (const file of [
      'src/styles/themes.css',
      'src/styles/variables.css',
      'src/rpg/rpg.css',
    ]) {
      for (const match of read(file).matchAll(/(--[a-z0-9-]+)\s*:/g)) {
        defined.add(match[1])
      }
    }

    // Injected by Sprite.tsx as inline style at runtime.
    const injectedFromTsx = new Set(['--sprite-row', '--sprite-size'])

    const dangling = [...used].filter(
      (token) => !defined.has(token) && !injectedFromTsx.has(token),
    )
    expect(dangling).toEqual([])
  })
})

describe('the legacy light/dark attribute is fully retired', () => {
  test('nothing selects on data-theme="light" or "dark"', () => {
    const offenders = [...TOKENISED, ...ART_FILES].filter((file) =>
      /data-theme\s*=\s*['"](?:light|dark)['"]/.test(read(file)),
    )
    expect(offenders).toEqual([])
  })
})

describe('the stylesheets stay well-formed', () => {
  // A codemod that emits an extra closing brace swallows the remainder of the
  // file, including @media nesting, and no runtime test can see it.
  for (const file of [...TOKENISED, ...ART_FILES]) {
    test(`${file} braces balance and never close early`, () => {
      const { depth, lowest } = braceDepth(read(file))
      expect({ file, depth, lowest }).toEqual({ file, depth: 0, lowest: 0 })
    })
  }
})

describe('theme previews cannot drift from the stylesheet', () => {
  test('the picker samples real tokens instead of duplicated hex values', () => {
    const picker = read('src/components/settings/ThemePicker.tsx')
    expect(picker).toContain('var(--bg-primary)')
    expect(picker).toContain('var(--bg-surface)')
    expect(picker).toContain('var(--accent-color)')
  })

  test('the list of palettes and fonts is owned by the engine, not the picker', () => {
    const picker = read('src/components/settings/ThemePicker.tsx')
    expect(picker).toContain("from '../../utils/themeEngine'")
    expect(picker).not.toMatch(/#[0-9a-fA-F]{6}/)
  })
})

describe('Tailwind stays connected to the runtime theme engine', () => {
  test('Vite loads the Tailwind plugin', () => {
    const config = read('vite.config.ts')
    expect(config).toContain("from '@tailwindcss/vite'")
    expect(config).toContain('tailwindcss()')
  })

  test('semantic utilities resolve through the existing theme tokens', () => {
    const styles = read('src/index.css')
    expect(styles).toContain("@import 'tailwindcss/utilities.css'")
    expect(styles).toContain('--color-page: var(--bg-primary)')
    expect(styles).toContain('--color-surface: var(--bg-surface)')
    expect(styles).toContain('--color-foreground: var(--text-primary)')
    expect(styles).toContain('--color-accent: var(--accent-color)')
    expect(styles).toContain("[data-mode='dark']")
  })
})
