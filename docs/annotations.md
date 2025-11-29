# Chart Annotations Guide

## Overview

The Chart Annotations system allows users to add interactive annotations to charts including text, lines, circles, and freehand drawings. The annotation state is **managed by the consuming application**, not the chart library, giving you full control over annotation data persistence, undo/redo, and interaction logic.

## Core Concepts

### State Management

Annotations are controlled externally by your application. The chart library only renders them - you manage:

- Adding/removing annotations
- Editing annotation properties
- Persisting annotations to a backend
- Undo/redo functionality
- Selection state

### Coordinate Systems

Annotations support two coordinate systems:

1. **Data Space** (`dataSpace: true`): Coordinates are relative to your data

   - `x` = data index
   - `y` = data value
   - Annotations move with the data when zooming/panning

2. **Pixel Space** (`dataSpace: false` or omitted): Absolute pixel coordinates
   - `x` = pixel position from left
   - `y` = pixel position from top
   - Annotations stay fixed in screen position

## Annotation Types

### TextAnnotation

Display text at a specific location.

```typescript
{
  id: 'text-1',
  type: 'text',
  position: { x: 5, y: 100, dataSpace: true },
  text: 'Peak value',
  fontSize: 14,
  textAlign: 'center',
  color: '#000000',
  backgroundColor: '#ffffff',
  padding: 8,
  selected: false
}
```

**Properties:**

- `position`: Location of the text
- `text`: Text content to display
- `fontSize`: Font size in pixels (default: 14)
- `textAlign`: 'left' | 'center' | 'right' (default: 'center')
- `color`: Text color (default: '#000000')
- `backgroundColor`: Optional background color
- `padding`: Padding around text when background is shown (default: 8)

### LineAnnotation

Draw a line (optionally with arrows) between two points.

```typescript
{
  id: 'line-1',
  type: 'line',
  start: { x: 0, y: 50, dataSpace: true },
  end: { x: 10, y: 150, dataSpace: true },
  color: '#ef4444',
  strokeWidth: 2,
  dash: [5, 5],
  arrowStart: false,
  arrowEnd: true,
  selected: false
}
```

**Properties:**

- `start`: Starting point
- `end`: Ending point
- `color`: Line color (default: '#000000')
- `strokeWidth`: Line width in pixels (default: 2)
- `dash`: Optional dash pattern (e.g., [5, 5] for dashed line)
- `arrowStart`: Show arrow at start point (default: false)
- `arrowEnd`: Show arrow at end point (default: false)

### CircleAnnotation

Draw a circle at a location with a specific radius.

```typescript
{
  id: 'circle-1',
  type: 'circle',
  center: { x: 5, y: 100, dataSpace: true },
  radius: 30,
  color: '#3b82f6',
  strokeWidth: 2,
  fillColor: '#3b82f6',
  fillOpacity: 0.2,
  selected: false
}
```

**Properties:**

- `center`: Center position
- `radius`: Radius in pixels
- `color`: Stroke color (default: '#000000')
- `strokeWidth`: Stroke width in pixels (default: 2)
- `fillColor`: Optional fill color
- `fillOpacity`: Fill opacity 0-1 (default: 0.3)

### FreehandAnnotation

Freehand drawing made up of multiple points.

```typescript
{
  id: 'freehand-1',
  type: 'freehand',
  points: [
    { x: 0, y: 50, dataSpace: true },
    { x: 1, y: 55, dataSpace: true },
    { x: 2, y: 48, dataSpace: true },
    // ... more points
  ],
  color: '#10b981',
  strokeWidth: 2,
  closed: false,
  smoothing: 0.5,
  selected: false
}
```

**Properties:**

- `points`: Array of points making up the path
- `color`: Line color (default: '#000000')
- `strokeWidth`: Line width in pixels (default: 2)
- `closed`: Whether to close the path (default: false)
- `smoothing`: Smoothing factor 0-1 (0 = no smoothing, 1 = max smoothing)

## Basic Usage

### 1. Set Up State

```typescript
import { useState } from 'react';
import type { ChartAnnotation } from 'react-canvas-charts';

function MyChart() {
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>([
    {
      id: 'annotation-1',
      type: 'text',
      position: { x: 5, y: 100, dataSpace: true },
      text: 'Important point',
      fontSize: 14,
      color: '#000000',
      backgroundColor: '#ffeb3b',
      padding: 8,
    },
    {
      id: 'annotation-2',
      type: 'line',
      start: { x: 3, y: 80, dataSpace: true },
      end: { x: 7, y: 120, dataSpace: true },
      color: '#ef4444',
      strokeWidth: 2,
      arrowEnd: true,
    },
  ]);
```

### 2. Render Annotations Layer

```typescript
  return (
    <ChartSurface data={data} xKey="x" width={800} height={400}>
      {/* Other chart layers */}
      <ChartGridLayer />
      <ChartLineSeries dataKey="value" />
      <ChartXAxis />
      <ChartYAxis />

      {/* Annotations layer */}
      <ChartAnnotationsLayer annotations={annotations} />
    </ChartSurface>
  );
}
```

### 3. Adding Annotations

