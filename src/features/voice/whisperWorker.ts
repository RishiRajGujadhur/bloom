import { env, pipeline } from '@xenova/transformers'

env.allowLocalModels = false
env.useBrowserCache = true
env.backends.onnx.wasm.numThreads = 1

type Transcriber = (audio: Float32Array, options: Record<string, unknown>) => Promise<{ text: string; chunks?: { text: string; timestamp: [number, number | null] }[] }>
let model: Promise<Transcriber> | undefined

function getModel() {
  if (!model) {
    model = (pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
      quantized: true,
      progress_callback: (p: { status: string; progress?: number }) =>
        self.postMessage({ type: 'progress', status: p.status, progress: p.progress }),
    }) as unknown as Promise<Transcriber>).catch((error) => {
      model = undefined
      throw error
    })
  }
  return model
}

self.onmessage = async (event: MessageEvent<{ id: number; audio: Float32Array }>) => {
  const { id, audio } = event.data
  try {
    const transcribe = await getModel()
    const out = await transcribe(audio, { chunk_length_s: 30, stride_length_s: 5, return_timestamps: true })
    self.postMessage({
      type: 'result',
      id,
      text: out.text.trim(),
      chunks: (out.chunks ?? []).map((c) => ({ text: c.text.trim(), start: c.timestamp[0], end: c.timestamp[1] })),
    })
  } catch {
    // Never echo audio or text in errors.
    self.postMessage({ type: 'error', id, error: 'Transcription could not run. Check your connection for the first model download, then retry.' })
  }
}
