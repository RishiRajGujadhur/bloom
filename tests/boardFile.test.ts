import { packBoard, unpackBoard } from '../src/components/VisionBoard/boardFile'

describe('.bloomboard files', () => {
  it('round-trips nodes, edges and images (images stored as separate files)', () => {
    const img = 'data:image/jpeg;base64,' + Buffer.from(new Uint8Array([255, 216, 255, 1, 2, 3, 255, 217])).toString('base64')
    const nodes = [
      { id: 'a', type: 'sticky' as const, position: { x: 1, y: 2 }, data: { text: 'Run a 10k' } },
      { id: 'b', type: 'image' as const, position: { x: 3, y: 4 }, data: { src: img, caption: 'Finish line' }, width: 260, height: 240 },
    ]
    const edges = [{ id: 'e', source: 'a', target: 'b', label: 'because' }]
    const zip = packBoard('2027 goals', nodes, edges)
    const text = Buffer.from(zip).toString('latin1')
    expect(text).toContain('images/b.jpg')
    const back = unpackBoard(zip)
    expect(back.name).toBe('2027 goals')
    expect(back.nodes).toEqual(nodes)
    expect(back.edges).toEqual(edges)
  })

  it('rejects files that are not boards', () => {
    expect(() => unpackBoard(new Uint8Array([1, 2, 3]))).toThrow()
  })
})
