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
  { category: 'Product A', sales: 4500, target: 5000 },
  { category: 'Product B', sales: 5200, target: 5500 },
  { category: 'Product C', sales: 4800, target: 5200 },
  { category: 'Product D', sales: 6100, target: 6000 },
  { category: 'Product E', sales: 5800, target: 6200 },
  { category: 'Product F', sales: 7200, target: 6500 }
]

// Horizontal Bar Chart Example
export const HorizontalBarChartExample = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ChartSurface
        data={data}
        xKey="category"
        xAxisType="categorical"
        width="100%"
        height="100%"
        margin={{ top: 50, right: 20, bottom: 60, left: 100 }}
      >
        <ChartGridLayer showHorizontal={false} showVertical />
        <ChartYAxis show title="Product" showTitle titleRotation={-90} categorical />
        <ChartXAxis show title="Sales ($)" showTitle valueScale />
        <ChartBarSeries dataKey="sales" color="#3b82f6" barGap={8} orientation="horizontal" />
        <ChartBarSeries dataKey="target" color="#94a3b8" opacity={0.5} barGap={8} orientation="horizontal" />
        <ChartCursorLayer orientation="horizontal" snapToDataPoints />
        <ChartTooltipLayer orientation="horizontal" />
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

// Grouped Horizontal Bar Chart
export const GroupedHorizontalBarChartExample = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ChartSurface
        data={data}
        xKey="category"
        xAxisType="categorical"
        width="100%"
        height="100%"
        margin={{ top: 50, right: 20, bottom: 60, left: 100 }}
      >
        <ChartGridLayer showHorizontal={false} showVertical />
        <ChartYAxis show title="Product" showTitle titleRotation={-90} categorical />
        <ChartXAxis show title="Amount ($)" showTitle valueScale />

        {/* Grouped horizontal bars using seriesIndex and totalSeries */}
        <ChartBarSeries
          dataKey="sales"
          color="#3b82f6"
          seriesIndex={0}
          totalSeries={2}
          groupGap={4}
          barGap={20}
          orientation="horizontal"
        />
        <ChartBarSeries
          dataKey="target"
          color="#10b981"
          seriesIndex={1}
          totalSeries={2}
          groupGap={4}
          barGap={20}
          orientation="horizontal"
        />

        <ChartCursorLayer orientation="horizontal" snapToDataPoints />
        <ChartTooltipLayer orientation="horizontal" />
        <ChartLegend
          placement={{ position: 'top-center' }}
          items={[
            { label: 'Sales', color: '#3b82f6' },
            { label: 'Target', color: '#10b981' }
          ]}
        />
      </ChartSurface>
    </div>
  )
}

// Stacked Horizontal Bar Chart
export const StackedHorizontalBarChartExample = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ChartSurface
        data={data}
        xKey="category"
        xAxisType="categorical"
        width="100%"
        height="100%"
        margin={{ top: 50, right: 20, bottom: 60, left: 100 }}
      >
        <ChartGridLayer showHorizontal={false} showVertical />
        <ChartYAxis show title="Product" showTitle titleRotation={-90} categorical />
        <ChartXAxis show title="Total ($)" showTitle valueScale />

        {/* Stack bars by using baseline property */}
        <ChartBarSeries dataKey="sales" color="#3b82f6" barGap={8} orientation="horizontal" />
        <ChartBarSeries dataKey="target" color="#10b981" barGap={8} baseline="sales" orientation="horizontal" />

        <ChartCursorLayer orientation="horizontal" snapToDataPoints />
        <ChartTooltipLayer orientation="horizontal" />
        <ChartLegend
          placement={{ position: 'top-center' }}
          items={[
            { label: 'Sales', color: '#3b82f6' },
            { label: 'Target', color: '#10b981' }
          ]}
        />
      </ChartSurface>
    </div>
  )
}

export const horizontalBarChartCode = `import {
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
  { category: 'Product A', sales: 4500, target: 5000 },
  { category: 'Product B', sales: 5200, target: 5500 },
  { category: 'Product C', sales: 4800, target: 5200 },
  { category: 'Product D', sales: 6100, target: 6000 },
  { category: 'Product E', sales: 5800, target: 6200 },
  { category: 'Product F', sales: 7200, target: 6500 }
];

// Basic Horizontal Bar Chart
<ChartSurface 
  data={data} 
  xKey="category" 
  xAxisType="categorical"
  width="100%" 
  height="100%"
  margin={{ top: 50, right: 20, bottom: 60, left: 100 }}
>
  <ChartGridLayer showHorizontal={false} showVertical />
  <ChartYAxis show title="Product" showTitle titleRotation={-90} categorical />
  <ChartXAxis show title="Sales ($)" showTitle valueScale />
  <ChartBarSeries dataKey="sales" color="#3b82f6" barGap={8} orientation="horizontal" />
  <ChartBarSeries dataKey="target" color="#94a3b8" opacity={0.5} barGap={8} orientation="horizontal" />
  <ChartCursorLayer orientation="horizontal" snapToDataPoints />
  <ChartTooltipLayer orientation="horizontal" />
  <ChartLegend
    placement={{ position: 'top-center' }}
    items={[
      { label: 'Sales', color: '#3b82f6' },
      { label: 'Target', color: '#94a3b8' }
    ]}
  />
</ChartSurface>

// Grouped Horizontal Bars
<ChartSurface 
  data={data} 
  xKey="category" 
  xAxisType="categorical"
  width="100%" 
  height="100%"
  margin={{ top: 50, right: 20, bottom: 60, left: 100 }}
>
  <ChartGridLayer showHorizontal={false} showVertical />
  <ChartYAxis show title="Product" showTitle titleRotation={-90} categorical />
  <ChartXAxis show title="Amount ($)" showTitle valueScale />
  <ChartBarSeries 
    dataKey="sales" 
    color="#3b82f6" 
    seriesIndex={0} 
    totalSeries={2} 
    groupGap={4} 
    barGap={20}
    orientation="horizontal"
  />
  <ChartBarSeries 
    dataKey="target" 
    color="#10b981" 
    seriesIndex={1} 
    totalSeries={2} 
    groupGap={4} 
    barGap={20}
    orientation="horizontal"
  />
  <ChartCursorLayer orientation="horizontal" snapToDataPoints />
  <ChartTooltipLayer orientation="horizontal" />
  <ChartLegend
    placement={{ position: 'top-center' }}
    items={[
      { label: 'Sales', color: '#3b82f6' },
      { label: 'Target', color: '#10b981' }
    ]}
  />
</ChartSurface>`
