import React, { useMemo, useCallback, useEffect, useState } from 'react'
import { renderChartAxis, type ChartAxisProps } from './InternalComponents/ChartAxis'
import { LayerOrder } from './ChartSurface/ChartSurface.constants'
import type { ChartLayerRenderer } from './ChartSurface/ChartSurface.types'
import { useChartLayer } from '../../utils/hooks/useChartLayer'
import { useChartSurface } from '../../utils/context/ChartSurfaceContext'

export interface ChartYAxisProps extends ChartAxisProps {
  tickCount?: number
  formatLabel?: (value: number) => string
  scaleId?: string
  side?: 'left' | 'right'
  registerTicks?: boolean
  /** When true, displays categorical labels from data instead of value scale */
  categorical?: boolean
}

export const ChartYAxis: React.FC<ChartYAxisProps> = ({
  tickCount = 5,
  formatLabel,
  scaleId,
  side = 'left',
  registerTicks,
  orientation,
  categorical = false,
  ...restAxisProps
}) => {
  const {
    chartArea,
    canvasSize,
    getScaleDomain,
    getYPositionForScale,
    defaultScaleId,
    setAxisTicks,
    registerYAxis,
    getYAxisIndex,
    yAxisSpacing,
    labels,
    normalizedData
  } = useChartSurface()

  const resolvedScaleId = useMemo(() => scaleId ?? defaultScaleId, [scaleId, defaultScaleId])

  const axisOrientation = useMemo(() => orientation ?? (side === 'right' ? 'right' : 'left'), [orientation, side])

  const [registrationId, setRegistrationId] = useState<string | null>(null)

  useEffect(() => {
    const handle = registerYAxis(side)
    setRegistrationId(handle.id)
    return () => {
      handle.unregister()
    }
  }, [registerYAxis, side])

  const layerOptions = useMemo(() => ({ order: LayerOrder.axes }), [])

  const domain = useMemo(() => getScaleDomain(resolvedScaleId), [getScaleDomain, resolvedScaleId])

  // For categorical mode, calculate positions based on data distribution along Y-axis
  const categoricalPositions = useMemo(() => {
    if (!categorical || normalizedData.length === 0) {
      return []
    }

    const dataCount = normalizedData.length
    const getCategoryYPosition = (index: number): number => {
      if (dataCount <= 1) {
        return chartArea.y + chartArea.height / 2
      }
      // For categorical data, center in equal-height bands with padding
      const segmentHeight = chartArea.height / (dataCount + 1)
      return chartArea.y + (index + 1) * segmentHeight
    }

    return normalizedData.map((_, index) => getCategoryYPosition(index))
  }, [categorical, normalizedData, chartArea.y, chartArea.height])

  const tickValues = useMemo(() => {
    if (categorical) {
      // For categorical, we don't use numeric values
      return []
    }

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
  }, [categorical, domain.paddedMax, domain.paddedMin, tickCount])

  const getPositionForValue = useCallback(
    (value: number) => getYPositionForScale(resolvedScaleId, value),
    [getYPositionForScale, resolvedScaleId]
  )

  const tickPositions = useMemo(() => {
    if (categorical) {
      return categoricalPositions
    }
    return tickValues.map((value) => getPositionForValue(value))
  }, [categorical, categoricalPositions, getPositionForValue, tickValues])

  const tickLabels = useMemo(() => {
    if (categorical) {
      return labels
    }
    return tickValues.map((value) => (formatLabel ? formatLabel(value) : Math.round(value).toString()))
  }, [categorical, labels, formatLabel, tickValues])

  const shouldRegisterTicks = registerTicks ?? resolvedScaleId === defaultScaleId

  // Set axis ticks synchronously before paint to ensure grid alignment on first paint
  React.useLayoutEffect(() => {
    if (shouldRegisterTicks) {
      setAxisTicks('y', {
        positions: tickPositions,
        labels: tickLabels,
        values: tickValues
      })
    }
  }, [setAxisTicks, shouldRegisterTicks, tickLabels, tickPositions, tickValues])

  useEffect(() => {
    if (!shouldRegisterTicks) {
      return undefined
    }

    return () => {
      setAxisTicks('y', null)
    }
  }, [setAxisTicks, shouldRegisterTicks])

  const axisIndex = useMemo(() => {
    if (!registrationId) {
      return -1
    }
    return getYAxisIndex(registrationId, side)
  }, [getYAxisIndex, registrationId, side])

  const axisX = useMemo(() => {
    const base = side === 'right' ? chartArea.x + chartArea.width : chartArea.x

    if (axisIndex <= 0) {
      return base
    }

    const offset = axisIndex * yAxisSpacing
    return side === 'right' ? base + offset : base - offset
  }, [axisIndex, chartArea.width, chartArea.x, side, yAxisSpacing])

  const resolvedLabelPadding = restAxisProps.labelPadding ?? 6
  const resolvedTitlePadding = restAxisProps.titlePadding ?? 14
  const resolvedTitleOffsetX =
    restAxisProps.titleOffsetX ?? (axisIndex <= 0 ? 0 : side === 'right' ? axisIndex * 4 : -axisIndex * 4)

  const draw = useCallback<ChartLayerRenderer>(
    (context) => {
      renderChartAxis({
        ...restAxisProps,
        context,
        type: 'y',
        startX: axisX,
        startY: chartArea.y,
        endX: axisX,
        endY: chartArea.y + chartArea.height,
        labels: tickLabels,
        labelPositions: tickPositions,
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
        orientation: axisOrientation,
        labelPadding: resolvedLabelPadding,
        titlePadding: resolvedTitlePadding,
        titleOffsetX: resolvedTitleOffsetX
      })
    },
    [
      axisOrientation,
      axisX,
      canvasSize.height,
      canvasSize.width,
      chartArea.height,
      chartArea.y,
      resolvedLabelPadding,
      resolvedTitleOffsetX,
      resolvedTitlePadding,
      tickLabels,
      tickPositions,
      restAxisProps
    ]
  )

  useChartLayer(draw, layerOptions)

  return null
}
