import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { DataPoint as CursorDataPoint } from './components/ChartCursor';
import { findNearestDataPoint } from './components/ChartCursor';
import { CanvasWrapper } from '../CanvasWrapper/CanvasWrapper';

const Y_AXIS_BAND_WIDTH = 56;

export interface ValueScaleDefinition {
  id: string;
  dataKeys: string[];
  domain?: {
    min?: number;
    max?: number;
  };
}

export type ChartLayerRenderer = (
  context: CanvasRenderingContext2D,
  helpers: ChartSurfaceRenderHelpers
) => void;

export interface ChartLayerOptions {
  order?: number;
}

interface ChartLayer {
  id: string;
  order: number;
  draw: ChartLayerRenderer;
}

export interface ChartSurfaceRenderHelpers {
  canvasWidth: number;
  canvasHeight: number;
  chartArea: ChartArea;
  labels: string[];
  labelPositions: number[];
  normalizedData: NormalizedDatum[];
  getXPosition: (index: number) => number;
  getYPosition: (value: number) => number;
  getYPositionForScale: (scaleId: string, value: number) => number;
  getYPositionForKey: (dataKey: string, value: number) => number;
  getScaleDomain: (scaleId: string) => ValueDomain;
  getScaleIdForKey: (dataKey: string) => string;
  defaultScaleId: string;
  colorForKey: (dataKey: string) => string;
  pointer: ChartPointer | null;
  dataPoints: CursorDataPoint[];
  axisTicks: AxisTickState;
  valueDomain: ValueDomain;
  valueDomainsByScale: Record<string, ValueDomain>;
  renderCycle: number;
  yAxisCounts: { left: number; right: number };
}

export interface ChartPointer {
  x: number;
  y: number;
}

export interface ChartArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ValueDomain {
  min: number;
  max: number;
  paddedMin: number;
  paddedMax: number;
}

export interface NormalizedDatum {
  index: number;
  label: string;
  x: number;
  values: Record<string, number | null>;
  raw: Record<string, unknown>;
}

interface AxisTickDescriptor {
  positions: number[];
  labels: string[];
  values?: number[];
  indices?: number[];
}

export interface AxisTickState {
  x: AxisTickDescriptor | null;
  y: AxisTickDescriptor | null;
}

interface CursorOptions {
  snapRadius: number;
  snapToDataPoints: boolean;
}

const defaultCursorOptions: CursorOptions = {
  snapRadius: 20,
  snapToDataPoints: true,
};

export interface ChartSurfaceContextValue {
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
  labels: string[];
  labelPositions: number[];
  chartArea: ChartArea;
  canvasSize: { width: number; height: number };
  valueDomain: ValueDomain;
  valueDomainsByScale: Record<string, ValueDomain>;
  getXPosition: (index: number) => number;
  getYPosition: (value: number) => number;
  getYPositionForScale: (scaleId: string, value: number) => number;
  getYPositionForKey: (dataKey: string, value: number) => number;
  getScaleDomain: (scaleId: string) => ValueDomain;
  getScaleIdForKey: (dataKey: string) => string;
  defaultScaleId: string;
  normalizedData: NormalizedDatum[];
  dataPoints: CursorDataPoint[];
  pointer: ChartPointer | null;
  axisTicks: AxisTickState;
  registerLayer: (
    draw: ChartLayerRenderer,
    options?: ChartLayerOptions
  ) => ChartLayerHandle;
  setAxisTicks: (axis: 'x' | 'y', descriptor: AxisTickDescriptor | null) => void;
  getColorForKey: (dataKey: string, fallback?: string) => string;
  registerCursorOptions: (options: Partial<CursorOptions>) => () => void;
  requestRender: () => void;
  registerYAxis: (side: 'left' | 'right') => { id: string; unregister: () => void };
  getYAxisIndex: (id: string, side: 'left' | 'right') => number;
  yAxisCounts: { left: number; right: number };
  yAxisSpacing: number;
}

