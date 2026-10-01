import { useId } from 'react'

export function GalaxyCategoryIcon({ category }: { category: string }) {
  const id = useId().replace(/:/g, '')
  const paths: Record<string, string[]> = {
    groceries: ['M4 7h2l2 9h10l2-7H7', 'M10 19h.01M17 19h.01'],
    dining: ['M7 4v7m3-7v7M7 8h3m-1.5 3v9', 'M17 4c-3 3-3 7 0 9v7'],
    transport: ['M6 16V7c0-3 12-3 12 0v9H6Z', 'M6 11h12M8 19h.01M16 19h.01'],
    home: ['m3 11 9-7 9 7', 'M6 10v10h12V10M10 20v-6h4v6'],
    subscriptions: ['M6 9a7 7 0 0 1 12-2l2 2', 'm20 5v4h-4M18 15a7 7 0 0 1-12 2l-2-2m0 4v-4h4'],
    health: ['M8 5h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z', 'M12 8v8M8 12h8'],
    fun: ['M4 7h16v4a2 2 0 0 0 0 4v2H4v-2a2 2 0 0 0 0-4V7Z', 'M12 7v10'],
    shopping: ['M5 9h14l-1 11H6L5 9Z', 'M9 9V7a3 3 0 0 1 6 0v2'],
    gifts: ['M4 10h16v10H4V10ZM3 7h18v3H3V7Z', 'M12 7v13M12 7C7 7 7 3 10 3c2 0 2 3 2 4Zm0 0c5 0 5-4 2-4-2 0-2 3-2 4Z'],
    other: ['M5 12h.2M11.9 12h.2M18.8 12h.2'],
  }
  return <svg className="mn-galaxy-cat-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true" focusable="false">
    <defs><linearGradient id={id} x1="3" y1="3" x2="21" y2="21"><stop stopColor="#b8ffce"/><stop offset=".58" stopColor="#a6e2ff"/><stop offset="1" stopColor="#c4aaff"/></linearGradient></defs>
    <g stroke={`url(#${id})`} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{(paths[category] ?? paths.other).map((d) => <path key={d} d={d} />)}</g>
  </svg>
}
