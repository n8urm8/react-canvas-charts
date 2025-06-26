import type { DataPoint } from './ChartCursor';

export interface ChartTooltipProps {
  show?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  opacity?: number;
  position?: 'follow' | 'top' | 'bottom' | 'left' | 'right' | 'fixed';
  offset?: number;
  maxWidth?: number;
  // Custom formatter for tooltip content
  formatter?: (dataPoint: DataPoint) => string | string[];
  // Template for tooltip content (alternative to formatter)
  template?: string; // e.g., "{label}: {value}"
}

export interface ChartTooltipRenderProps extends ChartTooltipProps {
  context: CanvasRenderingContext2D;
  dataPoint: DataPoint | null;
  cursorX: number;
  cursorY: number;
  chartX: number;
  chartY: number;
  chartWidth: number;
  chartHeight: number;
  canvasWidth: number;
  canvasHeight: number;
}

export const defaultChartTooltipProps: Required<Omit<ChartTooltipProps, 'formatter' | 'template'>> & {
  formatter?: (dataPoint: DataPoint) => string | string[];
  template?: string;
} = {
  show: true,
  backgroundColor: '#1f2937',
  borderColor: '#374151',
  borderWidth: 1,
  borderRadius: 6,
  padding: 8,
  fontSize: 12,
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  textColor: '#ffffff',
  shadowColor: 'rgba(0, 0, 0, 0.25)',
  shadowBlur: 8,
  shadowOffsetX: 0,
  shadowOffsetY: 2,
  opacity: 0.95,
  position: 'follow',
  offset: 10,
  maxWidth: 200,
  formatter: undefined,
  template: '{label}: {value}',
};

