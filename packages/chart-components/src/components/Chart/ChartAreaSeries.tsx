import React, { useMemo, useCallback } from 'react'
import { LayerOrder } from './ChartSurface/ChartSurface.constants'
import type { ChartLayerRenderer } from './ChartSurface/ChartSurface.types'
import { useChartLayer } from '../../utils/hooks/useChartLayer'
import { buildSeriesPath } from '../../utils/data/decimation'

export interface ChartAreaSeriesProps {
  dataKey: string
  color?: string
  opacity?: number
  show?: boolean
  /** Optional baseline value or dataKey to stack on top of another series */
  baseline?: number | string
}

/**
 * Fills the area under a series. Uses the same M4-decimated path as ChartLineSeries so the
 * filled outline matches the line exactly at any data size.
 */
export const ChartAreaSeries: React.FC<ChartAreaSeriesProps> = ({
  dataKey,
  color,
  opacity = 0.1,
  show = true,
  baseline
}) => {
  const draw = useCallback<ChartLayerRenderer>(
    (context, helpers) => {
      if (!show) {
        return
      }

      const { dataStore, viewRange, chartArea } = helpers
      const toY = (value: number) => helpers.getYPositionForKey(dataKey, value)
      const top = buildSeriesPath(
        dataStore,
        dataKey,
        viewRange.start,
        viewRange.end,
        chartArea.width,
        helpers.getXPosition,
        toY
      )
      if (top.count < 2) {
        return
      }

      context.save()
      context.globalAlpha = opacity
      context.fillStyle = color ?? helpers.colorForKey(dataKey)
      context.beginPath()

      if (typeof baseline === 'string') {
        // Stacked: fill between this series and the baseline series (both in this series' scale).
        const bottom = buildSeriesPath(
          dataStore,
          baseline,
          viewRange.start,
          viewRange.end,
          chartArea.width,
          helpers.getXPosition,
          toY
        )
        if (bottom.count < 2) {
          context.restore()
          return
        }
        context.moveTo(top.xs[0], top.ys[0])
        for (let i = 1; i < top.count; i += 1) context.lineTo(top.xs[i], top.ys[i])
        for (let i = bottom.count - 1; i >= 0; i -= 1) context.lineTo(bottom.xs[i], bottom.ys[i])
      } else {
        const baselineY = baseline === undefined ? chartArea.y + chartArea.height : toY(baseline)
        context.moveTo(top.xs[0], baselineY)
        for (let i = 0; i < top.count; i += 1) context.lineTo(top.xs[i], top.ys[i])
        context.lineTo(top.xs[top.count - 1], baselineY)
      }

      context.closePath()
      context.fill()
      context.restore()
    },
    [baseline, color, dataKey, opacity, show]
  )

  const layerOptions = useMemo(() => ({ order: LayerOrder.area }), [])
  useChartLayer(draw, layerOptions)

  return null
}
