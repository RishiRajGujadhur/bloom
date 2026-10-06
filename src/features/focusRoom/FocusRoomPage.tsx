import { Checkbox } from '../../components/ui/Checkbox'
import { subOn } from '../subFeatures'
import { useEffect, useState } from 'react'
import { Music, Pause, Play, Sparkles } from 'lucide-react'
import type { FeaturePageProps } from '../shared/pageProps'
import { pauseFocusQuest, resumeFocusQuest, startFocusQuest } from '../../rpg/engine'
import { useOptionalAudioMixer } from '../../contexts/AudioMixerContext'
import { AvatarPreview } from '../rewards/ShopPage'
import { useShop } from '../rewards/shop'
import { LottieIcon } from '../../components/ui/LottieIcon'
import { useTabTitle } from '../../utils/useTabTitle'
import './focusRoom.css'

const soundtracks = [
  { id: 'classical', label: 'Classical study' },
  { id: 'cinematic', label: 'Cinematic score' },
  { id: 'focus', label: 'Deep work' },
] as const
const lengths = [15, 25, 50, 90] as const

/**
 * A cosy pixel study for deep work. The timer is the same focus session as
 * the Focus page (so it plants garden trees and counts toward goals); this
 * room adds the atmosphere: your avatar at the desk and a classical score.
 */
