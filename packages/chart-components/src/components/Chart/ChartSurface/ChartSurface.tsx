import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DataPoint as CursorDataPoint } from '../InternalComponents/ChartCursor'
import { defaultChartCursorProps, findNearestDataPoint } from '../InternalComponents/ChartCursor'
import { CanvasWrapper } from '../CanvasWrapper/CanvasWrapper'
import {
  shallowEqualArray,
  mergeMargin as mergeMarginUtil,
  computeDomain,
  clampXToChart,
  isWithinChart,
  getRelativePosition
} from '../../../utils/chartCalculations'
import { computeSelectionResult, MIN_SELECTION_WIDTH } from '../../../utils/chartSelection'
import { ChartSurfaceContext } from '../../../utils/context/ChartSurfaceContext'
import { ChartOverlayContainerContext } from '../../../utils/context/ChartOverlayContext'
import {
  DEFAULT_COLORS,
  DEFAULT_MARGIN,
  DEFAULT_VALUE_DOMAIN,
  Y_AXIS_BAND_WIDTH,
  LayerOrder
} from './ChartSurface.constants'
import type {
  ValueDomain,
  NormalizedDatum,
  ChartArea,
  ChartSurfaceProps,
  ChartLayerRenderer,
  ChartLayerOptions,
  ChartLayer,
  ChartLayerHandle,
  ChartSurfaceContextValue,
  ChartSurfaceRenderHelpers,
  ValueScaleDefinition,
  AxisTickDescriptor,
  AxisTickState,
  CursorOptions,
  ChartPointer,
  ChartSelectionResult
} from './ChartSurface.types'
import './ChartSurface.css'

const defaultCursorOptions: CursorOptions = {
  snapRadius: defaultChartCursorProps.snapRadius,
  snapToDataPoints: defaultChartCursorProps.snapToDataPoints,
  snapAlongYAxis: defaultChartCursorProps.snapAlongYAxis
}

