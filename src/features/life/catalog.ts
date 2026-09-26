import type { Tool } from './types'
import { decision } from './tools/decision'
import { boundaries } from './tools/boundaries'
export const lifeTools: Tool[] = [decision, boundaries]
