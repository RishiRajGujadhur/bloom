import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'

const violations = []
let pickers = 0
let checkboxes = 0
function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      inspect(path)
      continue
    }
    if (!path.endsWith('.tsx')) continue
    const source = ts.createSourceFile(
      path,
      readFileSync(path, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )
    function visit(node) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(source)
        if (tag === 'DropdownSelect') pickers++
        if (tag === 'Checkbox') checkboxes++
        const nativeCheckbox =
          tag === 'input' &&
          node.attributes.properties.some(
            (attribute) =>
              ts.isJsxAttribute(attribute) &&
              attribute.name.getText(source) === 'type' &&
              attribute.initializer &&
              ts.isStringLiteral(attribute.initializer) &&
              attribute.initializer.text === 'checkbox',
          )
        const formBridge =
          relative('src', path).replaceAll('\\', '/') ===
          'components/ui/DropdownSelect.tsx'
        if ((tag === 'select' && !formBridge) || nativeCheckbox) {
          const line =
            source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
          violations.push(`${path}:${line}: use the shared Radix control`)
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
}
inspect('src')
if (violations.length) {
  console.error(violations.join('\n'))
  process.exitCode = 1
} else {
  console.log(
    `Shared Radix controls verified: ${pickers} dropdowns, ${checkboxes} checkboxes.`,
  )
}
