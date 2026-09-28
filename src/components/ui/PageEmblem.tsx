import { useLayoutEffect, useRef, type ComponentType } from 'react'
import gsap from 'gsap'
import {
  BookOpen, Brain, CalendarDays, CheckSquare, Dumbbell, Eye, Flame, Flower2, Gift, Globe2, Heart,
  Hourglass, Leaf, Lightbulb, Map, Moon, Mountain, Music, NotebookPen, Palette, Repeat, Rocket, Route, ScrollText,
  Shield, Sparkles, Sprout, Store, Sun, Swords, Target, Timer, Trophy, Waves, Wind, MousePointer2, Mic, Network, Layers,
  Footprints, Apple, Activity, Camera, Clock, Castle, Brush,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { subOn } from '../../features/subFeatures'
import './flow.css'
import { pathLength } from '../../utils/svgLength'

/**
 * Animated page emblem: a Lucide icon whose strokes draw themselves on with
 * GSAP, then idle with a motion that suits the page (a clock ticks, a leaf
 * sways, a flame flickers, a rocket hovers…).
 */
type Motion = 'bob' | 'spin' | 'sway' | 'pulse' | 'tick' | 'flicker' | 'wave' | 'hover' | 'swing'
type Emblem = { Icon: ComponentType<LucideProps>; motion: Motion; color: string }

export const emblems: Record<string, Emblem> = {
  overview: { Icon: Flower2, motion: 'spin', color: '#e0703f' },
  todos: { Icon: CheckSquare, motion: 'pulse', color: '#3f8a5a' },
  calendar: { Icon: CalendarDays, motion: 'swing', color: '#3f7fd0' },
  focus: { Icon: Timer, motion: 'tick', color: '#e2553f' },
  planning: { Icon: Sun, motion: 'spin', color: '#f0a500' },
  collectibles: { Icon: Trophy, motion: 'bob', color: '#e0703f' },
  posture: { Icon: Activity, motion: 'sway', color: '#4db6ac' },
  energy: { Icon: Activity, motion: 'wave', color: '#f0a500' },
  lab: { Icon: Brain, motion: 'pulse', color: '#3f7fd0' },
  taichi: { Icon: Waves, motion: 'wave', color: '#546e7a' },
  screen: { Icon: Eye, motion: 'pulse', color: '#546e7a' },
  cards: { Icon: Layers, motion: 'swing', color: '#8f7ae5' },
  mirror: { Icon: Sparkles, motion: 'flicker', color: '#b39ddb' },
  mala: { Icon: Sparkles, motion: 'spin', color: '#8d6e63' },
  scan: { Icon: Camera, motion: 'pulse', color: '#3f8a5a' },
  body: { Icon: Activity, motion: 'bob', color: '#e0703f' },
  'focus-room': { Icon: Target, motion: 'pulse', color: '#8f7ae5' },
  routines: { Icon: Repeat, motion: 'spin', color: '#4db6ac' },
  habits: { Icon: Sprout, motion: 'sway', color: '#52b69a' },
  urges: { Icon: Waves, motion: 'wave', color: '#2a6f97' },
  challenges: { Icon: Trophy, motion: 'bob', color: '#f0a500' },
  growth: { Icon: Leaf, motion: 'sway', color: '#52b69a' },
  world: { Icon: Globe2, motion: 'spin', color: '#3f7fd0' },
  shop: { Icon: Store, motion: 'bob', color: '#f06ba8' },
  daybook: { Icon: NotebookPen, motion: 'swing', color: '#d9653b' },
  journal: { Icon: BookOpen, motion: 'bob', color: '#8f7ae5' },
  epiphanies: { Icon: Lightbulb, motion: 'flicker', color: '#f0a500' },
  mood: { Icon: Heart, motion: 'pulse', color: '#e27396' },
  gratitude: { Icon: Gift, motion: 'bob', color: '#f2a65a' },
  sleep: { Icon: Moon, motion: 'sway', color: '#5c6bc0' },
  breathe: { Icon: Wind, motion: 'wave', color: '#4fb3d9' },
  breathwork: { Icon: Wind, motion: 'pulse', color: '#4fb3d9' },
  meditate: { Icon: Sparkles, motion: 'flicker', color: '#b39ddb' },
  exercises: { Icon: Dumbbell, motion: 'swing', color: '#e0703f' },
  dojo: { Icon: Swords, motion: 'swing', color: '#c62828' },
  games: { Icon: Brain, motion: 'pulse', color: '#8f7ae5' },
  diet: { Icon: Apple, motion: 'bob', color: '#e2553f' },
  fasting: { Icon: Hourglass, motion: 'spin', color: '#8d6e63' },
  run: { Icon: Footprints, motion: 'bob', color: '#e0703f' },
  yoga: { Icon: Flower2, motion: 'sway', color: '#b39ddb' },
  stretch: { Icon: Activity, motion: 'wave', color: '#4db6ac' },
  workouts: { Icon: Dumbbell, motion: 'bob', color: '#546e7a' },
  intervals: { Icon: Clock, motion: 'tick', color: '#e2553f' },
  eyes: { Icon: Eye, motion: 'pulse', color: '#3f7fd0' },
  daylight: { Icon: Sun, motion: 'spin', color: '#f0a500' },
  sounds: { Icon: Music, motion: 'bob', color: '#8f7ae5' },
  mixer: { Icon: Music, motion: 'wave', color: '#4db6ac' },
  affirm: { Icon: Sparkles, motion: 'flicker', color: '#f06ba8' },
  palace: { Icon: Castle, motion: 'bob', color: '#8d6e63' },
  mindmaps: { Icon: Network, motion: 'pulse', color: '#3f7fd0' },
  flashcards: { Icon: Layers, motion: 'swing', color: '#8f7ae5' },
  release: { Icon: Flame, motion: 'flicker', color: '#e2553f' },
  'vision-board': { Icon: Palette, motion: 'swing', color: '#f06ba8' },
  journey: { Icon: Route, motion: 'bob', color: '#52b69a' },
  roadmap: { Icon: Mountain, motion: 'bob', color: '#546e7a' },
  places: { Icon: Map, motion: 'swing', color: '#3f8a5a' },
  yearbook: { Icon: Camera, motion: 'bob', color: '#8d6e63' },
  voice: { Icon: Mic, motion: 'pulse', color: '#e27396' },
  ink: { Icon: Brush, motion: 'swing', color: '#212121' },
  capsule: { Icon: Hourglass, motion: 'spin', color: '#8f7ae5' },
  street: { Icon: Store, motion: 'bob', color: '#4fb3d9' },
  pointer: { Icon: MousePointer2, motion: 'hover', color: '#e0703f' },
  monk: { Icon: Shield, motion: 'pulse', color: '#546e7a' },
  explore: { Icon: Rocket, motion: 'hover', color: '#3f7fd0' },
  settings: { Icon: ScrollText, motion: 'swing', color: '#546e7a' },
}
const fallback: Emblem = { Icon: Sparkles, motion: 'flicker', color: '#e0703f' }

// Every emblem idles with the same slow levitation (no ticks, flickers or pops).
function idle(el: SVGSVGElement) {
  return gsap.to(el, { y: -4, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 })
}

export function PageEmblem({ page }: { page: string }) {
  const host = useRef<HTMLSpanElement>(null)
  const e = emblems[page] ?? fallback
  useLayoutEffect(() => {
    const svg = host.current?.querySelector('svg')
    if (!svg || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !subOn('pointerFx', 'emblems', { ignoreParent: true })) return
    const parts = svg.querySelectorAll<SVGGeometryElement>('path, circle, rect, line, polyline, polygon, ellipse')
    const tl = gsap.timeline()
    parts.forEach((p) => {
      const len = pathLength(p, 60)
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
    })
    tl.to(parts, { strokeDashoffset: 0, duration: 1.1, stagger: 0.08, ease: 'power2.inOut' }).fromTo(svg, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'sine.out' }, 0)
    const loop = idle(svg)
    loop.pause()
    tl.eventCallback('onComplete', () => void loop.play())
    return () => {
      tl.kill()
      loop.kill()
      gsap.set([svg, ...parts], { clearProps: 'all' })
    }
  }, [page, e.motion])
  return (
    <span ref={host} className="page-emblem" style={{ ['--emblem' as string]: 'var(--accent-color)' }} aria-hidden="true" key={page}>
      <e.Icon size={46} strokeWidth={1.6} data-animated />
    </span>
  )
}
