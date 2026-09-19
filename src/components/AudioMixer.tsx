import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Headphones, Pause, Play, Volume2, VolumeX, X } from 'lucide-react'
import { useAudioMixer } from '../contexts/AudioMixerContext'
import { audioTracks, mixerPresets } from '../types/audio'
import styles from './AudioMixer.module.css'

export function AudioMixer() {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (open) closeButton.current?.focus()
  }, [open])
  const mixer = useAudioMixer()
  const close = () => {
    setOpen(false)
    trigger.current?.focus()
  }
  return (
    <aside className={styles.dock} aria-label="Ambient audio">
      {open && (
        <section
          id="ambient-mixer"
          className={styles.panel}
          aria-label="Sound mixer"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation()
              close()
            }
          }}
        >
          <header className={styles.header}>
            <div>
              <span className={styles.eyebrow}>A little atmosphere</span>
              <h2>Your soundscape</h2>
            </div>
            <button
              type="button"
              onClick={close}
              ref={closeButton}
              aria-label="Close sound mixer"
            >
              <X size={18} />
            </button>
          </header>
          <p className={styles.note}>
            Original synthesized demo loops. Layer a few sounds, then settle in.
          </p>
          <button
            className={styles.master}
            type="button"
            onClick={mixer.toggleMasterPlay}
            aria-pressed={mixer.isPlaying}
          >
            {mixer.isPlaying ? <Pause size={20} /> : <Play size={20} />}{' '}
            {mixer.isPlaying ? 'Pause soundscape' : 'Play soundscape'}
          </button>
          <div className={styles.presets} aria-label="Sound presets">
            {mixerPresets.map((preset) => (
              <button
                type="button"
                key={preset.id}
                aria-pressed={mixer.activePreset === preset.id}
                onClick={() => mixer.applyPreset(preset.id)}
              >
                {preset.name}
              </button>
            ))}
          </div>
          <div className={styles.tracks}>
            {audioTracks.map((track) => (
              <div
                className={styles.track}
                key={track.id}
                style={{ '--stem-color': track.color } as CSSProperties}
              >
                <div className={styles.trackHeading}>
                  <label htmlFor={`stem-${track.id}`}>
                    {track.name}
                    <small>{track.category}</small>
                  </label>
                  <button
                    type="button"
                    onClick={() => mixer.toggleMute(track.id)}
                    aria-label={`${mixer.muted[track.id] ? 'Unmute' : 'Mute'} ${track.name}`}
                    aria-pressed={Boolean(mixer.muted[track.id])}
                  >
                    {mixer.muted[track.id] ? (
                      <VolumeX size={17} />
                    ) : (
                      <Volume2 size={17} />
                    )}
                  </button>
                </div>
                <div className={styles.sliderRow}>
                  <input
                    id={`stem-${track.id}`}
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={mixer.volumes[track.id]}
                    aria-valuetext={`${Math.round(mixer.volumes[track.id] * 100)} percent${mixer.muted[track.id] ? ', muted' : ''}`}
                    onChange={(event) =>
                      mixer.setTrackVolume(track.id, Number(event.target.value))
                    }
                  />
                  <output htmlFor={`stem-${track.id}`}>
                    {Math.round(mixer.volumes[track.id] * 100)}%
                  </output>
                </div>
                {mixer.errors[track.id] && (
                  <p className={styles.error} role="status">
                    {mixer.errors[track.id]}{' '}
                    <button
                      type="button"
                      onClick={() => mixer.retryTrack(track.id)}
                    >
                      Retry {track.name}
                    </button>
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className={styles.note} role="status">
            {mixer.loaded < audioTracks.length
              ? `${mixer.loaded}/${audioTracks.length} sounds ready`
              : mixer.isPlaying
                ? 'Sound continues while you write or browse.'
                : 'Ready when you are. Presets won’t start playback.'}
          </p>
        </section>
      )}
      <button
        className={styles.launcher}
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="ambient-mixer"
        onClick={() => setOpen((value) => !value)}
      >
        <Headphones size={19} />
        <span>{mixer.isPlaying ? 'Soundscape on' : 'Soundscape'}</span>
        {mixer.isPlaying && (
          <span className={styles.pulse} aria-hidden="true" />
        )}
      </button>
    </aside>
  )
}
