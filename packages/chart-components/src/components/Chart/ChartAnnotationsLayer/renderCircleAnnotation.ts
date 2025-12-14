import type { CircleAnnotation } from '../annotations.types'
import { toPixelSpace } from './utils'

/**
 * Render a circle annotation on the canvas
 */
export const renderCircleAnnotation = (
  context: CanvasRenderingContext2D,
  annotation: CircleAnnotation,
  getXPosition: (index: number) => number,
  getYPosition: (value: number) => number
) => {
  const center = toPixelSpace(annotation.center, getXPosition, getYPosition)

  context.save()
  context.strokeStyle = annotation.color ?? '#000000'
  context.lineWidth = annotation.strokeWidth ?? 2

  context.beginPath()
  context.arc(center.x, center.y, annotation.radius, 0, 2 * Math.PI)

  // Fill if specified
  if (annotation.fillColor) {
    context.fillStyle = annotation.fillColor
    context.globalAlpha = annotation.fillOpacity ?? 0.3
    context.fill()
    context.globalAlpha = 1
  }

  context.stroke()

  // Draw selection indicator
  if (annotation.selected) {
    context.strokeStyle = '#3b82f6'
    context.lineWidth = 2
    context.setLineDash([5, 5])
    context.stroke()
    context.fillStyle = '#3b82f6'
    context.fillRect(center.x - 4, center.y - 4, 8, 8)
  }

  context.restore()
}
