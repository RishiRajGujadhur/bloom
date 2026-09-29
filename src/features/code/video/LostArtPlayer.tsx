import { useEffect, useRef } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import { LOST_ART_FINALE_FRAMES, LOST_ART_INTRO_FRAMES, LostArtFinale, LostArtIntro } from './LostArtVideo'

export function LostArtPlayer({ finale = false, onEnd }: { finale?: boolean; onEnd: () => void }) {
  const player = useRef<PlayerRef>(null)
  const done = useRef(onEnd)
  done.current = onEnd
  useEffect(() => {
    const current = player.current
    if (!current) return
    const ended = () => done.current()
    current.addEventListener('ended', ended)
    current.play()
    return () => current.removeEventListener('ended', ended)
  }, [])
  return <div className="cq-story-video">
    <Player
      ref={player}
      component={finale ? LostArtFinale : LostArtIntro}
      durationInFrames={finale ? LOST_ART_FINALE_FRAMES : LOST_ART_INTRO_FRAMES}
      fps={30}
      compositionWidth={1280}
      compositionHeight={720}
      style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 18, overflow: 'hidden' }}
      controls
      autoPlay
      clickToPlay
      acknowledgeRemotionLicense
    />
    <button type="button" className="cq-story-skip" onClick={onEnd}>Skip {finale ? 'finale' : 'intro'} ›</button>
  </div>
}
