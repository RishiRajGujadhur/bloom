/// <reference lib="webworker" />
/** Renders the Sound Lab spectral mountain on its own thread (OffscreenCanvas). */
import { serveScene } from '../../platform/offscreen'
import { createSpectroScene } from './spectroScene'

serveScene(createSpectroScene)
