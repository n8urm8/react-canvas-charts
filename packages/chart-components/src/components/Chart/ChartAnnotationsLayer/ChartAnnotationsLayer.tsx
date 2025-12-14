import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { LayerOrder, useChartLayer, type ChartLayerRenderer } from '../ChartSurface'
import type { ChartAnnotation, AnnotationCoordinate, AnnotationType, TextAnnotation } from '../annotations.types'
import { toPixelSpace } from './utils'
import { renderTextAnnotation } from './renderTextAnnotation'
import { renderLineAnnotation } from './renderLineAnnotation'
import { renderCircleAnnotation } from './renderCircleAnnotation'
import { renderFreehandAnnotation } from './renderFreehandAnnotation'
import { AnnotationEditor } from './AnnotationEditor'

const DEFAULT_ANNOTATION_COLOR = '#ff6b6b'
const DEFAULT_STROKE_WIDTH = 2
const DEFAULT_TEXT = 'New Text'
const DEFAULT_FONT_SIZE = 14
const DEFAULT_LINE_LENGTH = 100
const DEFAULT_CIRCLE_RADIUS = 30

export interface ChartAnnotationsLayerProps {
  /** Array of annotations to render */
  annotations: ChartAnnotation[]
  /** Callback when annotations are updated */
  onAnnotationsChange?: (annotations: ChartAnnotation[]) => void
  /** Current annotation being created (controlled by parent) */
  creatingType?: AnnotationType
  /** Callback when annotation creation is in progress */
  onAnnotationCreate?: (annotation: Partial<ChartAnnotation>) => void
  /** Callback when annotation creation is complete */
  onAnnotationComplete?: (annotation: ChartAnnotation) => void
  /** Whether annotation creation is enabled */
  enableCreation?: boolean
}

