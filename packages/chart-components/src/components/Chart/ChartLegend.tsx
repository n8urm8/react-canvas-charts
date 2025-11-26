import React, { useMemo } from 'react';
import { ChartOverlayPortal, useChartSurface } from './ChartSurface';
import './ChartLegend.css';

export type ChartLegendPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type ChartLegendLayout = 'horizontal' | 'vertical';

export type ChartLegendPlacement =
  | { mode?: 'anchor'; position?: ChartLegendPosition }
  | { mode: 'coordinate'; x: number | string; y: number | string };

export interface ChartLegendItem {
  /** Optional chart data key to resolve colors from the surface context. */
  dataKey?: string;
  /** Label to display for the series. Falls back to the data key when omitted. */
  label?: string;
  /** Override color for the legend marker. */
  color?: string;
}

export interface ChartLegendProps {
  /** Controls where the legend appears. Defaults to `top-right` when omitted. */
  placement?: ChartLegendPlacement;
  /** Provide custom legend entries. When omitted, all current y-keys are shown. */
  items?: ChartLegendItem[];
  /** Layout direction for entries. */
  layout?: ChartLegendLayout;
  /** Optional title displayed above the legend entries. */
  title?: string;
  /** Additional class names for the container. */
  className?: string;
  /** Class names applied to each item row. */
  itemClassName?: string;
  /** Class names applied to the color marker. */
  markerClassName?: string;
  /** Size of the color marker in pixels. */
  markerSize?: number;
}

const POSITION_STYLE_MAP: Record<ChartLegendPosition, React.CSSProperties> = {
  'top-left': { top: '1rem', left: '1rem' },
  'top-center': { top: '1rem', left: '50%', transform: 'translateX(-50%)' },
  'top-right': { top: '1rem', right: '1rem' },
  'bottom-left': { bottom: '1rem', left: '1rem' },
  'bottom-center': { bottom: '1rem', left: '50%', transform: 'translateX(-50%)' },
  'bottom-right': { bottom: '1rem', right: '1rem' },
};

const DEFAULT_MARKER_SIZE = 12;

export const ChartLegend: React.FC<ChartLegendProps> = ({
  placement,
  items,
  layout = 'horizontal',
  title,
  className,
  itemClassName,
  markerClassName,
  markerSize = DEFAULT_MARKER_SIZE,
}) => {
  const { yKeys, getColorForKey } = useChartSurface();

  const resolvedItems = useMemo(() => {
    const fallbackItems: ChartLegendItem[] = yKeys.map((key) => ({ dataKey: key, label: key }));
    const source = items && items.length > 0 ? items : fallbackItems;

    return source
      .map((item, index) => {
        const dataKey = item.dataKey ?? fallbackItems[index]?.dataKey;
        const label = item.label ?? dataKey ?? `Series ${index + 1}`;
        const color = item.color ?? (dataKey ? getColorForKey(dataKey) : undefined);

        if (!label) {
          return null;
        }

        return {
          key: dataKey ?? `legend-${index}`,
          label,
          color: color ?? '#999999',
        };
      })
      .filter((entry): entry is { key: string; label: string; color: string } => entry !== null);
  }, [getColorForKey, items, yKeys]);

  if (resolvedItems.length === 0) {
    return null;
  }

  const formatCoordinate = (value: number | string): string => {
    if (typeof value === 'number') {
      return `${value}px`;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return '0px';
    }

    const numericPattern = /^-?\d+(?:\.\d+)?$/;
    if (numericPattern.test(trimmed)) {
      return `${trimmed}px`;
    }

    return trimmed;
  };

  const resolvedPlacement: ChartLegendPlacement = placement ?? {
    mode: 'anchor',
    position: 'top-right',
  };

  const { positionStyle, coordinateStyle } =
    resolvedPlacement.mode === 'coordinate'
      ? {
          positionStyle: undefined,
          coordinateStyle: {
            top: formatCoordinate(resolvedPlacement.y),
            left: formatCoordinate(resolvedPlacement.x),
          } as React.CSSProperties,
        }
      : {
          positionStyle: POSITION_STYLE_MAP[resolvedPlacement.position ?? 'top-right'],
          coordinateStyle: undefined,
        };
  const isVertical = layout === 'vertical';

  const containerClasses = `chart-legend ${isVertical ? 'chart-legend-vertical' : 'chart-legend-horizontal'} ${className || ''}`;
  const finalStyle = { ...positionStyle, ...coordinateStyle };

  return (
    <ChartOverlayPortal>
      <div
        className={containerClasses}
        style={finalStyle}
      >
        {title ? (
          <div className="chart-legend-title">
            {title}
          </div>
        ) : null}
        {resolvedItems.map((entry) => (
          <div
            key={entry.key}
            className={`chart-legend-item ${itemClassName || ''}`}
          >
            <span
              className={`chart-legend-marker ${markerClassName || ''}`}
              style={{
                backgroundColor: entry.color,
                width: markerSize,
                height: markerSize,
                borderRadius: markerSize / 4,
              }}
              aria-hidden="true"
            />
            <span>{entry.label}</span>
          </div>
        ))}
      </div>
    </ChartOverlayPortal>
  );
};

ChartLegend.displayName = 'ChartLegend';
