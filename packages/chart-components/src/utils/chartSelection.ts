import type {
  ChartSelectionResult,
  ChartSelectionSeriesRange
} from '../components/Chart/ChartSurface/ChartSurface.types'
import type { ChartDataStore, ChartViewRange } from './data/chartData.types'
import { clampXToChart } from './chartCalculations'

const MIN_SELECTION_WIDTH = 4

/**
 * Finds the closest index in an array of label positions using binary search
 */
export const findClosestIndex = (target: number, labelPositions: number[]): number => {
  let low = 0
  let high = labelPositions.length - 1

  while (low <= high) {
    const mid = (low + high) >> 1
    const position = labelPositions[mid]
    if (position === target) {
      return mid
    }
    if (position < target) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  if (low >= labelPositions.length) {
    return labelPositions.length - 1
  }
  if (high < 0) {
    return 0
  }

  return Math.abs(labelPositions[low] - target) < Math.abs(labelPositions[high] - target) ? low : high
}

/**
 * Computes a selection result from raw start and end X coordinates.
 * Indices in the result are absolute data indices (they include the view range offset).
 */
export const computeSelectionResult = (
  rawStartX: number,
  rawEndX: number,
  getIndexAt: (x: number) => number,
  view: ChartViewRange,
  store: ChartDataStore,
  resolvedYKeys: string[],
  chartArea: { x: number; width: number }
): ChartSelectionResult | null => {
  if (view.end < view.start) {
    return null
  }

  const startClamped = clampXToChart(rawStartX, { ...chartArea, y: 0, height: 0 })
  const endClamped = clampXToChart(rawEndX, { ...chartArea, y: 0, height: 0 })
  const startX = Math.min(startClamped, endClamped)
  const endX = Math.max(startClamped, endClamped)

  if (endX - startX < MIN_SELECTION_WIDTH) {
    return null
  }

  const toIndex = (x: number) => Math.max(view.start, Math.min(view.end, Math.round(getIndexAt(x))))
  const minIndex = toIndex(startX)
  const maxIndex = toIndex(endX)

  const minLabel = store.label(minIndex)
  const maxLabel = store.label(maxIndex)
  const toValue = (key: string, index: number) => {
    const value = store.value(key, index)
    return Number.isNaN(value) ? null : value
  }

  const seriesSelections: Record<string, ChartSelectionSeriesRange> = {}

  resolvedYKeys.forEach((key) => {
    seriesSelections[key] = {
      min: { index: minIndex, label: minLabel, value: toValue(key, minIndex) },
      max: { index: maxIndex, label: maxLabel, value: toValue(key, maxIndex) }
    }
  })

  return {
    minIndex,
    maxIndex,
    minLabel,
    maxLabel,
    series: seriesSelections,
    rangePixels: { start: startX, end: endX }
  }
}

export { MIN_SELECTION_WIDTH }
