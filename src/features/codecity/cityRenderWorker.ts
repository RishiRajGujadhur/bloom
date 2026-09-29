/// <reference lib="webworker" />
/** The code city on its own thread. */
import { serveScene } from '../../platform/offscreen'
import { createCityScene } from './cityRender'

serveScene(createCityScene)
