import React, { useCallback, useMemo, useRef, useState } from 'react'
import type { ChartPointSelector } from './chartPointSelectors'
import { LayerOrder } from './ChartSurface/ChartSurface.constants'
import type { ChartLayerRenderer, ChartSurfaceRenderHelpers } from './ChartSurface/ChartSurface.types'
import { useChartSurface } from '../../utils/context/ChartSurfaceContext'
import { ChartOverlayPortal } from '../../utils/context/ChartOverlayContext'
import { useChartLayer } from '../../utils/hooks/useChartLayer'
import { sanitizeSvgMarkup } from '../../utils/svgSanitization'

export interface ChartPointSelectorsLayerProps {
  /**
   * Controlled list of selectors. When set, updates should be applied via `onSelectorsChange`
   * (for example while dragging).
   */
  selectors?: ChartPointSelector[]
  onSelectorsChange?: (next: ChartPointSelector[]) => void
  /** Used only when `selectors` is omitted (uncontrolled). */
  defaultSelectors?: ChartPointSelector[]
  /** Outer radius of the on-canvas reticle in CSS pixels. */
  radius?: number
  ringColor?: string
  crosshairColor?: string
  ringWidth?: number
  crosshairWidth?: number
  /** Radius of the invisible drag target in the portal overlay (CSS pixels). */
  hitSlop?: number
  /** Optional formatter for the floating label (defaults to `xLabel` and numeric y). */
  formatLabel?: (args: { xLabel: string; yValue: number; dataKey: string }) => string
  className?: string
  labelClassName?: string
}

const defaultFormatLabel = (args: { xLabel: string; yValue: number; dataKey: string }): string => {
  return `${args.xLabel} · ${args.yValue}`
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0
  }
  return Math.max(0, Math.min(index, length - 1))
}

function closestIndexByChartX(chartX: number, labelPositions: number[]): number | null {
  if (labelPositions.length === 0) {
    return null
  }

  let closestIndex = 0
  let closestDistance = Math.abs(chartX - labelPositions[0])

  for (let index = 1; index < labelPositions.length; index += 1) {
    const distance = Math.abs(chartX - labelPositions[index])
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  }

  return closestIndex
}

function chartXFromClient(clientX: number, container: HTMLElement, canvasWidth: number): number {
  const rect = container.getBoundingClientRect()
  if (rect.width <= 0) {
    return 0
  }

  return ((clientX - rect.left) / rect.width) * canvasWidth
}

function resolveSelectorGeometry(
  helpers: ChartSurfaceRenderHelpers,
  selector: ChartPointSelector
): { x: number; y: number; xLabel: string; yValue: number } | null {
  const dataIndex = clampIndex(selector.dataIndex, helpers.normalizedData.length)
  const datum = helpers.normalizedData[dataIndex]
  if (!datum) {
    return null
  }

  const value = datum.values[selector.dataKey]
  if (value === null || !Number.isFinite(value)) {
    return null
  }

  return {
    x: datum.x,
    y: helpers.getYPositionForKey(selector.dataKey, value),
    xLabel: datum.label,
    yValue: value
  }
}

function getSelectorSvgMarkup(selector: ChartPointSelector): string | null {
  if (typeof selector.selectorSvg !== 'string') {
    return null
  }

  const trimmed = selector.selectorSvg.trim()
  if (trimmed.length === 0) {
    return null
  }

  // Sanitize SVG to prevent XSS attacks
  return sanitizeSvgMarkup(trimmed)
}

function renderSelectorMark(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  options: {
    radius: number
    ringColor: string
    crosshairColor: string
    ringWidth: number
    crosshairWidth: number
  }
): void {
  const { radius, ringColor, crosshairColor, ringWidth, crosshairWidth } = options
  const arm = Math.max(2, radius * 0.42)

  context.save()

  context.lineWidth = ringWidth
  context.strokeStyle = ringColor
  context.beginPath()
  context.arc(cx, cy, radius, 0, Math.PI * 2)
  context.stroke()

  context.lineWidth = crosshairWidth
  context.strokeStyle = crosshairColor
  context.setLineDash([])
  context.beginPath()
  context.moveTo(cx - arm, cy)
  context.lineTo(cx + arm, cy)
  context.moveTo(cx, cy - arm)
  context.lineTo(cx, cy + arm)
  context.stroke()

  context.restore()
}

