import type { ValueDomain, ChartMargin } from './ChartSurface.types'

/**
 * Default color palette for chart series
 */
export const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

/**
 * Default margin for chart area
 */
export const DEFAULT_MARGIN: ChartMargin = {
  top: 40,
  right: 40,
  bottom: 48,
  left: 56
}

/**
 * Default value domain used as fallback
 */
export const DEFAULT_VALUE_DOMAIN: ValueDomain = {
  min: 0,
  max: 1,
  paddedMin: -0.1,
  paddedMax: 1.1
}

/**
 * Width of each Y-axis band in pixels
 */
export const Y_AXIS_BAND_WIDTH = 48

/**
 * Layer rendering order constants
 */
export const LayerOrder = {
  background: 0,
  grid: 10,
  area: 20,
  series: 30,
  points: 40,
  axes: 50,
  overlays: 60,
  tooltip: 70
} as const
