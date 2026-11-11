import type { ChartDataStore } from './chartData.types'

/**
 * Vertices of a series path in pixel space. `decimated` is true when the path was reduced
 * with M4 bucketing (so curve smoothing should be skipped).
 */
export interface SeriesPath {
  xs: Float64Array
  ys: Float64Array
  count: number
  decimated: boolean
}

/** Series with at most this many samples per pixel column are drawn point-for-point. */
const RAW_SAMPLES_PER_PIXEL = 2

/** Max raw steps taken to find the first/last finite sample of a bucket before falling back. */
const EDGE_SEARCH_LIMIT = 64

/**
 * Builds the pixel-space path of one series over the inclusive index range `[start, end]`.
 *
 * Dense ranges are reduced with M4 decimation: every pixel column keeps the first, min, max and
 * last sample of the indices that fall in it, at their real positions and in time order. The
 * result is a subsequence of the raw polyline that covers the same pixels in every column, so
 * spikes, dips and the overall shape are preserved while the vertex count is bounded at
 * 4 × width regardless of data size. Min/max (and where they occur) come from the store's
 * min/max pyramid, so cost is O(width × log n).
 *
 * Missing values (NaN) are skipped and the line is connected across them.
 */
export const buildSeriesPath = (
  store: ChartDataStore,
  key: string,
  start: number,
  end: number,
  pixelWidth: number,
  getX: (index: number) => number,
  getY: (value: number) => number
): SeriesPath => {
  const count = end - start + 1
  if (count <= 0) {
    return { xs: new Float64Array(0), ys: new Float64Array(0), count: 0, decimated: false }
  }

  const columns = Math.max(1, Math.floor(pixelWidth))

  if (count <= columns * RAW_SAMPLES_PER_PIXEL) {
    const xs = new Float64Array(count)
    const ys = new Float64Array(count)
    let written = 0
    for (let index = start; index <= end; index += 1) {
      const value = store.value(key, index)
      if (Number.isNaN(value)) continue
      xs[written] = getX(index)
      ys[written] = getY(value)
      written += 1
    }
    return { xs, ys, count: written, decimated: false }
  }

  const xs = new Float64Array(columns * 4)
  const ys = new Float64Array(columns * 4)
  let written = 0
  let lastWrittenIndex = -1

  // Emits a real sample (its true x and y). Indices arrive in increasing order per bucket.
  const emit = (index: number, value: number) => {
    if (index === lastWrittenIndex) return
    lastWrittenIndex = index
    xs[written] = getX(index)
    ys[written] = getY(value)
    written += 1
  }

  const bucketIndices = [0, 0, 0, 0]

  for (let column = 0; column < columns; column += 1) {
    const bucketStart = start + Math.floor((column * count) / columns)
    const bucketEnd = start + Math.floor(((column + 1) * count) / columns) // exclusive
    if (bucketEnd <= bucketStart) continue

    const { min, max, minIndex, maxIndex } = store.indexedExtent(key, bucketStart, bucketEnd)
    if (!(min <= max) || minIndex < 0 || maxIndex < 0) continue // bucket is entirely NaN

    let firstIndex = minIndex < maxIndex ? minIndex : maxIndex
    for (let index = bucketStart; index < bucketEnd && index < bucketStart + EDGE_SEARCH_LIMIT; index += 1) {
      if (!Number.isNaN(store.value(key, index))) {
        firstIndex = index
        break
      }
    }
    let lastIndex = minIndex > maxIndex ? minIndex : maxIndex
    for (let index = bucketEnd - 1; index >= bucketStart && index > bucketEnd - 1 - EDGE_SEARCH_LIMIT; index -= 1) {
      if (!Number.isNaN(store.value(key, index))) {
        lastIndex = index
        break
      }
    }

    // M4: first, min, max and last samples of the bucket, connected in time order. Every vertex
    // is a real sample, so the path is a subsequence of the raw polyline.
    bucketIndices[0] = firstIndex
    bucketIndices[1] = minIndex < maxIndex ? minIndex : maxIndex
    bucketIndices[2] = minIndex < maxIndex ? maxIndex : minIndex
    bucketIndices[3] = lastIndex
    if (bucketIndices[1] < bucketIndices[0]) bucketIndices[0] = bucketIndices[1]
    if (bucketIndices[2] > bucketIndices[3]) bucketIndices[3] = bucketIndices[2]

    for (let k = 0; k < 4; k += 1) {
      const index = bucketIndices[k]
      const value = index === minIndex ? min : index === maxIndex ? max : store.value(key, index)
      emit(index, value)
    }
  }

  return { xs, ys, count: written, decimated: true }
}
