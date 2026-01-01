import React, { useMemo, useCallback } from 'react'
import { renderChartPoint, type ChartPointProps } from './InternalComponents/ChartPoint'
import { LayerOrder } from './ChartSurface/ChartSurface.constants'
import type { ChartLayerRenderer } from './ChartSurface/ChartSurface.types'
import { useChartSurface } from '../../utils/context/ChartSurfaceContext'
import { useChartLayer } from '../../utils/hooks/useChartLayer'

export interface ChartPointSeriesProps extends ChartPointProps {
  dataKey: string
}

export const ChartPointSeries: React.FC<ChartPointSeriesProps> = ({ dataKey, color, fillColor, ...pointProps }) => {
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
            y: getYPositionForKey(dataKey, value),
            value
          }
        })
        .filter((point): point is { x: number; y: number; value: number } => point !== null),
    [dataKey, getYPositionForKey, normalizedData]
  )

  const resolvedColor = useMemo(() => color ?? getColorForKey(dataKey), [color, dataKey, getColorForKey])

  const resolvedFillColor = useMemo(() => fillColor ?? resolvedColor, [fillColor, resolvedColor])

  const draw = useCallback<ChartLayerRenderer>(
    (context) => {
      points.forEach((point, index) => {
        renderChartPoint({
          context,
          x: point.x,
          y: point.y,
          value: point.value,
          index,
          ...pointProps,
          color: resolvedColor,
          fillColor: resolvedFillColor
        })
      })
    },
    [pointProps, points, resolvedColor, resolvedFillColor]
  )

  const layerOptions = useMemo(() => ({ order: LayerOrder.points }), [])
  useChartLayer(draw, layerOptions)

  return null
}
