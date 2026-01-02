import React, { useMemo } from 'react'
import {
  ChartSurface,
  ChartPointSeries,
  ChartXAxis,
  ChartYAxis,
  ChartGridLayer,
  ChartCursorLayer,
  ChartTooltipLayer,
  ChartTitleLayer,
  ChartLegend
} from 'react-canvas-charts'

interface BubbleDataPoint {
  x: number
  y1: number
  y2: number
  y3: number
  size1: number
  size2: number
  size3: number
  [key: string]: number
}

export const BubblePlotExample: React.FC = () => {
  const bubbleData = useMemo<BubbleDataPoint[]>(() => {
    // Generate random bubble plot data for three series
    const data: BubbleDataPoint[] = []

    for (let i = 0; i < 30; i++) {
      data.push({
        x: Math.round(Math.random() * 100),
        y1: Math.round(Math.random() * 80 + 10),
        y2: Math.round(Math.random() * 60 + 30),
        y3: Math.round(Math.random() * 70 + 20),
        size1: Math.round(Math.random() * 50 + 10),
        size2: Math.round(Math.random() * 40 + 15),
        size3: Math.round(Math.random() * 60 + 5)
      })
    }

    return data.sort((a, b) => a.x - b.x)
  }, [])

  return (
    <ChartSurface
      data={bubbleData}
      xKey="x"
      yKeys={['y1', 'y2', 'y3']}
      width="100%"
      height="100%"
      margin={{ top: 50, right: 20, bottom: 60, left: 60 }}
      backgroundColor="#ffffff"
    >
      <ChartTitleLayer title="Bubble Plot - Variable Sizes" />
      <ChartGridLayer show color="#e5e7eb" />
      <ChartXAxis show title="X Value" showTitle maxTicks={10} />
      <ChartYAxis show title="Y Value" showTitle titleRotation={-90} />

      {/* Bubble series with different sizes based on data */}
      <ChartPointSeries
        dataKey="y1"
        sizeKey="size1"
        minSize={4}
        maxSize={25}
        color="#3b82f6"
        fillColor="#3b82f680"
        borderColor="#3b82f6"
        borderWidth={2}
        shape="circle"
      />
      <ChartPointSeries
        dataKey="y2"
        sizeKey="size2"
        minSize={4}
        maxSize={25}
        color="#10b981"
        fillColor="#10b98180"
        borderColor="#10b981"
        borderWidth={2}
        shape="circle"
      />
      <ChartPointSeries
        dataKey="y3"
        sizeKey="size3"
        minSize={4}
        maxSize={25}
        color="#f59e0b"
        fillColor="#f59e0b80"
        borderColor="#f59e0b"
        borderWidth={2}
        shape="circle"
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
        items={[
          { label: 'Series A', color: '#3b82f6' },
          { label: 'Series B', color: '#10b981' },
          { label: 'Series C', color: '#f59e0b' }
        ]}
      />
    </ChartSurface>
  )
}

export const bubblePlotCode = `import {
  ChartSurface,
  ChartPointSeries,
  ChartXAxis,
  ChartYAxis,
  ChartGridLayer,
  ChartCursorLayer,
  ChartTooltipLayer,
  ChartTitleLayer,
  ChartLegend
} from 'react-canvas-charts'

<ChartSurface
  data={bubbleData}
  xKey="x"
  yKeys={['y1', 'y2', 'y3']}
  width="100%"
  height="100%"
  margin={{ top: 50, right: 20, bottom: 60, left: 60 }}
>
  <ChartTitleLayer title="Bubble Plot - Variable Sizes" />
  <ChartGridLayer show color="#e5e7eb" />
  <ChartXAxis show title="X Value" showTitle maxTicks={10} />
  <ChartYAxis show title="Y Value" showTitle titleRotation={-90} />
  
  {/* Use sizeKey to map bubble sizes to data values */}
  <ChartPointSeries 
    dataKey="y1" 
    sizeKey="size1"
    minSize={4}
    maxSize={25}
    color="#3b82f6" 
    fillColor="#3b82f680"
    borderColor="#3b82f6"
    borderWidth={2}
    shape="circle"
  />
  <ChartPointSeries 
    dataKey="y2" 
    sizeKey="size2"
    minSize={4}
    maxSize={25}
    color="#10b981" 
    fillColor="#10b98180"
    borderColor="#10b981"
    borderWidth={2}
    shape="circle"
  />
  <ChartPointSeries 
    dataKey="y3" 
    sizeKey="size3"
    minSize={4}
    maxSize={25}
    color="#f59e0b" 
    fillColor="#f59e0b80"
    borderColor="#f59e0b"
    borderWidth={2}
    shape="circle"
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
    items={[
      { label: 'Series A', color: '#3b82f6' },
      { label: 'Series B', color: '#10b981' },
      { label: 'Series C', color: '#f59e0b' }
    ]}
    position="bottom"
  />
</ChartSurface>`
