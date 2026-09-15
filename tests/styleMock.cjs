/**
 * CSS mock for Jest.
 *
 * Plain stylesheets are imported for side effects, but CSS Modules are read as
 * objects (`styles.sidebar`). A Proxy returning the key name keeps those lookups
 * meaningful in tests instead of collapsing every class to `undefined`.
 *
 * `__esModule` + `default` matter: Babel's interop unwraps a default import, so
 * without them `import styles from './X.module.css'` would hand the component a
 * wrapper object and every className would be undefined.
 */
const target = {}

const handler = {
  get(_target, key) {
    if (key === '__esModule') return true
    if (key === 'default') return proxy
    if (typeof key === 'string') return key
    return undefined
  },
  has: () => true,
}

const proxy = new Proxy(target, handler)

module.exports = proxy