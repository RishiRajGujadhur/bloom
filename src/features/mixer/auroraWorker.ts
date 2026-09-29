/// <reference lib="webworker" />
/** The mixer aurora on its own thread. */
import { serveScene } from '../../platform/offscreen'
import { createAuroraScene } from './auroraScene'

serveScene(createAuroraScene)
