import React, { useEffect, useRef } from 'react'
import { useChartSurface } from '../../utils/context/ChartSurfaceContext'
import type { ChartViewRange } from '../../utils/data/chartData.types'
import {
  computeZoomedValueWindow,
  computeZoomedViewRange,
  isSameViewRange,
  type ValueWindow
} from '../../utils/chartZoom'
import { dataRangeForPaddedWindow } from '../../utils/chartCalculations'

export type ChartZoomWheelMode = 'modifier' | 'always' | false

/** A value-axis domain in data units, the same shape as a value scale's `domain`. */
export interface ChartZoomValueDomain {
  min: number
  max: number
}

export interface ChartZoomLayerProps {
  /**
   * Receives the next inclusive view range for gestures over the plot or the x-axis. Store it and
   * pass it back as the surface's `viewRange`; the layer reads the range from the surface, so it
   * never zooms on its own.
   */
  onViewRangeChange: (range: ChartViewRange) => void
  /**
   * Receives the next domain for a value axis when a gesture happens over that axis's labels, or a
   * double-click resets it. Feed it back into that scale's `domain` in `valueScales`. `null` means
   * the axis is automatic again. Without this callback, gestures over a value axis do nothing.
   */
  onValueDomainChange?: (scaleId: string, domain: ChartZoomValueDomain | null) => void
  /**
   * Mouse wheel zoom.
   * - `'modifier'` (default): Ctrl/⌘ + wheel zooms. Trackpad pinch arrives as Ctrl + wheel in browsers, so it works too.
   * - `'always'`: plain wheel zooms. Only takes over the wheel when the zoom actually changes the view,
   *   so the page still scrolls once the chart is fully zoomed out.
   * - `false`: no wheel zoom.
   */
  wheel?: ChartZoomWheelMode
  /** Two-finger pinch zoom on touch screens. Default `true`. */
  pinch?: boolean
  /**
   * Pan while zoomed in. Ctrl/⌘ + drag and two-finger drags over the plot pan both axes. Horizontal
   * scroll and Shift + wheel pan the x range. Over a value axis's labels, drag and two-finger gestures
   * pan only that axis. Default `true`.
   */
  pan?: boolean
  /** Smallest visible span, in data points. Default `4`. */
  minSpan?: number
}

/** Exponential zoom per wheel delta pixel. Keeps wheel and trackpad zoom speeds comparable. */
const WHEEL_ZOOM_SENSITIVITY = 0.002
/** Caps a single wheel event so a fast flick cannot jump the view across the whole dataset. */
const MAX_WHEEL_DELTA = 200
/** Pixels per line / page for wheel events that report those delta modes. */
const LINE_HEIGHT_PX = 16
const PAGE_HEIGHT_PX = 400

/** What a gesture acts on, decided where it starts: a value axis's scale, or the x range. */
type GestureTarget = { axis: 'x' } | { axis: 'y'; scaleId: string }

interface TouchPair {
  /** Distance between the two fingers. */
  distance: number
  /** Vertical distance between the two fingers. Used for pinches over a value axis. */
  separationY: number
  midClientX: number
  midClientY: number
}

interface PinchState {
  prev: TouchPair
  target: GestureTarget
}

/** True when two value windows match, to within a tiny fraction of the span. */
const sameWindow = (a: ValueWindow, b: ValueWindow, span: number): boolean => {
  const tolerance = span * 1e-9
  return Math.abs(a.min - b.min) <= tolerance && Math.abs(a.max - b.max) <= tolerance
}

/**
 * Adds wheel, pinch and drag zoom, plus panning, to a chart. Opt-in: render it inside `ChartSurface`
 * to enable these gestures, and leave it out for charts that should not capture them.
 *
 * Wheel zoom and pinch over the plot or the x-axis zoom the x range. Over a value axis's labels, zoom and
 * pan act on that axis only. Drag and two-finger pan over the plot move both axes.
 */
