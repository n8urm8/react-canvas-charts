import React, { useMemo, useCallback } from 'react'
import { renderChartPoint, type ChartPointProps } from './InternalComponents/ChartPoint'
import { LayerOrder } from './ChartSurface/ChartSurface.constants'
import type { ChartLayerRenderer } from './ChartSurface/ChartSurface.types'
import { useChartSurface } from '../../utils/context/ChartSurfaceContext'
import { useChartLayer } from '../../utils/hooks/useChartLayer'

export interface ChartPointSeriesProps extends ChartPointProps {
  dataKey: string
  sizeKey?: string // Key in data for bubble size
  minSize?: number // Minimum bubble size (default: 4)
  maxSize?: number // Maximum bubble size (default: 20)
}

export const ChartPointSeries: React.FC<ChartPointSeriesProps> = ({
  dataKey,
  color,
  fillColor,
  sizeKey,
  minSize = 4,
  maxSize = 20,
  ...pointProps
}) => {
  const { normalizedData, getYPositionForKey, getColorForKey } = useChartSurface()

  const points = useMemo(
    () =>
      normalizedData
        .map((datum) => {
          const value = datum.values[dataKey]
          if (value === null || !Number.isFinite(value)) {
            return null
          }

          let size = pointProps.size
          if (sizeKey) {
            const sizeValue = datum.raw[sizeKey]
            if (typeof sizeValue === 'number' && Number.isFinite(sizeValue)) {
              size = sizeValue
            }
          }

          return {
            x: datum.x,
            y: getYPositionForKey(dataKey, value),
            value,
            size
          }
        })
        .filter((point): point is { x: number; y: number; value: number; size?: number } => point !== null),
    [dataKey, getYPositionForKey, normalizedData, pointProps.size, sizeKey]
  )

  // Calculate size scaling if using sizeKey
  const sizeScale = useMemo(() => {
    if (!sizeKey) return null

    const sizes = points.map((p) => p.size).filter((s): s is number => s !== undefined)
    if (sizes.length === 0) return null

    const minValue = Math.min(...sizes)
    const maxValue = Math.max(...sizes)
    const range = maxValue - minValue

    if (range === 0) {
      return (value: number) => (minSize + maxSize) / 2
    }

    return (value: number) => minSize + ((value - minValue) / range) * (maxSize - minSize)
  }, [points, sizeKey, minSize, maxSize])

  const resolvedColor = useMemo(() => color ?? getColorForKey(dataKey), [color, dataKey, getColorForKey])

  const resolvedFillColor = useMemo(() => fillColor ?? resolvedColor, [fillColor, resolvedColor])

  const draw = useCallback<ChartLayerRenderer>(
    (context) => {
      points.forEach((point, index) => {
        const scaledSize = point.size !== undefined && sizeScale ? sizeScale(point.size) : pointProps.size

        renderChartPoint({
          context,
          x: point.x,
          y: point.y,
          value: point.value,
          index,
          ...pointProps,
          size: scaledSize,
          color: resolvedColor,
          fillColor: resolvedFillColor
        })
      })
    },
    [pointProps, points, resolvedColor, resolvedFillColor, sizeScale, sizeKey]
  )

  const layerOptions = useMemo(() => ({ order: LayerOrder.points }), [])
  useChartLayer(draw, layerOptions)

  return null
}
