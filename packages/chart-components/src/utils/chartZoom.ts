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

/** Smallest visible value span, as a fraction of the scale's full extent. */
const MIN_VALUE_SPAN_FRACTION = 0.01

/** A value window in the padded units the surface draws. */
export interface ValueWindow {
  min: number
  max: number
}

export interface ComputeZoomedValueWindowInput {
  /** The padded window the axis currently draws. */
  current: ValueWindow
  /** The padded extent of all the scale's data. The window never leaves it. */
  limits: ValueWindow
  /** The padded span of the automatic domain. Zooming out to at least this span returns to automatic. */
  autoSpan: number
  /** Value that should stay under the pointer. */
  anchor: number
  /** Multiplier applied to the visible span. Below 1 zooms in, above 1 zooms out. */
  spanScale: number
  /** Value units to pan by. Positive values move the window toward higher values. */
  shift: number
}

/**
 * Computes the next padded window for a zoom and/or pan step on a value axis.
 *
 * Returns `null` when a zoom-out reaches the automatic span. That means the axis should go back to
 * its automatic domain, so it keeps following the data. A pure pan (`spanScale` of 1) never does that,
 * so panning an axis that is already wider than its automatic domain keeps the window.
 */
export const computeZoomedValueWindow = ({
  current,
  limits,
  autoSpan,
  anchor,
  spanScale,
  shift
}: ComputeZoomedValueWindowInput): ValueWindow | null => {
  const maxSpan = limits.max - limits.min
  const currentSpan = current.max - current.min
  if (!(maxSpan > 0) || !(currentSpan > 0)) {
    return null
  }

  const span = clamp(currentSpan * spanScale, maxSpan * MIN_VALUE_SPAN_FRACTION, maxSpan)
  if (spanScale > 1 && span >= autoSpan * (1 - 1e-9)) {
    return null
  }

  // Keep the anchor at the same relative position inside the window.
  const ratio = (anchor - current.min) / currentSpan
  const min = clamp(anchor - ratio * span + shift, limits.min, limits.max - span)
  return { min, max: min + span }
}
