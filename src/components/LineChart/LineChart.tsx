import { useState, useCallback } from 'react';
import { CanvasWrapper } from '../CanvasWrapper/CanvasWrapper';
import { cn } from '../../utils/cn';
import {
  type ChartTitleProps,
  type ChartAxisProps,
  type ChartGridProps,
  type ChartLineProps,
  type ChartPointProps,
  type ChartLabelProps,
  type ChartCursorProps,
  type ChartTooltipProps,
  type DataPoint,
  renderChartTitle,
  renderChartAxis,
  renderChartGrid,
  renderChartLine,
  renderChartPoint,
  renderChartLabel,
  renderChartCursor,
  renderChartTooltip,
  findNearestDataPoint,
  defaultChartTitleProps,
  defaultChartAxisProps,
  defaultChartGridProps,
  defaultChartLineProps,
  defaultChartPointProps,
  defaultChartLabelProps,
  defaultChartCursorProps,
  defaultChartTooltipProps,
} from '../Chart/components';

export interface LineChartData {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartDataSeries {
  name: string;
  data: LineChartData[];
  color?: string;
  // Allow per-series customization
  lineComponent?: ChartLineProps;
  pointComponent?: ChartPointProps;
  labelComponent?: ChartLabelProps;
}

export interface LineChartProps {
  data: LineChartData[] | LineChartDataSeries[];
  width?: number | string;
  height?: number | string;
  title?: string;
  showPoints?: boolean;
  showLines?: boolean;
  showValues?: boolean;
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
  lineComponent?: ChartLineProps;
  pointComponent?: ChartPointProps;
  labelComponent?: ChartLabelProps;
  cursorComponent?: ChartCursorProps;
  tooltipComponent?: ChartTooltipProps;
  
  // Default colors for multiple series
  defaultColors?: string[];
  
  // Fill area under line
  fillArea?: boolean;
  fillOpacity?: number;
  
  // Interactive features
  enableCursor?: boolean;
  enableTooltip?: boolean;
  onHover?: (dataPoint: DataPoint | null) => void;
  onClick?: (dataPoint: DataPoint | null) => void;
  
  // Custom renderers (advanced usage)
  customTitleRenderer?: typeof renderChartTitle;
  customAxisRenderer?: typeof renderChartAxis;
  customGridRenderer?: typeof renderChartGrid;
  customLineRenderer?: typeof renderChartLine;
  customPointRenderer?: typeof renderChartPoint;
  customLabelRenderer?: typeof renderChartLabel;
  customCursorRenderer?: typeof renderChartCursor;
  customTooltipRenderer?: typeof renderChartTooltip;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 800,
  height = 400,
  title,
  showPoints = true,
  showLines = true,
  showValues = false,
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
  lineComponent = {},
  pointComponent = {},
  labelComponent = {},
  cursorComponent = {},
  tooltipComponent = {},
  
  // Default colors
  defaultColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ],
  
  // Fill area
  fillArea = false,
  fillOpacity = 0.1,
  
  // Interactive features
  enableCursor = false,
  enableTooltip = false,
  onHover,
  onClick,
  
