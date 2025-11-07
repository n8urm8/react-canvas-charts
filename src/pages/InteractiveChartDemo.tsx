import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, type LineChartData } from '../components/LineChart/LineChart';

interface DataPoint {
  id: string;
  label: string;
  value: number;
}

const formatTimeLabel = (date: Date): string => {
  const timePart = date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${timePart}.${date.getMilliseconds().toString().padStart(3, '0')}`;
};

const createInitialTimeSeries = (count: number): DataPoint[] => {
  const now = Date.now();
  let lastValue = 60;

  return Array.from({ length: count }).map((_, index) => {
    const timestamp = new Date(now - (count - 1 - index) * 1000);
    const variation = (Math.random() - 0.5) * 20;
    lastValue = Math.max(0, Math.round((lastValue + variation) * 10) / 10);

    return {
      id: (index + 1).toString(),
      label: formatTimeLabel(timestamp),
      value: lastValue,
    };
  });
};

export const InteractiveChartDemo: React.FC = () => {
  // Data state
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(() => createInitialTimeSeries(12));

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
  xAxisTitle: 'Time',
  yAxisTitle: 'Value',
  xAxisTickStep: 1,
  xAxisMaxTicks: 0,
    
    // Interactive
    cursorSnapToPoints: true,
    tooltipPosition: 'follow' as 'follow' | 'top' | 'bottom' | 'left' | 'right' | 'fixed',
    tooltipTemplate: '{label}: {value}',
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingHz, setStreamingHz] = useState(1.0);
  const [streamingPointsPerTick, setStreamingPointsPerTick] = useState(1);
  const [streamingMaxPoints, setStreamingMaxPoints] = useState(24);
  const [bulkAddCount, setBulkAddCount] = useState(10);
  const intervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null);

  // Add new data point
  const addDataPoint = () => {
    setDataPoints(prev => {
      const numericIds = prev
        .map(point => Number.parseInt(point.id, 10))
        .filter((id) => Number.isFinite(id));
      const nextId = ((numericIds.length > 0 ? Math.max(...numericIds) : 0) + 1).toString();
      return [
        ...prev,
        { id: nextId, label: `Point ${nextId}`, value: Math.floor(Math.random() * 100) },
      ];
    });
  };

  // Remove data point
  const removeDataPoint = (id: string) => {
    setDataPoints(prev => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter(d => d.id !== id);
    });
  };

  // Update data point
  const updateDataPoint = (id: string, field: 'label' | 'value', value: string | number) => {
    setDataPoints(prev => prev.map(d =>
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  // Randomize data
  const randomizeData = () => {
    setDataPoints(prev => prev.map(d => ({
      ...d,
      value: Math.floor(Math.random() * 100)
    })));
  };

  const generateNewPoints = useCallback((prev: DataPoint[], count: number): DataPoint[] => {
    const normalizedCount = Math.max(1, count);
    const numericIds = prev
      .map(point => Number.parseInt(point.id, 10))
      .filter(id => Number.isFinite(id));
    let nextIdBase = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;

    const points: DataPoint[] = [];
    let previousValue = prev.length > 0 ? prev[prev.length - 1].value : 50;
    const baseTime = Date.now();

    for (let index = 0; index < normalizedCount; index += 1) {
      const variation = (Math.random() - 0.5) * 20;
      previousValue = Math.max(0, Math.round((previousValue + variation) * 10) / 10);
      const timestamp = new Date(baseTime + index);

      points.push({
        id: (nextIdBase++).toString(),
        label: formatTimeLabel(timestamp),
        value: previousValue,
      });
    }

    return points;
  }, []);

  const appendStreamingPoint = useCallback(() => {
    setDataPoints(prev => {
      const additions = generateNewPoints(prev, Math.max(1, streamingPointsPerTick));

      let nextData = [...prev, ...additions];

      if (streamingMaxPoints > 0 && nextData.length > streamingMaxPoints) {
        nextData = nextData.slice(nextData.length - streamingMaxPoints);
      }

      return nextData;
    });
  }, [generateNewPoints, streamingMaxPoints, streamingPointsPerTick]);

  const addBulkPoints = () => {
    if (bulkAddCount <= 0) return;
    setDataPoints(prev => {
      let nextData = [...prev, ...generateNewPoints(prev, bulkAddCount)];
      if (streamingMaxPoints > 0 && nextData.length > streamingMaxPoints) {
        nextData = nextData.slice(nextData.length - streamingMaxPoints);
      }
      return nextData;
    });
  };

  const toggleStreaming = () => {
    setIsStreaming(prev => !prev);
  };

  useEffect(() => {
    if (!isStreaming) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

  const safeHz = Math.max(0.1, Math.min(100, streamingHz));
  const intervalMs = Math.max(10, Math.round(1000 / safeHz));
    const id = window.setInterval(() => {
      appendStreamingPoint();
    }, intervalMs);
    intervalRef.current = id;

    return () => {
      clearInterval(id);
      if (intervalRef.current === id) {
        intervalRef.current = null;
      }
    };
  }, [appendStreamingPoint, isStreaming, streamingHz]);

  useEffect(() => () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  useEffect(() => {
    if (streamingMaxPoints <= 0) return;
    setDataPoints(prev => {
      if (prev.length <= streamingMaxPoints) {
        return prev;
      }
      return prev.slice(prev.length - streamingMaxPoints);
    });
  }, [streamingMaxPoints]);

  // Convert data for LineChart
  const chartData: LineChartData[] = dataPoints.map(d => ({
    label: d.label,
    value: d.value,
  }));

  // Generate code preview
  const generateCodePreview = () => {
    const firstDataEntry = chartData[0];
    const formattedFirstEntry = firstDataEntry
      ? JSON.stringify(firstDataEntry, null, 2)
          .split('\n')
          .map(line => `  ${line}`)
          .join('\n')
      : '';

    const dataCode = firstDataEntry
      ? `const data = [\n${formattedFirstEntry}${chartData.length > 1 ? `,\n  // ...more data points` : ''}\n];`
      : 'const data = [];';
    
    const propsArray = [
      `data={data}`,
      `title="${config.title}"`,
      `width="100%"`,
      `height={${config.height}}`,
      `padding={${config.padding}}`,
      `showPoints={${config.showPoints}}`,
      `showLines={${config.showLines}}`,
      config.showValues && `showValues={true}`,
      config.fillArea && `fillArea={true}`,
      config.fillArea && config.fillOpacity !== 0.1 && `fillOpacity={${config.fillOpacity}}`,
      config.enableCursor && `enableCursor={true}`,
      config.enableTooltip && `enableTooltip={true}`,
    ].filter(Boolean);

    const lineProps = [
      config.lineWidth !== 2 && `  lineWidth: ${config.lineWidth},`,
      config.lineColor !== '#3b82f6' && `  color: '${config.lineColor}',`,
      config.lineSmooth && `  smooth: true,`,
      config.lineDash.length > 0 && `  lineDash: [${config.lineDash.join(', ')}],`,
    ].filter(Boolean);

    const pointProps = [
      config.pointSize !== 6 && `  size: ${config.pointSize},`,
      config.pointShape !== 'circle' && `  shape: '${config.pointShape}',`,
      config.pointColor !== '#3b82f6' && `  color: '${config.pointColor}',`,
      config.pointColor !== '#3b82f6' && `  fillColor: '${config.pointColor}',`,
    ].filter(Boolean);

    const gridProps = [
      !config.showGrid && `  show: false,`,
      config.gridColor !== '#e5e7eb' && `  color: '${config.gridColor}',`,
    ].filter(Boolean);

    const xAxisProps = [
      !config.showXAxis && `  show: false,`,
      config.xAxisTitle && `  title: '${config.xAxisTitle}',`,
      config.xAxisTitle && `  showTitle: true,`,
      config.xAxisTickStep !== 1 && `  tickStep: ${config.xAxisTickStep},`,
      config.xAxisMaxTicks > 0 && `  maxTicks: ${config.xAxisMaxTicks},`,
    ].filter(Boolean);

    const yAxisProps = [
      !config.showYAxis && `  show: false,`,
      config.yAxisTitle && `  title: '${config.yAxisTitle}',`,
      config.yAxisTitle && `  showTitle: true,`,
      config.yAxisTitle && `  titleRotation: -90,`,
    ].filter(Boolean);

    const cursorProps = [
      !config.cursorSnapToPoints && `  snapToDataPoints: false,`,
    ].filter(Boolean);

    const tooltipProps = [
      config.tooltipPosition !== 'follow' && `  position: '${config.tooltipPosition}',`,
      config.tooltipTemplate !== '{label}: {value}' && `  template: '${config.tooltipTemplate}',`,
    ].filter(Boolean);

    let code = `import { LineChart } from './components/LineChart/LineChart';\n\n${dataCode}\n\n<LineChart\n  ${propsArray.join('\n  ')}`;

    if (lineProps.length > 0) {
      code += `\n  lineComponent={{\n${lineProps.join('\n')}\n  }}`;
    }
    if (pointProps.length > 0) {
      code += `\n  pointComponent={{\n${pointProps.join('\n')}\n  }}`;
    }
    if (gridProps.length > 0) {
      code += `\n  gridComponent={{\n${gridProps.join('\n')}\n  }}`;
    }
    if (xAxisProps.length > 0) {
      code += `\n  xAxisComponent={{\n${xAxisProps.join('\n')}\n  }}`;
    }
    if (yAxisProps.length > 0) {
      code += `\n  yAxisComponent={{\n${yAxisProps.join('\n')}\n  }}`;
    }
    if (cursorProps.length > 0 && config.enableCursor) {
      code += `\n  cursorComponent={{\n${cursorProps.join('\n')}\n  }}`;
    }
    if (tooltipProps.length > 0 && config.enableTooltip) {
      code += `\n  tooltipComponent={{\n${tooltipProps.join('\n')}\n  }}`;
    }

    code += `\n/>`;
    return code;
  };

  const codePreview = generateCodePreview();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codePreview);
      alert('Code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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
                  tickStep: config.xAxisTickStep,
                  maxTicks: config.xAxisMaxTicks > 0 ? config.xAxisMaxTicks : undefined,
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

              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-gray-700">Live Data Stream</h4>
                    <p className="text-xs text-gray-500">
                      {isStreaming ? `Streaming at ${streamingHz.toFixed(1)} Hz` : 'Stream is paused'}
                      {streamingMaxPoints > 0 ? ` • Max ${streamingMaxPoints} pts` : ' • Unlimited points'}
                      {` • ${dataPoints.length} total points`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{`Points per update: ${streamingPointsPerTick}`}</p>
                  </div>
                  <button
                    onClick={toggleStreaming}
                    className={`px-4 py-2 text-sm font-medium rounded transition ${
                      isStreaming
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {isStreaming ? '⏹️ Stop Stream' : '▶️ Start Stream'}
                  </button>
                </div>

                <div className="mt-3">
                  <label className="block text-sm text-gray-600 mb-1">
                    Update Rate: {streamingHz.toFixed(1)} Hz
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={streamingHz}
                    onChange={(e) => {
                      const parsed = parseFloat(e.target.value);
                      setStreamingHz(Number.isNaN(parsed) ? 0.1 : Math.min(100, Math.max(0.1, parsed)));
                    }}
                    className="w-full"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.1"
                      value={streamingHz}
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value);
                        if (Number.isNaN(parsed)) {
                          return;
                        }
                        setStreamingHz(Math.min(100, Math.max(0.1, parsed)));
                      }}
                      className="w-24 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-500">Hz</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Higher Hz adds points faster. Minimum 0.1 Hz.</p>
                </div>

                <div className="mt-3">
                  <label className="block text-sm text-gray-600 mb-1">
                    Points Added Per Update: {streamingPointsPerTick}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={streamingPointsPerTick}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      if (!Number.isNaN(parsed)) {
                        setStreamingPointsPerTick(Math.min(100, Math.max(1, parsed)));
                      }
                    }}
                    className="w-full"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={streamingPointsPerTick}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        if (!Number.isNaN(parsed)) {
                          setStreamingPointsPerTick(Math.min(100, Math.max(1, parsed)));
                        }
                      }}
                      className="w-24 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-500">points/update</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Each tick pushes multiple points to simulate higher throughput.</p>
                </div>

                <div className="mt-3">
                  <label className="block text-sm text-gray-600 mb-1">
                    Max Points (0 = unlimited)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={streamingMaxPoints}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      if (Number.isNaN(parsed)) {
                        setStreamingMaxPoints(0);
                        return;
                      }
                      setStreamingMaxPoints(Math.max(0, parsed));
                    }}
                    className="w-28 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Older points drop when the limit is reached.
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Add Points Manually</label>
                    <input
                      type="number"
                      min="1"
                      value={bulkAddCount}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        if (!Number.isNaN(parsed)) {
                          setBulkAddCount(Math.max(1, parsed));
                        }
                      }}
                      className="w-28 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Generates additional points instantly.</p>
                  </div>
                  <button
                    onClick={addBulkPoints}
                    className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition"
                  >
                    ➕ Add {bulkAddCount} Points
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-gray-900 text-gray-100 rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Generated Code Preview</h3>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Copy
                </button>
              </div>
              <pre className="text-left font-mono text-xs md:text-sm whitespace-pre overflow-x-auto bg-gray-950 rounded p-3 border border-gray-800">
                <code className='text-left w-full'>{codePreview}</code>
              </pre>
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">X Tick Step</label>
                      <input
                        type="number"
                        min="1"
                        value={config.xAxisTickStep}
                        onChange={(e) => {
                          const nextValue = Math.max(1, parseInt(e.target.value, 10) || 1);
                          setConfig({ ...config, xAxisTickStep: nextValue });
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Show every Nth label.</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Max X Ticks</label>
                      <input
                        type="number"
                        min="0"
                        value={config.xAxisMaxTicks}
                        onChange={(e) => {
                          const rawValue = parseInt(e.target.value, 10);
                          const nextValue = rawValue && rawValue > 0 ? rawValue : 0;
                          setConfig({ ...config, xAxisMaxTicks: nextValue });
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">0 keeps all ticks.</p>
                    </div>
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
