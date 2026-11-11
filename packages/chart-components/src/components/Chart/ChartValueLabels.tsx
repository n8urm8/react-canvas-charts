import React, { useMemo, useCallback } from 'react'
import { renderChartLabel, type ChartLabelProps } from './InternalComponents/ChartLabel'
import { LayerOrder } from './ChartSurface/ChartSurface.constants'
import type { ChartLayerRenderer } from './ChartSurface/ChartSurface.types'
import { useChartLayer } from '../../utils/hooks/useChartLayer'

export interface ChartValueLabelsProps extends ChartLabelProps {
  dataKey: string
  /** Labels are skipped when more than this many points are in view. Default: 1,000. */
  maxRenderedLabels?: number
}

export const ChartValueLabels: React.FC<ChartValueLabelsProps> = ({
  dataKey,
  maxRenderedLabels = 1_000,
  ...labelProps
}) => {
  const draw = useCallback<ChartLayerRenderer>(
    (context, helpers) => {
      const { dataStore, viewRange } = helpers
      const visibleCount = viewRange.end - viewRange.start + 1
      if (visibleCount <= 0 || visibleCount > maxRenderedLabels) {
        return
      }

      for (let index = viewRange.start; index <= viewRange.end; index += 1) {
        const value = dataStore.value(dataKey, index)
        if (Number.isNaN(value)) continue

        renderChartLabel({
          context,
          x: helpers.getXPosition(index),
          y: helpers.getYPositionForKey(dataKey, value),
          value,
          index: index - viewRange.start,
          width: 0,
          height: 0,
          ...labelProps
        })
      }
    },
    [dataKey, labelProps, maxRenderedLabels]
  )

  const layerOptions = useMemo(() => ({ order: LayerOrder.points }), [])
  useChartLayer(draw, layerOptions)

  return null
}