export const ChartAnnotationsLayer: React.FC<ChartAnnotationsLayerProps> = ({
  annotations,
  onAnnotationsChange,
  creatingType,
  onAnnotationCreate,
  onAnnotationComplete,
  enableCreation = true
}) => {
  const layerOptions = useMemo(() => ({ order: LayerOrder.overlays + 5 }), [])
  const [isDrawing] = useState(false)
  const drawingPointsRef = useRef<AnnotationCoordinate[]>([])
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null)
  const chartContainerRef = useRef<HTMLDivElement | null>(null)

  // Get chart container element
  useEffect(() => {
    const findChartContainer = () => {
      // Find the chart surface container
      const chartElement = document.querySelector('.chart-surface-container')
      if (chartElement) {
        chartContainerRef.current = chartElement as HTMLDivElement
      }
    }
    findChartContainer()
  }, [])

  const draw = useCallback<ChartLayerRenderer>(
    (context, helpers) => {
      // Render all annotations
      annotations.forEach((annotation) => {
        switch (annotation.type) {
          case 'text':
            renderTextAnnotation(
              context,
              annotation,
              helpers.getXPosition,
              helpers.getYPosition,
              annotation.id === hoveredAnnotationId
            )
            break
          case 'line':
            renderLineAnnotation(context, annotation, helpers.getXPosition, helpers.getYPosition)
            break
          case 'circle':
            renderCircleAnnotation(context, annotation, helpers.getXPosition, helpers.getYPosition)
            break
          case 'freehand':
            renderFreehandAnnotation(context, annotation, helpers.getXPosition, helpers.getYPosition)
            break
        }
      })

      // Render temporary annotation during creation
      if (isDrawing && drawingPointsRef.current.length > 0 && creatingType) {
        const points = drawingPointsRef.current
        context.save()
        context.strokeStyle = '#3b82f6'
        context.lineWidth = 2
        context.setLineDash([5, 5])

        if (creatingType === 'line' && points.length >= 1) {
          const start = toPixelSpace(points[0], helpers.getXPosition, helpers.getYPosition)
          const end = points.length > 1 ? toPixelSpace(points[1], helpers.getXPosition, helpers.getYPosition) : start
          context.beginPath()
          context.moveTo(start.x, start.y)
          context.lineTo(end.x, end.y)
          context.stroke()
        } else if (creatingType === 'circle' && points.length >= 1) {
          const center = toPixelSpace(points[0], helpers.getXPosition, helpers.getYPosition)
          const end = points.length > 1 ? toPixelSpace(points[1], helpers.getXPosition, helpers.getYPosition) : center
          const radius = Math.sqrt(Math.pow(end.x - center.x, 2) + Math.pow(end.y - center.y, 2))
          context.beginPath()
          context.arc(center.x, center.y, radius, 0, 2 * Math.PI)
          context.stroke()
        } else if (creatingType === 'freehand' && points.length > 1) {
          const pixelPoints = points.map((p) => toPixelSpace(p, helpers.getXPosition, helpers.getYPosition))
          context.beginPath()
          context.moveTo(pixelPoints[0].x, pixelPoints[0].y)
          for (let i = 1; i < pixelPoints.length; i++) {
            context.lineTo(pixelPoints[i].x, pixelPoints[i].y)
          }
          context.stroke()
        }

        context.restore()
      }
    },
    [annotations, creatingType, isDrawing, hoveredAnnotationId]
  )

  useChartLayer(draw, layerOptions)

  const selectedAnnotation = selectedAnnotationId
    ? (annotations.find((a) => a.id === selectedAnnotationId && a.type === 'text') as TextAnnotation | undefined)
    : undefined

  const buildNewAnnotation = useCallback((type: AnnotationType, x: number, y: number): ChartAnnotation => {
    const baseId = `annotation-${Date.now()}`
    const baseProps = {
      id: baseId,
      color: DEFAULT_ANNOTATION_COLOR,
      strokeWidth: DEFAULT_STROKE_WIDTH
    }

    switch (type) {
      case 'text':
        return {
          ...baseProps,
          type: 'text',
          position: { x, y },
          text: DEFAULT_TEXT,
          fontSize: DEFAULT_FONT_SIZE
        }
      case 'line':
        return {
          ...baseProps,
          type: 'line',
          start: { x, y },
          end: { x: x + DEFAULT_LINE_LENGTH, y }
        }
      case 'circle':
        return {
          ...baseProps,
          type: 'circle',
          center: { x, y },
          radius: DEFAULT_CIRCLE_RADIUS
        }
      case 'freehand':
        return {
          ...baseProps,
          type: 'freehand',
          points: [{ x, y }]
        }
    }
  }, [])

  const handleUpdateAnnotation = useCallback(
    (updates: Partial<TextAnnotation>) => {
      if (!selectedAnnotationId || !onAnnotationsChange) return

      const updatedAnnotations = annotations.map((a) =>
        a.id === selectedAnnotationId && a.type === 'text' ? ({ ...a, ...updates } as TextAnnotation) : a
      )
      onAnnotationsChange(updatedAnnotations)
    },
    [selectedAnnotationId, annotations, onAnnotationsChange]
  )

  const handleCloseEditor = useCallback(() => {
    setSelectedAnnotationId(null)
  }, [])

  // Handle hover over annotations for cursor and hover effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!chartContainerRef.current) return

      if (creatingType) {
        chartContainerRef.current.style.cursor = creatingType === 'text' ? 'text' : 'crosshair'
        setHoveredAnnotationId(null)
        return
      }

      const rect = chartContainerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      let foundHover = false

      // Check if hovering over a text annotation
      for (const annotation of annotations) {
        if (annotation.type === 'text') {
          const textAnnotation = annotation as TextAnnotation
          const pos = textAnnotation.position
          const fontSize = textAnnotation.fontSize ?? 14
          const padding = textAnnotation.padding ?? 8

          // Use stored dimensions if available, otherwise calculate from text
          const storedWidth = textAnnotation.metadata?.width
          const storedHeight = textAnnotation.metadata?.height

          let bgWidth: number
          let bgHeight: number

          if (typeof storedWidth === 'number' && typeof storedHeight === 'number') {
            // Use stored dimensions
            bgWidth = storedWidth
            bgHeight = storedHeight
          } else {
            // Calculate from text
            const tempCanvas = document.createElement('canvas')
            const tempCtx = tempCanvas.getContext('2d')
            if (!tempCtx) continue

            const fontWeight = textAnnotation.fontWeight ?? 'normal'
            tempCtx.font = `${fontWeight} ${fontSize}px sans-serif`
            const metrics = tempCtx.measureText(textAnnotation.text)
            bgWidth = metrics.width + padding * 2
            bgHeight = fontSize + padding * 2
          }

          const bgX = pos.x - padding
          const bgY = pos.y - padding

          if (x >= bgX && x <= bgX + bgWidth && y >= bgY && y <= bgY + bgHeight) {
            setHoveredAnnotationId(annotation.id)
            chartContainerRef.current.style.cursor = 'text'
            foundHover = true
            break
          }
        }
      }
      if (!foundHover) {
        setHoveredAnnotationId(null)
        chartContainerRef.current.style.cursor = 'default'
      }
    }

    const container = chartContainerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      return () => {
        container.removeEventListener('mousemove', handleMouseMove)
        container.style.cursor = 'default'
      }
    }
  }, [annotations, creatingType])

  // Handle clicks on annotations to select them
  useEffect(() => {
    const handleChartClick = (e: MouseEvent) => {
      if (!chartContainerRef.current) return

      // Don't process clicks that came from the editor
      const target = e.target as HTMLElement
      if (target.closest('[data-annotation-editor]')) {
        return
      }

      // Ignore toolbar clicks so we only create on a chart click
      if ((e.target as HTMLElement).closest('.chart-toolbar')) {
        return
      }

      // Creation mode: create annotation and exit
      if (creatingType && enableCreation) {
        const rect = chartContainerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const newAnnotation = buildNewAnnotation(creatingType, x, y)
        onAnnotationCreate?.(newAnnotation)
        onAnnotationComplete?.(newAnnotation)
        if (onAnnotationsChange) {
          onAnnotationsChange([...annotations, newAnnotation])
        }
        return
      }

      const rect = chartContainerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Check if clicking on a text annotation
      for (const annotation of annotations) {
        if (annotation.type === 'text') {
          const textAnnotation = annotation as TextAnnotation
          const pos = textAnnotation.position
          const fontSize = textAnnotation.fontSize ?? 14
          const padding = textAnnotation.padding ?? 8

          // Use stored dimensions if available, otherwise calculate from text
          const storedWidth = textAnnotation.metadata?.width
          const storedHeight = textAnnotation.metadata?.height

          let bgWidth: number
          let bgHeight: number

          if (typeof storedWidth === 'number' && typeof storedHeight === 'number') {
            // Use stored dimensions
            bgWidth = storedWidth
            bgHeight = storedHeight
          } else {
            // Calculate from text
            const tempCanvas = document.createElement('canvas')
            const tempCtx = tempCanvas.getContext('2d')
            if (!tempCtx) continue

            const fontWeight = textAnnotation.fontWeight ?? 'normal'
            tempCtx.font = `${fontWeight} ${fontSize}px sans-serif`
            const metrics = tempCtx.measureText(textAnnotation.text)
            bgWidth = metrics.width + padding * 2
            bgHeight = fontSize + padding * 2
          }

          const bgX = pos.x - padding
          const bgY = pos.y - padding

          if (x >= bgX && x <= bgX + bgWidth && y >= bgY && y <= bgY + bgHeight) {
            setSelectedAnnotationId(annotation.id)
            e.stopPropagation()
            return
          }
        }
      }

      // Clicked on empty space
      setSelectedAnnotationId(null)
    }

    const container = chartContainerRef.current
    if (container) {
      container.addEventListener('click', handleChartClick)
      return () => container.removeEventListener('click', handleChartClick)
    }
  }, [
    annotations,
    buildNewAnnotation,
    creatingType,
    enableCreation,
    onAnnotationComplete,
    onAnnotationCreate,
    onAnnotationsChange
  ])

  return selectedAnnotation && chartContainerRef.current
    ? createPortal(
        <AnnotationEditor
          annotation={selectedAnnotation}
          onUpdate={handleUpdateAnnotation}
          onClose={handleCloseEditor}
          chartContainerRef={chartContainerRef.current}
        />,
        chartContainerRef.current
      )
    : null
}
