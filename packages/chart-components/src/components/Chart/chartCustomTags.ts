export interface ChartCustomTag {
  id: string
  dataIndex: number
  yValue: number
  dataKey?: string
  scaleId?: string
  content: React.ReactNode
  offsetX?: number
  offsetY?: number
  className?: string
  style?: React.CSSProperties
}

export interface CreateChartCustomTagOptions {
  id?: string
  dataKey?: string
  scaleId?: string
  offsetX?: number
  offsetY?: number
  className?: string
  style?: React.CSSProperties
}

function newTagId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `chart-custom-tag-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/** Create a custom tag state object with a stable random `id`. */
export function createChartCustomTag(
  content: React.ReactNode,
  dataIndex: number,
  yValue: number,
  options?: CreateChartCustomTagOptions
): ChartCustomTag {
  return {
    id: options?.id ?? newTagId(),
    dataIndex,
    yValue,
    content,
    dataKey: options?.dataKey,
    scaleId: options?.scaleId,
    offsetX: options?.offsetX,
    offsetY: options?.offsetY,
    className: options?.className,
    style: options?.style
  }
}
