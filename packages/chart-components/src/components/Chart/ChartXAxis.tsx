import React, { useMemo, useEffect, useCallback } from 'react'
import { renderChartAxis, type ChartAxisProps, defaultChartAxisProps } from './components/ChartAxis'
import { LayerOrder, useChartLayer, useChartSurface, type ChartLayerRenderer } from './ChartSurface'

export interface ChartXAxisProps extends ChartAxisProps {
  position?: 'bottom' | 'top'
}

const computeTickDescriptor = (
  labelCount: number,
  labelPositions: number[],
  labels: string[],
  tickStep?: number,
  maxTicks?: number
) => {
  if (labelCount === 0) {
    return { indices: [] as number[], positions: [] as number[], labels: [] as string[] }
  }

  const normalizedStep = Math.max(1, Math.round(tickStep ?? defaultChartAxisProps.tickStep) || 1)
  const normalizedMaxTicks = maxTicks ?? defaultChartAxisProps.maxTicks
  const autoStep =
    Number.isFinite(normalizedMaxTicks) && normalizedMaxTicks > 0
      ? Math.max(1, Math.ceil(labelCount / normalizedMaxTicks))
      : 1
  const effectiveStep = Math.max(normalizedStep, autoStep)

  const indices: number[] = []
  for (let index = 0; index < labelCount; index += 1) {
    const isEdge = index === 0 || index === labelCount - 1
    if (isEdge || index % effectiveStep === 0) {
      indices.push(index)
    }
  }

  const positions = indices.map((index) => labelPositions[index])
  const tickLabels = indices.map((index) => labels[index] ?? '')

  return { indices, positions, labels: tickLabels }
}

export const ChartXAxis: React.FC<ChartXAxisProps> = ({ position = 'bottom', ...axisProps }) => {
  const { labels, labelPositions, chartArea, canvasSize, setAxisTicks } = useChartSurface()

  const layerOptions = useMemo(() => ({ order: LayerOrder.axes }), [])

  const tickDescriptor = useMemo(
    () => computeTickDescriptor(labels.length, labelPositions, labels, axisProps.tickStep, axisProps.maxTicks),
    [axisProps.maxTicks, axisProps.tickStep, labelPositions, labels]
  )

  // Set axis ticks synchronously before paint to ensure grid alignment on first paint
  React.useLayoutEffect(() => {
    setAxisTicks('x', tickDescriptor)
  }, [setAxisTicks, tickDescriptor])

  useEffect(() => {
    return () => {
      setAxisTicks('x', null)
    }
  }, [setAxisTicks])

  const draw = useCallback<ChartLayerRenderer>(
    (context) => {
      const isBottom = position === 'bottom'
      const startY = isBottom ? chartArea.y + chartArea.height : chartArea.y

      renderChartAxis({
        context,
        type: 'x',
        startX: chartArea.x,
        startY,
        endX: chartArea.x + chartArea.width,
        endY: startY,
        labels,
        labelPositions,
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
        orientation: position === 'bottom' ? 'bottom' : 'top',
        ...axisProps
      })
    },
    [
      axisProps,
      canvasSize.height,
      canvasSize.width,
      chartArea.height,
      chartArea.width,
      chartArea.x,
      chartArea.y,
      labelPositions,
      labels,
      position
    ]
  )

  useChartLayer(draw, layerOptions)

  return null
}
