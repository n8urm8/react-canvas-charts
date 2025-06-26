import React from 'react';
import { BarChart, type BarChartData } from '../components/BarChart/BarChart';
import { LineChart, type LineChartData } from '../components/LineChart/LineChart';

interface ChartContainerProps {
  chartType: 'bar' | 'line';
  data: BarChartData[];
  title: string;
  isResponsive: boolean;
  currentStyle: any;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  chartType,
  data,
  title,
  isResponsive,
  currentStyle,
}) => {
  const commonProps = {
    data,
    title,
    showValues: chartType === 'bar',
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    className: "shadow-lg",
    enableCursor: true,
    enableTooltip: true,
    ...currentStyle,
  };

  if (isResponsive) {
    return (
      <div className="w-full max-w-6xl h-96 bg-white rounded-lg shadow-lg p-4">
        {chartType === 'bar' ? (
          <BarChart
            {...commonProps}
            width="100%"
            height="100%"
          />
        ) : (
          <LineChart
            {...commonProps}
            width="100%"
            height="100%"
          />
        )}
      </div>
    );
  }

  return chartType === 'bar' ? (
    <BarChart
      {...commonProps}
      width={800}
      height={400}
    />
  ) : (
    <LineChart
      {...commonProps}
      width={800}
      height={400}
    />
  );
}; 