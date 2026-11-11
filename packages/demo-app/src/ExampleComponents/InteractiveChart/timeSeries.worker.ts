/// <reference lib="webworker" />
import { generateRandomWalk, type GenerateRequest } from './timeSeriesBuffer'

type WorkerRequest = GenerateRequest & { id: number }

const scope = self as unknown as DedicatedWorkerGlobalScope

scope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, ...request } = event.data
  const chunk = generateRandomWalk(request)
  // Transfer the buffers instead of copying them (zero-copy hand-off to the main thread).
  const transfer: Transferable[] = [chunk.x.buffer, ...Object.values(chunk.series).map((column) => column.buffer)]
  scope.postMessage({ id, chunk }, transfer)
}
