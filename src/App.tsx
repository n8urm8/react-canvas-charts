import { useState } from "react";
import { BarChart, type BarChartData } from "./components/BarChart/BarChart";
import { LineChart, type LineChartData } from "./components/LineChart/LineChart";
import "./App.css";

function App() {
  const [sampleData] = useState<BarChartData[]>([
    { label: "Jan", value: 65, color: "#3b82f6" },
    { label: "Feb", value: 45, color: "#ef4444" },
    { label: "Mar", value: 78, color: "#10b981" },
    { label: "Apr", value: 52, color: "#f59e0b" },
    { label: "May", value: 89, color: "#8b5cf6" },
    { label: "Jun", value: 73, color: "#06b6d4" },
  ]);

  const [alternateData] = useState<BarChartData[]>([
    { label: "Product A", value: 120 },
    { label: "Product B", value: 98 },
    { label: "Product C", value: 145 },
    { label: "Product D", value: 67 },
    { label: "Product E", value: 201 },
  ]);

  const [currentDataIndex, setCurrentDataIndex] = useState(0);
  const [isResponsive, setIsResponsive] = useState(true);
  const [styleVariant, setStyleVariant] = useState(0);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const datasets = [sampleData, alternateData];
  const titles = ["Monthly Sales (K$)", "Product Performance"];

  // Different styling variants to showcase customization
  const barStyleVariants = [
    // Default style
    {},
    // Modern style with rounded bars and gradients
    {
      barComponent: {
        borderRadius: 8,
        showShadow: true,
        gradient: {
          enabled: true,
          direction: 'vertical' as const,
        }
      },
      titleComponent: {
        fontSize: 24,
        color: '#1e40af',
        fontWeight: 'bold',
      },
      gridComponent: {
        color: '#f3f4f6',
        lineDash: [5, 5],
      }
    },
    // Minimalist style
    {
      barComponent: {
        showBorder: true,
        borderColor: '#374151',
        borderWidth: 2,
      },
      titleComponent: {
        fontSize: 18,
        color: '#374151',
        fontWeight: 'normal',
      },
      gridComponent: {
        show: false,
      },
      xAxisComponent: {
        labelColor: '#6b7280',
        color: '#6b7280',
      },
      yAxisComponent: {
        labelColor: '#6b7280',
        color: '#6b7280',
      },
      labelComponent: {
        show: false,
      }
    },
    // Colorful style with custom labels
    {
      barComponent: {
        borderRadius: 12,
        showBorder: true,
        borderColor: '#ffffff',
        borderWidth: 3,
        showShadow: true,
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowBlur: 8,
      },
      titleComponent: {
        fontSize: 22,
        color: '#7c3aed',
        fontWeight: 'bold',
      },
      labelComponent: {
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        borderRadius: 4,
        padding: 4,
        fontWeight: 'bold',
        color: '#1f2937',
      },
      gridComponent: {
        color: '#e5e7eb',
        opacity: 0.7,
      }
    }
  ];

  const lineStyleVariants = [
    // Default style
    {},
    // Smooth curves with area fill
    {
      lineComponent: {
        smooth: true,
        lineWidth: 3,
        showShadow: true,
      },
      pointComponent: {
        size: 8,
        showShadow: true,
        borderWidth: 3,
      },
      titleComponent: {
        fontSize: 24,
        color: '#1e40af',
        fontWeight: 'bold',
      },
      fillArea: true,
      fillOpacity: 0.2,
    },
    // Dashed lines with custom points
    {
      lineComponent: {
        lineDash: [10, 5],
        lineWidth: 2,
      },
      pointComponent: {
        shape: 'diamond' as const,
        size: 10,
        hollow: true,
        borderWidth: 2,
      },
      titleComponent: {
        fontSize: 18,
        color: '#374151',
        fontWeight: 'normal',
      },
      gridComponent: {
        show: false,
      },
    },
    // Gradient lines with star points
    {
      lineComponent: {
        gradient: {
          enabled: true,
        },
        lineWidth: 4,
        showShadow: true,
      },
      pointComponent: {
        shape: 'star' as const,
        size: 12,
        showShadow: true,
      },
      titleComponent: {
        fontSize: 22,
        color: '#7c3aed',
        fontWeight: 'bold',
      },
      showValues: true,
      labelComponent: {
        backgroundColor: '#ffffff',
        borderRadius: 4,
        padding: 2,
      },
    }
  ];

  const currentStyleVariants = chartType === 'bar' ? barStyleVariants : lineStyleVariants;
  const currentStyle = currentStyleVariants[styleVariant] || {};

  return (
    <div className="p-5 font-sans bg-gray-50 min-h-screen">
      <h1 className="text-center text-3xl font-bold text-gray-900 mb-8">
        React Canvas Charting Library - Bar & Line Charts
      </h1>
      
      <div className="text-center mb-5 space-x-4">
        <button
          onClick={() => setChartType(chartType === 'bar' ? 'line' : 'bar')}
          className="px-5 py-2.5 text-base bg-red-500 text-white border-none rounded cursor-pointer hover:bg-red-600 transition-colors"
        >
          {chartType === 'bar' ? 'Switch to Line Chart' : 'Switch to Bar Chart'}
        </button>
        <button
          onClick={() => setCurrentDataIndex((prev) => (prev + 1) % datasets.length)}
          className="px-5 py-2.5 text-base bg-blue-500 text-white border-none rounded cursor-pointer hover:bg-blue-600 transition-colors"
        >
          Switch Dataset
        </button>
        <button
          onClick={() => setIsResponsive(!isResponsive)}
          className="px-5 py-2.5 text-base bg-green-500 text-white border-none rounded cursor-pointer hover:bg-green-600 transition-colors"
        >
          {isResponsive ? 'Fixed Size' : 'Responsive'}
        </button>
        <button
          onClick={() => setStyleVariant((prev) => (prev + 1) % currentStyleVariants.length)}
          className="px-5 py-2.5 text-base bg-purple-500 text-white border-none rounded cursor-pointer hover:bg-purple-600 transition-colors"
        >
          Change Style ({styleVariant + 1}/{currentStyleVariants.length})
        </button>
      </div>

      <div className="flex flex-col gap-10 items-center">
        {isResponsive ? (
          <div className="w-full max-w-6xl h-96 bg-white rounded-lg shadow-lg p-4">
            {chartType === 'bar' ? (
              <BarChart
                data={datasets[currentDataIndex]}
                title={titles[currentDataIndex]}
                width="100%"
                height="100%"
                showValues={true}
                backgroundColor="#ffffff"
                textColor="#1f2937"
                className="shadow-lg"
                {...currentStyle}
              />
            ) : (
              <LineChart
                data={datasets[currentDataIndex]}
                title={titles[currentDataIndex]}
                width="100%"
                height="100%"
                showValues={false}
                backgroundColor="#ffffff"
                textColor="#1f2937"
                className="shadow-lg"
                {...currentStyle}
              />
            )}
          </div>
        ) : chartType === 'bar' ? (
          <BarChart
            data={datasets[currentDataIndex]}
            title={titles[currentDataIndex]}
            width={800}
            height={400}
            showValues={true}
            backgroundColor="#ffffff"
            textColor="#1f2937"
            className="shadow-lg"
            {...currentStyle}
          />
        ) : (
          <LineChart
            data={datasets[currentDataIndex]}
            title={titles[currentDataIndex]}
            width={800}
            height={400}
            showValues={false}
            backgroundColor="#ffffff"
            textColor="#1f2937"
            className="shadow-lg"
            {...currentStyle}
          />
        )}

        <div className="max-w-6xl text-left">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">✨ Fully Customizable Components:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">🎯 Chart Title</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Font size, family, weight, color</li>
                <li>• Position and margins</li>
                <li>• Custom renderer support</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">📊 Chart Bars</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Border radius, borders, shadows</li>
                <li>• Gradients (vertical/horizontal)</li>
                <li>• Individual styling per bar</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">📈 Chart Lines</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Line width, dash patterns, caps</li>
                <li>• Smooth curves with tension control</li>
                <li>• Gradients and shadows</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">🔵 Chart Points</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multiple shapes (circle, square, star, etc.)</li>
                <li>• Hollow/filled, borders, shadows</li>
                <li>• Size and rotation control</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">📏 Axes (X & Y)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Colors, line width, visibility</li>
                <li>• Labels, ticks, padding</li>
                <li>• Font customization</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">📋 Value Labels</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Position (top, center, inside, etc.)</li>
                <li>• Background, borders, rotation</li>
                <li>• Custom formatters</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">🔲 Grid Lines</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Horizontal/vertical visibility</li>
                <li>• Line style, dash patterns</li>
                <li>• Opacity and colors</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">🎨 Advanced Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multi-series support (Line Charts)</li>
                <li>• Area fill under lines</li>
                <li>• Custom renderers for any component</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">⚡ Performance</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Canvas-based rendering</li>
                <li>• Responsive & fixed sizing</li>
                <li>• Tailwind CSS integration</li>
              </ul>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-3">Usage Examples:</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">Basic Chart:</h4>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm text-gray-800 border">
{`<BarChart
  data={data}
  title="Sales Data"
  width={800}
  height={400}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">Customized Components:</h4>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm text-gray-800 border">
{`<BarChart
  data={data}
  title="Custom Chart"
  titleComponent={{
    fontSize: 24,
    color: '#1e40af',
    fontWeight: 'bold'
  }}
  barComponent={{
    borderRadius: 8,
    showShadow: true,
    gradient: {
      enabled: true,
      direction: 'vertical'
    }
  }}
  labelComponent={{
    backgroundColor: '#ffffff',
    borderRadius: 4,
    padding: 4
  }}
/>`}
              </pre>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">🚀 Modular Architecture</h4>
            <p className="text-blue-800 text-sm mb-3">
              Every part of the chart is now a separate, customizable component:
            </p>
            <div className="grid grid-cols-2 gap-2 text-blue-800 text-sm">
              <div>• <strong>ChartTitle</strong> - Title rendering</div>
              <div>• <strong>ChartAxis</strong> - X/Y axis rendering</div>
              <div>• <strong>ChartGrid</strong> - Grid line rendering</div>
              <div>• <strong>ChartBar</strong> - Individual bar rendering</div>
              <div>• <strong>ChartLabel</strong> - Value label rendering</div>
              <div>• <strong>Custom Renderers</strong> - Complete control</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
