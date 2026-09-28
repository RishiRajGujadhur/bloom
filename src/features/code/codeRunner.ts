import { parse } from 'acorn'
import { full } from 'acorn-walk'
import type { Check } from './codeCourse'

/**
 * Runs learner code in a throw-away Web Worker (so infinite loops can be
 * stopped and the page never freezes), captures console output, evaluates
 * check "probes" after the code, and inspects the syntax tree with acorn.
 */
export type CheckResult = { label: string; pass: boolean; got?: string }
export type RunResult = { logs: string[]; error?: string; syntax?: { message: string; line: number }; checks: CheckResult[]; ms: number }

const WORKER = `
const fmt = (v) => { try { return typeof v === 'string' ? v : JSON.stringify(v) ?? String(v) } catch { return String(v) } };
self.onmessage = (e) => {
  const { code, probes } = e.data;
  const logs = [];
  const out = (...a) => logs.push(a.map(fmt).join(' '));
  const cons = { log: out, info: out, warn: out, error: out, table: out };
  try {
    const body = 'const console = __console;\\n' + code + '\\n;return [' + probes.map((p) => '(() => { try { return JSON.stringify(' + p + ') } catch (err) { return "__err:" + err.message } })()').join(',') + ']';
    const fn = new Function('__console', '__code', '__logs', body);
    const results = fn(cons, code, logs);
    self.postMessage({ logs, results });
  } catch (err) {
    self.postMessage({ logs, error: (err && err.name ? err.name + ': ' : '') + (err && err.message ? err.message : String(err)) });
  }
};`
let workerUrl: string | null = null

/** Friendly syntax check (acorn) — returns null when the code parses. */
export function syntaxError(code: string) {
  try {
    parse(code, { ecmaVersion: 'latest', sourceType: 'script' })
    return null
  } catch (e) {
    const err = e as { message: string; loc?: { line: number } }
    return { message: err.message.replace(/\s*\(\d+:\d+\)$/, ''), line: err.loc?.line ?? 1 }
  }
}

/** Node types used by the code (for "use a for loop"-style checks). */
export function nodeTypes(code: string) {
  const types = new Set<string>()
  try {
    full(parse(code, { ecmaVersion: 'latest', sourceType: 'script' }), (n) => types.add(n.type))
  } catch {
    /* syntax error — reported separately */
  }
  return types
}

export async function runCode(code: string, checks: Check[] = [], timeout = 2000): Promise<RunResult> {
  const t0 = performance.now()
  const syntax = syntaxError(code)
  if (syntax) return { logs: [], syntax, checks: checks.map((c) => ({ label: c.label, pass: false })), ms: 0 }
  const probes = checks.map((c) => c.probe ?? 'null')
  workerUrl ??= URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' }))
  const worker = new Worker(workerUrl)
  const res = await new Promise<{ logs: string[]; results?: string[]; error?: string }>((resolve) => {
    const timer = window.setTimeout(() => {
      worker.terminate()
      resolve({ logs: [], error: `Stopped after ${timeout / 1000}s — is there an infinite loop?` })
    }, timeout)
    worker.onmessage = (e) => {
      window.clearTimeout(timer)
      worker.terminate()
      resolve(e.data)
    }
    worker.postMessage({ code, probes })
  })
  const types = nodeTypes(code)
  const results = checks.map((c, i) => {
    let pass = true
    let got: string | undefined
    if (c.logs !== undefined) pass &&= res.logs.some((l) => l.includes(c.logs!))
    if (c.probe) {
      got = res.results?.[i]
      pass &&= !!got && !got.startsWith('__err') && got === JSON.stringify(c.equals)
    }
    if (c.uses) pass &&= types.has(c.uses) || (c.uses === 'VariableDeclaration' && /\bconst\b/.test(code))
    if (res.error) pass = false
    return { label: c.label, pass, got }
  })
  return { logs: res.logs, error: res.error, checks: results, ms: Math.round(performance.now() - t0) }
}
