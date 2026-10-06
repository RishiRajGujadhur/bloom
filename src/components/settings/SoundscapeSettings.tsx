import { setSoundscapeButton, useSoundscapeButton } from '../../settings/soundscapeButton'

export function SoundscapeSettings() {
  const visible = useSoundscapeButton()
  return <section className="card" aria-labelledby="soundscape-setting-heading">
    <h2 id="soundscape-setting-heading">Soundscape</h2>
    <label className="cf-toggle"><input type="checkbox" aria-label="Show Soundscape button" checked={visible} onChange={event => setSoundscapeButton(event.target.checked)} /><span><b>Show Soundscape button</b><small>Keep the sound mixer beside Search.</small></span></label>
  </section>
}
