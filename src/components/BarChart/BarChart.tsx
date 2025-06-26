import { CanvasWrapper } from '../CanvasWrapper/CanvasWrapper';
import { cn } from '../../utils/cn';
import {
  type ChartTitleProps,
  type ChartAxisProps,
  type ChartGridProps,
  type ChartBarProps,
  type ChartLabelProps,
  renderChartTitle,
  renderChartAxis,
  renderChartGrid,
  renderChartBar,
  renderChartLabel,
  defaultChartTitleProps,
  defaultChartAxisProps,
  defaultChartGridProps,
  defaultChartBarProps,
  defaultChartLabelProps,
} from '../Chart/components';

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: BarChartData[];
  width?: number | string;
  height?: number | string;
  title?: string;
  showValues?: boolean;
  barSpacing?: number;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
  style?: React.CSSProperties;
  padding?: number;
  
  // Component customization props
  titleComponent?: ChartTitleProps;
  xAxisComponent?: ChartAxisProps;
  yAxisComponent?: ChartAxisProps;
  gridComponent?: ChartGridProps;
  barComponent?: ChartBarProps;
  labelComponent?: ChartLabelProps;
  
  // Default colors for bars
  defaultColors?: string[];
  
  // Custom renderers (advanced usage)
  customTitleRenderer?: typeof renderChartTitle;
  customAxisRenderer?: typeof renderChartAxis;
  customGridRenderer?: typeof renderChartGrid;
  customBarRenderer?: typeof renderChartBar;
  customLabelRenderer?: typeof renderChartLabel;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  width = 800,
  height = 400,
  title,
  showValues = true,
  barSpacing = 10,
  backgroundColor = '#ffffff',
  textColor = '#1f2937',
  className,
  style,
  padding = 60,
  
  // Component props
  titleComponent = {},
  xAxisComponent = {},
  yAxisComponent = {},
  gridComponent = {},
  barComponent = {},
  labelComponent = {},
  
  // Default colors
  defaultColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ],
  
  // Custom renderers
  customTitleRenderer = renderChartTitle,
  customAxisRenderer = renderChartAxis,
  customGridRenderer = renderChartGrid,
  customBarRenderer = renderChartBar,
  customLabelRenderer = renderChartLabel,
}) => {
  const drawChart = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
    const canvasHeight = canvas.height / (window.devicePixelRatio || 1);
    
    // Fill background
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    if (data.length === 0) return;

    // Calculate dimensions
    const titleHeight = title ? 
      (titleComponent.fontSize || defaultChartTitleProps.fontSize) + 
      (titleComponent.marginBottom || defaultChartTitleProps.marginBottom) + 
      (titleComponent.marginTop || defaultChartTitleProps.marginTop) : 0;
    
    const chartX = padding;
    const chartY = titleHeight + padding;
    const chartWidth = canvasWidth - (padding * 2);
    const chartHeight = canvasHeight - padding - titleHeight - 40; // 40 for bottom labels

    // Render title
    if (title) {
      customTitleRenderer({
        ...defaultChartTitleProps,
        ...titleComponent,
        title,
        context,
        canvasWidth,
        canvasHeight,
        y: titleComponent.marginTop || defaultChartTitleProps.marginTop,
      });
    }

    // Find max value for scaling
    const maxValue = Math.max(...data.map(d => d.value));
    const scale = chartHeight / maxValue;

    // Calculate bar dimensions
    const totalSpacing = barSpacing * (data.length - 1);
    const barWidth = (chartWidth - totalSpacing) / data.length;

    // Prepare grid lines
    const steps = 5;
    const stepValue = maxValue / steps;
    const horizontalLines: number[] = [];
    const yLabels: string[] = [];
    const yLabelPositions: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const value = Math.round(stepValue * i);
      const y = chartY + chartHeight - (chartHeight / steps * i);
      horizontalLines.push(y);
      yLabels.push(value.toString());
      yLabelPositions.push(y);
    }

    // Render grid
    customGridRenderer({
      ...defaultChartGridProps,
      ...gridComponent,
      context,
      chartX,
      chartY,
      chartWidth,
      chartHeight,
      horizontalLines,
      verticalLines: [],
    });

    // Prepare axis data
    const xLabels = data.map(d => d.label);
    const xLabelPositions = data.map((_, index) => 
      chartX + (barWidth + barSpacing) * index + barWidth / 2
    );

    // Render Y-axis
    customAxisRenderer({
      ...defaultChartAxisProps,
      ...yAxisComponent,
      context,
      type: 'y',
      startX: chartX,
      startY: chartY,
      endX: chartX,
      endY: chartY + chartHeight,
      labels: yLabels,
      labelPositions: yLabelPositions,
    });

    // Render X-axis
    customAxisRenderer({
      ...defaultChartAxisProps,
      ...xAxisComponent,
      context,
      type: 'x',
      startX: chartX,
      startY: chartY + chartHeight,
      endX: chartX + chartWidth,
      endY: chartY + chartHeight,
      labels: xLabels,
      labelPositions: xLabelPositions,
    });

    // Render bars and labels
    data.forEach((item, index) => {
      const barHeight = item.value * scale;
      const x = chartX + (barWidth + barSpacing) * index;
      const y = chartY + (chartHeight - barHeight);
      const color = item.color || defaultColors[index % defaultColors.length];

      // Render bar
      customBarRenderer({
        ...defaultChartBarProps,
        ...barComponent,
        context,
        x,
        y,
        width: barWidth,
        height: barHeight,
        color,
        index,
      });

      // Render value label if enabled
      if (showValues) {
        customLabelRenderer({
          ...defaultChartLabelProps,
          ...labelComponent,
          context,
          x,
          y,
          width: barWidth,
          height: barHeight,
          value: item.value,
          index,
        });
      }
    });
  };

  return (
    <CanvasWrapper
      width={width}
      height={height}
      onDraw={drawChart}
      className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}
      style={style}
    />
  );
};
