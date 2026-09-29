/**
 * Finds the sheet of paper in a photo and flattens it (OpenCV compiled to
 * WebAssembly): grey → blur → Canny edges → the largest four-cornered contour
 * → perspective warp to an upright A4-shaped page. Returns the flattened
 * page plus the corners found, so the UI can animate them.
 */
type Pt = { x: number; y: number }
type CV = any // eslint-disable-line @typescript-eslint/no-explicit-any

let cvP: Promise<CV> | null = null
function getCv(): Promise<CV> {
  cvP ??= import('@techstark/opencv-js').then(async (m) => {
    const mod = (m as { default: CV }).default
    if (mod instanceof Promise) return await mod
    if (mod.Mat) return mod
    await new Promise<void>((res) => { mod.onRuntimeInitialized = () => res() })
    return mod
  })
  return cvP
}

const order = (p: Pt[]) => {
  // top-left has the smallest x+y, bottom-right the largest; top-right the smallest y-x.
  const s = [...p].sort((a, b) => a.x + a.y - (b.x + b.y))
  const d = [...p].sort((a, b) => a.y - a.x - (b.y - b.x))
  return [s[0], d[0], s[3], d[3]]
}

export async function flatten(image: Blob): Promise<{ page: Blob; corners: Pt[] | null; width: number; height: number }> {
  const cv = await getCv()
  const bmp = await createImageBitmap(image)
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  const src = cv.imread(canvas)
  const grey = new cv.Mat()
  const edges = new cv.Mat()
  const contours = new cv.MatVector()
  const hier = new cv.Mat()
  let corners: Pt[] | null = null
  try {
    cv.cvtColor(src, grey, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(grey, grey, new cv.Size(5, 5), 0)
    cv.Canny(grey, edges, 50, 150)
    cv.dilate(edges, edges, cv.Mat.ones(3, 3, cv.CV_8U))
    cv.findContours(edges, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    let best = 0
    for (let i = 0; i < contours.size(); i++) {
      const c = contours.get(i)
      const area = cv.contourArea(c)
      if (area > best && area > canvas.width * canvas.height * 0.2) {
        const approx = new cv.Mat()
        cv.approxPolyDP(c, approx, 0.02 * cv.arcLength(c, true), true)
        if (approx.rows === 4) {
          best = area
          corners = Array.from({ length: 4 }, (_, k) => ({ x: approx.data32S[k * 2], y: approx.data32S[k * 2 + 1] }))
        }
        approx.delete()
      }
      c.delete()
    }
    if (!corners) return { page: image, corners: null, width: canvas.width, height: canvas.height }
    const [tl, tr, br, bl] = order(corners)
    const w = Math.round(Math.max(Math.hypot(tr.x - tl.x, tr.y - tl.y), Math.hypot(br.x - bl.x, br.y - bl.y)))
    const h = Math.round(Math.max(Math.hypot(bl.x - tl.x, bl.y - tl.y), Math.hypot(br.x - tr.x, br.y - tr.y)))
    const from = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y])
    const to = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, w, 0, w, h, 0, h])
    const M = cv.getPerspectiveTransform(from, to)
    const out = new cv.Mat()
    cv.warpPerspective(src, out, M, new cv.Size(w, h), cv.INTER_LINEAR, cv.BORDER_REPLICATE)
    const oc = document.createElement('canvas')
    cv.imshow(oc, out)
    ;[from, to, M, out].forEach((m) => m.delete())
    const page = await new Promise<Blob>((res) => oc.toBlob((b) => res(b!), 'image/png'))
    return { page, corners: [tl, tr, br, bl], width: canvas.width, height: canvas.height }
  } finally {
    ;[src, grey, edges, contours, hier].forEach((m) => m.delete())
  }
}

/** A searchable PDF: the page image with an invisible OCR text layer on top (pdf-lib). */
export async function searchablePdf(page: Blob, lines: { text: string; bbox?: { x0: number; y0: number; x1: number; y1: number } }[], title: string) {
  const { PDFDocument, StandardFonts } = await import('pdf-lib')
  const doc = await PDFDocument.create()
  doc.setTitle(title)
  doc.setProducer('Bloom Bills Inbox')
  const img = await doc.embedPng(new Uint8Array(await page.arrayBuffer()))
  const p = doc.addPage([img.width, img.height])
  p.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (const l of lines) {
    if (!l.bbox) continue
    const size = Math.max(4, (l.bbox.y1 - l.bbox.y0) * 0.8)
    const safe = l.text.replace(/[^\x20-\x7E]/g, ' ')
    p.drawText(safe, { x: l.bbox.x0, y: img.height - l.bbox.y1, size, font, opacity: 0 })
  }
  return new Blob([(await doc.save()) as Uint8Array<ArrayBuffer>], { type: 'application/pdf' })
}

/** A demo letter photographed at an angle on a desk, drawn on a canvas. */
export async function sampleBillPhoto(kind: 0 | 1): Promise<File> {
  const letters = [
    ['BRIGHTWATT ENERGY', 'Account number: BW-4471902', 'Statement date 22 September 2026', '', 'Your electricity bill', 'Usage 1 Aug - 31 Aug: 312 kWh', '', 'Amount due £84.37', 'Please pay by 14 October 2026', '', 'Pay online or by direct debit.'],
    ['Harbour Motor Insurance', 'Policy number HMI-88213', '', 'Dear customer,', 'Your policy renews on 3 November 2026', 'Your new annual premium is £612.40', 'Vehicle: Ford Fiesta', '', 'No action is needed to renew.', 'Call us to make changes.'],
  ][kind]
  const W = 1400, H = 1000
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  const desk = g.createLinearGradient(0, 0, W, H)
  desk.addColorStop(0, '#3b2f28')
  desk.addColorStop(1, '#1f1814')
  g.fillStyle = desk
  g.fillRect(0, 0, W, H)
  g.save()
  g.translate(W / 2, H / 2)
  g.rotate(kind ? -0.13 : 0.09)
  g.transform(1, 0.03, kind ? -0.05 : 0.04, 1, 0, 0)
  g.shadowColor = '#0008'
  g.shadowBlur = 30
  g.fillStyle = '#fbfaf6'
  g.fillRect(-320, -390, 640, 780)
  g.shadowBlur = 0
  g.fillStyle = '#161616'
  letters.forEach((row, i) => {
    g.font = i === 0 ? 'bold 34px Arial' : '25px Arial'
    g.fillText(row, -270, -320 + i * 50)
  })
  g.restore()
  const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/jpeg', 0.92))
  return new File([blob], kind ? 'insurance-letter.jpg' : 'energy-bill.jpg', { type: 'image/jpeg' })
}
