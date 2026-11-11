import { formatTimeLabel } from './utils'

/** Sample spacing of the simulated feed. */
export const SAMPLE_INTERVAL_MS = 1000

/**
 * Column-oriented, append-only storage for the simulated time series.
 *
 * - `x` holds timestamps (ms), each series holds Float32 values: 8 + 4 bytes per series per sample.
 * - Arrays are over-allocated and grow by doubling, so appends are amortised O(1) and the chart
 *   can extend its min/max index incrementally (array identity is unchanged between appends).
 * - Points dropped by a max-points limit are skipped via `offset` and physically removed by
 *   `compactTimeSeries` once they take up as much space as the live data.
 */
export interface TimeSeriesBuffer {
  x: Float64Array
  series: Record<string, Float32Array>
  seriesIds: string[]
  /** Number of samples written. */
  length: number
  /** Index of the first live sample (earlier samples have been dropped). */
  offset: number
  /** Last value of each series, used to continue the random walk. */
  lastValues: Record<string, number>
  /** Timestamp of the next sample. */
  nextTimestamp: number
}

/** Raw output of a generation run (also what the worker posts back). */
export interface GeneratedChunk {
  x: Float64Array
  series: Record<string, Float32Array>
  lastValues: Record<string, number>
  nextTimestamp: number
}

export interface GenerateRequest {
  count: number
  seriesIds: string[]
  startValues: Record<string, number>
  startTimestamp: number
}

const MIN_CAPACITY = 1024

export const defaultStartValue = (seriesIndex: number) => 50 + seriesIndex * 15

/** Random walk generator shared by the main thread (small batches) and the worker (large ones). */
export const generateRandomWalk = ({ count, seriesIds, startValues, startTimestamp }: GenerateRequest): GeneratedChunk => {
  const safeCount = Math.max(0, Math.floor(count))
  const x = new Float64Array(safeCount)
  for (let index = 0; index < safeCount; index += 1) {
    x[index] = startTimestamp + index * SAMPLE_INTERVAL_MS
  }

  const series: Record<string, Float32Array> = {}
  const lastValues: Record<string, number> = {}
  seriesIds.forEach((seriesId, seriesIndex) => {
    const column = new Float32Array(safeCount)
    let value = startValues[seriesId] ?? defaultStartValue(seriesIndex)
    for (let index = 0; index < safeCount; index += 1) {
      value = Math.max(0, Math.round((value + (Math.random() - 0.5) * 20) * 10) / 10)
      column[index] = value
    }
    series[seriesId] = column
    lastValues[seriesId] = value
  })

  return { x, series, lastValues, nextTimestamp: startTimestamp + safeCount * SAMPLE_INTERVAL_MS }
}

/** Wraps a freshly generated chunk as a buffer (no copy). */
export const bufferFromChunk = (chunk: GeneratedChunk, seriesIds: string[]): TimeSeriesBuffer => ({
  x: chunk.x,
  series: chunk.series,
  seriesIds,
  length: chunk.x.length,
  offset: 0,
  lastValues: chunk.lastValues,
  nextTimestamp: chunk.nextTimestamp
})

/** Request that continues an existing buffer's walk for `count` more samples. */
export const continuationRequest = (buffer: TimeSeriesBuffer, count: number): GenerateRequest => ({
  count,
  seriesIds: buffer.seriesIds,
  startValues: buffer.lastValues,
  startTimestamp: buffer.nextTimestamp
})

/** Request for a brand new dataset whose last sample is "now". */
export const freshRequest = (seriesIds: string[], count: number): GenerateRequest => ({
  count,
  seriesIds,
  startValues: Object.fromEntries(seriesIds.map((id, index) => [id, defaultStartValue(index)])),
  startTimestamp: Date.now() - Math.max(0, count - 1) * SAMPLE_INTERVAL_MS
})

