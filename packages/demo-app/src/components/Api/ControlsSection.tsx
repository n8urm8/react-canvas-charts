export function ControlsSection() {
  return (
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
                <dd className="text-gray-700 ml-4">Position using anchor (e.g., "top-right") or custom coordinates.</dd>
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
                <dd className="text-gray-700 ml-4">Array of tool definitions with id, label, icon, tooltip, etc.</dd>
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
  )
}
