import type {
  ChartSelectionResult,
  NormalizedDatum,
  ChartSelectionSeriesRange
} from '../components/Chart/ChartSurface/ChartSurface.types'
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
 * Computes a selection result from raw start and end X coordinates
 */
export const computeSelectionResult = (
  rawStartX: number,
  rawEndX: number,
  labelPositions: number[],
  labels: string[],
  normalizedData: NormalizedDatum[],
  resolvedYKeys: string[],
  chartArea: { x: number; width: number }
): ChartSelectionResult | null => {
  if (labelPositions.length === 0) {
    return null
  }

  const startClamped = clampXToChart(rawStartX, { ...chartArea, y: 0, height: 0 })
  const endClamped = clampXToChart(rawEndX, { ...chartArea, y: 0, height: 0 })
  const startX = Math.min(startClamped, endClamped)
  const endX = Math.max(startClamped, endClamped)

  if (endX - startX < MIN_SELECTION_WIDTH) {
    return null
  }

  const startIndex = findClosestIndex(startX, labelPositions)
  const endIndex = findClosestIndex(endX, labelPositions)
  const minIndex = Math.min(startIndex, endIndex)
  const maxIndex = Math.max(startIndex, endIndex)

  const startDatum = normalizedData[minIndex]
  const endDatum = normalizedData[maxIndex]

  const seriesSelections: Record<string, ChartSelectionSeriesRange> = {}

  resolvedYKeys.forEach((key) => {
    seriesSelections[key] = {
      min: {
        index: minIndex,
        label: startDatum?.label ?? labels[minIndex] ?? '',
        value: startDatum?.values[key] ?? null
      },
      max: {
        index: maxIndex,
        label: endDatum?.label ?? labels[maxIndex] ?? '',
        value: endDatum?.values[key] ?? null
      }
    }
  })

  return {
    minIndex,
    maxIndex,
    minLabel: labels[minIndex] ?? '',
    maxLabel: labels[maxIndex] ?? '',
    series: seriesSelections,
    rangePixels: { start: startX, end: endX }
  }
}

export { MIN_SELECTION_WIDTH }
