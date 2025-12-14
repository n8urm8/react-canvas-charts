import type { AnnotationCoordinate } from '../annotations.types'

/**
 * Helper to convert data space coordinates to pixel space
 */
export const toPixelSpace = (
  coord: AnnotationCoordinate,
  getXPosition: (index: number) => number,
  getYPosition: (value: number) => number
): { x: number; y: number } => {
  if (coord.dataSpace) {
    return {
      x: getXPosition(coord.x),
      y: getYPosition(coord.y)
    }
  }
  return { x: coord.x, y: coord.y }
}
