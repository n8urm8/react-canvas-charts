import React, { useMemo, useCallback } from 'react'
import { renderChartLine, type ChartLineProps } from './InternalComponents/ChartLine'
import { LayerOrder } from './ChartSurface/ChartSurface.constants'
import type { ChartLayerRenderer } from './ChartSurface/ChartSurface.types'
import { useChartLayer } from '../../utils/hooks/useChartLayer'
import { buildSeriesPath } from '../../utils/data/decimation'

export interface ChartLineSeriesProps extends ChartLineProps {
  dataKey: string
  seriesIndex?: number
}

/**
 * Draws one series as a line. Data is read at draw time, so this component does not re-render
 * when data changes. Dense ranges are M4-decimated per pixel column, which keeps the exact
 * rendered shape (every spike and dip) while bounding work to ~4 vertices per pixel.
 */
export const ChartLineSeries: React.FC<ChartLineSeriesProps> = ({ dataKey, color, seriesIndex = 0, ...lineProps }) => {
  const draw = useCallback<ChartLayerRenderer>(
    (context, helpers) => {
      const { dataStore, viewRange, chartArea } = helpers
      const path = buildSeriesPath(
        dataStore,
        dataKey,
        viewRange.start,
        viewRange.end,
        chartArea.width,
        helpers.getXPosition,
        (value) => helpers.getYPositionForKey(dataKey, value)
      )

      renderChartLine({
        context,
        path,
        color: color ?? helpers.colorForKey(dataKey),
        index: seriesIndex,
        ...lineProps
      })
    },
    [color, dataKey, lineProps, seriesIndex]
  )

  const layerOptions = useMemo(() => ({ order: LayerOrder.series }), [])
  useChartLayer(draw, layerOptions)

  return null
}