export interface ChartLayerHandle {
  update: (draw: ChartLayerRenderer, options?: ChartLayerOptions) => void;
  unregister: () => void;
}

const ChartSurfaceContext = createContext<ChartSurfaceContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useChartSurface = (): ChartSurfaceContextValue => {
  const context = useContext(ChartSurfaceContext);
  if (!context) {
    throw new Error('useChartSurface must be used within a ChartSurface');
  }
  return context;
};

export const LayerOrder = {
  background: 0,
  grid: 10,
  area: 20,
  series: 30,
  points: 40,
  axes: 50,
  overlays: 60,
  tooltip: 70,
} as const;

export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartSurfaceProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKeys?: string[];
  width?: number | string;
  height?: number | string;
  margin?: Partial<ChartMargin>;
  backgroundColor?: string;
  defaultColors?: string[];
  className?: string;
  style?: React.CSSProperties;
  onHover?: (dataPoint: CursorDataPoint | null) => void;
  onClick?: (dataPoint: CursorDataPoint | null) => void;
  valueScales?: ValueScaleDefinition[];
  children?: React.ReactNode;
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#f97316',
];

const DEFAULT_MARGIN: ChartMargin = {
  top: 40,
  right: 40,
  bottom: 48,
  left: 56,
};

const DEFAULT_VALUE_DOMAIN: ValueDomain = {
  min: 0,
  max: 1,
  paddedMin: -0.1,
  paddedMax: 1.1,
};

