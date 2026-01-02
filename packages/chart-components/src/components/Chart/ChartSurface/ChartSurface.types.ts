// Core domain types
export interface ValueDomain {
  min: number
  max: number
  paddedMin: number
  paddedMax: number
}

export interface ChartArea {
  x: number
  y: number
  width: number
  height: number
}

export interface ChartMargin {
  top: number
  right: number
  bottom: number
  left: number
}

export interface ChartPointer {
  x: number
  y: number
}

// Data point type (from ChartCursor)
export interface CursorDataPoint {
  x: number
  y: number
  value: number | string
  label?: string
  seriesIndex?: number
  dataIndex?: number
  originalData?: Record<string, unknown>
}

// Data types
export interface NormalizedDatum {
  index: number
  label: string
  x: number
  values: Record<string, number | null>
  raw: Record<string, unknown>
}

// Selection types
export interface ChartSelectionSeriesEntry {
  index: number
  label: string
  value: number | null
}

export interface ChartSelectionSeriesRange {
  min: ChartSelectionSeriesEntry
  max: ChartSelectionSeriesEntry
}

export interface ChartSelectionResult {
  minIndex: number
  maxIndex: number
  minLabel: string
  maxLabel: string
  series: Record<string, ChartSelectionSeriesRange>
  rangePixels: { start: number; end: number }
}

// Axis types
export interface AxisTickDescriptor {
  positions: number[]
  labels: string[]
  values?: number[]
  indices?: number[]
}

export interface AxisTickState {
  x: AxisTickDescriptor | null
  y: AxisTickDescriptor | null
}

// Scale types
export interface ValueScaleDefinition {
  id?: string
  dataKeys?: string[]
  domain?: {
    min?: number
    max?: number
  }
}

// Layer types
export interface ChartLayerOptions {
  order?: number
}

export interface ChartLayerHandle {
  update: (draw: ChartLayerRenderer, options?: ChartLayerOptions) => void
  unregister: () => void
}

export interface ChartLayer {
  id: string
  order: number
  draw: ChartLayerRenderer
}

// Render helper types
export interface ChartSurfaceRenderHelpers {
  canvasWidth: number
  canvasHeight: number
  chartArea: ChartArea
  labels: string[]
  labelPositions: number[]
  normalizedData: NormalizedDatum[]
  getXPosition: (index: number) => number
  getYPosition: (value: number) => number
  getYPositionForScale: (scaleId: string, value: number) => number
  getYPositionForKey: (dataKey: string, value: number) => number
  getScaleDomain: (scaleId: string) => ValueDomain
  getScaleIdForKey: (dataKey: string) => string
  defaultScaleId: string
  colorForKey: (dataKey: string, fallback?: string) => string
  pointer: ChartPointer | null
  dataPoints: CursorDataPoint[]
  axisTicks: AxisTickState
  valueDomain: ValueDomain
  valueDomainsByScale: Record<string, ValueDomain>
  renderCycle: number
  yAxisCounts: { left: number; right: number }
}

export type ChartLayerRenderer = (context: CanvasRenderingContext2D, helpers: ChartSurfaceRenderHelpers) => void

// Context value type
export interface ChartSurfaceContextValue {
  data: Record<string, unknown>[]
  xKey: string
  yKeys: string[]
  labels: string[]
  labelPositions: number[]
  chartArea: ChartArea
  canvasSize: { width: number; height: number }
  valueDomain: ValueDomain
  valueDomainsByScale: Record<string, ValueDomain>
  getXPosition: (index: number) => number
  getYPosition: (value: number) => number
  getYPositionForScale: (scaleId: string, value: number) => number
  getYPositionForKey: (dataKey: string, value: number) => number
  getScaleDomain: (scaleId: string) => ValueDomain
  getScaleIdForKey: (dataKey: string) => string
  defaultScaleId: string
  normalizedData: NormalizedDatum[]
  dataPoints: CursorDataPoint[]
  axisTicks: AxisTickState
  registerLayer: (draw: ChartLayerRenderer, options?: ChartLayerOptions) => ChartLayerHandle
  setAxisTicks: (axis: 'x' | 'y', descriptor: AxisTickDescriptor | null) => void
  getColorForKey: (dataKey: string, fallback?: string) => string
  registerCursorOptions: (options: Partial<CursorOptions>) => () => void
  requestRender: () => void
  registerYAxis: (side: 'left' | 'right') => { id: string; unregister: () => void }
  getYAxisIndex: (id: string, side: 'left' | 'right') => number
  yAxisCounts: { left: number; right: number }
  yAxisSpacing: number
}

// Cursor types
export interface CursorOptions {
  snapRadius: number
  snapToDataPoints: boolean
  snapAlongYAxis: boolean
}

// Component props
export interface ChartSurfaceProps {
  data: Record<string, unknown>[]
  xKey: string
  yKeys?: string[]
  xAxisType?: 'linear' | 'categorical'
  width?: number | string
  height?: number | string
  margin?: Partial<ChartMargin>
  backgroundColor?: string
  defaultColors?: string[]
  className?: string
  style?: React.CSSProperties
  onHover?: (dataPoint: CursorDataPoint | null) => void
  onClick?: (dataPoint: CursorDataPoint | null) => void
  onSelectionChange?: (selection: ChartSelectionResult | null) => void
  valueScales?: ValueScaleDefinition[]
  children?: React.ReactNode
  selectionResetKey?: number
}
