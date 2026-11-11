import React, { useMemo, useCallback } from 'react'
import { renderChartPoint, type ChartPointProps } from './InternalComponents/ChartPoint'
import { LayerOrder } from './ChartSurface/ChartSurface.constants'
import type { ChartLayerRenderer } from './ChartSurface/ChartSurface.types'
import { useChartLayer } from '../../utils/hooks/useChartLayer'

export interface ChartPointSeriesProps extends ChartPointProps {
  dataKey: string
  sizeKey?: string // Key in data for bubble size
  minSize?: number // Minimum bubble size (default: 4)
  maxSize?: number // Maximum bubble size (default: 20)
  /**
   * Markers are skipped when more than this many points are in view (they would overlap into
   * a solid band anyway). Zoom in to see them. Default: 10,000.
   */
  maxRenderedPoints?: number
}

export const ChartPointSeries: React.FC<ChartPointSeriesProps> = ({
  dataKey,
  color,
  fillColor,
  sizeKey,
  minSize = 4,
  maxSize = 20,
  maxRenderedPoints = 10_000,
  ...pointProps
}) => {
  const draw = useCallback<ChartLayerRenderer>(
    (context, helpers) => {
      const { dataStore, viewRange } = helpers
      const visibleCount = viewRange.end - viewRange.start + 1
      if (visibleCount <= 0 || visibleCount > maxRenderedPoints) {
        return
      }

      const resolvedColor = color ?? helpers.colorForKey(dataKey)
      const resolvedFillColor = fillColor ?? resolvedColor

      // Bubble sizes: read from a column when available, else from the row record.
      const sizeColumn = sizeKey ? dataStore.column(sizeKey) : undefined
      const readSize = (index: number): number | undefined => {
        if (!sizeKey) return undefined
        const raw = sizeColumn ? sizeColumn[index] : dataStore.row(index)[sizeKey]
        return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined
      }

      let sizeScale: ((value: number) => number) | null = null
      if (sizeKey) {
        let minValue = Number.POSITIVE_INFINITY
        let maxValue = Number.NEGATIVE_INFINITY
        for (let index = viewRange.start; index <= viewRange.end; index += 1) {
          const size = readSize(index)
          if (size === undefined) continue
          if (size < minValue) minValue = size
          if (size > maxValue) maxValue = size
        }
        if (minValue <= maxValue) {
          const range = maxValue - minValue
          sizeScale =
            range === 0
              ? () => (minSize + maxSize) / 2
              : (value: number) => minSize + ((value - minValue) / range) * (maxSize - minSize)
        }
      }

      for (let index = viewRange.start; index <= viewRange.end; index += 1) {
        const value = dataStore.value(dataKey, index)
        if (Number.isNaN(value)) continue

        const size = readSize(index)
        renderChartPoint({
          context,
          x: helpers.getXPosition(index),
          y: helpers.getYPositionForKey(dataKey, value),
          value,
          index: index - viewRange.start,
          ...pointProps,
          size: size !== undefined && sizeScale ? sizeScale(size) : pointProps.size,
          color: resolvedColor,
          fillColor: resolvedFillColor
        })
      }
    },
    [color, dataKey, fillColor, maxRenderedPoints, maxSize, minSize, pointProps, sizeKey]
  )

  const layerOptions = useMemo(() => ({ order: LayerOrder.points }), [])
  useChartLayer(draw, layerOptions)

  return null
}
