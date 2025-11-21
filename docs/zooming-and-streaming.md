# Handling Streaming Data and Zoom State

This guide explains the patterns we recommend for synchronizing streaming data with the chart surface while preserving zoom selections. The chart components focus on rendering the data passed in; application code owns the data lifecycle and any zoom-range state that depends on domain-specific business rules.

## Key Concepts

- **ChartSurface is stateless**: it renders whatever `data` prop you provide and respects any current selection range, cursor, or tooltip configuration. It does not store historical values or enforce zoom behavior.
- **Consumers manage visible ranges**: when data streams in (or old observations fall off), the application maintains the window of visible samples. This allows each product surface to decide how aggressively to follow live data, whether to keep historical context, and when to reset user selections.
- **Selections drive zoom**: the chart emits `ChartSelectionResult` objects that report the range of indices and labels the user brushed. The consumer converts that selection into a zoom state and re-slices the dataset before passing it back into the chart.

## Recommended State Shape

We have had good results modeling zoom state as a stack of `{ start, end }` ranges, each expressed in terms of the original data indices:

```ts
interface ZoomRange {
  start: number;
  end: number;
}

const [zoomStack, setZoomStack] = useState<ZoomRange[]>([
  { start: 0, end: initialLength - 1 },
]);
```

- The top of the stack represents the currently visible window.
- Pushing a range zooms in; popping returns to the previous extent.
- When data streams or drops, we adjust every entry in the stack to stay within valid bounds.

## Streaming Workflow

When new data arrives we append it to our canonical array and drop any old samples that exceed the configured maximum. Immediately after that, we adjust the zoom stack so the visible window stays aligned with the new indices:

```ts
const clampZoomRanges = (
  ranges: ZoomRange[],
  dropCount: number,
  previousLength: number,
  nextLength: number,
): ZoomRange[] => {
  if (nextLength <= 0) {
    return [{ start: 0, end: -1 }];
  }

  if (ranges.length === 0) {
    return [{ start: 0, end: nextLength - 1 }];
  }

  const maxIndex = nextLength - 1;
  const previousMaxIndex = previousLength > 0 ? previousLength - 1 : -1;

  return ranges.map(({ start, end }) => {
    const span = Math.max(0, end - start);
    let nextStart = start - dropCount;
    let nextEnd = nextStart + span;
    const anchoredAtStart = start <= 0;
    const anchoredAtEnd = previousLength > 0 && end >= previousMaxIndex;

    if (nextStart < 0) {
      const offset = -nextStart;
      nextStart = 0;
      nextEnd += offset;
    }

    if (dropCount === 0 && nextLength > previousLength) {
      if (anchoredAtStart) {
        nextStart = 0;
        nextEnd = maxIndex;
      } else if (anchoredAtEnd) {
        nextEnd = maxIndex;
        nextStart = Math.max(0, nextEnd - span);
      }
    }

    if (nextEnd > maxIndex) {
      const overflow = nextEnd - maxIndex;
      nextEnd = maxIndex;
      nextStart = Math.max(0, nextStart - overflow);
    }

    if (nextEnd < nextStart) {
      nextEnd = nextStart;
    }

    return { start: nextStart, end: nextEnd };
  });
};

const adjustZoomStack = (
  dropCount: number,
  previousLength: number,
  nextLength: number,
) => {
  setZoomStack((previous) =>
    clampZoomRanges(previous, dropCount, previousLength, nextLength)
  );
};
```

The additional `previousLength` argument lets the helper detect whether a window was anchored to the dataset start or end. When the data grows without dropping points (for example, after increasing the max buffer size), leading windows stretch to include the new samples, while windows that were following the tail continue to track the newest points.

Call `adjustZoomStack` any time you append to the data array and possibly drop old points. For example:

```ts
setDataPoints((previous) => {
  const previousLength = previous.length;
  const additions = generateNewPoints(previous, streamingPointsPerTick, seriesIds);
  let nextData = [...previous, ...additions];
  let dropCount = 0;

  if (streamingMaxPoints > 0 && nextData.length > streamingMaxPoints) {
    dropCount = nextData.length - streamingMaxPoints;
    nextData = nextData.slice(dropCount);
  }

  adjustZoomStack(dropCount, previousLength, nextData.length);
  return nextData;
});
```

## Applying a Selection as a Zoom

When the user brushes a selection in the chart, we push a new zoom range that is relative to the full dataset:

```ts
const handleToolbarToggle = (
  tool: InteractiveChartToolbarTool,
  _isActive: boolean,
  _nextActive: string[],
) => {
  if (tool.id === "zoom-in" && selection) {
    const nextStart = visibleStartIndex + selection.minIndex;
    const nextEnd = visibleStartIndex + selection.maxIndex;

    setZoomStack((previous) => {
      const current = previous[previous.length - 1];
      if (current && current.start === nextStart && current.end === nextEnd) {
        return previous;
      }
      return [...previous, { start: nextStart, end: nextEnd }];
    });

    setSelection(null);
    setSelectionResetKey((key) => key + 1);
  }

  if (tool.id === "zoom-out") {
    setZoomStack((previous) =>
      previous.length > 1 ? previous.slice(0, -1) : previous,
    );
    setSelection(null);
    setSelectionResetKey((key) => key + 1);
  }
};
```

Here `visibleStartIndex` represents the index in the canonical data array where the current window begins. By offsetting with `selection.minIndex`/`maxIndex`, the new range retains its meaning even if we later add or remove points.

## Slicing Data for the Chart

Finally, derive the visible records by slicing the canonical data array with the top-of-stack range:

```ts
const visibleRange = useMemo(() => {
  if (dataPoints.length === 0) {
    return { start: 0, end: -1 };
  }

  const { start, end } = zoomStack[zoomStack.length - 1] ?? {
    start: 0,
    end: dataPoints.length - 1,
  };

  const maxIndex = dataPoints.length - 1;
  const clampedStart = Math.max(0, Math.min(start, maxIndex));
  const clampedEnd = Math.max(clampedStart, Math.min(end, maxIndex));

  return { start: clampedStart, end: clampedEnd };
}, [dataPoints.length, zoomStack]);

const visibleDataPoints = useMemo(() => {
  if (dataPoints.length === 0) {
    return [] as DataPoint[];
  }

  const { start, end } = visibleRange;
  if (end < start) {
    return [] as DataPoint[];
  }

  return dataPoints.slice(start, end + 1);
}, [dataPoints, visibleRange]);
```

The resulting `visibleDataPoints` drives the `ChartSurface` (`LineChart`, `InteractiveChartCanvas`, etc.), ensuring the component always renders the intended window without having to embed zoom semantics within the chart implementation.

## Summary

- The chart library stays focused on rendering data; the consuming application controls how that data is sliced and when zoom levels change.
- Maintain a zoom stack in application state and adjust it whenever you add or remove streaming data points.
- Use selection callbacks to push or pop windows, so users can zoom in and return to prior levels.
- Slice your canonical data based on the top-most zoom range before passing it into the chart components.

Following this pattern keeps the charts predictable, ensures zoom state reflects business requirements, and avoids coupling rendering logic to streaming heuristics that may vary between products.
