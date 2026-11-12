const Prop = ({ sig, children }: { sig: string; children: React.ReactNode }) => (
  <div>
    <dt className="font-mono text-sm text-blue-600 break-words">{sig}</dt>
    <dd className="text-gray-700 ml-4">{children}</dd>
  </div>
)

export const DataStructuresSection = () => {
  return (
    <section id="data-structures" className="mb-12">
      <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">Data Structures</h2>
      <p className="text-gray-700 mb-4">
        <code className="font-mono text-sm">ChartSurface</code> accepts data in two shapes. Row objects (
        <code className="font-mono text-sm">data</code>) are the easiest to start with and work well up to roughly
        100k points. For anything larger, pass <strong>columnar data</strong> (
        <code className="font-mono text-sm">columns</code>): one typed array per series. Columnar data takes precedence
        when both are given.
      </p>

      <div className="overflow-x-auto mb-6">
        <table className="min-w-full text-sm text-left border border-gray-200 bg-white">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 font-semibold"></th>
              <th className="px-3 py-2 font-semibold">
                Rows (<code className="font-mono">data</code>)
              </th>
              <th className="px-3 py-2 font-semibold">
                Columns (<code className="font-mono">columns</code>)
              </th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            <tr className="border-t">
              <td className="px-3 py-2 font-medium">Shape</td>
              <td className="px-3 py-2 font-mono">{'[{ time, a, b }, …]'}</td>
              <td className="px-3 py-2 font-mono">{'{ length, series: { a, b } }'}</td>
            </tr>
            <tr className="border-t">
              <td className="px-3 py-2 font-medium">Memory, 10M points × 2 series</td>
              <td className="px-3 py-2">several GB (one object per point)</td>
              <td className="px-3 py-2">~120 MB with Float32Array</td>
            </tr>
            <tr className="border-t">
              <td className="px-3 py-2 font-medium">Good for</td>
              <td className="px-3 py-2">small and medium datasets, quick prototypes</td>
              <td className="px-3 py-2">100k to 10M+ points, streaming appends</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg mb-4">
        <h3 className="font-semibold text-lg mb-3">ChartColumnarData</h3>
        <dl className="space-y-3">
          <Prop sig="length: number">
            Number of valid samples in every column. Columns can be larger, over-allocated buffers; only the first{' '}
            <code className="font-mono text-sm">length</code> entries are read.
          </Prop>
          <Prop sig="series: Record<string, NumericColumn>">
            One numeric column per series, keyed by the same id you pass as <code>dataKey</code> /{' '}
            <code>yKeys</code>. Missing values are <code>NaN</code>; lines connect across them.
          </Prop>
          <Prop sig="x?: NumericColumn">
            Optional x values, such as timestamps. They are passed to <code>formatLabel</code>. Points are still spaced
            evenly by index.
          </Prop>
          <Prop sig="labels?: ArrayLike<string>">
            Precomputed x labels. For large datasets prefer <code>formatLabel</code>, which avoids storing millions of
            strings.
          </Prop>
          <Prop sig="formatLabel?: (index: number, xValue: number | undefined) => string">
            Builds the label for one index on demand. Only visible axis ticks and the hovered tooltip are formatted.
          </Prop>
          <Prop sig="revision?: number">
            Change this when you overwrite values that already existed, so cached indexes rebuild. Not needed for
            appends.
          </Prop>
        </dl>
        <p className="text-gray-700 mt-4 text-sm">
          <code className="font-mono">NumericColumn</code> is <code className="font-mono">ArrayLike&lt;number&gt;</code>.
          A plain <code>number[]</code> works, but <code>Float32Array</code> or <code>Float64Array</code> is strongly
          recommended: they are compact and fast to scan, and <code>Float32Array</code> also halves the size of the
          internal min/max index.
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h4 className="font-semibold mb-2">Example: 1 million points</h4>
        <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
          {`import { ChartSurface, ChartLineSeries, ChartXAxis, ChartYAxis,
  createChartColumns } from 'react-canvas-charts'

const n = 1_000_000
const time = new Float64Array(n)
const temperature = new Float32Array(n)
for (let i = 0; i < n; i++) {
  time[i] = start + i * 1000
  temperature[i] = readSensor(i)
}

// Build once (useMemo or state), not on every render.
const columns = createChartColumns({
  length: n,
  x: time,
  series: { temperature },
  formatLabel: (_i, t) => new Date(t!).toLocaleTimeString(),
})

<ChartSurface columns={columns} xKey="time" yKeys={['temperature']}>
  <ChartXAxis />
  <ChartYAxis />
  <ChartLineSeries dataKey="temperature" />
</ChartSurface>`}
        </pre>
      </div>

      <h3 className="text-2xl font-semibold mb-3 mt-8">createChartColumns(data)</h3>
      <p className="text-gray-700 mb-4">
        Returns the same <code className="font-mono text-sm">ChartColumnarData</code> with its fields made
        non-enumerable. React 19's development build logs changed props to the Performance panel and walks into them,
        which means touching every element of a multi-million-entry typed array. That can take seconds or run out of
        memory in dev. Wrapping the object hides the arrays from that logger. It is harmless in production, where the
        logging does not exist. Use it whenever you pass <code className="font-mono text-sm">columns</code>.
      </p>

      <h3 className="text-2xl font-semibold mb-3 mt-8">Streaming and updates</h3>
      <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
        <li>
          <strong>Appending:</strong> allocate columns larger than you need, write new samples past the current end,
          and pass a new object with a larger <code>length</code> that reuses the same arrays. The chart only indexes
          the new samples.
        </li>
        <li>
          <strong>Editing existing values:</strong> after changing values in place, bump <code>revision</code> so the
          chart rebuilds its indexes.
        </li>
        <li>
          <strong>Replacing the dataset:</strong> pass new arrays. Anything built from the old arrays is discarded.
        </li>
      </ul>
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h4 className="font-semibold mb-2">Example: appending to a pre-allocated buffer</h4>
        <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
          {`const capacity = 5_000_000
const values = new Float32Array(capacity)
let length = 0

function onSamples(batch: number[]) {
  values.set(batch, length)
  length += batch.length
  setColumns(createChartColumns({ length, series: { values } }))
}`}
        </pre>
      </div>

      <h3 className="text-2xl font-semibold mb-3 mt-8">ChartViewRange (zooming)</h3>
      <p className="text-gray-700 mb-4">
        <code className="font-mono text-sm">{'viewRange?: { start: number; end: number }'}</code> is an inclusive range
        of indices to display. It defaults to all data. Zooming changes these two numbers and does not copy or filter
        data. Indices reported by hover, click and selection callbacks are always absolute, not relative to the range,
        so you can feed a selection straight back in as the next <code className="font-mono text-sm">viewRange</code>.
      </p>
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h4 className="font-semibold mb-2">Example: zoom to a selection</h4>
        <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
          {`const [view, setView] = useState<ChartViewRange | undefined>()

<ChartSurface
  columns={columns}
  xKey="time"
  viewRange={view}
  onSelectionChange={(sel) =>
    sel && setView({ start: sel.minIndex, end: sel.maxIndex })
  }
>
  …
</ChartSurface>`}
        </pre>
      </div>

      <h3 className="text-2xl font-semibold mb-3 mt-8">Reading data in custom layers</h3>
      <p className="text-gray-700 mb-4">
        Custom layers (<code className="font-mono text-sm">useChartLayer</code>) receive render helpers that read data
        the same way whether it came from rows or columns, without creating an object per point:
      </p>
      <div className="bg-gray-50 p-6 rounded-lg mb-4">
        <dl className="space-y-3">
          <Prop sig="viewRange: ChartViewRange">Inclusive range of indices currently in view.</Prop>
          <Prop sig="dataLength: number">Total number of samples.</Prop>
          <Prop sig="getValue(dataKey, index): number">Series value at an absolute index, or NaN when missing.</Prop>
          <Prop sig="getLabel(index): string">X label for an absolute index.</Prop>
          <Prop sig="getXPosition(index) / getIndexAtPosition(x)">Convert between data index and pixel x.</Prop>
          <Prop sig="findNearestPoint(x, y, snapRadius, snapAlongYAxis)">
            Nearest point to a pixel position, within the view range.
          </Prop>
          <Prop sig="getPointsAtIndex(index): CursorDataPoint[]">One point per series at an index.</Prop>
          <Prop sig="dataStore: ChartDataStore">
            Lower-level accessor with <code>column(key)</code>, <code>value(key, i)</code>, <code>label(i)</code>,{' '}
            <code>row(i)</code>, and <code>extent(key, start, end)</code> /{' '}
            <code>indexedExtent(key, start, end)</code>, which return a range's exact min and max (and where they are)
            using the min/max pyramid.
          </Prop>
        </dl>
        <p className="text-gray-700 mt-4 text-sm">
          The older <code>labels</code>, <code>labelPositions</code>, <code>normalizedData</code> and{' '}
          <code>dataPoints</code> helpers still work but are deprecated. They build one object per visible point the
          first time they're read, so avoid them with large datasets.
        </p>
      </div>
    </section>
  )
}
