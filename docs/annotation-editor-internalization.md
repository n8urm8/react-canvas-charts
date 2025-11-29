# Annotation Editor Internalization

## Overview

The annotation editor has been fully integrated into the `ChartAnnotationsLayer` component, eliminating the need for consuming applications to manage editor state or render the editor component manually.

## Changes Made

### 1. ChartAnnotationsLayer Component

**File:** `packages/chart-components/src/components/Chart/ChartAnnotationsLayer.tsx`

#### New Features:

- **Internal Editor Component**: The `AnnotationEditor` component is now defined internally within the ChartAnnotationsLayer file and is not exported
- **Automatic Click Detection**: The layer automatically detects clicks on text annotations and displays the editor
- **Portal Rendering**: Uses React portals to render the editor as an HTML overlay above the chart canvas
- **Internal State Management**: Manages `selectedAnnotationId` internally to track which annotation is being edited

#### Updated Props:

```typescript
export interface ChartAnnotationsLayerProps {
  /** Array of annotations to render */
  annotations: ChartAnnotation[]
  /** Callback when annotations are updated */
  onAnnotationsChange?: (annotations: ChartAnnotation[]) => void
  /** Current annotation being created (controlled by parent) */
  creatingType?: AnnotationType
  // ... other props remain the same
}
```

**Key Change**: Replaced `onAnnotationClick` with `onAnnotationsChange` callback that receives the updated annotations array.

#### Implementation Details:

- Finds chart container element using `document.querySelector('.chart-surface-container')`
- Attaches click event listener to detect clicks on text annotations
- Renders editor conditionally when a text annotation is selected
- Updates annotations via `onAnnotationsChange` callback when editor makes changes
- Clicking outside the editor closes it automatically

### 2. Chart Library Exports

**File:** `packages/chart-components/src/components/Chart/index.ts`

**Removed Export:**

```typescript
// export * from './ChartAnnotationEditor'  // REMOVED - now internal only
```

The `ChartAnnotationEditor` is no longer part of the public API.

### 3. Demo Application Updates

**File:** `packages/demo-app/src/pages/InteractiveChartDemoNew.tsx`

#### Removed Code:

- ✅ `selectedAnnotationId` state and `setSelectedAnnotationId` calls
- ✅ `chartContainerRef` reference
- ✅ Manual `ChartAnnotationEditor` import and rendering
- ✅ Click detection logic for selecting annotations
- ✅ Editor visibility management
- ✅ "Edit" button in annotations list (editing now happens by clicking on annotation directly)

#### Simplified API Usage:

**Before:**

```typescript
const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
const chartContainerRef = useRef<HTMLDivElement>(null)

// ... complex click detection logic ...

<div ref={chartContainerRef}>
  <ChartSurface>
    <ChartAnnotationsLayer annotations={annotations} />
  </ChartSurface>

  {selectedAnnotationId && (
    <ChartAnnotationEditor
      annotation={selectedAnnotation}
      onUpdate={handleUpdate}
      onClose={() => setSelectedAnnotationId(null)}
      chartContainerRef={chartContainerRef.current}
    />
  )}
</div>
```

**After:**

```typescript
<ChartSurface>
  <ChartAnnotationsLayer annotations={annotations} onAnnotationsChange={setAnnotations} />
</ChartSurface>
```

### 4. InteractiveChartCanvas Component

**File:** `packages/demo-app/src/ExampleComponents/InteractiveChart/InteractiveChartCanvas.tsx`

Added `onAnnotationsChange` prop that forwards to `ChartAnnotationsLayer`:

```typescript
type InteractiveChartCanvasProps = {
  // ... existing props
  onAnnotationsChange?: (annotations: ChartAnnotation[]) => void
}
```

## Benefits

### For Library Consumers:

1. **Simplified API**: No need to manage editor state, visibility, or positioning
2. **Less Boilerplate**: Remove ~50 lines of state management and event handling code
3. **Better Encapsulation**: Editor implementation details are hidden from consumers
4. **Automatic UX**: Click-to-edit behavior works out of the box

### For Library Maintainers:

1. **Single Source of Truth**: Editor logic and rendering are in one place
2. **Easier Updates**: Changes to editor don't affect consumer code
3. **Better Testing**: Internal integration can be tested as a unit

## Migration Guide

If you have existing code using the old API:

### Step 1: Remove Editor Imports

```diff
- import { ChartAnnotationEditor } from 'react-canvas-charts'
```

### Step 2: Remove State Management

```diff
- const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
- const chartContainerRef = useRef<HTMLDivElement>(null)
```

### Step 3: Remove Manual Editor Rendering

```diff
- <div ref={chartContainerRef}>
-   {selectedAnnotationId && (
-     <ChartAnnotationEditor
-       annotation={selectedAnnotation}
-       onUpdate={handleUpdate}
-       onClose={() => setSelectedAnnotationId(null)}
-       chartContainerRef={chartContainerRef.current}
-     />
-   )}
- </div>
```

### Step 4: Add onAnnotationsChange Callback

```diff
  <ChartAnnotationsLayer
    annotations={annotations}
+   onAnnotationsChange={setAnnotations}
  />
```

### Step 5: Remove Click Detection Logic

Delete any manual click detection code that was used to select annotations for editing. The layer handles this internally now.

## Usage Example

```typescript
import { useState } from 'react'
import { ChartSurface, ChartAnnotationsLayer, type ChartAnnotation } from 'react-canvas-charts'

export function MyChart() {
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>([
    {
      id: 'text-1',
      type: 'text',
      position: { x: 100, y: 50 },
      text: 'Click me to edit!',
      fontSize: 16,
      color: '#ff6b6b'
    }
  ])

  return (
    <ChartSurface width={800} height={400}>
      {/* Other chart layers... */}

      <ChartAnnotationsLayer annotations={annotations} onAnnotationsChange={setAnnotations} />
    </ChartSurface>
  )
}
```

That's it! The editor will automatically appear when you click on the text annotation.

## Technical Notes

### Click Detection Algorithm

The layer uses a simple bounding box hit test to detect clicks on text annotations:

```typescript
const fontSize = annotation.fontSize ?? 14
const padding = annotation.padding ?? 8
const textWidth = Math.max(100, annotation.text.length * fontSize * 0.6)
const textHeight = fontSize + padding * 2

// Check if click is within bounding box
if (
  x >= pos.x - padding &&
  x <= pos.x + textWidth + padding &&
  y >= pos.y - textHeight / 2 - padding &&
  y <= pos.y + textHeight / 2 + padding
) {
  // Show editor
}
```

### Portal Rendering

The editor uses `createPortal` from React to render as an HTML overlay:

```typescript
return createPortal(
  <AnnotationEditor ... />,
  chartContainerRef.current
)
```

This ensures the editor appears above the canvas layers while maintaining React component tree for state management.

### Chart Container Detection

The layer finds the chart container automatically:

```typescript
useEffect(() => {
  const chartElement = document.querySelector('.chart-surface-container')
  if (chartElement) {
    chartContainerRef.current = chartElement as HTMLDivElement
  }
}, [])
```

## Future Enhancements

Potential improvements for future versions:

- [ ] Support editing other annotation types (line endpoints, circle radius, etc.)
- [ ] Multiple selection and bulk editing
- [ ] Keyboard shortcuts (Delete to remove, Escape to deselect)
- [ ] Undo/redo support
- [ ] Annotation templates and styles
- [ ] Copy/paste annotations
