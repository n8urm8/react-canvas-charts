import type {
  ChartAnnotation,
  TextAnnotation,
  AnnotationType,
  LineAnnotation,
  CircleAnnotation,
  FreehandAnnotation
} from '../../annotations.types'
import { checkLineHit, checkCircleHit, checkFreehandHit } from './hitDetection'

export interface HoverState {
  hoveredAnnotationId: string | null
  setHoveredAnnotationId: (id: string | null) => void
  hoveredGeometricAnnotationId: string | null
  setHoveredGeometricAnnotationId: (id: string | null) => void
}

export function setupHoverHandlers(
  chartContainerRef: React.RefObject<HTMLDivElement | null>,
  annotations: ChartAnnotation[],
  creatingType: AnnotationType | undefined,
  hoverState: HoverState,
  isDraggingAnnotation: boolean
) {
  return (e: MouseEvent) => {
    if (!chartContainerRef.current) return

    // Don't update hover state while dragging an annotation
    if (isDraggingAnnotation) return

    if (creatingType) {
      chartContainerRef.current.style.cursor = creatingType === 'text' ? 'text' : 'crosshair'
      hoverState.setHoveredAnnotationId(null)
      hoverState.setHoveredGeometricAnnotationId(null)
      return
    }

    const rect = chartContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    let foundHover = false

    // Check all annotations for hover
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
          hoverState.setHoveredAnnotationId(annotation.id)
          hoverState.setHoveredGeometricAnnotationId(null)
          chartContainerRef.current.style.cursor = 'text'
          foundHover = true
          break
        }
      } else if (annotation.type === 'line') {
        const hitResult = checkLineHit(x, y, annotation as LineAnnotation)
        if (hitResult) {
          hoverState.setHoveredAnnotationId(null)
          hoverState.setHoveredGeometricAnnotationId(annotation.id)
          chartContainerRef.current.style.cursor = 'move'
          foundHover = true
          break
        }
      } else if (annotation.type === 'circle') {
        const hitResult = checkCircleHit(x, y, annotation as CircleAnnotation)
        if (hitResult) {
          hoverState.setHoveredAnnotationId(null)
          hoverState.setHoveredGeometricAnnotationId(annotation.id)
          chartContainerRef.current.style.cursor = 'move'
          foundHover = true
          break
        }
      } else if (annotation.type === 'freehand') {
        const hitResult = checkFreehandHit(x, y, annotation as FreehandAnnotation)
        if (hitResult) {
          hoverState.setHoveredAnnotationId(null)
          hoverState.setHoveredGeometricAnnotationId(annotation.id)
          chartContainerRef.current.style.cursor = 'move'
          foundHover = true
          break
        }
      }
    }
    if (!foundHover) {
      hoverState.setHoveredAnnotationId(null)
      hoverState.setHoveredGeometricAnnotationId(null)
      chartContainerRef.current.style.cursor = 'default'
    }
  }
}