const shallowEqualArray = (a: number[], b: number[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const mergeMargin = (custom?: ChartSurfaceProps['margin']): ChartMargin => ({
  top: custom?.top ?? DEFAULT_MARGIN.top,
  right: custom?.right ?? DEFAULT_MARGIN.right,
  bottom: custom?.bottom ?? DEFAULT_MARGIN.bottom,
  left: custom?.left ?? DEFAULT_MARGIN.left,
});

export const ChartSurface: React.FC<ChartSurfaceProps> = ({
  data,
  xKey,
  yKeys: yKeysProp,
  width = 800,
  height = 400,
  margin,
  backgroundColor = '#ffffff',
  defaultColors = DEFAULT_COLORS,
  className,
  style,
  onHover,
  onClick,
  valueScales,
  children,
}) => {
  const resolvedMargin = useMemo(() => mergeMargin(margin), [margin]);

  const resolvedYKeys = useMemo(() => {
    if (yKeysProp && yKeysProp.length > 0) {
      return yKeysProp;
    }

    const numericKeys = new Set<string>();

    data.forEach((datum) => {
      Object.entries(datum).forEach(([key, value]) => {
        if (key === xKey) return;
        if (typeof value === 'number' && Number.isFinite(value)) {
          numericKeys.add(key);
        }
      });
    });

    return Array.from(numericKeys);
  }, [data, xKey, yKeysProp]);

  const [layers, setLayers] = useState<ChartLayer[]>([]);
  const layerIdRef = useRef(0);

  const [axisTicks, setAxisTickState] = useState<AxisTickState>({
    x: null,
    y: null,
  });

  const cursorOptionsMapRef = useRef(new Map<string, Partial<CursorOptions>>());
  const [cursorOptions, setCursorOptions] = useState<CursorOptions>(
    defaultCursorOptions
  );

  const yAxisRegistryRef = useRef<{ left: string[]; right: string[] }>({
    left: [],
    right: [],
  });
  const yAxisIdRef = useRef(0);
  const [yAxisCounts, setYAxisCounts] = useState<{ left: number; right: number}>(
    () => ({ left: 0, right: 0 })
  );

  const recomputeCursorOptions = useCallback(() => {
    const aggregated: CursorOptions = { ...defaultCursorOptions };

    cursorOptionsMapRef.current.forEach((options) => {
      if (options.snapRadius !== undefined) {
        aggregated.snapRadius = options.snapRadius;
      }
      if (options.snapToDataPoints !== undefined) {
        aggregated.snapToDataPoints = options.snapToDataPoints;
      }
    });

    setCursorOptions((prev) =>
      prev.snapRadius === aggregated.snapRadius &&
      prev.snapToDataPoints === aggregated.snapToDataPoints
        ? prev
        : aggregated
    );
  }, []);

  const registerCursorOptions = useCallback(
    (options: Partial<CursorOptions>) => {
      const id = `cursor-${cursorOptionsMapRef.current.size + 1}`;
      cursorOptionsMapRef.current.set(id, options);
      recomputeCursorOptions();

      return () => {
        cursorOptionsMapRef.current.delete(id);
        recomputeCursorOptions();
      };
    },
    [recomputeCursorOptions]
  );

  const registerYAxis = useCallback((side: 'left' | 'right') => {
    const id = `y-axis-${(yAxisIdRef.current += 1)}`;
    const registry = yAxisRegistryRef.current;
    registry[side] = [...registry[side], id];
    setYAxisCounts({
      left: registry.left.length,
      right: registry.right.length,
    });

    return {
      id,
      unregister: () => {
        const current = yAxisRegistryRef.current;
        current[side] = current[side].filter((axisId) => axisId !== id);
        setYAxisCounts({
          left: current.left.length,
          right: current.right.length,
        });
      },
    };
  }, []);

  const getYAxisIndex = useCallback((id: string, side: 'left' | 'right') => {
    const registry = yAxisRegistryRef.current;
    return registry[side].indexOf(id);
  }, []);

  const registerLayer = useCallback(
    (draw: ChartLayerRenderer, options: ChartLayerOptions = {}) => {
      const id = `layer-${layerIdRef.current += 1}`;
      const order = options.order ?? 0;

      setLayers((prev) => [...prev, { id, order, draw }]);

      const update: ChartLayerHandle['update'] = (nextDraw, nextOptions) => {
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === id
              ? {
                  id,
                  order: nextOptions?.order ?? layer.order,
                  draw: nextDraw,
                }
              : layer
          )
        );
      };

      const unregister = () => {
        setLayers((prev) => prev.filter((layer) => layer.id !== id));
      };

      return { update, unregister };
    },
    []
  );

  const setAxisTicks = useCallback(
    (axis: 'x' | 'y', descriptor: AxisTickDescriptor | null) => {
      setAxisTickState((prev) => {
        const next: AxisTickState = axis === 'x'
          ? { ...prev, x: descriptor }
          : { ...prev, y: descriptor };

        if (axis === 'x') {
          const prevPositions = prev.x?.positions ?? [];
          const nextPositions = descriptor?.positions ?? [];
          if (shallowEqualArray(prevPositions, nextPositions)) {
            return prev;
          }
        } else {
          const prevPositions = prev.y?.positions ?? [];
          const nextPositions = descriptor?.positions ?? [];
          if (shallowEqualArray(prevPositions, nextPositions)) {
            return prev;
          }
        }

        return next;
      });
    },
    []
  );

  const [pointer, setPointer] = useState<ChartPointer | null>(null);
  const [canvasSize, setCanvasSize] = useState({
    width: typeof width === 'number' ? width : 0,
    height: typeof height === 'number' ? height : 0,
  });

  const labels = useMemo(
    () => data.map((datum) => String(datum[xKey] ?? '')),
    [data, xKey]
  );

  const chartArea = useMemo<ChartArea>(
    () => {
      const leftOffset = Math.max(0, yAxisCounts.left - 1) * Y_AXIS_BAND_WIDTH;
      const rightOffset = Math.max(0, yAxisCounts.right - 1) * Y_AXIS_BAND_WIDTH;

      return {
        x: resolvedMargin.left + leftOffset,
      y: resolvedMargin.top,
      width: Math.max(
        0,
        canvasSize.width -
          resolvedMargin.left -
          resolvedMargin.right -
            leftOffset -
            rightOffset
      ),
      height: Math.max(
        0,
        canvasSize.height - resolvedMargin.top - resolvedMargin.bottom
        ),
      };
    },
    [
      canvasSize.height,
      canvasSize.width,
      resolvedMargin.bottom,
      resolvedMargin.left,
      resolvedMargin.right,
      resolvedMargin.top,
      yAxisCounts.left,
      yAxisCounts.right,
    ]
  );

  const perKeyStats = useMemo(() => {
    const stats = new Map<string, { min: number; max: number }>();

    resolvedYKeys.forEach((key) => {
      stats.set(key, {
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
      });
    });

    data.forEach((datum) => {
      resolvedYKeys.forEach((key) => {
        const rawValue = datum[key];
        const numeric = typeof rawValue === 'number' ? rawValue : Number(rawValue);
        if (Number.isFinite(numeric)) {
          const entry = stats.get(key);
          if (entry) {
            entry.min = Math.min(entry.min, numeric);
            entry.max = Math.max(entry.max, numeric);
          }
        }
      });
    });

    const finalized = new Map<string, { min: number; max: number }>();

    stats.forEach((value, key) => {
      let min = value.min;
      let max = value.max;

      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        min = 0;
        max = 1;
      }

      if (min === max) {
        min -= 1;
        max += 1;
      }

      finalized.set(key, { min, max });
    });

    return finalized;
  }, [data, resolvedYKeys]);

  const valueScaleState = useMemo<{
    scales: Array<{
      id: string;
      dataKeys: string[];
      domain?: ValueScaleDefinition['domain'];
    }>;
    assignments: Map<string, string>;
  }>(() => {
    const assignments = new Map<string, string>();

    if (valueScales && valueScales.length > 0) {
      const sanitized = valueScales.map((scale, index) => {
        const id = scale.id ?? `scale-${index + 1}`;
        const uniqueKeys = Array.from(
          new Set(scale.dataKeys && scale.dataKeys.length > 0 ? scale.dataKeys : resolvedYKeys)
        );
        uniqueKeys.forEach((key) => assignments.set(key, id));
        return {
          id,
          dataKeys: uniqueKeys,
          domain: scale.domain,
        };
      });

      if (sanitized.length === 0) {
        sanitized.push({ id: 'default', dataKeys: [...resolvedYKeys], domain: undefined });
      }

      resolvedYKeys.forEach((key) => {
        if (!assignments.has(key)) {
          const fallback = sanitized[0];
          fallback.dataKeys = Array.from(new Set([...fallback.dataKeys, key]));
          assignments.set(key, fallback.id);
        }
      });

      return { scales: sanitized, assignments };
    }

    const fallback = [{ id: 'default', dataKeys: [...resolvedYKeys], domain: undefined }];
    resolvedYKeys.forEach((key) => assignments.set(key, 'default'));
    return { scales: fallback, assignments };
  }, [resolvedYKeys, valueScales]);

  const resolvedValueScales = valueScaleState.scales;
  const scaleAssignments = valueScaleState.assignments;

  const valueDomainsByScale = useMemo<Record<string, ValueDomain>>(() => {
    const domains: Record<string, ValueDomain> = {};

    const computeDomain = (minValue: number, maxValue: number) => {
      let min = minValue;
      let max = maxValue;

      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        min = 0;
        max = 1;
      }

      if (min === max) {
        min -= 1;
        max += 1;
      }

      const range = max - min;
      const padding = range === 0 ? 1 : range * 0.1;

      return {
        min,
        max,
        paddedMin: min - padding,
        paddedMax: max + padding,
      };
    };

    resolvedValueScales.forEach((scale) => {
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;

      scale.dataKeys.forEach((key) => {
        const stats = perKeyStats.get(key);
        if (stats) {
          min = Math.min(min, stats.min);
          max = Math.max(max, stats.max);
        }
      });

      if (scale.domain?.min !== undefined && Number.isFinite(scale.domain.min)) {
        min = scale.domain.min;
      }
      if (scale.domain?.max !== undefined && Number.isFinite(scale.domain.max)) {
        max = scale.domain.max;
      }

      domains[scale.id] = computeDomain(min, max);
    });

    return domains;
  }, [perKeyStats, resolvedValueScales]);

  const defaultScaleId = resolvedValueScales[0]?.id ?? 'default';
  const defaultValueDomain = useMemo<ValueDomain>(
    () => valueDomainsByScale[defaultScaleId] ?? DEFAULT_VALUE_DOMAIN,
    [defaultScaleId, valueDomainsByScale]
  );

  const getScaleDomain = useCallback(
    (scaleId: string) => valueDomainsByScale[scaleId] ?? defaultValueDomain,
    [defaultValueDomain, valueDomainsByScale]
  );

  const getScaleIdForKey = useCallback(
    (dataKey: string) => scaleAssignments.get(dataKey) ?? defaultScaleId,
    [defaultScaleId, scaleAssignments]
  );

  const getYPositionForScale = useCallback(
    (scaleId: string, value: number) => {
      if (!Number.isFinite(value)) {
        return chartArea.y + chartArea.height;
      }

      const domain = valueDomainsByScale[scaleId] ?? defaultValueDomain;
      const denominator = domain.paddedMax - domain.paddedMin;

      if (denominator === 0 || chartArea.height === 0) {
        return chartArea.y + chartArea.height / 2;
      }

      const normalized = (value - domain.paddedMin) / denominator;
      const clamped = Math.max(0, Math.min(1, normalized));
      return chartArea.y + chartArea.height - clamped * chartArea.height;
    },
    [chartArea.height, chartArea.y, defaultValueDomain, valueDomainsByScale]
  );

  const getYPositionForKey = useCallback(
    (dataKey: string, value: number) => {
      const scaleId = getScaleIdForKey(dataKey);
      return getYPositionForScale(scaleId, value);
    },
    [getScaleIdForKey, getYPositionForScale]
  );

  const getYPosition = useCallback(
    (value: number) => getYPositionForScale(defaultScaleId, value),
    [defaultScaleId, getYPositionForScale]
  );

  const valueDomain = defaultValueDomain;

  const getXPosition = useCallback(
    (index: number) => {
      if (labels.length <= 1) {
        return chartArea.x + chartArea.width / 2;
      }

      const spacing = chartArea.width / Math.max(1, labels.length - 1);
      return chartArea.x + index * spacing;
    },
    [chartArea.width, chartArea.x, labels.length]
  );

  const labelPositions = useMemo(
    () => labels.map((_, index) => getXPosition(index)),
    [getXPosition, labels]
  );

  const normalizedData = useMemo<NormalizedDatum[]>(() =>
    data.map((datum, index) => {
      const values: Record<string, number | null> = {};

      resolvedYKeys.forEach((key) => {
        const rawValue = datum[key];
        const numeric = typeof rawValue === 'number' ? rawValue : Number(rawValue);
        values[key] = Number.isFinite(numeric) ? numeric : null;
      });

      return {
        index,
        label: labels[index] ?? '',
        x: labelPositions[index] ?? chartArea.x,
        values,
        raw: datum,
      };
    }),
    [chartArea.x, data, labelPositions, labels, resolvedYKeys]
  );

  const dataPoints = useMemo<CursorDataPoint[]>(() => {
    const points: CursorDataPoint[] = [];

    normalizedData.forEach((datum) => {
      resolvedYKeys.forEach((key, seriesIndex) => {
        const value = datum.values[key];
        if (value === null || !Number.isFinite(value)) {
          return;
        }

        points.push({
          x: datum.x,
          y: getYPositionForKey(key, value),
          value,
          label: datum.label,
          seriesIndex,
          dataIndex: datum.index,
          originalData: {
            ...datum.raw,
            dataKey: key,
          },
        });
      });
    });

    return points;
  }, [getYPositionForKey, normalizedData, resolvedYKeys]);

  const colorPalette = useMemo(
    () => (defaultColors.length > 0 ? defaultColors : DEFAULT_COLORS),
    [defaultColors]
  );

  const colorMapRef = useRef(new Map<string, string>());

  useEffect(() => {
    const nextMap = new Map<string, string>();
    resolvedYKeys.forEach((key, index) => {
      const color = colorPalette[index % colorPalette.length];
      nextMap.set(key, color);
    });
    colorMapRef.current = nextMap;
  }, [colorPalette, resolvedYKeys]);

  const getColorForKey = useCallback(
    (dataKey: string, fallback?: string) => {
      if (colorMapRef.current.has(dataKey)) {
        return colorMapRef.current.get(dataKey) as string;
      }

      const color = fallback ?? colorPalette[colorMapRef.current.size % colorPalette.length];
      colorMapRef.current.set(dataKey, color);
      return color;
    },
    [colorPalette]
  );

  const layersSorted = useMemo(
    () => [...layers].sort((a, b) => a.order - b.order),
    [layers]
  );

  const dataPointsRef = useRef<CursorDataPoint[]>(dataPoints);
  useEffect(() => {
    dataPointsRef.current = dataPoints;
  }, [dataPoints]);

  const hoverHandlerRef = useRef(onHover);
  useEffect(() => {
    hoverHandlerRef.current = onHover;
  }, [onHover]);

  const clickHandlerRef = useRef(onClick);
  useEffect(() => {
    clickHandlerRef.current = onClick;
  }, [onClick]);

  const axisTickStateRef = useRef(axisTicks);
  useEffect(() => {
    axisTickStateRef.current = axisTicks;
  }, [axisTicks]);

  const [renderVersion, setRenderVersion] = useState(0);
  const requestRender = useCallback(() => {
    setRenderVersion((version) => version + 1);
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const devicePixelRatio = window.devicePixelRatio || 1;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = ((event.clientX - rect.left) * scaleX) / devicePixelRatio;
      const y = ((event.clientY - rect.top) * scaleY) / devicePixelRatio;

      const withinChart =
        x >= chartArea.x &&
        x <= chartArea.x + chartArea.width &&
        y >= chartArea.y &&
        y <= chartArea.y + chartArea.height;

      setPointer((prev) => {
        if (!withinChart) {
          return prev ? null : prev;
        }

        if (
          prev &&
          Math.abs(prev.x - x) < 0.001 &&
          Math.abs(prev.y - y) < 0.001
        ) {
          return prev;
        }

        return { x, y };
      });

      if (hoverHandlerRef.current) {
        if (!withinChart) {
          hoverHandlerRef.current(null);
        } else {
          const nearest = findNearestDataPoint(
            x,
            y,
            dataPointsRef.current,
            cursorOptions.snapRadius
          );

          hoverHandlerRef.current(nearest?.point ?? null);
        }
      }
    },
    [chartArea.height, chartArea.width, chartArea.x, chartArea.y, cursorOptions.snapRadius]
  );

  const handleMouseLeave = useCallback(() => {
    setPointer(null);
    hoverHandlerRef.current?.(null);
  }, []);

  const handleClick = useCallback(
    (event: MouseEvent, canvas: HTMLCanvasElement) => {
      if (!clickHandlerRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const devicePixelRatio = window.devicePixelRatio || 1;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = ((event.clientX - rect.left) * scaleX) / devicePixelRatio;
      const y = ((event.clientY - rect.top) * scaleY) / devicePixelRatio;

      const withinChart =
        x >= chartArea.x &&
        x <= chartArea.x + chartArea.width &&
        y >= chartArea.y &&
        y <= chartArea.y + chartArea.height;

      if (!withinChart) {
        clickHandlerRef.current(null);
        return;
      }

      const nearest = findNearestDataPoint(
        x,
        y,
        dataPointsRef.current,
        cursorOptions.snapRadius
      );

      clickHandlerRef.current(nearest?.point ?? null);
    },
    [chartArea.height, chartArea.width, chartArea.x, chartArea.y, cursorOptions.snapRadius]
  );

  const onDraw = useCallback(
    (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const canvasWidth = canvas.width / devicePixelRatio;
      const canvasHeight = canvas.height / devicePixelRatio;

      if (
        Math.abs(canvasWidth - canvasSize.width) > 0.5 ||
        Math.abs(canvasHeight - canvasSize.height) > 0.5
      ) {
        setCanvasSize({ width: canvasWidth, height: canvasHeight });
      }

      context.save();
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvasWidth, canvasHeight);
      context.restore();

      const helpers: ChartSurfaceRenderHelpers = {
        canvasWidth,
        canvasHeight,
        chartArea,
        labels,
        labelPositions,
        normalizedData,
        getXPosition,
        getYPosition,
        getYPositionForScale,
        getYPositionForKey,
        getScaleDomain,
        getScaleIdForKey,
        defaultScaleId,
        colorForKey: getColorForKey,
        pointer,
        dataPoints,
        axisTicks: axisTickStateRef.current,
        valueDomain,
        valueDomainsByScale,
        renderCycle: renderVersion,
        yAxisCounts,
      };

      layersSorted.forEach((layer) => {
        layer.draw(context, helpers);
      });
    },
    [
      backgroundColor,
      canvasSize.height,
      canvasSize.width,
      chartArea,
      dataPoints,
      getColorForKey,
      getXPosition,
      getYPosition,
      getYPositionForKey,
      getYPositionForScale,
      getScaleDomain,
      getScaleIdForKey,
  defaultScaleId,
      labelPositions,
      labels,
      layersSorted,
      normalizedData,
      pointer,
      renderVersion,
      valueDomainsByScale,
      valueDomain,
      yAxisCounts,
    ]
  );

  const contextValue = useMemo<ChartSurfaceContextValue>(() => ({
    data,
    xKey,
    yKeys: resolvedYKeys,
    labels,
    labelPositions,
    chartArea,
    canvasSize,
    valueDomain,
  defaultScaleId,
    valueDomainsByScale,
    getXPosition,
    getYPosition,
    getYPositionForScale,
    getYPositionForKey,
    getScaleDomain,
    getScaleIdForKey,
    normalizedData,
    dataPoints,
    pointer,
    axisTicks,
    registerLayer,
    setAxisTicks,
    getColorForKey,
    registerCursorOptions,
    requestRender,
    registerYAxis,
    getYAxisIndex,
    yAxisCounts,
    yAxisSpacing: Y_AXIS_BAND_WIDTH,
  }), [
    axisTicks,
    canvasSize,
    chartArea,
    data,
    dataPoints,
    getColorForKey,
    getXPosition,
    getYPosition,
  getYPositionForKey,
  getYPositionForScale,
  getScaleDomain,
  getScaleIdForKey,
    labelPositions,
    labels,
    normalizedData,
    pointer,
    registerCursorOptions,
    registerLayer,
    requestRender,
    resolvedYKeys,
  registerYAxis,
  getYAxisIndex,
  yAxisCounts,
    setAxisTicks,
    defaultScaleId,
    valueDomainsByScale,
    valueDomain,
    xKey,
  ]);

  return (
    <ChartSurfaceContext.Provider value={contextValue}>
      <CanvasWrapper
        width={width}
        height={height}
        className={className}
        style={style}
        onDraw={onDraw}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      {children}
    </ChartSurfaceContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChartLayer = (
  draw: ChartLayerRenderer,
  options?: ChartLayerOptions
): void => {
  const { registerLayer } = useChartSurface();
  const drawRef = useRef(draw);
  const optionsRef = useRef(options);
  const handleRef = useRef<ChartLayerHandle | null>(null);

  drawRef.current = draw;
  optionsRef.current = options;

  useEffect(() => {
    const handle = registerLayer(drawRef.current, optionsRef.current);
    handleRef.current = handle;
    return () => {
      handle.unregister();
      handleRef.current = null;
    };
  }, [registerLayer]);

  useEffect(() => {
    if (handleRef.current) {
      handleRef.current.update(drawRef.current, optionsRef.current);
    }
  }, [draw, options]);
};
