export function ToolbarSection() {
  return (
    <section id="toolbar" className="mb-12">
      <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">ChartToolbar</h2>
      <p className="text-gray-700 mb-6">
        The ChartToolbar component provides an interactive, customizable toolbar for charts. It supports toggle buttons,
        action buttons, icon rendering, drag-to-reposition, and hover visibility. Perfect for adding tools like zoom,
        pan, reset, or custom annotation tools.
      </p>

      {/* Basic Props */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-3">Props</h3>
        <div className="bg-gray-50 p-6 rounded-lg">
          <dl className="space-y-3">
            <div>
              <dt className="font-mono text-sm text-blue-600">tools: ChartToolbarTool[] (required)</dt>
              <dd className="text-gray-700 ml-4">
                Array of tool definitions. Each tool has: id, label, icon (ReactNode), tooltip, type ('toggle' |
                'action')
              </dd>
            </div>
            <div>
              <dt className="font-mono text-sm text-blue-600">position?: ChartToolbarPosition</dt>
              <dd className="text-gray-700 ml-4">
                Position using top/right/bottom/left pixels (e.g., {`{ top: 16, left: 16 }`}). Default:{' '}
                {`{ top: 16, left: 16 }`}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-sm text-blue-600">activeToolIds?: string[]</dt>
              <dd className="text-gray-700 ml-4">Controlled mode: array of currently active tool IDs</dd>
            </div>
            <div>
              <dt className="font-mono text-sm text-blue-600">defaultActiveToolIds?: string[]</dt>
              <dd className="text-gray-700 ml-4">Uncontrolled mode: initial active tool IDs</dd>
            </div>
            <div>
              <dt className="font-mono text-sm text-blue-600">
                onToggle?: (tool: ChartToolbarTool, isActive: boolean, nextActiveIds: string[]) =&gt; void
              </dt>
              <dd className="text-gray-700 ml-4">Callback when a tool is toggled or clicked</dd>
            </div>
            <div>
              <dt className="font-mono text-sm text-blue-600">multiSelect?: boolean</dt>
              <dd className="text-gray-700 ml-4">
                Allow multiple toggle tools to be active simultaneously. Default: true
              </dd>
            </div>
            <div>
              <dt className="font-mono text-sm text-blue-600">visibility?: "always" | "hover"</dt>
              <dd className="text-gray-700 ml-4">Show toolbar always or only on chart hover. Default: "always"</dd>
            </div>
            <div>
              <dt className="font-mono text-sm text-blue-600">moveable?: boolean</dt>
              <dd className="text-gray-700 ml-4">Enable drag-to-reposition the toolbar. Default: false</dd>
            </div>
            <div>
              <dt className="font-mono text-sm text-blue-600">
                onPositionChange?: (position: ChartToolbarPosition) =&gt; void
              </dt>
              <dd className="text-gray-700 ml-4">Callback when position changes (drag or window resize)</dd>
            </div>
            <div>
              <dt className="font-mono text-sm text-blue-600">className?: string</dt>
              <dd className="text-gray-700 ml-4">Additional CSS classes for the toolbar container</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Basic Example */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-3">Basic Example</h3>
        <p className="text-gray-700 mb-4">Simple toolbar with zoom and reset tools:</p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
            {`import { ChartToolbar } from 'react-canvas-charts';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const tools = [
  { 
    id: 'zoom-in', 
    label: 'Zoom In', 
    icon: <ZoomIn size={16} />,
    type: 'action',
    tooltip: 'Zoom in on the chart'
  },
  { 
    id: 'zoom-out', 
    label: 'Zoom Out', 
    icon: <ZoomOut size={16} />,
    type: 'action',
    tooltip: 'Zoom out of the chart'
  },
  { 
    id: 'reset', 
    label: 'Reset', 
    icon: <RotateCcw size={16} />,
    type: 'action',
    tooltip: 'Reset zoom and pan'
  }
];

<ChartToolbar
  tools={tools}
  position={{ top: 16, right: 16 }}
  onToggle={(tool) => {
    if (tool.id === 'zoom-in') handleZoomIn();
    if (tool.id === 'zoom-out') handleZoomOut();
    if (tool.id === 'reset') handleReset();
  }}
/>`}
          </pre>
        </div>
      </div>

      {/* Toggle Tools */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-3">Toggle Tools</h3>
        <p className="text-gray-700 mb-4">
          Toggle tools remain active when clicked and show a highlighted state. Use for mode-based interactions:
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
            {`import { Move, Hand } from 'lucide-react';

const [activeTools, setActiveTools] = useState<string[]>([]);

const tools = [
  { 
    id: 'pan', 
    label: 'Pan', 
    icon: <Hand size={16} />,
    type: 'toggle',
    tooltip: 'Pan the chart'
  },
  { 
    id: 'select', 
    label: 'Select', 
    icon: <Move size={16} />,
    type: 'toggle',
    tooltip: 'Select data range'
  }
];

<ChartToolbar
  tools={tools}
  activeToolIds={activeTools}
  onToggle={(tool, isActive, nextActiveIds) => {
    setActiveTools(nextActiveIds);
    console.log(\`\${tool.label} is now \${isActive ? 'active' : 'inactive'}\`);
  }}
  multiSelect={false}  // Only one tool can be active at a time
/>`}
          </pre>
        </div>
      </div>

      {/* Annotation Toolbar */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-3">Annotation Toolbar</h3>
        <p className="text-gray-700 mb-4">
          Complete example of using ChartToolbar with annotations. This pattern is ideal for drawing tools:
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
            {`import { Type, Minus, Circle, Pencil, Trash2 } from 'lucide-react';

const [annotations, setAnnotations] = useState<ChartAnnotation[]>([]);
const [activeTools, setActiveTools] = useState<string[]>([]);

const annotationTools = [
  { 
    id: 'text', 
    label: 'Text', 
    icon: <Type size={16} />,
    type: 'toggle',
    tooltip: 'Add text annotation'
  },
  { 
    id: 'line', 
    label: 'Line', 
    icon: <Minus size={16} />,
    type: 'toggle',
    tooltip: 'Draw line annotation'
  },
  { 
    id: 'circle', 
    label: 'Circle', 
    icon: <Circle size={16} />,
    type: 'toggle',
    tooltip: 'Draw circle annotation'
  },
  { 
    id: 'freehand', 
    label: 'Draw', 
    icon: <Pencil size={16} />,
    type: 'toggle',
    tooltip: 'Freehand drawing'
  },
  { 
    id: 'clear', 
    label: 'Clear All', 
    icon: <Trash2 size={16} />,
    type: 'action',
    tooltip: 'Clear all annotations'
  }
];

// Get the active annotation type (first active tool)
const creatingType = activeTools[0] as AnnotationType | undefined;

<ChartSurface data={data} xKey="x" yKeys={['value']}>
  <ChartLineSeries dataKey="value" />
  
  {/* Toolbar for selecting annotation type */}
  <ChartToolbar
    tools={annotationTools}
    activeToolIds={activeTools}
    onToggle={(tool, isActive, nextActiveIds) => {
      if (tool.id === 'clear') {
        setAnnotations([]);
        return;
      }
      setActiveTools(nextActiveIds);
    }}
    multiSelect={false}  // Only one annotation type at a time
    position={{ top: 16, left: 16 }}
    visibility="always"
  />
  
  {/* Annotation layer that responds to toolbar selection */}
  <ChartAnnotationsLayer
    annotations={annotations}
    onAnnotationsChange={setAnnotations}
    creatingType={creatingType}
    onAnnotationComplete={(annotation) => {
      setAnnotations([...annotations, annotation]);
      setActiveTools([]);  // Deselect tool after creation
    }}
  />
</ChartSurface>`}
          </pre>
        </div>
      </div>

      {/* Moveable Toolbar */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-3">Moveable Toolbar</h3>
        <p className="text-gray-700 mb-4">Enable drag-to-reposition and persist the position:</p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
            {`const [toolbarPosition, setToolbarPosition] = useState({ top: 16, left: 16 });

<ChartToolbar
  tools={tools}
  position={toolbarPosition}
  onPositionChange={(newPosition) => {
    setToolbarPosition(newPosition);
    // Optionally save to localStorage
    localStorage.setItem('toolbarPosition', JSON.stringify(newPosition));
  }}
  moveable={true}
/>`}
          </pre>
        </div>
      </div>

      {/* Hover Visibility */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-3">Hover-Only Visibility</h3>
        <p className="text-gray-700 mb-4">Hide the toolbar until the user hovers over the chart:</p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
            {`<ChartToolbar
  tools={tools}
  visibility="hover"
  position={{ top: 16, right: 16 }}
/>`}
          </pre>
        </div>
      </div>

      {/* Tool Definition Interface */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-3">ChartToolbarTool Interface</h3>
        <div className="bg-gray-50 p-6 rounded-lg">
          <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
            {`interface ChartToolbarTool {
  id: string;                    // Unique identifier
  label: string;                 // Display label
  icon?: React.ReactNode;        // Icon element (e.g., from lucide-react)
  type?: 'toggle' | 'action';    // Toggle stays active, action fires once
  tooltip?: string;              // Hover tooltip text
  disabled?: boolean;            // Disable the tool
  className?: string;            // Custom CSS class for the button
}`}
          </pre>
        </div>
      </div>

      {/* Positioning */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-3">Positioning</h3>
        <p className="text-gray-700 mb-4">
          Position the toolbar using top, right, bottom, or left (in pixels). You can specify any combination:
        </p>
        <div className="bg-gray-50 p-6 rounded-lg">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-mono text-blue-600">{`{ top: 16, left: 16 }`}</dt>
              <dd className="text-gray-700 ml-4">Top-left corner</dd>
            </div>
            <div>
              <dt className="font-mono text-blue-600">{`{ top: 16, right: 16 }`}</dt>
              <dd className="text-gray-700 ml-4">Top-right corner</dd>
            </div>
            <div>
              <dt className="font-mono text-blue-600">{`{ bottom: 16, left: 16 }`}</dt>
              <dd className="text-gray-700 ml-4">Bottom-left corner</dd>
            </div>
            <div>
              <dt className="font-mono text-blue-600">{`{ bottom: 16, right: 16 }`}</dt>
              <dd className="text-gray-700 ml-4">Bottom-right corner</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Best Practices */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-3">Best Practices</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>
            Use <code className="text-blue-600">type: 'action'</code> for one-time actions (zoom in, reset, export)
          </li>
          <li>
            Use <code className="text-blue-600">type: 'toggle'</code> for mode-based interactions (pan mode, select
            mode, annotation tools)
          </li>
          <li>
            Set <code className="text-blue-600">multiSelect: false</code> when only one tool should be active at a time
            (e.g., annotation tools)
          </li>
          <li>Use small icons (16x16 or 20x20) for better visual hierarchy</li>
          <li>Provide tooltips for better user experience</li>
          <li>
            Consider using <code className="text-blue-600">visibility: "hover"</code> for charts where the toolbar might
            obstruct data
          </li>
          <li>
            Enable <code className="text-blue-600">moveable: true</code> for power users who want to customize their
            workspace
          </li>
          <li>Group related tools together in the tools array (e.g., zoom tools, annotation tools)</li>
        </ul>
      </div>

      {/* Styling */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-3">Styling</h3>
        <p className="text-gray-700 mb-4">The toolbar uses CSS classes that can be customized:</p>
        <div className="bg-gray-50 p-6 rounded-lg">
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              <code className="text-blue-600">.chart-toolbar</code> - Main toolbar container
            </li>
            <li>
              <code className="text-blue-600">.chart-toolbar-button</code> - Individual tool buttons
            </li>
            <li>
              <code className="text-blue-600">.chart-toolbar-button.active</code> - Active toggle buttons
            </li>
            <li>
              <code className="text-blue-600">.chart-toolbar-button:hover</code> - Hover state
            </li>
            <li>
              <code className="text-blue-600">.chart-toolbar-button:disabled</code> - Disabled state
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
