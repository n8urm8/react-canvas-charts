import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react'
import { ZoomIn, ZoomOut, Type, Minus, Circle, Pen } from 'lucide-react'
import {
  type DataPoint,
  type ChartRecord,
  type InteractiveChartAxisConfig,
  type InteractiveChartConfig,
  type InteractiveChartSeriesConfig,
  type InteractiveChartToolbarTool,
  createInitialTimeSeries,
  generateNewPoints,
  buildInteractiveChartCodePreview,
  InteractiveChartCanvas,
  InteractiveChartQuickActions,
  InteractiveChartCodePreview,
  InteractiveChartControlPanel
} from '../ExampleComponents/InteractiveChart'
import type {
  ChartSelectionResult,
  ChartSelectionSeriesRange,
  ChartToolbarPosition,
  ChartAnnotation
} from 'react-canvas-charts'

const SERIES_COLOR_PALETTE = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

const INITIAL_CONFIG: InteractiveChartConfig = {
  title: 'Interactive Line Chart',
  width: 800,
  height: 400,
  padding: 80,
  showPoints: false,
  showLines: true,
  showValues: false,
  fillArea: false,
  fillOpacity: 0.1,
  enableCursor: true,
  enableTooltip: true,
  lineWidth: 1,
  lineSmooth: false,
  lineDash: [],
  pointSize: 6,
  pointShape: 'circle',
  showGrid: true,
  gridColor: '#e5e7eb',
  showXAxis: true,
  showYAxis: true,
  xAxisTitle: 'Time',
  xAxisTickStep: 1,
  xAxisMaxTicks: 10,
  xAxisLabelRotation: 0,
  xAxisLabelOffsetY: 0,
  cursorSnapToPoints: true,
  cursorSnapAlongYAxis: false,
  cursorShowHoverPoints: true,
  tooltipPosition: 'follow',
  tooltipTemplate: '',
  axes: [{ id: 'axis-1', title: 'Axis 1', position: 'left' }],
  series: [
    { id: 'series-1', name: 'Series 1', color: '#3b82f6', axisId: 'axis-1' },
    { id: 'series-2', name: 'Series 2', color: '#ef4444', axisId: 'axis-1' }
  ],
  toolbar: {
    enabled: true,
    multiSelect: false,
    defaultActiveIds: [],
    position: { top: 16, left: 16 },
    visibility: 'hover',
    moveable: true,
    tools: [
      { id: 'zoom-in', label: 'Zoom In' },
      { id: 'zoom-out', label: 'Zoom Out' },
      { id: 'text', label: 'Text' },
      { id: 'line', label: 'Line' },
      { id: 'circle', label: 'Circle' },
      { id: 'freehand', label: 'Draw' }
    ]
  },
  legend: {
    enabled: true,
    placement: { mode: 'anchor', position: 'top-right' },
    layout: 'horizontal',
    title: ''
  }
}

type ZoomRange = { start: number; end: number }

