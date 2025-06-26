export interface ChartCursorProps {
  show?: boolean;
  showHorizontalLine?: boolean;
  showVerticalLine?: boolean;
  horizontalLineColor?: string;
  verticalLineColor?: string;
  horizontalLineWidth?: number;
  verticalLineWidth?: number;
  horizontalLineDash?: number[];
  verticalLineDash?: number[];
  opacity?: number;
  snapToDataPoints?: boolean;
  snapRadius?: number; // Radius in pixels for snapping
}

export interface ChartCursorRenderProps extends ChartCursorProps {
  context: CanvasRenderingContext2D;
  chartX: number;
  chartY: number;
  chartWidth: number;
  chartHeight: number;
  cursorX: number;
  cursorY: number;
  snappedX?: number;
  snappedY?: number;
}

export const defaultChartCursorProps: Required<ChartCursorProps> = {
  show: true,
  showHorizontalLine: true,
  showVerticalLine: true,
  horizontalLineColor: '#6b7280',
  verticalLineColor: '#6b7280',
  horizontalLineWidth: 1,
  verticalLineWidth: 1,
  horizontalLineDash: [5, 5],
  verticalLineDash: [5, 5],
  opacity: 0.8,
  snapToDataPoints: true,
  snapRadius: 20,
};

export const renderChartCursor = (props: ChartCursorRenderProps): void => {
  const {
    context,
    chartX,
    chartY,
    chartWidth,
    chartHeight,
    cursorX,
    cursorY,
    snappedX,
    snappedY,
    show = defaultChartCursorProps.show,
    showHorizontalLine = defaultChartCursorProps.showHorizontalLine,
    showVerticalLine = defaultChartCursorProps.showVerticalLine,
    horizontalLineColor = defaultChartCursorProps.horizontalLineColor,
    verticalLineColor = defaultChartCursorProps.verticalLineColor,
    horizontalLineWidth = defaultChartCursorProps.horizontalLineWidth,
    verticalLineWidth = defaultChartCursorProps.verticalLineWidth,
    horizontalLineDash = defaultChartCursorProps.horizontalLineDash,
    verticalLineDash = defaultChartCursorProps.verticalLineDash,
    opacity = defaultChartCursorProps.opacity,
    snapToDataPoints = defaultChartCursorProps.snapToDataPoints,
  } = props;

  if (!show) return;

  // Use snapped coordinates if available and snapping is enabled
  const finalX = snapToDataPoints && snappedX !== undefined ? snappedX : cursorX;
  const finalY = snapToDataPoints && snappedY !== undefined ? snappedY : cursorY;

  // Check if cursor is within chart bounds
  if (finalX < chartX || finalX > chartX + chartWidth || 
      finalY < chartY || finalY > chartY + chartHeight) {
    return;
  }

  // Save current context state
  context.save();

  // Set global opacity
  context.globalAlpha = opacity;

  // Draw vertical line
  if (showVerticalLine) {
    context.strokeStyle = verticalLineColor;
    context.lineWidth = verticalLineWidth;
    context.setLineDash(verticalLineDash);
    context.beginPath();
    context.moveTo(finalX, chartY);
    context.lineTo(finalX, chartY + chartHeight);
    context.stroke();
  }

  // Draw horizontal line
  if (showHorizontalLine) {
    context.strokeStyle = horizontalLineColor;
    context.lineWidth = horizontalLineWidth;
    context.setLineDash(horizontalLineDash);
    context.beginPath();
    context.moveTo(chartX, finalY);
    context.lineTo(chartX + chartWidth, finalY);
    context.stroke();
  }

  // Restore context state
  context.restore();
};

// Helper function to find the nearest data point
export interface DataPoint {
  x: number;
  y: number;
  value: number | string;
  label?: string;
  seriesIndex?: number;
  dataIndex?: number;
  originalData?: any;
}

export const findNearestDataPoint = (
  cursorX: number,
  cursorY: number,
  dataPoints: DataPoint[],
  snapRadius: number
): { point: DataPoint; distance: number } | null => {
  let nearestPoint: DataPoint | null = null;
  let nearestDistance = Infinity;

  dataPoints.forEach(point => {
    const distance = Math.sqrt(
      Math.pow(cursorX - point.x, 2) + Math.pow(cursorY - point.y, 2)
    );

    if (distance <= snapRadius && distance < nearestDistance) {
      nearestDistance = distance;
      nearestPoint = point;
    }
  });

  return nearestPoint ? { point: nearestPoint, distance: nearestDistance } : null;
}; 