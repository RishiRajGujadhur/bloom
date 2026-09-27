import { BloomFace } from './BloomFace'
import { avatarStyles, setAvatarStyle, useAvatarStyle } from './avatarStyle'
import './avatarPicker.css'

/** Settings: choose Bloom's avatar (live, animated previews). */
export function AvatarPicker() {
  const style = useAvatarStyle()
  return (
    <fieldset className="avatar-picker">
      <legend>Bloom’s avatar</legend>
      <div className="avatar-options" role="radiogroup" aria-label="Bloom’s avatar">
        {avatarStyles.map((a) => (
          <button key={a.id} type="button" role="radio" aria-checked={style === a.id} className="avatar-option" onClick={() => setAvatarStyle(a.id)}>
            {a.id === 'auto' ? (
              <span className="avatar-auto" aria-hidden="true">
                <BloomFace size={40} variant="bloom" follow={false} waveOnMount={false} label="" />
                <BloomFace size={40} variant="robot" follow={false} waveOnMount={false} label="" />
              </span>
            ) : (
              <BloomFace size={64} variant={a.id} follow={false} waveOnMount={false} label={a.label} />
            )}
            <strong>{a.label}</strong>
            <small>{a.hint}</small>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
