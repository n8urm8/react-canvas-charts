import type { ChartSurfaceRenderHelpers } from '../components/Chart/ChartSurface/ChartSurface.types'

export interface HorizontalBarHoverMatch {
  index: number
  categoryY: number
  maxBarTipX: number
}

/**
 * Returns the horizontal bar category under the pointer when within snap radius.
 * Mirrors ChartBarSeries horizontal geometry so cursor/tooltip hit tests stay aligned.
 */
export function findHorizontalBarHoverMatch(
  helpers: ChartSurfaceRenderHelpers,
  pointerX: number,
  pointerY: number,
  snapRadius: number
): HorizontalBarHoverMatch | null {
  const dataCount = helpers.normalizedData.length
  if (dataCount <= 0) {
    return null
  }

  const getCategoryY = (index: number): number => {
    if (dataCount <= 1) return helpers.chartArea.y + helpers.chartArea.height / 2
    const segmentHeight = helpers.chartArea.height / (dataCount + 1)
    return helpers.chartArea.y + (index + 1) * segmentHeight
  }

  const halfBand = helpers.chartArea.height / (dataCount + 1) / 2

  const getBarTipX = (key: string, value: number): number => {
    const scaleId = helpers.getScaleIdForKey(key)
    const domain = helpers.getScaleDomain(scaleId)
    const range = domain.paddedMax - domain.paddedMin
    if (range === 0) return helpers.chartArea.x + helpers.chartArea.width / 2
    const normalized = Math.max(0, Math.min(1, (value - domain.paddedMin) / range))
    return helpers.chartArea.x + normalized * helpers.chartArea.width
  }

  for (let index = 0; index < dataCount; index++) {
    const datum = helpers.normalizedData[index]
    const categoryY = getCategoryY(index)

    if (Math.abs(pointerY - categoryY) > halfBand) {
      continue
    }

    let maxBarTipX = helpers.chartArea.x
    for (const [key, value] of Object.entries(datum.values)) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        continue
      }

      const tipX = getBarTipX(key, value)
      if (tipX > maxBarTipX) {
        maxBarTipX = tipX
      }
    }

    if (pointerX >= helpers.chartArea.x - snapRadius && pointerX <= maxBarTipX + snapRadius) {
      return { index, categoryY, maxBarTipX }
    }
  }

  return null
}
