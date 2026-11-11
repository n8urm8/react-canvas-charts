import React, { useCallback, useRef, useState } from 'react'
import { useChartSurface } from '../../utils/context/ChartSurfaceContext'
import { ChartOverlayPortal } from '../../utils/context/ChartOverlayContext'
import { isWithinChart } from '../../utils/chartCalculations'
import type { ChartCustomTag } from './chartCustomTags'

export interface ChartTagPlacement {
  chartX: number
  chartY: number
  dataIndex: number
  yValue: number
  label: string
  scaleId: string
  dataKey?: string
  originalData: Record<string, unknown> | null
}

export interface ChartCustomTagsLayerProps {
  tags?: ChartCustomTag[]
  onTagsChange?: (next: ChartCustomTag[]) => void
  defaultTags?: ChartCustomTag[]
  enableTagCreation?: boolean
  creationDataKey?: string
  creationScaleId?: string
  onTagPlacement?: (placement: ChartTagPlacement) => void
  createTag?: (placement: ChartTagPlacement) => ChartCustomTag | null
  className?: string
  tagClassName?: string
  tagStyle?: React.CSSProperties
}

function chartCoordinatesFromClient(
  clientX: number,
  clientY: number,
  container: HTMLElement,
  canvasSize: { width: number; height: number }
): { x: number; y: number } | null {
  const rect = container.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) {
    return null
  }

  return {
    x: ((clientX - rect.left) / rect.width) * canvasSize.width,
    y: ((clientY - rect.top) / rect.height) * canvasSize.height
  }
}

function getValueForChartY(
  chartY: number,
  chartArea: { y: number; height: number },
  domain: { paddedMin: number; paddedMax: number }
): number {
  if (chartArea.height <= 0) {
    return domain.paddedMin
  }

  const normalized = (chartY - chartArea.y) / chartArea.height
  const clamped = Math.max(0, Math.min(1, normalized))
  return domain.paddedMax - clamped * (domain.paddedMax - domain.paddedMin)
}

export const ChartCustomTagsLayer: React.FC<ChartCustomTagsLayerProps> = ({
  tags: tagsProp,
  onTagsChange,
  defaultTags,
  enableTagCreation = false,
  creationDataKey,
  creationScaleId,
  onTagPlacement,
  createTag,
  className,
  tagClassName,
  tagStyle
}) => {
  const {
    dataStore,
    viewRange,
    getIndexAtPosition,
    getXPosition,
    chartArea,
    canvasSize,
    defaultScaleId,
    getScaleDomain,
    getScaleIdForKey,
    getYPosition,
    getYPositionForKey,
    getYPositionForScale
  } = useChartSurface()

  const isControlled = tagsProp !== undefined
  const [uncontrolledTags, setUncontrolledTags] = useState<ChartCustomTag[]>(() => defaultTags ?? [])
  const tags = isControlled ? tagsProp : uncontrolledTags
  const overlayRef = useRef<HTMLDivElement | null>(null)

  const setTags = useCallback(
    (next: ChartCustomTag[]) => {
      if (!isControlled) {
        setUncontrolledTags(next)
      }
      onTagsChange?.(next)
    },
    [isControlled, onTagsChange]
  )

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!enableTagCreation || !overlayRef.current) {
        return
      }

      const coordinates = chartCoordinatesFromClient(event.clientX, event.clientY, overlayRef.current, canvasSize)
      if (!coordinates) {
        return
      }

      if (!isWithinChart(coordinates.x, coordinates.y, chartArea)) {
        return
      }

      if (viewRange.end < viewRange.start) {
        return
      }

      const clampedIndex = Math.max(
        viewRange.start,
        Math.min(viewRange.end, Math.round(getIndexAtPosition(coordinates.x)))
      )

      const resolvedScaleId = creationDataKey
        ? getScaleIdForKey(creationDataKey)
        : creationScaleId ?? defaultScaleId

      const yDomain = getScaleDomain(resolvedScaleId)
      const yValue = getValueForChartY(coordinates.y, chartArea, yDomain)

      const placement: ChartTagPlacement = {
        chartX: coordinates.x,
        chartY: coordinates.y,
        dataIndex: clampedIndex,
        yValue,
        label: dataStore.label(clampedIndex),
        scaleId: resolvedScaleId,
        dataKey: creationDataKey,
        originalData: dataStore.row(clampedIndex)
      }

      onTagPlacement?.(placement)

      if (!createTag) {
        return
      }

      const nextTag = createTag(placement)
      if (!nextTag) {
        return
      }

      setTags([...tags, nextTag])
    },
    [
      canvasSize,
      chartArea,
      createTag,
      creationDataKey,
      creationScaleId,
      defaultScaleId,
      enableTagCreation,
      getScaleDomain,
      getScaleIdForKey,
      getIndexAtPosition,
      dataStore,
      viewRange,
      onTagPlacement,
      setTags,
      tags
    ]
  )

  return (
    <ChartOverlayPortal>
      <div
        ref={overlayRef}
        className={className}
        onClick={handleOverlayClick}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: enableTagCreation ? 'auto' : 'none'
        }}
      >
        {tags.map((tag) => {
          // Tags are anchored to absolute data indices; hide those outside the visible range.
          if (tag.dataIndex < viewRange.start || tag.dataIndex > viewRange.end) {
            return null
          }

          const x = getXPosition(tag.dataIndex)
          const y = tag.dataKey
            ? getYPositionForKey(tag.dataKey, tag.yValue)
            : tag.scaleId
              ? getYPositionForScale(tag.scaleId, tag.yValue)
              : getYPosition(tag.yValue)

          return (
            <div
              key={tag.id}
              className={[tagClassName, tag.className].filter(Boolean).join(' ') || undefined}
              onClick={(event) => event.stopPropagation()}
              style={{
                position: 'absolute',
                left: `${x + (tag.offsetX ?? 0)}px`,
                top: `${y + (tag.offsetY ?? 0)}px`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'auto',
                ...tagStyle,
                ...tag.style
              }}
            >
              {tag.content}
            </div>
          )
        })}
      </div>
    </ChartOverlayPortal>
  )
}
