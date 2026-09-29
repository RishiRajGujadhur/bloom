export type ProfileBrief = { name: string; tagline: string; project: string; outcome: string; email: string; url: string; verified: Record<string, boolean> }
export const PROFILE_START: ProfileBrief = { name: '', tagline: '', project: '', outcome: '', email: '', url: '', verified: {} }
export const PROFILE_REVIEW = [
  { id: 'structure', label: 'Page has header, main, and footer landmarks', help: 'Inspect the HTML structure.' },
  { id: 'headings', label: 'Headings follow a clear hierarchy', help: 'Keep one page title and avoid skipped levels.' },
  { id: 'keyboard', label: 'Every link works with Tab and Enter', help: 'Walk through the finished page without a mouse.' },
  { id: 'phone', label: 'Layout is readable on a phone', help: 'Check narrow widths without horizontal scrolling.' },
  { id: 'contrast', label: 'Text meets its contrast target', help: 'Check normal and large text against their backgrounds.' },
  { id: 'motion', label: 'Motion has a reduced option', help: 'Keep content available when motion is reduced.' },
] as const

export function profileChecklist(brief: ProfileBrief) {
  let deployed = false
  try { const url = new URL(brief.url); deployed = url.protocol === 'https:' && !!url.hostname.includes('.') } catch { /* keep false */ }
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brief.email.trim())
  return [
    { id: 'identity', label: 'Name and one-line introduction', pass: brief.name.trim().length >= 2 && brief.tagline.trim().length >= 12, hint: 'Add your name and a sentence about what you build.' },
    { id: 'project', label: 'Featured project and outcome', pass: brief.project.trim().length >= 3 && brief.outcome.trim().length >= 20, hint: 'Name a project and explain what it helps someone do.' },
    { id: 'contact', label: 'Working contact address', pass: emailValid, hint: 'Add an email address visitors can use.' },
    { id: 'deployed', label: 'Published HTTPS link', pass: deployed, hint: 'Add the HTTPS URL of the published page.' },
    ...PROFILE_REVIEW.map((item) => ({ id: item.id, label: item.label, pass: !!brief.verified[item.id], hint: item.help })),
  ]
}

export function projectBriefMarkdown(brief: ProfileBrief) {
  return `# Profile page project brief\n\nObjective: Build and publish a responsive profile page that introduces your work.\n\nName: ${brief.name.trim() || '[your name]'}\nIntroduction: ${brief.tagline.trim() || '[one sentence about you]'}\nFeatured project: ${brief.project.trim() || '[project name]'}\nProject outcome: ${brief.outcome.trim() || '[what this project helps someone do]'}\nContact: ${brief.email.trim() || '[email address]'}\nPublished page: ${brief.url.trim() || '[HTTPS URL]'}\n\nAcceptance checklist:\n${PROFILE_REVIEW.map((item) => `- [${brief.verified[item.id] ? 'x' : ' '}] ${item.label}`).join('\n')}`
}
