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
}

export const ChartTooltipLayer: React.FC<ChartTooltipLayerProps> = ({
  snapRadius = defaultChartCursorProps.snapRadius,
  snapToDataPoints = true,
  snapAlongYAxis = defaultChartCursorProps.snapAlongYAxis,
  seriesLabels,
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

      if (helpers.barOrientation === 'horizontal') {
        // Proper 2D bar rectangle hit test for horizontal bars.
        // helpers.dataPoints use vertical-chart geometry so we can't use findNearestDataPoint here;
        // instead we compute the real visual positions the same way ChartBarSeries does.
        const dataCount = helpers.normalizedData.length
        if (dataCount > 0) {
          const getCategoryY = (index: number): number => {
            if (dataCount <= 1) return helpers.chartArea.y + helpers.chartArea.height / 2
            const segH = helpers.chartArea.height / (dataCount + 1)
            return helpers.chartArea.y + (index + 1) * segH
          }
          const halfBand = helpers.chartArea.height / (dataCount + 1) / 2

          const getBarTipX = (key: string, value: number): number => {
            const scaleId = helpers.getScaleIdForKey(key)
            const domain = helpers.getScaleDomain(scaleId)
            const range = domain.paddedMax - domain.paddedMin
            if (range === 0) return helpers.chartArea.x + helpers.chartArea.width / 2
            const normalized = Math.max(0, Math.min(1, (value - domain.paddedMin) / range))
            return helpers.chartArea.x + normalized * helpers.chartArea.width
          }

          const cx = helpers.pointer.x
          const cy = helpers.pointer.y

          for (let index = 0; index < dataCount; index++) {
            const datum = helpers.normalizedData[index]
            const catY = getCategoryY(index)

            // Must be within this category's Y band
            if (Math.abs(cy - catY) > halfBand) continue

            // Find the furthest bar tip in this row (covers all series)
            let maxBarTipX = helpers.chartArea.x
            for (const [key, value] of Object.entries(datum.values)) {
              if (value === null || !Number.isFinite(value as number)) continue
              const tipX = getBarTipX(key, value as number)
              if (tipX > maxBarTipX) maxBarTipX = tipX
            }

            // Must be horizontally within the chart area up to the furthest bar
            if (cx >= helpers.chartArea.x - snapRadius && cx <= maxBarTipX + snapRadius) {
              activeIndex = index
              // Use cursor position so tooltip placement comes from cursorX/cursorY
              activePoint = helpers.dataPoints.find((p) => p.dataIndex === index) ??
                ({ x: cx, y: cy, value: 0, dataIndex: index } as DataPoint)
              break
            }
          }
        }
      } else if (snapToDataPoints) {
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
        const closest = findClosestIndexByX(helpers.pointer.x, helpers.labelPositions)
        if (closest !== null) {
          activeIndex = closest
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
    [seriesLabels, snapAlongYAxis, snapRadius, snapToDataPoints, tooltipProps]
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
