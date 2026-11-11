import type { NumericColumn } from './chartData.types'

/**
 * Number of raw samples summarised by one block of the finest pyramid level.
 * Smaller = faster partial-block scans, larger = less memory. 16 keeps the
 * pyramid at ~1/4 of the column size while bounding raw scans to 2×16 samples.
 */
const BASE_BLOCK = 16

/** Ranges at or below this size are scanned directly instead of via the pyramid. */
const DIRECT_SCAN_LIMIT = BASE_BLOCK * 8

type FloatArray = Float32Array | Float64Array

interface PyramidLevel {
  blockSize: number
  mins: FloatArray
  maxs: FloatArray
}

export interface ValueExtent {
  min: number
  max: number
}

/** Extent plus the (earliest) indices where the min and max occur; -1 when the range is empty. */
export interface IndexedValueExtent extends ValueExtent {
  minIndex: number
  maxIndex: number
}

/**
 * Hierarchical min/max index over a numeric column.
 *
 * Level k stores the min and max of every block of `BASE_BLOCK * 2^k` samples, so the
 * exact min/max of any index range can be answered in O(log n + BASE_BLOCK) instead of O(n).
 * NaN values are treated as gaps and ignored.
 *
 * The index supports append-only growth of the underlying column: calling `update(length)`
 * with a larger length only recomputes the blocks touched by the new samples.
 */
export class MinMaxPyramid {
  private levels: PyramidLevel[] = []
  private capacity = 0
  private builtLength = 0
  private readonly useFloat32: boolean

  constructor(private readonly column: NumericColumn) {
    this.useFloat32 = column instanceof Float32Array
  }

  /** Brings the index up to date with the first `length` samples of the column. */
  update(length: number): void {
    if (length < this.builtLength) {
      this.reset()
    }
    if (length === this.builtLength) {
      return
    }

    if (length > this.capacity) {
      // Grow geometrically and rebuild; amortised O(1) per appended sample.
      this.allocate(Math.max(length, this.capacity * 2, 1024))
      this.builtLength = 0
    }

    const column = this.column
    let fromBlock = Math.floor(this.builtLength / BASE_BLOCK)
    let blockCount = Math.ceil(length / BASE_BLOCK)

    const base = this.levels[0]
    for (let block = fromBlock; block < blockCount; block += 1) {
      let min = Number.POSITIVE_INFINITY
      let max = Number.NEGATIVE_INFINITY
      const end = Math.min(length, (block + 1) * BASE_BLOCK)
      for (let index = block * BASE_BLOCK; index < end; index += 1) {
        const value = column[index]
        if (value < min) min = value
        if (value > max) max = value
      }
      base.mins[block] = min
      base.maxs[block] = max
    }

    for (let level = 1; level < this.levels.length; level += 1) {
      const current = this.levels[level]
      const below = this.levels[level - 1]
      const belowCount = blockCount
      fromBlock >>= 1
      blockCount = Math.ceil(belowCount / 2)

      for (let block = fromBlock; block < blockCount; block += 1) {
        const left = block * 2
        const right = left + 1
        let min = below.mins[left]
        let max = below.maxs[left]
        if (right < belowCount) {
          if (below.mins[right] < min) min = below.mins[right]
          if (below.maxs[right] > max) max = below.maxs[right]
        }
        current.mins[block] = min
        current.maxs[block] = max
      }
    }

    this.builtLength = length
  }

  /**
   * Exact min/max over `[start, end)`. Returns `{ min: Infinity, max: -Infinity }` when the
   * range holds no finite values. Callers must call `update` with a length >= `end` first.
   */
  extent(start: number, end: number): ValueExtent {
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    const column = this.column
    let index = Math.max(0, start)
    const stop = Math.min(end, this.builtLength)

    // Leading partial block.
    while (index < stop && index % BASE_BLOCK !== 0) {
      const value = column[index]
      if (value < min) min = value
      if (value > max) max = value
      index += 1
    }

    // Greedily take the largest aligned block that fits.
    const levels = this.levels
    while (index + BASE_BLOCK <= stop) {
      let level = 0
      while (level + 1 < levels.length) {
        const nextSize = levels[level + 1].blockSize
        if (index % nextSize !== 0 || index + nextSize > stop) break
        level += 1
      }
      const { blockSize, mins, maxs } = levels[level]
      const block = index / blockSize
      if (mins[block] < min) min = mins[block]
      if (maxs[block] > max) max = maxs[block]
      index += blockSize
    }

    // Trailing partial block.
    while (index < stop) {
      const value = column[index]
      if (value < min) min = value
      if (value > max) max = value
      index += 1
    }

    return { min, max }
  }

