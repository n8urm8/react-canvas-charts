# Zoom and Pan

`ChartZoomLayer` adds mouse wheel, drag, and touch zoom and pan to a chart. It is opt-in: render it inside a `ChartSurface` to enable these gestures, and leave it out for charts that should not capture them.

The layer is controlled. It never stores zoom state. When a gesture changes the view, it reports the next range or domain, and your code stores it and passes it back to the chart. This matches how `viewRange` already works, and it means the same state can drive toolbar buttons, URLs, or saved views.

## Quick start

```tsx
import { useState } from 'react'
import {
  ChartLineSeries,
  ChartSurface,
  ChartXAxis,
  ChartYAxis,
  ChartZoomLayer,
  type ChartViewRange,
  type ChartZoomValueDomain
} from 'react-canvas-charts'

export function PriceChart({ data }: { data: Record<string, unknown>[] }) {
  const [viewRange, setViewRange] = useState<ChartViewRange | undefined>(undefined)
  const [valueDomains, setValueDomains] = useState<Record<string, ChartZoomValueDomain>>({})

  return (
    <ChartSurface
      data={data}
      xKey="label"
      yKeys={['price']}
      viewRange={viewRange}
      valueScales={[{ id: 'price', dataKeys: ['price'], domain: valueDomains.price }]}
    >
      <ChartXAxis />
      <ChartYAxis scaleId="price" />
      <ChartLineSeries dataKey="price" />
      <ChartZoomLayer
        onViewRangeChange={setViewRange}
        onValueDomainChange={(scaleId, domain) =>
          setValueDomains((previous) => {
            const next = { ...previous }
            if (domain) {
              next[scaleId] = domain
            } else {
              delete next[scaleId]
            }
            return next
          })
        }
      />
    </ChartSurface>
  )
}
```

With only `onViewRangeChange`, the plot and x-axis gestures work and the value axes do not respond. Add `onValueDomainChange` and feed the domain back through `valueScales` to make the value axes zoomable.

## Gestures

Gestures are routed by where they start. Over the plot or the x-axis labels, they act on the x range. Over a value axis's labels, they act on that axis only.

### Plot and x-axis

| Gesture | Effect |
| --- | --- |
| Ctrl/⌘ + wheel (default `wheel` mode) | Zoom x around the pointer. Trackpad pinch arrives as Ctrl + wheel in most browsers, so it works too. |
| Plain wheel (`wheel="always"`) | Zoom x around the pointer. The wheel is only taken over when the zoom changes the view, so the page still scrolls once fully zoomed out. |
| Horizontal scroll, or Shift + wheel | Pan x. |
| Ctrl/⌘ + drag | Pan x and y together. Y only moves once that axis is zoomed in. |
| Two-finger pinch | Zoom x around the midpoint of the fingers. |
| Two-finger drag | Pan x and y together. |

### Value axis labels

Each value axis is a separate scale. A gesture that starts over an axis's labels changes only that scale.

| Gesture | Effect |
| --- | --- |
| Ctrl/⌘ + wheel, or plain wheel in `"always"` mode | Zoom that axis around the pointer. |
| Ctrl/⌘ + drag | Pan that axis. |
| Two-finger pinch (fingers apart vertically) | Zoom that axis. |
| Two-finger drag | Pan that axis. |
| Double-click | Return that axis to automatic. |

Horizontal scrolling over a value axis does nothing, so the axis only moves on purpose.

### Limits

- Pans stop at the edges of the data. An x pan stays inside the full x extent. A y pan stays inside the full range of that scale's data, not just the visible part.
- Zooming out until the window is as wide as the automatic domain returns that axis to automatic. The automatic domain is fitted to the visible data, so the axis keeps following the data.
- Zoom is limited to `minSpan` points on the x range (default 4). Value axes stop at 1% of their full data range.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `onViewRangeChange` | `(range: ChartViewRange) => void` | required | Receives the next inclusive x range for plot and x-axis gestures. Store it and pass it back as the surface's `viewRange`. |
| `onValueDomainChange` | `(scaleId: string, domain: ChartZoomValueDomain \| null) => void` | none | Receives the next domain for a value axis, or `null` when the axis should be automatic again. Without it, value-axis gestures do nothing. |
| `wheel` | `'modifier' \| 'always' \| false` | `'modifier'` | Wheel zoom mode. `false` turns wheel zoom off, but horizontal scroll still pans. |
| `pinch` | `boolean` | `true` | Two-finger pinch zoom. |
| `pan` | `boolean` | `true` | Ctrl/⌘ + drag, horizontal scroll, Shift + wheel, and two-finger drag panning. |
| `minSpan` | `number` | `4` | Smallest visible x span, in data points. |

