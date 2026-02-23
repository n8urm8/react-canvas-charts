import React, { useMemo, useCallback, useEffect } from 'react'
import {
  renderChartCursor,
  defaultChartCursorProps,
  findNearestDataPoint,
  type ChartCursorHoverPoint,
  type ChartCursorProps,
  type DataPoint
} from './InternalComponents/ChartCursor'
import { LayerOrder } from './ChartSurface/ChartSurface.constants'
import type { ChartLayerRenderer } from './ChartSurface/ChartSurface.types'
import { useChartSurface } from '../../utils/context/ChartSurfaceContext'
import { useChartLayer } from '../../utils/hooks/useChartLayer'
import { findHorizontalBarHoverMatch } from '../../utils/horizontalBarHoverMatch'

export interface ChartCursorLayerProps extends ChartCursorProps {}

export const ChartCursorLayer: React.FC<ChartCursorLayerProps> = ({
  snapRadius = defaultChartCursorProps.snapRadius,
  snapToDataPoints = defaultChartCursorProps.snapToDataPoints,
  snapAlongYAxis = defaultChartCursorProps.snapAlongYAxis,
  ...cursorProps
}) => {
  const { registerCursorOptions, barOrientation } = useChartSurface()

  useEffect(() => {
    const unregister = registerCursorOptions({
      snapRadius,
      snapToDataPoints,
      snapAlongYAxis
    })
    return unregister
  }, [registerCursorOptions, snapAlongYAxis, snapRadius, snapToDataPoints])

  const layerOptions = useMemo(() => ({ order: LayerOrder.overlays }), [])

  const draw = useCallback<ChartLayerRenderer>(
    (context, helpers) => {
      if (!helpers.pointer) {
        return
      }

      let nearest: { point: DataPoint; distance: number } | null = null
      let snappedCategoryY: number | undefined
      let snappedCategoryIndex: number | undefined

      if (barOrientation === 'horizontal') {
        const match = findHorizontalBarHoverMatch(helpers, helpers.pointer.x, helpers.pointer.y, snapRadius)
        if (match) {
          snappedCategoryIndex = match.index
          snappedCategoryY = match.categoryY
        }
      } else {
        // For vertical bars, use the standard dataPoint snapping
        nearest = snapToDataPoints
          ? findNearestDataPoint(helpers.pointer.x, helpers.pointer.y, helpers.dataPoints, snapRadius, snapAlongYAxis)
          : null
      }

      const showHoverPoints = cursorProps.showHoverPoints ?? defaultChartCursorProps.showHoverPoints

      let hoverPoints: ChartCursorHoverPoint[] = []

      if (showHoverPoints && snapToDataPoints && (nearest || snappedCategoryIndex !== undefined)) {
        // Highlight either the snapped point or every series sharing the snapped index (tooltip behavior).
        const mapHoverPoint = (point: DataPoint): ChartCursorHoverPoint => {
          const dataKey =
            typeof point.originalData?.dataKey === 'string' ? (point.originalData.dataKey as string) : undefined

          return {
            x: point.x,
            y: point.y,
            strokeColor: dataKey ? helpers.colorForKey(dataKey) : undefined
          }
        }

        const getSeriesKey = (point: DataPoint): string => {
          if (typeof point.originalData?.dataKey === 'string') {
            return point.originalData.dataKey as string
          }
          if (typeof point.seriesIndex === 'number') {
            return `series-${point.seriesIndex}`
          }
          return 'series'
        }

        if (barOrientation === 'horizontal' && snappedCategoryIndex !== undefined) {
          // For horizontal bars, show all series at the snapped category
          const candidatePoints = helpers.dataPoints.filter((point) => point.dataIndex === snappedCategoryIndex)

          const seenSeries = new Set<string>()
          hoverPoints = candidatePoints.reduce<ChartCursorHoverPoint[]>((accumulator, point) => {
            const seriesKey = getSeriesKey(point)
            if (seenSeries.has(seriesKey)) {
              return accumulator
            }

            seenSeries.add(seriesKey)
            accumulator.push(mapHoverPoint(point))
            return accumulator
          }, [])
        } else if (snapAlongYAxis && nearest) {
          hoverPoints = [mapHoverPoint(nearest.point)]
        } else if (nearest) {
          const targetDataIndex = nearest.point.dataIndex
          const targetX = nearest.point.x

          const candidatePoints = helpers.dataPoints
            .filter((point) => {
              if (typeof targetDataIndex === 'number' && typeof point.dataIndex === 'number') {
                return point.dataIndex === targetDataIndex
              }
              return Math.abs(point.x - targetX) <= 0.5
            })
            .sort((a, b) => (a.seriesIndex ?? 0) - (b.seriesIndex ?? 0))

          const seenSeries = new Set<string>()
          hoverPoints = candidatePoints.reduce<ChartCursorHoverPoint[]>((accumulator, point) => {
            const seriesKey = getSeriesKey(point)
            if (seenSeries.has(seriesKey)) {
              return accumulator
            }

            seenSeries.add(seriesKey)
            accumulator.push(mapHoverPoint(point))
            return accumulator
          }, [])
        }
      }

      renderChartCursor({
        context,
        chartX: helpers.chartArea.x,
        chartY: helpers.chartArea.y,
        chartWidth: helpers.chartArea.width,
        chartHeight: helpers.chartArea.height,
        cursorX: helpers.pointer.x,
        cursorY: helpers.pointer.y,
        snappedX: barOrientation === 'horizontal' ? helpers.pointer.x : nearest?.point.x,
        snappedY: barOrientation === 'horizontal' ? snappedCategoryY : nearest?.point.y,
        snapToDataPoints,
        snapRadius,
        hoverPoints,
        ...cursorProps,
        showHorizontalLine:
          barOrientation === 'horizontal'
            ? (cursorProps.showHorizontalLine ?? true)
            : snapAlongYAxis
              ? (cursorProps.showHorizontalLine ?? defaultChartCursorProps.showHorizontalLine)
              : false,
        showVerticalLine:
          barOrientation === 'horizontal'
            ? false
            : (cursorProps.showVerticalLine ?? defaultChartCursorProps.showVerticalLine)
      })
    },
    [cursorProps, snapAlongYAxis, snapRadius, snapToDataPoints, barOrientation]
  )

  useChartLayer(draw, layerOptions)

  return null
}
