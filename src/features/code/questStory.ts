import type { AvatarDrawing } from '../../components/ui/avatarStyle'

export type QuestSpeaker = 'bloom' | 'tinker' | 'glitch' | 'pixel' | 'beacon'
export type QuestLine = [QuestSpeaker, string]

export const questCast: Record<QuestSpeaker, { name: string; face: AvatarDrawing; color: string; tint?: string }> = {
  bloom: { name: 'Bloom', face: 'bloom', color: '#ff8d72' },
  tinker: { name: 'Professor Tinker', face: 'tinker', color: '#ffa75e' },
  glitch: { name: 'GLITCH', face: 'robot', color: '#ec5c93', tint: 'hue-rotate(230deg) saturate(2.2)' },
  pixel: { name: 'Pixel', face: 'pixel', color: '#74d9ff' },
  beacon: { name: 'Beacon', face: 'beacon', color: '#a8ee87' },
}

export const questPrologue: QuestLine[] = [
  ['tinker', 'Welcome to the Archive of Source. Every program ever made left a little light here.'],
  ['pixel', 'A big chunk of that light just vanished. The bridges, the pages, even my pixels are forgetting where to go.'],
  ['glitch', 'I scattered the four lost arts: Syntax, Structure, Style, and Flow. Let us see what you can rebuild.'],
  ['bloom', 'We will recover them one working idea at a time. Start with the code blocks before they sink!'],
]

export const questInterludes: Record<number, QuestLine[]> = {
  1: [
    ['pixel', 'They moved! The blocks remembered their order.'],
    ['tinker', 'Syntax is waking up. Now teach the little robot how to carry the spark across the maze.'],
  ],
  2: [
    ['beacon', 'The robot reached the portal. The first archive gate is open.'],
    ['glitch', 'One gate? I hid the next clue behind a condition. You will have to think like a program.'],
  ],
  3: [
    ['tinker', 'The condition held. Syntax has returned to the archive.'],
    ['bloom', 'But these pages have no structure. Let us build the first HTML tower.'],
  ],
  4: [
    ['pixel', 'The tags fit inside one another like a tiny building.'],
    ['tinker', 'A page needs landmarks too. Give each region a name.'],
  ],
  5: [
    ['beacon', 'Header, main, footer. I can finally navigate the page again.'],
    ['bloom', 'One form is still silent. Link its label to its input.'],
  ],
  6: [
    ['tinker', 'Structure is restored. The archive can describe itself again.'],
    ['glitch', 'Descriptions are dull without style. Catch my selectors if you can.'],
  ],
  7: [
    ['pixel', 'The card lit up! A class selector found it.'],
    ['bloom', 'A rescue note is trapped under a crate. Float it aside so the words can flow.'],
  ],
  8: [
    ['bloom', 'The crate moved left, and the note wrapped beside it. The lift was a bit of archive magic.'],
    ['tinker', 'One style duel remains. Which rule wins when two rules disagree?'],
  ],
  9: [
    ['beacon', 'Style is back. The archive is glowing in color again.'],
    ['glitch', 'Fine. But the final art is Flow. You will need to arrange the world itself.'],
  ],
  10: [
    ['pixel', 'The cards found their axis. Row and column are directions, not guesses.'],
    ['tinker', 'Now space the satellites across the main axis.'],
  ],
  11: [
    ['beacon', 'The satellites are balanced. One final cross-axis alignment remains.'],
    ['bloom', 'Set the landing pads by their centers, and the beacon can shine again.'],
  ],
  12: [
    ['glitch', 'The archive remembers everything? Even the parts I tried to erase?'],
    ['tinker', 'Every repair taught us why the art mattered. Syntax, Structure, Style, and Flow are alive again.'],
    ['bloom', 'The lost art of programming was never lost while someone was willing to learn it. You saved the archive!'],
  ],
}

export const questAchievement: Record<number, { title: string; subtitle: string }> = {
  3: { title: 'Syntax Restored', subtitle: 'The first art returns to the Archive of Source.' },
  6: { title: 'Structure Restored', subtitle: 'HTML gives the archive meaning and shape.' },
  9: { title: 'Style Restored', subtitle: 'CSS brings color and character back.' },
  12: { title: 'Flow Restored', subtitle: 'Flexbox reunites the lost art of programming.' },
}
