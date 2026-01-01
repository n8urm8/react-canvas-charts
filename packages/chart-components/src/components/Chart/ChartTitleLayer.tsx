import React, { useMemo, useCallback } from 'react'
import { renderChartTitle, type ChartTitleProps, defaultChartTitleProps } from './InternalComponents/ChartTitle'
import { LayerOrder } from './ChartSurface/ChartSurface.constants'
import type { ChartLayerRenderer } from './ChartSurface/ChartSurface.types'
import { useChartLayer } from '../../utils/hooks/useChartLayer'

export const ChartTitleLayer: React.FC<ChartTitleProps> = ({
  title,
  position = defaultChartTitleProps.position,
  marginTop = defaultChartTitleProps.marginTop,
  marginBottom = defaultChartTitleProps.marginBottom,
  ...titleProps
}) => {
  const layerOptions = useMemo(() => ({ order: LayerOrder.background }), [])

  const draw = useCallback<ChartLayerRenderer>(
    (context, helpers) => {
      if (!title) {
        return
      }

      const y = position === 'bottom' ? helpers.canvasHeight - marginBottom : marginTop

      renderChartTitle({
        context,
        canvasWidth: helpers.canvasWidth,
        canvasHeight: helpers.canvasHeight,
        title,
        y,
        position,
        marginBottom,
        marginTop,
        ...titleProps
      })
    },
    [marginBottom, marginTop, position, title, titleProps]
  )

  useChartLayer(draw, layerOptions)

  return null
}
