# Bar Chart Patterns: Stacking vs Grouping

This guide explains how to create different bar chart patterns with the library.

## Overview

When working with multiple data series in a bar chart, you have several display options:

1. **Overlapping bars** - Multiple bars at the same position (use opacity to see both)
2. **Stacked bars** - Bars stacked vertically on top of each other
3. **Grouped bars** - Bars positioned side-by-side (currently limited support)

## 1. Overlapping Bars (Default)

By default, all `ChartBarSeries` render at the same x-position. Use opacity to make overlapping bars visible:

```tsx
<ChartBarSeries dataKey="sales" color="#3b82f6" barGap={8} />
<ChartBarSeries dataKey="target" color="#94a3b8" opacity={0.5} barGap={8} />
```

## 2. Stacked Bars

### How It Works

Use the `baseline` prop to stack bars on top of each other. The `baseline` can be:

- **undefined** (default): Bar starts from the bottom of the chart
- **A number**: Bar starts from a specific y-value
- **A dataKey string**: Bar starts where another series ends (stacking)

### Example: Two Series Stacked

```tsx
// First bar starts from bottom
<ChartBarSeries dataKey="sales" color="#3b82f6" barGap={8} />

// Second bar starts where "sales" ends
<ChartBarSeries dataKey="target" color="#10b981" barGap={8} baseline="sales" />
```

### Example: Three or More Series Stacked

You can stack as many series as needed:

```tsx
<ChartBarSeries dataKey="value1" color="#3b82f6" />
<ChartBarSeries dataKey="value2" color="#10b981" baseline="value1" />
<ChartBarSeries dataKey="value3" color="#f59e0b" baseline="value2" />
<ChartBarSeries dataKey="value4" color="#ef4444" baseline="value3" />
// Stack as many as needed!
```

### How Many Can You Stack?

**There's no hard limit** - you can stack as many bars as you want. Each series references the previous one via the `baseline` prop.

### Important Notes for Stacking

1. **Order matters**: Define series in the order you want them stacked (bottom to top)
2. **Data requirements**: If the baseline dataKey has a null value, that bar won't render
3. **Y-axis scaling**: The y-axis automatically adjusts to show the full stack height

## 3. Grouped Bars (Side-by-Side)

### Native Support ✅

Grouped/clustered bars are **now natively supported** using the `seriesIndex` and `totalSeries` props.

### How It Works

To create grouped bars, each `ChartBarSeries` needs to know:

- `seriesIndex`: Its position in the group (0, 1, 2, ...)
- `totalSeries`: How many series are in the group
- `groupGap` (optional): Gap between bars within a group (default: 2)
- `barGap`: Gap between groups of bars

### Example: Grouped Bars

```tsx
<ChartSurface data={data} xKey="month" xAxisType="categorical" width="100%" height={400}>
  <ChartGridLayer showHorizontal />
  <ChartXAxis show />
  <ChartYAxis show title="Amount ($)" />

  {/* Three bars grouped side-by-side */}
  <ChartBarSeries dataKey="sales" color="#3b82f6" seriesIndex={0} totalSeries={3} groupGap={4} barGap={20} />
  <ChartBarSeries dataKey="target" color="#10b981" seriesIndex={1} totalSeries={3} groupGap={4} barGap={20} />
  <ChartBarSeries dataKey="forecast" color="#f59e0b" seriesIndex={2} totalSeries={3} groupGap={4} barGap={20} />

  <ChartLegend
    items={[
      { label: 'Sales', color: '#3b82f6' },
      { label: 'Target', color: '#10b981' },
      { label: 'Forecast', color: '#f59e0b' }
    ]}
  />
</ChartSurface>
```

### Important Notes for Grouped Bars

1. **Consistent props**: All series in a group must have the same `totalSeries`, `groupGap`, and `barGap` values
2. **Series ordering**: `seriesIndex` should be sequential (0, 1, 2, ...)
3. **Auto width**: When using `barWidth="auto"`, bars will automatically size to fit the available space
4. **Spacing control**:
   - `groupGap`: Controls spacing between bars within each group
   - `barGap`: Controls spacing between groups of bars

## Complete Examples

### Stacked Bar Example

```tsx
import {
  ChartSurface,
  ChartBarSeries,
  ChartXAxis,
  ChartYAxis,
  ChartGridLayer,
  ChartLegend
} from '@repo/chart-components'

const data = [
  { month: 'Jan', product1: 4500, product2: 3200, product3: 2100 },
  { month: 'Feb', product1: 5200, product2: 3500, product3: 2300 },
  { month: 'Mar', product1: 4800, product2: 3800, product3: 2500 }
]

;<ChartSurface data={data} xKey="month" xAxisType="categorical" width="100%" height={400}>
  <ChartGridLayer showHorizontal />
  <ChartXAxis show />
  <ChartYAxis show title="Revenue ($)" />

  {/* Stack three products */}
  <ChartBarSeries dataKey="product1" color="#3b82f6" />
  <ChartBarSeries dataKey="product2" color="#10b981" baseline="product1" />
  <ChartBarSeries dataKey="product3" color="#f59e0b" baseline="product2" />

  <ChartLegend
    items={[
      { label: 'Product 1', color: '#3b82f6' },
      { label: 'Product 2', color: '#10b981' },
      { label: 'Product 3', color: '#f59e0b' }
    ]}
  />
</ChartSurface>
```

## Summary

| Pattern                    | Support Level | How To Achieve                                   |
| -------------------------- | ------------- | ------------------------------------------------ |
| **Overlapping**            | ✅ Full       | Multiple series with opacity                     |
| **Stacking**               | ✅ Full       | Use `baseline` prop to reference previous series |
| **Grouped (side-by-side)** | ✅ Full       | Use `seriesIndex` and `totalSeries` props        |

### Stacking Limits

- **No hard limit** on the number of stacked series
- Limited only by practical concerns (readability, performance)
- Each series uses the `baseline` prop to reference where it should start

### Grouping Limits

- Can group as many series as practical
- All series must specify `seriesIndex`, `totalSeries`, `groupGap`, and `barGap`
- Bars automatically size to fit available space

### Recommendations

- **For cumulative totals**: Use stacked bars
- **For direct comparison**: Use grouped bars (side-by-side)
- **For overlapping visualization**: Use overlapping bars with opacity
