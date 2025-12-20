export const GettingStarted = () => {
  return (
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
  )
}
