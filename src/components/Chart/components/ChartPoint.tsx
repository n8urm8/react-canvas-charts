export interface ChartPointProps {
  show?: boolean;
  shape?: 'circle' | 'square' | 'triangle' | 'diamond' | 'cross' | 'star';
  size?: number;
  color?: string;
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
  showShadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  opacity?: number;
  rotation?: number; // in degrees
  hollow?: boolean; // Only border, no fill
}

export interface ChartPointRenderProps extends ChartPointProps {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  value: number;
  index: number;
}

export const defaultChartPointProps: Required<ChartPointProps> = {
  show: true,
  shape: 'circle',
  size: 6,
  color: '#3b82f6',
  fillColor: '#3b82f6',
  borderColor: '#ffffff',
  borderWidth: 2,
  showShadow: false,
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  shadowBlur: 4,
  shadowOffsetX: 0,
  shadowOffsetY: 2,
  opacity: 1,
  rotation: 0,
  hollow: false,
};

export const renderChartPoint = (props: ChartPointRenderProps): void => {
  const {
    context,
    x: originalX,
    y: originalY,
    show = defaultChartPointProps.show,
    shape = defaultChartPointProps.shape,
    size = defaultChartPointProps.size,
    color = defaultChartPointProps.color,
    fillColor = defaultChartPointProps.fillColor,
    borderColor = defaultChartPointProps.borderColor,
    borderWidth = defaultChartPointProps.borderWidth,
    showShadow = defaultChartPointProps.showShadow,
    shadowColor = defaultChartPointProps.shadowColor,
    shadowBlur = defaultChartPointProps.shadowBlur,
    shadowOffsetX = defaultChartPointProps.shadowOffsetX,
    shadowOffsetY = defaultChartPointProps.shadowOffsetY,
    opacity = defaultChartPointProps.opacity,
    rotation = defaultChartPointProps.rotation,
    hollow = defaultChartPointProps.hollow,
  } = props;

  if (!show) return;

  // Save current context state
  context.save();

  // Set opacity
  context.globalAlpha = opacity;

  // Apply shadow if enabled
  if (showShadow) {
    context.shadowColor = shadowColor;
    context.shadowBlur = shadowBlur;
    context.shadowOffsetX = shadowOffsetX;
    context.shadowOffsetY = shadowOffsetY;
  }

  let x = originalX;
  let y = originalY;

  // Apply rotation if specified
  if (rotation !== 0) {
    context.translate(originalX, originalY);
    context.rotate((rotation * Math.PI) / 180);
    // Reset coordinates since we translated
    x = 0;
    y = 0;
  }

  // Draw the shape
  context.beginPath();
  
  switch (shape) {
    case 'circle':
      drawCircle(context, x, y, size);
      break;
    case 'square':
      drawSquare(context, x, y, size);
      break;
    case 'triangle':
      drawTriangle(context, x, y, size);
      break;
    case 'diamond':
      drawDiamond(context, x, y, size);
      break;
    case 'cross':
      drawCross(context, x, y, size);
      break;
    case 'star':
      drawStar(context, x, y, size);
      break;
  }

  // Fill the shape (unless hollow)
  if (!hollow) {
    context.fillStyle = fillColor || color;
    context.fill();
  }

  // Draw border if specified
  if (borderWidth > 0) {
    context.shadowColor = 'transparent'; // Disable shadow for border
    context.strokeStyle = borderColor;
    context.lineWidth = borderWidth;
    context.stroke();
  }

  // Restore context state
  context.restore();
};

// Helper functions to draw different shapes
function drawCircle(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  context.arc(x, y, size / 2, 0, 2 * Math.PI);
}

function drawSquare(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const halfSize = size / 2;
  context.rect(x - halfSize, y - halfSize, size, size);
}

function drawTriangle(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const height = size * 0.866; // Height of equilateral triangle
  context.moveTo(x, y - height / 2);
  context.lineTo(x - size / 2, y + height / 2);
  context.lineTo(x + size / 2, y + height / 2);
  context.closePath();
}

function drawDiamond(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const halfSize = size / 2;
  context.moveTo(x, y - halfSize);
  context.lineTo(x + halfSize, y);
  context.lineTo(x, y + halfSize);
  context.lineTo(x - halfSize, y);
  context.closePath();
}

function drawCross(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const halfSize = size / 2;
  const thickness = size * 0.2;
  
  // Vertical line
  context.rect(x - thickness / 2, y - halfSize, thickness, size);
  // Horizontal line
  context.rect(x - halfSize, y - thickness / 2, size, thickness);
}

function drawStar(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const outerRadius = size / 2;
  const innerRadius = outerRadius * 0.4;
  const spikes = 5;
  
  let rotation = Math.PI / 2 * 3;
  const step = Math.PI / spikes;

  context.moveTo(x, y - outerRadius);
  
  for (let i = 0; i < spikes; i++) {
    // Outer point
    const outerX = x + Math.cos(rotation) * outerRadius;
    const outerY = y + Math.sin(rotation) * outerRadius;
    context.lineTo(outerX, outerY);
    rotation += step;

    // Inner point
    const innerX = x + Math.cos(rotation) * innerRadius;
    const innerY = y + Math.sin(rotation) * innerRadius;
    context.lineTo(innerX, innerY);
    rotation += step;
  }
  
  context.closePath();
} 