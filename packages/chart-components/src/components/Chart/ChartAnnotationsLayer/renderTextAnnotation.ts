import type { TextAnnotation } from './annotations.types'
import { toPixelSpace } from './utils'

const drawRoundedRectPath = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2))
  if (safeRadius === 0) {
    context.rect(x, y, width, height)
    return
  }

  context.moveTo(x + safeRadius, y)
  context.lineTo(x + width - safeRadius, y)
  context.arcTo(x + width, y, x + width, y + safeRadius, safeRadius)
  context.lineTo(x + width, y + height - safeRadius)
  context.arcTo(x + width, y + height, x + width - safeRadius, y + height, safeRadius)
  context.lineTo(x + safeRadius, y + height)
  context.arcTo(x, y + height, x, y + height - safeRadius, safeRadius)
  context.lineTo(x, y + safeRadius)
  context.arcTo(x, y, x + safeRadius, y, safeRadius)
}

/**
 * Render a text annotation on the canvas
 */
export const renderTextAnnotation = (
  context: CanvasRenderingContext2D,
  annotation: TextAnnotation,
  getXPosition: (index: number) => number,
  getYPosition: (value: number) => number,
  isHovered?: boolean
) => {
  const pos = toPixelSpace(annotation.position, getXPosition, getYPosition)
  const fontSize = annotation.fontSize ?? 14
  const fontWeight = annotation.fontWeight ?? 'normal'
  const padding = annotation.padding ?? 8
  const borderRadius = annotation.borderRadius ?? 4
  const textAlign = 'left'

  // Get dimensions from metadata or calculate from text
  const storedWidth = annotation.metadata?.width
  const storedHeight = annotation.metadata?.height

  context.save()
  context.font = `${fontWeight} ${fontSize}px sans-serif`
  context.textAlign = textAlign
  context.textBaseline = 'top'

  let boxWidth: number
  let boxHeight: number
  let lines: string[]

  if (typeof storedWidth === 'number' && typeof storedHeight === 'number') {
    // Use stored dimensions and wrap text
    const maxWidth = storedWidth - padding * 2
    lines = []
    const words = annotation.text.split(' ')
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const metrics = context.measureText(testLine)

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }

    // Use the stored dimensions directly for the box
    boxWidth = storedWidth
    boxHeight = storedHeight
  } else {
    // Single line, no wrapping - calculate from text
    lines = [annotation.text]
    const metrics = context.measureText(annotation.text)
    boxWidth = metrics.width + padding * 2
    boxHeight = fontSize + padding * 2
  }

  // Draw background if specified
  if (annotation.backgroundColor) {
    context.fillStyle = annotation.backgroundColor
    context.beginPath()
    drawRoundedRectPath(context, pos.x - padding, pos.y - padding, boxWidth, boxHeight, borderRadius)
    context.fill()
  }

  // Draw text (potentially multiple lines)
  context.fillStyle = annotation.color ?? '#000000'
  lines.forEach((line, index) => {
    context.fillText(line, pos.x, pos.y + index * fontSize * 1.2)
  })

  // Draw selection indicator if selected
  if (annotation.selected) {
    context.strokeStyle = '#3b82f6'
    context.lineWidth = 2
    context.beginPath()
    drawRoundedRectPath(context, pos.x - padding, pos.y - padding, boxWidth, boxHeight, borderRadius)
    context.stroke()
  }

  // Draw hover indicator
  if (isHovered && !annotation.selected) {
    context.strokeStyle = '#9ca3af'
    context.lineWidth = 1
    context.setLineDash([4, 4])
    context.beginPath()
    drawRoundedRectPath(context, pos.x - padding, pos.y - padding, boxWidth, boxHeight, borderRadius)
    context.stroke()
  }

  context.restore()
}
