import { useEffect, useRef, type RefObject } from 'react'
import gsap from 'gsap'
import { Play, Sparkles } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { techniqueFor, type CookingTechnique } from './cookingTechniques'

function Cue({ kind, svg }: { kind: CookingTechnique['id']; svg: RefObject<SVGSVGElement | null> }) {
  return <svg ref={svg} className="cook-technique-art" viewBox="0 0 160 90" role="img" aria-label={`${kind} technique illustration`}>
    {kind === 'chop' && <><rect x="18" y="68" width="124" height="12" rx="5" className="cook-art-base" /><circle cx="72" cy="59" r="12" className="cook-art-food" /><circle cx="94" cy="59" r="11" className="cook-art-food" /><g className="cook-art-motion"><path d="M37 26 L124 26 L108 33 L48 33 Z" className="cook-art-tool" /><path d="M104 25 L126 14" className="cook-art-line" /></g></>}
    {kind === 'simmer' && <><path d="M28 45 H132 L120 78 H40 Z" className="cook-art-base" /><path d="M20 42 H140 M22 34 H138" className="cook-art-line" /><g className="cook-art-motion"><circle cx="54" cy="22" r="4" className="cook-art-food" /><circle cx="80" cy="15" r="5" className="cook-art-food" /><circle cx="108" cy="23" r="3" className="cook-art-food" /></g></>}
    {kind === 'saute' && <><path d="M25 59 Q73 85 116 58" className="cook-art-base" /><path d="M114 60 L145 49" className="cook-art-line" /><g className="cook-art-motion"><circle cx="60" cy="52" r="6" className="cook-art-food" /><circle cx="84" cy="48" r="6" className="cook-art-food" /><circle cx="104" cy="52" r="5" className="cook-art-food" /></g></>}
    {kind === 'bake' && <><rect x="34" y="12" width="92" height="66" rx="9" className="cook-art-base" /><rect x="47" y="39" width="66" height="26" rx="3" className="cook-art-window" /><path d="M53 57 H107" className="cook-art-line" /><g className="cook-art-motion"><path d="M62 35 Q55 26 62 18 M81 35 Q74 26 81 18 M100 35 Q93 26 100 18" className="cook-art-line" /></g></>}
    {kind === 'mix' && <><path d="M26 47 Q34 80 80 80 Q126 80 134 47 Z" className="cook-art-base" /><path d="M25 47 H135" className="cook-art-line" /><g className="cook-art-motion"><path d="M105 12 L77 61 M70 54 Q75 72 84 56" className="cook-art-line" /></g></>}
    {kind === 'wash' && <><path d="M38 62 Q80 87 122 62" className="cook-art-base" /><path d="M33 62 H127" className="cook-art-line" /><g className="cook-art-motion"><path d="M56 15 Q47 27 56 31 Q65 27 56 15 M82 8 Q73 20 82 24 Q91 20 82 8 M108 15 Q99 27 108 31 Q117 27 108 15" className="cook-art-food" /></g></>}
  </svg>
}

export function TechniqueTip({ step }: { step: string }) {
  const technique = techniqueFor(step)
  const svg = useRef<SVGSVGElement>(null)
  const animation = useRef<gsap.core.Tween | null>(null)
  const replay = () => {
    const motion = svg.current?.querySelector('.cook-art-motion')
    if (!motion || !technique || prefersReducedMotion()) return
    animation.current?.kill()
    const action = technique.id
    animation.current = gsap.fromTo(motion,
      action === 'mix' ? { rotation: -12 } : action === 'saute' ? { x: -8, rotation: -4 } : { y: action === 'chop' ? -8 : 7 },
      action === 'mix' ? { rotation: 14, transformOrigin: '50% 50%', duration: .55, repeat: 3, yoyo: true } : action === 'saute' ? { x: 8, rotation: 4, transformOrigin: '50% 50%', duration: .48, repeat: 3, yoyo: true } : { y: action === 'chop' ? 5 : -6, duration: .48, repeat: 3, yoyo: true, ease: 'sine.inOut' },
    )
  }
  useEffect(() => {
    if (!technique) return
    replay()
    return () => { animation.current?.kill(); animation.current = null }
    // Each step mounts a fresh tip, so the initial motion plays once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [technique?.id])
  if (!technique) return null
  return <aside className="cook-technique" aria-label={`${technique.label} technique tip`}>
    <div><Sparkles size={18} aria-hidden="true" /><strong>{technique.label}</strong><p>{technique.guidance}</p><small>{technique.cue}</small></div>
    <Cue kind={technique.id} svg={svg} />
    <button type="button" title="Replay technique motion" aria-label={`Replay ${technique.label} motion`} onClick={replay} disabled={prefersReducedMotion()}><Play size={16} aria-hidden="true" /></button>
  </aside>
}