  // Custom renderers
  customTitleRenderer = renderChartTitle,
  customAxisRenderer = renderChartAxis,
  customGridRenderer = renderChartGrid,
  customLineRenderer = renderChartLine,
  customPointRenderer = renderChartPoint,
  customLabelRenderer = renderChartLabel,
  customCursorRenderer = renderChartCursor,
  customTooltipRenderer = renderChartTooltip,
}) => {
  
  // Normalize data to series format
  const normalizedData: LineChartDataSeries[] = Array.isArray(data) && data.length > 0
    ? 'name' in data[0]
      ? data as LineChartDataSeries[]
      : [{ name: 'Series 1', data: data as LineChartData[] }]
    : [];

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
      // Build data points for hover detection from all series
      const dataPoints: DataPoint[] = [];
      const { chartX, chartY, chartWidth, chartHeight } = chartDimensions;
      
      if (normalizedData.length > 0) {
        // Find min/max values
        let minValue = Infinity;
        let maxValue = -Infinity;
        const allLabels = new Set<string>();

        normalizedData.forEach(series => {
          series.data.forEach(item => {
            minValue = Math.min(minValue, item.value);
            maxValue = Math.max(maxValue, item.value);
            allLabels.add(item.label);
          });
        });

        const valueRange = maxValue - minValue;
        const paddedMin = minValue - valueRange * 0.1;
        const paddedMax = maxValue + valueRange * 0.1;
        const scale = chartHeight / (paddedMax - paddedMin);
        
        const uniqueLabels = Array.from(allLabels);
        const labelSpacing = chartWidth / Math.max(1, uniqueLabels.length - 1);

        normalizedData.forEach((series, seriesIndex) => {
          series.data.forEach((item, dataIndex) => {
            const labelIndex = uniqueLabels.indexOf(item.label);
            const pointX = chartX + (labelIndex * labelSpacing);
            const pointY = chartY + chartHeight - ((item.value - paddedMin) * scale);

            dataPoints.push({
              x: pointX,
              y: pointY,
              value: item.value,
              label: item.label,
              seriesIndex,
              dataIndex,
              originalData: { 
                ...item,
                series: series.name,
                context: canvas.getContext('2d')
              },
            });
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
  }, [enableCursor, enableTooltip, chartDimensions, normalizedData, cursorComponent.snapRadius, onHover, hoveredDataPoint]);

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

    if (normalizedData.length === 0 || normalizedData[0].data.length === 0) return;

    // Calculate dimensions
    const titleHeight = title ? 
      (titleComponent.fontSize || defaultChartTitleProps.fontSize) + 
      (titleComponent.marginBottom || defaultChartTitleProps.marginBottom) + 
      (titleComponent.marginTop || defaultChartTitleProps.marginTop) : 0;
    
    const chartX = padding;
    const chartY = titleHeight + padding;
    const chartWidth = canvasWidth - (padding * 2);
    const chartHeight = canvasHeight - padding - titleHeight - 40;

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

    // Find min/max values across all series
    let minValue = Infinity;
    let maxValue = -Infinity;
    const allLabels = new Set<string>();

    normalizedData.forEach(series => {
      series.data.forEach(item => {
        minValue = Math.min(minValue, item.value);
        maxValue = Math.max(maxValue, item.value);
        allLabels.add(item.label);
      });
    });

    // Add some padding to the range
    const valueRange = maxValue - minValue;
    const paddedMin = minValue - valueRange * 0.1;
    const paddedMax = maxValue + valueRange * 0.1;
    const scale = chartHeight / (paddedMax - paddedMin);

    // Get unique labels in order
    const uniqueLabels = Array.from(allLabels);
    const labelSpacing = chartWidth / Math.max(1, uniqueLabels.length - 1);

    // Prepare grid lines
    const steps = 5;
    const stepValue = (paddedMax - paddedMin) / steps;
    const horizontalLines: number[] = [];
    const yLabels: string[] = [];
    const yLabelPositions: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const value = paddedMin + stepValue * i;
      const y = chartY + chartHeight - ((value - paddedMin) * scale);
      horizontalLines.push(y);
      yLabels.push(Math.round(value).toString());
      yLabelPositions.push(y);
    }

    // Render grid
    customGridRenderer({
      ...defaultChartGridProps,
      showVertical: true, // Lines typically show vertical grid lines
      ...gridComponent,
      context,
      chartX,
      chartY,
      chartWidth,
      chartHeight,
      horizontalLines,
      verticalLines: uniqueLabels.map((_, i) => chartX + i * labelSpacing),
    });

    // Prepare axis data
    const xLabelPositions = uniqueLabels.map((_, index) => chartX + index * labelSpacing);

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
      canvasWidth,
      canvasHeight,
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
      labels: uniqueLabels,
      labelPositions: xLabelPositions,
      canvasWidth,
      canvasHeight,
    });

    // Render each series
    normalizedData.forEach((series, seriesIndex) => {
      const seriesColor = series.color || defaultColors[seriesIndex % defaultColors.length];
      
      // Convert data points to screen coordinates
      const points = series.data.map(item => {
        const labelIndex = uniqueLabels.indexOf(item.label);
        const x = chartX + labelIndex * labelSpacing;
        const y = chartY + chartHeight - ((item.value - paddedMin) * scale);
        return { x, y, value: item.value, label: item.label };
      });

      // Fill area under line if enabled
      if (fillArea && showLines && points.length > 1) {
        context.save();
        context.globalAlpha = fillOpacity;
        context.fillStyle = seriesColor;
        context.beginPath();
        context.moveTo(points[0].x, chartY + chartHeight);
        points.forEach(point => context.lineTo(point.x, point.y));
        context.lineTo(points[points.length - 1].x, chartY + chartHeight);
        context.closePath();
        context.fill();
        context.restore();
      }

      // Render line
      if (showLines && points.length > 1) {
        customLineRenderer({
          ...defaultChartLineProps,
          color: seriesColor,
          ...lineComponent,
          ...series.lineComponent,
          context,
          points,
          index: seriesIndex,
        });
      }

      // Render points and labels
      if (showPoints || showValues) {
        points.forEach((point, pointIndex) => {
          // Render point
          if (showPoints) {
            customPointRenderer({
              ...defaultChartPointProps,
              color: seriesColor,
              fillColor: seriesColor,
              ...pointComponent,
              ...series.pointComponent,
              context,
              x: point.x,
              y: point.y,
              value: point.value,
              index: pointIndex,
            });
          }

          // Render value label
          if (showValues) {
            customLabelRenderer({
              ...defaultChartLabelProps,
              ...labelComponent,
              ...series.labelComponent,
              context,
              x: point.x,
              y: point.y,
              width: 0,
              height: 0,
              value: point.value,
              index: pointIndex,
            });
          }
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