import type { ChartMargin, ValueDomain, ChartArea } from '../components/Chart/ChartSurface/ChartSurface.types'

/**
 * Checks if two arrays are shallowly equal
 */
export const shallowEqualArray = (a: number[], b: number[]): boolean => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

/**
 * Merges custom margin with default margin values
 */
export const mergeMargin = (custom: Partial<ChartMargin> | undefined, defaultMargin: ChartMargin): ChartMargin => ({
  top: custom?.top ?? defaultMargin.top,
  right: custom?.right ?? defaultMargin.right,
  bottom: custom?.bottom ?? defaultMargin.bottom,
  left: custom?.left ?? defaultMargin.left
})

/**
 * Computes a value domain with padding
 */
export const computeDomain = (minValue: number, maxValue: number): ValueDomain => {
  let min = minValue
  let max = maxValue

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    min = 0
    max = 1
  }

  if (min === max) {
    min -= 1
    max += 1
  }

  const range = max - min
  const padding = range === 0 ? 1 : range * 0.1

  return {
    min,
    max,
    paddedMin: min - padding,
    paddedMax: max + padding
  }
}

/**
 * Clamps a value to the chart area on the X axis
 */
export const clampXToChart = (value: number, chartArea: ChartArea): number => {
  const min = chartArea.x
  const max = chartArea.x + chartArea.width
  if (value <= min) return min
  if (value >= max) return max
  return value
}

/**
 * Checks if a point is within the chart area
 */
export const isWithinChart = (x: number, y: number, chartArea: ChartArea): boolean => {
  return (
    x >= chartArea.x && x <= chartArea.x + chartArea.width && y >= chartArea.y && y <= chartArea.y + chartArea.height
  )
}

/**
 * Gets the relative position of a point on a canvas, accounting for device pixel ratio
 */
export const getRelativePosition = (
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement
): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect()
  const devicePixelRatio = window.devicePixelRatio || 1
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = ((clientX - rect.left) * scaleX) / devicePixelRatio
  const y = ((clientY - rect.top) * scaleY) / devicePixelRatio
  return { x, y }
}
