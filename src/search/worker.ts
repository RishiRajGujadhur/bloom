import {
  env,
  pipeline,
  type FeatureExtractionPipeline,
} from '@xenova/transformers'

env.allowLocalModels = false
env.useBrowserCache = true
// Single-thread WASM also works without cross-origin isolation headers.
env.backends.onnx.wasm.numThreads = 1
let extractor: Promise<FeatureExtractionPipeline> | undefined

function getExtractor() {
  if (!extractor) {
    extractor = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
      progress_callback: (progress: { status: string; progress?: number }) => {
        self.postMessage({
          type: 'progress',
          status: progress.status,
          progress: progress.progress,
        })
      },
    }).catch((error) => {
      extractor = undefined
      throw error
    })
  }
  return extractor
}

// Serialize inference: concurrent ONNX runs can fail on the same session.
let queue = Promise.resolve()
self.onmessage = (event: MessageEvent<{ id: number; text: string }>) => {
  const { id, text } = event.data
  queue = queue.then(async () => {
    try {
      if (!text.trim()) throw new Error('Please enter some text.')
      const model = await getExtractor()
      // Chunk long pages so reflections beyond the model's token limit contribute.
      const chunks = text.match(/.{1,320}(?:\s|$)|.{1,320}/gs) ?? [text]
      const vector = new Float32Array(384)
      for (const chunk of chunks) {
        const result = await model(chunk, { pooling: 'mean', normalize: true })
        const values = result.data as Float32Array
        for (let i = 0; i < vector.length; i++)
          vector[i] += values[i] / chunks.length
      }
      const norm = Math.hypot(...vector)
      if (norm) for (let i = 0; i < vector.length; i++) vector[i] /= norm
      self.postMessage({ type: 'result', id, embedding: vector })
    } catch {
      // Never include journal text in error messages or logs.
      self.postMessage({
        type: 'error',
        id,
        error:
          'The local model could not run. Check your connection for the first download, then retry.',
      })
    }
  })
}
