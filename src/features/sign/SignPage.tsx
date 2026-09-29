import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import seedrandom from 'seedrandom'
import { burst } from '../../components/ui/celebrate'
import { setQuiz } from '../../companion/quizContext'
import { alphabet, classify, letters, score, words, type Pt } from './signModel'
import './sign.css'

/**
 * Sign Alphabet — learn ASL fingerspelling. An SVG hand morphs between letter
 * shapes (GSAP), a quiz works without a camera, and camera practice uses
 * MediaPipe hand tracking on-device: hold a letter for a moment to sign it,
 * with a glowing skeleton overlay and a hold ring that fills.
 */
const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const bones = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]]

const fingerX = [0, 78, 104, 130, 156]

/** A stylised SVG hand whose fingers extend or curl for a letter. */
function Hand({ letter }: { letter: string }) {
  const svg = useRef<SVGSVGElement>(null)
  const pose = letters[letter]
  useLayoutEffect(() => {
    if (!svg.current) return
    const dur = reduced() ? 0 : 0.55
    pose.fingers.forEach((up, i) => {
      if (i === 0) {
        // Extended: thumb swings out; folded: it tucks across the palm.
        gsap.to(svg.current!.querySelector('.hd-thumb'), up ? { rotation: -32, svgOrigin: '72 240', duration: dur, ease: 'back.out(1.8)' } : { rotation: 58, svgOrigin: '72 240', duration: dur, ease: 'back.out(1.8)' })
        return
      }
      const el = svg.current!.querySelector(`.hd-f${i}`)
      const spreadRot = pose.spread && (i === 1 || i === 2) ? (i === 1 ? -9 : 9) : letter === 'W' && i !== 2 ? (i === 1 ? -8 : 8) : 0
      gsap.to(el, { attr: { height: up ? (i === 2 ? 110 : i === 4 ? 78 : 98) : 34, y: up ? 190 - (i === 2 ? 110 : i === 4 ? 78 : 98) : 156 }, rotation: spreadRot, svgOrigin: `${fingerX[i] + 11} 190`, duration: dur, ease: 'back.out(1.6)', delay: i * 0.03 })
    })
    gsap.fromTo(svg.current.querySelector('.hd-letter'), { scale: 0.4, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, duration: dur, ease: 'back.out(2)' })
  }, [letter, pose])
  return (
    <svg ref={svg} className="sg-hand" viewBox="0 0 240 300" role="img" aria-label={`Hand shape for ${letter}: ${pose.tip}`} data-matrix-native>
      <defs>
        <linearGradient id="hd-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd6b8" /><stop offset="1" stopColor="#f0a987" /></linearGradient>
      </defs>
      {[1, 2, 3, 4].map((i) => <rect key={i} className={`hd-f${i}`} x={[0, 78, 104, 130, 156][i]} y={156} width={22} height={34} rx={11} fill="url(#hd-skin)" stroke="#c77a5a" strokeWidth="2" />)}
      <rect x="70" y="170" width="112" height="100" rx="30" fill="url(#hd-skin)" stroke="#c77a5a" strokeWidth="2" />
      <rect className="hd-thumb" x="58" y="178" width="26" height="70" rx="13" fill="url(#hd-skin)" stroke="#c77a5a" strokeWidth="2" />
      <text className="hd-letter" x="126" y="245" textAnchor="middle">{letter}</text>
    </svg>
  )
}

