import { generateRandomWalk, type GenerateRequest, type GeneratedChunk } from './timeSeriesBuffer'

/** Batches at or below this size are generated synchronously (faster than a worker round-trip). */
const SYNC_LIMIT = 50_000

let worker: Worker | null = null
let workerUnavailable = false
let nextRequestId = 1
const pending = new Map<number, { resolve: (chunk: GeneratedChunk) => void; reject: (error: unknown) => void }>()

const getWorker = (): Worker | null => {
  if (workerUnavailable || typeof Worker === 'undefined') {
    return null
  }
  if (!worker) {
    try {
      worker = new Worker(new URL('./timeSeries.worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (event: MessageEvent<{ id: number; chunk: GeneratedChunk }>) => {
        const entry = pending.get(event.data.id)
        pending.delete(event.data.id)
        entry?.resolve(event.data.chunk)
      }
      worker.onerror = (event) => {
        workerUnavailable = true
        pending.forEach((entry) => entry.reject(event))
        pending.clear()
        worker?.terminate()
        worker = null
      }
    } catch {
      workerUnavailable = true
      return null
    }
  }
  return worker
}

/**
 * Generates random-walk samples. Large batches run in a Web Worker and the typed arrays are
 * transferred back, so generating 10M+ points never blocks the UI thread.
 */
export const generateTimeSeries = (request: GenerateRequest): Promise<GeneratedChunk> => {
  const target = request.count > SYNC_LIMIT ? getWorker() : null
  if (!target) {
    return Promise.resolve(generateRandomWalk(request))
  }

  return new Promise<GeneratedChunk>((resolve, reject) => {
    const id = nextRequestId++
    pending.set(id, { resolve, reject })
    target.postMessage({ id, ...request })
  }).catch(() => generateRandomWalk(request))
}
