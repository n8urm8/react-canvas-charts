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
  snapAlongYAxis?: boolean;
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
  snapAlongYAxis: false,
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
  originalData?: Record<string, unknown>;
}

type IndexedDataPoints = {
  xs: number[];
  buckets: DataPoint[][];
};

const dataPointIndexCache = new WeakMap<DataPoint[], IndexedDataPoints>();

const buildIndexedDataPoints = (dataPoints: DataPoint[]): IndexedDataPoints => {
  const bucketsByX = new Map<number, DataPoint[]>();

  dataPoints.forEach((point) => {
    const list = bucketsByX.get(point.x);
    if (list) {
      list.push(point);
    } else {
      bucketsByX.set(point.x, [point]);
    }
  });

  const xs = Array.from(bucketsByX.keys()).sort((a, b) => a - b);
  const buckets = xs.map((x) => bucketsByX.get(x) ?? []);

  return { xs, buckets };
};

const getIndexedDataPoints = (dataPoints: DataPoint[]): IndexedDataPoints => {
  let cached = dataPointIndexCache.get(dataPoints);
  if (!cached) {
    cached = buildIndexedDataPoints(dataPoints);
    dataPointIndexCache.set(dataPoints, cached);
  }
  return cached;
};

const binarySearchClosestIndex = (values: number[], target: number): number => {
  let low = 0;
  let high = values.length - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const value = values[mid];
    if (value === target) {
      return mid;
    }
    if (value < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (low >= values.length) {
    return values.length - 1;
  }
  if (high < 0) {
    return 0;
  }

  return Math.abs(values[low] - target) < Math.abs(values[high] - target) ? low : high;
};

export const findNearestDataPoint = (
  cursorX: number,
  cursorY: number,
  dataPoints: DataPoint[],
  snapRadius: number,
  snapAlongYAxis: boolean = true
): { point: DataPoint; distance: number } | null => {
  if (dataPoints.length === 0) {
    return null;
  }

  const snapRadiusSq = snapRadius * snapRadius;
  let nearestPoint: DataPoint | null = null;
  let nearestDistanceSq = snapRadiusSq;

  const { xs, buckets } = getIndexedDataPoints(dataPoints);

  if (xs.length === 0) {
    return null;
  }

  const centerIndex = binarySearchClosestIndex(xs, cursorX);

  const processBucket = (points: DataPoint[]) => {
    points.forEach((point) => {
      const dx = cursorX - point.x;
      if (Math.abs(dx) > snapRadius) {
        return;
      }

      const dy = cursorY - point.y;
      if (snapAlongYAxis && Math.abs(dy) > snapRadius) {
        return;
      }

      const distanceSq = snapAlongYAxis ? dx * dx + dy * dy : dx * dx;

      if (distanceSq <= nearestDistanceSq) {
        nearestPoint = point;
        nearestDistanceSq = distanceSq;
      }
    });
  };

  processBucket(buckets[centerIndex]);

  if (nearestPoint && nearestDistanceSq === 0) {
    return { point: nearestPoint, distance: 0 };
  }

  for (let offset = 1; offset < xs.length; offset += 1) {
    let processed = false;

    const leftIndex = centerIndex - offset;
    if (leftIndex >= 0) {
      const dx = Math.abs(xs[leftIndex] - cursorX);
      if (dx <= snapRadius) {
        processBucket(buckets[leftIndex]);
        processed = true;
      }
    }

    const rightIndex = centerIndex + offset;
    if (rightIndex < xs.length) {
      const dx = Math.abs(xs[rightIndex] - cursorX);
      if (dx <= snapRadius) {
        processBucket(buckets[rightIndex]);
        processed = true;
      }
    }

    if (!processed) {
      break;
    }
  }

  if (!nearestPoint) {
    return null;
  }

  return {
    point: nearestPoint,
    distance: Math.sqrt(nearestDistanceSq),
  };
}; 