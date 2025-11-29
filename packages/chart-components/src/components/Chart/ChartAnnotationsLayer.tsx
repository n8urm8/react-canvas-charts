import React, { useCallback, useMemo, useRef, useState } from 'react';
import { LayerOrder, useChartLayer, type ChartLayerRenderer } from './ChartSurface';
import type {
  ChartAnnotation,
  AnnotationCoordinate,
  AnnotationType,
  TextAnnotation,
  LineAnnotation,
  CircleAnnotation,
  FreehandAnnotation,
} from './annotations.types';

export interface ChartAnnotationsLayerProps {
  /** Array of annotations to render */
  annotations: ChartAnnotation[];
  /** Callback when an annotation is clicked */
  onAnnotationClick?: (annotation: ChartAnnotation, event: MouseEvent) => void;
  /** Current annotation being created (controlled by parent) */
  creatingType?: AnnotationType;
  /** Callback when annotation creation is in progress */
  onAnnotationCreate?: (annotation: Partial<ChartAnnotation>) => void;
  /** Callback when annotation creation is complete */
  onAnnotationComplete?: (annotation: ChartAnnotation) => void;
  /** Whether annotation creation is enabled */
  enableCreation?: boolean;
}

// Helper to convert data space coordinates to pixel space
const toPixelSpace = (
  coord: AnnotationCoordinate,
  getXPosition: (index: number) => number,
  getYPosition: (value: number) => number
): { x: number; y: number } => {
  if (coord.dataSpace) {
    return {
      x: getXPosition(coord.x),
      y: getYPosition(coord.y),
    };
  }
  return { x: coord.x, y: coord.y };
};

// Render a text annotation
const renderTextAnnotation = (
  context: CanvasRenderingContext2D,
  annotation: TextAnnotation,
  getXPosition: (index: number) => number,
  getYPosition: (value: number) => number
) => {
  const pos = toPixelSpace(annotation.position, getXPosition, getYPosition);
  const fontSize = annotation.fontSize ?? 14;
  const padding = annotation.padding ?? 8;
  const textAlign = annotation.textAlign ?? 'center';

  context.save();
  context.font = `${fontSize}px sans-serif`;
  context.textAlign = textAlign;
  context.textBaseline = 'middle';

  // Measure text
  const metrics = context.measureText(annotation.text);
  const textWidth = metrics.width;
  const textHeight = fontSize;

  // Draw background if specified
  if (annotation.backgroundColor) {
    context.fillStyle = annotation.backgroundColor;
    let bgX = pos.x - padding;
    if (textAlign === 'center') {
      bgX = pos.x - textWidth / 2 - padding;
    } else if (textAlign === 'right') {
      bgX = pos.x - textWidth - padding;
    }
    context.fillRect(bgX, pos.y - textHeight / 2 - padding, textWidth + padding * 2, textHeight + padding * 2);
  }

  // Draw text
  context.fillStyle = annotation.color ?? '#000000';
  context.fillText(annotation.text, pos.x, pos.y);

  // Draw selection indicator if selected
  if (annotation.selected) {
    context.strokeStyle = '#3b82f6';
    context.lineWidth = 2;
    let bgX = pos.x - padding;
    if (textAlign === 'center') {
      bgX = pos.x - textWidth / 2 - padding;
    } else if (textAlign === 'right') {
      bgX = pos.x - textWidth - padding;
    }
    context.strokeRect(bgX, pos.y - textHeight / 2 - padding, textWidth + padding * 2, textHeight + padding * 2);
  }

  context.restore();
};

// Render a line annotation
const renderLineAnnotation = (
  context: CanvasRenderingContext2D,
  annotation: LineAnnotation,
  getXPosition: (index: number) => number,
  getYPosition: (value: number) => number
) => {
  const start = toPixelSpace(annotation.start, getXPosition, getYPosition);
  const end = toPixelSpace(annotation.end, getXPosition, getYPosition);

  context.save();
  context.strokeStyle = annotation.color ?? '#000000';
  context.lineWidth = annotation.strokeWidth ?? 2;

  if (annotation.dash && annotation.dash.length > 0) {
    context.setLineDash(annotation.dash);
  }

  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();

  // Draw arrows if specified
  const drawArrow = (fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    context.beginPath();
    context.moveTo(toX, toY);
    context.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    context.moveTo(toX, toY);
    context.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    context.stroke();
  };

  if (annotation.arrowStart) {
    drawArrow(end.x, end.y, start.x, start.y);
  }
  if (annotation.arrowEnd) {
    drawArrow(start.x, start.y, end.x, end.y);
  }

  // Draw selection indicators
  if (annotation.selected) {
    context.fillStyle = '#3b82f6';
    context.fillRect(start.x - 4, start.y - 4, 8, 8);
    context.fillRect(end.x - 4, end.y - 4, 8, 8);
  }

  context.restore();
};

