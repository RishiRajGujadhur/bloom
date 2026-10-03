import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { visionCamera } from '../src/features/arcade/games/visionCamera'

jest.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: { forVisionTasks: jest.fn() },
  HandLandmarker: { createFromOptions: jest.fn() },
}))
const create = HandLandmarker.createFromOptions as jest.Mock
const files = FilesetResolver.forVisionTasks as jest.Mock
const media = jest.fn()
const stream = () => { const stop = jest.fn(); return { stop, value: { getTracks: () => [{ stop }] } as unknown as MediaStream } }
const preview = () => ({ srcObject: null, readyState: 2, play: jest.fn().mockResolvedValue(undefined), pause: jest.fn() }) as unknown as HTMLVideoElement

beforeEach(() => {
  jest.clearAllMocks(); create.mockReset(); media.mockReset()
  files.mockResolvedValue({})
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: media } })
})

test.each([1, 2] as const)('camera configures %i hand(s), falls back to CPU, and releases owned resources', async (hands) => {
  const source = stream(), video = preview(), close = jest.fn()
  media.mockResolvedValue(source.value)
  create.mockRejectedValueOnce(new Error('GPU unavailable')).mockResolvedValueOnce({ detectForVideo: () => ({ landmarks: [[]] }), close })
  const camera = visionCamera(video, hands)
  expect(await camera.start()).toBe(true)
  expect(create.mock.calls[1][1]).toMatchObject({ numHands: hands, runningMode: 'VIDEO', minHandDetectionConfidence: .4, baseOptions: { delegate: 'CPU' } })
  expect(camera.detect(100)).toEqual([[]])
  camera.stop()
  expect(source.stop).toHaveBeenCalledTimes(1)
  expect(close).toHaveBeenCalledTimes(1)
  expect(video.srcObject).toBeNull()
})

test('an older cancelled request cannot clear the replacement camera preview', async () => {
  let rejectOld!: (error: Error) => void
  media.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectOld = reject }))
  const source = stream(), video = preview()
  const old = visionCamera(video)
  const pending = old.start()
  old.stop()
  media.mockResolvedValueOnce(source.value)
  create.mockResolvedValueOnce({ detectForVideo: () => ({ landmarks: [] }), close: jest.fn() })
  const replacement = visionCamera(video)
  expect(await replacement.start()).toBe(true)
  rejectOld(new Error('Old request failed'))
  await expect(pending).rejects.toThrow('Old request failed')
  expect(video.srcObject).toBe(source.value)
  expect(source.stop).not.toHaveBeenCalled()
  replacement.stop()
})
