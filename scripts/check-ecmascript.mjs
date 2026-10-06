import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse } from 'acorn'

// Check the emitted JavaScript, where TypeScript/JSX no longer apply. ES2023 is
// a deliberate interoperable subset of the current ECMAScript specification.
async function check(directory) {
  let count = 0
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) count += await check(path)
    else if (entry.name.endsWith('.js')) {
      parse(await readFile(path, 'utf8'), { ecmaVersion: 2023, sourceType: 'module' })
      count += 1
    }
  }
  return count
}
console.log(`Validated ${await check('dist')} emitted JavaScript files against ECMAScript 2023 syntax.`)
