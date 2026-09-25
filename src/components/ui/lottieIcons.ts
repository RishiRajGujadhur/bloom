/**
 * Tiny Lottie animations generated in code (no downloaded assets), one per
 * icon. Every animation has three segments so hover-in, hover-out and click
 * each feel different:
 *
 *   0 – 24   hover in   : lift, grow and tilt
 *   24 – 48  hover out  : squash and settle back
 *   48 – 90  click      : the stroke redraws and a ring of sparks bursts out
 *
 * Strokes are painted with `currentColor` by CSS, so icons follow the theme.
 */
type Vec = [number, number]
type Kf = { t: number; s: number[] }

const ease = { i: { x: [0.3], y: [1] }, o: { x: [0.6], y: [0] } }
const animated = (frames: Kf[]) => ({
  a: 1,
  k: frames.map((f, i) => (i < frames.length - 1 ? { ...f, ...ease } : f)),
})
const fixed = (value: unknown) => ({ a: 0, k: value })

/** A straight-segment path through the given points. */
const path = (points: Vec[], closed = false) => ({
  ty: 'sh',
  ks: fixed({
    c: closed,
    v: points,
    i: points.map(() => [0, 0]),
    o: points.map(() => [0, 0]),
  }),
})

const stroke = (width = 2) => ({
  ty: 'st',
  c: fixed([0, 0, 0, 1]),
  o: fixed(100),
  w: fixed(width),
  lc: 2,
  lj: 2,
})

const groupTransform = () => ({
  ty: 'tr',
  p: fixed([0, 0]),
  a: fixed([0, 0]),
  s: fixed([100, 100]),
  r: fixed(0),
  o: fixed(100),
})

function iconLayer(shapes: Vec[][], closed: boolean[]) {
  return {
    ddd: 0,
    ind: 1,
    ty: 4,
    nm: 'icon',
    sr: 1,
    ks: {
      o: fixed(100),
      r: animated([
        { t: 0, s: [0] },
        { t: 10, s: [-12] },
        { t: 24, s: [0] },
        { t: 32, s: [6] },
        { t: 48, s: [0] },
      ]),
      p: animated([
        { t: 0, s: [12, 12, 0] },
        { t: 12, s: [12, 10.6, 0] },
        { t: 24, s: [12, 11.4, 0] },
        { t: 36, s: [12, 12.6, 0] },
        { t: 48, s: [12, 12, 0] },
      ]),
      a: fixed([12, 12, 0]),
      s: animated([
        { t: 0, s: [100, 100, 100] },
        { t: 12, s: [122, 122, 100] },
        { t: 24, s: [110, 110, 100] },
        { t: 34, s: [112, 88, 100] },
        { t: 48, s: [100, 100, 100] },
        { t: 56, s: [82, 82, 100] },
        { t: 72, s: [112, 112, 100] },
        { t: 90, s: [100, 100, 100] },
      ]),
    },
    ao: 0,
    shapes: [
      {
        ty: 'gr',
        it: [
          ...shapes.map((points, i) => path(points, closed[i])),
          stroke(),
          {
            ty: 'tm',
            s: fixed(0),
            e: animated([
              { t: 0, s: [100] },
              { t: 48, s: [100] },
              { t: 49, s: [0] },
              { t: 74, s: [100] },
            ]),
            o: fixed(0),
            m: 1,
          },
          groupTransform(),
        ],
      },
    ],
    ip: 0,
    op: 90,
    st: 0,
    bm: 0,
  }
}

/** Eight short sparks that burst outward on click. */
function burstLayer() {
  const sparks = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2
    const inner: Vec = [12 + Math.cos(angle) * 8, 12 + Math.sin(angle) * 8]
    const outer: Vec = [12 + Math.cos(angle) * 11, 12 + Math.sin(angle) * 11]
    return path([inner, outer])
  })
  return {
    ddd: 0,
    ind: 2,
    ty: 4,
    nm: 'burst',
    sr: 1,
    ks: {
      o: animated([
        { t: 0, s: [0] },
        { t: 54, s: [0] },
        { t: 58, s: [100] },
        { t: 84, s: [0] },
      ]),
      r: fixed(0),
      p: fixed([12, 12, 0]),
      a: fixed([12, 12, 0]),
      s: animated([
        { t: 0, s: [60, 60, 100] },
        { t: 54, s: [60, 60, 100] },
        { t: 84, s: [135, 135, 100] },
      ]),
    },
    ao: 0,
    shapes: [{ ty: 'gr', it: [...sparks, stroke(1.6), groupTransform()] }],
    ip: 0,
    op: 90,
    st: 0,
    bm: 0,
  }
}

const shapes: Record<string, { paths: Vec[][]; closed: boolean[] }> = {
  check: { paths: [[[5, 12.5], [10, 17.5], [19.5, 7]]], closed: [false] },
  plus: { paths: [[[12, 5], [12, 19]], [[5, 12], [19, 12]]], closed: [false, false] },
  heart: {
    paths: [
      [
        [12, 19.5], [4.8, 12.6], [4, 9.6], [5.2, 7], [7.8, 5.8], [10.3, 6.4],
        [12, 8.2], [13.7, 6.4], [16.2, 5.8], [18.8, 7], [20, 9.6], [19.2, 12.6],
      ],
    ],
    closed: [true],
  },
  sparkle: {
    paths: [
      [[12, 3.5], [13.8, 10.2], [20.5, 12], [13.8, 13.8], [12, 20.5], [10.2, 13.8], [3.5, 12], [10.2, 10.2]],
    ],
    closed: [true],
  },
  play: { paths: [[[8, 5.5], [18.5, 12], [8, 18.5]]], closed: [true] },
  arrow: { paths: [[[5, 12], [19, 12]], [[13, 6], [19, 12], [13, 18]]], closed: [false, false] },
}

export type LottieIconName = keyof typeof shapes

const cache = new Map<string, object>()
export function lottieIconData(name: LottieIconName) {
  if (!cache.has(name)) {
    const { paths, closed } = shapes[name]
    cache.set(name, {
      v: '5.7.4',
      fr: 60,
      ip: 0,
      op: 90,
      w: 24,
      h: 24,
      nm: name,
      ddd: 0,
      assets: [],
      layers: [iconLayer(paths, closed), burstLayer()],
    })
  }
  return cache.get(name)!
}

export const segments = {
  in: [0, 24] as [number, number],
  out: [24, 48] as [number, number],
  click: [48, 90] as [number, number],
}