export function FocusRoomPage({ data, setData }: FeaturePageProps) {
  const quest = data.rpg.focusQuest
  const running = quest.startedAt !== null && !quest.completedAt && !quest.failedAt
  const paused = quest.pausedAt !== null
  const audio = useOptionalAudioMixer()
  const mixer = subOn('focusRoom', 'soundtrack') ? audio : null
  const { shop } = useShop()
  const [now, setNow] = useState(() => Date.now())
  const [previewing, setPreviewing] = useState(false)
  const [quietScene, setQuietSceneState] = useState(() => {
    try { return localStorage.getItem('bloom-room-quiet') === 'true' } catch { return false }
  })
  const setQuietScene = (enabled: boolean) => {
    setQuietSceneState(enabled)
    try { localStorage.setItem('bloom-room-quiet', String(enabled)) } catch { /* optional */ }
  }
  const [track, setTrackState] = useState<(typeof soundtracks)[number]['id']>(() => {
    try {
      const saved = localStorage.getItem('bloom-room-track')
      return soundtracks.find((s) => s.id === saved)?.id ?? 'classical'
    } catch {
      return 'classical'
    }
  })
  const setTrack = (id: (typeof soundtracks)[number]['id']) => {
    setTrackState(id)
    try { localStorage.setItem('bloom-room-track', id) } catch { /* optional */ }
  }
  useEffect(() => {
    if (!running || paused) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [running, paused])
  const total = quest.durationMinutes * 60000
  const elapsedAt = paused ? quest.pausedAt! : now
  const left = running ? Math.max(0, total - (elapsedAt - quest.startedAt!)) : total
  const progress = running ? 1 - left / total : 0
  const recentlyCompleted = Boolean(quest.completedAt && now - quest.completedAt < 15 * 60_000)
  useTabTitle(running ? `${paused ? '⏸' : '⏱'} ${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}` : '', 'Focus room', 'focus-room')
  const hour = new Date().getHours()
  const night = subOn('focusRoom', 'nightSky') && (hour < 7 || hour >= 19)

  const start = () => {
    setPreviewing(false)
    setData((d) => startFocusQuest(d, d.rpg.focusQuest.soundscape))
    if (mixer) {
      mixer.applyPreset(track)
      if (!mixer.isPlaying) mixer.toggleMasterPlay()
    }
  }

  return (
    <section className="room-page bloom-stack" aria-label="Focus room">
      <div className={`room-scene${night ? ' is-night' : ''}${running ? ' is-working' : ''}${quietScene ? ' is-quiet' : ''}`}>
        <div className="room-window" aria-hidden="true">
          <span className="room-sky" />
          <span className="room-moon" />
        </div>
        <div className="room-shelf" aria-hidden="true">
          {['#d0643f', '#5f8f5a', '#3d6fb6', '#e3a857', '#855abe', '#cb5476'].map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
        </div>
        <div className="room-clock" role="timer" aria-live="off">
          {String(Math.floor(left / 60000)).padStart(2, '0')}:
          {String(Math.floor(left / 1000) % 60).padStart(2, '0')}
        </div>
        {running && (
          <span className="sr-only" role="status" aria-live="polite">
            {Math.ceil(left / 60000)} {Math.ceil(left / 60000) === 1 ? 'minute' : 'minutes'} remaining in your focus session{paused ? ', currently paused.' : '.'}
          </span>
        )}
        <div className="room-desk" aria-hidden="true">
          <span className="room-lamp" />
          <span className="room-laptop" />
          <span className="room-mug" />
        </div>
        <div className="room-avatar" aria-hidden="true" hidden={!subOn('focusRoom', 'avatar')}>
          <AvatarPreview equipped={shop.equipped} size={132} />
        </div>
        {running && (
          <div className="room-notes" aria-hidden="true">
            <i>♪</i>
            <i>♫</i>
            <i>♪</i>
          </div>
        )}
        <div className="room-progress" aria-hidden="true">
          <i style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      {recentlyCompleted && !quest.failedAt && (
        <p className="room-complete" role="status">
          <Sparkles size={17} aria-hidden="true" />
          Focus session complete. Take a breath before your next one.
        </p>
      )}
      <div className="room-controls">
        <label className="room-quiet-toggle">
          <Checkbox  checked={quietScene} onCheckedChange={(checked) => setQuietScene(checked)} />
          Quiet scene
        </label>
        <div className="wb-chips" role="radiogroup" aria-label="Session length">
          {lengths.map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={quest.durationMinutes === m}
              disabled={running}
              onClick={() =>
                setData((d) => ({
                  ...d,
                  rpg: { ...d.rpg, focusQuest: { ...d.rpg.focusQuest, durationMinutes: m } },
                }))
              }
            >
              {m} min
            </button>
          ))}
        </div>
        {mixer && (
          <>
            <div className="wb-chips" role="radiogroup" aria-label="Soundtrack">
              {soundtracks.map((s) => (
                <button
                  key={s.id}
                  role="radio"
                  aria-checked={track === s.id}
                  onClick={() => {
                    setTrack(s.id)
                    if (mixer.isPlaying) mixer.applyPreset(s.id)
                  }}
                >
                  <Music size={14} aria-hidden="true" /> {s.label}
                </button>
              ))}
            </div>
            {!running && (
              <button
                type="button"
                className="ov-secondary room-preview"
                aria-pressed={previewing}
                onClick={() => {
                  if (previewing) mixer.toggleMasterPlay()
                  else {
                    mixer.applyPreset(track)
                    if (!mixer.isPlaying) mixer.toggleMasterPlay()
                  }
                  setPreviewing((value) => !value)
                }}
              >
                {previewing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                {previewing ? 'Stop preview' : `Preview ${soundtracks.find((soundtrack) => soundtrack.id === track)?.label ?? 'soundtrack'}`}
              </button>
            )}
            <span className="sr-only" role="status" aria-live="polite">
              {previewing && !running ? `Previewing ${soundtracks.find((soundtrack) => soundtrack.id === track)?.label ?? 'soundtrack'}.` : ''}
            </span>
          </>
        )}
        <div className="room-buttons bloom-inline">
          {running ? (
            <p className="wb-muted">{paused ? 'Session paused. Your remaining time is saved.' : 'Deep work in progress. The session ends by itself.'}</p>
          ) : (
            <button className="ov-primary" onClick={start}>
              <LottieIcon name="play" size={18} /> Enter flow
            </button>
          )}
          {running && (
            <button
              type="button"
              className="ov-secondary"
              onClick={() => setData((current) => paused ? resumeFocusQuest(current) : pauseFocusQuest(current))}
            >
              {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
              {paused ? 'Resume session' : 'Pause session'}
            </button>
          )}
          {mixer && (
            <button
              className="ov-secondary"
              onClick={() => {
                if (!mixer.activePreset) mixer.applyPreset(track)
                mixer.toggleMasterPlay()
              }}
            >
              {mixer.isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {mixer.isPlaying ? 'Pause music' : 'Play music'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
