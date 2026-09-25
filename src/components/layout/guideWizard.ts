/**
 * The tour narrator: a tiny pixel-art wizard drawn as an SVG grid, plus a
 * word-by-word text reveal. While words appear the wizard "talks" (mouth and
 * staff sparkle animate via CSS on `.is-talking`).
 */
const palette: Record<string, string> = {
  H: 'var(--wizard-hat, #d0643f)', // hat
  h: 'var(--wizard-hat-dark, #9c4225)', // hat shade
  S: '#ffd166', // star on hat
  F: '#f6c9a6', // face
  E: '#2b2230', // eyes
  B: '#f4f1ea', // beard
  b: '#d9d3c6', // beard shade
  R: 'var(--wizard-robe, #5f8f5a)', // robe
  r: 'var(--wizard-robe-dark, #43693f)', // robe shade
  W: '#8b5a2b', // staff
  O: '#7ad7ff', // orb
}

// 16 × 18 sprite. "." is transparent; "M" marks the mouth pixels.
const sprite = [
  '.......HH.......',
  '......HHH.......',
  '.....HHSHH......',
  '....HHHHHhH.....',
  '...HHHHHHHhH....',
  '..hhhhhhhhhhh...',
  '....FFFFFFF.....',
  '....FEFFFEF..O..',
  '....FFFFFFF..W..',
  '....BBMMMBB..W..',
  '...BBBBBBBBB.W..',
  '...bBBBBBBBb.W..',
  '..RRbBBBBBbRRW..',
  '..RRRbBBBbRRRW..',
  '..RRRRRRRRRRrW..',
  '..rRRRRRRRRRrW..',
  '..rRRRRRRRRRr...',
  '...rr.....rr....',
]

export function wizardSvg() {
  const cells: string[] = []
  sprite.forEach((row, y) =>
    [...row].forEach((key, x) => {
      if (key === '.') return
      if (key === 'M') {
        cells.push(
          `<rect class="wz-mouth" x="${x}" y="${y}" width="1" height="1" fill="#7a3b2e"/>`,
        )
        return
      }
      const orb = key === 'O' ? ' class="wz-orb"' : ''
      cells.push(
        `<rect${orb} x="${x}" y="${y}" width="1" height="1" fill="${palette[key]}"/>`,
      )
    }),
  )
  return `<svg class="wz-sprite" viewBox="0 0 16 18" shape-rendering="crispEdges" aria-hidden="true">${cells.join('')}</svg>`
}

/** Splits text into words that fade/rise in one after another. */
export function revealText(target: HTMLElement, reduced: boolean) {
  const text = target.textContent ?? ''
  if (reduced) return 0
  target.textContent = ''
  const words = text.split(/(\s+)/)
  let index = 0
  for (const word of words) {
    if (!word.trim()) {
      target.append(word)
      continue
    }
    const span = document.createElement('span')
    span.className = 'wz-word'
    span.style.setProperty('--w', String(index++))
    span.textContent = word
    target.append(span)
  }
  // Total speaking time, used to stop the talking animation.
  return index * 55 + 300
}
