import { checkStorageRules, parseStoredStories, STARTER_STORAGE_RULES } from '../src/features/code/storageStateModel'

describe('local storage state project', () => {
  it('checks add, restore, and remove transitions', () => {
    expect(checkStorageRules(STARTER_STORAGE_RULES).cases.map((item) => item.pass)).toEqual([false, true, false])
    expect(checkStorageRules({ saveOnAdd: true, restoreOnMount: true, syncOnRemove: true }).pass).toBe(true)
  })
  it('recovers safely from invalid stored values', () => {
    expect(parseStoredStories('{broken')).toEqual([])
    expect(parseStoredStories('{"unexpected":1}')).toEqual([])
    expect(parseStoredStories('["First",4,"Second"]')).toEqual(['First', 'Second'])
  })
})
