import {
  ChartBarSeries,
  ChartXAxis,
  ChartYAxis,
  ChartGridLayer,
  ChartCursorLayer,
  ChartTooltipLayer,
  ChartLegend,
  ChartSurface
} from 'react-canvas-charts'

const data = [
  { month: 'Jan', sales: 4500, target: 5000 },
  { month: 'Feb', sales: 5200, target: 5500 },
  { month: 'Mar', sales: 4800, target: 5200 },
  { month: 'Apr', sales: 6100, target: 6000 },
  { month: 'May', sales: 5800, target: 6200 },
  { month: 'Jun', sales: 7200, target: 6500 },
  { month: 'Jul', sales: 6800, target: 7000 },
  { month: 'Aug', sales: 7500, target: 7200 },
  { month: 'Sep', sales: 7100, target: 7500 },
  { month: 'Oct', sales: 8200, target: 8000 },
  { month: 'Nov', sales: 8900, target: 8500 },
  { month: 'Dec', sales: 9500, target: 9000 }
]

// Default: Overlapping bars (use opacity to see both)
export const BarChartExample = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ChartSurface
        data={data}
        xKey="month"
        xAxisType="categorical"
        width="100%"
        height="100%"
        margin={{ top: 50, right: 20, bottom: 60, left: 60 }}
      >
        <ChartGridLayer showHorizontal showVertical={false} />
        <ChartXAxis show title="Month" showTitle />
        <ChartYAxis show title="Sales ($)" showTitle titleRotation={-90} />
        <ChartBarSeries dataKey="sales" color="#3b82f6" barGap={8} />
        <ChartBarSeries dataKey="target" color="#94a3b8" opacity={0.5} barGap={8} />
        <ChartCursorLayer snapToDataPoints />
        <ChartTooltipLayer />
        <ChartLegend
          placement={{ position: 'top-center' }}
          items={[
            { label: 'Sales', color: '#3b82f6' },
            { label: 'Target', color: '#94a3b8' }
          ]}
        />
      </ChartSurface>
    </div>
  )
}

// Stacked bars: Use baseline to stack on top of another series
export const StackedBarChartExample = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ChartSurface
        data={data}
        xKey="month"
        xAxisType="categorical"
        width="100%"
        height="100%"
        margin={{ top: 50, right: 20, bottom: 60, left: 60 }}
      >
        <ChartGridLayer showHorizontal showVertical={false} />
        <ChartXAxis show title="Month" showTitle />
        <ChartYAxis show title="Total ($)" showTitle titleRotation={-90} />
        {/* Stack target on top of sales */}
        <ChartBarSeries dataKey="sales" color="#3b82f6" barGap={8} />
        <ChartBarSeries dataKey="target" color="#10b981" barGap={8} baseline="sales" />
        <ChartCursorLayer snapToDataPoints />
        <ChartTooltipLayer />
        <ChartLegend
          placement={{ position: 'top-center' }}
          items={[
            { label: 'Sales', color: '#3b82f6' },
            { label: 'Target (stacked)', color: '#10b981' }
          ]}
        />
      </ChartSurface>
    </div>
  )
}

export const barChartCode = `import {
  ChartSurface,
  ChartBarSeries,
  ChartXAxis,
  ChartYAxis,
  ChartGridLayer,
  ChartCursorLayer,
  ChartTooltipLayer,
  ChartLegend
} from '@repo/chart-components';

const data = [
  { month: 'Jan', sales: 4500, target: 5000 },
  { month: 'Feb', sales: 5200, target: 5500 },
  { month: 'Mar', sales: 4800, target: 5200 },
  { month: 'Apr', sales: 6100, target: 6000 },
  { month: 'May', sales: 5800, target: 6200 },
  { month: 'Jun', sales: 7200, target: 6500 }
];

// Overlapping bars (use opacity)
<ChartSurface 
  data={data} 
  xKey="month" 
  xAxisType="categorical"
  width="100%" 
  height="100%"
  margin={{ top: 50, right: 20, bottom: 60, left: 60 }}
>
  <ChartGridLayer showHorizontal showVertical={false} />
  <ChartXAxis show title="Month" showTitle />
  <ChartYAxis show title="Sales ($)" showTitle titleRotation={-90} />
  <ChartBarSeries dataKey="sales" color="#3b82f6" barGap={8} />
  <ChartBarSeries dataKey="target" color="#94a3b8" opacity={0.5} barGap={8} />
  <ChartCursorLayer snapToDataPoints />
  <ChartTooltipLayer />
  <ChartLegend
    placement={{ position: 'top-center' }}
    items={[
      { label: 'Sales', color: '#3b82f6' },
      { label: 'Target', color: '#94a3b8' }
    ]}
  />
</ChartSurface>

// Stacked bars (use baseline prop)
<ChartSurface 
  data={data} 
  xKey="month" 
  xAxisType="categorical"
  width="100%" 
  height="100%"
  margin={{ top: 50, right: 20, bottom: 60, left: 60 }}
>
  <ChartGridLayer showHorizontal showVertical={false} />
  <ChartXAxis show title="Month" showTitle />
  <ChartYAxis show title="Total ($)" showTitle titleRotation={-90} />
  {/* baseline="sales" makes this bar start where sales ends */}
  <ChartBarSeries dataKey="sales" color="#3b82f6" barGap={8} />
  <ChartBarSeries dataKey="target" color="#10b981" barGap={8} baseline="sales" />
  <ChartCursorLayer snapToDataPoints />
  <ChartTooltipLayer />
  <ChartLegend
    placement={{ position: 'top-center' }}
    items={[
      { label: 'Sales', color: '#3b82f6' },
      { label: 'Target (stacked)', color: '#10b981' }
    ]}
  />
</ChartSurface>`
