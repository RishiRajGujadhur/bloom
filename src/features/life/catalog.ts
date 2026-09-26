import type { Tool } from './types'
import { decision } from './tools/decision'
import { boundaries } from './tools/boundaries'
import { connections } from './tools/connections'
import { practice } from './tools/practice'
import { reading } from './tools/reading'
import { writing } from './tools/writing'
import { shutdown } from './tools/shutdown'
import { meetings } from './tools/meetings'
export const lifeTools: Tool[] = [
  decision,
  boundaries,
  connections,
  practice,
  reading,
  writing,
  shutdown,
  meetings,
]