// Render a circle annotation
const renderCircleAnnotation = (
  context: CanvasRenderingContext2D,
  annotation: CircleAnnotation,
  getXPosition: (index: number) => number,
  getYPosition: (value: number) => number
) => {
  const center = toPixelSpace(annotation.center, getXPosition, getYPosition);

  context.save();
  context.strokeStyle = annotation.color ?? '#000000';
  context.lineWidth = annotation.strokeWidth ?? 2;

  context.beginPath();
  context.arc(center.x, center.y, annotation.radius, 0, 2 * Math.PI);

  // Fill if specified
  if (annotation.fillColor) {
    context.fillStyle = annotation.fillColor;
    context.globalAlpha = annotation.fillOpacity ?? 0.3;
    context.fill();
    context.globalAlpha = 1;
  }

  context.stroke();

  // Draw selection indicator
  if (annotation.selected) {
    context.strokeStyle = '#3b82f6';
    context.lineWidth = 2;
    context.setLineDash([5, 5]);
    context.stroke();
    context.fillStyle = '#3b82f6';
    context.fillRect(center.x - 4, center.y - 4, 8, 8);
  }

  context.restore();
};

// Render a freehand annotation
const renderFreehandAnnotation = (
  context: CanvasRenderingContext2D,
  annotation: FreehandAnnotation,
  getXPosition: (index: number) => number,
  getYPosition: (value: number) => number
) => {
  if (annotation.points.length < 2) return;

  const points = annotation.points.map((p) => toPixelSpace(p, getXPosition, getYPosition));

  context.save();
  context.strokeStyle = annotation.color ?? '#000000';
  context.lineWidth = annotation.strokeWidth ?? 2;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  if (annotation.smoothing && annotation.smoothing > 0) {
    // Smooth the path using quadratic curves
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      context.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    const last = points[points.length - 1];
    context.lineTo(last.x, last.y);
  } else {
    // Draw straight lines between points
    for (let i = 1; i < points.length; i++) {
      context.lineTo(points[i].x, points[i].y);
    }
  }

  if (annotation.closed) {
    context.closePath();
  }

  context.stroke();

  // Draw selection indicators
  if (annotation.selected) {
    context.fillStyle = '#3b82f6';
    points.forEach((point, index) => {
      if (index % 5 === 0 || index === points.length - 1) {
        context.fillRect(point.x - 3, point.y - 3, 6, 6);
      }
    });
  }

  context.restore();
};

export const ChartAnnotationsLayer: React.FC<ChartAnnotationsLayerProps> = ({
  annotations,
  creatingType,
}) => {
  const layerOptions = useMemo(() => ({ order: LayerOrder.overlays + 5 }), []);
  const [isDrawing] = useState(false);
  const drawingPointsRef = useRef<AnnotationCoordinate[]>([]);

  const draw = useCallback<ChartLayerRenderer>(
    (context, helpers) => {
      // Render all annotations
      annotations.forEach((annotation) => {
        switch (annotation.type) {
          case 'text':
            renderTextAnnotation(context, annotation, helpers.getXPosition, helpers.getYPosition);
            break;
          case 'line':
            renderLineAnnotation(context, annotation, helpers.getXPosition, helpers.getYPosition);
            break;
          case 'circle':
            renderCircleAnnotation(context, annotation, helpers.getXPosition, helpers.getYPosition);
            break;
          case 'freehand':
            renderFreehandAnnotation(context, annotation, helpers.getXPosition, helpers.getYPosition);
            break;
        }
      });

      // Render temporary annotation during creation
      if (isDrawing && drawingPointsRef.current.length > 0 && creatingType) {
        const points = drawingPointsRef.current;
        context.save();
        context.strokeStyle = '#3b82f6';
        context.lineWidth = 2;
        context.setLineDash([5, 5]);

        if (creatingType === 'line' && points.length >= 1) {
          const start = toPixelSpace(points[0], helpers.getXPosition, helpers.getYPosition);
          const end =
            points.length > 1
              ? toPixelSpace(points[1], helpers.getXPosition, helpers.getYPosition)
              : start;
          context.beginPath();
          context.moveTo(start.x, start.y);
          context.lineTo(end.x, end.y);
          context.stroke();
        } else if (creatingType === 'circle' && points.length >= 1) {
          const center = toPixelSpace(points[0], helpers.getXPosition, helpers.getYPosition);
          const end =
            points.length > 1
              ? toPixelSpace(points[1], helpers.getXPosition, helpers.getYPosition)
              : center;
          const radius = Math.sqrt(Math.pow(end.x - center.x, 2) + Math.pow(end.y - center.y, 2));
          context.beginPath();
          context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
          context.stroke();
        } else if (creatingType === 'freehand' && points.length > 1) {
          const pixelPoints = points.map((p) => toPixelSpace(p, helpers.getXPosition, helpers.getYPosition));
          context.beginPath();
          context.moveTo(pixelPoints[0].x, pixelPoints[0].y);
          for (let i = 1; i < pixelPoints.length; i++) {
            context.lineTo(pixelPoints[i].x, pixelPoints[i].y);
          }
          context.stroke();
        }

        context.restore();
      }
    },
    [annotations, creatingType, isDrawing]
  );

  useChartLayer(draw, layerOptions);

  return null;
};
