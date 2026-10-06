import { useId } from 'react'
import { useThemeId } from '../ui/MatrixRain'

/** A compact SVG icon family for Galaxy's Studio tabs. Labels remain in the tab. */
export function GalaxyGlyph({ label, id }: { label: string; id: string }) {
  const gradientId = useId().replace(/:/g, '')
  const theme = useThemeId()
  // These alternate drawings are hidden by CSS outside Galaxy. Avoid keeping
  // a second SVG tree for every navigation item and tab in those themes.
  if (theme !== 'galaxy') return null
  const word = `${id} ${label}`.toLowerCase()
  const kind = /chart|trend|record|history|stats|progress/.test(word) ? 'chart'
    : /menu|navigation/.test(word) ? 'menu'
    : /budget|money|spend|bill|price|cost/.test(word) ? 'money'
    : /plan|goal|roadmap|map|journey/.test(word) ? 'compass'
    : /play|game|practice|train|workout|exercise|session|breathe/.test(word) ? 'play'
    : /settings|options|custom|adjust|style/.test(word) ? 'sliders'
    : /card|read|lesson|library|learn|book/.test(word) ? 'book'
    : /sound|audio|listen|music|mix/.test(word) ? 'sound'
    : /sleep|moon|rest|night|dream/.test(word) ? 'moon'
    : /focus|target|aim|coach/.test(word) ? 'target'
    : /write|draw|ink|note|journal/.test(word) ? 'pen'
    : /sun|day|light|weather/.test(word) ? 'sun'
    : 'star'
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true" focusable="false">
      <defs><linearGradient id={gradientId} x1="2" y1="2" x2="22" y2="22"><stop stopColor="#b9ffd0"/><stop offset=".55" stopColor="#a7e4ff"/><stop offset="1" stopColor="#cdb5ff"/></linearGradient></defs>
      <circle cx="12" cy="12" r="9.25" stroke={`url(#${gradientId})`} strokeOpacity=".32" strokeWidth=".8"/>
      <path d="M2.7 15.8c4.3 1.5 13.5 1.5 18.6-6.8" stroke={`url(#${gradientId})`} strokeOpacity=".55" strokeWidth=".85" strokeLinecap="round"/>
      <g stroke={`url(#${gradientId})`} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
        {kind === 'chart' && <><path d="M6.5 16.5v-3m4 3V9m4 7.5v-6m3.5 6V7"/><path d="M5.5 17.5h13"/></>}
        {kind === 'menu' && <><path d="M6 8h12M6 12h9M6 16h12"/><circle cx="18" cy="12" r=".6" fill={`url(#${gradientId})`} stroke="none"/></>}
        {kind === 'money' && <><rect x="6" y="8" width="12" height="8.5" rx="2"/><path d="M8 8V6.5h8M11 12h4m-2-2v4"/></>}
        {kind === 'compass' && <><path d="m14.9 9.1-2 5.8-3.8-3.8 5.8-2Z"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2"/></>}
        {kind === 'play' && <><path d="m9 7 7 5-7 5V7Z"/><path d="M7 5.5a8 8 0 0 1 10 0"/></>}
        {kind === 'sliders' && <><path d="M7 6v12m5-12v12m5-12v12M5 10h4m1 4h4m1-5h4"/></>}
        {kind === 'book' && <><path d="M12 7c-2-1.6-4.2-1.8-6.5-1.3v10c2.5-.4 4.7 0 6.5 1.4 1.8-1.4 4-1.8 6.5-1.4v-10C16.2 5.2 14 5.4 12 7Z"/><path d="M12 7v10"/></>}
        {kind === 'sound' && <><path d="M5.5 10v4m3-7v10m3-12v14m3-10v6m3-8v10"/></>}
        {kind === 'moon' && <path d="M16.5 16.4A7.2 7.2 0 0 1 7.6 7.5 7.2 7.2 0 1 0 16.5 16.4Z"/>}
        {kind === 'target' && <><circle cx="12" cy="12" r="5.2"/><circle cx="12" cy="12" r="1.5"/><path d="M12 3v2m0 14v2M3 12h2m14 0h2"/></>}
        {kind === 'pen' && <><path d="m7 17 2.5-1 7.2-7.2-1.5-1.5L8 14.5 7 17Z"/><path d="m14.8 7.3 1.5-1.5 1.5 1.5-1.5 1.5M5.5 19h13"/></>}
        {kind === 'sun' && <><circle cx="12" cy="12" r="3.4"/><path d="M12 4v2m0 12v2M4 12h2m12 0h2M6.3 6.3l1.4 1.4m8.6 8.6 1.4 1.4m0-11.4-1.4 1.4m-8.6 8.6-1.4 1.4"/></>}
        {kind === 'star' && <><path d="m12 5 1.8 5.2L19 12l-5.2 1.8L12 19l-1.8-5.2L5 12l5.2-1.8L12 5Z"/><path d="M18.5 5.5v2m-1-1h2"/></>}
      </g>
    </svg>
  )
}
