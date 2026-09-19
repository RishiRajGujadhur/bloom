export interface AudioTrack {
  id: string
  name: string
  category: 'Nature' | 'Atmosphere' | 'Music' | 'Noise'
  src: string
  color: string
}

export interface MixerPreset {
  id: string
  name: string
  volumes: Record<string, number>
}

export const audioTracks: AudioTrack[] = [
  {
    id: 'rain',
    name: 'Heavy Rain',
    category: 'Nature',
    src: '/audio/rain.wav',
    color: 'var(--accent-color)',
  },
  {
    id: 'thunder',
    name: 'Distant Thunder',
    category: 'Nature',
    src: '/audio/thunder.wav',
    color: 'var(--accent-color)',
  },
  {
    id: 'wind',
    name: 'Forest Wind',
    category: 'Nature',
    src: '/audio/wind.wav',
    color: 'var(--accent-color)',
  },
  {
    id: 'space',
    name: 'Deep Space Hum',
    category: 'Atmosphere',
    src: '/audio/space.wav',
    color: 'var(--text-secondary)',
  },
  {
    id: 'fire',
    name: 'Crackling Fireplace',
    category: 'Atmosphere',
    src: '/audio/fire.wav',
    color: 'var(--text-secondary)',
  },
  {
    id: 'tavern',
    name: 'RPG Tavern',
    category: 'Atmosphere',
    src: '/audio/tavern.wav',
    color: 'var(--text-secondary)',
  },
  {
    id: 'strings',
    name: 'Cinematic Strings',
    category: 'Music',
    src: '/audio/strings.wav',
    color: 'var(--accent-color)',
  },
  {
    id: 'cello',
    name: 'Solo Cello',
    category: 'Music',
    src: '/audio/cello.wav',
    color: 'var(--accent-color)',
  },
  {
    id: 'piano',
    name: 'Classical Piano',
    category: 'Music',
    src: '/audio/piano.wav',
    color: 'var(--accent-color)',
  },
  {
    id: 'brown',
    name: 'Brown Noise',
    category: 'Noise',
    src: '/audio/brown.wav',
    color: 'var(--text-secondary)',
  },
]

export const mixerPresets: MixerPreset[] = [
  {
    id: 'focus',
    name: 'Deep Work Focus',
    volumes: { brown: 0.6, strings: 0.4, rain: 0.2 },
  },
  {
    id: 'reflection',
    name: 'Nightly Reflection',
    volumes: { piano: 0.5, fire: 0.3 },
  },
  { id: 'quest', name: 'Epic Quest', volumes: { tavern: 0.4, cello: 0.6 } },
]