export const ChartZoomLayer: React.FC<ChartZoomLayerProps> = ({
  onViewRangeChange,
  onValueDomainChange,
  wheel = 'modifier',
  pinch = true,
  pan = true,
  minSpan = 4
}) => {
  const surface = useChartSurface()
  const anchorRef = useRef<HTMLSpanElement | null>(null)

  // Event listeners are attached once, so they read the latest values through these refs.
  const surfaceRef = useRef(surface)
  const optionsRef = useRef({ onViewRangeChange, onValueDomainChange, wheel, pinch, pan, minSpan })
  useEffect(() => {
    surfaceRef.current = surface
    optionsRef.current = { onViewRangeChange, onValueDomainChange, wheel, pinch, pan, minSpan }
  })

  useEffect(() => {
    const container = anchorRef.current?.parentElement
    if (!container) {
      return
    }

    /** The element whose coordinates match the chart area. */
    const overlayElement = (): HTMLElement => container.querySelector<HTMLElement>('.chart-overlay-layer') ?? container

    /** Pointer position relative to the chart's overlay canvas, the same space as chartArea. */
    const toChartX = (clientX: number): number => clientX - overlayElement().getBoundingClientRect().left
    const toChartY = (clientY: number): number => clientY - overlayElement().getBoundingClientRect().top

    /**
     * The value scale whose axis sits beside the pointer, or null over the plot, the x-axis or
     * anything else. Axis `i` on a side is drawn `i * spacing` further out from the chart edge, so
     * the band for axis `i` runs from there to the next axis. The outermost axis also covers the
     * margin beyond it.
     */
    const yAxisScaleAt = (clientX: number, clientY: number): string | null => {
      const { chartArea, barOrientation, yAxisSpacing, yAxisCounts, getYAxisScaleId } = surfaceRef.current
      if (barOrientation !== 'vertical') {
        return null
      }

      const chartX = toChartX(clientX)
      const chartY = toChartY(clientY)
      if (chartY < chartArea.y || chartY > chartArea.y + chartArea.height) {
        return null
      }

      const rightEdge = chartArea.x + chartArea.width
      if (chartX < chartArea.x) {
        const count = yAxisCounts.left
        if (count === 0) {
          return null
        }
        const index = Math.min(count - 1, Math.floor((chartArea.x - chartX) / yAxisSpacing))
        return getYAxisScaleId('left', index)
      }
      if (chartX > rightEdge) {
        const count = yAxisCounts.right
        if (count === 0) {
          return null
        }
        const index = Math.min(count - 1, Math.floor((chartX - rightEdge) / yAxisSpacing))
        return getYAxisScaleId('right', index)
      }
      return null
    }

    const targetAt = (clientX: number, clientY: number): GestureTarget => {
      const scaleId = yAxisScaleAt(clientX, clientY)
      return scaleId ? { axis: 'y', scaleId } : { axis: 'x' }
    }

    /** Absolute indices per horizontal pixel, used to convert pixel drags into index shifts. */
    const indexPerPixel = (): number => {
      const { chartArea, getIndexAtPosition } = surfaceRef.current
      if (chartArea.width <= 0) {
        return 0
      }
      const left = getIndexAtPosition(chartArea.x)
      const right = getIndexAtPosition(chartArea.x + chartArea.width)
      return (right - left) / chartArea.width
    }

    /** Applies a zoom/pan step to the x range and reports it when the view actually changed. */
    const applyXStep = (anchorX: number, spanScale: number, shiftPixels: number): boolean => {
      const { viewRange, dataLength, getIndexAtPosition } = surfaceRef.current
      const next = computeZoomedViewRange({
        current: viewRange,
        dataLength,
        minSpan: optionsRef.current.minSpan,
        anchor: getIndexAtPosition(anchorX),
        spanScale,
        shift: shiftPixels * indexPerPixel()
      })
      if (isSameViewRange(next, viewRange)) {
        return false
      }
      optionsRef.current.onViewRangeChange(next)
      return true
    }

    /**
     * Zooms and pans one value axis. `dyPixels` is how far the pointer moved down: dragging down
     * reveals higher values, so the window moves up.
     */
    const applyYStep = (anchorY: number, scaleId: string, spanScale: number, dyPixels: number): boolean => {
      const { chartArea, getScaleDomain, getAutoScaleDomain, getFullScaleDomain } = surfaceRef.current
      const onChange = optionsRef.current.onValueDomainChange
      if (!onChange || chartArea.height <= 0) {
        return false
      }

      const drawn = getScaleDomain(scaleId)
      const current: ValueWindow = { min: drawn.paddedMin, max: drawn.paddedMax }
      // Pans and zooms stay inside all of the data. Zooming out to the automatic span returns to automatic.
      const auto = getAutoScaleDomain(scaleId)
      const autoWindow: ValueWindow = { min: auto.paddedMin, max: auto.paddedMax }
      const full = getFullScaleDomain(scaleId)
      const limits: ValueWindow = { min: full.paddedMin, max: full.paddedMax }
      const span = current.max - current.min
      const valuePerPixel = span / chartArea.height
      const anchor = current.min + ((chartArea.y + chartArea.height - anchorY) / chartArea.height) * span

      const next = computeZoomedValueWindow({
        current,
        limits,
        autoSpan: autoWindow.max - autoWindow.min,
        anchor,
        spanScale,
        shift: dyPixels * valuePerPixel
      })

      if (next === null) {
        if (sameWindow(current, autoWindow, span)) {
          return false
        }
        onChange(scaleId, null)
        return true
      }

      if (sameWindow(next, current, span)) {
        return false
      }
      onChange(scaleId, dataRangeForPaddedWindow(next.min, next.max))
      return true
    }

    /** The value scales that have a y-axis drawn beside the chart. */
    const drawnValueScaleIds = (): string[] => {
      const { yAxisCounts, getYAxisScaleId } = surfaceRef.current
      const ids = new Set<string>()
      for (let index = 0; index < yAxisCounts.left; index += 1) {
        const id = getYAxisScaleId('left', index)
        if (id) ids.add(id)
      }
      for (let index = 0; index < yAxisCounts.right; index += 1) {
        const id = getYAxisScaleId('right', index)
        if (id) ids.add(id)
      }
      return [...ids]
    }

    /** Applies a gesture step to whichever target it started on. */
    const applyStep = (
      target: GestureTarget,
      anchorChart: { x: number; y: number },
      spanScale: number,
      pointerDelta: { x: number; y: number }
    ): boolean => {
      if (target.axis === 'y') {
        return applyYStep(anchorChart.y, target.scaleId, spanScale, pointerDelta.y)
      }
      // Dragging right reveals earlier data, so the window moves toward lower indices.
      let changed = applyXStep(anchorChart.x, spanScale, -pointerDelta.x)
      // A plot gesture also pans every value axis, so the plot moves in both directions. An axis only
      // moves once it is zoomed in, since its window is clamped to the full data range.
      drawnValueScaleIds().forEach((scaleId) => {
        if (applyYStep(anchorChart.y, scaleId, 1, pointerDelta.y)) {
          changed = true
        }
      })
      return changed
    }

    let pinchState: PinchState | null = null

    const wheelSpanScale = (deltaY: number): number => {
      const clampedDelta = Math.max(-MAX_WHEEL_DELTA, Math.min(MAX_WHEEL_DELTA, deltaY))
      return Math.exp(clampedDelta * WHEEL_ZOOM_SENSITIVITY)
    }

    const handleWheel = (event: WheelEvent) => {
      const { wheel: wheelMode, pan: panEnabled } = optionsRef.current
      if (wheelMode === false && !panEnabled) {
        return
      }

      const zoomModifier = event.ctrlKey || event.metaKey
      const scale = event.deltaMode === 1 ? LINE_HEIGHT_PX : event.deltaMode === 2 ? PAGE_HEIGHT_PX : 1
      const deltaX = event.deltaX * scale
      const deltaY = event.deltaY * scale
      const isHorizontal = event.shiftKey || Math.abs(deltaX) > Math.abs(deltaY)
      const valueAxisScaleId = yAxisScaleAt(event.clientX, event.clientY)

      // Zoom: Ctrl/⌘ + wheel, or any wheel in 'always' mode, when the wheel is mostly vertical.
      const wantsZoom = wheelMode === 'modifier' ? zoomModifier : wheelMode === 'always' && !isHorizontal
      if (wantsZoom) {
        const spanScale = wheelSpanScale(deltaY)
        const changed = valueAxisScaleId
          ? applyYStep(toChartY(event.clientY), valueAxisScaleId, spanScale, 0)
          : applyXStep(toChartX(event.clientX), spanScale, 0)
        // Ctrl/⌘ + wheel is always ours, which also stops the browser from zooming the page.
        if (zoomModifier || changed) {
          event.preventDefault()
        }
        return
      }

      // Horizontal scrolling pans the x range. Over a value axis it does nothing: the axis only zooms by wheel.
      if (panEnabled && isHorizontal && !zoomModifier && !valueAxisScaleId) {
        const panPixels = event.shiftKey && deltaX === 0 ? deltaY : deltaX
        if (applyXStep(toChartX(event.clientX), 1, panPixels)) {
          event.preventDefault()
        }
      }
    }

    const readTouches = (event: TouchEvent): TouchPair | null => {
      if (event.touches.length < 2) {
        return null
      }
      const first = event.touches[0]
      const second = event.touches[1]
      return {
        distance: Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY),
        separationY: Math.abs(second.clientY - first.clientY),
        midClientX: (first.clientX + second.clientX) / 2,
        midClientY: (first.clientY + second.clientY) / 2
      }
    }

    /** Starts a pinch or two-finger gesture at the pair's midpoint, or ends it when there are not two fingers. */
    const startPinch = (pair: TouchPair | null) => {
      pinchState = pair ? { prev: pair, target: targetAt(pair.midClientX, pair.midClientY) } : null
    }

    const handleTouchStart = (event: TouchEvent) => {
      startPinch(readTouches(event))
    }

    const handleTouchMove = (event: TouchEvent) => {
      const { pinch: pinchEnabled, pan: panEnabled } = optionsRef.current
      if (!pinchEnabled && !panEnabled) {
        return
      }

      const current = readTouches(event)
      if (!current) {
        pinchState = null
        return
      }

      // Two fingers belong to the chart, so the browser must not pinch-zoom or scroll the page.
      event.preventDefault()

      if (!pinchState) {
        startPinch(current)
        return
      }

      const { prev, target } = pinchState
      const metricPrev = target.axis === 'y' ? prev.separationY : prev.distance
      const metricCurrent = target.axis === 'y' ? current.separationY : current.distance
      const spanScale = pinchEnabled && metricCurrent > 0 && metricPrev > 0 ? metricPrev / metricCurrent : 1
      const pointerDelta = panEnabled
        ? { x: current.midClientX - prev.midClientX, y: current.midClientY - prev.midClientY }
        : { x: 0, y: 0 }

      applyStep(
        target,
        { x: toChartX(current.midClientX), y: toChartY(current.midClientY) },
        spanScale,
        pointerDelta
      )
      pinchState = { prev: current, target }
    }

    const handleTouchEnd = (event: TouchEvent) => {
      startPinch(readTouches(event))
    }

    // Ctrl/⌘ + drag pans. The press is taken in the capture phase, before the chart's drag-to-select
    // sees it, so a pan never also creates a selection.
    let suppressNextClick = false
    let cancelDrag: (() => void) | null = null

    const handleMouseDown = (event: MouseEvent) => {
      if (!optionsRef.current.pan || event.button !== 0 || !(event.ctrlKey || event.metaKey)) {
        return
      }

      // Keeps the page from starting a text selection during the drag.
      event.preventDefault()
      event.stopPropagation()
      cancelDrag?.()

      const target = targetAt(event.clientX, event.clientY)
      const cursorElement = overlayElement()
      const previousCursor = cursorElement.style.cursor
      cursorElement.style.cursor = 'grabbing'
      let lastX = event.clientX
      let lastY = event.clientY
      let moved = false

      const handleMove = (moveEvent: MouseEvent) => {
        const delta = { x: moveEvent.clientX - lastX, y: moveEvent.clientY - lastY }
        lastX = moveEvent.clientX
        lastY = moveEvent.clientY
        if (delta.x === 0 && delta.y === 0) {
          return
        }
        moved = true
        applyStep(
          target,
          { x: toChartX(moveEvent.clientX), y: toChartY(moveEvent.clientY) },
          1,
          delta
        )
      }

      const handleUp = () => {
        stop()
        if (moved) {
          // The click that ends a drag belongs to the drag, not to the chart.
          suppressNextClick = true
          window.setTimeout(() => {
            suppressNextClick = false
          }, 0)
        }
      }

      const stop = () => {
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
        cursorElement.style.cursor = previousCursor
        cancelDrag = null
      }

      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
      cancelDrag = stop
    }

    const handleClick = (event: MouseEvent) => {
      if (suppressNextClick) {
        suppressNextClick = false
        event.preventDefault()
        event.stopPropagation()
      }
    }

    const handleContextMenu = (event: MouseEvent) => {
      // On macOS Ctrl + click opens the context menu, which would end the drag before it starts.
      if (optionsRef.current.pan && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
      }
    }

    const handleDoubleClick = (event: MouseEvent) => {
      // Double-clicking a value axis returns it to automatic.
      const scaleId = yAxisScaleAt(event.clientX, event.clientY)
      const onChange = optionsRef.current.onValueDomainChange
      if (!scaleId || !onChange) {
        return
      }
      event.preventDefault()
      onChange(scaleId, null)
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true })
    container.addEventListener('mousedown', handleMouseDown, true)
    container.addEventListener('click', handleClick, true)
    container.addEventListener('contextmenu', handleContextMenu)
    container.addEventListener('dblclick', handleDoubleClick)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchcancel', handleTouchEnd)
      container.removeEventListener('mousedown', handleMouseDown, true)
      container.removeEventListener('click', handleClick, true)
      container.removeEventListener('contextmenu', handleContextMenu)
      container.removeEventListener('dblclick', handleDoubleClick)
      cancelDrag?.()
    }
  }, [])

  // Renders nothing visible. The hidden anchor lets the layer find its chart container.
  return <span ref={anchorRef} hidden />
}
