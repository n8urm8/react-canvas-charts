export function AnnotationsSection() {
  return (
    <section id="annotations" className="mb-12">
      <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">Annotations</h2>
      <p className="text-gray-700 mb-6">
        The annotations system provides interactive drawing and markup tools for charts. Users can add text labels,
        lines, circles, and freehand drawings to highlight or annotate data points and trends.
      </p>

      <div className="space-y-8">
        {/* ChartAnnotationsLayer */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">ChartAnnotationsLayer</h3>
          <p className="text-gray-700 mb-4">
            The main component that handles rendering and interaction for all annotation types. It manages creation,
            editing, and deletion of annotations through a toolbar interface.
          </p>

          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">Props</h4>
            <dl className="space-y-3">
              <div>
                <dt className="font-mono text-sm text-blue-600">annotations: ChartAnnotation[] (required)</dt>
                <dd className="text-gray-700 ml-4">
                  Array of annotation objects to display. Each annotation has a type, position, and styling properties.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">
                  onAnnotationsChange?: (annotations: ChartAnnotation[]) =&gt; void
                </dt>
                <dd className="text-gray-700 ml-4">
                  Callback when annotations are added, modified, or deleted. Updates the annotations array.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">creatingType?: AnnotationType</dt>
                <dd className="text-gray-700 ml-4">
                  The type of annotation currently being created ('text', 'line', 'circle', or 'freehand'). When set,
                  the layer enters creation mode.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">
                  onAnnotationCreate?: (annotation: Partial&lt;ChartAnnotation&gt;) =&gt; void
                </dt>
                <dd className="text-gray-700 ml-4">
                  Callback fired during annotation creation with partial data (as the user is drawing).
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">
                  onAnnotationComplete?: (annotation: ChartAnnotation) =&gt; void
                </dt>
                <dd className="text-gray-700 ml-4">
                  Callback when annotation creation is finished with the complete annotation object.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-sm text-blue-600">enableCreation?: boolean</dt>
                <dd className="text-gray-700 ml-4">Enable or disable annotation creation. Default: true</dd>
              </div>
            </dl>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold mb-2">Basic Example</h4>
            <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
              {`const [annotations, setAnnotations] = useState<ChartAnnotation[]>([]);
const [creatingType, setCreatingType] = useState<AnnotationType | null>(null);

<ChartSurface data={data} xKey="time" yKeys={['value']}>
  <ChartLineSeries dataKey="value" />
  <ChartXAxis />
  <ChartYAxis />
  
  <ChartAnnotationsLayer
    annotations={annotations}
    onAnnotationsChange={setAnnotations}
    creatingType={creatingType ?? undefined}
    onAnnotationComplete={(annotation) => {
      setAnnotations([...annotations, annotation]);
      setCreatingType(null);
    }}
  />
</ChartSurface>`}
            </pre>
          </div>
        </div>

        {/* Annotation Types */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">Annotation Types</h3>
          <p className="text-gray-700 mb-4">
            Four annotation types are supported, each with unique properties and interaction patterns.
          </p>

          {/* Text Annotation */}
          <div className="mb-6">
            <h4 className="text-xl font-semibold mb-2">TextAnnotation</h4>
            <p className="text-gray-700 mb-3">
              Click-to-place text labels with customizable font, color, and background. Editable after placement with
              a rich text editor.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold mb-2">Properties</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <code className="text-blue-600">position: AnnotationCoordinate</code> - X/Y position in data or
                  pixel space
                </li>
                <li>
                  <code className="text-blue-600">text: string</code> - The text content to display
                </li>
                <li>
                  <code className="text-blue-600">fontSize?: number</code> - Font size in pixels (default: 14)
                </li>
                <li>
                  <code className="text-blue-600">fontWeight?: 'normal' | 'bold'</code> - Font weight (default:
                  'normal')
                </li>
                <li>
                  <code className="text-blue-600">color?: string</code> - Text color (default: '#000000')
                </li>
                <li>
                  <code className="text-blue-600">backgroundColor?: string</code> - Optional background color
                </li>
                <li>
                  <code className="text-blue-600">padding?: number</code> - Padding around text in pixels
                </li>
              </ul>
              <div className="mt-3">
                <h5 className="font-semibold mb-2">Example</h5>
                <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
                  {`{
  id: 'text-1',
  type: 'text',
  position: { x: 10, y: 50, dataSpace: true },
  text: 'Important peak',
  fontSize: 16,
  fontWeight: 'bold',
  color: '#ef4444',
  backgroundColor: '#fef2f2',
  padding: 8
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Line Annotation */}
          <div className="mb-6">
            <h4 className="text-xl font-semibold mb-2">LineAnnotation</h4>
            <p className="text-gray-700 mb-3">
              Click-and-drag to create lines between two points. Supports arrows on either or both ends, custom dash
              patterns, and stroke width.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold mb-2">Properties</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <code className="text-blue-600">start: AnnotationCoordinate</code> - Starting point
                </li>
                <li>
                  <code className="text-blue-600">end: AnnotationCoordinate</code> - Ending point
                </li>
                <li>
                  <code className="text-blue-600">strokeWidth?: number</code> - Line thickness (default: 2)
                </li>
                <li>
                  <code className="text-blue-600">color?: string</code> - Line color (default: '#000000')
                </li>
                <li>
                  <code className="text-blue-600">dash?: number[]</code> - Dash pattern (e.g., [5, 5] for dashed)
                </li>
                <li>
                  <code className="text-blue-600">arrowStart?: boolean</code> - Show arrow at start (default: false)
                </li>
                <li>
                  <code className="text-blue-600">arrowEnd?: boolean</code> - Show arrow at end (default: false)
                </li>
              </ul>
              <div className="mt-3">
                <h5 className="font-semibold mb-2">Example</h5>
                <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
                  {`{
  id: 'line-1',
  type: 'line',
  start: { x: 5, y: 30, dataSpace: true },
  end: { x: 15, y: 60, dataSpace: true },
  strokeWidth: 3,
  color: '#3b82f6',
  arrowEnd: true,
  dash: [5, 3]
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Circle Annotation */}
          <div className="mb-6">
            <h4 className="text-xl font-semibold mb-2">CircleAnnotation</h4>
            <p className="text-gray-700 mb-3">
              Click-and-drag from center to create circles. Useful for highlighting regions or data clusters.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold mb-2">Properties</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <code className="text-blue-600">center: AnnotationCoordinate</code> - Center point of circle
                </li>
                <li>
                  <code className="text-blue-600">radius: number</code> - Radius in pixels
                </li>
                <li>
                  <code className="text-blue-600">strokeWidth?: number</code> - Border thickness (default: 2)
                </li>
                <li>
                  <code className="text-blue-600">color?: string</code> - Border color (default: '#000000')
                </li>
                <li>
                  <code className="text-blue-600">fillColor?: string</code> - Optional fill color
                </li>
                <li>
                  <code className="text-blue-600">fillOpacity?: number</code> - Fill opacity 0-1 (default: 0.2)
                </li>
              </ul>
              <div className="mt-3">
                <h5 className="font-semibold mb-2">Example</h5>
                <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
                  {`{
  id: 'circle-1',
  type: 'circle',
  center: { x: 20, y: 45, dataSpace: true },
  radius: 30,
  strokeWidth: 2,
  color: '#10b981',
  fillColor: '#10b981',
  fillOpacity: 0.1
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Freehand Annotation */}
          <div className="mb-6">
            <h4 className="text-xl font-semibold mb-2">FreehandAnnotation</h4>
            <p className="text-gray-700 mb-3">
              Click-and-drag to draw freehand paths. Captures all mouse movements for custom shapes and sketches.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold mb-2">Properties</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <code className="text-blue-600">points: AnnotationCoordinate[]</code> - Array of points along the
                  path
                </li>
                <li>
                  <code className="text-blue-600">strokeWidth?: number</code> - Line thickness (default: 2)
                </li>
                <li>
                  <code className="text-blue-600">color?: string</code> - Line color (default: '#000000')
                </li>
                <li>
                  <code className="text-blue-600">closed?: boolean</code> - Connect last point to first (default:
                  false)
                </li>
                <li>
                  <code className="text-blue-600">smoothing?: number</code> - Path smoothing factor 0-1 (not yet
                  implemented)
                </li>
              </ul>
              <div className="mt-3">
                <h5 className="font-semibold mb-2">Example</h5>
                <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
                  {`{
  id: 'freehand-1',
  type: 'freehand',
  points: [
    { x: 10, y: 30, dataSpace: true },
    { x: 12, y: 32, dataSpace: true },
    { x: 15, y: 35, dataSpace: true },
    // ... many points
  ],
  strokeWidth: 2,
  color: '#8b5cf6'
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Coordinate System */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">Coordinate System</h3>
          <p className="text-gray-700 mb-4">
            Annotations support both data space and pixel space coordinates through the{' '}
            <code className="text-blue-600">AnnotationCoordinate</code> interface.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
              {`interface AnnotationCoordinate {
  x: number;  // Data index or pixel X
  y: number;  // Data value or pixel Y
  dataSpace?: boolean;  // true = data coordinates, false/undefined = pixel coordinates
}

// Data space example (follows chart zoom/pan)
{ x: 10, y: 50, dataSpace: true }

// Pixel space example (fixed position)
{ x: 100, y: 200, dataSpace: false }`}
            </pre>
          </div>
        </div>

        {/* Editing and Interaction */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">Editing and Interaction</h3>
          <p className="text-gray-700 mb-4">
            All annotations can be edited after creation. Hover over an annotation to see its toolbar with styling
            controls:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>
              <strong>Text annotations:</strong> Click to open text editor with font size, bold, and color controls
            </li>
            <li>
              <strong>Geometric annotations (line/circle/freehand):</strong> Hover to see drag handles and toolbar
              with stroke width, color, and delete options
            </li>
            <li>
              <strong>Line annotations:</strong> Additional arrow toggle buttons for start and end arrows
            </li>
            <li>
              <strong>Drag handles:</strong> Drag endpoints (line), center/edge (circle), or move entire annotation
            </li>
          </ul>
        </div>

        {/* Toolbar Integration */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">Toolbar Integration</h3>
          <p className="text-gray-700 mb-4">
            Use ChartToolbar with annotation tools to control the creation mode:
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
              {`const annotationTools: ChartToolbarTool[] = [
  { id: 'text', label: 'Text', icon: <Type size={16} />, type: 'toggle' },
  { id: 'line', label: 'Line', icon: <Minus size={16} />, type: 'toggle' },
  { id: 'circle', label: 'Circle', icon: <Circle size={16} />, type: 'toggle' },
  { id: 'freehand', label: 'Draw', icon: <Pencil size={16} />, type: 'toggle' }
];

const [activeTools, setActiveTools] = useState<string[]>([]);
const creatingType = activeTools[0] as AnnotationType | undefined;

<ChartToolbar
  tools={annotationTools}
  activeToolIds={activeTools}
  onToggle={(tool, isActive, nextActiveIds) => {
    setActiveTools(nextActiveIds);
  }}
  multiSelect={false}
/>

<ChartAnnotationsLayer
  annotations={annotations}
  onAnnotationsChange={setAnnotations}
  creatingType={creatingType}
/>`}
            </pre>
          </div>
        </div>

        {/* Best Practices */}
        <div>
          <h3 className="text-2xl font-semibold mb-3">Best Practices</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              Store annotations in component state or external state management (Redux, Zustand, etc.) for
              persistence
            </li>
            <li>Use data space coordinates when annotations should follow chart zoom/pan transformations</li>
            <li>Use pixel space coordinates for fixed overlay elements that shouldn't move with the chart</li>
            <li>
              Debouncing is automatically applied to color picker changes to prevent excessive redraws (150ms delay)
            </li>
            <li>The annotation canvas is separate from the base chart layer to optimize rendering performance</li>
            <li>
              Only enable one annotation tool at a time by setting <code>multiSelect={`{false}`}</code> on
              ChartToolbar
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
