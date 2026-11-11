import { useCallback, useEffect, useMemo, useRef, useState, type FC, type ReactNode } from 'react'
import { ZoomIn, ZoomOut, Type, Minus, Circle, Pen } from 'lucide-react'
import {
  type ChartRecord,
  type InteractiveChartAxisConfig,
  type InteractiveChartConfig,
  type InteractiveChartSeriesConfig,
  type InteractiveChartToolbarTool,
  type GeneratedChunk,
  type TimeSeriesBuffer,
  appendChunk,
  applyMaxPoints,
  bufferByteSize,
  bufferFromChunk,
  compactTimeSeries,
  continuationRequest,
  freshRequest,
  generateRandomWalk,
  generateTimeSeries,
  sampleRecords,
  toChartColumns,
  buildInteractiveChartCodePreview,
  InteractiveChartCanvas,
  InteractiveChartQuickActions,
  InteractiveChartCodePreview,
  InteractiveChartControlPanel
} from '../ExampleComponents/InteractiveChart'
import { createChartCustomTag } from 'react-canvas-charts'
import type {
  ChartSelectionResult,
  ChartSelectionSeriesRange,
  ChartToolbarPosition,
  ChartAnnotation,
  ChartCustomTag,
  ChartPointSelector,
  ChartTagPlacement
} from 'react-canvas-charts'

const SERIES_COLOR_PALETTE = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

type CustomTagTemplateId = 'tag' | 'note' | 'stat' | 'mini-chart'

type CustomTagTemplate = {
  id: CustomTagTemplateId
  label: string
  description: string
  offsetY: number
  buildContent: (placement: ChartTagPlacement) => ReactNode
}

const CUSTOM_TAG_TEMPLATES: CustomTagTemplate[] = [
  {
    id: 'tag',
    label: 'Tag',
    description: 'Simple pill label',
    offsetY: -24,
    buildContent: (placement) => (
      <div className="rounded-full bg-blue-600 text-white text-xs font-semibold px-3 py-1 shadow-md">
        {placement.label}
      </div>
    )
  },
  {
    id: 'note',
    label: 'Note',
    description: 'Description card',
    offsetY: -44,
    buildContent: (placement) => (
      <div className="w-48 rounded-lg border border-amber-200 bg-amber-50 p-2 shadow-lg">
        <div className="text-[11px] uppercase tracking-wide text-amber-700 font-bold">Note</div>
        <div className="mt-1 text-xs text-gray-800">{placement.label}: custom context here.</div>
      </div>
    )
  },
  {
    id: 'stat',
    label: 'Stat',
    description: 'KPI style badge',
    offsetY: -30,
    buildContent: (placement) => (
      <div className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 shadow-sm">
        <div className="text-[10px] uppercase text-emerald-700 font-semibold">Value</div>
        <div className="text-sm font-bold text-emerald-900">{placement.yValue.toFixed(1)}</div>
      </div>
    )
  },
  {
    id: 'mini-chart',
    label: 'Mini Chart',
    description: 'Tiny sparkline card',
    offsetY: -46,
    buildContent: (placement) => (
      <div className="w-36 rounded-lg border border-slate-300 bg-white p-2 shadow-lg">
        <div className="text-[11px] text-slate-700 font-semibold mb-1">{placement.label}</div>
        <svg viewBox="0 0 120 32" className="w-full h-8" aria-hidden="true">
          <path d="M2 25 L18 20 L34 23 L50 12 L66 16 L82 10 L98 14 L116 8" fill="none" stroke="#2563eb" strokeWidth="2" />
        </svg>
      </div>
    )
  }
]

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

/** Absolute (buffer) index range. The first zoom stack entry stands for "everything live". */
type ZoomRange = { start: number; end: number }

