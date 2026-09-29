import type { Scheduler } from 'tesseract.js'
import { threads } from '../../platform/caps'
import type { OcrLine } from './receiptModel'

/**
 * On-device OCR for Receipt Lens: a tesseract.js scheduler with one worker
 * per core (up to 4). Each worker loads the Tesseract WebAssembly core — the
 * SIMD build where the CPU has it — so several receipts are read at once.
 */
export type LaneEvent = { lane: number; job: string; progress: number }
let sched: Promise<{ s: Scheduler; lanes: number }> | null = null
const listeners = new Set<(e: LaneEvent) => void>()
export const onLane = (f: (e: LaneEvent) => void) => { listeners.add(f); return () => { listeners.delete(f) } }
export const laneCount = () => Math.max(2, Math.min(4, threads()))

export function getScheduler() {
  sched ??= (async () => {
    const { createScheduler, createWorker } = await import('tesseract.js')
    const s = createScheduler()
    const n = laneCount()
    await Promise.all(Array.from({ length: n }, async (_, lane) => {
      const w = await createWorker('eng', 1, {
        logger: (m) => { if (m.status === 'recognizing text') listeners.forEach((f) => f({ lane, job: m.userJobId || m.jobId, progress: m.progress })) },
      })
      s.addWorker(w)
    }))
    return { s, lanes: n }
  })()
  return sched
}

/** PDFs: render the first page to an image (pdf.js); images pass straight through. */
export async function toImage(file: Blob): Promise<Blob> {
  if (file.type !== 'application/pdf') return file
  const pdfjs = await import('pdfjs-dist')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const page = await doc.getPage(1)
  const vp = page.getViewport({ scale: 2 })
  const canvas = document.createElement('canvas')
  canvas.width = vp.width
  canvas.height = vp.height
  await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport: vp }).promise
  return new Promise((res) => canvas.toBlob((b) => res(b!), 'image/png'))
}

export async function ocr(image: Blob, jobId: string): Promise<{ lines: OcrLine[]; width: number; height: number }> {
  const { s } = await getScheduler()
  const r = await s.addJob('recognize', image, {}, { blocks: true, text: true }, jobId)
  const lines: OcrLine[] = (r.data.blocks ?? []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines.map((l) => ({ text: l.text.trim(), bbox: l.bbox })))).filter((l) => l.text)
  const bmp = await createImageBitmap(image)
  const size = { width: bmp.width, height: bmp.height }
  bmp.close()
  return { lines, ...size }
}

/** Sample receipts drawn on a canvas (thermal-paper style) so the feature can be tried without a camera. */
export async function sampleReceipts(): Promise<File[]> {
  const today = new Date()
  const d = (n: number) => { const x = new Date(today); x.setDate(x.getDate() - n); return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}` }
  const receipts: [string, string[]][] = [
    ['greenleaf.png', ['GREENLEAF MARKET', '12 High Street, Bristol', `${d(1)} 18:42`, '', 'Oat milk 1L            1.85', 'Sourdough loaf         3.20', 'Bananas 1.2kg          1.14', 'Free range eggs x12    3.95', 'Spinach 250g           1.60', '', 'SUBTOTAL              11.74', 'TOTAL                 11.74', 'CARD                  11.74', '', 'Thank you for shopping!']],
    ['noodle.png', ['NOODLE HOUSE', 'Wharf Road, London', `${d(2)} 20:15`, '', 'Ramen tonkotsu        12.50', 'Gyoza x6               6.00', 'Iced green tea         3.20', '', 'SUBTOTAL              21.70', 'Service 12.5%          2.71', 'TOTAL                 24.41', '', 'VISA ****4421']],
    ['pharmacy.png', ['CITY PHARMACY', 'Station Parade', `${d(4)} 09:05`, '', 'Vitamin D 1000IU       4.99', 'Ibuprofen 200mg        2.35', 'Hand cream             3.50', '', 'TOTAL                 10.84', 'CASH                  20.00', 'CHANGE                 9.16']],
  ]
  return Promise.all(receipts.map(async ([name, rows], k) => {
    const W = 520
    const H = 90 + rows.length * 38
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const g = c.getContext('2d')!
    g.fillStyle = '#fbfaf5'
    g.fillRect(0, 0, W, H)
    // Faint thermal-paper grain.
    for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`; g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5) }
    g.fillStyle = '#1b1b1b'
    rows.forEach((row, i) => {
      g.font = i === 0 ? 'bold 30px "Courier New", monospace' : '22px "Courier New", monospace'
      g.textAlign = i < 3 ? 'center' : 'left'
      g.fillText(row, i < 3 ? W / 2 : 28, 60 + i * 38 + (k === 1 ? i * 0.4 : 0))
    })
    const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/png'))
    return new File([blob], name, { type: 'image/png' })
  }))
}
