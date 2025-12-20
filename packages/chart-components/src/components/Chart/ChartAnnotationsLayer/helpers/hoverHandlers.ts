import type { TextAnnotation, AnnotationType } from '../../annotations.types'

export interface HoverState {
  hoveredAnnotationId: string | null
  setHoveredAnnotationId: (id: string | null) => void
}

export function setupHoverHandlers(
  chartContainerRef: React.RefObject<HTMLDivElement | null>,
  annotations: TextAnnotation[],
  creatingType: AnnotationType | undefined,
  hoverState: HoverState
) {
  return (e: MouseEvent) => {
    if (!chartContainerRef.current) return

    if (creatingType) {
      chartContainerRef.current.style.cursor = creatingType === 'text' ? 'text' : 'crosshair'
      hoverState.setHoveredAnnotationId(null)
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
          hoverState.setHoveredAnnotationId(annotation.id)
          chartContainerRef.current.style.cursor = 'text'
          foundHover = true
          break
        }
      }
    }
    if (!foundHover) {
      hoverState.setHoveredAnnotationId(null)
      chartContainerRef.current.style.cursor = 'default'
    }
  }
}