```typescript
const addTextAnnotation = (x: number, y: number, text: string) => {
  const newAnnotation: ChartAnnotation = {
    id: `text-${Date.now()}`,
    type: 'text',
    position: { x, y, dataSpace: true },
    text,
    fontSize: 14,
    color: '#000000'
  }

  setAnnotations((prev) => [...prev, newAnnotation])
}

const addLineAnnotation = (x1: number, y1: number, x2: number, y2: number) => {
  const newAnnotation: ChartAnnotation = {
    id: `line-${Date.now()}`,
    type: 'line',
    start: { x: x1, y: y1, dataSpace: true },
    end: { x: x2, y: y2, dataSpace: true },
    color: '#ef4444',
    strokeWidth: 2
  }

  setAnnotations((prev) => [...prev, newAnnotation])
}
```

### 4. Editing Annotations

```typescript
const updateAnnotation = (id: string, updates: Partial<ChartAnnotation>) => {
  setAnnotations((prev) => prev.map((ann) => (ann.id === id ? { ...ann, ...updates } : ann)))
}

// Example: Update text
updateAnnotation('text-1', { text: 'Updated text' })

// Example: Move annotation
updateAnnotation('text-1', {
  position: { x: 10, y: 120, dataSpace: true }
})

// Example: Change color
updateAnnotation('line-1', { color: '#10b981' })
```

### 5. Removing Annotations

```typescript
const removeAnnotation = (id: string) => {
  setAnnotations((prev) => prev.filter((ann) => ann.id !== id))
}

const clearAllAnnotations = () => {
  setAnnotations([])
}
```

### 6. Selection Management

```typescript
const selectAnnotation = (id: string) => {
  setAnnotations((prev) =>
    prev.map((ann) => ({
      ...ann,
      selected: ann.id === id
    }))
  )
}

const deselectAll = () => {
  setAnnotations((prev) =>
    prev.map((ann) => ({
      ...ann,
      selected: false
    }))
  )
}
```

## Advanced Patterns

### Toolbar Integration

Create annotation tools in your toolbar:

```typescript
import { Type, Minus, Circle, Pen } from 'lucide-react'

const annotationTools = [
  { id: 'text', label: 'Text', icon: <Type size={16} /> },
  { id: 'line', label: 'Line', icon: <Minus size={16} /> },
  { id: 'circle', label: 'Circle', icon: <Circle size={16} /> },
  { id: 'freehand', label: 'Draw', icon: <Pen size={16} /> }
]

;<ChartToolbar
  tools={annotationTools}
  onToggle={(tool, isActive) => {
    if (isActive) {
      setActiveAnnotationTool(tool.id)
    } else {
      setActiveAnnotationTool(null)
    }
  }}
/>
```

### Persistence

```typescript
// Save to localStorage
const saveAnnotations = () => {
  localStorage.setItem('chart-annotations', JSON.stringify(annotations))
}

// Load from localStorage
const loadAnnotations = () => {
  const saved = localStorage.getItem('chart-annotations')
  if (saved) {
    setAnnotations(JSON.parse(saved))
  }
}

// Save to backend
const saveToBackend = async () => {
  await fetch('/api/annotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(annotations)
  })
}
```

### Undo/Redo

```typescript
const [history, setHistory] = useState<ChartAnnotation[][]>([])
const [historyIndex, setHistoryIndex] = useState(-1)

const addToHistory = (newAnnotations: ChartAnnotation[]) => {
  const newHistory = history.slice(0, historyIndex + 1)
  newHistory.push(newAnnotations)
  setHistory(newHistory)
  setHistoryIndex(newHistory.length - 1)
}

const undo = () => {
  if (historyIndex > 0) {
    setHistoryIndex(historyIndex - 1)
    setAnnotations(history[historyIndex - 1])
  }
}

const redo = () => {
  if (historyIndex < history.length - 1) {
    setHistoryIndex(historyIndex + 1)
    setAnnotations(history[historyIndex + 1])
  }
}
```

### Metadata

Use the `metadata` field to store custom data:

```typescript
{
  id: 'annotation-1',
  type: 'text',
  position: { x: 5, y: 100, dataSpace: true },
  text: 'Note',
  metadata: {
    author: 'John Doe',
    created: '2025-11-29T10:00:00Z',
    category: 'important',
    tags: ['review', 'highlight'],
  },
}
```

## Best Practices

1. **Use unique IDs**: Generate unique IDs for each annotation (e.g., using `Date.now()` or UUID)

2. **Choose coordinate system wisely**:

   - Use data space for annotations that should move with data (e.g., marking specific data points)
   - Use pixel space for UI-like annotations (e.g., fixed labels)

3. **Validate coordinates**: Ensure x/y values are within valid ranges for your data

4. **Batch updates**: When updating multiple annotations, batch them in a single state update

5. **Performance**: For large numbers of annotations, consider:

   - Virtualization (only render visible annotations)
   - Memoization
   - Debouncing updates during interaction

6. **Accessibility**: Consider adding keyboard shortcuts for annotation management

## Example: Complete Implementation

See the Interactive Chart Demo for a complete example with:

- Toolbar-based annotation creation
- Click-and-drag drawing
- Selection and editing
- Undo/redo support
- Persistence

## TypeScript Types

All annotation types are fully typed. Import them from the library:

```typescript
import type {
  ChartAnnotation,
  TextAnnotation,
  LineAnnotation,
  CircleAnnotation,
  FreehandAnnotation,
  AnnotationType,
  AnnotationCoordinate
} from 'react-canvas-charts'
```
