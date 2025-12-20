import type { ChartAnnotation, AnnotationType, TextAnnotation } from '../../annotations.types'

export interface SelectionState {
  selectedAnnotationId: string | null
  setSelectedAnnotationId: (id: string | null) => void
}

export interface ClickCallbacks {
  onAnnotationCreate?: (annotation: Partial<ChartAnnotation>) => void
  onAnnotationComplete?: (annotation: ChartAnnotation) => void
  onAnnotationsChange?: (annotations: ChartAnnotation[]) => void
}

export function createClickHandler(
  chartContainerRef: React.RefObject<HTMLDivElement | null>,
  annotations: ChartAnnotation[],
  creatingType: AnnotationType | undefined,
  enableCreation: boolean,
  selectionState: SelectionState,
  callbacks: ClickCallbacks,
  buildNewAnnotation: (type: AnnotationType, x: number, y: number) => ChartAnnotation
) {
  return (e: MouseEvent) => {
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

    // Creation mode: create annotation for text and freehand (single click types)
    if (creatingType && enableCreation && (creatingType === 'text' || creatingType === 'freehand')) {
      const rect = chartContainerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const newAnnotation = buildNewAnnotation(creatingType, x, y)
      callbacks.onAnnotationCreate?.(newAnnotation)
      callbacks.onAnnotationComplete?.(newAnnotation)
      if (callbacks.onAnnotationsChange) {
        callbacks.onAnnotationsChange([...annotations, newAnnotation])
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
          selectionState.setSelectedAnnotationId(annotation.id)
          e.stopPropagation()
          return
        }
      }
    }

    // Clicked on empty space
    selectionState.setSelectedAnnotationId(null)
  }
}
