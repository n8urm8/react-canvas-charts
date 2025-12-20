export const AxesSection = () => {
  return (
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
  )
}
