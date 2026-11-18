import type { ChartViewRange } from './data/chartData.types'

export interface ComputeZoomedViewRangeInput {
  /** The range currently in view (inclusive, absolute indices). */
  current: ChartViewRange
  /** Total number of samples in the chart's data. */
  dataLength: number
  /** Smallest allowed visible span, in data points. Clamped to what the data can support. */
  minSpan: number
  /** Fractional absolute index that should stay under the pointer (or between the fingers). */
  anchor: number
  /** Multiplier applied to the visible span. Below 1 zooms in, above 1 zooms out. */
  spanScale: number
  /** Fractional indices to pan the view by. Positive values move the view toward higher indices. */
  shift: number
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

/**
 * Computes the next inclusive view range for a zoom and/or pan step.
 *
 * The anchor index keeps its relative position inside the window, so zooming with the pointer
 * over a spot keeps that spot under the pointer. The result is always whole indices within the
 * data bounds, matching what `ChartSurface` accepts for `viewRange`.
 */
export const computeZoomedViewRange = ({
  current,
  dataLength,
  minSpan,
  anchor,
  spanScale,
  shift
}: ComputeZoomedViewRangeInput): ChartViewRange => {
  const maxIndex = dataLength - 1
  if (maxIndex <= 0) {
    return current
  }

  const currentSpan = current.end - current.start
  const effectiveMinSpan = clamp(Math.round(minSpan), 1, maxIndex)
  const span = clamp(currentSpan * spanScale, effectiveMinSpan, maxIndex)
  // Position of the anchor inside the current window, so it keeps the same relative position.
  const ratio = currentSpan > 0 ? (anchor - current.start) / currentSpan : 0.5

  const wholeSpan = Math.round(span)
  const start = clamp(Math.round(anchor - ratio * span + shift), 0, maxIndex - wholeSpan)

  return { start, end: start + wholeSpan }
}

/** True when two inclusive ranges describe the same window. */
export const isSameViewRange = (a: ChartViewRange, b: ChartViewRange): boolean =>
  a.start === b.start && a.end === b.end