const grow = (buffer: TimeSeriesBuffer, required: number): TimeSeriesBuffer => {
  if (required <= buffer.x.length) {
    return buffer
  }
  const capacity = Math.max(MIN_CAPACITY, required, buffer.x.length * 2)
  const x = new Float64Array(capacity)
  x.set(buffer.x.subarray(0, buffer.length))
  const series: Record<string, Float32Array> = {}
  buffer.seriesIds.forEach((id) => {
    const column = new Float32Array(capacity).fill(Number.NaN)
    column.set(buffer.series[id].subarray(0, buffer.length))
    series[id] = column
  })
  return { ...buffer, x, series }
}

/**
 * Appends a chunk. Writes in place when capacity allows (same array identities), otherwise
 * reallocates with doubled capacity. Always returns a new buffer object for React state.
 */
export const appendChunk = (buffer: TimeSeriesBuffer, chunk: GeneratedChunk): TimeSeriesBuffer => {
  const count = chunk.x.length
  if (count === 0) {
    return buffer
  }
  const target = grow(buffer, buffer.length + count)
  target.x.set(chunk.x, buffer.length)
  target.seriesIds.forEach((id) => {
    target.series[id].set(chunk.series[id], buffer.length)
  })
  return {
    ...target,
    length: buffer.length + count,
    lastValues: chunk.lastValues,
    nextTimestamp: chunk.nextTimestamp
  }
}

/** Marks samples beyond `maxPoints` (oldest first) as dropped. `maxPoints <= 0` means unlimited. */
export const applyMaxPoints = (buffer: TimeSeriesBuffer, maxPoints: number): TimeSeriesBuffer => {
  if (maxPoints <= 0) {
    return buffer
  }
  const offset = Math.max(buffer.offset, buffer.length - maxPoints)
  return offset === buffer.offset ? buffer : { ...buffer, offset }
}

/**
 * Moves live samples to the start of new arrays once dropped samples occupy at least as much
 * space as live ones. Returns the index shift (0 when nothing was compacted) so callers can
 * re-base stored indices (zoom ranges, selectors, tags).
 */
export const compactTimeSeries = (buffer: TimeSeriesBuffer): { buffer: TimeSeriesBuffer; shift: number } => {
  const live = buffer.length - buffer.offset
  if (buffer.offset < MIN_CAPACITY * 64 || buffer.offset < live) {
    return { buffer, shift: 0 }
  }

  const capacity = Math.max(MIN_CAPACITY, live * 2)
  const x = new Float64Array(capacity)
  x.set(buffer.x.subarray(buffer.offset, buffer.length))
  const series: Record<string, Float32Array> = {}
  buffer.seriesIds.forEach((id) => {
    const column = new Float32Array(capacity).fill(Number.NaN)
    column.set(buffer.series[id].subarray(buffer.offset, buffer.length))
    series[id] = column
  })

  return {
    buffer: { ...buffer, x, series, length: live, offset: 0 },
    shift: buffer.offset
  }
}

/** Shared scratch Date for label formatting. */
export const labelDate = new Date()

/** Approximate bytes held by the buffer's arrays (including spare capacity). */
export const bufferByteSize = (buffer: TimeSeriesBuffer): number =>
  buffer.x.byteLength + buffer.seriesIds.reduce((total, id) => total + (buffer.series[id]?.byteLength ?? 0), 0)

/** Row-shaped sample of the first live points, used for the code preview. */
export const sampleRecords = (buffer: TimeSeriesBuffer, count: number) => {
  const records: Array<Record<string, number | string>> = []
  const end = Math.min(buffer.length, buffer.offset + count)
  for (let index = buffer.offset; index < end; index += 1) {
    labelDate.setTime(buffer.x[index])
    const record: Record<string, number | string> = { label: formatTimeLabel(labelDate) }
    buffer.seriesIds.forEach((id) => {
      record[id] = buffer.series[id][index]
    })
    records.push(record)
  }
  return records
}