export const ChartPointSelectorsLayer: React.FC<ChartPointSelectorsLayerProps> = ({
  selectors: selectorsProp,
  onSelectorsChange,
  defaultSelectors,
  radius = 14,
  ringColor = '#6b7280',
  crosshairColor = '#6b7280',
  ringWidth = 2,
  crosshairWidth = 2,
  hitSlop = 22,
  formatLabel = defaultFormatLabel,
  className,
  labelClassName
}) => {
  const { normalizedData, labelPositions, canvasSize, barOrientation, getYPositionForKey } = useChartSurface()

  const isControlled = selectorsProp !== undefined
  const [uncontrolledSelectors, setUncontrolledSelectors] = useState<ChartPointSelector[]>(
    () => defaultSelectors ?? []
  )

  const selectors = isControlled ? selectorsProp : uncontrolledSelectors

  const setSelectors = useCallback(
    (next: ChartPointSelector[]) => {
      if (isControlled) {
        onSelectorsChange?.(next)
        return
      }

      setUncontrolledSelectors(next)
      onSelectorsChange?.(next)
    },
    [isControlled, onSelectorsChange]
  )

  const dragStateRef = useRef<{ id: string; pointerId: number } | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  const draw = useCallback<ChartLayerRenderer>(
    (context, helpers) => {
      if (barOrientation === 'horizontal' || selectors.length === 0) {
        return
      }

      selectors.forEach((selector) => {
        if (getSelectorSvgMarkup(selector)) {
          return
        }

        const geometry = resolveSelectorGeometry(helpers, selector)
        if (!geometry) {
          return
        }

        renderSelectorMark(context, geometry.x, geometry.y, {
          radius,
          ringColor,
          crosshairColor,
          ringWidth,
          crosshairWidth
        })
      })
    },
    [barOrientation, crosshairColor, crosshairWidth, ringColor, ringWidth, radius, selectors]
  )

  const layerOptions = useMemo(() => ({ order: LayerOrder.pointSelectors }), [])
  useChartLayer(draw, layerOptions)

  const removeSelector = useCallback(
    (id: string) => {
      setSelectors(selectors.filter((entry) => entry.id !== id))
    },
    [selectors, setSelectors]
  )

  const updateSelectorIndex = useCallback(
    (id: string, dataIndex: number) => {
      setSelectors(selectors.map((entry) => (entry.id === id ? { ...entry, dataIndex } : entry)))
    },
    [selectors, setSelectors]
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent, id: string) => {
      if (barOrientation === 'horizontal') {
        return
      }

      event.stopPropagation()
      event.preventDefault()
      dragStateRef.current = { id, pointerId: event.pointerId }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [barOrientation]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      const drag = dragStateRef.current
      const currentId =
        event.currentTarget instanceof HTMLElement ? event.currentTarget.dataset.selectorId : undefined
      if (!drag || drag.pointerId !== event.pointerId || !currentId || drag.id !== currentId) {
        return
      }

      const container = overlayRef.current
      if (!container) {
        return
      }

      const chartX = chartXFromClient(event.clientX, container, canvasSize.width)
      const nextIndex = closestIndexByChartX(chartX, labelPositions)
      if (nextIndex === null) {
        return
      }

      const selector = selectors.find((entry) => entry.id === drag.id)
      if (!selector) {
        return
      }

      const clampedCurrent = clampIndex(selector.dataIndex, normalizedData.length)
      if (clampedCurrent === nextIndex) {
        return
      }

      updateSelectorIndex(drag.id, nextIndex)
    },
    [canvasSize.width, labelPositions, normalizedData.length, selectors, updateSelectorIndex]
  )

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    const drag = dragStateRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    dragStateRef.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  const showLayer = barOrientation === 'vertical' && selectors.length > 0

  return showLayer ? (
    <ChartOverlayPortal>
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none'
        }}
      >
        {selectors.map((selector) => {
          const dataIndex = clampIndex(selector.dataIndex, normalizedData.length)
          const datum = normalizedData[dataIndex]
          if (!datum) {
            return null
          }

          const value = datum.values[selector.dataKey]
          if (value === null || !Number.isFinite(value)) {
            return null
          }

          const x = datum.x
          const y = getYPositionForKey(selector.dataKey, value)
          const label = formatLabel({
            xLabel: datum.label,
            yValue: value,
            dataKey: selector.dataKey
          })
          const selectorSvg = getSelectorSvgMarkup(selector)

          const hitSize = hitSlop * 2

          // Merge layer-level and per-selector label styles
          // IMPORTANT: Keep default colors in sync with PointSelectorsControl component defaults
          const mergedLabelStyle: React.CSSProperties = {
            position: 'absolute',
            left: '50%',
            bottom: '100%',
            marginBottom: '8px',
            transform: 'translateX(-50%)',
            padding: '4px 8px',
            borderRadius: '6px',
            background: 'rgba(17, 24, 39, 0.92)',
            color: '#f9fafb',
            fontSize: '12px',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            pointerEvents: 'auto',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            ...selector.labelStyle
          }

          // Merge layer-level and per-selector label class names
          const mergedLabelClassName = [labelClassName, selector.labelClassName].filter(Boolean).join(' ')

          return (
            <div
              key={selector.id}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: `${hitSize}px`,
                height: `${hitSize}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {selectorSvg ? (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  dangerouslySetInnerHTML={{ __html: selectorSvg }}
                />
              ) : null}
              <div
                className={mergedLabelClassName || undefined}
                style={mergedLabelStyle}
              >
                <span>{label}</span>
                <button
                  type="button"
                  aria-label="Remove point selector"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation()
                    removeSelector(selector.id)
                  }}
                  style={{
                    border: 'none',
                    margin: 0,
                    padding: '0 4px',
                    background: 'transparent',
                    color: '#e5e7eb',
                    cursor: 'pointer',
                    fontSize: '14px',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
              <div
                data-selector-id={selector.id}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={Math.max(0, normalizedData.length - 1)}
                aria-valuenow={dataIndex}
                aria-label={`Point selector for ${selector.dataKey}`}
                onPointerDown={(event) => handlePointerDown(event, selector.id)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={className}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '999px',
                  pointerEvents: 'auto',
                  touchAction: 'none',
                  cursor: 'grab'
                }}
              />
            </div>
          )
        })}
      </div>
    </ChartOverlayPortal>
  ) : null
}