  /**
   * Like `extent`, but also returns the earliest index of the min and of the max. The winning
   * blocks are resolved by descending the pyramid, so the cost stays O(log n + BASE_BLOCK).
   */
  extentWithIndex(start: number, end: number): IndexedValueExtent {
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    // Where the current min/max came from: raw index (level -1) or a pyramid block.
    let minLevel = -1
    let minRef = -1
    let maxLevel = -1
    let maxRef = -1
    const column = this.column
    let index = Math.max(0, start)
    const stop = Math.min(end, this.builtLength)

    const takeRaw = (i: number) => {
      const value = column[i]
      if (value < min) {
        min = value
        minLevel = -1
        minRef = i
      }
      if (value > max) {
        max = value
        maxLevel = -1
        maxRef = i
      }
    }

    while (index < stop && index % BASE_BLOCK !== 0) {
      takeRaw(index)
      index += 1
    }

    const levels = this.levels
    while (index + BASE_BLOCK <= stop) {
      let level = 0
      while (level + 1 < levels.length) {
        const nextSize = levels[level + 1].blockSize
        if (index % nextSize !== 0 || index + nextSize > stop) break
        level += 1
      }
      const { blockSize, mins, maxs } = levels[level]
      const block = index / blockSize
      if (mins[block] < min) {
        min = mins[block]
        minLevel = level
        minRef = block
      }
      if (maxs[block] > max) {
        max = maxs[block]
        maxLevel = level
        maxRef = block
      }
      index += blockSize
    }

    while (index < stop) {
      takeRaw(index)
      index += 1
    }

    return {
      min,
      max,
      minIndex: this.resolveIndex(minLevel, minRef, min, 'min'),
      maxIndex: this.resolveIndex(maxLevel, maxRef, max, 'max')
    }
  }

  /** Descends from a pyramid block to the earliest raw index holding `target`. */
  private resolveIndex(level: number, ref: number, target: number, kind: 'min' | 'max'): number {
    if (ref < 0) return -1
    if (level < 0) return ref

    let block = ref
    for (let current = level; current > 0; current -= 1) {
      const below = this.levels[current - 1]
      const values = kind === 'min' ? below.mins : below.maxs
      const left = block * 2
      block = values[left] === target ? left : left + 1
    }

    const from = block * BASE_BLOCK
    const to = Math.min(this.builtLength, from + BASE_BLOCK)
    for (let i = from; i < to; i += 1) {
      if (this.column[i] === target) return i
    }
    return from
  }

  private reset(): void {
    this.levels = []
    this.capacity = 0
    this.builtLength = 0
  }

  private allocate(capacity: number): void {
    const ArrayType = this.useFloat32 ? Float32Array : Float64Array
    const levels: PyramidLevel[] = []
    for (let blockSize = BASE_BLOCK; ; blockSize *= 2) {
      const blocks = Math.ceil(capacity / blockSize)
      levels.push({ blockSize, mins: new ArrayType(blocks), maxs: new ArrayType(blocks) })
      if (blocks <= 1) break
    }
    this.levels = levels
    this.capacity = capacity
  }
}

const pyramidCache = new WeakMap<object, MinMaxPyramid>()

/** Scans `[start, end)` directly, ignoring NaN. */
export const scanExtent = (column: NumericColumn, start: number, end: number): ValueExtent => {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  for (let index = start; index < end; index += 1) {
    const value = column[index]
    if (value < min) min = value
    if (value > max) max = value
  }
  return { min, max }
}

/**
 * Exact min/max of `column[start..end)` (NaN ignored), using a cached pyramid for large ranges.
 * `length` is the number of valid samples in the column (columns may be over-allocated buffers).
 */
export const columnExtent = (column: NumericColumn, length: number, start: number, end: number): ValueExtent => {
  const safeStart = Math.max(0, start)
  const safeEnd = Math.min(end, length)
  if (safeEnd <= safeStart) {
    return { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }
  }
  if (safeEnd - safeStart <= DIRECT_SCAN_LIMIT || typeof column !== 'object') {
    return scanExtent(column, safeStart, safeEnd)
  }

  let pyramid = pyramidCache.get(column)
  if (!pyramid) {
    pyramid = new MinMaxPyramid(column)
    pyramidCache.set(column, pyramid)
  }
  pyramid.update(length)
  return pyramid.extent(safeStart, safeEnd)
}

/** Brute-force indexed extent over `[start, end)`. */
export const scanIndexedExtent = (column: NumericColumn, start: number, end: number): IndexedValueExtent => {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  let minIndex = -1
  let maxIndex = -1
  for (let index = start; index < end; index += 1) {
    const value = column[index]
    if (value < min) {
      min = value
      minIndex = index
    }
    if (value > max) {
      max = value
      maxIndex = index
    }
  }
  return { min, max, minIndex, maxIndex }
}

/** Like `columnExtent`, but also reports where the min and max occur. */
export const columnIndexedExtent = (
  column: NumericColumn,
  length: number,
  start: number,
  end: number
): IndexedValueExtent => {
  const safeStart = Math.max(0, start)
  const safeEnd = Math.min(end, length)
  if (safeEnd <= safeStart) {
    return { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY, minIndex: -1, maxIndex: -1 }
  }
  if (safeEnd - safeStart <= DIRECT_SCAN_LIMIT || typeof column !== 'object') {
    return scanIndexedExtent(column, safeStart, safeEnd)
  }

  let pyramid = pyramidCache.get(column)
  if (!pyramid) {
    pyramid = new MinMaxPyramid(column)
    pyramidCache.set(column, pyramid)
  }
  pyramid.update(length)
  return pyramid.extentWithIndex(safeStart, safeEnd)
}

/** Drops the cached pyramid for a column, e.g. after values were rewritten in place. */
export const invalidateColumnExtent = (column: NumericColumn): void => {
  pyramidCache.delete(column)
}
