import React, { useMemo, useEffect, useCallback } from 'react'
import { renderChartAxis, type ChartAxisProps, defaultChartAxisProps } from './InternalComponents/ChartAxis'
import { LayerOrder } from './ChartSurface/ChartSurface.constants'
import type { ChartLayerRenderer } from './ChartSurface/ChartSurface.types'
import { useChartSurface } from '../../utils/context/ChartSurfaceContext'
import { useChartLayer } from '../../utils/hooks/useChartLayer'

export interface ChartXAxisProps extends ChartAxisProps {
  position?: 'bottom' | 'top'
  /** When true, displays value scale instead of categorical labels (for horizontal charts) */
  valueScale?: boolean
  /** Number of ticks to show when in valueScale mode */
  tickCount?: number
  /** Format function for value labels when in valueScale mode */
  formatLabel?: (value: number) => string
  /** Scale ID to use when in valueScale mode */
  scaleId?: string
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

export const ChartXAxis: React.FC<ChartXAxisProps> = ({
  position = 'bottom',
  valueScale = false,
  tickCount = 5,
  formatLabel,
  scaleId,
  ...axisProps
}) => {
  const {
    labels,
    labelPositions,
    chartArea,
    canvasSize,
    setAxisTicks,
    getScaleDomain,
    getYPositionForScale,
    defaultScaleId
  } = useChartSurface()

  const resolvedScaleId = useMemo(() => scaleId ?? defaultScaleId, [scaleId, defaultScaleId])

  const layerOptions = useMemo(() => ({ order: LayerOrder.axes }), [])

  // Value scale calculations (similar to ChartYAxis)
  const domain = useMemo(() => {
    if (!valueScale) return null
    return getScaleDomain(resolvedScaleId)
  }, [valueScale, getScaleDomain, resolvedScaleId])

  const valueTickValues = useMemo(() => {
    if (!valueScale || !domain) return []

    const count = Math.max(1, tickCount)
    const range = domain.paddedMax - domain.paddedMin

    if (range === 0) {
      return [domain.paddedMin]
    }

    const step = range / count
    const values: number[] = []

    for (let i = 0; i <= count; i += 1) {
      values.push(domain.paddedMin + step * i)
    }

    return values
  }, [valueScale, domain, tickCount])

  const valueTickPositions = useMemo(() => {
    if (!valueScale || !domain) return []

    return valueTickValues.map((value) => {
      // Map value to X position (horizontal scale)
      // For horizontal bars, values map to X-axis like they normally map to Y-axis
      const range = domain.paddedMax - domain.paddedMin
      if (range === 0) return chartArea.x + chartArea.width / 2

      const normalized = (value - domain.paddedMin) / range
      // Invert because Y-axis is inverted (0 at top), but X-axis is normal (0 at left)
      return chartArea.x + normalized * chartArea.width
    })
  }, [valueScale, valueTickValues, domain, chartArea])

  const valueTickLabels = useMemo(() => {
    if (!valueScale) return []
    return valueTickValues.map((value) => (formatLabel ? formatLabel(value) : Math.round(value).toString()))
  }, [valueScale, valueTickValues, formatLabel])

  const tickDescriptor = useMemo(() => {
    if (valueScale) {
      return {
        indices: valueTickValues.map((_, i) => i),
        positions: valueTickPositions,
        labels: valueTickLabels
      }
    }
    return computeTickDescriptor(labels.length, labelPositions, labels, axisProps.tickStep, axisProps.maxTicks)
  }, [
    valueScale,
    valueTickValues,
    valueTickPositions,
    valueTickLabels,
    labels,
    labelPositions,
    axisProps.tickStep,
    axisProps.maxTicks
  ])

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

      const displayLabels = valueScale ? valueTickLabels : labels
      const displayPositions = valueScale ? valueTickPositions : labelPositions

      renderChartAxis({
        context,
        type: 'x',
        startX: chartArea.x,
        startY,
        endX: chartArea.x + chartArea.width,
        endY: startY,
        labels: displayLabels,
        labelPositions: displayPositions,
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
      position,
      valueScale,
      valueTickLabels,
      valueTickPositions
    ]
  )

  useChartLayer(draw, layerOptions)

  return null
}
