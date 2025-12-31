import type { LineAnnotation, CircleAnnotation, FreehandAnnotation } from '../annotations.types'

const HANDLE_RADIUS = 6
const LINE_HIT_TOLERANCE = 8
const FREEHAND_HIT_TOLERANCE = 10

export type HitResult =
  | { type: 'line-start'; annotationId: string }
  | { type: 'line-end'; annotationId: string }
  | { type: 'line-body'; annotationId: string }
  | { type: 'circle-body'; annotationId: string }
  | { type: 'circle-resize'; annotationId: string }
  | { type: 'freehand-body'; annotationId: string }
  | null

// Distance from point to line segment
function pointToLineSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthSq = dx * dx + dy * dy

  if (lengthSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2)

  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq
  t = Math.max(0, Math.min(1, t))

  const closestX = x1 + t * dx
  const closestY = y1 + t * dy

  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2)
}

export function checkLineHit(x: number, y: number, annotation: LineAnnotation): HitResult {
  const start = annotation.start
  const end = annotation.end

  // Check endpoints first (higher priority)
  const distToStart = Math.sqrt((x - start.x) ** 2 + (y - start.y) ** 2)
  if (distToStart <= HANDLE_RADIUS) {
    return { type: 'line-start', annotationId: annotation.id }
  }

  const distToEnd = Math.sqrt((x - end.x) ** 2 + (y - end.y) ** 2)
  if (distToEnd <= HANDLE_RADIUS) {
    return { type: 'line-end', annotationId: annotation.id }
  }

  // Check line body
  const distToLine = pointToLineSegmentDistance(x, y, start.x, start.y, end.x, end.y)
  if (distToLine <= LINE_HIT_TOLERANCE) {
    return { type: 'line-body', annotationId: annotation.id }
  }

  return null
}

export function checkCircleHit(x: number, y: number, annotation: CircleAnnotation): HitResult {
  const center = annotation.center
  const radius = annotation.radius

  const distToCenter = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2)

  // Check resize handle (on the right edge of circle)
  const resizeHandleX = center.x + radius
  const resizeHandleY = center.y
  const distToResizeHandle = Math.sqrt((x - resizeHandleX) ** 2 + (y - resizeHandleY) ** 2)
  if (distToResizeHandle <= HANDLE_RADIUS) {
    return { type: 'circle-resize', annotationId: annotation.id }
  }

  // Check if inside circle or near edge
  if (Math.abs(distToCenter - radius) <= LINE_HIT_TOLERANCE || distToCenter < radius) {
    return { type: 'circle-body', annotationId: annotation.id }
  }

  return null
}

export function checkFreehandHit(x: number, y: number, annotation: FreehandAnnotation): HitResult {
  const points = annotation.points

  if (points.length < 2) return null

  // Check if click is near any segment of the freehand path
  for (let i = 0; i < points.length - 1; i++) {
    const dist = pointToLineSegmentDistance(x, y, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y)
    if (dist <= FREEHAND_HIT_TOLERANCE) {
      return { type: 'freehand-body', annotationId: annotation.id }
    }
  }

  return null
}
