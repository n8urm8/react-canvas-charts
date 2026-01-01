import {
  SparkSurface,
  ChartLineSeries,
  ChartAreaSeries,
  ChartCursorLayer,
  ChartTooltipLayer
} from 'react-canvas-charts'

// Sample data for different metrics
const salesData = [
  { x: 0, value: 45 },
  { x: 1, value: 52 },
  { x: 2, value: 48 },
  { x: 3, value: 65 },
  { x: 4, value: 58 },
  { x: 5, value: 70 },
  { x: 6, value: 75 },
  { x: 7, value: 82 },
  { x: 8, value: 78 },
  { x: 9, value: 88 },
  { x: 10, value: 92 },
  { x: 11, value: 95 }
]

const userGrowthData = [
  { x: 0, value: 120 },
  { x: 1, value: 135 },
  { x: 2, value: 128 },
  { x: 3, value: 142 },
  { x: 4, value: 155 },
  { x: 5, value: 168 },
  { x: 6, value: 182 },
  { x: 7, value: 195 },
  { x: 8, value: 210 },
  { x: 9, value: 225 },
  { x: 10, value: 242 },
  { x: 11, value: 258 }
]

const revenueData = [
  { x: 0, value: 5200 },
  { x: 1, value: 5800 },
  { x: 2, value: 6100 },
  { x: 3, value: 5900 },
  { x: 4, value: 6500 },
  { x: 5, value: 7200 },
  { x: 6, value: 7800 },
  { x: 7, value: 8100 },
  { x: 8, value: 8500 },
  { x: 9, value: 9200 },
  { x: 10, value: 9800 },
  { x: 11, value: 10500 }
]

const engagementData = [
  { x: 0, value: 65 },
  { x: 1, value: 68 },
  { x: 2, value: 70 },
  { x: 3, value: 67 },
  { x: 4, value: 72 },
  { x: 5, value: 75 },
  { x: 6, value: 73 },
  { x: 7, value: 78 },
  { x: 8, value: 82 },
  { x: 9, value: 85 },
  { x: 10, value: 88 },
  { x: 11, value: 90 }
]

export const SparkChartExample = () => {
  return (
    <div className="w-full h-full">
      <div className="space-y-6">
        {/* Metric Cards with Spark Charts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4 space-y-2">
            <div className="text-sm text-gray-500">Sales</div>
            <div className="text-2xl font-bold">95K</div>
            <div className="text-xs text-green-600">+12.5% this month</div>
            <SparkSurface data={salesData} xKey="x" width={200} height={50}>
              <ChartLineSeries dataKey="value" color="#10b981" lineWidth={2} />
            </SparkSurface>
          </div>

          <div className="bg-white rounded-lg shadow p-4 space-y-2">
            <div className="text-sm text-gray-500">User Growth</div>
            <div className="text-2xl font-bold">258</div>
            <div className="text-xs text-blue-600">+15.2% this month</div>
            <SparkSurface data={userGrowthData} xKey="x" width={200} height={50}>
              <ChartAreaSeries dataKey="value" color="#3b82f6" opacity={0.3} />
              <ChartLineSeries dataKey="value" color="#3b82f6" lineWidth={2} />
            </SparkSurface>
          </div>

          <div className="bg-white rounded-lg shadow p-4 space-y-2">
            <div className="text-sm text-gray-500">Revenue</div>
            <div className="text-2xl font-bold">$10.5K</div>
            <div className="text-xs text-purple-600">+18.3% this month</div>
            <SparkSurface data={revenueData} xKey="x" width={200} height={50}>
              <ChartAreaSeries dataKey="value" color="#8b5cf6" opacity={0.3} />
              <ChartLineSeries dataKey="value" color="#8b5cf6" lineWidth={2} />
              <ChartCursorLayer snapToDataPoints />
              <ChartTooltipLayer />
            </SparkSurface>
          </div>

          <div className="bg-white rounded-lg shadow p-4 space-y-2">
            <div className="text-sm text-gray-500">Engagement</div>
            <div className="text-2xl font-bold">90%</div>
            <div className="text-xs text-orange-600">+8.1% this month</div>
            <SparkSurface data={engagementData} xKey="x" width={200} height={50}>
              <ChartLineSeries dataKey="value" color="#f97316" lineWidth={2} />
              <ChartCursorLayer snapToDataPoints />
              <ChartTooltipLayer />
            </SparkSurface>
          </div>
        </div>
      </div>
    </div>
  )
}

export const sparkChartCode = `import {
  SparkSurface,
  ChartLineSeries,
  ChartAreaSeries,
  ChartCursorLayer,
  ChartTooltipLayer
} from '@repo/chart-components';

const data = [
  { x: 0, value: 45 },
  { x: 1, value: 52 },
  { x: 2, value: 65 },
  { x: 3, value: 78 },
  { x: 4, value: 88 },
  { x: 5, value: 95 }
];

// Basic line spark chart (composable!)
<SparkSurface data={data} xKey="x" width={150} height={40}>
  <ChartLineSeries dataKey="value" color="#10b981" lineWidth={2} />
</SparkSurface>

// Area spark chart with cursor and tooltip
<SparkSurface data={data} xKey="x" width={200} height={50}>
  <ChartAreaSeries dataKey="value" color="#8b5cf6" opacity={0.3} />
  <ChartLineSeries dataKey="value" color="#8b5cf6" lineWidth={2} />
  <ChartCursorLayer snapToDataPoints />
  <ChartTooltipLayer />
</SparkSurface>

// Multiple series in a spark chart
<SparkSurface data={data} xKey="x" width={150} height={40}>
  <ChartLineSeries dataKey="expenses" color="#ef4444" lineWidth={1.5} />
  <ChartLineSeries dataKey="revenue" color="#10b981" lineWidth={1.5} />
</SparkSurface>

// Usage in metric cards
<div className="bg-white rounded-lg shadow p-4 space-y-2">
  <div className="text-sm text-gray-500">Sales</div>
  <div className="text-2xl font-bold">95K</div>
  <div className="text-xs text-green-600">+12.5%</div>
  <SparkSurface data={data} xKey="x">
    <ChartLineSeries dataKey="value" color="#10b981" />
  </SparkSurface>
</div>`
