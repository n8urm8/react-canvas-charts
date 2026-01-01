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
}

export const ChartAreaSeries: React.FC<ChartAreaSeriesProps> = ({ dataKey, color, opacity = 0.1, show = true }) => {
  const { normalizedData, getYPositionForKey, getColorForKey } = useChartSurface()

  const points = useMemo(
    () =>
      normalizedData
        .map((datum) => {
          const value = datum.values[dataKey]
          if (value === null || !Number.isFinite(value)) {
            return null
          }
          return {
            x: datum.x,
            y: getYPositionForKey(dataKey, value)
          }
        })
        .filter((point): point is { x: number; y: number } => point !== null),
    [dataKey, getYPositionForKey, normalizedData]
  )

  const fillColor = useMemo(() => color ?? getColorForKey(dataKey), [color, dataKey, getColorForKey])

  const draw = useCallback<ChartLayerRenderer>(
    (context, helpers) => {
      if (!show || points.length < 2) {
        return
      }

      context.save()
      context.globalAlpha = opacity
      context.fillStyle = fillColor

      context.beginPath()
      context.moveTo(points[0].x, helpers.chartArea.y + helpers.chartArea.height)
      points.forEach((point) => {
        context.lineTo(point.x, point.y)
      })
      context.lineTo(points[points.length - 1].x, helpers.chartArea.y + helpers.chartArea.height)
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
