import type { Tool } from './types'
import { decision } from './tools/decision'
import { boundaries } from './tools/boundaries'
import { connections } from './tools/connections'
export const lifeTools: Tool[] = [decision, boundaries, connections]
