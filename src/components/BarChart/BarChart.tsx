import { useState, useCallback } from 'react';
import { CanvasWrapper } from '../CanvasWrapper/CanvasWrapper';
import { cn } from '../../utils/cn';
import {
  type ChartTitleProps,
  type ChartAxisProps,
  type ChartGridProps,
  type ChartBarProps,
  type ChartLabelProps,
  type ChartCursorProps,
  type ChartTooltipProps,
  type DataPoint,
  renderChartTitle,
  renderChartAxis,
  renderChartGrid,
  renderChartBar,
  renderChartLabel,
  renderChartCursor,
  renderChartTooltip,
  findNearestDataPoint,
  defaultChartTitleProps,
  defaultChartAxisProps,
  defaultChartGridProps,
  defaultChartBarProps,
  defaultChartLabelProps,
  defaultChartCursorProps,
  defaultChartTooltipProps,
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
  cursorComponent?: ChartCursorProps;
  tooltipComponent?: ChartTooltipProps;
  
  // Default colors for bars
  defaultColors?: string[];
  
  // Interactive features
  enableCursor?: boolean;
  enableTooltip?: boolean;
  onHover?: (dataPoint: DataPoint | null) => void;
  onClick?: (dataPoint: DataPoint | null) => void;
  
  // Custom renderers (advanced usage)
  customTitleRenderer?: typeof renderChartTitle;
  customAxisRenderer?: typeof renderChartAxis;
  customGridRenderer?: typeof renderChartGrid;
  customBarRenderer?: typeof renderChartBar;
  customLabelRenderer?: typeof renderChartLabel;
  customCursorRenderer?: typeof renderChartCursor;
  customTooltipRenderer?: typeof renderChartTooltip;
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
  cursorComponent = {},
  tooltipComponent = {},
  
  // Default colors
  defaultColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ],
  
  // Interactive features
  enableCursor = false,
  enableTooltip = false,
  onHover,
  onClick,
  
  // Custom renderers
  customTitleRenderer = renderChartTitle,
  customAxisRenderer = renderChartAxis,
  customGridRenderer = renderChartGrid,
  customBarRenderer = renderChartBar,
  customLabelRenderer = renderChartLabel,
  customCursorRenderer = renderChartCursor,
  customTooltipRenderer = renderChartTooltip,
}) => {
  // Interactive state
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<DataPoint | null>(null);
  const [chartDimensions, setChartDimensions] = useState<{
    chartX: number;
    chartY: number;
    chartWidth: number;
    chartHeight: number;
    canvasWidth: number;
    canvasHeight: number;
  } | null>(null);

  const handleMouseMove = useCallback((event: MouseEvent, canvas: HTMLCanvasElement) => {
    if (!enableCursor && !enableTooltip) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width) / (window.devicePixelRatio || 1);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height) / (window.devicePixelRatio || 1);

    setCursorPosition({ x, y });

    if (chartDimensions && (enableTooltip || onHover)) {
      // Build data points for hover detection
      const dataPoints: DataPoint[] = [];
      const { chartX, chartY, chartWidth, chartHeight } = chartDimensions;
      
      if (data.length > 0) {
        const maxValue = Math.max(...data.map(d => d.value));
        const scale = chartHeight / maxValue;
        const totalSpacing = barSpacing * (data.length - 1);
        const barWidth = (chartWidth - totalSpacing) / data.length;

        data.forEach((item, index) => {
          const barHeight = item.value * scale;
          const barX = chartX + (barWidth + barSpacing) * index;
          const barY = chartY + (chartHeight - barHeight);
          const centerX = barX + barWidth / 2;
          const centerY = barY + barHeight / 2;

          dataPoints.push({
            x: centerX,
            y: centerY,
            value: item.value,
            label: item.label,
            dataIndex: index,
            originalData: { 
              ...item, 
              context: canvas.getContext('2d'),
              barX,
              barY,
              barWidth,
              barHeight
            },
          });
        });
      }

      // Find nearest data point
      const snapRadius = cursorComponent.snapRadius || defaultChartCursorProps.snapRadius;
      const nearest = findNearestDataPoint(x, y, dataPoints, snapRadius);
      
      const newHoveredPoint = nearest?.point || null;
      
      if (newHoveredPoint !== hoveredDataPoint) {
        setHoveredDataPoint(newHoveredPoint);
        onHover?.(newHoveredPoint);
      }
    }
  }, [enableCursor, enableTooltip, chartDimensions, data, barSpacing, cursorComponent.snapRadius, onHover, hoveredDataPoint]);

  const handleMouseLeave = useCallback(() => {
    setCursorPosition(null);
    setHoveredDataPoint(null);
    onHover?.(null);
  }, [onHover]);

  const handleClick = useCallback((event: MouseEvent, canvas: HTMLCanvasElement) => {
    if (!onClick) return;
    onClick(hoveredDataPoint);
  }, [onClick, hoveredDataPoint]);

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

    // Store chart dimensions for interactive features
    setChartDimensions({
      chartX,
      chartY,
      chartWidth,
      chartHeight,
      canvasWidth,
      canvasHeight,
    });

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

    // Render interactive features
    if (cursorPosition && (enableCursor || enableTooltip)) {
      // Render cursor/crosshairs
      if (enableCursor) {
        const snappedX = hoveredDataPoint?.x;
        const snappedY = hoveredDataPoint?.y;

        customCursorRenderer({
          ...defaultChartCursorProps,
          ...cursorComponent,
          context,
          chartX,
          chartY,
          chartWidth,
          chartHeight,
          cursorX: cursorPosition.x,
          cursorY: cursorPosition.y,
          snappedX,
          snappedY,
        });
      }

      // Render tooltip
      if (enableTooltip && hoveredDataPoint) {
        customTooltipRenderer({
          ...defaultChartTooltipProps,
          ...tooltipComponent,
          context,
          dataPoint: hoveredDataPoint,
          cursorX: cursorPosition.x,
          cursorY: cursorPosition.y,
          chartX,
          chartY,
          chartWidth,
          chartHeight,
          canvasWidth,
          canvasHeight,
        });
      }
    }
  };

  return (
    <CanvasWrapper
      width={width}
      height={height}
      onDraw={drawChart}
      onMouseMove={enableCursor || enableTooltip ? handleMouseMove : undefined}
      onMouseLeave={enableCursor || enableTooltip ? handleMouseLeave : undefined}
      onClick={onClick ? handleClick : undefined}
      className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}
      style={style}
    />
  );
};
