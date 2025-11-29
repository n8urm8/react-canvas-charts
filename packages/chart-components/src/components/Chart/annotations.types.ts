// Annotation type definitions for chart annotations
// These types are managed by the consuming application

export type AnnotationType = 'text' | 'line' | 'circle' | 'freehand';

export interface AnnotationCoordinate {
  /** Data index (for data-aligned annotations) or pixel X coordinate (for absolute positioning) */
  x: number;
  /** Y value in data space or pixel Y coordinate (for absolute positioning) */
  y: number;
  /** Whether coordinates are in data space (true) or pixel space (false) */
  dataSpace?: boolean;
}

export interface BaseAnnotation {
  /** Unique identifier for the annotation */
  id: string;
  /** Type of annotation */
  type: AnnotationType;
  /** Color of the annotation */
  color?: string;
  /** Stroke width for lines and shapes */
  strokeWidth?: number;
  /** Whether the annotation is currently selected/active for editing */
  selected?: boolean;
  /** Optional metadata for app-specific use */
  metadata?: Record<string, unknown>;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  /** Position of the text */
  position: AnnotationCoordinate;
  /** Text content */
  text: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right';
  /** Background color (optional) */
  backgroundColor?: string;
  /** Padding around text */
  padding?: number;
}

export interface LineAnnotation extends BaseAnnotation {
  type: 'line';
  /** Start point of the line */
  start: AnnotationCoordinate;
  /** End point of the line */
  end: AnnotationCoordinate;
  /** Line dash pattern */
  dash?: number[];
  /** Arrow at start */
  arrowStart?: boolean;
  /** Arrow at end */
  arrowEnd?: boolean;
}

export interface CircleAnnotation extends BaseAnnotation {
  type: 'circle';
  /** Center position */
  center: AnnotationCoordinate;
  /** Radius in pixels */
  radius: number;
  /** Fill color (optional) */
  fillColor?: string;
  /** Fill opacity */
  fillOpacity?: number;
}

export interface FreehandAnnotation extends BaseAnnotation {
  type: 'freehand';
  /** Array of points making up the freehand drawing */
  points: AnnotationCoordinate[];
  /** Whether to close the path */
  closed?: boolean;
  /** Smoothing factor (0 = no smoothing, 1 = maximum smoothing) */
  smoothing?: number;
}

export type ChartAnnotation = TextAnnotation | LineAnnotation | CircleAnnotation | FreehandAnnotation;

export interface AnnotationInteractionState {
  /** Current annotation being drawn/edited */
  activeAnnotationId?: string;
  /** Type of annotation being created */
  creatingType?: AnnotationType;
  /** Temporary points during creation */
  tempPoints?: AnnotationCoordinate[];
}
