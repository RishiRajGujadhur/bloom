/** @tsparticles/react 4.x points "types" at a lib/ folder it doesn't ship. */
declare module '@tsparticles/react' {
  import type { Container, Engine, ISourceOptions } from '@tsparticles/engine'
  import type { CSSProperties, FC, PropsWithChildren } from 'react'
  export interface IParticlesProps {
    id?: string
    options?: ISourceOptions
    style?: CSSProperties
    className?: string
    particlesLoaded?: (container?: Container) => Promise<void> | void
  }
  const Particles: FC<IParticlesProps>
  export default Particles
  export const ParticlesProvider: FC<PropsWithChildren<{ init: (engine: Engine) => Promise<void> }>>
  export function useParticlesProvider(): { loaded: boolean }
}