const positionsEqual = (a?: ChartToolbarPosition, b?: ChartToolbarPosition): boolean => {
  const keys: Array<keyof ChartToolbarPosition> = ['top', 'right', 'bottom', 'left']
  return keys.every((key) => {
    const aValue = a?.[key]
    const bValue = b?.[key]
    return aValue === bValue
  })
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

const getNextSeriesIndex = (series: InteractiveChartSeriesConfig[]): number => {
  const indices = series
    .map(({ id }) => Number.parseInt(id.replace('series-', ''), 10))
    .filter((value) => Number.isFinite(value))
  return (indices.length > 0 ? Math.max(...indices) : 0) + 1
}

export const InteractiveChartDemoNew: FC = () => {
  const initialDataRef = useRef<DataPoint[] | null>(null)
  if (!initialDataRef.current) {
    initialDataRef.current = createInitialTimeSeries(
      INITIAL_CONFIG.series.map((series) => series.id),
      1200
    )
  }

  const [config, setConfig] = useState<InteractiveChartConfig>(INITIAL_CONFIG)
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(() =>
    initialDataRef.current ? [...initialDataRef.current] : []
  )
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>([])
  const [zoomStack, setZoomStack] = useState<ZoomRange[]>(() => {
    const initialLength = initialDataRef.current?.length ?? 0
    return [
      {
        start: 0,
        end: initialLength > 0 ? initialLength - 1 : 0
      }
    ]
  })
  const [selectionResetKey, setSelectionResetKey] = useState(0)
  const [selection, setSelection] = useState<ChartSelectionResult | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingHz, setStreamingHz] = useState(1)
  const [streamingPointsPerTick, setStreamingPointsPerTick] = useState(1)
  const [streamingMaxPoints, setStreamingMaxPoints] = useState(1200)
  const [bulkAddCount, setBulkAddCount] = useState(10)
  const intervalRef = useRef<number | null>(null)

  const handleToolbarPositionChange = useCallback((nextPosition: ChartToolbarPosition) => {
    setConfig((previous) => {
      const previousToolbar = previous.toolbar ?? {}
      if (positionsEqual(previousToolbar.position, nextPosition)) {
        return previous
      }

      return {
        ...previous,
        toolbar: {
          ...previousToolbar,
          position: nextPosition
        }
      }
    })
  }, [])

  const seriesIds = useMemo(() => config.series.map((series) => series.id), [config.series])

  const axisSummaries = useMemo(
    () =>
      config.axes.map((axis) => ({
        axis,
        seriesCount: config.series.filter((series) => series.axisId === axis.id).length
      })),
    [config.axes, config.series]
  )

  const clampZoomRanges = useCallback(
    (ranges: ZoomRange[], dropCount: number, previousLength: number, nextLength: number): ZoomRange[] => {
      if (nextLength <= 0) {
        return [{ start: 0, end: -1 }]
      }

      if (ranges.length === 0) {
        return [{ start: 0, end: nextLength - 1 }]
      }

      const maxIndex = nextLength - 1
      const previousMaxIndex = previousLength > 0 ? previousLength - 1 : -1

      return ranges.map(({ start, end }) => {
        const span = Math.max(0, end - start)
        let nextStart = start - dropCount
        let nextEnd = nextStart + span
        const wasAnchoredToEnd = previousLength > 0 && end >= previousMaxIndex
        const anchoredAtStart = start <= 0

        if (nextStart < 0) {
          const offset = -nextStart
          nextStart = 0
          nextEnd += offset
        }

        if (dropCount === 0 && nextLength > previousLength) {
          if (anchoredAtStart) {
            nextStart = 0
            nextEnd = maxIndex
          } else if (wasAnchoredToEnd) {
            nextEnd = maxIndex
            nextStart = Math.max(0, nextEnd - span)
          }
        }

        if (nextEnd > maxIndex) {
          const overflow = nextEnd - maxIndex
          nextEnd = maxIndex
          nextStart = Math.max(0, nextStart - overflow)
        }

        if (nextEnd < nextStart) {
          nextEnd = nextStart
        }

        return { start: nextStart, end: nextEnd }
      })
    },
    []
  )

  const adjustZoomStack = useCallback(
    (dropCount: number, previousLength: number, nextLength: number) => {
      setZoomStack((previous) => clampZoomRanges(previous, dropCount, previousLength, nextLength))
    },
    [clampZoomRanges]
  )

  const resetZoomToFull = useCallback((pointCount: number) => {
    const safeLength = Math.max(0, pointCount)
    setZoomStack([{ start: 0, end: safeLength > 0 ? safeLength - 1 : 0 }])
    setSelection(null)
    setSelectionResetKey((key) => key + 1)
  }, [])

  const regenerateDataForSeries = useCallback(
    (nextSeries: InteractiveChartSeriesConfig[], options?: { pointCount?: number }) => {
      const nextSeriesIds = nextSeries.map((series) => series.id)
      setDataPoints((previous) => {
        const targetCount =
          options?.pointCount !== undefined
            ? Math.max(1, Math.floor(options.pointCount))
            : previous.length > 0
              ? previous.length
              : 12
        const nextData = createInitialTimeSeries(nextSeriesIds, targetCount)
        resetZoomToFull(nextData.length)
        return nextData
      })
    },
    [resetZoomToFull]
  )

  const appendStreamingPoint = useCallback(() => {
    setDataPoints((previous) => {
      const previousLength = previous.length
      const additions = generateNewPoints(previous, Math.max(1, streamingPointsPerTick), seriesIds)
      let nextData = [...previous, ...additions]
      let dropCount = 0

      if (streamingMaxPoints > 0 && nextData.length > streamingMaxPoints) {
        dropCount = nextData.length - streamingMaxPoints
        nextData = nextData.slice(dropCount)
      }

      adjustZoomStack(dropCount, previousLength, nextData.length)
      return nextData
    })
  }, [adjustZoomStack, seriesIds, streamingMaxPoints, streamingPointsPerTick])

  const addBulkPoints = useCallback(() => {
    if (bulkAddCount <= 0) {
      return
    }

    setDataPoints((previous) => {
      const previousLength = previous.length
      let nextData = [...previous, ...generateNewPoints(previous, bulkAddCount, seriesIds)]
      let dropCount = 0

      if (streamingMaxPoints > 0 && nextData.length > streamingMaxPoints) {
        dropCount = nextData.length - streamingMaxPoints
        nextData = nextData.slice(dropCount)
      }

      adjustZoomStack(dropCount, previousLength, nextData.length)
      return nextData
    })
  }, [adjustZoomStack, bulkAddCount, seriesIds, streamingMaxPoints])

  useEffect(() => {
    if (!isStreaming) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return undefined
    }

    const safeHz = clamp(streamingHz, 0.1, 100)
    const intervalMs = Math.max(10, Math.round(1000 / safeHz))
    const id = window.setInterval(appendStreamingPoint, intervalMs)
    intervalRef.current = id

    return () => {
      window.clearInterval(id)
      if (intervalRef.current === id) {
        intervalRef.current = null
      }
    }
  }, [appendStreamingPoint, isStreaming, streamingHz])

  useEffect(
    () => () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    },
    []
  )

  useEffect(() => {
    setDataPoints((previous) => {
      const previousLength = previous.length
      if (streamingMaxPoints <= 0 || previous.length <= streamingMaxPoints) {
        adjustZoomStack(0, previousLength, previousLength)
        return previous
      }

      const dropCount = previous.length - streamingMaxPoints
      const nextData = previous.slice(dropCount)
      adjustZoomStack(dropCount, previousLength, nextData.length)
      return nextData
    })
  }, [adjustZoomStack, streamingMaxPoints])

  const toggleStreaming = useCallback(() => {
    setIsStreaming((previous) => !previous)
  }, [])

  const visibleRange = useMemo(() => {
    if (dataPoints.length === 0) {
      return { start: 0, end: -1 }
    }

    const maxIndex = dataPoints.length - 1
    const currentRange = zoomStack[zoomStack.length - 1] ?? { start: 0, end: maxIndex }
    const start = Math.max(0, Math.min(currentRange.start, maxIndex))
    const end = Math.max(start, Math.min(currentRange.end, maxIndex))

    return { start, end }
  }, [dataPoints.length, zoomStack])

  const visibleDataPoints = useMemo(() => {
    if (dataPoints.length === 0) {
      return [] as DataPoint[]
    }

    const { start, end } = visibleRange
    if (end < start) {
      return [] as DataPoint[]
    }

    return dataPoints.slice(start, end + 1)
  }, [dataPoints, visibleRange])

  const chartRecords = useMemo<ChartRecord[]>(() => {
    if (visibleDataPoints.length === 0) {
      return []
    }

    return visibleDataPoints.map(({ label, values }) => {
      const record: ChartRecord = { label } as ChartRecord
      seriesIds.forEach((seriesId) => {
        record[seriesId] = values[seriesId] ?? 0
      })
      return record
    })
  }, [seriesIds, visibleDataPoints])

  const canZoomIn = Boolean(selection && selection.minIndex <= selection.maxIndex && visibleDataPoints.length > 0)
  const canZoomOut = zoomStack.length > 1
  const visibleStartIndex = visibleRange.start

  const toolbarTools = useMemo<InteractiveChartToolbarTool[]>(
    () => [
      {
        id: 'zoom-in',
        label: 'Zoom In',
        icon: <ZoomIn className="h-4 w-4" />,
        ariaLabel: 'Zoom in to selection',
        showLabel: false,
        disabled: !canZoomIn,
        tooltip: canZoomIn ? 'Zoom to selection' : 'Select a range to enable zoom in'
      },
      {
        id: 'zoom-out',
        label: 'Zoom Out',
        icon: <ZoomOut className="h-4 w-4" />,
        ariaLabel: 'Zoom out',
        showLabel: false,
        disabled: !canZoomOut,
        tooltip: canZoomOut ? 'Return to previous zoom' : 'Already at full extent'
      },
      {
        id: 'text',
        label: 'Text',
        icon: <Type className="h-4 w-4" />,
        ariaLabel: 'Add text annotation',
        showLabel: false,
        disabled: false,
        tooltip: 'Add text annotation'
      },
      {
        id: 'line',
        label: 'Line',
        icon: <Minus className="h-4 w-4" />,
        ariaLabel: 'Add line annotation',
        showLabel: false,
        disabled: false,
        tooltip: 'Add line annotation'
      },
      {
        id: 'circle',
        label: 'Circle',
        icon: <Circle className="h-4 w-4" />,
        ariaLabel: 'Add circle annotation',
        showLabel: false,
        disabled: false,
        tooltip: 'Add circle annotation'
      },
      {
        id: 'freehand',
        label: 'Draw',
        icon: <Pen className="h-4 w-4" />,
        ariaLabel: 'Draw freehand annotation',
        showLabel: false,
        disabled: false,
        tooltip: 'Draw freehand annotation'
      }
    ],
    [canZoomIn, canZoomOut]
  )

  const handleToolbarToggle = useCallback(
    (tool: InteractiveChartToolbarTool, _isActive: boolean, _nextActive: string[]) => {
      void _nextActive
      if (tool.id === 'zoom-in') {
        if (!canZoomIn || !selection) {
          return
        }

        const nextStart = visibleStartIndex + selection.minIndex
        const nextEnd = visibleStartIndex + selection.maxIndex

        setZoomStack((previous) => {
          const current = previous[previous.length - 1]
          if (current && current.start === nextStart && current.end === nextEnd) {
            return previous
          }
          return [...previous, { start: nextStart, end: nextEnd }]
        })
        setSelection(null)
        setSelectionResetKey((key) => key + 1)
        return
      }

      if (tool.id === 'zoom-out') {
        if (!canZoomOut) {
          return
        }
        setZoomStack((previous) => (previous.length > 1 ? previous.slice(0, -1) : previous))
        setSelection(null)
        setSelectionResetKey((key) => key + 1)
        return
      }

      // Annotation tools
    },
    [canZoomIn, canZoomOut, selection, setSelectionResetKey, visibleStartIndex]
  )

  const codePreview = useMemo(() => buildInteractiveChartCodePreview(config, chartRecords), [chartRecords, config])

  const handleStreamingHzChange = useCallback((value: number) => {
    setStreamingHz(clamp(value, 0.1, 100))
  }, [])

  const handleStreamingPointsPerTickChange = useCallback((value: number) => {
    setStreamingPointsPerTick(clamp(value, 1, 100))
  }, [])

  const handleStreamingMaxPointsChange = useCallback((value: number) => {
    setStreamingMaxPoints(Math.max(0, value))
  }, [])

  const handleBulkAddCountChange = useCallback((value: number) => {
    setBulkAddCount(Math.max(1, value))
  }, [])

  const handleSetAxisCount = useCallback(
    (rawCount: number) => {
      setConfig((previous) => {
        const target = Math.max(1, Math.min(6, Math.floor(rawCount)))
        if (target === previous.axes.length) {
          return previous
        }
        let nextAxes = [...previous.axes]
        let nextSeries = [...previous.series]

        if (target > previous.axes.length) {
          for (let index = previous.axes.length; index < target; index += 1) {
            const axisId = `axis-${index + 1}`
            const newAxis: InteractiveChartAxisConfig = {
              id: axisId,
              title: `Axis ${index + 1}`,
              position: index % 2 === 0 ? 'left' : 'right'
            }
            nextAxes = [...nextAxes, newAxis]
            const nextSeriesIndex = getNextSeriesIndex(nextSeries)
            const newSeries: InteractiveChartSeriesConfig = {
              id: `series-${nextSeriesIndex}`,
              name: `Series ${nextSeriesIndex}`,
              color: SERIES_COLOR_PALETTE[(nextSeriesIndex - 1) % SERIES_COLOR_PALETTE.length],
              axisId
            }
            nextSeries = [...nextSeries, newSeries]
          }
        } else {
          const removedAxisIds = new Set(nextAxes.slice(target).map((axis) => axis.id))
          nextAxes = nextAxes.slice(0, target)
          nextSeries = nextSeries.filter((series) => !removedAxisIds.has(series.axisId))
          if (nextSeries.length === 0 && nextAxes.length > 0) {
            nextSeries = [
              {
                id: 'series-1',
                name: 'Series 1',
                color: SERIES_COLOR_PALETTE[0],
                axisId: nextAxes[0].id
              }
            ]
          }
        }

        const nextConfig = { ...previous, axes: nextAxes, series: nextSeries }
        regenerateDataForSeries(nextSeries)
        return nextConfig
      })
    },
    [regenerateDataForSeries]
  )

  const handleSetAxisSeriesCount = useCallback(
    (axisId: string, rawCount: number) => {
      setConfig((previous) => {
        const axisExists = previous.axes.some((axis) => axis.id === axisId)
        if (!axisExists) {
          return previous
        }
        const desired = Math.max(1, Math.min(8, Math.floor(rawCount)))
        const currentForAxis = previous.series.filter((series) => series.axisId === axisId)
        if (currentForAxis.length === desired) {
          return previous
        }
        let nextSeries = [...previous.series]
        if (desired > currentForAxis.length) {
          let toAdd = desired - currentForAxis.length
          while (toAdd > 0) {
            const nextSeriesIndex = getNextSeriesIndex(nextSeries)
            const newSeries: InteractiveChartSeriesConfig = {
              id: `series-${nextSeriesIndex}`,
              name: `Series ${nextSeriesIndex}`,
              color: SERIES_COLOR_PALETTE[(nextSeriesIndex - 1) % SERIES_COLOR_PALETTE.length],
              axisId
            }
            nextSeries = [...nextSeries, newSeries]
            toAdd -= 1
          }
        } else {
          const removableIds = new Set(currentForAxis.slice(desired).map((series) => series.id))
          nextSeries = nextSeries.filter((series) => !removableIds.has(series.id))
        }

        if (nextSeries.length === 0) {
          const fallbackAxisId = previous.axes[0]?.id ?? axisId
          nextSeries = [
            {
              id: 'series-1',
              name: 'Series 1',
              color: SERIES_COLOR_PALETTE[0],
              axisId: fallbackAxisId
            }
          ]
        }

        const nextConfig = { ...previous, series: nextSeries }
        regenerateDataForSeries(nextSeries)
        return nextConfig
      })
    },
    [regenerateDataForSeries]
  )

  const handleAddSeries = useCallback(() => {
    setConfig((previous) => {
      if (previous.axes.length === 0) {
        return previous
      }
      const axisCounts = previous.axes.map((axis) => ({
        axisId: axis.id,
        count: previous.series.filter((series) => series.axisId === axis.id).length
      }))
      const targetAxisId = axisCounts.sort((a, b) => a.count - b.count)[0]?.axisId ?? previous.axes[0].id
      const nextSeriesIndex = getNextSeriesIndex(previous.series)
      const newSeries: InteractiveChartSeriesConfig = {
        id: `series-${nextSeriesIndex}`,
        name: `Series ${nextSeriesIndex}`,
        color: SERIES_COLOR_PALETTE[(nextSeriesIndex - 1) % SERIES_COLOR_PALETTE.length],
        axisId: targetAxisId
      }
      const nextSeries = [...previous.series, newSeries]
      const nextConfig = { ...previous, series: nextSeries }
      regenerateDataForSeries(nextSeries)
      return nextConfig
    })
  }, [regenerateDataForSeries])

  const handleRemoveSeries = useCallback(
    (seriesId: string) => {
      setConfig((previous) => {
        if (previous.series.length <= 1) {
          return previous
        }
        const nextSeries = previous.series.filter((series) => series.id !== seriesId)
        if (nextSeries.length === previous.series.length) {
          return previous
        }
        const nextConfig = { ...previous, series: nextSeries }
        regenerateDataForSeries(nextSeries)
        return nextConfig
      })
    },
    [regenerateDataForSeries]
  )

  const handleUpdateSeries = useCallback((seriesId: string, updates: Partial<InteractiveChartSeriesConfig>) => {
    setConfig((previous) => {
      const axisIds = previous.axes.map((axis) => axis.id)
      return {
        ...previous,
        series: previous.series.map((series) => {
          if (series.id !== seriesId) {
            return series
          }
          const nextAxisId =
            updates.axisId && axisIds.includes(updates.axisId)
              ? updates.axisId
              : updates.axisId
                ? (axisIds[0] ?? series.axisId)
                : series.axisId
          return {
            ...series,
            ...updates,
            axisId: nextAxisId
          }
        })
      }
    })
  }, [])

  const handleAddAxis = useCallback(() => {
    setConfig((previous) => {
      const nextIndex = previous.axes.length + 1
      const newAxis: InteractiveChartAxisConfig = {
        id: `axis-${nextIndex}`,
        title: `Axis ${nextIndex}`,
        position: nextIndex % 2 === 0 ? 'right' : 'left'
      }
      const nextAxes = [...previous.axes, newAxis]
      const nextSeriesIndex = getNextSeriesIndex(previous.series)
      const newSeries: InteractiveChartSeriesConfig = {
        id: `series-${nextSeriesIndex}`,
        name: `Series ${nextSeriesIndex}`,
        color: SERIES_COLOR_PALETTE[(nextSeriesIndex - 1) % SERIES_COLOR_PALETTE.length],
        axisId: newAxis.id
      }
      const nextSeries = [...previous.series, newSeries]
      const nextConfig = { ...previous, axes: nextAxes, series: nextSeries }
      regenerateDataForSeries(nextSeries)
      return nextConfig
    })
  }, [regenerateDataForSeries])

  const handleRemoveAxis = useCallback(
    (axisId: string) => {
      setConfig((previous) => {
        if (previous.axes.length <= 1) {
          return previous
        }
        const nextAxes = previous.axes.filter((axis) => axis.id !== axisId)
        if (nextAxes.length === previous.axes.length) {
          return previous
        }
        let nextSeries = previous.series.filter((series) => series.axisId !== axisId)
        if (nextSeries.length === 0 && nextAxes.length > 0) {
          nextSeries = [
            {
              id: 'series-1',
              name: 'Series 1',
              color: SERIES_COLOR_PALETTE[0],
              axisId: nextAxes[0].id
            }
          ]
        }
        const nextConfig = { ...previous, axes: nextAxes, series: nextSeries }
        regenerateDataForSeries(nextSeries)
        return nextConfig
      })
    },
    [regenerateDataForSeries]
  )

  const handleUpdateAxis = useCallback((axisId: string, updates: Partial<InteractiveChartAxisConfig>) => {
    setConfig((previous) => ({
      ...previous,
      axes: previous.axes.map((axis) => (axis.id === axisId ? { ...axis, ...updates } : axis))
    }))
  }, [])

  const handleSelectionChange = useCallback((nextSelection: ChartSelectionResult | null) => {
    setSelection(nextSelection)
  }, [])

  return (
    <div className="p-3 md:p-5 font-sans bg-gray-50 min-h-screen">
      <div className="w-full mx-auto">
        <h1 className="text-center text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-8">
          🎮 Interactive Chart Demo
        </h1>
        <p className="mb-4 text-sm md:text-base">
          Try out the chart and change all the options. Add lines, axes, stream data, and more. A code preview below the
          chart updates with every change to provide an example of how to use the chart.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 w-full">
          <div className="flex-1 lg:col-span-2 space-y-4 md:space-y-8">
            <div className="relative">
              <InteractiveChartCanvas
                data={chartRecords}
                config={{ ...config, annotations }}
                onSelectionChange={handleSelectionChange}
                toolbarTools={toolbarTools}
                toolbarEnabled={config.toolbar?.enabled !== false}
                toolbarMultiSelect={false}
                selectionResetKey={selectionResetKey}
                onToolbarToggle={handleToolbarToggle}
                onToolbarPositionChange={handleToolbarPositionChange}
                onAnnotationsChange={setAnnotations}
              />
            </div>

            {annotations.length > 0 ? (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg text-sm text-gray-900">
                <div className="font-semibold mb-2">Annotations ({annotations.length})</div>
                <ul className="space-y-2">
                  {annotations.map((annotation) => (
                    <li key={annotation.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: annotation.color }} />
                        <span className="font-medium capitalize">{annotation.type}</span>
                        {annotation.type === 'text' && (
                          <span className="text-xs text-gray-600">"{annotation.text}"</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setAnnotations((prev) => prev.filter((a) => a.id !== annotation.id))
                          }}
                          className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {selection ? (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-gray-900">
                <div className="font-semibold mb-2">Selection Window</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">Start:</span> {selection.minLabel} (#{selection.minIndex})
                  </div>
                  <div>
                    <span className="font-medium">End:</span> {selection.maxLabel} (#{selection.maxIndex})
                  </div>
                </div>
                <div className="mt-3">
                  <div className="font-medium mb-1">Series</div>
                  <ul className="space-y-1">
                    {(Object.entries(selection.series) as Array<[string, ChartSelectionSeriesRange]>).map(
                      ([seriesId, range]) => (
                        <li key={seriesId}>
                          <span className="font-medium">{seriesId}:</span>
                          <span className="ml-2 text-xs text-gray-700">
                            {range.min.label} ({range.min.value ?? 'N/A'}) → {range.max.label} (
                            {range.max.value ?? 'N/A'})
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
                <div className="mt-3 text-xs text-gray-700">
                  Captured {selection.maxIndex - selection.minIndex + 1} x-axis positions.
                </div>
              </div>
            ) : null}

            <InteractiveChartQuickActions
              dataPointsCount={dataPoints.length}
              isStreaming={isStreaming}
              streamingHz={streamingHz}
              streamingPointsPerTick={streamingPointsPerTick}
              streamingMaxPoints={streamingMaxPoints}
              bulkAddCount={bulkAddCount}
              onToggleStreaming={toggleStreaming}
              onStreamingHzChange={handleStreamingHzChange}
              onStreamingPointsPerTickChange={handleStreamingPointsPerTickChange}
              onStreamingMaxPointsChange={handleStreamingMaxPointsChange}
              onBulkAddCountChange={handleBulkAddCountChange}
              onBulkAddPoints={addBulkPoints}
            />

            <InteractiveChartCodePreview code={codePreview} />
          </div>

          <div className="lg:col-span-1">
            <InteractiveChartControlPanel
              dataPointsCount={dataPoints.length}
              config={config}
              axisSummaries={axisSummaries}
              onSetAxisCount={handleSetAxisCount}
              onSetAxisSeriesCount={handleSetAxisSeriesCount}
              onAddSeries={handleAddSeries}
              onRemoveSeries={handleRemoveSeries}
              onUpdateSeries={handleUpdateSeries}
              onAddAxis={handleAddAxis}
              onRemoveAxis={handleRemoveAxis}
              onUpdateAxis={handleUpdateAxis}
              setConfig={setConfig}
            />

            {selection ? (
              <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">
                <div className="font-semibold mb-2">Selection Summary</div>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <span className="font-medium">Range:</span> {selection.minLabel} ➜ {selection.maxLabel}
                  </div>
                  <div>
                    <span className="font-medium">Span:</span> {selection.maxIndex - selection.minIndex} interval(s)
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InteractiveChartDemoNew
