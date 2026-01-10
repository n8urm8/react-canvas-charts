import {
  GettingStarted,
  ChartSurfaceSection,
  SeriesComponents,
  AxesSection,
  LayersSection,
  ControlsSection,
  ToolbarSection,
  AnnotationsSection
} from '../components/Api'

export const MainDemo = () => {
  return (
    <div className="flex min-h-screen w-full">
      {/* Side Navigation */}
      <nav className="hidden lg:block w-64 bg-gray-50 border-r border-gray-200 p-6 sticky top-0 h-screen overflow-y-auto">
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
            <span className="text-xs text-gray-500 block mt-1">Core chart container & SparkSurface</span>
          </li>
          <li>
            <a href="#series" className="text-blue-600 hover:text-blue-800 hover:underline block">
              Series Components
            </a>
            <span className="text-xs text-gray-500 block mt-1">Line, Area, Point, and Bar series</span>
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
          <li>
            <a href="#toolbar" className="text-blue-600 hover:text-blue-800 hover:underline block">
              Toolbar
            </a>
            <span className="text-xs text-gray-500 block mt-1">Interactive tool buttons</span>
          </li>
          <li>
            <a href="#annotations" className="text-blue-600 hover:text-blue-800 hover:underline block">
              Annotations
            </a>
            <span className="text-xs text-gray-500 block mt-1">Interactive drawing tools</span>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="flex-1 w-full p-4 md:p-8">
        <header className="mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
            React Canvas Charts API Documentation
          </h1>
          <p className="text-base md:text-lg text-gray-600">
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

        <GettingStarted />
        <ChartSurfaceSection />
        <SeriesComponents />
        <AxesSection />
        <LayersSection />
        <ControlsSection />
        <ToolbarSection />
        <AnnotationsSection />

        {/* Footer */}
        <footer className="mt-8 md:mt-16 pt-6 md:pt-8 border-t-2 border-gray-200">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Additional Resources</h2>
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
        </footer>
      </div>
    </div>
  )
}
