import { Checkbox } from '../../components/ui/Checkbox'
import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Copy } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { PROFILE_REVIEW, PROFILE_START, profileChecklist, projectBriefMarkdown, type ProfileBrief } from './profileProjectModel'
import './profileProject.css'

const STORAGE_KEY = 'bloom-profile-project-v1'
const readBrief = (): ProfileBrief => {
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'); if (saved && typeof saved === 'object' && saved.verified && typeof saved.verified === 'object') return { ...PROFILE_START, ...saved } } catch { /* use starter */ }
  return PROFILE_START
}

export function ProfileProject({ onClose }: { onClose: () => void }) {
  const [brief, setBrief] = useState(readBrief)
  const [copied, setCopied] = useState(false)
  const progress = useRef<SVGCircleElement>(null)
  const checks = profileChecklist(brief)
  const passed = checks.filter((item) => item.pass).length
  const markdown = projectBriefMarkdown(brief)
  const update = (patch: Partial<ProfileBrief>) => {
    const next = { ...brief, ...patch }; setBrief(next); setCopied(false)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* keep in memory */ }
  }
  useLayoutEffect(() => {
    if (!progress.current) return
    const offset = 226 * (1 - passed / checks.length)
    if (prefersReducedMotion()) { gsap.set(progress.current, { strokeDashoffset: offset }); return }
    const tween = gsap.to(progress.current, { strokeDashoffset: offset, duration: .45, ease: 'power2.out' })
    return () => { tween.kill() }
  }, [passed, checks.length])
  const copy = async () => { try { await navigator.clipboard.writeText(markdown); setCopied(true) } catch { setCopied(false) } }
  return <LearningExercise className="profile-project" aria-label="Publishable profile-page project brief and checklist" title={<>Ship your profile page</>} description={<>Write a short project brief, build the page, then verify it before sharing the published link.</>} onClose={onClose}>

    <p className="profile-project-objective"><strong>Objective:</strong> Publish a page that introduces you, presents one project, offers a contact route, and passes the launch checklist.</p>
    <div className="profile-project-grid bloom-columns"><div className="profile-project-form"><label>Your name<input value={brief.name} maxLength={60} onChange={(event) => update({ name: event.target.value })} placeholder="Ada Lovelace" /></label><label>One-line introduction<input value={brief.tagline} maxLength={140} onChange={(event) => update({ tagline: event.target.value })} placeholder="I build helpful tools for my community." /></label><label>Featured project<input value={brief.project} maxLength={80} onChange={(event) => update({ project: event.target.value })} placeholder="Community garden map" /></label><label>What does it help someone do?<textarea value={brief.outcome} maxLength={360} onChange={(event) => update({ outcome: event.target.value })} placeholder="It helps neighbors find shared growing spaces and events." /></label><label>Contact email<input type="email" value={brief.email} onChange={(event) => update({ email: event.target.value })} placeholder="you@example.com" /></label><label>Published page URL<input type="url" value={brief.url} onChange={(event) => update({ url: event.target.value })} placeholder="https://example.com/profile" /></label></div><div><h3>Page outline</h3><svg className="profile-project-preview" viewBox="0 0 440 260" role="img" aria-label="Profile page outline with introduction, featured project, contact, and footer"><rect x="1" y="1" width="438" height="258" rx="14" className="profile-project-preview-bg" /><rect x="20" y="20" width="400" height="48" rx="8" className="profile-project-preview-head" /><text x="34" y="49">{brief.name.trim().slice(0, 28) || 'Your name'}</text><rect x="20" y="80" width="400" height="62" rx="8" className="profile-project-preview-section" /><text x="34" y="107">Introduction</text><text x="34" y="128" className="profile-project-preview-small">{brief.tagline.trim().slice(0, 49) || 'One sentence about what you build'}</text><rect x="20" y="154" width="400" height="54" rx="8" className="profile-project-preview-section" /><text x="34" y="178">{brief.project.trim().slice(0, 35) || 'Featured project'}</text><text x="34" y="198" className="profile-project-preview-small">{brief.outcome.trim().slice(0, 50) || 'Explain the result'}</text><text x="25" y="239" className="profile-project-preview-footer">Contact · Footer</text></svg><h3>Build and review</h3><div className="profile-project-review">{PROFILE_REVIEW.map((item) => <label key={item.id}><Checkbox checked={!!brief.verified[item.id]} onCheckedChange={(checked) => update({ verified: { ...brief.verified, [item.id]: checked } })} /><span>{item.label}<small>{item.help}</small></span></label>)}</div></div></div><div className="profile-project-actions"><button type="button" onClick={copy}><Copy size={15} /> Copy project brief</button><span role="status">{passed === checks.length ? 'Ready to share. All launch checks complete.' : `${passed} of ${checks.length} launch checks complete.`}{copied ? ' Brief copied.' : ''}</span></div><ul className="profile-project-checks" aria-label="Project checklist feedback">{checks.filter((item) => !item.pass).map((item) => <li key={item.id}>{item.hint}</li>)}</ul>
  </LearningExercise>
}
