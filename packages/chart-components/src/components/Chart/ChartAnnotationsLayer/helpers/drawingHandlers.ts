import type { ChartAnnotation, AnnotationCoordinate, AnnotationType } from '../../annotations.types'
import { DEFAULT_ANNOTATION_COLOR, DEFAULT_STROKE_WIDTH } from './annotationHelpers'

export interface DrawingState {
  isDrawing: boolean
  setIsDrawing: (isDrawing: boolean) => void
  drawingPointsRef: React.RefObject<AnnotationCoordinate[]>
  setDrawingEndPoint: (point: AnnotationCoordinate | null) => void
  isDraggingRef: React.RefObject<boolean>
}

export interface DrawingCallbacks {
  onAnnotationCreate?: (annotation: Partial<ChartAnnotation>) => void
  onAnnotationComplete?: (annotation: ChartAnnotation) => void
  onAnnotationsChange?: (annotations: ChartAnnotation[]) => void
}

export function createMouseDownHandler(
  chartContainerRef: React.RefObject<HTMLDivElement | null>,
  creatingType: AnnotationType | undefined,
  enableCreation: boolean,
  drawingState: DrawingState
) {
  return (e: MouseEvent) => {
    if (!chartContainerRef.current || !creatingType || !enableCreation) return

    // Ignore toolbar clicks
    if ((e.target as HTMLElement).closest('.chart-toolbar')) {
      return
    }

    // Don't process clicks that came from the editor
    const target = e.target as HTMLElement
    if (target.closest('[data-annotation-editor]')) {
      return
    }

    // For line, circle, and freehand annotations, start drag mode
    if (creatingType === 'line' || creatingType === 'circle' || creatingType === 'freehand') {
      const rect = chartContainerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      drawingState.isDraggingRef.current = true
      drawingState.setIsDrawing(true)
      drawingState.drawingPointsRef.current = [{ x, y }]
      e.preventDefault()
      e.stopPropagation()
    }
    // For text, handle immediately on click (will be handled in click event)
  }
}

export function createMouseMoveHandler(
  chartContainerRef: React.RefObject<HTMLDivElement | null>,
  drawingState: DrawingState,
  creatingType: AnnotationType | undefined
) {
  return (e: MouseEvent) => {
    if (!chartContainerRef.current || !drawingState.isDrawing || !drawingState.isDraggingRef.current) return

    const rect = chartContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // For freehand, collect all points along the path
    if (creatingType === 'freehand') {
      const currentPoints = drawingState.drawingPointsRef.current || []
      drawingState.drawingPointsRef.current = [...currentPoints, { x, y }]
      // Use setDrawingEndPoint to trigger re-render for preview
      drawingState.setDrawingEndPoint({ x, y })
    } else {
      // For line and circle, just update the end point for preview
      drawingState.setDrawingEndPoint({ x, y })
    }

    e.preventDefault()
    e.stopPropagation()
  }
}

export function createMouseUpHandler(
  chartContainerRef: React.RefObject<HTMLDivElement | null>,
  creatingType: AnnotationType | undefined,
  annotations: ChartAnnotation[],
  drawingState: DrawingState,
  callbacks: DrawingCallbacks,
  buildNewAnnotation: (type: AnnotationType, x: number, y: number) => ChartAnnotation
) {
  return (e: MouseEvent) => {
    if (!chartContainerRef.current || !drawingState.isDrawing || !drawingState.isDraggingRef.current || !creatingType)
      return

    const rect = chartContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Finalize the annotation with start and end points
    const startPoint = drawingState.drawingPointsRef.current![0]
    const endPoint = { x, y }

    let newAnnotation: ChartAnnotation

    if (creatingType === 'line') {
      newAnnotation = {
        id: `annotation-${Date.now()}`,
        type: 'line',
        color: DEFAULT_ANNOTATION_COLOR,
        strokeWidth: DEFAULT_STROKE_WIDTH,
        start: startPoint,
        end: endPoint
      }
    } else if (creatingType === 'circle') {
      const radius = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2))
      newAnnotation = {
        id: `annotation-${Date.now()}`,
        type: 'circle',
        color: DEFAULT_ANNOTATION_COLOR,
        strokeWidth: DEFAULT_STROKE_WIDTH,
        center: startPoint,
        radius
      }
    } else if (creatingType === 'freehand') {
      // Use all collected points from the drawing
      const points = drawingState.drawingPointsRef.current || []
      newAnnotation = {
        id: `annotation-${Date.now()}`,
        type: 'freehand',
        color: DEFAULT_ANNOTATION_COLOR,
        strokeWidth: DEFAULT_STROKE_WIDTH,
        points
      }
    } else {
      // Shouldn't happen, but fallback
      newAnnotation = buildNewAnnotation(creatingType, startPoint.x, startPoint.y)
    }

    callbacks.onAnnotationCreate?.(newAnnotation)
    callbacks.onAnnotationComplete?.(newAnnotation)
    if (callbacks.onAnnotationsChange) {
      callbacks.onAnnotationsChange([...annotations, newAnnotation])
    }

    // Reset drawing state
    drawingState.setIsDrawing(false)
    drawingState.setDrawingEndPoint(null)
    drawingState.isDraggingRef.current = false
    drawingState.drawingPointsRef.current = []

    e.preventDefault()
    e.stopPropagation()
  }
}
