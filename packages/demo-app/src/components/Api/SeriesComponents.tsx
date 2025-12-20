export const SeriesComponents = () => {
  return (
    <section id="series" className="mb-12">
      <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">Series Components</h2>

      <div className="space-y-8">
        {/* ChartLineSeries */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">ChartLineSeries</h3>
          <p className="text-gray-700 mb-4">
            Renders a line connecting data points. Supports customizable stroke, smoothing, and dash patterns.
          </p>

          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">Props</h4>
            <dl className="space-y-3">
              <div>
                <dt className="font-mono text-sm text-blue-600">dataKey: string (required)</dt>
                <dd className="text-gray-700 ml-4">The Y-value property name from the data objects.</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">color?: string</dt>
                <dd className="text-gray-700 ml-4">Line stroke color. Falls back to ChartSurface color mapping.</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">width?: number</dt>
                <dd className="text-gray-700 ml-4">Line stroke width in pixels. Default: 2</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">smooth?: boolean</dt>
                <dd className="text-gray-700 ml-4">
                  Use Catmull-Rom spline interpolation for smooth curves. Default: false
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">dash?: number[]</dt>
                <dd className="text-gray-700 ml-4">Line dash pattern (e.g., [5, 5] for dashed line).</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">seriesIndex?: number</dt>
                <dd className="text-gray-700 ml-4">
                  Index for tracking multiple series. Used in cursor/tooltip logic.
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Example</h4>
            <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
              {`<ChartLineSeries
  dataKey="temperature"
  color="#3b82f6"
  width={2}
  smooth={true}
/>`}
            </pre>
          </div>
        </div>

        {/* ChartAreaSeries */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">ChartAreaSeries</h3>
          <p className="text-gray-700 mb-4">
            Renders a filled area under a line series. Useful for visualizing cumulative values or ranges.
          </p>

          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">Props</h4>
            <dl className="space-y-3">
              <div>
                <dt className="font-mono text-sm text-blue-600">dataKey: string (required)</dt>
                <dd className="text-gray-700 ml-4">The Y-value property name from the data objects.</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">color?: string</dt>
                <dd className="text-gray-700 ml-4">Fill color. Falls back to ChartSurface color mapping.</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">opacity?: number</dt>
                <dd className="text-gray-700 ml-4">Fill opacity (0-1). Default: 0.1</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">show?: boolean</dt>
                <dd className="text-gray-700 ml-4">Toggle visibility. Default: true</dd>
              </div>
            </dl>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Example</h4>
            <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
              {`<ChartAreaSeries
  dataKey="temperature"
  color="#3b82f6"
  opacity={0.2}
/>`}
            </pre>
          </div>
        </div>

        {/* ChartPointSeries */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">ChartPointSeries</h3>
          <p className="text-gray-700 mb-4">
            Renders individual data points as shapes (circles, squares, triangles, etc.).
          </p>

          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">Props</h4>
            <dl className="space-y-3">
              <div>
                <dt className="font-mono text-sm text-blue-600">dataKey: string (required)</dt>
                <dd className="text-gray-700 ml-4">The Y-value property name from the data objects.</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">color?: string</dt>
                <dd className="text-gray-700 ml-4">Point stroke color.</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">fillColor?: string</dt>
                <dd className="text-gray-700 ml-4">Point fill color. Defaults to stroke color.</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">size?: number</dt>
                <dd className="text-gray-700 ml-4">Point radius in pixels. Default: 4</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">
                  shape?: "circle" | "square" | "triangle" | "diamond" | "cross" | "x"
                </dt>
                <dd className="text-gray-700 ml-4">Point shape. Default: "circle"</dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">strokeWidth?: number</dt>
                <dd className="text-gray-700 ml-4">Stroke width for outlined points. Default: 2</dd>
              </div>
            </dl>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Example</h4>
            <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
              {`<ChartPointSeries
  dataKey="temperature"
  color="#3b82f6"
  fillColor="#ffffff"
  size={6}
  shape="circle"
/>`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}
