export interface ChartLineProps {
  show?: boolean;
  color?: string;
  lineWidth?: number;
  lineDash?: number[];
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  showShadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  gradient?: {
    enabled: boolean;
    startColor?: string;
    endColor?: string;
  };
  opacity?: number;
  smooth?: boolean;
  tension?: number; // For smooth curves (0-1)
}

export interface ChartLineRenderProps extends ChartLineProps {
  context: CanvasRenderingContext2D;
  points: Array<{ x: number; y: number }>;
  index: number;
}

export const defaultChartLineProps: Required<Omit<ChartLineProps, 'gradient'>> & { gradient: Required<NonNullable<ChartLineProps['gradient']>> } = {
  show: true,
  color: '#3b82f6',
  lineWidth: 2,
  lineDash: [],
  lineCap: 'round',
  lineJoin: 'round',
  showShadow: false,
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  shadowBlur: 4,
  shadowOffsetX: 0,
  shadowOffsetY: 2,
  opacity: 1,
  smooth: false,
  tension: 0.4,
  gradient: {
    enabled: false,
    startColor: '',
    endColor: '',
  }
};

export const renderChartLine = (props: ChartLineRenderProps): void => {
  const {
    context,
    points,
    show = defaultChartLineProps.show,
    color = defaultChartLineProps.color,
    lineWidth = defaultChartLineProps.lineWidth,
    lineDash = defaultChartLineProps.lineDash,
    lineCap = defaultChartLineProps.lineCap,
    lineJoin = defaultChartLineProps.lineJoin,
    showShadow = defaultChartLineProps.showShadow,
    shadowColor = defaultChartLineProps.shadowColor,
    shadowBlur = defaultChartLineProps.shadowBlur,
    shadowOffsetX = defaultChartLineProps.shadowOffsetX,
    shadowOffsetY = defaultChartLineProps.shadowOffsetY,
    opacity = defaultChartLineProps.opacity,
    smooth = defaultChartLineProps.smooth,
    tension = defaultChartLineProps.tension,
    gradient = defaultChartLineProps.gradient,
  } = props;

  if (!show || points.length < 2) return;

  // Save current context state
  context.save();

  // Set line style
  context.lineWidth = lineWidth;
  context.lineCap = lineCap;
  context.lineJoin = lineJoin;
  context.setLineDash(lineDash);
  context.globalAlpha = opacity;

  // Apply shadow if enabled
  if (showShadow) {
    context.shadowColor = shadowColor;
    context.shadowBlur = shadowBlur;
    context.shadowOffsetX = shadowOffsetX;
    context.shadowOffsetY = shadowOffsetY;
  }

  // Create stroke style
  let strokeStyle: string | CanvasGradient = color;
  
  if (gradient?.enabled && points.length > 1) {
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    
    const canvasGradient = context.createLinearGradient(
      firstPoint.x, firstPoint.y,
      lastPoint.x, lastPoint.y
    );
    
    canvasGradient.addColorStop(0, gradient.startColor || color);
    canvasGradient.addColorStop(1, gradient.endColor || color);
    strokeStyle = canvasGradient;
  }

  context.strokeStyle = strokeStyle;

  // Draw the line
  context.beginPath();
  
  if (smooth && points.length > 2) {
    // Draw smooth curves using Catmull-Rom splines
    drawSmoothCurve(context, points, tension);
  } else {
    // Draw straight lines
    context.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      context.lineTo(points[i].x, points[i].y);
    }
  }

  context.stroke();

  // Restore context state
  context.restore();
};

// Helper function to draw smooth curves
function drawSmoothCurve(
  context: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  tension: number
): void {
  if (points.length < 2) return;

  // Start the path
  context.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    // If only two points, draw a straight line
    context.lineTo(points[1].x, points[1].y);
    return;
  }

  // For smooth curves, use quadratic or cubic Bezier curves
  for (let i = 1; i < points.length - 1; i++) {
    const prevPoint = points[i - 1];
    const currentPoint = points[i];
    const nextPoint = points[i + 1];

    // Calculate control points for smooth curve
    const cp1x = prevPoint.x + (currentPoint.x - prevPoint.x) * tension;
    const cp1y = prevPoint.y + (currentPoint.y - prevPoint.y) * tension;
    
    const cp2x = currentPoint.x - (nextPoint.x - currentPoint.x) * tension;
    const cp2y = currentPoint.y - (nextPoint.y - currentPoint.y) * tension;

    // Draw curve to current point
    context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, currentPoint.x, currentPoint.y);
  }

  // Draw final segment to last point
  const lastPoint = points[points.length - 1];
  const secondLastPoint = points[points.length - 2];
  
  const cp1x = secondLastPoint.x + (lastPoint.x - secondLastPoint.x) * tension;
  const cp1y = secondLastPoint.y + (lastPoint.y - secondLastPoint.y) * tension;
  
  context.quadraticCurveTo(cp1x, cp1y, lastPoint.x, lastPoint.y);
} 