export const renderChartTooltip = (props: ChartTooltipRenderProps): void => {
  const {
    context,
    dataPoint,
    cursorX,
    cursorY,
    chartX,
    chartY,
    chartWidth,
    chartHeight,
    canvasWidth,
    canvasHeight,
    show = defaultChartTooltipProps.show,
    backgroundColor = defaultChartTooltipProps.backgroundColor,
    borderColor = defaultChartTooltipProps.borderColor,
    borderWidth = defaultChartTooltipProps.borderWidth,
    borderRadius = defaultChartTooltipProps.borderRadius,
    padding = defaultChartTooltipProps.padding,
    fontSize = defaultChartTooltipProps.fontSize,
    fontFamily = defaultChartTooltipProps.fontFamily,
    textColor = defaultChartTooltipProps.textColor,
    shadowColor = defaultChartTooltipProps.shadowColor,
    shadowBlur = defaultChartTooltipProps.shadowBlur,
    shadowOffsetX = defaultChartTooltipProps.shadowOffsetX,
    shadowOffsetY = defaultChartTooltipProps.shadowOffsetY,
    opacity = defaultChartTooltipProps.opacity,
    position = defaultChartTooltipProps.position,
    offset = defaultChartTooltipProps.offset,
    maxWidth = defaultChartTooltipProps.maxWidth,
    formatter,
    template = defaultChartTooltipProps.template,
  } = props;

  if (!show || !dataPoint) return;

  // Generate tooltip content
  let content: string[];
  
  if (formatter) {
    const formatted = formatter(dataPoint);
    content = Array.isArray(formatted) ? formatted : [formatted];
  } else if (template) {
    // Replace template variables
    let text = template;
    text = text.replace('{label}', dataPoint.label || '');
    text = text.replace('{value}', dataPoint.value.toString());
    text = text.replace('{seriesIndex}', (dataPoint.seriesIndex || 0).toString());
    text = text.replace('{dataIndex}', (dataPoint.dataIndex || 0).toString());
    content = [text];
  } else {
    // Default content
    content = [`${dataPoint.label || 'Value'}: ${dataPoint.value}`];
  }

  if (content.length === 0) return;

  if (!context) return;

  // Save current context state
  context.save();

  // Set font for text measurement
  context.font = `${fontSize}px ${fontFamily}`;

  // Calculate text dimensions
  const lineHeight = fontSize * 1.2;
  const textMetrics = content.map(line => context.measureText(line));
  const maxTextWidth = Math.max(...textMetrics.map(m => m.width));
  const tooltipWidth = Math.min(maxTextWidth + padding * 2, maxWidth);
  const tooltipHeight = content.length * lineHeight + padding * 2;

  // Calculate tooltip position
  let tooltipX: number;
  let tooltipY: number;

  switch (position) {
    case 'follow':
      tooltipX = cursorX + offset;
      tooltipY = cursorY - tooltipHeight - offset;
      break;
    case 'top':
      tooltipX = dataPoint.x - tooltipWidth / 2;
      tooltipY = dataPoint.y - tooltipHeight - offset;
      break;
    case 'bottom':
      tooltipX = dataPoint.x - tooltipWidth / 2;
      tooltipY = dataPoint.y + offset;
      break;
    case 'left':
      tooltipX = dataPoint.x - tooltipWidth - offset;
      tooltipY = dataPoint.y - tooltipHeight / 2;
      break;
    case 'right':
      tooltipX = dataPoint.x + offset;
      tooltipY = dataPoint.y - tooltipHeight / 2;
      break;
    case 'fixed':
      tooltipX = chartX + 10;
      tooltipY = chartY + 10;
      break;
    default:
      tooltipX = cursorX + offset;
      tooltipY = cursorY - tooltipHeight - offset;
  }

  // Ensure tooltip stays within canvas bounds
  if (tooltipX + tooltipWidth > canvasWidth) {
    tooltipX = canvasWidth - tooltipWidth - 5;
  }
  if (tooltipX < 5) {
    tooltipX = 5;
  }
  if (tooltipY < 5) {
    tooltipY = dataPoint.y + offset; // Flip to bottom if too close to top
  }
  if (tooltipY + tooltipHeight > canvasHeight) {
    tooltipY = canvasHeight - tooltipHeight - 5;
  }

  // Set global opacity
  context.globalAlpha = opacity;

  // Draw shadow
  if (shadowBlur > 0) {
    context.shadowColor = shadowColor;
    context.shadowBlur = shadowBlur;
    context.shadowOffsetX = shadowOffsetX;
    context.shadowOffsetY = shadowOffsetY;
  }

  // Draw tooltip background
  context.fillStyle = backgroundColor;
  if (borderRadius > 0) {
    drawRoundedRect(context, tooltipX, tooltipY, tooltipWidth, tooltipHeight, borderRadius);
    context.fill();
  } else {
    context.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
  }

  // Draw border
  if (borderWidth > 0) {
    context.shadowColor = 'transparent'; // Disable shadow for border
    context.strokeStyle = borderColor;
    context.lineWidth = borderWidth;
    
    if (borderRadius > 0) {
      drawRoundedRect(context, tooltipX, tooltipY, tooltipWidth, tooltipHeight, borderRadius);
      context.stroke();
    } else {
      context.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    }
  }

  // Draw text
  context.shadowColor = 'transparent'; // Disable shadow for text
  context.fillStyle = textColor;
  context.textAlign = 'left';
  context.textBaseline = 'top';

  content.forEach((line, index) => {
    const textY = tooltipY + padding + index * lineHeight;
    
    // Handle text wrapping if needed
    if (context.measureText(line).width > maxWidth - padding * 2) {
      const words = line.split(' ');
      let currentLine = '';
      let lineIndex = index;
      
      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        if (context.measureText(testLine).width > maxWidth - padding * 2 && currentLine) {
          context.fillText(currentLine, tooltipX + padding, tooltipY + padding + lineIndex * lineHeight);
          currentLine = word;
          lineIndex++;
        } else {
          currentLine = testLine;
        }
      });
      
      if (currentLine) {
        context.fillText(currentLine, tooltipX + padding, tooltipY + padding + lineIndex * lineHeight);
      }
    } else {
      context.fillText(line, tooltipX + padding, textY);
    }
  });

  // Restore context state
  context.restore();
};

// Helper function to draw rounded rectangles
function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
} 