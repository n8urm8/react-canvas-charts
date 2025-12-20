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
import { buildNewAnnotation } from './helpers/annotationHelpers'
import { setupHoverHandlers } from './helpers/hoverHandlers'
import { createMouseDownHandler, createMouseMoveHandler, createMouseUpHandler } from './helpers/drawingHandlers'
import { createClickHandler } from './helpers/clickHandlers'

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
  const [isDrawing, setIsDrawing] = useState(false)
  const drawingPointsRef = useRef<AnnotationCoordinate[]>([])
  const [drawingEndPoint, setDrawingEndPoint] = useState<AnnotationCoordinate | null>(null)
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null)
  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)

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
        const endPoint = drawingEndPoint || points[0]
        context.save()
        context.strokeStyle = '#3b82f6'
        context.lineWidth = 2
        context.setLineDash([5, 5])

        if (creatingType === 'line' && points.length >= 1) {
          const start = toPixelSpace(points[0], helpers.getXPosition, helpers.getYPosition)
          const end = toPixelSpace(endPoint, helpers.getXPosition, helpers.getYPosition)
          context.beginPath()
          context.moveTo(start.x, start.y)
          context.lineTo(end.x, end.y)
          context.stroke()
        } else if (creatingType === 'circle' && points.length >= 1) {
          const center = toPixelSpace(points[0], helpers.getXPosition, helpers.getYPosition)
          const end = toPixelSpace(endPoint, helpers.getXPosition, helpers.getYPosition)
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
    [annotations, creatingType, isDrawing, hoveredAnnotationId, drawingEndPoint]
  )

  useChartLayer(draw, layerOptions)

  const selectedAnnotation = selectedAnnotationId
    ? (annotations.find((a) => a.id === selectedAnnotationId && a.type === 'text') as TextAnnotation | undefined)
    : undefined

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
    const handleMouseMove = setupHoverHandlers(chartContainerRef, annotations as TextAnnotation[], creatingType, {
      hoveredAnnotationId,
      setHoveredAnnotationId
    })

    const container = chartContainerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      return () => {
        container.removeEventListener('mousemove', handleMouseMove)
        container.style.cursor = 'default'
      }
    }
  }, [annotations, creatingType, hoveredAnnotationId])

  // Handle mousedown to start drawing line/circle annotations
  useEffect(() => {
    const drawingState = {
      isDrawing,
      setIsDrawing,
      drawingPointsRef,
      setDrawingEndPoint,
      isDraggingRef
    }

    const callbacks = {
      onAnnotationCreate,
      onAnnotationComplete,
      onAnnotationsChange
    }

    const handleMouseDown = createMouseDownHandler(chartContainerRef, creatingType, enableCreation, drawingState)
    const handleMouseMove = createMouseMoveHandler(chartContainerRef, drawingState, creatingType)
    const handleMouseUp = createMouseUpHandler(
      chartContainerRef,
      creatingType,
      annotations,
      drawingState,
      callbacks,
      buildNewAnnotation
    )

    const container = chartContainerRef.current
    if (container) {
      // Use capture phase to intercept before ChartSurface handlers
      container.addEventListener('mousedown', handleMouseDown, true)
      document.addEventListener('mousemove', handleMouseMove, true)
      document.addEventListener('mouseup', handleMouseUp, true)
      return () => {
        container.removeEventListener('mousedown', handleMouseDown, true)
        document.removeEventListener('mousemove', handleMouseMove, true)
        document.removeEventListener('mouseup', handleMouseUp, true)
      }
    }
  }, [
    annotations,
    creatingType,
    enableCreation,
    isDrawing,
    onAnnotationComplete,
    onAnnotationCreate,
    onAnnotationsChange
  ])

  // Handle clicks on annotations to select them
  useEffect(() => {
    const selectionState = { selectedAnnotationId, setSelectedAnnotationId }
    const callbacks = { onAnnotationCreate, onAnnotationComplete, onAnnotationsChange }

    const handleChartClick = createClickHandler(
      chartContainerRef,
      annotations,
      creatingType,
      enableCreation,
      selectionState,
      callbacks,
      buildNewAnnotation
    )

    const container = chartContainerRef.current
    if (container) {
      container.addEventListener('click', handleChartClick)
      return () => container.removeEventListener('click', handleChartClick)
    }
  }, [
    annotations,
    creatingType,
    enableCreation,
    onAnnotationComplete,
    onAnnotationCreate,
    onAnnotationsChange,
    selectedAnnotationId
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
