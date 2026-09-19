import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Howl } from 'howler'
import { audioTracks, mixerPresets } from '../types/audio'

interface MixerState {
  isPlaying: boolean
  volumes: Record<string, number>
  muted: Record<string, boolean>
  errors: Record<string, string>
  loaded: number
  activePreset: string | null
  toggleMasterPlay: () => void
  setTrackVolume: (id: string, volume: number) => void
  toggleMute: (id: string) => void
  applyPreset: (id: string) => void
  retryTrack: (id: string) => void
}
const AudioMixerContext = createContext<MixerState | null>(null)
const initialVolumes = () =>
  Object.fromEntries(
    audioTracks.map((track) => [
      track.id,
      mixerPresets[0].volumes[track.id] ?? 0,
    ]),
  )

export function AudioMixerProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setPlaying] = useState(false)
  const [volumes, setVolumes] = useState(initialVolumes)
  const [muted, setMuted] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(0)
  const [activePreset, setActivePreset] = useState<string | null>('focus')
  const sounds = useRef(new Map<string, Howl>())
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const desired = useRef({
    playing: false,
    volumes: initialVolumes(),
    muted: {} as Record<string, boolean>,
  })

  // Read the current target from refs so load/unlock events never replay stale state.
  const syncTrack = useCallback((id: string, duration: number) => {
    const sound = sounds.current.get(id)
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    if (!sound || sound.state() !== 'loaded') return
    const target =
      desired.current.playing && !desired.current.muted[id]
        ? desired.current.volumes[id]
        : 0
    const current = sound.volume()
    // volume() cancels a prior fade before starting its replacement.
    sound.volume(current)
    if (target > 0 && !sound.playing()) {
      sound.volume(0)
      sound.play()
    }
    sound.fade(sound.volume(), target, duration)
    if (!target)
      timers.current.set(
        id,
        setTimeout(() => {
          sound.pause()
          timers.current.delete(id)
        }, duration),
      )
  }, [])

  useEffect(() => {
    let alive = true
    const ready = new Set<string>()
    setLoaded(0)
    for (const track of audioTracks) {
      const sound = new Howl({
        src: [track.src],
        loop: true,
        preload: true,
        volume: 0,
        onload: () => {
          if (!alive) return
          ready.add(track.id)
          setLoaded(ready.size)
          setErrors((previous) => {
            const next = { ...previous }
            delete next[track.id]
            return next
          })
          syncTrack(track.id, 150)
        },
        onloaderror: () => {
          if (alive)
            setErrors((previous) => ({
              ...previous,
              [track.id]: 'Sound could not load.',
            }))
        },
        onplayerror: () => {
          if (alive)
            setErrors((previous) => ({
              ...previous,
              [track.id]: 'Playback blocked. Press pause, then play to retry.',
            }))
        },
        onplay: () => {
          if (alive)
            setErrors((previous) => {
              const next = { ...previous }
              delete next[track.id]
              return next
            })
        },
        onunlock: () => {
          if (alive) syncTrack(track.id, 150)
        },
      })
      sounds.current.set(track.id, sound)
    }
    const instances = sounds.current
    const pending = timers.current
    return () => {
      alive = false
      for (const timer of pending.values()) clearTimeout(timer)
      pending.clear()
      for (const sound of instances.values()) sound.unload()
      instances.clear()
    }
  }, [syncTrack])

  const toggleMasterPlay = useCallback(() => {
    desired.current.playing = !desired.current.playing
    setPlaying(desired.current.playing)
    for (const track of audioTracks) syncTrack(track.id, 150)
  }, [syncTrack])
  const setTrackVolume = useCallback(
    (id: string, value: number) => {
      if (!sounds.current.has(id) || !Number.isFinite(value)) return
      desired.current.volumes = {
        ...desired.current.volumes,
        [id]: Math.max(0, Math.min(1, value)),
      }
      setVolumes(desired.current.volumes)
      setActivePreset(null)
      syncTrack(id, 70)
    },
    [syncTrack],
  )
  const toggleMute = useCallback(
    (id: string) => {
      if (!sounds.current.has(id)) return
      desired.current.muted = {
        ...desired.current.muted,
        [id]: !desired.current.muted[id],
      }
      setMuted(desired.current.muted)
      setActivePreset(null)
      syncTrack(id, 100)
    },
    [syncTrack],
  )
  const applyPreset = useCallback(
    (id: string) => {
      const preset = mixerPresets.find((item) => item.id === id)
      if (!preset) return
      desired.current.volumes = Object.fromEntries(
        audioTracks.map((track) => [track.id, preset.volumes[track.id] ?? 0]),
      )
      desired.current.muted = {}
      setVolumes(desired.current.volumes)
      setMuted({})
      setActivePreset(id)
      for (const track of audioTracks) syncTrack(track.id, 1000)
    },
    [syncTrack],
  )
  const retryTrack = useCallback(
    (id: string) => {
      const sound = sounds.current.get(id)
      if (sound?.state() === 'unloaded') sound.load()
      else syncTrack(id, 150)
    },
    [syncTrack],
  )

  return (
    <AudioMixerContext.Provider
      value={{
        isPlaying,
        volumes,
        muted,
        errors,
        loaded,
        activePreset,
        toggleMasterPlay,
        setTrackVolume,
        toggleMute,
        applyPreset,
        retryTrack,
      }}
    >
      {children}
    </AudioMixerContext.Provider>
  )
}

export function useAudioMixer() {
  const context = useContext(AudioMixerContext)
  if (!context)
    throw new Error('useAudioMixer must be used within AudioMixerProvider')
  return context
}
