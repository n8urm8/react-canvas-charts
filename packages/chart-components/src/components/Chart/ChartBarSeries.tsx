import React, { useMemo, useCallback } from 'react'
import { LayerOrder } from './ChartSurface/ChartSurface.constants'
import type { ChartLayerRenderer } from './ChartSurface/ChartSurface.types'
import { useChartSurface } from '../../utils/context/ChartSurfaceContext'
import { useChartLayer } from '../../utils/hooks/useChartLayer'

export interface ChartBarSeriesProps {
  dataKey: string
  color?: string
  opacity?: number
  show?: boolean
  barWidth?: number | 'auto'
  barGap?: number
  baseline?: number | string
  /** Index of this series within a group (for grouped bars). 0-based. */
  seriesIndex?: number
  /** Total number of series in the group (for grouped bars) */
  totalSeries?: number
  /** Gap between bars within a group (for grouped bars). Default: 2 */
  groupGap?: number
}

export const ChartBarSeries: React.FC<ChartBarSeriesProps> = ({
  dataKey,
  color,
  opacity = 1,
  show = true,
  barWidth = 'auto',
  barGap = 4,
  baseline,
  seriesIndex,
  totalSeries,
  groupGap = 2
}) => {
  const { normalizedData, getYPositionForKey, getColorForKey, chartArea } = useChartSurface()

  const bars = useMemo(() => {
    if (normalizedData.length === 0) return []

    // Calculate bar width
    const dataCount = normalizedData.length
    const availableWidth = chartArea.width

    // Determine if we're in grouped bar mode
    const isGrouped = totalSeries !== undefined && totalSeries > 1 && seriesIndex !== undefined

    let calculatedBarWidth: number
    let xOffset = 0

    if (isGrouped) {
      // Grouped bars: divide category width among series
      const categoryWidth = availableWidth / dataCount
      const totalGroupGaps = (totalSeries - 1) * groupGap
      const availableForBars = categoryWidth - barGap - totalGroupGaps

      if (barWidth === 'auto') {
        calculatedBarWidth = Math.max(1, availableForBars / totalSeries)
      } else {
        calculatedBarWidth = barWidth
      }

      // Calculate offset for this series within the group
      // Center the group, then offset each bar
      const groupWidth = totalSeries * calculatedBarWidth + totalGroupGaps
      const groupStartOffset = -groupWidth / 2
      xOffset = groupStartOffset + seriesIndex * (calculatedBarWidth + groupGap)
    } else {
      // Standard mode (stacked or overlapping)
      const categoryWidth = availableWidth / dataCount
      calculatedBarWidth = barWidth === 'auto' ? Math.max(1, categoryWidth - barGap) : barWidth
      xOffset = -calculatedBarWidth / 2
    }

    return normalizedData
      .map((datum) => {
        const value = datum.values[dataKey]
        if (value === null || !Number.isFinite(value)) {
          return null
        }

        let baselineY: number
        if (baseline === undefined) {
          // Default: bars start from bottom of chart
          baselineY = chartArea.y + chartArea.height
        } else if (typeof baseline === 'number') {
          // Fixed baseline value
          baselineY = getYPositionForKey(dataKey, baseline)
        } else {
          // Baseline from another dataKey (for stacking)
          const baselineValue = datum.values[baseline]
          if (baselineValue === null || !Number.isFinite(baselineValue)) {
            return null
          }
          baselineY = getYPositionForKey(dataKey, baselineValue)
        }

        const y = getYPositionForKey(dataKey, value)
        const barHeight = Math.abs(baselineY - y)

        return {
          x: datum.x + xOffset,
          y: Math.min(y, baselineY),
          width: calculatedBarWidth,
          height: barHeight
        }
      })
      .filter((bar): bar is { x: number; y: number; width: number; height: number } => bar !== null)
  }, [
    baseline,
    barGap,
    barWidth,
    chartArea,
    dataKey,
    getYPositionForKey,
    normalizedData,
    seriesIndex,
    totalSeries,
    groupGap
  ])

  const fillColor = useMemo(() => color ?? getColorForKey(dataKey), [color, dataKey, getColorForKey])

  const draw = useCallback<ChartLayerRenderer>(
    (context, _helpers) => {
      if (!show || bars.length === 0) {
        return
      }

      context.save()
      context.globalAlpha = opacity
      context.fillStyle = fillColor

      bars.forEach((bar) => {
        context.fillRect(bar.x, bar.y, bar.width, bar.height)
      })

      context.restore()
    },
    [bars, fillColor, opacity, show]
  )

  const layerOptions = useMemo(() => ({ order: LayerOrder.series }), [])
  useChartLayer(draw, layerOptions)

  return null
}
