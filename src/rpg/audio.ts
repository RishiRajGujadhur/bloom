let audio: AudioContext | undefined
export async function enableAudio() {
  try { audio ??= new AudioContext(); await audio.resume(); return audio.state === 'running' } catch { return false }
}
export function victoryChord() {
  if (!audio || audio.state !== 'running') return
  // Original short V–I classical cadence, voiced with a quiet square-wave timbre.
  const chords = [[392,493.88,587.33],[261.63,329.63,392,523.25]]
  chords.forEach((notes,i) => notes.forEach(freq => {
    const oscillator=audio!.createOscillator(), gain=audio!.createGain(), start=audio!.currentTime+i*.24
    oscillator.type='square'; oscillator.frequency.value=freq
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.012,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+.42)
    oscillator.connect(gain);gain.connect(audio!.destination);oscillator.start(start);oscillator.stop(start+.45)
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()}
  }))
}
