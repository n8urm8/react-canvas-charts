import type { ChartDataStore } from './chartData.types'

export interface HitTestGeometry {
  store: ChartDataStore
  keys: string[]
  /** Inclusive visible index range. */
  start: number
  end: number
  getX: (index: number) => number
  /** Inverse of getX: fractional index at a pixel x. */
  getIndexAt: (x: number) => number
  getYForKey: (key: string, value: number) => number
}

export interface IndexedHit {
  index: number
  key: string
  seriesIndex: number
  value: number
  x: number
  y: number
  distance: number
}

/** Above this many indices inside the snap window, columns are searched via min/max summaries. */
const BRUTE_FORCE_LIMIT = 4096

const clampIndex = (geometry: HitTestGeometry, index: number) =>
  Math.max(geometry.start, Math.min(geometry.end, index))

/** Nearest visible data index to a pixel x (no snapping radius applied). */
export const nearestIndexAtX = (geometry: HitTestGeometry, x: number): number | null => {
  if (geometry.end < geometry.start) return null
  return clampIndex(geometry, Math.round(geometry.getIndexAt(x)))
}

const bestSeriesAtIndex = (geometry: HitTestGeometry, index: number, pointerY: number): IndexedHit | null => {
  let best: IndexedHit | null = null
  geometry.keys.forEach((key, seriesIndex) => {
    const value = geometry.store.value(key, index)
    if (Number.isNaN(value)) return
    const y = geometry.getYForKey(key, value)
    const dy = Math.abs(y - pointerY)
    if (!best || dy < Math.abs(best.y - pointerY)) {
      best = { index, key, seriesIndex, value, x: geometry.getX(index), y, distance: 0 }
    }
  })
  return best
}

/**
 * Finds the data point closest to the pointer within `snapRadius` pixels.
 *
 * - `snapAlongYAxis === false`: only horizontal distance counts (O(1) via the index ↔ pixel map).
 * - `snapAlongYAxis === true`: true 2D distance. Small windows are scanned directly; dense windows
 *   are narrowed per pixel column using min/max summaries, then refined inside the winning column,
 *   so cost stays bounded no matter how many samples share a pixel.
 */
export const findNearestIndexedPoint = (
  geometry: HitTestGeometry,
  pointerX: number,
  pointerY: number,
  snapRadius: number,
  snapAlongYAxis: boolean
): IndexedHit | null => {
  const { start, end, store, keys } = geometry
  if (end < start || keys.length === 0) return null

  if (!snapAlongYAxis) {
    const center = nearestIndexAtX(geometry, pointerX)
    if (center === null) return null
    // Walk outwards in case the nearest index has no finite values.
    for (let offset = 0; offset <= 64; offset += 1) {
      for (const candidate of offset === 0 ? [center] : [center - offset, center + offset]) {
        if (candidate < start || candidate > end) continue
        const dx = Math.abs(geometry.getX(candidate) - pointerX)
        if (dx > snapRadius) continue
        const hit = bestSeriesAtIndex(geometry, candidate, pointerY)
        if (hit) return { ...hit, distance: dx }
      }
    }
    return null
  }

  const first = clampIndex(geometry, Math.ceil(geometry.getIndexAt(pointerX - snapRadius)))
  const last = clampIndex(geometry, Math.floor(geometry.getIndexAt(pointerX + snapRadius)))
  if (last < first) return null

  const radiusSq = snapRadius * snapRadius
  let best: IndexedHit | null = null
  let bestDistSq = radiusSq

  const consider = (index: number, key: string, seriesIndex: number) => {
    const value = store.value(key, index)
    if (Number.isNaN(value)) return
    const x = geometry.getX(index)
    const y = geometry.getYForKey(key, value)
    const dx = x - pointerX
    const dy = y - pointerY
    const distSq = dx * dx + dy * dy
    if (distSq <= bestDistSq) {
      bestDistSq = distSq
      best = { index, key, seriesIndex, value, x, y, distance: Math.sqrt(distSq) }
    }
  }

  if (last - first + 1 <= BRUTE_FORCE_LIMIT) {
    for (let index = first; index <= last; index += 1) {
      keys.forEach((key, seriesIndex) => consider(index, key, seriesIndex))
    }
    return best
  }

  // Dense: bound each one-pixel column by its min/max (a lower bound on the distance to any of
  // its samples), then refine columns in order of that bound until none can beat the best hit.
  const candidates: Array<{ bound: number; from: number; to: number; key: string; seriesIndex: number }> = []
  const leftPx = Math.floor(pointerX - snapRadius)
  const rightPx = Math.ceil(pointerX + snapRadius)

  for (let px = leftPx; px < rightPx; px += 1) {
    const from = Math.max(first, Math.ceil(geometry.getIndexAt(px)))
    const to = Math.min(last + 1, Math.ceil(geometry.getIndexAt(px + 1)))
    if (to <= from) continue
    const xA = geometry.getX(from)
    const xB = geometry.getX(to - 1)
    const dx = pointerX < xA ? xA - pointerX : pointerX > xB ? pointerX - xB : 0

    keys.forEach((key, seriesIndex) => {
      const { min, max } = store.extent(key, from, to)
      if (!(min <= max)) return
      const yA = geometry.getYForKey(key, min)
      const yB = geometry.getYForKey(key, max)
      const low = Math.min(yA, yB)
      const high = Math.max(yA, yB)
      const dy = pointerY < low ? low - pointerY : pointerY > high ? pointerY - high : 0
      const bound = dx * dx + dy * dy
      if (bound <= radiusSq) {
        candidates.push({ bound, from, to, key, seriesIndex })
      }
    })
  }

  candidates.sort((a, b) => a.bound - b.bound)
  for (const candidate of candidates) {
    if (candidate.bound > bestDistSq) break
    for (let index = candidate.from; index < candidate.to; index += 1) {
      consider(index, candidate.key, candidate.seriesIndex)
    }
  }
  return best
}
