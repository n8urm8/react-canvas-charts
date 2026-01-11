import React, { useMemo, useCallback } from 'react'
import {
  renderChartTooltip,
  type ChartTooltipProps,
  defaultChartTooltipProps,
  type TooltipSeriesEntry
} from './InternalComponents/ChartTooltip'
import { LayerOrder } from './ChartSurface/ChartSurface.constants'
import type { ChartLayerRenderer } from './ChartSurface/ChartSurface.types'
import { useChartLayer } from '../../utils/hooks/useChartLayer'
import { findNearestDataPoint, defaultChartCursorProps, type DataPoint } from './InternalComponents/ChartCursor'

export interface ChartTooltipLayerProps extends ChartTooltipProps {
  snapRadius?: number
  snapToDataPoints?: boolean
  seriesLabels?: Record<string, string>
  snapAlongYAxis?: boolean
  /** Set to 'horizontal' for horizontal bar charts to search by Y position */
  orientation?: 'vertical' | 'horizontal'
}

export const ChartTooltipLayer: React.FC<ChartTooltipLayerProps> = ({
  snapRadius = defaultChartCursorProps.snapRadius,
  snapToDataPoints = true,
  snapAlongYAxis = defaultChartCursorProps.snapAlongYAxis,
  seriesLabels,
  orientation = 'vertical',
  ...tooltipProps
}) => {
  const layerOptions = useMemo(() => ({ order: LayerOrder.tooltip }), [])

  const draw = useCallback<ChartLayerRenderer>(
    (context, helpers) => {
      if (!helpers.pointer) {
        return
      }

      let activePoint: DataPoint | null = null
      let activeIndex: number | undefined

      if (snapToDataPoints) {
        const nearest = findNearestDataPoint(
          helpers.pointer.x,
          helpers.pointer.y,
          helpers.dataPoints,
          snapRadius,
          snapAlongYAxis
        )
        activePoint = nearest?.point ?? null
        activeIndex = activePoint?.dataIndex
      } else if (helpers.normalizedData.length > 0) {
        let closest: number | null
        if (orientation === 'horizontal') {
          // For horizontal bars, categories are along Y-axis
          closest = findClosestIndexByY(helpers.pointer.y, helpers.normalizedData, helpers.chartArea)
        } else {
          // For vertical bars, categories are along X-axis
          closest = findClosestIndexByX(helpers.pointer.x, helpers.labelPositions)
        }

        if (closest !== null) {
          activeIndex = closest
          // Use any existing data point at this index as active reference
          activePoint = helpers.dataPoints.find((point) => point.dataIndex === closest) ?? null
        }
      }

      if (!activePoint) {
        return
      }

      if (activeIndex === undefined) {
        activeIndex = activePoint.dataIndex
      }

      const seriesEntries = buildSeriesEntries(helpers, activeIndex, seriesLabels)
      const resolvedLabel = resolveLabel(helpers, activePoint, activeIndex)

      renderChartTooltip({
        context,
        dataPoint: activePoint,
        dataPoints: seriesEntries.map((entry) => entry.point),
        entries: seriesEntries,
        label: resolvedLabel,
        cursorX: helpers.pointer.x,
        cursorY: helpers.pointer.y,
        chartX: helpers.chartArea.x,
        chartY: helpers.chartArea.y,
        chartWidth: helpers.chartArea.width,
        chartHeight: helpers.chartArea.height,
        canvasWidth: helpers.canvasWidth,
        canvasHeight: helpers.canvasHeight,
        ...defaultChartTooltipProps,
        ...tooltipProps
      })
    },
    [seriesLabels, snapAlongYAxis, snapRadius, snapToDataPoints, tooltipProps, orientation]
  )

  useChartLayer(draw, layerOptions)

  return null
}

function findClosestIndexByX(cursorX: number, labelPositions: number[]): number | null {
  if (labelPositions.length === 0) {
    return null
  }

  let closestIndex = 0
  let closestDistance = Math.abs(cursorX - labelPositions[0])

  for (let index = 1; index < labelPositions.length; index += 1) {
    const distance = Math.abs(cursorX - labelPositions[index])
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  }

  return closestIndex
}

function findClosestIndexByY(
  cursorY: number,
  normalizedData: Array<{ index: number }>,
  chartArea: { y: number; height: number }
): number | null {
  if (normalizedData.length === 0) {
    return null
  }

  // Calculate Y positions for categories (same logic as in ChartBarSeries for horizontal bars)
  const dataCount = normalizedData.length
  if (dataCount <= 1) {
    return 0
  }

  const getCategoryYPosition = (index: number): number => {
    const segmentHeight = chartArea.height / (dataCount + 1)
    return chartArea.y + (index + 1) * segmentHeight
  }

  let closestIndex = 0
  let closestDistance = Math.abs(cursorY - getCategoryYPosition(0))

  for (let index = 1; index < dataCount; index += 1) {
    const distance = Math.abs(cursorY - getCategoryYPosition(index))
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  }

  return closestIndex
}

function buildSeriesEntries(
  helpers: Parameters<ChartLayerRenderer>[1],
  dataIndex: number | undefined,
  seriesLabels?: Record<string, string>
): TooltipSeriesEntry[] {
  if (dataIndex === undefined || dataIndex < 0) {
    return []
  }

  const matchingPoints = helpers.dataPoints.filter((point) => point.dataIndex === dataIndex)

  if (matchingPoints.length === 0) {
    return []
  }

  const seenIds = new Set<string>()

  return matchingPoints
    .sort((a, b) => (a.seriesIndex ?? 0) - (b.seriesIndex ?? 0))
    .map((point) => {
      const seriesId = inferSeriesId(point)
      const label = seriesLabels?.[seriesId] ?? seriesId
      const color = helpers.colorForKey(seriesId)
      const entry: TooltipSeriesEntry = {
        id: seriesId,
        label,
        value: point.value,
        color,
        point
      }
      return entry
    })
    .filter((entry) => {
      if (seenIds.has(entry.id)) {
        return false
      }
      seenIds.add(entry.id)
      return true
    })
}

function inferSeriesId(point: DataPoint): string {
  const rawKey = point.originalData?.dataKey

  if (typeof rawKey === 'string' && rawKey.length > 0) {
    return rawKey
  }

  if (typeof point.seriesIndex === 'number') {
    return `series-${point.seriesIndex + 1}`
  }

  return 'value'
}

function resolveLabel(
  helpers: Parameters<ChartLayerRenderer>[1],
  point: DataPoint,
  dataIndex: number | undefined
): string {
  if (dataIndex !== undefined && dataIndex >= 0) {
    const normalized = helpers.normalizedData[dataIndex]
    if (normalized?.label) {
      return normalized.label
    }
    const label = helpers.labels?.[dataIndex]
    if (label) {
      return label
    }
  }

  return point.label ?? ''
}
