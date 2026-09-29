/// <reference lib="webworker" />
/** Terrain Replay's 3D scene on its own thread. */
import { serveScene } from '../../platform/offscreen'
import { createTerrainScene } from './terrainRender'

serveScene(createTerrainScene)
