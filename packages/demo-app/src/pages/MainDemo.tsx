export const MainDemo = () => {
  return (
    <div className="flex min-h-screen">
      {/* Side Navigation */}
      <nav className="w-64 bg-gray-50 border-r border-gray-200 p-6 sticky top-0 h-screen overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Navigation</h2>
        <ul className="space-y-3">
          <li>
            <a href="#getting-started" className="text-blue-600 hover:text-blue-800 hover:underline block">
              Getting Started
            </a>
            <span className="text-xs text-gray-500 block mt-1">Installation & basic example</span>
          </li>
          <li>
            <a href="#chart-surface" className="text-blue-600 hover:text-blue-800 hover:underline block">
              ChartSurface
            </a>
            <span className="text-xs text-gray-500 block mt-1">Core chart container</span>
          </li>
          <li>
            <a href="#series" className="text-blue-600 hover:text-blue-800 hover:underline block">
              Series Components
            </a>
            <span className="text-xs text-gray-500 block mt-1">Line, Area, and Point</span>
          </li>
          <li>
            <a href="#axes" className="text-blue-600 hover:text-blue-800 hover:underline block">
              Axes
            </a>
            <span className="text-xs text-gray-500 block mt-1">X and Y axis components</span>
          </li>
          <li>
            <a href="#layers" className="text-blue-600 hover:text-blue-800 hover:underline block">
              Layers
            </a>
            <span className="text-xs text-gray-500 block mt-1">Grid, Cursor, Tooltip, etc.</span>
          </li>
          <li>
            <a href="#controls" className="text-blue-600 hover:text-blue-800 hover:underline block">
              Controls
            </a>
            <span className="text-xs text-gray-500 block mt-1">Legend and Toolbar</span>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-5xl p-8">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">React Canvas Charts API Documentation</h1>
          <p className="text-lg text-gray-600">
            High-performance canvas-based charting components for React applications. Built with TypeScript and
            optimized for real-time data visualization.
          </p>
          <p className="text-gray-600 mt-2">
            I was heavily inspired by{' '}
            <a href="https://recharts.github.io/" className="text-blue-600 hover:underline">
              Recharts
            </a>{' '}
            when designing the API for this library. I loved how that library made it so easy to create complex charts
            with a simple and componentized API, but I wanted to build something that could handle larger datasets and
            more frequent updates without sacrificing performance, so I am attempting something similar using the
            Canvas. This library is still in early development, and right now really only focuses on the line chart, but
            includes area series and point series. Also, I wanted to build in some early tools for interacting with the
            chart. Check out the interactive chart page shows off most of the components and how to edit them to change
            the chart. It also includes a live-updated code preview of the chart.
          </p>
        </header>

        {/* Getting Started */}
        <section id="getting-started" className="mb-12">
          <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">Getting Started</h2>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Installation</h3>
            <p className="text-gray-700 mb-3">Install the package using npm, pnpm, or yarn:</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code>npm i react-canvas-charts</code>
            </pre>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Basic Example</h3>
            <p className="text-gray-700 mb-3">Here's a simple line chart to get you started:</p>
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              {`import { 
  ChartSurface, 
  ChartLineSeries, 
  ChartXAxis, 
  ChartYAxis,
  ChartGridLayer 
} from 'react-canvas-charts';

function MyChart() {
  const data = [
    { x: 0, temperature: 20 },
    { x: 1, temperature: 22 },
    { x: 2, temperature: 21 },
    { x: 3, temperature: 25 },
    { x: 4, temperature: 24 },
    { x: 5, temperature: 26 }
  ];

  return (
    <ChartSurface
      data={data}
      xKey="x"
      width={600}
      height={300}
      margin={60}
    >
      <ChartGridLayer />
      <ChartLineSeries dataKey="temperature" color="#3b82f6" />
      <ChartXAxis position="bottom" />
      <ChartYAxis side="left" />
    </ChartSurface>
  );
}`}
            </pre>
          </div>
        </section>

        {/* ChartSurface */}
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

        {/* Series Components */}
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

        {/* Axes */}
        <section id="axes" className="mb-12">
          <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">Axes</h2>

          <div className="space-y-8">
            {/* ChartXAxis */}
            <div>
              <h3 className="text-2xl font-semibold mb-3">ChartXAxis</h3>
              <p className="text-gray-700 mb-4">Renders the horizontal axis with labels and tick marks.</p>

              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                <h4 className="font-semibold mb-3">Props</h4>
                <dl className="space-y-3">
                  <div>
                    <dt className="font-mono text-sm text-blue-600">position?: "bottom" | "top"</dt>
                    <dd className="text-gray-700 ml-4">Axis placement. Default: "bottom"</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">title?: string</dt>
                    <dd className="text-gray-700 ml-4">Axis label text.</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">tickStep?: number</dt>
                    <dd className="text-gray-700 ml-4">Show every Nth tick. Default: 1</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">maxTicks?: number</dt>
                    <dd className="text-gray-700 ml-4">
                      Maximum number of ticks to display. Auto-calculates step if needed.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">labelRotation?: number</dt>
                    <dd className="text-gray-700 ml-4">
                      Rotate labels by degrees (e.g., -45 for diagonal). Default: 0
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">labelOffsetY?: number</dt>
                    <dd className="text-gray-700 ml-4">Vertical offset for label positioning. Default: 0</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">fontSize?: number</dt>
                    <dd className="text-gray-700 ml-4">Label font size. Default: 12</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">color?: string</dt>
                    <dd className="text-gray-700 ml-4">Axis and label color. Default: "#000000"</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Example</h4>
                <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
                  {`<ChartXAxis
  position="bottom"
  title="Time"
  maxTicks={10}
  labelRotation={-45}
/>`}
                </pre>
              </div>
            </div>

            {/* ChartYAxis */}
            <div>
              <h3 className="text-2xl font-semibold mb-3">ChartYAxis</h3>
              <p className="text-gray-700 mb-4">
                Renders the vertical axis with value labels and tick marks. Supports multiple axes on left and right
                sides.
              </p>

              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                <h4 className="font-semibold mb-3">Props</h4>
                <dl className="space-y-3">
                  <div>
                    <dt className="font-mono text-sm text-blue-600">side?: "left" | "right"</dt>
                    <dd className="text-gray-700 ml-4">Which side to place the axis. Default: "left"</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">scaleId?: string</dt>
                    <dd className="text-gray-700 ml-4">ID of the value scale to use. Defaults to the primary scale.</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">title?: string</dt>
                    <dd className="text-gray-700 ml-4">Axis label text.</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">tickCount?: number</dt>
                    <dd className="text-gray-700 ml-4">Number of tick marks to display. Default: 5</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">formatLabel?: (value: number) =&gt; string</dt>
                    <dd className="text-gray-700 ml-4">Custom formatter for tick labels.</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">fontSize?: number</dt>
                    <dd className="text-gray-700 ml-4">Label font size. Default: 12</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">color?: string</dt>
                    <dd className="text-gray-700 ml-4">Axis and label color. Default: "#000000"</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Example</h4>
                <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
                  {`<ChartYAxis
  side="left"
  title="Temperature (°C)"
  tickCount={8}
  formatLabel={(val) => \`\${val.toFixed(1)}°\`}
/>`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Layers */}
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
              <p className="text-gray-700 mb-4">
                Displays a tooltip box showing values for data points near the cursor.
              </p>

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

        {/* Controls */}
        <section id="controls" className="mb-12">
          <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">Control Components</h2>

          <div className="space-y-8">
            {/* ChartLegend */}
            <div>
              <h3 className="text-2xl font-semibold mb-3">ChartLegend</h3>
              <p className="text-gray-700 mb-4">
                Displays a legend identifying each series with a color marker and label. Rendered as a DOM overlay (not
                canvas).
              </p>

              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                <h4 className="font-semibold mb-3">Props</h4>
                <dl className="space-y-3">
                  <div>
                    <dt className="font-mono text-sm text-blue-600">placement?: ChartLegendPlacement</dt>
                    <dd className="text-gray-700 ml-4">
                      Position using anchor (e.g., "top-right") or custom coordinates.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">items?: ChartLegendItem[]</dt>
                    <dd className="text-gray-700 ml-4">Custom legend items. Auto-generated from yKeys if omitted.</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">layout?: "horizontal" | "vertical"</dt>
                    <dd className="text-gray-700 ml-4">Arrangement of legend entries. Default: "horizontal"</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">title?: string</dt>
                    <dd className="text-gray-700 ml-4">Legend title text.</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">markerSize?: number</dt>
                    <dd className="text-gray-700 ml-4">Color marker size in pixels. Default: 12</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">className?: string</dt>
                    <dd className="text-gray-700 ml-4">Additional CSS classes for the container.</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Example</h4>
                <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
                  {`<ChartLegend
  placement={{ mode: "anchor", position: "top-right" }}
  layout="vertical"
  title="Sensors"
/>`}
                </pre>
              </div>
            </div>

            {/* ChartToolbar */}
            <div>
              <h3 className="text-2xl font-semibold mb-3">ChartToolbar</h3>
              <p className="text-gray-700 mb-4">
                Displays interactive tool buttons (e.g., zoom, pan, reset). Rendered as a DOM overlay with optional
                drag-to-reposition.
              </p>

              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                <h4 className="font-semibold mb-3">Props</h4>
                <dl className="space-y-3">
                  <div>
                    <dt className="font-mono text-sm text-blue-600">tools: ChartToolbarTool[] (required)</dt>
                    <dd className="text-gray-700 ml-4">
                      Array of tool definitions with id, label, icon, tooltip, etc.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">position?: ChartToolbarPosition</dt>
                    <dd className="text-gray-700 ml-4">
                      Positioning with top/right/bottom/left (e.g., {`{ top: 16, left: 16 }`}).
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">activeToolIds?: string[]</dt>
                    <dd className="text-gray-700 ml-4">Controlled active tool IDs.</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">defaultActiveToolIds?: string[]</dt>
                    <dd className="text-gray-700 ml-4">Initial active tools (uncontrolled mode).</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">
                      onToggle?: (tool, isActive, nextActiveIds) =&gt; void
                    </dt>
                    <dd className="text-gray-700 ml-4">Callback when tool is toggled.</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">multiSelect?: boolean</dt>
                    <dd className="text-gray-700 ml-4">Allow multiple tools to be active. Default: true</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">visibility?: "always" | "hover"</dt>
                    <dd className="text-gray-700 ml-4">Show toolbar always or only on hover. Default: "always"</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">moveable?: boolean</dt>
                    <dd className="text-gray-700 ml-4">Enable drag-to-reposition. Default: false</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-sm text-blue-600">onPositionChange?: (position) =&gt; void</dt>
                    <dd className="text-gray-700 ml-4">Callback when position changes (drag or resize).</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Example</h4>
                <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
                  {`<ChartToolbar
  tools={[
    { id: "zoom-in", label: "Zoom In" },
    { id: "zoom-out", label: "Zoom Out" },
    { id: "reset", label: "Reset" }
  ]}
  position={{ top: 16, left: 16 }}
  moveable={true}
  visibility="hover"
  onToggle={(tool, isActive) => {
    console.log(\`\${tool.id} is now \${isActive ? 'active' : 'inactive'}\`);
  }}
/>`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t-2 border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Additional Resources</h2>
          <ul className="space-y-2 text-gray-700">
            <li>
              <a href="/interactive-chart" className="text-blue-600 hover:underline">
                Interactive Chart Demo
              </a>
              {' - '}Explore all features with live configuration
            </li>
            <li>
              <a
                href="https://github.com/n8urm8/react-canvas-charts"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Repository
              </a>
              {' - '}Source code and examples
            </li>
          </ul>

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold mb-2">Note on Bar Charts</h3>
            <p className="text-gray-700">
              Bar chart components are currently under development and not included in this documentation. Please use
              the line, area, and point series components for production applications.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
