import { LocalCompanion } from '../src/companion/localAI'

const mockCreate = jest.fn()
const mockTerminate = jest.fn()
let mockWorker: EventTarget
jest.mock('../src/companion/worker?worker', () => ({
  __esModule: true,
  default: class extends EventTarget {
    constructor() {
      super()
      mockWorker = this
    }
    terminate = mockTerminate
  },
}))
jest.mock('@mlc-ai/web-llm', () => ({
  CreateWebWorkerMLCEngine: jest.fn(async () => ({
    chat: { completions: { create: mockCreate } },
  })),
}))

const reply = {
  intent: 'plan',
  minutes: 25,
  energy: 'low',
  message: 'One small step.',
}
async function* chunks() {
  const content = JSON.stringify(reply)
  yield { choices: [{ delta: { content: content.slice(0, 30) } }] }
  yield { choices: [{ delta: { content: content.slice(30) } }] }
}

beforeEach(() => {
  Object.defineProperty(navigator, 'gpu', { configurable: true, value: {} })
  mockCreate.mockReset().mockImplementation(async () => chunks())
})
afterEach(() => jest.useRealTimers())

test('setup checks generation, then streamed messages produce a validated intent', async () => {
  const runtime = new LocalCompanion()
  const progress = jest.fn()
  await runtime.load(progress)
  expect(progress).toHaveBeenCalledWith(1, 'Checking the first response…')
  expect(mockCreate).toHaveBeenCalledTimes(1)
  const activity = jest.fn()
  await expect(
    runtime.interpret('Plan 25 minutes', '{}', [], activity),
  ).resolves.toEqual(reply)
  expect(activity).toHaveBeenLastCalledWith(2)
  runtime.dispose()
})

test('download alone does not mark a model with broken generation as ready', async () => {
  mockCreate.mockRejectedValue(new Error('GPU failed'))
  const runtime = new LocalCompanion()
  await expect(runtime.load(jest.fn())).rejects.toThrow('GPU failed')
  runtime.dispose()
})

test('a stalled stream times out and frees the worker', async () => {
  jest.useFakeTimers()
  const runtime = new LocalCompanion()
  await runtime.load(jest.fn())
  mockCreate.mockResolvedValue({
    [Symbol.asyncIterator]: () => ({ next: () => new Promise(() => {}) }),
  })
  const response = runtime.interpret('Hello', '{}', [])
  const rejected = expect(response).rejects.toThrow('Local AI took too long')
  await jest.advanceTimersByTimeAsync(30_000)
  await rejected
  expect(mockTerminate).toHaveBeenCalled()
})

test('worker crashes immediately release pending generation', async () => {
  const runtime = new LocalCompanion()
  await runtime.load(jest.fn())
  mockCreate.mockImplementation(() => new Promise(() => {}))
  const response = runtime.interpret('Hello', '{}', [])
  mockWorker.dispatchEvent(new Event('error'))
  await expect(response).rejects.toThrow('Local AI stopped')
  expect(mockTerminate).toHaveBeenCalled()
})
