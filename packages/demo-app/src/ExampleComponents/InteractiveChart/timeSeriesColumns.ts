import { createChartColumns, type ChartColumnarData } from 'react-canvas-charts'
import { labelDate, type TimeSeriesBuffer } from './timeSeriesBuffer'
import { formatTimeLabel } from './utils'

// Kept separate from timeSeriesBuffer.ts so the generator worker does not import the chart library.
/** Columnar view for the chart. Labels are formatted on demand from timestamps. */
export const toChartColumns = (buffer: TimeSeriesBuffer): ChartColumnarData =>
  createChartColumns({
    length: buffer.length,
    x: buffer.x,
    series: buffer.series,
    formatLabel: (_index, xValue) => {
      if (xValue === undefined || !Number.isFinite(xValue)) return ''
      labelDate.setTime(xValue)
      return formatTimeLabel(labelDate)
    }
  })
