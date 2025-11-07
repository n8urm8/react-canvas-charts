import React, { useState } from 'react';
import { LineChart, type LineChartData } from '../components/LineChart/LineChart';

interface DataPoint {
  id: string;
  label: string;
  value: number;
}

export const InteractiveChartDemo: React.FC = () => {
  // Data state
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([
    { id: '1', label: 'Jan', value: 65 },
    { id: '2', label: 'Feb', value: 45 },
    { id: '3', label: 'Mar', value: 78 },
    { id: '4', label: 'Apr', value: 52 },
    { id: '5', label: 'May', value: 89 },
    { id: '6', label: 'Jun', value: 73 },
  ]);

  // Chart configuration state
  const [config, setConfig] = useState({
    title: 'Interactive Line Chart',
    width: 800,
    height: 400,
    padding: 80,
    showPoints: true,
    showLines: true,
    showValues: false,
    fillArea: false,
    fillOpacity: 0.1,
    enableCursor: true,
    enableTooltip: true,
    
    // Line styles
    lineWidth: 2,
    lineColor: '#3b82f6',
    lineSmooth: false,
    lineDash: [] as number[],
    
    // Point styles
    pointSize: 6,
    pointShape: 'circle' as 'circle' | 'square' | 'triangle' | 'diamond' | 'cross' | 'star',
    pointColor: '#3b82f6',
    
    // Grid & Axes
    showGrid: true,
    gridColor: '#e5e7eb',
    showXAxis: true,
    showYAxis: true,
    xAxisTitle: 'Month',
    yAxisTitle: 'Value',
    
    // Interactive
    cursorSnapToPoints: true,
    tooltipPosition: 'follow' as 'follow' | 'top' | 'bottom' | 'left' | 'right' | 'fixed',
    tooltipTemplate: '{label}: {value}',
  });

  // Add new data point
  const addDataPoint = () => {
    const newId = (Math.max(...dataPoints.map(d => parseInt(d.id))) + 1).toString();
    setDataPoints([
      ...dataPoints,
      { id: newId, label: `Point ${newId}`, value: Math.floor(Math.random() * 100) }
    ]);
  };

  // Remove data point
  const removeDataPoint = (id: string) => {
    if (dataPoints.length > 1) {
      setDataPoints(dataPoints.filter(d => d.id !== id));
    }
  };

  // Update data point
  const updateDataPoint = (id: string, field: 'label' | 'value', value: string | number) => {
    setDataPoints(dataPoints.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  // Randomize data
  const randomizeData = () => {
    setDataPoints(dataPoints.map(d => ({
      ...d,
      value: Math.floor(Math.random() * 100)
    })));
  };

  // Convert data for LineChart
  const chartData: LineChartData[] = dataPoints.map(d => ({
    label: d.label,
    value: d.value,
  }));

  return (
    <div className="p-5 font-sans bg-gray-50 min-h-screen">
      <div className="w-full mx-auto">
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-8">
          🎮 Interactive Chart Demo
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Chart Display - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <LineChart
                data={chartData}
                title={config.title}
                width="100%"
                height={config.height}
                padding={config.padding}
                showPoints={config.showPoints}
                showLines={config.showLines}
                showValues={config.showValues}
                fillArea={config.fillArea}
                fillOpacity={config.fillOpacity}
                enableCursor={config.enableCursor}
                enableTooltip={config.enableTooltip}
                lineComponent={{
                  lineWidth: config.lineWidth,
                  color: config.lineColor,
                  smooth: config.lineSmooth,
                  lineDash: config.lineDash,
                }}
                pointComponent={{
                  size: config.pointSize,
                  shape: config.pointShape,
                  color: config.pointColor,
                  fillColor: config.pointColor,
                }}
                gridComponent={{
                  show: config.showGrid,
                  color: config.gridColor,
                }}
                xAxisComponent={{
                  show: config.showXAxis,
                  title: config.xAxisTitle,
                  showTitle: config.xAxisTitle.length > 0,
                }}
                yAxisComponent={{
                  show: config.showYAxis,
                  title: config.yAxisTitle,
                  showTitle: config.yAxisTitle.length > 0,
                  titleRotation: -90,
                }}
                cursorComponent={{
                  snapToDataPoints: config.cursorSnapToPoints,
                }}
                tooltipComponent={{
                  position: config.tooltipPosition,
                  template: config.tooltipTemplate,
                }}
              />
            </div>

            {/* Quick Actions */}
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={randomizeData}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition text-sm"
                >
                  🎲 Randomize Values
                </button>
                <button
                  onClick={() => setConfig({ ...config, lineSmooth: !config.lineSmooth })}
                  className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition text-sm"
                >
                  {config.lineSmooth ? '📐 Straight Lines' : '〰️ Smooth Curves'}
                </button>
                <button
                  onClick={() => setConfig({ ...config, fillArea: !config.fillArea })}
                  className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition text-sm"
                >
                  {config.fillArea ? '🚫 Remove Fill' : '🎨 Fill Area'}
                </button>
                <button
                  onClick={() => setConfig({ ...config, showValues: !config.showValues })}
                  className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition text-sm"
                >
                  {config.showValues ? '🔢 Hide Values' : '🔢 Show Values'}
                </button>
              </div>
            </div>
          </div>

          {/* Control Panel - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Control Panel</h2>
              
              {/* Data Points Section */}
              <section className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">Data Points</h3>
                  <button
                    onClick={addDataPoint}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {dataPoints.map((point) => (
                    <div key={point.id} className="flex gap-2 items-center p-2 bg-gray-50 rounded">
                      <input
                        type="text"
                        value={point.label}
                        onChange={(e) => updateDataPoint(point.id, 'label', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        placeholder="Label"
                      />
                      <input
                        type="number"
                        value={point.value}
                        onChange={(e) => updateDataPoint(point.id, 'value', parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => removeDataPoint(point.id)}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
                        disabled={dataPoints.length === 1}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Basic Settings */}
              <section className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Basic Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Title</label>
                    <input
                      type="text"
                      value={config.title}
                      onChange={(e) => setConfig({ ...config, title: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Height: {config.height}px</label>
                    <input
                      type="range"
                      min="200"
                      max="800"
                      value={config.height}
                      onChange={(e) => setConfig({ ...config, height: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Padding: {config.padding}px</label>
                    <input
                      type="range"
                      min="40"
                      max="120"
                      value={config.padding}
                      onChange={(e) => setConfig({ ...config, padding: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </section>

              {/* Line Settings */}
              <section className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Line Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.showLines}
                      onChange={(e) => setConfig({ ...config, showLines: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Show Lines</span>
                  </label>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Line Width: {config.lineWidth}px</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={config.lineWidth}
                      onChange={(e) => setConfig({ ...config, lineWidth: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Line Color</label>
                    <input
                      type="color"
                      value={config.lineColor}
                      onChange={(e) => setConfig({ ...config, lineColor: e.target.value })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.lineSmooth}
                      onChange={(e) => setConfig({ ...config, lineSmooth: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Smooth Curves</span>
                  </label>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Line Style</label>
                    <select
                      value={config.lineDash.length > 0 ? 'dashed' : 'solid'}
                      onChange={(e) => setConfig({ 
                        ...config, 
                        lineDash: e.target.value === 'dashed' ? [10, 5] : [] 
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Point Settings */}
              <section className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Point Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.showPoints}
                      onChange={(e) => setConfig({ ...config, showPoints: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Show Points</span>
                  </label>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Point Size: {config.pointSize}px</label>
                    <input
                      type="range"
                      min="3"
                      max="20"
                      value={config.pointSize}
                      onChange={(e) => setConfig({ ...config, pointSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Point Shape</label>
                    <select
                      value={config.pointShape}
                      onChange={(e) => setConfig({ 
                        ...config, 
                        pointShape: e.target.value as typeof config.pointShape
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="circle">Circle</option>
                      <option value="square">Square</option>
                      <option value="triangle">Triangle</option>
                      <option value="diamond">Diamond</option>
                      <option value="cross">Cross</option>
                      <option value="star">Star</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Point Color</label>
                    <input
                      type="color"
                      value={config.pointColor}
                      onChange={(e) => setConfig({ ...config, pointColor: e.target.value })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </section>

              {/* Fill Settings */}
              <section className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Fill Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.fillArea}
                      onChange={(e) => setConfig({ ...config, fillArea: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Fill Area Under Line</span>
                  </label>

                  {config.fillArea && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Fill Opacity: {(config.fillOpacity * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={config.fillOpacity}
                        onChange={(e) => setConfig({ ...config, fillOpacity: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Axes Settings */}
              <section className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Axes & Grid</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.showGrid}
                      onChange={(e) => setConfig({ ...config, showGrid: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Show Grid</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.showXAxis}
                      onChange={(e) => setConfig({ ...config, showXAxis: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Show X-Axis</span>
                  </label>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">X-Axis Title</label>
                    <input
                      type="text"
                      value={config.xAxisTitle}
                      onChange={(e) => setConfig({ ...config, xAxisTitle: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.showYAxis}
                      onChange={(e) => setConfig({ ...config, showYAxis: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Show Y-Axis</span>
                  </label>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Y-Axis Title</label>
                    <input
                      type="text"
                      value={config.yAxisTitle}
                      onChange={(e) => setConfig({ ...config, yAxisTitle: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </section>

              {/* Interactive Settings */}
              <section className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Interactive Features</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.enableCursor}
                      onChange={(e) => setConfig({ ...config, enableCursor: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Enable Cursor</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.enableTooltip}
                      onChange={(e) => setConfig({ ...config, enableTooltip: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Enable Tooltip</span>
                  </label>

                  {config.enableCursor && (
                    <label className="flex items-center ml-4">
                      <input
                        type="checkbox"
                        checked={config.cursorSnapToPoints}
                        onChange={(e) => setConfig({ ...config, cursorSnapToPoints: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Snap to Points</span>
                    </label>
                  )}

                  {config.enableTooltip && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Tooltip Position</label>
                        <select
                          value={config.tooltipPosition}
                          onChange={(e) => setConfig({ 
                            ...config, 
                            tooltipPosition: e.target.value as typeof config.tooltipPosition
                          })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        >
                          <option value="follow">Follow Cursor</option>
                          <option value="top">Top</option>
                          <option value="bottom">Bottom</option>
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                          <option value="fixed">Fixed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Tooltip Template</label>
                        <input
                          type="text"
                          value={config.tooltipTemplate}
                          onChange={(e) => setConfig({ ...config, tooltipTemplate: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          placeholder="{label}: {value}"
                        />
                        <p className="text-xs text-gray-500 mt-1">Use {'{label}'} and {'{value}'}</p>
                      </div>
                    </>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