export function SignPage() {
  const [mode, setMode] = useState<'learn' | 'quiz' | 'camera'>('learn')
  const [letter, setLetter] = useState('A')
  const [quizQ, setQuizQ] = useState<{ answer: string; options: string[] } | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  // camera
  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const holdRing = useRef<SVGCircleElement>(null)
  const [camState, setCamState] = useState<'off' | 'loading' | 'on' | 'error'>('off')
  const [seen, setSeen] = useState<string | null>(null)
  const [word, setWord] = useState(words[0])
  const [signed, setSigned] = useState('')
  const stopRef = useRef<() => void>(() => {})

  const newQuiz = useCallback(() => {
    const rng = seedrandom(String(Date.now()))
    const answer = alphabet[Math.floor(rng() * alphabet.length)]
    const others = alphabet.filter((l) => l !== answer).sort(() => rng() - 0.5).slice(0, 3)
    setQuizQ({ answer, options: [answer, ...others].sort(() => rng() - 0.5) })
    setLetter(answer)
    setPicked(null)
  }, [])
  useEffect(() => {
    if (mode === 'quiz') newQuiz()
  }, [mode, newQuiz])
  useEffect(() => {
    if (mode !== 'quiz' || !quizQ) return setQuiz(null)
    setQuiz({ source: 'Sign alphabet', question: 'Which letter is this hand shape?', answer: quizQ.answer, options: quizQ.options, explain: letters[quizQ.answer].tip })
    return () => setQuiz(null)
  }, [mode, quizQ])

  const startCamera = async () => {
    setCamState('loading')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      const v = video.current!
      v.srcObject = stream
      await v.play()
      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
      const files = await FilesetResolver.forVisionTasks(WASM)
      const lmk = await HandLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' }, runningMode: 'VIDEO', numHands: 1 })
      setCamState('on')
      let raf = 0
      let holdLetter: string | null = null
      let holdStart = 0
      const loop = () => {
        const res = lmk.detectForVideo(v, performance.now())
        const lm = (res.landmarks?.[0] ?? []) as Pt[]
        const c = canvas.current
        if (c) {
          const ctx = c.getContext('2d')!
          c.width = v.videoWidth
          c.height = v.videoHeight
          ctx.clearRect(0, 0, c.width, c.height)
          if (lm.length) {
            ctx.strokeStyle = '#58cc02'
            ctx.lineWidth = 4
            ctx.shadowColor = '#58cc02'
            ctx.shadowBlur = 12
            for (const [a, b] of bones) {
              ctx.beginPath()
              ctx.moveTo(lm[a].x * c.width, lm[a].y * c.height)
              ctx.lineTo(lm[b].x * c.width, lm[b].y * c.height)
              ctx.stroke()
            }
            ctx.fillStyle = '#fff'
            for (const p of lm) {
              ctx.beginPath()
              ctx.arc(p.x * c.width, p.y * c.height, 5, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
        const l = classify(lm)
        setSeen(l)
        const now = performance.now()
        if (l && l === holdLetter) {
          const p = Math.min(1, (now - holdStart) / 900)
          holdRing.current?.setAttribute('stroke-dashoffset', String(251 * (1 - p)))
          if (p >= 1) {
            setSigned((s) => s + l)
            holdLetter = null
            holdRing.current?.setAttribute('stroke-dashoffset', '251')
          }
        } else {
          holdLetter = l
          holdStart = now
          holdRing.current?.setAttribute('stroke-dashoffset', '251')
        }
        raf = requestAnimationFrame(loop)
      }
      loop()
      stopRef.current = () => {
        cancelAnimationFrame(raf)
        stream.getTracks().forEach((t) => t.stop())
        lmk.close()
      }
    } catch {
      setCamState('error')
    }
  }
  useEffect(() => () => stopRef.current(), [])
  useEffect(() => {
    if (mode !== 'camera') {
      stopRef.current()
      setCamState('off')
    }
  }, [mode])
  const result = signed.length >= word.length ? score(signed, word) : null
  useEffect(() => {
    if (result && result.dist === 0) burst(undefined, 'stars')
  }, [result?.dist]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="sg-page">
      <header className="sg-head">
        <div>
          <p className="sg-eyebrow">Sign alphabet · ASL fingerspelling</p>
          <h2>{mode === 'learn' ? `The letter ${letter}` : mode === 'quiz' ? 'Which letter?' : `Spell “${word}”`}</h2>
        </div>
        <div className="sg-modes" role="tablist" aria-label="Mode">
          {(['learn', 'quiz', 'camera'] as const).map((m) => <button key={m} type="button" role="tab" aria-selected={mode === m} className={`sg-mode ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)}>{{ learn: '✋ Learn', quiz: '❓ Quiz', camera: '📷 Practice' }[m]}</button>)}
        </div>
      </header>
      <div className="sg-body">
        <section className="sg-stage">
          {mode === 'camera' ? (
            <div className="sg-cam">
              <video ref={video} muted playsInline className="sg-video" />
              <canvas ref={canvas} className="sg-overlay" />
              {camState !== 'on' && (
                <div className="sg-cam-msg">
                  {camState === 'loading' ? 'Starting camera and hand model…' : camState === 'error' ? 'Camera or hand model unavailable. Try the quiz instead.' : 'Hand tracking runs on this device — nothing is recorded or uploaded.'}
                  {camState === 'off' && <button type="button" className="sg-cta" onClick={() => void startCamera()}>Start camera</button>}
                </div>
              )}
              <svg className="sg-hold" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="40" className="sg-hold-track" />
                <circle ref={holdRing} cx="50" cy="50" r="40" className="sg-hold-arc" strokeDasharray="251" strokeDashoffset="251" />
                <text x="50" y="62" textAnchor="middle">{seen ?? '·'}</text>
              </svg>
            </div>
          ) : (
            <Hand letter={letter} />
          )}
        </section>
        <aside className="sg-side">
          {mode === 'learn' && (
            <>
              <p className="sg-tip">{letters[letter].tip}</p>
              <div className="sg-grid">
                {alphabet.map((l) => <button key={l} type="button" className={`sg-letter ${l === letter ? 'on' : ''}`} onClick={() => setLetter(l)}>{l}</button>)}
              </div>
            </>
          )}
          {mode === 'quiz' && quizQ && (
            <>
              <div className="sg-grid">
                {quizQ.options.map((o) => (
                  <button key={o} type="button" disabled={!!picked} className={`sg-letter big ${picked && o === quizQ.answer ? 'right' : ''} ${picked === o && o !== quizQ.answer ? 'wrong' : ''}`} onClick={() => {
                    setPicked(o)
                    if (o === quizQ.answer) { setStreak((s) => s + 1); burst(undefined, 'stars') } else setStreak(0)
                  }}>{o}</button>
                ))}
              </div>
              {picked && <p className="sg-tip">{picked === quizQ.answer ? '✓ ' : '✗ '}{letters[quizQ.answer].tip}</p>}
              <div className="sg-row">
                <span>Streak {streak}</span>
                {picked && <button type="button" className="sg-cta" onClick={newQuiz}>Next</button>}
              </div>
            </>
          )}
          {mode === 'camera' && (
            <>
              <div className="sg-spell" aria-live="polite">
                {[...word].map((ch, i) => <span key={i} className={signed[i] ? (signed[i] === ch ? 'ok' : 'bad') : i === signed.length ? 'cur' : ''}>{signed[i] ?? ch}</span>)}
              </div>
              <p className="sg-tip">Hold each letter until the ring fills. Next: <strong>{word[signed.length] ?? '✓'}</strong> — {letters[word[signed.length]]?.tip ?? 'done!'}</p>
              {result && <p className="sg-tip">{result.dist === 0 ? '🎉 Perfect spelling!' : `${result.right} of ${result.total} letters right.`}</p>}
              <div className="sg-row">
                <button type="button" className="sg-cta ghost" onClick={() => setSigned((s) => s.slice(0, -1))}>⌫ Undo</button>
                <button type="button" className="sg-cta" onClick={() => { setWord(words[Math.floor(Math.random() * words.length)]); setSigned('') }}>New word</button>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
