import React, { useMemo } from 'react'
import {
  ChartSurface,
  ChartLineSeries,
  ChartPointSeries,
  ChartXAxis,
  ChartYAxis,
  ChartGridLayer,
  ChartCursorLayer,
  ChartTooltipLayer,
  ChartTitleLayer
} from 'react-canvas-charts'

interface DataPoint {
  label: string
  value: number
  [key: string]: string | number
}

export const LineChartExample: React.FC = () => {
  const lineData = useMemo<DataPoint[]>(
    () => [
      { label: 'Jan', value: 65 },
      { label: 'Feb', value: 72 },
      { label: 'Mar', value: 68 },
      { label: 'Apr', value: 85 },
      { label: 'May', value: 92 },
      { label: 'Jun', value: 88 },
      { label: 'Jul', value: 95 },
      { label: 'Aug', value: 90 },
      { label: 'Sep', value: 82 },
      { label: 'Oct', value: 78 },
      { label: 'Nov', value: 75 },
      { label: 'Dec', value: 80 }
    ],
    []
  )

  return (
    <ChartSurface
      data={lineData}
      xKey="label"
      yKeys={['value']}
      width="100%"
      height="100%"
      margin={{ top: 40, right: 20, bottom: 60, left: 60 }}
      backgroundColor="#ffffff"
    >
      <ChartTitleLayer title="Monthly Sales Data" />
      <ChartGridLayer show alignWithXAxisTicks color="#e5e7eb" />
      <ChartXAxis show title="Month" showTitle />
      <ChartYAxis show title="Sales ($)" showTitle titleRotation={-90} />
      <ChartLineSeries dataKey="value" color="#3b82f6" lineWidth={2} />
      <ChartPointSeries dataKey="value" color="#3b82f6" size={4} />
      <ChartCursorLayer snapToDataPoints />
      <ChartTooltipLayer seriesLabels={{ value: 'Sales' }} />
    </ChartSurface>
  )
}

export const lineChartCode = `const data = [
  { label: 'Jan', value: 65 },
  { label: 'Feb', value: 72 },
  // ... more data
]

<ChartSurface
  data={data}
  xKey="label"
  yKeys={['value']}
  width="100%"
  height="100%"
  margin={{ top: 40, right: 20, bottom: 50, left: 60 }}
>
  <ChartTitleLayer title="Monthly Sales Data" />
  <ChartGridLayer show alignWithXAxisTicks color="#e5e7eb" />
  <ChartXAxis show title="Month" showTitle />
  <ChartYAxis show title="Sales ($)" showTitle titleRotation={-90} />
  <ChartLineSeries dataKey="value" color="#3b82f6" lineWidth={2} />
  <ChartPointSeries dataKey="value" color="#3b82f6" size={4} />
  <ChartCursorLayer snapToDataPoints />
  <ChartTooltipLayer seriesLabels={{ value: 'Sales' }} />
</ChartSurface>`
