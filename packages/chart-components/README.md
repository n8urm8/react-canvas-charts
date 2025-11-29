# React Canvas Charts

### Note - This package is still in early development

React Canvas Charts is a streaming-friendly charting library built on React, TypeScript, and the HTML5 canvas element. The package ships reusable chart primitives (surface, layers, overlays). 

The repository contains two primary targets:

- `src/components/Chart` – the publishable library source. It exposes the chart surface, layer primitives, toolbar, cursor tooling, and utilities for building custom visualizations. Consumers import from this path when bundling the library for npm distribution.
- Development demo (root Vite app) – a local-only playground located at the repository root (`src/`, `main.tsx`, `src/pages/**`). It consumes the chart components directly from source to exercise scenarios during development; it is not part of the published package.

## Features

- Canvas-backed rendering for fast redrawing during streaming updates.
- Layer-first architecture: grid, series, points, annotations, cursor, tooltip, and overlays can be mixed and matched.
- Line chart convenience component that accepts either a single series or multiple series configuration.
- Toolbar helpers for zoom, pan, annotation, and custom actions.
- Built-in cursor and tooltip behaviors with data snapping and customizable templates.
- Overlay legend component with configurable positioning and layout.
- Streaming-friendly patterns, including guidance on keeping zoom state in sync with live feeds (`docs/zooming-and-streaming.md`).

## Quick Start

Install the library in an existing React 18/19 application:

```bash
pnpm add react-canvas-charts
# or
npm install react-canvas-charts
# or
yarn add react-canvas-charts
```

Ensure `react`, `react-dom`, and `lucide-react` are available (they are peer dependencies).

### Canvas Composition Example

The library exports low-level primitives (e.g., `ChartSurface`, `ChartLineSeries`, `ChartCursorLayer`) that you can compose directly. The example below mirrors the generated code preview shown in the Interactive Chart demo and demonstrates how each layer fits together.

```tsx
import { useState } from "react";
import {
  ChartSurface,
  ChartGridLayer,
  ChartXAxis,
  ChartYAxis,
  ChartLineSeries,
  ChartAreaSeries,
  ChartPointSeries,
  ChartValueLabels,
  ChartCursorLayer,
  ChartTooltipLayer,
  ChartTitleLayer,
  ChartToolbar,
  ChartOverlayPortal,
  ChartLegend,
} from "react-canvas-charts";

const DATA = [
  { label: "00:00", series1: 18, series2: 21 },
  { label: "00:05", series1: 20, series2: 23 },
  { label: "00:10", series1: 22, series2: 24 },
  { label: "00:15", series1: 23, series2: 26 },
];

const VALUE_SCALES = [
  { id: "primary", dataKeys: ["series1", "series2"] },
];

export function CanvasChartExample() {
  const [activeTools, setActiveTools] = useState<string[]>([]);

  return (
    <ChartSurface
      data={DATA}
      xKey="label"
      yKeys={["series1", "series2"]}
      width="100%"
      height={400}
      margin={{ top: 72, right: 72, bottom: 72, left: 72 }}
      defaultColors={["#3b82f6", "#ef4444"]}
      valueScales={VALUE_SCALES}
    >
      <ChartTitleLayer title="Live Sensor Data" />
      <ChartGridLayer show color="#e5e7eb" />
      <ChartXAxis
        show
        title="Timestamp"
        showTitle
        tickStep={1}
        maxTicks={8}
        labelOffsetY={6}
      />
      <ChartYAxis
        show
        title="Value"
        showTitle
        titleRotation={-90}
        scaleId="primary"
        side="left"
      />
      <ChartAreaSeries dataKey="series1" color="#3b82f6" opacity={0.12} />
      <ChartAreaSeries dataKey="series2" color="#ef4444" opacity={0.12} />
      <ChartLineSeries dataKey="series1" color="#3b82f6" lineWidth={2} smooth />
      <ChartLineSeries dataKey="series2" color="#ef4444" lineWidth={2} />
      <ChartPointSeries dataKey="series1" size={4} color="#3b82f6" showShadow />
      <ChartPointSeries dataKey="series2" size={4} color="#ef4444" showShadow />
      <ChartValueLabels dataKey="series1" />
      <ChartCursorLayer snapToDataPoints snapAlongYAxis />
      <ChartTooltipLayer
        position="follow"
        template="{label}: {value}"
        seriesLabels={{ series1: "Sensor A", series2: "Sensor B" }}
      />
      <ChartLegend
        title="Sensors"
        items={[
          { dataKey: "series1", label: "Sensor A" },
          { dataKey: "series2", label: "Sensor B" },
        ]}
        placement={{ mode: "anchor", position: "top-right" }}
      />
      <ChartOverlayPortal>
        <ChartToolbar
          tools={[
            { id: "zoom-in", label: "Zoom In" },
            { id: "zoom-out", label: "Zoom Out" },
            { id: "pan", label: "Pan" },
          ]}
          activeToolIds={activeTools}
          onToggle={(_, __, next) => setActiveTools(next)}
          multiSelect={false}
          position={{ top: 16, left: 16 }}
          visibility="hover"
          moveable
        />
      </ChartOverlayPortal>
    </ChartSurface>
  );
}
```

This example illustrates every major layer—surface, grid, axes, series, overlays, cursor, tooltip, and toolbar—so you can adapt it to your own data pipelines. For an end-to-end streaming implementation, see `docs/zooming-and-streaming.md` and the full demo in `src/pages/InteractiveChartDemoNew.tsx`.

## Developing Locally

Clone the repository and install dependencies:

```bash
pnpm install
```

Run the demo application:

```bash
pnpm dev
```

Build the library:

```bash
pnpm build
```

Lint the codebase:

```bash
pnpm lint
```

## Documentation

- `docs/zooming-and-streaming.md` – describes how to synchronize streaming data, maintain zoom stacks, and handle user selections.
- `src/ExampleComponents/InteractiveChart` – contains the reusable interactive chart canvas, control panel, quick actions, and related helpers used in the demo application.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
