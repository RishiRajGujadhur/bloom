import type { Tool } from './types'
import { decision } from './tools/decision'
import { boundaries } from './tools/boundaries'
import { connections } from './tools/connections'
import { practice } from './tools/practice'
export const lifeTools: Tool[] = [decision, boundaries, connections, practice]
