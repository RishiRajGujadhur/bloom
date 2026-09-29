import { codePaths, nextChapter, toggleChapter } from '../src/features/code/learningPaths'

test('each learning path has unique ordered chapters and advances one step at a time', () => {
  expect(new Set(codePaths.map((path) => path.id)).size).toBe(codePaths.length)
  for (const path of codePaths) {
    expect(path.chapters.length).toBeGreaterThan(2)
    expect(new Set(path.chapters.map((chapter) => chapter.id)).size).toBe(path.chapters.length)
    expect(nextChapter(path, {})?.id).toBe(path.chapters[0].id)
    const firstDone = { [`${path.id}:${path.chapters[0].id}`]: true }
    expect(nextChapter(path, firstDone)?.id).toBe(path.chapters[1].id)
    const allDone = Object.fromEntries(path.chapters.map((chapter) => [`${path.id}:${chapter.id}`, true]))
    expect(nextChapter(path, allDone)).toBeNull()
    const cleared = toggleChapter(path, allDone, 1)
    expect(cleared[`${path.id}:${path.chapters[0].id}`]).toBe(true)
    expect(nextChapter(path, cleared)?.id).toBe(path.chapters[1].id)
  }
})
