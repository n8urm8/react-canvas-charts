import React from 'react';

export const UsageExamples: React.FC = () => {
  return (
    <div className="max-w-6xl text-left">
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
          <h4 className="text-lg font-medium text-gray-800 mb-2">Interactive Chart with Cursor & Tooltip:</h4>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm text-gray-800 border">
{`<BarChart
  data={data}
  title="Custom Chart"
  enableCursor={true}
  enableTooltip={true}
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
  cursorComponent={{
    showHorizontalLine: true,
    showVerticalLine: true,
    snapToDataPoints: true,
    horizontalLineColor: '#ef4444',
    verticalLineColor: '#3b82f6'
  }}
  tooltipComponent={{
    backgroundColor: '#1f2937',
    borderRadius: 8,
    template: '{label}: $\{value\}K'
  }}
/>`}
          </pre>
        </div>

        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">Line Chart with Area Fill:</h4>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm text-gray-800 border">
{`<LineChart
  data={data}
  title="Trend Analysis"
  enableCursor={true}
  enableTooltip={true}
  fillArea={true}
  fillOpacity={0.3}
  lineComponent={{
    smooth: true,
    lineWidth: 3,
    showShadow: true
  }}
  pointComponent={{
    size: 8,
    shape: 'circle',
    showShadow: true
  }}
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
}; 