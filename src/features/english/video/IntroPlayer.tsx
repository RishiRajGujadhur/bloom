import { useEffect, useRef } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import { INTRO_FPS, INTRO_FRAMES, INTRO_H, INTRO_W, WordWellIntro } from './WordWellIntro'

/** Plays the Word Well intro (Remotion) and calls onEnd when it finishes or is skipped. */
export function IntroPlayer({ onEnd }: { onEnd: () => void }) {
  const player = useRef<PlayerRef>(null)
  const done = useRef(onEnd)
  done.current = onEnd
  useEffect(() => {
    const p = player.current
    if (!p) return
    const ended = () => done.current()
    p.addEventListener('ended', ended)
    p.play()
    return () => p.removeEventListener('ended', ended)
  }, [])
  return (
    <div className="st-video">
      <Player
        ref={player}
        component={WordWellIntro}
        durationInFrames={INTRO_FRAMES}
        fps={INTRO_FPS}
        compositionWidth={INTRO_W}
        compositionHeight={INTRO_H}
        style={{ width: '100%', aspectRatio: `${INTRO_W} / ${INTRO_H}`, borderRadius: 20, overflow: 'hidden' }}
        controls
        autoPlay
        clickToPlay
        acknowledgeRemotionLicense
      />
      <button type="button" className="st-skip st-video-skip" onClick={onEnd}>Skip intro ›</button>
    </div>
  )
}
