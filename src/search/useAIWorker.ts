import { useCallback, useEffect, useRef, useState } from 'react'
import AIWorker from './worker?worker'

type Pending = {
  resolve: (value: Float32Array) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

export function useAIWorker() {
  const worker = useRef<Worker | null>(null)
  const pending = useRef(new Map<number, Pending>())
  const nextId = useRef(0)
  const mounted = useRef(false)
  const [status, setStatus] = useState('')
  const stop = useCallback((message: string) => {
    worker.current?.terminate()
    worker.current = null
    for (const item of pending.current.values()) {
      clearTimeout(item.timer)
      item.reject(new Error(message))
    }
    pending.current.clear()
  }, [])
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      stop('Search closed.')
    }
  }, [stop])

  const embed = useCallback(
    (text: string): Promise<Float32Array> => {
      if (!mounted.current)
        return Promise.reject(new Error('Search is not ready.'))
      if (!worker.current) {
        try {
          worker.current = new AIWorker()
          worker.current.onmessage = ({ data }) => {
            if (data.type === 'progress') {
              setStatus(
                data.status === 'ready'
                  ? 'Model ready'
                  : `Preparing local model${typeof data.progress === 'number' ? ` · ${Math.round(data.progress)}%` : '…'}`,
              )
              return
            }
            const request = pending.current.get(data.id)
            if (!request) return
            clearTimeout(request.timer)
            pending.current.delete(data.id)
            if (data.type === 'result') {
              setStatus('Model ready')
              request.resolve(data.embedding)
            } else request.reject(new Error(data.error))
          }
          worker.current.onerror = () => {
            stop('Local search stopped. Please retry.')
            setStatus('')
          }
          worker.current.onmessageerror = () => {
            stop('Could not read the local model response. Please retry.')
            setStatus('')
          }
        } catch {
          return Promise.reject(
            new Error('Your browser could not start local search.'),
          )
        }
      }
      return new Promise((resolve, reject) => {
        const id = ++nextId.current
        const timer = setTimeout(
          () => stop('Local search timed out. Please retry.'),
          180_000,
        )
        pending.current.set(id, { resolve, reject, timer })
        try {
          worker.current!.postMessage({ id, text })
        } catch {
          stop('Could not start local search. Please retry.')
        }
      })
    },
    [stop],
  )
  return { embed, status }
}
