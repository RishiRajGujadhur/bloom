declare module 'page-flip' {
  export type FlipEvent = { data: number | string; object: PageFlip }
  export class PageFlip {
    constructor(el: HTMLElement, settings: Record<string, unknown>)
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void
    flipNext(corner?: 'top' | 'bottom'): void
    flipPrev(corner?: 'top' | 'bottom'): void
    on(event: 'flip' | 'changeState' | 'changeOrientation' | 'init' | 'update', cb: (e: FlipEvent) => void): PageFlip
    destroy(): void
  }
}
