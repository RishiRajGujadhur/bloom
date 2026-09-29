/// <reference lib="webworker" />
/** The Matrix glyph rain on its own thread. */
import { serveScene } from '../../platform/offscreen'
import { createMatrixScene } from './matrixScene'

serveScene(createMatrixScene)
