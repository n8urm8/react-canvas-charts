import type { FreehandAnnotation } from '../annotations.types'
import { toPixelSpace } from './utils'

/**
 * Render a freehand annotation on the canvas
 */
export const renderFreehandAnnotation = (
  context: CanvasRenderingContext2D,
  annotation: FreehandAnnotation,
  getXPosition: (index: number) => number,
  getYPosition: (value: number) => number
) => {
  if (annotation.points.length < 2) return

  const points = annotation.points.map((p) => toPixelSpace(p, getXPosition, getYPosition))

  context.save()
  context.strokeStyle = annotation.color ?? '#000000'
  context.lineWidth = annotation.strokeWidth ?? 2
  context.lineCap = 'round'
  context.lineJoin = 'round'

  context.beginPath()
  context.moveTo(points[0].x, points[0].y)

  if (annotation.smoothing && annotation.smoothing > 0) {
    // Smooth the path using quadratic curves
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2
      const yc = (points[i].y + points[i + 1].y) / 2
      context.quadraticCurveTo(points[i].x, points[i].y, xc, yc)
    }
    const last = points[points.length - 1]
    context.lineTo(last.x, last.y)
  } else {
    // Draw straight lines between points
    for (let i = 1; i < points.length; i++) {
      context.lineTo(points[i].x, points[i].y)
    }
  }

  if (annotation.closed) {
    context.closePath()
  }

  context.stroke()

  // Draw selection indicators
  if (annotation.selected) {
    context.fillStyle = '#3b82f6'
    points.forEach((point, index) => {
      if (index % 5 === 0 || index === points.length - 1) {
        context.fillRect(point.x - 3, point.y - 3, 6, 6)
      }
    })
  }

  context.restore()
}
