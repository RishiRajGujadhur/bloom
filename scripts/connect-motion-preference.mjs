import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const dirty = new Set(execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8' }).trim().split(/\r?\n/).map((name) => name.replaceAll('\\', '/')))
const root = path.resolve('src')
const utility = path.join(root, 'utils', 'motion.ts')
const forms = [
  "window.matchMedia?.('(prefers-reduced-motion: reduce)').matches",
  "window.matchMedia('(prefers-reduced-motion: reduce)').matches",
]
let changed = 0
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) { visit(file); continue }
    if (!/\.tsx?$/.test(entry.name) || file === utility) continue
    const relative = path.relative(process.cwd(), file).replaceAll('\\', '/')
    if (dirty.has(relative)) continue
    let source = fs.readFileSync(file, 'utf8')
    if (!forms.some((form) => source.includes(form))) continue
    for (const form of forms) source = source.replaceAll(form, 'prefersReducedMotion()')
    let importPath = path.relative(path.dirname(file), utility).replaceAll('\\', '/').replace(/\.ts$/, '')
    if (!importPath.startsWith('.')) importPath = `./${importPath}`
    source = `import { prefersReducedMotion } from '${importPath}'\n${source}`
    fs.writeFileSync(file, source)
    changed++
  }
}
visit(root)
console.log(`Connected motion preference in ${changed} clean source files.`)
