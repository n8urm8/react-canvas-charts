import React, { useMemo, useCallback, useEffect } from 'react'
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
  /** Orientation of the bars. Default: 'vertical' */
  orientation?: 'vertical' | 'horizontal'
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
  groupGap = 2,
  orientation = 'vertical'
}) => {
  const { normalizedData, getYPositionForKey, getColorForKey, chartArea, getScaleDomain, getScaleIdForKey, registerHorizontalBars } = useChartSurface()

  useEffect(() => {
    if (orientation !== 'horizontal') return
    return registerHorizontalBars()
  }, [orientation, registerHorizontalBars])

  // For horizontal bars, map a value linearly onto the X axis (same formula as ChartXAxis valueScale)
  const getXPositionForValue = useCallback(
    (key: string, value: number): number => {
      const scaleId = getScaleIdForKey(key)
      const domain = getScaleDomain(scaleId)
      const range = domain.paddedMax - domain.paddedMin
      if (range === 0) return chartArea.x + chartArea.width / 2
      const normalized = Math.max(0, Math.min(1, (value - domain.paddedMin) / range))
      return chartArea.x + normalized * chartArea.width
    },
    [chartArea.x, chartArea.width, getScaleDomain, getScaleIdForKey]
  )

  const bars = useMemo(() => {
    if (normalizedData.length === 0) return []

    const dataCount = normalizedData.length
    const isGrouped = totalSeries !== undefined && totalSeries > 1 && seriesIndex !== undefined

    if (orientation === 'horizontal') {
      // Horizontal bars: bars extend from left to right
      const availableHeight = chartArea.height
      let calculatedBarHeight: number
      let yOffset = 0

      if (isGrouped) {
        // Grouped bars: divide category height among series
        const categoryHeight = availableHeight / dataCount
        const totalGroupGaps = (totalSeries - 1) * groupGap
        const availableForBars = categoryHeight - barGap - totalGroupGaps

        if (barWidth === 'auto') {
          calculatedBarHeight = Math.max(1, availableForBars / totalSeries)
        } else {
          calculatedBarHeight = barWidth // barWidth is used for bar thickness
        }

        // Calculate offset for this series within the group
        const groupHeight = totalSeries * calculatedBarHeight + totalGroupGaps
        const groupStartOffset = -groupHeight / 2
        yOffset = groupStartOffset + seriesIndex * (calculatedBarHeight + groupGap)
      } else {
        // Standard mode (stacked or overlapping)
        const categoryHeight = availableHeight / dataCount
        calculatedBarHeight = barWidth === 'auto' ? Math.max(1, categoryHeight - barGap) : barWidth
        yOffset = -calculatedBarHeight / 2
      }

      // Calculate Y position for categories (similar to how X position is calculated for vertical bars)
      const getCategoryYPosition = (index: number): number => {
        if (dataCount <= 1) {
          return chartArea.y + chartArea.height / 2
        }
        // For categorical data, center in equal-height bands with padding
        const segmentHeight = chartArea.height / (dataCount + 1)
        return chartArea.y + (index + 1) * segmentHeight
      }

      return normalizedData
        .map((datum, index) => {
          const value = datum.values[dataKey]
          if (value === null || !Number.isFinite(value)) {
            return null
          }

          let baselineX: number
          if (baseline === undefined) {
            // Default: bars start from left edge (represents paddedMin)
            baselineX = chartArea.x
          } else if (typeof baseline === 'number') {
            baselineX = getXPositionForValue(dataKey, baseline)
          } else {
            // Baseline from another dataKey (for stacking)
            const baselineValue = datum.values[baseline]
            if (baselineValue === null || !Number.isFinite(baselineValue)) {
              return null
            }
            baselineX = getXPositionForValue(dataKey, baselineValue)
          }

          const x = getXPositionForValue(dataKey, value)
          const barLength = Math.abs(x - baselineX)
          const categoryY = getCategoryYPosition(index)

          return {
            x: Math.min(x, baselineX),
            y: categoryY + yOffset,
            width: barLength,
            height: calculatedBarHeight
          }
        })
        .filter((bar): bar is { x: number; y: number; width: number; height: number } => bar !== null)
    } else {
      // Vertical bars: bars extend from bottom to top
      const availableWidth = chartArea.width
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
    }
  }, [
    baseline,
    barGap,
    barWidth,
    chartArea,
    dataKey,
    getYPositionForKey,
    getXPositionForValue,
    normalizedData,
    seriesIndex,
    totalSeries,
    groupGap,
    orientation
  ])

  const fillColor = useMemo(() => color ?? getColorForKey(dataKey), [color, dataKey, getColorForKey])

  const draw = useCallback<ChartLayerRenderer>(
    (context) => {
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
