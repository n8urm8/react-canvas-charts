import type {
  ChartLegacyPointArrays,
  CursorDataPoint,
  NormalizedDatum
} from '../../components/Chart/ChartSurface/ChartSurface.types'
import type { ChartDataStore, ChartViewRange } from './chartData.types'

interface LegacyArraysInput {
  store: ChartDataStore
  keys: string[]
  view: ChartViewRange
  getXPosition: (index: number) => number
  getYPositionForKey: (key: string, value: number) => number
}

/**
 * Creates the deprecated per-point arrays lazily. Nothing is allocated until a property is read,
 * and each array is built at most once per input set. All arrays cover the visible range only.
 */
export const createLegacyPointArrays = ({
  store,
  keys,
  view,
  getXPosition,
  getYPositionForKey
}: LegacyArraysInput): ChartLegacyPointArrays => {
  const count = Math.max(0, view.end - view.start + 1)
  let labels: string[] | null = null
  let labelPositions: number[] | null = null
  let normalizedData: NormalizedDatum[] | null = null
  let dataPoints: CursorDataPoint[] | null = null

  const getLabels = () => {
    if (!labels) {
      labels = new Array<string>(count)
      for (let offset = 0; offset < count; offset += 1) labels[offset] = store.label(view.start + offset)
    }
    return labels
  }

  const getLabelPositions = () => {
    if (!labelPositions) {
      labelPositions = new Array<number>(count)
      for (let offset = 0; offset < count; offset += 1) labelPositions[offset] = getXPosition(view.start + offset)
    }
    return labelPositions
  }

  const getNormalizedData = () => {
    if (!normalizedData) {
      const resolvedLabels = getLabels()
      const positions = getLabelPositions()
      normalizedData = new Array<NormalizedDatum>(count)
      for (let offset = 0; offset < count; offset += 1) {
        const index = view.start + offset
        const values: Record<string, number | null> = {}
        keys.forEach((key) => {
          const value = store.value(key, index)
          values[key] = Number.isNaN(value) ? null : value
        })
        normalizedData[offset] = {
          index,
          label: resolvedLabels[offset],
          x: positions[offset],
          values,
          raw: store.row(index)
        }
      }
    }
    return normalizedData
  }

  const getDataPoints = () => {
    if (!dataPoints) {
      const points: CursorDataPoint[] = []
      getNormalizedData().forEach((datum) => {
        keys.forEach((key, seriesIndex) => {
          const value = datum.values[key]
          if (value === null) return
          points.push({
            x: datum.x,
            y: getYPositionForKey(key, value),
            value,
            label: datum.label,
            seriesIndex,
            dataIndex: datum.index,
            originalData: { ...datum.raw, dataKey: key }
          })
        })
      })
      dataPoints = points
    }
    return dataPoints
  }

  return {
    get labels() {
      return getLabels()
    },
    get labelPositions() {
      return getLabelPositions()
    },
    get normalizedData() {
      return getNormalizedData()
    },
    get dataPoints() {
      return getDataPoints()
    }
  }
}

/** Copies the lazy getters of `source` onto `target` without evaluating them. */
export const attachLegacyPointArrays = <T extends object>(target: T, source: ChartLegacyPointArrays) => {
  Object.defineProperties(target, {
    labels: { get: () => source.labels, enumerable: false, configurable: true },
    labelPositions: { get: () => source.labelPositions, enumerable: false, configurable: true },
    normalizedData: { get: () => source.normalizedData, enumerable: false, configurable: true },
    dataPoints: { get: () => source.dataPoints, enumerable: false, configurable: true }
  })
  return target as T & ChartLegacyPointArrays
}
