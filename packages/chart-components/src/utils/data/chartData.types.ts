/** Any indexable numeric column. Typed arrays (Float32Array/Float64Array) are strongly recommended. */
export type NumericColumn = ArrayLike<number>

/**
 * Column-oriented chart data. Use this instead of row objects for large datasets:
 * 10M samples × 2 series in Float32Array columns is ~120 MB, versus several GB as row objects.
 *
 * Missing values are represented with `NaN`.
 *
 * Columns may be over-allocated buffers; only the first `length` entries are read. Reusing the
 * same arrays while appending (growing `length`) lets the chart update its indexes incrementally.
 * If you rewrite values that were already present, change `revision` so cached indexes rebuild.
 */
export interface ChartColumnarData {
  /** Number of valid samples in every column. */
  length: number
  /** One numeric column per series, keyed by series id (the same ids used as `dataKey`). */
  series: Record<string, NumericColumn>
  /** Optional x values (e.g. timestamps). Points are still spaced evenly by index. */
  x?: NumericColumn
  /** Optional precomputed x labels. Prefer `formatLabel` for large datasets. */
  labels?: ArrayLike<string>
  /** Formats the x label for an index on demand (only visible ticks/tooltips are formatted). */
  formatLabel?: (index: number, xValue: number | undefined) => string
  /** Bump when existing values are modified in place (not needed for appends). */
  revision?: number
}

/** Inclusive index range of the data that is visible in the chart. */
export interface ChartViewRange {
  start: number
  end: number
}

/** Read-only accessor over the chart's data, regardless of whether it came from rows or columns. */
export interface ChartDataStore {
  readonly length: number
  /** Series keys plotted on the value axis. */
  readonly keys: string[]
  readonly xKey: string
  /** Raw column for a series, if present. */
  column: (key: string) => NumericColumn | undefined
  /** Value of a series at an index, or `NaN` when missing. */
  value: (key: string, index: number) => number
  /** X label for an index. */
  label: (index: number) => string
  /** Row-shaped record for an index (original row for row data, synthesised for columnar data). */
  row: (index: number) => Record<string, unknown>
  /** Exact min/max over `[start, end)` for a series, ignoring NaN. */
  extent: (key: string, start: number, end: number) => { min: number; max: number }
  /** Like `extent`, plus the earliest indices of the min and max (-1 when there are none). */
  indexedExtent: (
    key: string,
    start: number,
    end: number
  ) => { min: number; max: number; minIndex: number; maxIndex: number }
}
