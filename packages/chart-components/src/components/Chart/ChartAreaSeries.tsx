import React, { useMemo, useCallback } from 'react'
import { LayerOrder } from './ChartSurface/ChartSurface.constants'
import type { ChartLayerRenderer } from './ChartSurface/ChartSurface.types'
import { useChartSurface } from '../../utils/context/ChartSurfaceContext'
import { useChartLayer } from '../../utils/hooks/useChartLayer'

export interface ChartAreaSeriesProps {
  dataKey: string
  color?: string
  opacity?: number
  show?: boolean
  /** Optional baseline value or dataKey to stack on top of another series */
  baseline?: number | string
}

export const ChartAreaSeries: React.FC<ChartAreaSeriesProps> = ({
  dataKey,
  color,
  opacity = 0.1,
  show = true,
  baseline
}) => {
  const { normalizedData, getYPositionForKey, getColorForKey, chartArea } = useChartSurface()

  const points = useMemo(
    () =>
      normalizedData
        .map((datum) => {
          const value = datum.values[dataKey]
          if (value === null || !Number.isFinite(value)) {
            return null
          }

          let baselineY: number
          if (baseline === undefined) {
            // Default: fill from bottom of chart
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

          return {
            x: datum.x,
            y: getYPositionForKey(dataKey, value),
            baselineY
          }
        })
        .filter((point): point is { x: number; y: number; baselineY: number } => point !== null),
    [baseline, chartArea, dataKey, getYPositionForKey, normalizedData]
  )

  const fillColor = useMemo(() => color ?? getColorForKey(dataKey), [color, dataKey, getColorForKey])

  const draw = useCallback<ChartLayerRenderer>(
    (context, _helpers) => {
      if (!show || points.length < 2) {
        return
      }

      context.save()
      context.globalAlpha = opacity
      context.fillStyle = fillColor

      context.beginPath()
      // Start at the first baseline point
      context.moveTo(points[0].x, points[0].baselineY)
      // Draw to the top line
      points.forEach((point) => {
        context.lineTo(point.x, point.y)
      })
      // Draw back along the baseline in reverse
      for (let i = points.length - 1; i >= 0; i--) {
        context.lineTo(points[i].x, points[i].baselineY)
      }
      context.closePath()
      context.fill()
      context.restore()
    },
    [fillColor, opacity, points, show]
  )

  const layerOptions = useMemo(() => ({ order: LayerOrder.area }), [])
  useChartLayer(draw, layerOptions)

  return null
}