export const ChartSurface: React.FC<ChartSurfaceProps> = ({
  data,
  xKey,
  yKeys: yKeysProp,
  xAxisType = 'linear',
  width = 800,
  height = 400,
  margin,
  backgroundColor = '#ffffff',
  defaultColors = DEFAULT_COLORS,
  className,
  style,
  onHover,
  onClick,
  onSelectionChange,
  valueScales,
  children,
  selectionResetKey
}) => {
  const resolvedMargin = useMemo(() => mergeMarginUtil(margin, DEFAULT_MARGIN), [margin])

  const resolvedYKeys = useMemo(() => {
    if (yKeysProp && yKeysProp.length > 0) {
      return yKeysProp
    }

    const numericKeys = new Set<string>()

    data.forEach((datum) => {
      Object.entries(datum).forEach(([key, value]) => {
        if (key === xKey) return
        if (typeof value === 'number' && Number.isFinite(value)) {
          numericKeys.add(key)
        }
      })
    })

    return Array.from(numericKeys)
  }, [data, xKey, yKeysProp])

  const [layers, setLayers] = useState<ChartLayer[]>([])
  const layerIdRef = useRef(0)

  const [axisTicks, setAxisTickState] = useState<AxisTickState>({
    x: null,
    y: null
  })

  const cursorOptionsMapRef = useRef(new Map<string, Partial<CursorOptions>>())
  const [cursorOptions, setCursorOptions] = useState<CursorOptions>(defaultCursorOptions)

  const yAxisRegistryRef = useRef<{ left: string[]; right: string[] }>({
    left: [],
    right: []
  })
  const yAxisIdRef = useRef(0)
  const [yAxisCounts, setYAxisCounts] = useState<{ left: number; right: number }>(() => ({ left: 0, right: 0 }))
  const [horizontalBarCount, setHorizontalBarCount] = useState(0)
  const barOrientation = horizontalBarCount > 0 ? ('horizontal' as const) : ('vertical' as const)

  const recomputeCursorOptions = useCallback(() => {
    const aggregated: CursorOptions = { ...defaultCursorOptions }

    cursorOptionsMapRef.current.forEach((options) => {
      if (options.snapRadius !== undefined) {
        aggregated.snapRadius = options.snapRadius
      }
      if (options.snapToDataPoints !== undefined) {
        aggregated.snapToDataPoints = options.snapToDataPoints
      }
      if (options.snapAlongYAxis !== undefined) {
        aggregated.snapAlongYAxis = options.snapAlongYAxis
      }
    })

    setCursorOptions((prev) =>
      prev.snapRadius === aggregated.snapRadius &&
      prev.snapToDataPoints === aggregated.snapToDataPoints &&
      prev.snapAlongYAxis === aggregated.snapAlongYAxis
        ? prev
        : aggregated
    )
  }, [])

  const registerCursorOptions = useCallback(
    (options: Partial<CursorOptions>) => {
      const id = `cursor-${cursorOptionsMapRef.current.size + 1}`
      cursorOptionsMapRef.current.set(id, options)
      recomputeCursorOptions()

      return () => {
        cursorOptionsMapRef.current.delete(id)
        recomputeCursorOptions()
      }
    },
    [recomputeCursorOptions]
  )

  const registerYAxis = useCallback((side: 'left' | 'right') => {
    const id = `y-axis-${(yAxisIdRef.current += 1)}`
    const registry = yAxisRegistryRef.current
    registry[side] = [...registry[side], id]
    setYAxisCounts({
      left: registry.left.length,
      right: registry.right.length
    })

    return {
      id,
      unregister: () => {
        const current = yAxisRegistryRef.current
        current[side] = current[side].filter((axisId) => axisId !== id)
        setYAxisCounts({
          left: current.left.length,
          right: current.right.length
        })
      }
    }
  }, [])

  const registerHorizontalBars = useCallback(() => {
    setHorizontalBarCount((c) => c + 1)
    return () => {
      setHorizontalBarCount((c) => c - 1)
    }
  }, [])

  const getYAxisIndex = useCallback((id: string, side: 'left' | 'right') => {
    const registry = yAxisRegistryRef.current
    return registry[side].indexOf(id)
  }, [])

  const registerLayer = useCallback((draw: ChartLayerRenderer, options: ChartLayerOptions = {}) => {
    const id = `layer-${(layerIdRef.current += 1)}`
    const order = options.order ?? 0

    setLayers((prev) => [...prev, { id, order, draw }])

    const update: ChartLayerHandle['update'] = (nextDraw, nextOptions) => {
      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === id
            ? {
                id,
                order: nextOptions?.order ?? layer.order,
                draw: nextDraw
              }
            : layer
        )
      )
    }

    const unregister = () => {
      setLayers((prev) => prev.filter((layer) => layer.id !== id))
    }

    return { update, unregister }
  }, [])

  const setAxisTicks = useCallback((axis: 'x' | 'y', descriptor: AxisTickDescriptor | null) => {
    setAxisTickState((prev) => {
      const next: AxisTickState = axis === 'x' ? { ...prev, x: descriptor } : { ...prev, y: descriptor }

      if (axis === 'x') {
        const prevPositions = prev.x?.positions ?? []
        const nextPositions = descriptor?.positions ?? []
        if (shallowEqualArray(prevPositions, nextPositions)) {
          return prev
        }
      } else {
        const prevPositions = prev.y?.positions ?? []
        const nextPositions = descriptor?.positions ?? []
        if (shallowEqualArray(prevPositions, nextPositions)) {
          return prev
        }
      }

      return next
    })
  }, [])

  const pointerRef = useRef<ChartPointer | null>(null)
  const [canvasSize, setCanvasSize] = useState({
    width: typeof width === 'number' ? width : 0,
    height: typeof height === 'number' ? height : 0
  })
  const [overlayContainer, setOverlayContainer] = useState<HTMLDivElement | null>(null)
  const overlayContainerRef = useCallback((node: HTMLDivElement | null) => {
    setOverlayContainer(node)
  }, [])
  const cursorOptionsRef = useRef(cursorOptions)
  useEffect(() => {
    cursorOptionsRef.current = cursorOptions
  }, [cursorOptions])

  const labels = useMemo(() => data.map((datum) => String(datum[xKey] ?? '')), [data, xKey])

  const chartArea = useMemo<ChartArea>(() => {
    const leftOffset = Math.max(0, yAxisCounts.left - 1) * Y_AXIS_BAND_WIDTH
    const rightOffset = Math.max(0, yAxisCounts.right - 1) * Y_AXIS_BAND_WIDTH

    return {
      x: resolvedMargin.left + leftOffset,
      y: resolvedMargin.top,
      width: Math.max(0, canvasSize.width - resolvedMargin.left - resolvedMargin.right - leftOffset - rightOffset),
      height: Math.max(0, canvasSize.height - resolvedMargin.top - resolvedMargin.bottom)
    }
  }, [
    canvasSize.height,
    canvasSize.width,
    resolvedMargin.bottom,
    resolvedMargin.left,
    resolvedMargin.right,
    resolvedMargin.top,
    yAxisCounts.left,
    yAxisCounts.right
  ])

  const perKeyStats = useMemo(() => {
    const stats = new Map<string, { min: number; max: number }>()

    resolvedYKeys.forEach((key) => {
      stats.set(key, {
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY
      })
    })

    data.forEach((datum) => {
      resolvedYKeys.forEach((key) => {
        const rawValue = datum[key]
        const numeric = typeof rawValue === 'number' ? rawValue : Number(rawValue)
        if (Number.isFinite(numeric)) {
          const entry = stats.get(key)
          if (entry) {
            entry.min = Math.min(entry.min, numeric)
            entry.max = Math.max(entry.max, numeric)
          }
        }
      })
    })

    const finalized = new Map<string, { min: number; max: number }>()

    stats.forEach((value, key) => {
      let min = value.min
      let max = value.max

      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        min = 0
        max = 1
      }

      if (min === max) {
        min -= 1
        max += 1
      }

      finalized.set(key, { min, max })
    })

    return finalized
  }, [data, resolvedYKeys])

  const valueScaleState = useMemo<{
    scales: Array<{
      id: string
      dataKeys: string[]
      domain?: ValueScaleDefinition['domain']
    }>
    assignments: Map<string, string>
  }>(() => {
    const assignments = new Map<string, string>()

    if (valueScales && valueScales.length > 0) {
      const sanitized = valueScales.map((scale, index) => {
        const id = scale.id ?? `scale-${index + 1}`
        const uniqueKeys = Array.from(
          new Set(scale.dataKeys && scale.dataKeys.length > 0 ? scale.dataKeys : resolvedYKeys)
        )
        uniqueKeys.forEach((key) => assignments.set(key, id))
        return {
          id,
          dataKeys: uniqueKeys,
          domain: scale.domain
        }
      })

      if (sanitized.length === 0) {
        sanitized.push({ id: 'default', dataKeys: [...resolvedYKeys], domain: undefined })
      }

      resolvedYKeys.forEach((key) => {
        if (!assignments.has(key)) {
          const fallback = sanitized[0]
          fallback.dataKeys = Array.from(new Set([...fallback.dataKeys, key]))
          assignments.set(key, fallback.id)
        }
      })

      return { scales: sanitized, assignments }
    }

    const fallback = [{ id: 'default', dataKeys: [...resolvedYKeys], domain: undefined }]
    resolvedYKeys.forEach((key) => assignments.set(key, 'default'))
    return { scales: fallback, assignments }
  }, [resolvedYKeys, valueScales])

  const resolvedValueScales = valueScaleState.scales
  const scaleAssignments = valueScaleState.assignments

  const valueDomainsByScale = useMemo<Record<string, ValueDomain>>(() => {
    const domains: Record<string, ValueDomain> = {}

    resolvedValueScales.forEach((scale) => {
      let min = Number.POSITIVE_INFINITY
      let max = Number.NEGATIVE_INFINITY

      scale.dataKeys.forEach((key) => {
        const stats = perKeyStats.get(key)
        if (stats) {
          min = Math.min(min, stats.min)
          max = Math.max(max, stats.max)
        }
      })

      if (scale.domain?.min !== undefined && Number.isFinite(scale.domain.min)) {
        min = scale.domain.min
      }
      if (scale.domain?.max !== undefined && Number.isFinite(scale.domain.max)) {
        max = scale.domain.max
      }

      domains[scale.id] = computeDomain(min, max)
    })

    return domains
  }, [perKeyStats, resolvedValueScales])

  const defaultScaleId = resolvedValueScales[0]?.id ?? 'default'
  const defaultValueDomain = useMemo<ValueDomain>(
    () => valueDomainsByScale[defaultScaleId] ?? DEFAULT_VALUE_DOMAIN,
    [defaultScaleId, valueDomainsByScale]
  )

  const getScaleDomain = useCallback(
    (scaleId: string) => valueDomainsByScale[scaleId] ?? defaultValueDomain,
    [defaultValueDomain, valueDomainsByScale]
  )

  const getScaleIdForKey = useCallback(
    (dataKey: string) => scaleAssignments.get(dataKey) ?? defaultScaleId,
    [defaultScaleId, scaleAssignments]
  )

  const getYPositionForScale = useCallback(
    (scaleId: string, value: number) => {
      if (!Number.isFinite(value)) {
        return chartArea.y + chartArea.height
      }

      const domain = valueDomainsByScale[scaleId] ?? defaultValueDomain
      const denominator = domain.paddedMax - domain.paddedMin

      if (denominator === 0 || chartArea.height === 0) {
        return chartArea.y + chartArea.height / 2
      }

      const normalized = (value - domain.paddedMin) / denominator
      const clamped = Math.max(0, Math.min(1, normalized))
      return chartArea.y + chartArea.height - clamped * chartArea.height
    },
    [chartArea.height, chartArea.y, defaultValueDomain, valueDomainsByScale]
  )

  const getYPositionForKey = useCallback(
    (dataKey: string, value: number) => {
      const scaleId = getScaleIdForKey(dataKey)
      return getYPositionForScale(scaleId, value)
    },
    [getScaleIdForKey, getYPositionForScale]
  )

  const getYPosition = useCallback(
    (value: number) => getYPositionForScale(defaultScaleId, value),
    [defaultScaleId, getYPositionForScale]
  )

  const valueDomain = defaultValueDomain

  const getXPosition = useCallback(
    (index: number) => {
      if (labels.length <= 1) {
        return chartArea.x + chartArea.width / 2
      }

      if (xAxisType === 'categorical') {
        // For categorical data (bar charts), center points in equal-width bands with padding
        // Divide width into (labels.length + 1) segments to create padding on both sides
        const segmentWidth = chartArea.width / (labels.length + 1)
        // Position bars starting at segment 1 (leaving segment 0 as left padding)
        return chartArea.x + (index + 1) * segmentWidth
      } else {
        // For linear data (line charts), spread points evenly from edge to edge
        const spacing = chartArea.width / Math.max(1, labels.length - 1)
        return chartArea.x + index * spacing
      }
    },
    [chartArea.width, chartArea.x, labels.length, xAxisType]
  )

  const labelPositions = useMemo(() => labels.map((_, index) => getXPosition(index)), [getXPosition, labels])

  const normalizedData = useMemo<NormalizedDatum[]>(
    () =>
      data.map((datum, index) => {
        const values: Record<string, number | null> = {}

        resolvedYKeys.forEach((key) => {
          const rawValue = datum[key]
          const numeric = typeof rawValue === 'number' ? rawValue : Number(rawValue)
          values[key] = Number.isFinite(numeric) ? numeric : null
        })

        return {
          index,
          label: labels[index] ?? '',
          x: labelPositions[index] ?? chartArea.x,
          values,
          raw: datum
        }
      }),
    [chartArea.x, data, labelPositions, labels, resolvedYKeys]
  )

  const dataPoints = useMemo<CursorDataPoint[]>(() => {
    const points: CursorDataPoint[] = []

    normalizedData.forEach((datum) => {
      resolvedYKeys.forEach((key, seriesIndex) => {
        const value = datum.values[key]
        if (value === null || !Number.isFinite(value)) {
          return
        }

        points.push({
          x: datum.x,
          y: getYPositionForKey(key, value),
          value,
          label: datum.label,
          seriesIndex,
          dataIndex: datum.index,
          originalData: {
            ...datum.raw,
            dataKey: key
          }
        })
      })
    })

    return points
  }, [getYPositionForKey, normalizedData, resolvedYKeys])

  const colorPalette = useMemo(() => (defaultColors.length > 0 ? defaultColors : DEFAULT_COLORS), [defaultColors])

  const colorMapRef = useRef(new Map<string, string>())

  useEffect(() => {
    const nextMap = new Map<string, string>()
    resolvedYKeys.forEach((key, index) => {
      const color = colorPalette[index % colorPalette.length]
      nextMap.set(key, color)
    })
    colorMapRef.current = nextMap
  }, [colorPalette, resolvedYKeys])

  const getColorForKey = useCallback(
    (dataKey: string, fallback?: string) => {
      if (colorMapRef.current.has(dataKey)) {
        return colorMapRef.current.get(dataKey) as string
      }

      const color = fallback ?? colorPalette[colorMapRef.current.size % colorPalette.length]
      colorMapRef.current.set(dataKey, color)
      return color
    },
    [colorPalette]
  )

  const layersSorted = useMemo(() => [...layers].sort((a, b) => a.order - b.order), [layers])

  const baseLayers = useMemo(() => layersSorted.filter((layer) => layer.order < LayerOrder.overlays), [layersSorted])

  const overlayLayers = useMemo(
    () => layersSorted.filter((layer) => layer.order >= LayerOrder.overlays),
    [layersSorted]
  )

  const dataPointsRef = useRef<CursorDataPoint[]>(dataPoints)
  useEffect(() => {
    dataPointsRef.current = dataPoints
  }, [dataPoints])

  const hoverHandlerRef = useRef(onHover)
  useEffect(() => {
    hoverHandlerRef.current = onHover
  }, [onHover])

  const clickHandlerRef = useRef(onClick)
  useEffect(() => {
    clickHandlerRef.current = onClick
  }, [onClick])

  const selectionHandlerRef = useRef(onSelectionChange)
  useEffect(() => {
    selectionHandlerRef.current = onSelectionChange
  }, [onSelectionChange])

  const axisTickStateRef = useRef(axisTicks)
  useEffect(() => {
    axisTickStateRef.current = axisTicks
  }, [axisTicks])

  const selectionActiveRef = useRef(false)
  const selectionStartRef = useRef<number | null>(null)
  const selectionWindowListenerRef = useRef<((event: MouseEvent) => void) | null>(null)
  const skipClickRef = useRef(false)
  const selectionRangeRef = useRef<{ start: number; end: number } | null>(null)
  const selectionResetRef = useRef(selectionResetKey)

  useEffect(
    () => () => {
      if (selectionWindowListenerRef.current) {
        window.removeEventListener('mouseup', selectionWindowListenerRef.current)
        selectionWindowListenerRef.current = null
      }
    },
    []
  )

  const [baseRenderVersion, setBaseRenderVersion] = useState(0)
  const overlayRenderCycleRef = useRef(0)
  const overlayRedrawRef = useRef<() => void>(() => {})
  const handleOverlayRedrawRegister = useCallback((fn: (() => void) | null) => {
    overlayRedrawRef.current = fn ?? (() => {})
  }, [])

  const requestOverlayRender = useCallback(() => {
    overlayRenderCycleRef.current += 1
    overlayRedrawRef.current()
  }, [])

  const requestRender = useCallback(() => {
    setBaseRenderVersion((version) => version + 1)
    requestOverlayRender()
  }, [requestOverlayRender])

  useEffect(() => {
    if (selectionResetRef.current !== selectionResetKey) {
      selectionResetRef.current = selectionResetKey
      selectionActiveRef.current = false
      selectionStartRef.current = null
      selectionRangeRef.current = null
      requestOverlayRender()
    }
  }, [requestOverlayRender, selectionResetKey])

  const updatePointer = useCallback(
    (next: ChartPointer | null) => {
      const previous = pointerRef.current
      if (previous && next) {
        if (Math.abs(previous.x - next.x) < 0.001 && Math.abs(previous.y - next.y) < 0.001) {
          return
        }
      } else if (!previous && !next) {
        return
      }

      pointerRef.current = next
      requestOverlayRender()
    },
    [requestOverlayRender]
  )

  const pendingPointerRef = useRef<{ x: number; y: number; withinChart: boolean } | null>(null)
  const pointerFrameRef = useRef<number | null>(null)

  const processPendingPointer = useCallback(() => {
    pointerFrameRef.current = null
    const pending = pendingPointerRef.current
    pendingPointerRef.current = null

    if (!pending) {
      return
    }

    if (!pending.withinChart) {
      updatePointer(null)
      hoverHandlerRef.current?.(null)
      return
    }

    const { x, y } = pending

    updatePointer({ x, y })

    const cursorOpts = cursorOptionsRef.current
    if (hoverHandlerRef.current) {
      const nearest = findNearestDataPoint(
        x,
        y,
        dataPointsRef.current,
        cursorOpts.snapRadius,
        cursorOpts.snapAlongYAxis
      )

      hoverHandlerRef.current(nearest?.point ?? null)
    }
  }, [updatePointer])

  const schedulePointerUpdate = useCallback(
    (update: { x: number; y: number; withinChart: boolean }) => {
      pendingPointerRef.current = update
      if (pointerFrameRef.current === null) {
        pointerFrameRef.current = window.requestAnimationFrame(processPendingPointer)
      }
    },
    [processPendingPointer]
  )

  useEffect(
    () => () => {
      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current)
        pointerFrameRef.current = null
      }
    },
    []
  )

  const getRelativePointerPosition = useCallback((event: MouseEvent, canvas: HTMLCanvasElement) => {
    return getRelativePosition(event.clientX, event.clientY, canvas)
  }, [])

  const getRelativeTouchPosition = useCallback((event: TouchEvent, canvas: HTMLCanvasElement) => {
    if (event.touches.length === 0) {
      return null
    }
    const touch = event.touches[0]
    return getRelativePosition(touch.clientX, touch.clientY, canvas)
  }, [])

  const computeSelectionResultCallback = useCallback(
    (rawStartX: number, rawEndX: number): ChartSelectionResult | null => {
      return computeSelectionResult(
        rawStartX,
        rawEndX,
        labelPositions,
        labels,
        normalizedData,
        resolvedYKeys,
        chartArea
      )
    },
    [labelPositions, labels, normalizedData, resolvedYKeys, chartArea]
  )

  const updateSelectionDuringDrag = useCallback(
    (currentX: number) => {
      if (!selectionActiveRef.current || selectionStartRef.current === null) {
        return
      }

      const start = selectionStartRef.current
      const previous = selectionRangeRef.current
      if (previous && previous.start === start && previous.end === currentX) {
        return
      }

      selectionRangeRef.current = { start, end: currentX }
      requestOverlayRender()

      if (!selectionHandlerRef.current) {
        return
      }

      if (Math.abs(currentX - start) >= MIN_SELECTION_WIDTH) {
        selectionHandlerRef.current(computeSelectionResultCallback(start, currentX))
      } else {
        selectionHandlerRef.current(null)
      }
    },
    [computeSelectionResultCallback, requestOverlayRender]
  )

  const finalizeSelection = useCallback(
    (currentX: number | null) => {
      if (!selectionActiveRef.current || selectionStartRef.current === null) {
        return
      }

      selectionActiveRef.current = false

      if (selectionWindowListenerRef.current) {
        window.removeEventListener('mouseup', selectionWindowListenerRef.current)
        selectionWindowListenerRef.current = null
      }

      const startRaw = selectionStartRef.current
      const endRaw = currentX ?? startRaw
      selectionStartRef.current = null

      const start = clampXToChart(startRaw, chartArea)
      const end = clampXToChart(endRaw, chartArea)

      if (Math.abs(end - start) < MIN_SELECTION_WIDTH) {
        selectionRangeRef.current = null
        requestOverlayRender()
        selectionHandlerRef.current?.(null)
        return
      }

      const result = computeSelectionResultCallback(start, end)

      if (!result) {
        selectionRangeRef.current = null
        requestOverlayRender()
        selectionHandlerRef.current?.(null)
        return
      }

      selectionRangeRef.current = {
        start: result.rangePixels.start,
        end: result.rangePixels.end
      }
      requestOverlayRender()
      selectionHandlerRef.current?.(result)
    },
    [chartArea, computeSelectionResultCallback, requestOverlayRender]
  )

  const startSelection = useCallback(
    (x: number, y: number) => {
      if (!isWithinChart(x, y, chartArea)) {
        return false
      }

      const clampedX = clampXToChart(x, chartArea)
      selectionActiveRef.current = true
      selectionStartRef.current = clampedX
      skipClickRef.current = false
      selectionRangeRef.current = { start: clampedX, end: clampedX }
      requestOverlayRender()
      return true
    },
    [chartArea, requestOverlayRender]
  )

  const handlePointerMove = useCallback(
    (x: number, y: number) => {
      const withinChart = isWithinChart(x, y, chartArea)
      schedulePointerUpdate({ x, y, withinChart })

      if (selectionActiveRef.current) {
        const clampedX = clampXToChart(x, chartArea)
        if (
          selectionStartRef.current !== null &&
          Math.abs(clampedX - selectionStartRef.current) >= MIN_SELECTION_WIDTH
        ) {
          skipClickRef.current = true
        }
        updateSelectionDuringDrag(clampedX)
        return true
      }
      return false
    },
    [chartArea, schedulePointerUpdate, updateSelectionDuringDrag]
  )

  const handleMouseMove = useCallback(
    (event: MouseEvent, canvas: HTMLCanvasElement) => {
      const { x, y } = getRelativePointerPosition(event, canvas)
      if (handlePointerMove(x, y)) {
        event.preventDefault()
      }
    },
    [getRelativePointerPosition, handlePointerMove]
  )

  const handleMouseLeave = useCallback(() => {
    pendingPointerRef.current = null
    if (pointerFrameRef.current !== null) {
      cancelAnimationFrame(pointerFrameRef.current)
      pointerFrameRef.current = null
    }
    if (selectionActiveRef.current) {
      const fallback = selectionRangeRef.current ? selectionRangeRef.current.end : selectionStartRef.current
      finalizeSelection(fallback ?? null)
    }
    updatePointer(null)
    hoverHandlerRef.current?.(null)
  }, [finalizeSelection, updatePointer])

  const handleMouseDown = useCallback(
    (event: MouseEvent, canvas: HTMLCanvasElement) => {
      if (event.button !== 0) {
        return
      }

      const { x, y } = getRelativePointerPosition(event, canvas)

      if (!startSelection(x, y)) {
        return
      }

      if (selectionWindowListenerRef.current) {
        window.removeEventListener('mouseup', selectionWindowListenerRef.current)
        selectionWindowListenerRef.current = null
      }

      const handleWindowMouseUp = (windowEvent: MouseEvent) => {
        const coordinates = getRelativePointerPosition(windowEvent, canvas)
        finalizeSelection(coordinates.x)
      }

      selectionWindowListenerRef.current = handleWindowMouseUp
      window.addEventListener('mouseup', handleWindowMouseUp)

      event.preventDefault()
    },
    [finalizeSelection, getRelativePointerPosition, startSelection]
  )

  const handleMouseUp = useCallback(
    (event: MouseEvent, canvas: HTMLCanvasElement) => {
      if (!selectionActiveRef.current || selectionStartRef.current === null) {
        return
      }

      const { x } = getRelativePointerPosition(event, canvas)
      const start = selectionStartRef.current

      if (Math.abs(x - start) >= MIN_SELECTION_WIDTH) {
        skipClickRef.current = true
      }

      finalizeSelection(x)
      event.preventDefault()
    },
    [finalizeSelection, getRelativePointerPosition]
  )

  const handleClick = useCallback(
    (event: MouseEvent, canvas: HTMLCanvasElement) => {
      if (!clickHandlerRef.current) return

      if (skipClickRef.current) {
        skipClickRef.current = false
        return
      }

      const { x, y } = getRelativePointerPosition(event, canvas)

      if (!isWithinChart(x, y, chartArea)) {
        clickHandlerRef.current(null)
        return
      }

      const cursorOpts = cursorOptionsRef.current
      const nearest = findNearestDataPoint(
        x,
        y,
        dataPointsRef.current,
        cursorOpts.snapRadius,
        cursorOpts.snapAlongYAxis
      )

      clickHandlerRef.current(nearest?.point ?? null)
    },
    [chartArea, getRelativePointerPosition]
  )

  const touchWindowListenerRef = useRef<((event: TouchEvent) => void) | null>(null)

  const handleTouchStart = useCallback(
    (event: TouchEvent, canvas: HTMLCanvasElement) => {
      const position = getRelativeTouchPosition(event, canvas)
      if (!position) return

      const { x, y } = position

      if (!startSelection(x, y)) {
        return
      }

      if (touchWindowListenerRef.current) {
        window.removeEventListener('touchend', touchWindowListenerRef.current)
        touchWindowListenerRef.current = null
      }

      const handleWindowTouchEnd = (windowEvent: TouchEvent) => {
        if (windowEvent.changedTouches.length > 0) {
          const touch = windowEvent.changedTouches[0]
          const { x: touchX } = getRelativePosition(touch.clientX, touch.clientY, canvas)
          finalizeSelection(touchX)
        }
      }

      touchWindowListenerRef.current = handleWindowTouchEnd
      window.addEventListener('touchend', handleWindowTouchEnd)

      event.preventDefault()
    },
    [finalizeSelection, getRelativeTouchPosition, startSelection]
  )

  const handleTouchMove = useCallback(
    (event: TouchEvent, canvas: HTMLCanvasElement) => {
      const position = getRelativeTouchPosition(event, canvas)
      if (!position) return

      const { x, y } = position
      if (handlePointerMove(x, y)) {
        event.preventDefault()
      }
    },
    [getRelativeTouchPosition, handlePointerMove]
  )

  const handleTouchEnd = useCallback(
    (event: TouchEvent, canvas: HTMLCanvasElement) => {
      if (!selectionActiveRef.current || selectionStartRef.current === null) {
        return
      }

      if (event.changedTouches.length > 0) {
        const touch = event.changedTouches[0]
        const { x } = getRelativePosition(touch.clientX, touch.clientY, canvas)
        const start = selectionStartRef.current

        if (Math.abs(x - start) >= MIN_SELECTION_WIDTH) {
          skipClickRef.current = true
        }

        finalizeSelection(x)
        event.preventDefault()
      }
    },
    [finalizeSelection]
  )

  useEffect(
    () => () => {
      if (touchWindowListenerRef.current) {
        window.removeEventListener('touchend', touchWindowListenerRef.current)
        touchWindowListenerRef.current = null
      }
    },
    []
  )

  const drawBase = useCallback(
    (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const devicePixelRatio = window.devicePixelRatio || 1
      const canvasWidth = canvas.width / devicePixelRatio
      const canvasHeight = canvas.height / devicePixelRatio

      if (Math.abs(canvasWidth - canvasSize.width) > 0.5 || Math.abs(canvasHeight - canvasSize.height) > 0.5) {
        setCanvasSize({ width: canvasWidth, height: canvasHeight })
      }

      context.save()
      context.fillStyle = backgroundColor
      context.fillRect(0, 0, canvasWidth, canvasHeight)
      context.restore()

      if (baseLayers.length === 0) {
        return
      }

      const helpers: ChartSurfaceRenderHelpers = {
        canvasWidth,
        canvasHeight,
        chartArea,
        labels,
        labelPositions,
        normalizedData,
        getXPosition,
        getYPosition,
        getYPositionForScale,
        getYPositionForKey,
        getScaleDomain,
        getScaleIdForKey,
        defaultScaleId,
        colorForKey: getColorForKey,
        pointer: pointerRef.current,
        dataPoints,
        axisTicks: axisTickStateRef.current,
        valueDomain,
        valueDomainsByScale,
        renderCycle: baseRenderVersion,
        yAxisCounts,
        barOrientation
      }

      baseLayers.forEach((layer) => {
        layer.draw(context, helpers)
      })
    },
    [
      backgroundColor,
      baseLayers,
      canvasSize.height,
      canvasSize.width,
      chartArea,
      dataPoints,
      getColorForKey,
      getScaleDomain,
      getScaleIdForKey,
      getXPosition,
      getYPosition,
      getYPositionForKey,
      getYPositionForScale,
      labelPositions,
      labels,
      normalizedData,
      baseRenderVersion,
      valueDomain,
      valueDomainsByScale,
      yAxisCounts,
      defaultScaleId,
      barOrientation
    ]
  )

  const drawOverlay = useCallback(
    (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const devicePixelRatio = window.devicePixelRatio || 1
      const canvasWidth = canvas.width / devicePixelRatio
      const canvasHeight = canvas.height / devicePixelRatio

      context.save()
      context.clearRect(0, 0, canvasWidth, canvasHeight)
      context.restore()

      const selectionRange = selectionRangeRef.current
      if (selectionRange) {
        const rawStart = Math.min(selectionRange.start, selectionRange.end)
        const rawEnd = Math.max(selectionRange.start, selectionRange.end)
        const start = Math.max(chartArea.x, Math.min(rawStart, chartArea.x + chartArea.width))
        const end = Math.max(chartArea.x, Math.min(rawEnd, chartArea.x + chartArea.width))

        if (end - start >= 1) {
          context.save()
          context.fillStyle = 'rgba(59, 130, 246, 0.15)'
          context.fillRect(start, chartArea.y, end - start, chartArea.height)
          context.strokeStyle = 'rgba(59, 130, 246, 0.45)'
          context.lineWidth = 1
          context.strokeRect(start + 0.5, chartArea.y + 0.5, end - start - 1, chartArea.height - 1)
          context.restore()
        }
      }

      if (overlayLayers.length === 0) {
        return
      }

      const helpers: ChartSurfaceRenderHelpers = {
        canvasWidth,
        canvasHeight,
        chartArea,
        labels,
        labelPositions,
        normalizedData,
        getXPosition,
        getYPosition,
        getYPositionForScale,
        getYPositionForKey,
        getScaleDomain,
        getScaleIdForKey,
        defaultScaleId,
        colorForKey: getColorForKey,
        pointer: pointerRef.current,
        dataPoints,
        axisTicks: axisTickStateRef.current,
        valueDomain,
        valueDomainsByScale,
        renderCycle: overlayRenderCycleRef.current,
        yAxisCounts,
        barOrientation
      }

      overlayLayers.forEach((layer) => {
        layer.draw(context, helpers)
      })
    },
    [
      chartArea,
      dataPoints,
      getColorForKey,
      getScaleDomain,
      getScaleIdForKey,
      getXPosition,
      getYPosition,
      getYPositionForKey,
      getYPositionForScale,
      labelPositions,
      labels,
      normalizedData,
      overlayLayers,
      valueDomain,
      valueDomainsByScale,
      yAxisCounts,
      barOrientation,
      defaultScaleId
    ]
  )

  const contextValue = useMemo<ChartSurfaceContextValue>(
    () => ({
      data,
      xKey,
      yKeys: resolvedYKeys,
      labels,
      labelPositions,
      chartArea,
      canvasSize,
      valueDomain,
      defaultScaleId,
      valueDomainsByScale,
      getXPosition,
      getYPosition,
      getYPositionForScale,
      getYPositionForKey,
      getScaleDomain,
      getScaleIdForKey,
      normalizedData,
      dataPoints,
      axisTicks,
      registerLayer,
      setAxisTicks,
      getColorForKey,
      registerCursorOptions,
      requestRender,
      registerYAxis,
      getYAxisIndex,
      yAxisCounts,
      yAxisSpacing: Y_AXIS_BAND_WIDTH,
      barOrientation,
      registerHorizontalBars
    }),
    [
      axisTicks,
      canvasSize,
      chartArea,
      data,
      dataPoints,
      defaultScaleId,
      getColorForKey,
      getScaleDomain,
      getScaleIdForKey,
      getXPosition,
      getYPosition,
      getYPositionForKey,
      getYPositionForScale,
      getYAxisIndex,
      labelPositions,
      labels,
      normalizedData,
      registerCursorOptions,
      registerLayer,
      registerYAxis,
      requestRender,
      resolvedYKeys,
      setAxisTicks,
      valueDomain,
      valueDomainsByScale,
      xKey,
      yAxisCounts,
      barOrientation,
      registerHorizontalBars
    ]
  )

  return (
    <ChartSurfaceContext.Provider value={contextValue}>
      <ChartOverlayContainerContext.Provider value={overlayContainer}>
        <div className={`chart-surface-container ${className || ''}`} style={style}>
          <CanvasWrapper
            width={width}
            height={height}
            className="chart-base-layer"
            onDraw={drawBase}
            debugLabel="chart-base"
            canvasStyle={{ pointerEvents: 'none' }}
          />
          <CanvasWrapper
            width={width}
            height={height}
            className="chart-overlay-layer"
            onDraw={drawOverlay}
            debugLabel="chart-overlay"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            redrawOnPointerEvents={false}
            onRegisterRedraw={handleOverlayRedrawRegister}
          />
          <div ref={overlayContainerRef} className="chart-portal-container" />
          {children}
        </div>
      </ChartOverlayContainerContext.Provider>
    </ChartSurfaceContext.Provider>
  )
}
