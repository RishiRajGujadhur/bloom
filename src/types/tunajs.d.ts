/** tunajs ships types that its package.json `exports` doesn't expose. */
declare module 'tunajs' {
  type Node = { input: AudioNode; connect: (target: AudioNode | { input: AudioNode }) => void; bypass: boolean }
  type Props = Record<string, number | boolean>
  export default class Tuna {
    constructor(context: AudioContext)
    Chorus: new (p?: Props) => Node
    Tremolo: new (p?: Props) => Node & { intensity: number; rate: number }
    PingPongDelay: new (p?: Props) => Node
    Filter: new (p?: Props) => Node
    Phaser: new (p?: Props) => Node
  }
}
