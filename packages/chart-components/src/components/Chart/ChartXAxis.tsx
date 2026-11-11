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

/**
 * Picks tick indices over the visible range only, so cost is O(ticks), not O(data length).
 * Always includes the first and last visible index.
 */
const computeTickDescriptor = (
  viewStart: number,
  viewEnd: number,
  getXPosition: (index: number) => number,
  getLabel: (index: number) => string,
  chartWidth: number,
  tickStep?: number,
  maxTicks?: number
) => {
  const count = viewEnd - viewStart + 1
  if (count <= 0) {
    return { indices: [] as number[], positions: [] as number[], labels: [] as string[] }
  }

  const normalizedStep = Math.max(1, Math.round(tickStep ?? defaultChartAxisProps.tickStep) || 1)
  const requestedMaxTicks = maxTicks ?? defaultChartAxisProps.maxTicks
  // Without an explicit limit, never place more than one tick per pixel.
  const normalizedMaxTicks =
    Number.isFinite(requestedMaxTicks) && requestedMaxTicks > 0
      ? requestedMaxTicks
      : Math.max(1, Math.floor(chartWidth))
  const autoStep = Math.max(1, Math.ceil(count / normalizedMaxTicks))
  const effectiveStep = Math.max(normalizedStep, autoStep)

  const indices: number[] = []
  for (let offset = 0; offset < count; offset += effectiveStep) {
    indices.push(viewStart + offset)
  }
  if (indices[indices.length - 1] !== viewEnd) {
    indices.push(viewEnd)
  }

  const positions: number[] = new Array(indices.length)
  const tickLabels: string[] = new Array(indices.length)
  for (let i = 0; i < indices.length; i += 1) {
    positions[i] = getXPosition(indices[i])
    tickLabels[i] = getLabel(indices[i])
  }

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
    viewRange,
    getXPosition,
    getLabel,
    chartArea,
    canvasSize,
    setAxisTicks,
    getScaleDomain,
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
    return computeTickDescriptor(
      viewRange.start,
      viewRange.end,
      getXPosition,
      getLabel,
      chartArea.width,
      axisProps.tickStep,
      axisProps.maxTicks
    )
  }, [
    valueScale,
    valueTickValues,
    valueTickPositions,
    valueTickLabels,
    viewRange.start,
    viewRange.end,
    getXPosition,
    getLabel,
    chartArea.width,
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

      // Tick selection already happened in tickDescriptor; render every descriptor entry.
      const displayLabels = tickDescriptor.labels
      const displayPositions = tickDescriptor.positions

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
        ...axisProps,
        tickStep: 1,
        maxTicks: Number.POSITIVE_INFINITY
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
      position,
      tickDescriptor
    ]
  )

  useChartLayer(draw, layerOptions)

  return null
}
