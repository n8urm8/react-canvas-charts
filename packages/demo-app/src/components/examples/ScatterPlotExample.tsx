import React, { useMemo } from 'react'
import {
  ChartCursorLayer,
  ChartGridLayer,
  ChartLegend,
  ChartPointSeries,
  ChartSurface,
  ChartTitleLayer,
  ChartTooltipLayer,
  ChartXAxis,
  ChartYAxis
} from 'react-canvas-charts'

interface ScatterDataPoint {
  x: number
  y1: number
  y2: number
  y3: number
  [key: string]: number
}

export const ScatterPlotExample: React.FC = () => {
  const scatterData = useMemo<ScatterDataPoint[]>(() => {
    // Generate random scatter plot data for three series
    const data: ScatterDataPoint[] = []

    for (let i = 0; i < 50; i++) {
      data.push({
        x: Math.round(Math.random() * 100),
        y1: Math.round(Math.random() * 80 + 10),
        y2: Math.round(Math.random() * 60 + 30),
        y3: Math.round(Math.random() * 70 + 20)
      })
    }

    return data.sort((a, b) => a.x - b.x)
  }, [])

  return (
    <ChartSurface
      data={scatterData}
      xKey="x"
      yKeys={['y1', 'y2', 'y3']}
      width="100%"
      height="100%"
      margin={{ top: 50, right: 20, bottom: 60, left: 60 }}
      backgroundColor="#ffffff"
    >
      <ChartTitleLayer title="Scatter Plot - Multiple Series" />
      <ChartGridLayer show color="#e5e7eb" />
      <ChartXAxis show title="X Value" showTitle maxTicks={10} />
      <ChartYAxis show title="Y Value" showTitle titleRotation={-90} />

      {/* Series 1: Circles */}
      <ChartPointSeries dataKey="y1" color="#3b82f6" fillColor="#3b82f6" size={6} shape="circle" opacity={0.7} />

      {/* Series 2: Triangles */}
      <ChartPointSeries dataKey="y2" color="#10b981" fillColor="#10b981" size={6} shape="triangle" opacity={0.7} />

      {/* Series 3: Squares */}
      <ChartPointSeries dataKey="y3" color="#f59e0b" fillColor="#f59e0b" size={6} shape="square" opacity={0.7} />

      <ChartCursorLayer snapToDataPoints snapAlongYAxis />
      <ChartTooltipLayer
        snapAlongYAxis
        seriesLabels={{
          y1: 'Series A',
          y2: 'Series B',
          y3: 'Series C'
        }}
      />

      <ChartLegend
        placement={{ position: 'top-right' }}
        items={[
          { label: 'Series A', color: '#3b82f6' },
          { label: 'Series B', color: '#10b981' },
          { label: 'Series C', color: '#f59e0b' }
        ]}
      />
    </ChartSurface>
  )
}

export const scatterPlotCode = `import {
  ChartSurface,
  ChartPointSeries,
  ChartXAxis,
  ChartYAxis,
  ChartGridLayer,
  ChartCursorLayer,
  ChartTooltipLayer,
  ChartTitleLayer,
  ChartLegend
} from '@repo/chart-components';

// Scatter data with x and multiple y values
const data = [
  { x: 12, y1: 45, y2: 55, y3: 38 },
  { x: 25, y1: 62, y2: 48, y3: 52 },
  { x: 38, y1: 55, y2: 70, y3: 65 },
  { x: 47, y1: 78, y2: 62, y3: 58 },
  { x: 55, y1: 68, y2: 75, y3: 72 },
  // ... more data points
];

<ChartSurface
  data={data}
  xKey="x"
  yKeys={['y1', 'y2', 'y3']}
  width="100%"
  height="100%"
  margin={{ top: 50, right: 20, bottom: 60, left: 60 }}
>
  <ChartTitleLayer title="Scatter Plot - Multiple Series" />
  <ChartGridLayer show color="#e5e7eb" />
  <ChartXAxis show title="X Value" showTitle maxTicks={10} />
  <ChartYAxis show title="Y Value" showTitle titleRotation={-90} />
  
  {/* Different shapes for each series */}
  <ChartPointSeries 
    dataKey="y1" 
    color="#3b82f6" 
    fillColor="#3b82f6"
    size={6} 
    shape="circle"
    opacity={0.7}
  />
  
  <ChartPointSeries 
    dataKey="y2" 
    color="#10b981" 
    fillColor="#10b981"
    size={6} 
    shape="triangle"
    opacity={0.7}
  />
  
  <ChartPointSeries 
    dataKey="y3" 
    color="#f59e0b" 
    fillColor="#f59e0b"
    size={6} 
    shape="square"
    opacity={0.7}
  />
  
  <ChartCursorLayer snapToDataPoints snapAlongYAxis />
  <ChartTooltipLayer 
    snapAlongYAxis
    seriesLabels={{ 
      y1: 'Series A', 
      y2: 'Series B', 
      y3: 'Series C' 
    }} 
  />
  
  <ChartLegend
    placement={{ position: 'top-right' }}
    items={[
      { label: 'Series A', color: '#3b82f6' },
      { label: 'Series B', color: '#10b981' },
      { label: 'Series C', color: '#f59e0b' }
    ]}
  />
</ChartSurface>`
