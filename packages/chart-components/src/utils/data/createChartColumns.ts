import type { ChartColumnarData } from './chartData.types'

/**
 * Wraps columnar data for the `columns` prop.
 *
 * React 19's development build logs changed props to the Performance panel ("Components" track)
 * and walks them up to three levels deep, enumerating every element of typed arrays it finds.
 * With millions of samples that takes seconds and can exhaust memory in development builds.
 * This wrapper keeps the same shape but makes its fields non-enumerable so that logger skips them.
 * It has no effect on production builds, where the logging does not exist.
 */
export const createChartColumns = (data: ChartColumnarData): ChartColumnarData => {
  const wrapped = {} as ChartColumnarData
  const descriptors: PropertyDescriptorMap = {}
  ;(Object.keys(data) as Array<keyof ChartColumnarData>).forEach((key) => {
    descriptors[key] = { value: data[key], enumerable: false, writable: false, configurable: false }
  })
  Object.defineProperties(wrapped, descriptors)
  return wrapped
}
