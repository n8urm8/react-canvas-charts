import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, type LineChartData } from '../components/LineChart/LineChart';
import { ChartToolbar, type ChartToolbarTool } from '../components/Chart';

export const StreamingTemperatureChart: React.FC = () => {
  // Streaming temperature data state
  const [temperatureData, setTemperatureData] = useState<LineChartData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const intervalRef = useRef<number | null>(null);
  const dataCountRef = useRef(0);
  const baseTemperature = useRef(20); // Starting temperature in Celsius

  // Function to generate realistic temperature readings
  const generateTemperatureReading = (): number => {
    // Simulate temperature fluctuations with some randomness and trend
    const timeFactor = Math.sin(dataCountRef.current * 0.1) * 5; // Slow wave pattern
    const randomFactor = (Math.random() - 0.5) * 3; // Small random variations
    const newTemp = baseTemperature.current + timeFactor + randomFactor;
    
    // Keep temperature in reasonable range (15-35°C)
    return Math.max(15, Math.min(35, Math.round(newTemp * 10) / 10));
  };

  // Start/stop streaming
  const toggleStreaming = () => {
    if (isStreaming) {
      // Stop streaming
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsStreaming(false);
    } else {
      // Start streaming
      setIsStreaming(true);
      dataCountRef.current = 0;
      
      // Reset data and start fresh
      setTemperatureData([]);
      
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });
        
        const temperature = generateTemperatureReading();
        dataCountRef.current++;

        setTemperatureData(prev => {
          const newData = [...prev, { label: timeLabel, value: temperature }];
          // Show all data points as they come in
          return newData;
        });
      }, 1000); // Update every 1000ms
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleToolbarToggle = useCallback(
    (_tool: ChartToolbarTool, _isActive: boolean, nextActive: string[]) => {
      setActiveTools(nextActive);
    },
    []
  );

  return (
    <section>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">🌡️ Real-time Temperature Stream</h2>
      <p className="text-gray-600 mb-6">Live streaming temperature data with customizable axis labels and professional styling. Updates every second to demonstrate real-time data visualization capabilities.</p>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleStreaming}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isStreaming
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isStreaming ? '⏹️ Stop Stream' : '▶️ Start Stream'}
            </button>
            <div className="flex items-center gap-2">
              <div 
                className={`w-3 h-3 rounded-full ${
                  isStreaming ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
                }`}
              />
              <span className="text-sm text-gray-600">
                {isStreaming ? 'Streaming live data' : 'Stream stopped'} 
                {temperatureData.length > 0 && ` • ${temperatureData.length} data points`}
              </span>
            </div>
          </div>
          {temperatureData.length > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {temperatureData[temperatureData.length - 1]?.value}°C
              </div>
              <div className="text-xs text-gray-500">Current Temperature</div>
            </div>
          )}
        </div>

        <div className="w-full h-96">
          {temperatureData.length > 0 ? (
                          <LineChart
                data={temperatureData}
                title="Live Temperature Readings"
                width="100%"
                height="100%"
                padding={80}
                enableCursor={true}
                enableTooltip={true}
                showPoints={true}
                showLines={true}
                fillArea={true}
                fillOpacity={0.1}
              lineComponent={{
                smooth: false,
                lineWidth: 3,
                color: '#3b82f6',
                showShadow: true,
                shadowColor: 'rgba(59, 130, 246, 0.3)',
                shadowBlur: 4,
              }}
              pointComponent={{
                size: 4,
                shape: 'circle',
                color: '#3b82f6',
                fillColor: '#000',
                borderWidth: 1,
                showShadow: true,
              }}
              gridComponent={{
                showHorizontal: true,
                showVertical: false,
                color: '#e5e7eb',
                opacity: 0.7,
              }}
              cursorComponent={{
                showHorizontalLine: true,
                showVerticalLine: true,
                snapToDataPoints: true,
                horizontalLineColor: '#3b82f6',
                verticalLineColor: '#3b82f6',
                opacity: 0.8,
              }}
                              tooltipComponent={{
                  backgroundColor: '#1f2937',
                  textColor: '#ffffff',
                  borderRadius: 8,
                  padding: 8,
                  template: '🌡️ {label}: {value}°C',
                }}
                xAxisComponent={{
                  title: 'Time',
                  showTitle: true,
                  titleFontSize: 14,
                  titleColor: '#374151',
                  titleFontWeight: 'bold',
                  titlePadding: 35,
                  titlePosition: 'center',
                  showLabels: true,
                  labelColor: '#6b7280',
                  labelFontSize: 11,
                }}
                yAxisComponent={{
                  title: 'Temperature (°C)',
                  showTitle: true,
                  titleFontSize: 14,
                  titleColor: '#374151',
                  titleFontWeight: 'bold',
                  titlePadding: 60,
                  titlePosition: 'center',
                  titleRotation: -90, // Rotate Y-axis title vertically
                  showLabels: true,
                  labelColor: '#6b7280',
                  labelFontSize: 11,
                }}
            >
              <ChartToolbar
                tools={[
                  { id: 'pan', label: 'Pan' },
                  { id: 'brush', label: 'Brush' },
                  { id: 'annotate', label: 'Annotate' },
                ]}
                activeToolIds={activeTools}
                onToggle={handleToolbarToggle}
              />
            </LineChart>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <div className="text-lg font-medium text-gray-600 mb-2">No Data Available</div>
                <div className="text-sm text-gray-500">Click "Start Stream" to begin receiving temperature data</div>
              </div>
            </div>
          )}
        </div>
        
        {isStreaming && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium">
                    Live streaming at 1 Hz (every 1000ms) • Showing all readings • 
                    Temperature range: 15-35°C
                  </span>
            </div>
          </div>
        )}

        {activeTools.length > 0 ? (
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-medium text-gray-700">Active tools:</span> {activeTools.join(', ')}
          </div>
        ) : null}
      </div>
    </section>
  );
}; 