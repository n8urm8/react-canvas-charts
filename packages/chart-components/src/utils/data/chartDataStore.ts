import type { ChartColumnarData, ChartDataStore, NumericColumn } from './chartData.types'
import { columnExtent, columnIndexedExtent, invalidateColumnExtent } from './minMaxPyramid'

const EMPTY_INDEXED_EXTENT = {
  min: Number.POSITIVE_INFINITY,
  max: Number.NEGATIVE_INFINITY,
  minIndex: -1,
  maxIndex: -1
}

/** Rows scanned when inferring numeric series keys from row data. */
const KEY_INFERENCE_SAMPLE = 1000

const toNumber = (raw: unknown): number => {
  if (typeof raw === 'number') return raw
  if (raw === null || raw === undefined || raw === '') return Number.NaN
  const numeric = Number(raw)
  return numeric
}

const inferRowKeys = (rows: Record<string, unknown>[], xKey: string): string[] => {
  const keys = new Set<string>()
  const limit = Math.min(rows.length, KEY_INFERENCE_SAMPLE)
  for (let index = 0; index < limit; index += 1) {
    const row = rows[index]
    for (const key in row) {
      if (key === xKey) continue
      const value = row[key]
      if (typeof value === 'number' && Number.isFinite(value)) {
        keys.add(key)
      }
    }
  }
  return Array.from(keys)
}

/**
 * Builds a store from row objects (the classic `data` prop). Each series is copied once into a
 * Float64Array so range queries and decimation run on contiguous memory.
 */
export const createRowDataStore = (
  rows: Record<string, unknown>[],
  xKey: string,
  yKeys?: string[]
): ChartDataStore => {
  const keys = yKeys && yKeys.length > 0 ? yKeys : inferRowKeys(rows, xKey)
  const length = rows.length
  const columns = new Map<string, Float64Array>()

  keys.forEach((key) => {
    const column = new Float64Array(length)
    for (let index = 0; index < length; index += 1) {
      const numeric = toNumber(rows[index][key])
      column[index] = Number.isFinite(numeric) ? numeric : Number.NaN
    }
    columns.set(key, column)
  })

  return {
    length,
    keys,
    xKey,
    column: (key) => columns.get(key),
    value: (key, index) => {
      const column = columns.get(key)
      if (column) return index >= 0 && index < length ? column[index] : Number.NaN
      const numeric = toNumber(rows[index]?.[key])
      return Number.isFinite(numeric) ? numeric : Number.NaN
    },
    label: (index) => String(rows[index]?.[xKey] ?? ''),
    row: (index) => rows[index] ?? {},
    extent: (key, start, end) => {
      const column = columns.get(key)
      if (!column) return { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }
      return columnExtent(column, length, start, end)
    },
    indexedExtent: (key, start, end) => {
      const column = columns.get(key)
      return column ? columnIndexedExtent(column, length, start, end) : EMPTY_INDEXED_EXTENT
    }
  }
}

/** Significant decimal digits float32 can represent faithfully. */
const FLOAT32_DIGITS = 7

const columnRevisions = new WeakMap<object, number>()

const syncRevision = (column: NumericColumn, revision: number | undefined): void => {
  if (revision === undefined || typeof column !== 'object') return
  const previous = columnRevisions.get(column)
  if (previous !== undefined && previous !== revision) {
    invalidateColumnExtent(column)
  }
  columnRevisions.set(column, revision)
}

/**
 * Wraps columnar data without copying it. Creating a store is O(number of series), so it is
 * cheap to recreate on every streaming update.
 */
export const createColumnarDataStore = (
  data: ChartColumnarData,
  xKey: string,
  yKeys?: string[]
): ChartDataStore => {
  const allKeys = Object.keys(data.series)
  const keys = yKeys && yKeys.length > 0 ? yKeys.filter((key) => key in data.series) : allKeys
  const length = Math.max(0, Math.floor(data.length))
  const { series, x, labels, formatLabel, revision } = data

  allKeys.forEach((key) => syncRevision(series[key], revision))

  const label = (index: number): string => {
    if (index < 0 || index >= length) return ''
    if (labels && index < labels.length) return labels[index]
    const xValue = x ? x[index] : undefined
    if (formatLabel) return formatLabel(index, xValue)
    return xValue !== undefined ? String(xValue) : String(index)
  }

  const readValue = (key: string, index: number): number => {
    const column = series[key]
    if (!column || index < 0 || index >= length) return Number.NaN
    const value = column[index]
    if (!Number.isFinite(value)) return Number.NaN
    // Float32 storage turns 50.3 into 50.29999923706055; report the shortest float32 decimal.
    return column instanceof Float32Array ? Number(value.toPrecision(FLOAT32_DIGITS)) : value
  }

  return {
    length,
    keys,
    xKey,
    column: (key) => series[key],
    value: readValue,
    label,
    row: (index) => {
      const row: Record<string, unknown> = { [xKey]: label(index) }
      if (x && index >= 0 && index < length) row.x = x[index]
      allKeys.forEach((key) => {
        const value = readValue(key, index)
        row[key] = Number.isNaN(value) ? null : value
      })
      return row
    },
    extent: (key, start, end) => {
      const column = series[key]
      if (!column) return { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }
      return columnExtent(column, length, start, end)
    },
    indexedExtent: (key, start, end) => {
      const column = series[key]
      return column ? columnIndexedExtent(column, length, start, end) : EMPTY_INDEXED_EXTENT
    }
  }
}
