import type { ChartAnnotation, AnnotationType } from '../../annotations.types'

export const DEFAULT_ANNOTATION_COLOR = '#000000'
export const DEFAULT_STROKE_WIDTH = 2
export const DEFAULT_TEXT = 'New Text'
export const DEFAULT_FONT_SIZE = 14
export const DEFAULT_LINE_LENGTH = 100
export const DEFAULT_CIRCLE_RADIUS = 30

export function buildNewAnnotation(type: AnnotationType, x: number, y: number): ChartAnnotation {
  const baseId = `annotation-${Date.now()}`
  const baseProps = {
    id: baseId,
    color: DEFAULT_ANNOTATION_COLOR,
    strokeWidth: DEFAULT_STROKE_WIDTH
  }

  switch (type) {
    case 'text':
      return {
        ...baseProps,
        type: 'text',
        position: { x, y },
        text: DEFAULT_TEXT,
        fontSize: DEFAULT_FONT_SIZE
      }
    case 'line':
      return {
        ...baseProps,
        type: 'line',
        start: { x, y },
        end: { x: x + DEFAULT_LINE_LENGTH, y }
      }
    case 'circle':
      return {
        ...baseProps,
        type: 'circle',
        center: { x, y },
        radius: DEFAULT_CIRCLE_RADIUS
      }
    case 'freehand':
      return {
        ...baseProps,
        type: 'freehand',
        points: [{ x, y }]
      }
  }
}
