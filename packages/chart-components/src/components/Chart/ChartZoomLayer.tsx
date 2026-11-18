import React, { useEffect, useRef } from 'react'
import { useChartSurface } from '../../utils/context/ChartSurfaceContext'
import type { ChartViewRange } from '../../utils/data/chartData.types'
import { computeZoomedViewRange, isSameViewRange } from '../../utils/chartZoom'

export type ChartZoomWheelMode = 'modifier' | 'always' | false

export interface ChartZoomLayerProps {
  /**
   * Receives the next inclusive view range. Store it and pass it back as the surface's `viewRange`;
   * the layer reads the range from the surface, so it never zooms on its own.
   */
  onViewRangeChange: (range: ChartViewRange) => void
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
   * Pan while zoomed in: horizontal scroll, Shift + wheel, or a two-finger drag on touch screens.
   * Default `true`.
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

interface PinchState {
  distance: number
  midX: number
}

/**
 * Adds wheel and pinch zoom, plus panning, to a chart. Opt-in: render it inside `ChartSurface`
 * to enable these gestures, and leave it out for charts that should not capture them.
 */
export const ChartZoomLayer: React.FC<ChartZoomLayerProps> = ({
  onViewRangeChange,
  wheel = 'modifier',
  pinch = true,
  pan = true,
  minSpan = 4
}) => {
  const surface = useChartSurface()
  const anchorRef = useRef<HTMLSpanElement | null>(null)

  // Event listeners are attached once, so they read the latest values through these refs.
  const surfaceRef = useRef(surface)
  const optionsRef = useRef({ onViewRangeChange, wheel, pinch, pan, minSpan })
  useEffect(() => {
    surfaceRef.current = surface
    optionsRef.current = { onViewRangeChange, wheel, pinch, pan, minSpan }
  })

  useEffect(() => {
    const container = anchorRef.current?.parentElement
    if (!container) {
      return
    }

    let pinchState: PinchState | null = null

    /** Pointer position relative to the chart's overlay canvas, the same space as chartArea. */
    const toChartX = (clientX: number): number => {
      const canvas = container.querySelector<HTMLElement>('.chart-overlay-layer') ?? container
      return clientX - canvas.getBoundingClientRect().left
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

    /** Applies a zoom/pan step and reports it when the view actually changed. */
    const applyStep = (anchorX: number, spanScale: number, shiftPixels: number): boolean => {
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

      // Zoom: Ctrl/⌘ + wheel, or any wheel in 'always' mode, when the wheel is mostly vertical.
      const wantsZoom = wheelMode === 'modifier' ? zoomModifier : wheelMode === 'always' && !isHorizontal
      if (wantsZoom) {
        const clampedDelta = Math.max(-MAX_WHEEL_DELTA, Math.min(MAX_WHEEL_DELTA, deltaY))
        const spanScale = Math.exp(clampedDelta * WHEEL_ZOOM_SENSITIVITY)
        const changed = applyStep(toChartX(event.clientX), spanScale, 0)
        // Ctrl/⌘ + wheel is always ours, which also stops the browser from zooming the page.
        if (zoomModifier || changed) {
          event.preventDefault()
        }
        return
      }

      if (panEnabled && isHorizontal && !zoomModifier) {
        const panPixels = event.shiftKey && deltaX === 0 ? deltaY : deltaX
        if (applyStep(toChartX(event.clientX), 1, panPixels)) {
          event.preventDefault()
        }
      }
    }

    const readTouches = (event: TouchEvent): PinchState | null => {
      if (event.touches.length < 2) {
        return null
      }
      const first = event.touches[0]
      const second = event.touches[1]
      const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY)
      const midX = toChartX((first.clientX + second.clientX) / 2)
      return { distance, midX }
    }

    const handleTouchStart = (event: TouchEvent) => {
      pinchState = readTouches(event)
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
        pinchState = current
        return
      }

      const spanScale = pinchEnabled && current.distance > 0 ? pinchState.distance / current.distance : 1
      const shiftPixels = panEnabled ? pinchState.midX - current.midX : 0
      applyStep(current.midX, spanScale, shiftPixels)
      pinchState = current
    }

    const handleTouchEnd = (event: TouchEvent) => {
      pinchState = readTouches(event)
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [])

  // Renders nothing visible. The hidden anchor lets the layer find its chart container.
  return <span ref={anchorRef} hidden />
}