const INITIAL_POINT_COUNT = 1200

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
  const [config, setConfig] = useState<InteractiveChartConfig>(INITIAL_CONFIG)
  // Typed-array time series. Arrays are appended in place; each update commits a new buffer
  // object so React (and the React Compiler) see a change.
  const [timeSeries, setTimeSeries] = useState<TimeSeriesBuffer>(() => {
    const ids = INITIAL_CONFIG.series.map((series) => series.id)
    return bufferFromChunk(generateRandomWalk(freshRequest(ids, INITIAL_POINT_COUNT)), ids)
  })
  const timeSeriesRef = useRef(timeSeries)
  const [generationStatus, setGenerationStatus] = useState<string | null>(null)
  const generationTokenRef = useRef(0)
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>([])
  const [pointSelectors, setPointSelectors] = useState<ChartPointSelector[]>([])
  const [customTags, setCustomTags] = useState<ChartCustomTag[]>([])
  const [selectedCustomTagTemplate, setSelectedCustomTagTemplate] = useState<CustomTagTemplateId>('tag')
  const [customTagPlacementEnabled, setCustomTagPlacementEnabled] = useState(false)
  const [lastCustomTagPlacement, setLastCustomTagPlacement] = useState<ChartTagPlacement | null>(null)
  const [zoomStack, setZoomStack] = useState<ZoomRange[]>([{ start: 0, end: INITIAL_POINT_COUNT - 1 }])
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
  const customTagSeriesId = seriesIds[0]

  const axisSummaries = useMemo(
    () =>
      config.axes.map((axis) => ({
        axis,
        seriesCount: config.series.filter((series) => series.axisId === axis.id).length
      })),
    [config.axes, config.series]
  )

  const commitTimeSeries = useCallback((next: TimeSeriesBuffer) => {
    timeSeriesRef.current = next
    setTimeSeries(next)
  }, [])

  const resetZoomToFull = useCallback((buffer: TimeSeriesBuffer) => {
    setZoomStack([{ start: buffer.offset, end: Math.max(buffer.offset, buffer.length - 1) }])
    setSelection(null)
    setSelectionResetKey((key) => key + 1)
  }, [])

  /** Re-bases stored absolute indices after the buffer was compacted by `shift` samples. */
  const shiftStoredIndices = useCallback((shift: number) => {
    if (shift === 0) {
      return
    }
    // Anything that only referenced dropped samples is discarded rather than clamped.
    setZoomStack((previous) =>
      previous
        .filter((range, position) => position === 0 || range.end >= shift)
        .map(({ start, end }) => ({ start: Math.max(0, start - shift), end: Math.max(0, end - shift) }))
    )
    setPointSelectors((previous) =>
      previous
        .filter((selector) => selector.dataIndex >= shift)
        .map((selector) => ({ ...selector, dataIndex: selector.dataIndex - shift }))
    )
    setCustomTags((previous) =>
      previous.filter((tag) => tag.dataIndex >= shift).map((tag) => ({ ...tag, dataIndex: tag.dataIndex - shift }))
    )
    setSelection(null)
    setSelectionResetKey((key) => key + 1)
  }, [])

  /** Appends generated samples, applies the max-points window and compacts when worthwhile. */
  const appendSamples = useCallback(
    (chunk: GeneratedChunk) => {
      const current = timeSeriesRef.current
      const added = chunk.x.length
      if (added === 0) {
        return
      }

      // Async chunks may have been requested before other appends landed: keep time monotonic.
      const timeDelta = current.nextTimestamp - chunk.x[0]
      if (timeDelta !== 0) {
        for (let index = 0; index < added; index += 1) chunk.x[index] += timeDelta
        chunk.nextTimestamp += timeDelta
      }

      const previousLength = current.length
      const windowed = applyMaxPoints(appendChunk(current, chunk), streamingMaxPoints)
      const { buffer, shift } = compactTimeSeries(windowed)
      commitTimeSeries(buffer)

      // Zoomed ranges that ended at the newest sample keep following the stream.
      setZoomStack((previous) =>
        previous.map((range, position) =>
          position > 0 && range.end >= previousLength - 1
            ? { start: range.start + added, end: range.end + added }
            : range
        )
      )
      shiftStoredIndices(shift)
    },
    [commitTimeSeries, shiftStoredIndices, streamingMaxPoints]
  )

  /** Replaces the dataset. Large datasets are generated in a Web Worker. */
  const regenerateData = useCallback(
    (seriesIds: string[], pointCount: number) => {
      const count = Math.max(1, Math.floor(pointCount))
      const token = ++generationTokenRef.current
      setGenerationStatus(`Generating ${count.toLocaleString()} points…`)
      void generateTimeSeries(freshRequest(seriesIds, count)).then((chunk) => {
        if (token !== generationTokenRef.current) {
          return
        }
        const buffer = bufferFromChunk(chunk, seriesIds)
        commitTimeSeries(buffer)
        resetZoomToFull(buffer)
        setPointSelectors([])
        setCustomTags([])
        setGenerationStatus(null)
      })
    },
    [commitTimeSeries, resetZoomToFull]
  )

  const regenerateDataForSeries = useCallback(
    (nextSeries: InteractiveChartSeriesConfig[], options?: { pointCount?: number }) => {
      const current = timeSeriesRef.current
      const liveCount = current.length - current.offset
      regenerateData(
        nextSeries.map((series) => series.id),
        options?.pointCount ?? (liveCount > 0 ? liveCount : 12)
      )
    },
    [regenerateData]
  )

  const generateDataset = useCallback(
    (pointCount: number) => {
      // Keep the whole dataset when streaming afterwards (the window slides at this size).
      setStreamingMaxPoints((previous) => (previous > 0 && previous < pointCount ? pointCount : previous))
      regenerateData(seriesIds, pointCount)
    },
    [regenerateData, seriesIds]
  )

  const appendStreamingPoint = useCallback(() => {
    const current = timeSeriesRef.current
    appendSamples(generateRandomWalk(continuationRequest(current, Math.max(1, streamingPointsPerTick))))
  }, [appendSamples, streamingPointsPerTick])

  const addBulkPoints = useCallback(() => {
    if (bulkAddCount <= 0) {
      return
    }

    const token = generationTokenRef.current
    setGenerationStatus(`Generating ${bulkAddCount.toLocaleString()} points…`)
    void generateTimeSeries(continuationRequest(timeSeriesRef.current, bulkAddCount)).then((chunk) => {
      if (token !== generationTokenRef.current) {
        return
      }
      appendSamples(chunk)
      setGenerationStatus(null)
    })
  }, [appendSamples, bulkAddCount])

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

  // Apply a lowered max-points limit immediately.
  useEffect(() => {
    const current = timeSeriesRef.current
    const windowed = applyMaxPoints(current, streamingMaxPoints)
    if (windowed === current) {
      return
    }
    const { buffer, shift } = compactTimeSeries(windowed)
    commitTimeSeries(buffer)
    shiftStoredIndices(shift)
  }, [commitTimeSeries, shiftStoredIndices, streamingMaxPoints])

  const toggleStreaming = useCallback(() => {
    setIsStreaming((previous) => !previous)
  }, [])

  const liveStart = timeSeries.offset
  const liveEnd = timeSeries.length - 1

  const visibleRange = useMemo(() => {
    if (liveEnd < liveStart) {
      return { start: 0, end: -1 }
    }
    if (zoomStack.length <= 1) {
      return { start: liveStart, end: liveEnd }
    }

    const currentRange = zoomStack[zoomStack.length - 1]
    if (currentRange.end < liveStart || currentRange.start > liveEnd) {
      // The zoomed window was dropped by the max-points limit.
      return { start: liveStart, end: liveEnd }
    }
    const start = clamp(currentRange.start, liveStart, liveEnd)
    const end = clamp(currentRange.end, start, liveEnd)
    return { start, end }
  }, [liveEnd, liveStart, zoomStack])

  const visibleCount = Math.max(0, visibleRange.end - visibleRange.start + 1)
  const liveCount = Math.max(0, liveEnd - liveStart + 1)

  // Columnar view over the typed buffers; no per-point objects are created.
  const chartColumns = useMemo(() => toChartColumns(timeSeries), [timeSeries])

  const previewRecords = useMemo(() => sampleRecords(timeSeries, 2) as ChartRecord[], [timeSeries])

  const canZoomIn = Boolean(selection && selection.minIndex < selection.maxIndex && visibleCount > 0)
  const canZoomOut = zoomStack.length > 1

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

        // Selection indices are absolute data indices.
        const nextStart = selection.minIndex
        const nextEnd = selection.maxIndex

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
    [canZoomIn, canZoomOut, selection, setSelectionResetKey]
  )

  const codePreview = useMemo(
    () => buildInteractiveChartCodePreview(config, previewRecords),
    [config, previewRecords]
  )

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

  const selectedCustomTagTemplateConfig = useMemo(
    () => CUSTOM_TAG_TEMPLATES.find((template) => template.id === selectedCustomTagTemplate) ?? CUSTOM_TAG_TEMPLATES[0],
    [selectedCustomTagTemplate]
  )

  const handleCreateCustomTag = useCallback(
    (placement: ChartTagPlacement): ChartCustomTag | null => {
      if (!selectedCustomTagTemplateConfig) {
        return null
      }

      return createChartCustomTag(
        selectedCustomTagTemplateConfig.buildContent(placement),
        placement.dataIndex,
        placement.yValue,
        {
          dataKey: placement.dataKey,
          scaleId: placement.scaleId,
          offsetY: selectedCustomTagTemplateConfig.offsetY
        }
      )
    },
    [selectedCustomTagTemplateConfig]
  )

  const handleCustomTagPlacement = useCallback((placement: ChartTagPlacement) => {
    setLastCustomTagPlacement(placement)
  }, [])

  const chartAiApiKey = import.meta.env.CHART_AI_API_KEY ?? ''

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
                columns={chartColumns}
                viewRange={visibleRange}
                config={{ ...config, annotations }}
                selection={selection}
                onSelectionChange={handleSelectionChange}
                toolbarTools={toolbarTools}
                toolbarEnabled={config.toolbar?.enabled !== false}
                toolbarMultiSelect={false}
                selectionResetKey={selectionResetKey}
                onToolbarToggle={handleToolbarToggle}
                onToolbarPositionChange={handleToolbarPositionChange}
                onAnnotationsChange={setAnnotations}
                pointSelectors={pointSelectors}
                onPointSelectorsChange={setPointSelectors}
                customTags={customTags}
                onCustomTagsChange={setCustomTags}
                enableCustomTagCreation={customTagPlacementEnabled}
                customTagCreationDataKey={customTagSeriesId}
                onCustomTagPlacement={handleCustomTagPlacement}
                createCustomTag={handleCreateCustomTag}
                chartAiApiKey={chartAiApiKey}
              />
            </div>

            <div className="mt-4 p-4 bg-emerald-50 rounded-lg text-sm text-gray-900">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-semibold">Custom Tags ({customTags.length})</div>
                  <div className="text-xs text-gray-700">
                    Pick a template, enable placement, then click the chart to add it at that point.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCustomTagPlacementEnabled((previous) => !previous)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold ${
                      customTagPlacementEnabled
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {customTagPlacementEnabled ? 'Placement On' : 'Placement Off'}
                  </button>
                  <button
                    onClick={() => setCustomTags([])}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                    disabled={customTags.length === 0}
                  >
                    Clear Tags
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                {CUSTOM_TAG_TEMPLATES.map((template) => {
                  const isSelected = template.id === selectedCustomTagTemplate
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedCustomTagTemplate(template.id)}
                      className={`rounded-md border px-2 py-2 text-left ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-100 text-emerald-900'
                          : 'border-emerald-200 bg-white text-gray-800 hover:bg-emerald-100'
                      }`}
                    >
                      <div className="text-xs font-semibold">{template.label}</div>
                      <div className="text-[11px] text-gray-600">{template.description}</div>
                    </button>
                  )
                })}
              </div>

              {lastCustomTagPlacement ? (
                <div className="mt-3 text-xs text-emerald-800">
                  Last placed at {lastCustomTagPlacement.label} with value {lastCustomTagPlacement.yValue.toFixed(2)}.
                </div>
              ) : null}

              {customTags.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {customTags.map((tag) => (
                    <li key={tag.id} className="flex items-center justify-between text-xs">
                      <span>
                        {tag.dataKey ?? tag.scaleId ?? 'default'} @ index {tag.dataIndex} ({tag.yValue.toFixed(2)})
                      </span>
                      <button
                        onClick={() => setCustomTags((previous) => previous.filter((item) => item.id !== tag.id))}
                        className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
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
              dataPointsCount={liveCount}
              visiblePointsCount={visibleCount}
              dataBytes={bufferByteSize(timeSeries)}
              generationStatus={generationStatus}
              onGenerateDataset={generateDataset}
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
              dataPointsCount={liveCount}
              newSelectorIndex={visibleRange.start}
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
              pointSelectors={pointSelectors}
              onPointSelectorsChange={setPointSelectors}
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
