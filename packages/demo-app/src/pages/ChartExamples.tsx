import React from 'react'
import { ChartExampleCard } from '../components/ChartExampleCard'
import { LineChartExample, lineChartCode } from '../components/examples/LineChartExample'
import { AreaChartExample, areaChartCode } from '../components/examples/AreaChartExample'
import { BarChartExample, barChartCode } from '../components/examples/BarChartExample'
import { GroupedBarChartExample, groupedBarChartCode } from '../components/examples/GroupedBarChartExample'
import { ScatterPlotExample, scatterPlotCode } from '../components/examples/ScatterPlotExample'
import { BubblePlotExample, bubblePlotCode } from '../components/examples/BubblePlotExample'
import { sparkChartCode, SparkChartExample } from '../components/examples/SparkChartExample'
export const ChartExamples: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 w-full">
      <div className="w-full px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Chart Examples</h1>
        <p className="text-gray-600 mb-8">Click on any card to view the code. Click again to return to the chart.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Line Chart Example */}
          <ChartExampleCard
            title="Line Chart"
            description="Basic line chart with interactive cursor and tooltip"
            code={lineChartCode}
            chart={<LineChartExample />}
          />

          {/* Area Chart Example */}
          <ChartExampleCard
            title="Area Chart"
            description="Multi-series area chart comparing revenue and expenses"
            code={areaChartCode}
            chart={<AreaChartExample />}
          />

          {/* Bar Chart Example */}
          <ChartExampleCard
            title="Bar Chart"
            description="Overlapping bar chart showing sales vs target"
            code={barChartCode}
            chart={<BarChartExample />}
          />

          {/* Grouped Bar Chart Example */}
          <ChartExampleCard
            title="Grouped Bar Chart"
            description="Side-by-side grouped bars for comparing multiple series"
            code={groupedBarChartCode}
            chart={<GroupedBarChartExample />}
          />

          {/* Scatter Plot Example */}
          <ChartExampleCard
            title="Scatter Plot"
            description="Multi-series scatter plot with different point shapes"
            code={scatterPlotCode}
            chart={<ScatterPlotExample />}
          />

          {/* Bubble Plot Example */}
          <ChartExampleCard
            title="Bubble Plot"
            description="Bubble chart with variable point sizes based on data values"
            code={bubblePlotCode}
            chart={<BubblePlotExample />}
          />

          {/* Spark Chart Example */}
          <ChartExampleCard
            title="Spark Charts"
            description="Minimal inline charts for dashboards and metrics"
            code={sparkChartCode}
            chart={<SparkChartExample />}
          />
        </div>
      </div>
    </div>
  )
}
