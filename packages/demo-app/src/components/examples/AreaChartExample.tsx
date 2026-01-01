import React, { useMemo } from 'react'
import {
  ChartSurface,
  ChartLineSeries,
  ChartAreaSeries,
  ChartXAxis,
  ChartYAxis,
  ChartGridLayer,
  ChartCursorLayer,
  ChartTooltipLayer,
  ChartTitleLayer,
  ChartLegend
} from 'react-canvas-charts'

interface DataPoint {
  label: string
  [key: string]: string | number
}

export const AreaChartExample: React.FC = () => {
  const areaData = useMemo<DataPoint[]>(
    () => [
      { label: 'Q1', revenue: 125, expenses: 85 },
      { label: 'Q2', revenue: 148, expenses: 95 },
      { label: 'Q3', revenue: 162, expenses: 105 },
      { label: 'Q4', revenue: 185, expenses: 115 },
      { label: 'Q5', revenue: 178, expenses: 120 },
      { label: 'Q6', revenue: 195, expenses: 125 },
      { label: 'Q7', revenue: 210, expenses: 135 },
      { label: 'Q8', revenue: 198, expenses: 140 }
    ],
    []
  )

  return (
    <ChartSurface
      data={areaData}
      xKey="label"
      yKeys={['revenue', 'expenses']}
      width="100%"
      height="100%"
      margin={{ top: 40, right: 20, bottom: 60, left: 60 }}
      backgroundColor="#ffffff"
    >
      <ChartTitleLayer title="Revenue vs Expenses" />
      <ChartGridLayer show alignWithXAxisTicks color="#e5e7eb" />
      <ChartXAxis show title="Quarter" showTitle />
      <ChartYAxis show title="Amount ($K)" showTitle titleRotation={-90} />
      <ChartAreaSeries dataKey="expenses" color="#ef4444" opacity={0.5} />
      <ChartAreaSeries dataKey="revenue" color="#10b981" opacity={0.5} baseline="expenses" />
      <ChartLineSeries dataKey="expenses" color="#ef4444" lineWidth={2} />
      <ChartLineSeries dataKey="revenue" color="#10b981" lineWidth={2} />
      <ChartCursorLayer snapToDataPoints />
      <ChartTooltipLayer seriesLabels={{ revenue: 'Revenue', expenses: 'Expenses' }} />
      <ChartLegend
        items={[
          { dataKey: 'revenue', label: 'Revenue', color: '#10b981' },
          { dataKey: 'expenses', label: 'Expenses', color: '#ef4444' }
        ]}
      />
    </ChartSurface>
  )
}

export const areaChartCode = `const data = [
  { label: 'Q1', revenue: 125, expenses: 85 },
  { label: 'Q2', revenue: 148, expenses: 95 },
  // ... more data
]

<ChartSurface
  data={data}
  xKey="label"
  yKeys={['revenue', 'expenses']}
  width="100%"
  height="100%"
  margin={{ top: 40, right: 20, bottom: 50, left: 60 }}
>
  <ChartTitleLayer title="Revenue vs Expenses" />
  <ChartGridLayer show alignWithXAxisTicks color="#e5e7eb" />
  <ChartXAxis show title="Quarter" showTitle />
  <ChartYAxis show title="Amount ($K)" showTitle titleRotation={-90} />
  <ChartAreaSeries dataKey="expenses" color="#ef4444" opacity={0.5} />
  <ChartAreaSeries dataKey="revenue" color="#10b981" opacity={0.5} baseline="expenses" />
  <ChartLineSeries dataKey="expenses" color="#ef4444" lineWidth={2} />
  <ChartLineSeries dataKey="revenue" color="#10b981" lineWidth={2} />
  <ChartCursorLayer snapToDataPoints />
  <ChartTooltipLayer seriesLabels={{ revenue: 'Revenue', expenses: 'Expenses' }} />
  <ChartLegend items={[
    { dataKey: 'revenue', label: 'Revenue', color: '#10b981' },
    { dataKey: 'expenses', label: 'Expenses', color: '#ef4444' }
  ]} />
</ChartSurface>`
