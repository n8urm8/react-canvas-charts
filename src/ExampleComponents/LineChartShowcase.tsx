import React, { useState } from 'react';
import { LineChart, type LineChartData } from '../components/LineChart/LineChart';
import { StreamingTemperatureChart } from './StreamingTemperatureChart';

export const LineChartShowcase: React.FC = () => {
  // Sample data for demonstrations
  const [monthlyData] = useState<LineChartData[]>([
    { label: "Jan", value: 65 },
    { label: "Feb", value: 45 },
    { label: "Mar", value: 78 },
    { label: "Apr", value: 52 },
    { label: "May", value: 89 },
    { label: "Jun", value: 73 },
    { label: "Jul", value: 95 },
    { label: "Aug", value: 67 },
  ]);

  const [performanceData] = useState<LineChartData[]>([
    { label: "Q1", value: 120 },
    { label: "Q2", value: 98 },
    { label: "Q3", value: 145 },
    { label: "Q4", value: 167 },
  ]);

  const [trendData] = useState<LineChartData[]>([
    { label: "Week 1", value: 15 },
    { label: "Week 2", value: 25 },
    { label: "Week 3", value: 35 },
    { label: "Week 4", value: 28 },
    { label: "Week 5", value: 42 },
    { label: "Week 6", value: 38 },
  ]);

  return (
    <div className="p-5 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-8">
          LineChart Showcase - Interactive Examples with Axis Titles
        </h1>
        
        <div className="space-y-16">
          {/* Basic Line Chart */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">📈 Basic Line Chart</h2>
            <p className="text-gray-600 mb-6">Simple line chart with default styling and interactive cursor.</p>
            <div className="bg-white rounded-lg shadow-lg p-6">
                          <div className="w-full h-96">
              <LineChart
                data={monthlyData}
                title="Monthly Sales Trend"
                width="100%"
                height="100%"
                padding={80}
                enableCursor={true}
                enableTooltip={true}
                showPoints={true}
                showLines={true}
                xAxisComponent={{
                  title: 'Month',
                  showTitle: true,
                  titleFontSize: 13,
                  titleColor: '#6b7280',
                  titleFontWeight: 'normal',
                  showLabels: true,
                  labelColor: '#9ca3af',
                }}
                yAxisComponent={{
                  title: 'Sales ($K)',
                  showTitle: true,
                  titleFontSize: 13,
                  titleColor: '#6b7280',
                  titleFontWeight: 'normal',
                  titleRotation: -90,
                  showLabels: true,
                  labelColor: '#9ca3af',
                }}
              />
            </div>
            </div>
          </section>

          {/* Smooth Curves with Area Fill */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">🌊 Smooth Curves with Area Fill</h2>
            <p className="text-gray-600 mb-6">Smooth bezier curves with gradient area fill and enhanced tooltips.</p>
            <div className="bg-white rounded-lg shadow-lg p-6">
                          <div className="w-full h-96">
              <LineChart
                data={performanceData}
                title="Quarterly Performance"
                width="100%"
                height="100%"
                padding={85}
                enableCursor={true}
                enableTooltip={true}
                fillArea={true}
                fillOpacity={0.3}
                lineComponent={{
                  smooth: true,
                  lineWidth: 4,
                  color: '#10b981',
                  showShadow: true,
                  shadowColor: 'rgba(16, 185, 129, 0.3)',
                  shadowBlur: 8,
                }}
                pointComponent={{
                  size: 10,
                  shape: 'circle',
                  color: '#10b981',
                  fillColor: '#aaaaaa',
                  borderWidth: 3,
                  showShadow: true,
                }}
                cursorComponent={{
                  showHorizontalLine: true,
                  showVerticalLine: true,
                  snapToDataPoints: true,
                  horizontalLineColor: '#10b981',
                  verticalLineColor: '#10b981',
                  opacity: 0.8,
                }}
                tooltipComponent={{
                  backgroundColor: '#10b981',
                  textColor: '#ffffff',
                  borderRadius: 8,
                  padding: 12,
                  template: '📊 {label}: {value} units',
                  shadowBlur: 12,
                }}
                xAxisComponent={{
                  title: 'Quarter',
                  showTitle: true,
                  titleFontSize: 14,
                  titleColor: '#10b981',
                  titleFontWeight: 'bold',
                  titlePosition: 'center',
                  showLabels: true,
                  labelColor: '#374151',
                }}
                yAxisComponent={{
                  title: 'Performance Score',
                  showTitle: true,
                  titleFontSize: 14,
                  titleColor: '#10b981',
                  titleFontWeight: 'bold',
                  titleRotation: -90,
                  showLabels: true,
                  labelColor: '#374151',
                }}
              />
            </div>
            </div>
          </section>

          {/* Dashed Lines with Custom Points */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">💎 Dashed Lines with Diamond Points</h2>
            <p className="text-gray-600 mb-6">Dashed line style with diamond-shaped points and custom tooltip positioning.</p>
            <div className="bg-white rounded-lg shadow-lg p-6">
                          <div className="w-full h-96">
              <LineChart
                data={trendData}
                title="Weekly Growth Trend"
                width="100%"
                height="100%"
                padding={80}
                enableCursor={true}
                enableTooltip={true}
                lineComponent={{
                  lineDash: [15, 10],
                  lineWidth: 3,
                  color: '#f59e0b',
                  lineCap: 'round',
                }}
                pointComponent={{
                  shape: 'diamond',
                  size: 12,
                  color: '#f59e0b',
                  fillColor: '#fef3c7',
                  borderWidth: 2,
                  hollow: false,
                }}
                cursorComponent={{
                  showHorizontalLine: false,
                  showVerticalLine: true,
                  snapToDataPoints: true,
                  verticalLineColor: '#f59e0b',
                  verticalLineDash: [5, 5],
                }}
                tooltipComponent={{
                  position: 'top',
                  backgroundColor: '#f59e0b',
                  textColor: '#1f2937',
                  borderRadius: 6,
                  template: 'Week: {label} | Value: {value}%',
                }}
                xAxisComponent={{
                  title: 'Time Period',
                  showTitle: true,
                  titleFontSize: 12,
                  titleColor: '#d97706',
                  titleFontWeight: 'medium',
                  titlePosition: 'end',
                  showLabels: true,
                  labelColor: '#78716c',
                  labelFontSize: 10,
                }}
                yAxisComponent={{
                  title: 'Growth %',
                  showTitle: true,
                  titleFontSize: 12,
                  titleColor: '#d97706',
                  titleFontWeight: 'medium',
                  titleRotation: -90,
                  titlePosition: 'end',
                  showLabels: true,
                  labelColor: '#78716c',
                  labelFontSize: 10,
                }}
              />
            </div>
            </div>
          </section>

          {/* Real-time Streaming Data */}
          <StreamingTemperatureChart />

          {/* Multiple Styles in Grid */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">🎨 Style Variations</h2>
            <p className="text-gray-600 mb-6">Different visual styles applied to the same dataset, each with customized axis titles and labels.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Minimalist Style */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Minimalist Style</h3>
                <div className="w-full h-72">
                  <LineChart
                    data={monthlyData}
                    title="Clean & Simple"
                    width="100%"
                    height="100%"
                    padding={75}
                    enableCursor={true}
                    enableTooltip={true}
                    lineComponent={{
                      lineWidth: 2,
                      color: '#6b7280',
                    }}
                    pointComponent={{
                      size: 6,
                      shape: 'circle',
                      color: '#6b7280',
                      fillColor: '#ffffff',
                      borderWidth: 2,
                    }}
                    gridComponent={{
                      show: false,
                    }}
                    titleComponent={{
                      fontSize: 16,
                      color: '#374151',
                      fontWeight: 'normal',
                    }}
                    tooltipComponent={{
                      backgroundColor: '#1f2937',
                      textColor: '#ffffff',
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                    xAxisComponent={{
                      title: 'months',
                      showTitle: true,
                      titleFontSize: 11,
                      titleColor: '#9ca3af',
                      titleFontWeight: 'normal',
                      showLabels: true,
                      labelColor: '#d1d5db',
                      labelFontSize: 10,
                    }}
                    yAxisComponent={{
                      title: 'value',
                      showTitle: true,
                      titleFontSize: 11,
                      titleColor: '#9ca3af',
                      titleFontWeight: 'normal',
                      titleRotation: -90,
                      showLabels: true,
                      labelColor: '#d1d5db',
                      labelFontSize: 10,
                    }}
                  />
                </div>
              </div>

              {/* Vibrant Style */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Vibrant Style</h3>
                <div className="w-full h-72">
                  <LineChart
                    data={monthlyData}
                    title="Bold & Colorful"
                    width="100%"
                    height="100%"
                    padding={85}
                    enableCursor={true}
                    enableTooltip={true}
                    fillArea={true}
                    fillOpacity={0.2}
                    lineComponent={{
                      lineWidth: 4,
                      color: '#8b5cf6',
                      showShadow: true,
                      gradient: {
                        enabled: true,
                      },
                    }}
                    pointComponent={{
                      shape: 'star',
                      size: 14,
                      color: '#8b5cf6',
                      showShadow: true,
                    }}
                    titleComponent={{
                      fontSize: 18,
                      color: '#7c3aed',
                      fontWeight: 'bold',
                    }}
                    cursorComponent={{
                      horizontalLineColor: '#8b5cf6',
                      verticalLineColor: '#8b5cf6',
                      snapToDataPoints: true,
                    }}
                    tooltipComponent={{
                      backgroundColor: '#8b5cf6',
                      textColor: '#ffffff',
                      borderRadius: 12,
                      padding: 10,
                      template: '⭐ {label}: {value}',
                    }}
                    xAxisComponent={{
                      title: 'MONTHS',
                      showTitle: true,
                      titleFontSize: 13,
                      titleColor: '#7c3aed',
                      titleFontWeight: 'bold',
                      showLabels: true,
                      labelColor: '#a855f7',
                      labelFontSize: 11,
                    }}
                    yAxisComponent={{
                      title: 'SALES DATA',
                      showTitle: true,
                      titleFontSize: 13,
                      titleColor: '#7c3aed',
                      titleFontWeight: 'bold',
                      titleRotation: -90,
                      showLabels: true,
                      labelColor: '#a855f7',
                      labelFontSize: 11,
                    }}
                  />
                </div>
              </div>

              {/* Data Points Style */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Focus on Data Points</h3>
                <div className="w-full h-72">
                  <LineChart
                    data={performanceData}
                    title="Quarterly Data"
                    width="100%"
                    height="100%"
                    enableCursor={true}
                    enableTooltip={true}
                    showValues={true}
                    lineComponent={{
                      lineWidth: 1,
                      color: '#dc2626',
                      opacity: 0.5,
                    }}
                    pointComponent={{
                      shape: 'square',
                      size: 16,
                      color: '#dc2626',
                      fillColor: '#ffffff',
                      borderWidth: 3,
                      showShadow: true,
                    }}
                    labelComponent={{
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      borderRadius: 4,
                      padding: 4,
                      fontSize: 11,
                    }}
                    tooltipComponent={{
                      backgroundColor: '#dc2626',
                      textColor: '#ffffff',
                      template: 'Q{dataIndex + 1}: ${value}K revenue',
                    }}
                  />
                </div>
              </div>

              {/* No Fill, Crosses Style */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Scientific Style</h3>
                <div className="w-full h-72">
                  <LineChart
                    data={trendData}
                    title="Research Data"
                    width="100%"
                    height="100%"
                    enableCursor={true}
                    enableTooltip={true}
                    lineComponent={{
                      lineWidth: 2,
                      color: '#059669',
                      lineDash: [8, 4],
                    }}
                    pointComponent={{
                      shape: 'cross',
                      size: 12,
                      color: '#059669',
                      borderWidth: 3,
                    }}
                    gridComponent={{
                      color: '#d1d5db',
                      lineDash: [2, 2],
                      opacity: 0.5,
                    }}
                    cursorComponent={{
                      showHorizontalLine: true,
                      showVerticalLine: true,
                      horizontalLineDash: [3, 3],
                      verticalLineDash: [3, 3],
                      snapToDataPoints: false,
                    }}
                    tooltipComponent={{
                      backgroundColor: '#ffffff',
                      textColor: '#059669',
                      borderColor: '#059669',
                      borderWidth: 2,
                      borderRadius: 0,
                      template: 'Sample {dataIndex + 1}: {value} units',
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Advanced Tooltip Examples */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">💬 Advanced Tooltip Examples</h2>
            <p className="text-gray-600 mb-6">Different tooltip positioning and formatting options.</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Follow Cursor */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-3">Follow Cursor</h4>
                <div className="w-full h-48">
                  <LineChart
                    data={monthlyData.slice(0, 5)}
                    title="Follow Mode"
                    width="100%"
                    height="100%"
                    enableCursor={true}
                    enableTooltip={true}
                    tooltipComponent={{
                      position: 'follow',
                      backgroundColor: '#1f2937',
                      textColor: '#ffffff',
                      borderRadius: 8,
                      template: '📈 {label}: {value}',
                    }}
                  />
                </div>
              </div>

              {/* Fixed Position */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-3">Fixed Position</h4>
                <div className="w-full h-48">
                  <LineChart
                    data={monthlyData.slice(0, 5)}
                    title="Fixed Mode"
                    width="100%"
                    height="100%"
                    enableCursor={true}
                    enableTooltip={true}
                    tooltipComponent={{
                      position: 'fixed',
                      backgroundColor: '#3b82f6',
                      textColor: '#ffffff',
                      borderRadius: 6,
                      template: 'Current: {label} = {value}',
                    }}
                  />
                </div>
              </div>

              {/* Custom Formatter */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-3">Custom Formatter</h4>
                <div className="w-full h-48">
                  <LineChart
                    data={monthlyData.slice(0, 5)}
                    title="Custom Format"
                    width="100%"
                    height="100%"
                    enableCursor={true}
                    enableTooltip={true}
                    tooltipComponent={{
                      backgroundColor: '#10b981',
                      textColor: '#ffffff',
                      borderRadius: 12,
                      formatter: (dataPoint) => [
                        `Month: ${dataPoint.label}`,
                        `Sales: $${dataPoint.value}K`,
                        `Index: #${(dataPoint.dataIndex || 0) + 1}`
                      ],
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Features Summary */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-200">
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">🎮 Interactive Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-blue-800 mb-3">Cursor Options</h3>
                <ul className="text-blue-700 space-y-1 text-sm">
                  <li>✓ Horizontal/Vertical crosshairs</li>
                  <li>✓ Snap to data points</li>
                  <li>✓ Custom line colors & styles</li>
                  <li>✓ Adjustable opacity</li>
                  <li>✓ Custom dash patterns</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-800 mb-3">Tooltip Features</h3>
                <ul className="text-blue-700 space-y-1 text-sm">
                  <li>✓ Multiple positioning modes</li>
                  <li>✓ Custom templates & formatters</li>
                  <li>✓ Styled backgrounds & borders</li>
                  <li>✓ Automatic boundary detection</li>
                  <li>✓ Multi-line content support</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}; 