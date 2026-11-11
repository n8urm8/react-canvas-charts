import type { ChartColumnarData, ChartDataStore, ChartViewRange } from '../../../utils/data/chartData.types'

export type {
  ChartColumnarData,
  ChartDataStore,
  ChartViewRange,
  NumericColumn
} from '../../../utils/data/chartData.types'

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
/**
 * Accessors shared by the context value and render helpers for reading data without
 * materialising per-point objects.
 */
export interface ChartDataAccessors {
  /** Column-backed data accessor (works for both row and columnar input). */
  dataStore: ChartDataStore
  /** Total number of samples. */
  dataLength: number
  /** Inclusive range of indices currently in view. */
  viewRange: ChartViewRange
  /** Fractional data index at a pixel x (inverse of getXPosition). */
  getIndexAtPosition: (x: number) => number
  /** X label for an absolute data index. */
  getLabel: (index: number) => string
  /** Series value at an absolute data index, or NaN when missing. */
  getValue: (dataKey: string, index: number) => number
  /** Nearest data point to a pixel position within `snapRadius`, honouring the view range. */
  findNearestPoint: (x: number, y: number, snapRadius: number, snapAlongYAxis: boolean) => CursorDataPoint | null
  /** One point per series with a finite value at the given index, in series order. */
  getPointsAtIndex: (index: number) => CursorDataPoint[]
}

/**
 * Per-point arrays kept for backwards compatibility. They cover the visible range only and are
 * built lazily on first access, so avoid them for large datasets.
 */
export interface ChartLegacyPointArrays {
  /** @deprecated Use getLabel(index). Materialises one string per visible point. */
  labels: string[]
  /** @deprecated Use getXPosition(index). Materialises one number per visible point. */
  labelPositions: number[]
  /** @deprecated Use getValue/getLabel/getXPosition. Materialises one object per visible point. */
  normalizedData: NormalizedDatum[]
  /** @deprecated Use findNearestPoint/getPointsAtIndex. Materialises one object per visible point and series. */
  dataPoints: CursorDataPoint[]
}

export interface ChartSurfaceRenderHelpers extends ChartDataAccessors, ChartLegacyPointArrays {
  canvasWidth: number
  canvasHeight: number
  chartArea: ChartArea
  getXPosition: (index: number) => number
  getYPosition: (value: number) => number
  getYPositionForScale: (scaleId: string, value: number) => number
  getYPositionForKey: (dataKey: string, value: number) => number
  getScaleDomain: (scaleId: string) => ValueDomain
  getScaleIdForKey: (dataKey: string) => string
  defaultScaleId: string
  colorForKey: (dataKey: string, fallback?: string) => string
  pointer: ChartPointer | null
  axisTicks: AxisTickState
  valueDomain: ValueDomain
  valueDomainsByScale: Record<string, ValueDomain>
  renderCycle: number
  yAxisCounts: { left: number; right: number }
  barOrientation: 'vertical' | 'horizontal'
}

export type ChartLayerRenderer = (context: CanvasRenderingContext2D, helpers: ChartSurfaceRenderHelpers) => void

// Context value type
/** Registration functions; their identities never change for the lifetime of a ChartSurface. */
export interface ChartSurfaceStableContextValue {
  registerLayer: (draw: ChartLayerRenderer, options?: ChartLayerOptions) => ChartLayerHandle
  setAxisTicks: (axis: 'x' | 'y', descriptor: AxisTickDescriptor | null) => void
  registerCursorOptions: (options: Partial<CursorOptions>) => () => void
  requestRender: () => void
  registerYAxis: (side: 'left' | 'right') => { id: string; unregister: () => void }
  getYAxisIndex: (id: string, side: 'left' | 'right') => number
  registerHorizontalBars: () => () => void
}

export interface ChartSurfaceContextValue
  extends ChartDataAccessors,
    ChartLegacyPointArrays,
    ChartSurfaceStableContextValue {
  /** Row data as passed in (empty when `columns` is used). */
  data: Record<string, unknown>[]
  xKey: string
  yKeys: string[]
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
  axisTicks: AxisTickState
  getColorForKey: (dataKey: string, fallback?: string) => string
  yAxisCounts: { left: number; right: number }
  yAxisSpacing: number
  barOrientation: 'vertical' | 'horizontal'
}

// Cursor types
export interface CursorOptions {
  snapRadius: number
  snapToDataPoints: boolean
  snapAlongYAxis: boolean
}

// Component props
export interface ChartSurfaceProps {
  /** Row data. For large datasets (100k+ points) prefer `columns`. */
  data?: Record<string, unknown>[]
  /**
   * Column-oriented data (typed arrays). Takes precedence over `data`. Handles 10M+ points:
   * lines and areas are decimated per pixel and hit testing never scans the full dataset.
   */
  columns?: ChartColumnarData
  /**
   * Inclusive range of indices to display (zooming). Defaults to all data. Indices reported by
   * hover, click and selection callbacks are absolute, not relative to the range.
   */
  viewRange?: ChartViewRange
  /** Name of the x label field (row data) or of the synthesised label field (columnar data). */
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
