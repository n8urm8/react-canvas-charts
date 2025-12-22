export function LayersSection() {
  return (
    <section id="layers" className="mb-12">
      <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">Layer Components</h2>

      <div className="space-y-8">
        {/* ChartGridLayer */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">ChartGridLayer</h3>
          <p className="text-gray-700 mb-4">Renders horizontal and vertical grid lines for easier value reading.</p>

          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">Props</h4>
            <dl className="space-y-3">
              <div>
                <dt className="font-mono text-sm text-blue-600">color?: string</dt>
                <dd className="text-gray-700 ml-4">Grid line color. Default: "#e5e7eb"</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">horizontalLineWidth?: number</dt>
                <dd className="text-gray-700 ml-4">Horizontal line width. Default: 1</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">verticalLineWidth?: number</dt>
                <dd className="text-gray-700 ml-4">Vertical line width. Default: 1</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">alignWithXAxisTicks?: boolean</dt>
                <dd className="text-gray-700 ml-4">Align vertical lines with X-axis ticks. Default: true</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">alignWithYAxisTicks?: boolean</dt>
                <dd className="text-gray-700 ml-4">Align horizontal lines with Y-axis ticks. Default: true</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">yTickCount?: number</dt>
                <dd className="text-gray-700 ml-4">
                  Number of horizontal lines when not aligned with axis. Default: 5
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Example</h4>
            <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
              {`<ChartGridLayer
  color="#e5e7eb"
  alignWithXAxisTicks={true}
  alignWithYAxisTicks={true}
/>`}
            </pre>
          </div>
        </div>

        {/* ChartCursorLayer */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">ChartCursorLayer</h3>
          <p className="text-gray-700 mb-4">
            Renders crosshair lines that follow the mouse/touch pointer and highlight nearby data points.
          </p>

          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">Props</h4>
            <dl className="space-y-3">
              <div>
                <dt className="font-mono text-sm text-blue-600">snapToDataPoints?: boolean</dt>
                <dd className="text-gray-700 ml-4">Snap cursor to nearest data point. Default: true</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">snapRadius?: number</dt>
                <dd className="text-gray-700 ml-4">Max distance in pixels to snap. Default: 50</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">snapAlongYAxis?: boolean</dt>
                <dd className="text-gray-700 ml-4">
                  Snap to individual points (true) or all points at X position (false). Default: false
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">showHoverPoints?: boolean</dt>
                <dd className="text-gray-700 ml-4">Highlight data points near cursor. Default: true</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">color?: string</dt>
                <dd className="text-gray-700 ml-4">Crosshair line color. Default: "#999999"</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">lineWidth?: number</dt>
                <dd className="text-gray-700 ml-4">Crosshair line width. Default: 1</dd>
              </div>
            </dl>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Example</h4>
            <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
              {`<ChartCursorLayer
  snapToDataPoints={true}
  snapRadius={50}
  showHoverPoints={true}
/>`}
            </pre>
          </div>
        </div>

        {/* ChartTooltipLayer */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">ChartTooltipLayer</h3>
          <p className="text-gray-700 mb-4">Displays a tooltip box showing values for data points near the cursor.</p>

          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">Props</h4>
            <dl className="space-y-3">
              <div>
                <dt className="font-mono text-sm text-blue-600">snapToDataPoints?: boolean</dt>
                <dd className="text-gray-700 ml-4">Snap tooltip to nearest data point. Default: true</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">snapRadius?: number</dt>
                <dd className="text-gray-700 ml-4">Max distance in pixels to snap. Default: 50</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">snapAlongYAxis?: boolean</dt>
                <dd className="text-gray-700 ml-4">
                  Show single point (true) or all series at X position (false). Default: false
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">seriesLabels?: Record&lt;string, string&gt;</dt>
                <dd className="text-gray-700 ml-4">
                  Custom labels for series keys (e.g., {`{ temp: "Temperature" }`}).
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">position?: "follow" | "fixed"</dt>
                <dd className="text-gray-700 ml-4">
                  Tooltip follows cursor or stays at fixed location. Default: "follow"
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">backgroundColor?: string</dt>
                <dd className="text-gray-700 ml-4">Tooltip background color. Default: "#ffffff"</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">borderColor?: string</dt>
                <dd className="text-gray-700 ml-4">Tooltip border color. Default: "#e5e7eb"</dd>
              </div>
            </dl>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Example</h4>
            <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
              {`<ChartTooltipLayer
  snapToDataPoints={true}
  seriesLabels={{ temp: "Temperature", hum: "Humidity" }}
  position="follow"
/>`}
            </pre>
          </div>
        </div>

        {/* ChartTitleLayer */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">ChartTitleLayer</h3>
          <p className="text-gray-700 mb-4">Renders a title text at the top or bottom of the chart.</p>

          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">Props</h4>
            <dl className="space-y-3">
              <div>
                <dt className="font-mono text-sm text-blue-600">title: string (required)</dt>
                <dd className="text-gray-700 ml-4">The title text to display.</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">position?: "top" | "bottom"</dt>
                <dd className="text-gray-700 ml-4">Title placement. Default: "top"</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">fontSize?: number</dt>
                <dd className="text-gray-700 ml-4">Font size in pixels. Default: 18</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">color?: string</dt>
                <dd className="text-gray-700 ml-4">Text color. Default: "#000000"</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">marginTop?: number</dt>
                <dd className="text-gray-700 ml-4">Top margin in pixels. Default: 20</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">marginBottom?: number</dt>
                <dd className="text-gray-700 ml-4">Bottom margin in pixels. Default: 20</dd>
              </div>
            </dl>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Example</h4>
            <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
              {`<ChartTitleLayer
  title="Temperature Over Time"
  position="top"
  fontSize={20}
/>`}
            </pre>
          </div>
        </div>

        {/* ChartValueLabels */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">ChartValueLabels</h3>
          <p className="text-gray-700 mb-4">Renders value labels directly on or near data points.</p>

          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">Props</h4>
            <dl className="space-y-3">
              <div>
                <dt className="font-mono text-sm text-blue-600">dataKey: string (required)</dt>
                <dd className="text-gray-700 ml-4">The Y-value property name to label.</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">offsetX?: number</dt>
                <dd className="text-gray-700 ml-4">Horizontal offset from point. Default: 0</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">offsetY?: number</dt>
                <dd className="text-gray-700 ml-4">Vertical offset from point. Default: -10</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">fontSize?: number</dt>
                <dd className="text-gray-700 ml-4">Label font size. Default: 10</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">color?: string</dt>
                <dd className="text-gray-700 ml-4">Label text color. Default: "#666666"</dd>
              </div>
            </dl>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Example</h4>
            <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
              {`<ChartValueLabels
  dataKey="temperature"
  offsetY={-15}
  fontSize={11}
/>`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}
