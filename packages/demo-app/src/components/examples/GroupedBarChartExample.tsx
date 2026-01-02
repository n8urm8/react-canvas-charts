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
  { month: 'Jan', sales: 4500, target: 5000, forecast: 4800 },
  { month: 'Feb', sales: 5200, target: 5500, forecast: 5300 },
  { month: 'Mar', sales: 4800, target: 5200, forecast: 5100 },
  { month: 'Apr', sales: 6100, target: 6000, forecast: 6200 },
  { month: 'May', sales: 5800, target: 6200, forecast: 6000 },
  { month: 'Jun', sales: 7200, target: 6500, forecast: 7000 }
]

// Grouped Bar Chart Example (bars side-by-side)
export const GroupedBarChartExample = () => {
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
        <ChartYAxis show title="Amount ($)" showTitle titleRotation={-90} />

        {/* Grouped bars using seriesIndex and totalSeries */}
        <ChartBarSeries dataKey="sales" color="#3b82f6" seriesIndex={0} totalSeries={3} groupGap={4} barGap={20} />
        <ChartBarSeries dataKey="target" color="#10b981" seriesIndex={1} totalSeries={3} groupGap={4} barGap={20} />
        <ChartBarSeries dataKey="forecast" color="#f59e0b" seriesIndex={2} totalSeries={3} groupGap={4} barGap={20} />

        <ChartCursorLayer snapToDataPoints />
        <ChartTooltipLayer />
        <ChartLegend
          placement={{ position: 'top-center' }}
          items={[
            { label: 'Sales', color: '#3b82f6' },
            { label: 'Target', color: '#10b981' },
            { label: 'Forecast', color: '#f59e0b' }
          ]}
        />
      </ChartSurface>
    </div>
  )
}

// Stacked Bar Chart Example (bars on top of each other)
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
        <ChartYAxis show title="Amount ($)" showTitle titleRotation={-90} />

        {/* Stack bars by using baseline property */}
        <ChartBarSeries dataKey="sales" color="#3b82f6" barGap={8} />
        <ChartBarSeries dataKey="target" color="#10b981" barGap={8} baseline="sales" />
        <ChartBarSeries dataKey="forecast" color="#f59e0b" barGap={8} baseline="target" />

        <ChartCursorLayer snapToDataPoints />
        <ChartTooltipLayer />
        <ChartLegend
          placement={{ position: 'top-center' }}
          items={[
            { label: 'Sales', color: '#3b82f6' },
            { label: 'Target', color: '#10b981' },
            { label: 'Forecast', color: '#f59e0b' }
          ]}
        />
      </ChartSurface>
    </div>
  )
}

export const groupedBarChartCode = `import {
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
  { month: 'Jan', sales: 4500, target: 5000, forecast: 4800 },
  { month: 'Feb', sales: 5200, target: 5500, forecast: 5300 },
  { month: 'Mar', sales: 4800, target: 5200, forecast: 5100 },
  { month: 'Apr', sales: 6100, target: 6000, forecast: 6200 },
  { month: 'May', sales: 5800, target: 6200, forecast: 6000 },
  { month: 'Jun', sales: 7200, target: 6500, forecast: 7000 }
];

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
  <ChartYAxis show title="Amount ($)" showTitle titleRotation={-90} />
  
  {/* Grouped bars: use seriesIndex and totalSeries props */}
  <ChartBarSeries 
    dataKey="sales" 
    color="#3b82f6" 
    seriesIndex={0}
    totalSeries={3}
    groupGap={4}
    barGap={20}
  />
  <ChartBarSeries 
    dataKey="target" 
    color="#10b981" 
    seriesIndex={1}
    totalSeries={3}
    groupGap={4}
    barGap={20}
  />
  <ChartBarSeries 
    dataKey="forecast" 
    color="#f59e0b" 
    seriesIndex={2}
    totalSeries={3}
    groupGap={4}
    barGap={20}
  />
  
  <ChartCursorLayer snapToDataPoints />
  <ChartTooltipLayer />
  <ChartLegend
    placement={{ position: 'top-center' }}
    items={[
      { label: 'Sales', color: '#3b82f6' },
      { label: 'Target', color: '#10b981' },
      { label: 'Forecast', color: '#f59e0b' }
    ]}
  />
</ChartSurface>`

export const stackedBarChartCode = `import {
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
  { month: 'Jan', sales: 4500, target: 5000, forecast: 4800 },
  { month: 'Feb', sales: 5200, target: 5500, forecast: 5300 },
  { month: 'Mar', sales: 4800, target: 5200, forecast: 5100 },
  { month: 'Apr', sales: 6100, target: 6000, forecast: 6200 },
  { month: 'May', sales: 5800, target: 6200, forecast: 6000 },
  { month: 'Jun', sales: 7200, target: 6500, forecast: 7000 }
];

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
  <ChartYAxis show title="Amount ($)" showTitle titleRotation={-90} />
  
  {/* Stack bars using baseline property */}
  <ChartBarSeries dataKey="sales" color="#3b82f6" barGap={8} />
  <ChartBarSeries dataKey="target" color="#10b981" barGap={8} baseline="sales" />
  <ChartBarSeries dataKey="forecast" color="#f59e0b" barGap={8} baseline="target" />
  
  <ChartCursorLayer snapToDataPoints />
  <ChartTooltipLayer />
  <ChartLegend
    placement={{ position: 'top-center' }}
    items={[
      { label: 'Sales', color: '#3b82f6' },
      { label: 'Target', color: '#10b981' },
      { label: 'Forecast', color: '#f59e0b' }
    ]}
  />
</ChartSurface>`