## Value axes

A value axis zooms only when the chart knows its domain. Two things make that work:

1. Render the axis with `ChartYAxis` and a `scaleId`. The layer finds the axis under the pointer through that id.
2. Store the domains you receive from `onValueDomainChange` and pass them back through `valueScales`:

```tsx
valueScales={[
  { id: 'price', dataKeys: ['price'], domain: valueDomains.price },
  { id: 'volume', dataKeys: ['volume'], domain: valueDomains.volume }
]}
```

Domains are in data units, the same as a scale's `domain`. The layer converts padded windows for you, so the axis draws exactly the window the gesture produced.

Value-axis gestures are disabled for horizontal bar charts, where the value axis is the x axis.

## Clipping

Data layers are clipped to the plot area. Lines, areas, bars, points, and value labels stop at the plot edge when a zoomed window shows only part of a series. Values outside the window are also left out of hit testing, so the cursor and tooltips never snap to a point you cannot see.

Custom tags whose value is outside the plot are hidden. Annotations and point selectors are not clipped yet, so keep them inside the range you expect to show.

If you write a layer that draws data, pass `clip: true` in its layer options (`useChartLayer(draw, { order, clip: true })`) to get the same clipping.

## Toolbar zoom buttons

Zoom state lives in your app, so toolbar buttons are app code. The Interactive Chart demo uses this pattern:

- **Zoom In** zooms to the current selection. With no selection, it halves the visible x range around its centre, down to `minSpan` points. Once the view is that narrow, it reports that it is already at maximum zoom.
- **Zoom Out** pops the top of the x zoom stack, so each click steps back one committed x level. When there is no x history, it returns every value axis to automatic. If you zoomed x and y, the first click restores x and the next click resets y.

The centred zoom is a small helper on the x range:

```ts
const MIN_ZOOM_SPAN = 4

/** Half the span of `range`, centred on it, but never tighter than MIN_ZOOM_SPAN. */
const centredZoomRange = (range: { start: number; end: number }) => {
  const span = range.end - range.start
  const nextSpan = Math.max(MIN_ZOOM_SPAN, Math.round(span / 2))
  const center = (range.start + range.end) / 2
  const start = Math.min(Math.max(Math.round(center - nextSpan / 2), range.start), range.end - nextSpan)
  return { start, end: start + nextSpan }
}
```

Keep the x zoom stack as described in [zooming-and-streaming.md](zooming-and-streaming.md). Streaming data and zoom ranges interact there, so it is worth reading before you add zoom to a live chart.

## Touch and platform notes

- The chart's canvas sets `touch-action: none`, so two-finger gestures reach the chart and not the browser. The layer also stops two-finger gestures from scrolling the page while the chart is being moved.
- A second finger cancels a one-finger drag selection that is in progress, so a pinch never leaves a stray selection behind.
- Ctrl/⌘ + wheel is always taken over by the chart, which stops the browser from zooming the whole page.
- On macOS, Ctrl + click normally opens a context menu. While `pan` is on, the layer suppresses the context menu for Ctrl or ⌘ held over the chart, so Ctrl + drag can pan.
- Plain drags still select a range. Only Ctrl/⌘ + drag pans.

## Try it

The [Interactive Chart demo](../packages/demo-app/src/pages/InteractiveChartDemoNew.tsx) enables the layer from the control panel under **Enable Scroll / Pinch Zoom**. Its source wires every pattern above: the x zoom stack, value-axis domains, and toolbar zoom buttons.
