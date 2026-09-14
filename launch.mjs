import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const folder = dirname(fileURLToPath(import.meta.url))
const url = 'http://127.0.0.1:5173/'
async function status() {
  try { const response = await fetch(url, { signal: AbortSignal.timeout(1500) }); return response.headers.get('X-Bloom-App') === '1' ? 'ready' : 'occupied' }
  catch { return 'stopped' }
}
let current = await status()
if (current === 'occupied') throw new Error('Port 5173 is used by another server. Close that server and start Bloom again.')
if (current !== 'ready') {
  if (!existsSync(join(folder, 'dist', 'index.html'))) throw new Error('Build Bloom first: run npm.cmd install and npm.cmd run build in this folder.')
  const child = spawn(process.execPath, [join(folder, 'server.mjs')], { cwd: folder, detached: true, stdio: 'ignore', windowsHide: true })
  child.on('error', error => { console.error(error.message); process.exitCode = 1 })
  child.unref()
  for (let attempt = 0; attempt < 20 && current !== 'ready'; attempt++) {
    await new Promise(done => setTimeout(done, 250))
    current = await status()
  }
  if (current !== 'ready') throw new Error('Bloom could not start. Run node server.mjs in this folder to see the error.')
}
spawn('cmd.exe', ['/c', 'start', '', url], { windowsHide: true, stdio: 'ignore' }).on('error', error => console.error(error.message))
console.log(`Bloom is ready: ${url}`)
