import { useMemo } from 'react'
import { capInfo, hasCap, type Cap } from './caps'
import './caps.css'

/** "Superpowers" strip: which platform capabilities this feature uses and whether this device has them. */
export function CapsBadge({ caps }: { caps: Cap[] }) {
  const state = useMemo(() => caps.map((c) => ({ c, on: hasCap(c) })), [caps])
  return (
    <ul className="caps-badge" aria-label="Device capabilities used here">
      {state.map(({ c, on }) => (
        <li key={c} className={on ? 'on' : 'off'} title={`${capInfo[c].long}${on ? '' : ' (not available here, using a fallback)'}`}>
          <span className="caps-dot" aria-hidden="true" />
          {capInfo[c].label}
          <span className="sr-only">{on ? ' available' : ' fallback'}</span>
        </li>
      ))}
    </ul>
  )
}
