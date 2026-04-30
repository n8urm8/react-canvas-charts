export function CustomTagsAndSelectorsSection() {
  return (
    <section id="custom-tags-selectors" className="mb-12">
      <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">
        Interactive Overlays: Point Selectors and Custom Tags
      </h2>

      <div className="space-y-8">
        {/* ChartPointSelectorsLayer */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">ChartPointSelectorsLayer</h3>
          <p className="text-gray-700 mb-4">
            Renders draggable circular reticles at specific data points with optional labels and custom SVG markers.
            Perfect for selecting and highlighting important points on your chart. Users can drag selectors along the
            X-axis to update which point they track.
          </p>

          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">Props</h4>
            <dl className="space-y-3">
              <div>
                <dt className="font-mono text-sm text-blue-600">selectors?: ChartPointSelector[]</dt>
                <dd className="text-gray-700 ml-4">
                  Array of selectors to display (controlled). Use with{' '}
                  <code className="bg-white px-1">onSelectorsChange</code>.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">onSelectorsChange?: (next: ChartPointSelector[]) =&gt; void</dt>
                <dd className="text-gray-700 ml-4">Callback fired when selectors are added, removed, or dragged.</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">defaultSelectors?: ChartPointSelector[]</dt>
                <dd className="text-gray-700 ml-4">Initial selectors for uncontrolled mode.</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">radius?: number</dt>
                <dd className="text-gray-700 ml-4">Outer ring radius in CSS pixels. Default: 14</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">ringColor?: string</dt>
                <dd className="text-gray-700 ml-4">Color of the ring circle. Default: "#6b7280"</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">crosshairColor?: string</dt>
                <dd className="text-gray-700 ml-4">Color of the crosshair lines. Default: "#6b7280"</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">ringWidth?: number</dt>
                <dd className="text-gray-700 ml-4">Ring stroke width in pixels. Default: 2</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">crosshairWidth?: number</dt>
                <dd className="text-gray-700 ml-4">Crosshair stroke width in pixels. Default: 2</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">hitSlop?: number</dt>
                <dd className="text-gray-700 ml-4">Radius of invisible drag target in CSS pixels. Default: 22</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">
                  formatLabel?: (args: {`{ xLabel, yValue, dataKey }`}) =&gt; string
                </dt>
                <dd className="text-gray-700 ml-4">
                  Custom label formatter. Default: shows X-label and Y-value.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">className?: string</dt>
                <dd className="text-gray-700 ml-4">CSS class for the drag handle element.</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">labelClassName?: string</dt>
                <dd className="text-gray-700 ml-4">CSS class for label elements.</dd>
              </div>
            </dl>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg mb-4 border border-yellow-200">
            <h4 className="font-semibold mb-2 text-yellow-900">Creating Selectors</h4>
            <p className="text-sm text-yellow-800 mb-2">Use the helper function to create selectors with unique IDs:</p>
            <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
              {`import { createChartPointSelector } from 'react-canvas-charts'

const selector = createChartPointSelector('temperature', 5, {
  selectorSvg: '<svg>...</svg>', // optional trusted SVG
  labelClassName: 'custom-label'
})`}
            </pre>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Example</h4>
            <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
              {`const [selectors, setSelectors] = useState([
  createChartPointSelector('temperature', 0),
  createChartPointSelector('temperature', 5)
])

return (
  <ChartSurface data={data} xKey="date" yKeys={['temperature']}>
    <ChartPointSelectorsLayer
      selectors={selectors}
      onSelectorsChange={setSelectors}
      ringColor="#3b82f6"
      crosshairColor="#3b82f6"
      radius={16}
    />
  </ChartSurface>
)`}
            </pre>
          </div>
        </div>

        {/* ChartCustomTagsLayer */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">ChartCustomTagsLayer</h3>
          <p className="text-gray-700 mb-4">
            Renders arbitrary React content (tags, notes, badges, mini-charts) anchored to specific data points.
            Supports click-to-place mode for interactive tag creation at any chart location. Perfect for adding rich
            context and annotations directly on your chart.
          </p>

          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">Props</h4>
            <dl className="space-y-3">
              <div>
                <dt className="font-mono text-sm text-blue-600">tags?: ChartCustomTag[]</dt>
                <dd className="text-gray-700 ml-4">
                  Array of tags to display (controlled). Use with <code className="bg-white px-1">onTagsChange</code>.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">onTagsChange?: (next: ChartCustomTag[]) =&gt; void</dt>
                <dd className="text-gray-700 ml-4">Callback fired when tags are added, removed, or updated.</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">defaultTags?: ChartCustomTag[]</dt>
                <dd className="text-gray-700 ml-4">Initial tags for uncontrolled mode.</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">enableTagCreation?: boolean</dt>
                <dd className="text-gray-700 ml-4">
                  Enable click-to-place mode. Click the chart to create a new tag at that point.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">creationDataKey?: string</dt>
                <dd className="text-gray-700 ml-4">
                  Series key (Y-axis) for new tags. If omitted, uses the default scale.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">creationScaleId?: string</dt>
                <dd className="text-gray-700 ml-4">
                  Scale ID for new tags. Only used if <code className="bg-white px-1">creationDataKey</code> is not set.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">onTagPlacement?: (placement: ChartTagPlacement) =&gt; void</dt>
                <dd className="text-gray-700 ml-4">
                  Called when user clicks to place a tag. Receives chart coordinates and data context.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">
                  createTag?: (placement: ChartTagPlacement) =&gt; ChartCustomTag | null
                </dt>
                <dd className="text-gray-700 ml-4">
                  Factory function to create a tag from placement info. Return <code className="bg-white px-1">null</code>{' '}
                  to skip creation.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">className?: string</dt>
                <dd className="text-gray-700 ml-4">CSS class for the overlay container.</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">tagClassName?: string</dt>
                <dd className="text-gray-700 ml-4">CSS class applied to each tag div.</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">tagStyle?: React.CSSProperties</dt>
                <dd className="text-gray-700 ml-4">Default inline styles for each tag.</dd>
              </div>
            </dl>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg mb-4 border border-yellow-200">
            <h4 className="font-semibold mb-2 text-yellow-900">ChartTagPlacement Object</h4>
            <p className="text-sm text-yellow-800 mb-2">
              Passed to <code className="bg-white px-1">onTagPlacement</code> and{' '}
              <code className="bg-white px-1">createTag</code>:
            </p>
            <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
              {`{
  chartX: number          // X pixel position in chart
  chartY: number          // Y pixel position in chart
  dataIndex: number       // Data point index
  yValue: number          // Y-axis value at that point
  label: string           // X-axis label
  scaleId: string         // Scale ID used
  dataKey?: string        // Series key (if specified)
  originalData: object    // Full original data record
}`}
            </pre>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg mb-4 border border-yellow-200">
            <h4 className="font-semibold mb-2 text-yellow-900">Creating Tags</h4>
            <p className="text-sm text-yellow-800 mb-2">Use the helper function to create tags with unique IDs:</p>
            <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
              {`import { createChartCustomTag } from 'react-canvas-charts'

const tag = createChartCustomTag(
  <div className="bg-blue-100 px-2 py-1">My Tag</div>,
  5,           // dataIndex
  42.5,        // yValue
  {
    dataKey: 'temperature',
    offsetY: -24,  // pixels above the point
    className: 'custom-tag'
  }
)`}
            </pre>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Example: Interactive Tag Placement</h4>
            <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
              {`const [tags, setTags] = useState([])
const [template, setTemplate] = useState('note')

const handleCreateTag = (placement) => {
  const content =
    template === 'note'
      ? <div className="bg-amber-50 p-2 rounded">{placement.label}</div>
      : <div className="bg-blue-100 px-2 py-1 rounded">{placement.yValue.toFixed(1)}</div>
  
  return createChartCustomTag(content, placement.dataIndex, placement.yValue)
}

return (
  <ChartSurface data={data} xKey="date" yKeys={['temp']}>
    <ChartCustomTagsLayer
      tags={tags}
      onTagsChange={setTags}
      enableTagCreation={true}
      creationDataKey="temp"
      createTag={handleCreateTag}
    />
  </ChartSurface>
)`}
            </pre>
          </div>

          <div className="bg-green-50 p-4 rounded-lg mt-4 border border-green-200">
            <h4 className="font-semibold mb-2 text-green-900">Use Cases</h4>
            <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
              <li>
                <strong>Annotations:</strong> Add notes or descriptions at specific data points.
              </li>
              <li>
                <strong>KPI Badges:</strong> Display key metrics or statistics inline.
              </li>
              <li>
                <strong>Mini Dashboards:</strong> Embed small charts or sparklines at positions of interest.
              </li>
              <li>
                <strong>Event Markers:</strong> Highlight significant events or anomalies in your data.
              </li>
              <li>
                <strong>Custom React Components:</strong> Any React element can be positioned on the chart.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
