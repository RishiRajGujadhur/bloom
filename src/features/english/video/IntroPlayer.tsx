import { useEffect, useRef } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import type { ComponentType } from 'react'
import { INTRO_FPS, INTRO_FRAMES, INTRO_H, INTRO_W, WordWellIntro } from './WordWellIntro'
import { CODE_FINALE_FRAMES, CODE_INTRO_FRAMES, CodeCupFinale, CodeCupIntro } from '../../code/video/CodeCupVideos'

/** Every story video (Remotion compositions, 30 fps, 1280×720). */
const videos: Record<string, { component: ComponentType; frames: number; label: string }> = {
  wordWell: { component: WordWellIntro, frames: INTRO_FRAMES, label: 'Skip intro' },
  codeCupIntro: { component: CodeCupIntro, frames: CODE_INTRO_FRAMES, label: 'Skip intro' },
  codeCupFinale: { component: CodeCupFinale, frames: CODE_FINALE_FRAMES, label: 'Skip' },
}
export type StoryVideo = keyof typeof videos

/** Plays a story video (Remotion) and calls onEnd when it finishes or is skipped. */
export function IntroPlayer({ onEnd, video = 'wordWell' }: { onEnd: () => void; video?: string }) {
  const v = videos[video] ?? videos.wordWell
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
        component={v.component}
        durationInFrames={v.frames}
        fps={INTRO_FPS}
        compositionWidth={INTRO_W}
        compositionHeight={INTRO_H}
        style={{ width: '100%', aspectRatio: `${INTRO_W} / ${INTRO_H}`, borderRadius: 20, overflow: 'hidden' }}
        controls
        autoPlay
        clickToPlay
        acknowledgeRemotionLicense
      />
      <button type="button" className="st-skip st-video-skip" onClick={onEnd}>{v.label} ›</button>
    </div>
  )
}
