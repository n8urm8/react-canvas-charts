export const ChartSurfaceSection = () => {
  return (
    <section id="chart-surface" className="mb-12">
      <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">ChartSurface</h2>
      <p className="text-gray-700 mb-4">
        The foundational component that provides context and rendering infrastructure for all child chart
        components. Manages canvas layers, data normalization, coordinate transformations, and event handling.
      </p>

      <div className="bg-gray-50 p-6 rounded-lg mb-4">
        <h3 className="font-semibold text-lg mb-3">Key Props</h3>
        <dl className="space-y-3">
          <div>
            <dt className="font-mono text-sm text-blue-600">data: Record&lt;string, unknown&gt;[]</dt>
            <dd className="text-gray-700 ml-4">Array of data objects. Each object represents one data point.</dd>
          </div>
          <div>
            <dt className="font-mono text-sm text-blue-600">xKey: string</dt>
            <dd className="text-gray-700 ml-4">The property name in each data object to use for X-axis values.</dd>
          </div>
          <div>
            <dt className="font-mono text-sm text-blue-600">yKeys?: string[]</dt>
            <dd className="text-gray-700 ml-4">
              Array of property names for Y-axis values. Creates a series for each key.
            </dd>
          </div>
          <div>
            <dt className="font-mono text-sm text-blue-600">width?: number | string</dt>
            <dd className="text-gray-700 ml-4">Chart width in pixels or CSS string (e.g., "100%"). Default: 800</dd>
          </div>
          <div>
            <dt className="font-mono text-sm text-blue-600">height?: number | string</dt>
            <dd className="text-gray-700 ml-4">Chart height in pixels or CSS string. Default: 400</dd>
          </div>
          <div>
            <dt className="font-mono text-sm text-blue-600">margin?: ChartMargin</dt>
            <dd className="text-gray-700 ml-4">
              Padding around the chart area. Can be number or object with top/right/bottom/left.
            </dd>
          </div>
          <div>
            <dt className="font-mono text-sm text-blue-600">colors?: string[]</dt>
            <dd className="text-gray-700 ml-4">Color palette for series. Maps to yKeys in order.</dd>
          </div>
          <div>
            <dt className="font-mono text-sm text-blue-600">valueScales?: ValueScaleDefinition[]</dt>
            <dd className="text-gray-700 ml-4">
              Define custom Y-axis scales with specific domain and data key mappings.
            </dd>
          </div>
          <div>
            <dt className="font-mono text-sm text-blue-600">enableSelection?: boolean</dt>
            <dd className="text-gray-700 ml-4">Enable click-and-drag selection on the chart. Default: false</dd>
          </div>
          <div>
            <dt className="font-mono text-sm text-blue-600">selection?: ChartSelectionResult | null</dt>
            <dd className="text-gray-700 ml-4">Controlled selection state (x range and affected series).</dd>
          </div>
          <div>
            <dt className="font-mono text-sm text-blue-600">
              onSelectionChange?: (selection: ChartSelectionResult | null) =&gt; void
            </dt>
            <dd className="text-gray-700 ml-4">Callback fired when selection changes.</dd>
          </div>
          <div>
            <dt className="font-mono text-sm text-blue-600">yAxisSpacing?: number</dt>
            <dd className="text-gray-700 ml-4">Spacing between multiple Y-axes in pixels. Default: 80</dd>
          </div>
        </dl>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Usage Example</h4>
        <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
          {`<ChartSurface
  data={data}
  xKey="timestamp"
  yKeys={["temperature", "humidity"]}
  width="100%"
  height={400}
  margin={80}
  colors={["#3b82f6", "#ef4444"]}
>
  {/* Child components */}
</ChartSurface>`}
        </pre>
      </div>
    </section>
  )
}
