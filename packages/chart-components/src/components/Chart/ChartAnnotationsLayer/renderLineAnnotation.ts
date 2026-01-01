import type { LineAnnotation } from './annotations.types'
import { toPixelSpace } from './utils'

/**
 * Render a line annotation on the canvas
 */
export const renderLineAnnotation = (
  context: CanvasRenderingContext2D,
  annotation: LineAnnotation,
  getXPosition: (index: number) => number,
  getYPosition: (value: number) => number
) => {
  const start = toPixelSpace(annotation.start, getXPosition, getYPosition)
  const end = toPixelSpace(annotation.end, getXPosition, getYPosition)

  context.save()
  context.strokeStyle = annotation.color ?? '#000000'
  context.lineWidth = annotation.strokeWidth ?? 2

  if (annotation.dash && annotation.dash.length > 0) {
    context.setLineDash(annotation.dash)
  }

  context.beginPath()
  context.moveTo(start.x, start.y)
  context.lineTo(end.x, end.y)
  context.stroke()

  // Draw arrows if specified
  const drawArrow = (fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 10
    const angle = Math.atan2(toY - fromY, toX - fromX)
    context.beginPath()
    context.moveTo(toX, toY)
    context.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6))
    context.moveTo(toX, toY)
    context.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6))
    context.stroke()
  }

  if (annotation.arrowStart) {
    drawArrow(end.x, end.y, start.x, start.y)
  }
  if (annotation.arrowEnd) {
    drawArrow(start.x, start.y, end.x, end.y)
  }

  // Draw selection indicators
  if (annotation.selected) {
    context.fillStyle = '#3b82f6'
    context.fillRect(start.x - 4, start.y - 4, 8, 8)
    context.fillRect(end.x - 4, end.y - 4, 8, 8)
  }

  context.restore()
}
