import React from 'react';
import type {
  InteractiveChartAxisConfig,
  InteractiveChartConfig,
  InteractiveChartSeriesConfig,
} from './types';

type AxisSeriesSummary = {
  axis: InteractiveChartAxisConfig;
  seriesCount: number;
};

const LEGEND_POSITIONS = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
] as const;

const LEGEND_MODES = ['anchor', 'coordinate'] as const;

const LEGEND_LAYOUTS = ['horizontal', 'vertical'] as const;

type InteractiveChartControlPanelProps = {
  dataPointsCount: number;
  config: InteractiveChartConfig;
  axisSummaries: AxisSeriesSummary[];
  onSetAxisCount: (count: number) => void;
  onSetAxisSeriesCount: (axisId: string, count: number) => void;
  onAddSeries: () => void;
  onRemoveSeries: (seriesId: string) => void;
  onUpdateSeries: (seriesId: string, updates: Partial<InteractiveChartSeriesConfig>) => void;
  onAddAxis: () => void;
  onRemoveAxis: (axisId: string) => void;
  onUpdateAxis: (axisId: string, updates: Partial<InteractiveChartAxisConfig>) => void;
  setConfig: React.Dispatch<React.SetStateAction<InteractiveChartConfig>>;
};

export const InteractiveChartControlPanel: React.FC<InteractiveChartControlPanelProps> = ({
  dataPointsCount,
  config,
  axisSummaries,
  onSetAxisCount,
  onSetAxisSeriesCount,
  onAddSeries,
  onRemoveSeries,
  onUpdateSeries,
  onAddAxis,
  onRemoveAxis,
  onUpdateAxis,
  setConfig,
}) => {
  const legendPlacement = config.legend?.placement ?? { mode: 'anchor', position: 'top-right' as const };
  const isCoordinatePlacement = legendPlacement.mode === 'coordinate';
  const legendModeValue = isCoordinatePlacement ? 'coordinate' : 'anchor';
  const anchorPosition = !isCoordinatePlacement
    ? legendPlacement.position ?? 'top-right'
    : 'top-right';
  const coordinateX = isCoordinatePlacement ? String(legendPlacement.x) : '0';
  const coordinateY = isCoordinatePlacement ? String(legendPlacement.y) : '0';

  const parsePlacementInput = (raw: string): string | number => {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      return 0;
    }
    const numericPattern = /^-?\d+(?:\.\d+)?$/;
    if (numericPattern.test(trimmed)) {
      return Number.parseFloat(trimmed);
    }
    return trimmed;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Control Panel</h2>

    {/* Data Points Section */}
    <section className="mb-6">
      <h3 className="font-semibold text-gray-700 mb-3">Data Points</h3>
      <p className="text-xs text-gray-500 mb-4">
        Configure how many axes and lines to render. Values for every line are regenerated
        automatically using randomized data.
      </p>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Number of Y-Axes</label>
          <input
            type="range"
            min="1"
            max="6"
            value={axisSummaries.length}
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value, 10);
              onSetAxisCount(Number.isNaN(parsed) ? 1 : parsed);
            }}
            className="w-full"
          />
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              min="1"
              max="6"
              value={axisSummaries.length}
              onChange={(event) => {
                const parsed = Number.parseInt(event.target.value, 10);
                onSetAxisCount(Number.isNaN(parsed) ? 1 : parsed);
              }}
              className="w-24 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            <span className="text-sm text-gray-600">axes</span>
          </div>
        </div>

        <div className="space-y-2">
          {axisSummaries.map((summary, index) => {
            const seriesCount = Math.max(0, summary.seriesCount);
            return (
              <div key={summary.axis.id} className="p-3 bg-gray-50 rounded">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Axis {index + 1}: {summary.axis.title || summary.axis.id}
                    </p>
                    <p className="text-xs text-gray-500">
                      Position: {summary.axis.position} • {seriesCount} line{seriesCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Lines</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={Math.max(1, seriesCount)}
                      onChange={(event) => {
                        const parsed = Number.parseInt(event.target.value, 10);
                        onSetAxisSeriesCount(
                          summary.axis.id,
                          Number.isNaN(parsed) ? 1 : parsed,
                        );
                      }}
                      className="w-20 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-gray-500 mb-1">Axis Title</label>
                  <input
                    type="text"
                    value={summary.axis.title}
                    onChange={(event) => onUpdateAxis(summary.axis.id, { title: event.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Temperature"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Currently rendering {dataPointsCount} time-series samples per line.
      </p>
    </section>

    {/* Basic Settings */}
    <section className="mb-6">
      <h3 className="font-semibold text-gray-700 mb-3">Basic Settings</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Title</label>
          <input
            type="text"
            value={config.title}
            onChange={(event) => setConfig((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Height: {config.height}px</label>
          <input
            type="range"
            min="200"
            max="800"
            value={config.height}
            onChange={(event) => setConfig((prev) => ({ ...prev, height: Number.parseInt(event.target.value, 10) }))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Padding: {config.padding}px</label>
          <input
            type="range"
            min="40"
            max="120"
            value={config.padding}
            onChange={(event) => setConfig((prev) => ({ ...prev, padding: Number.parseInt(event.target.value, 10) }))}
            className="w-full"
          />
        </div>
      </div>
    </section>

    {/* Legend Settings */}
    <section className="mb-6">
      <h3 className="font-semibold text-gray-700 mb-3">Legend</h3>
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.legend?.enabled !== false}
            onChange={(event) =>
              setConfig((prev) => ({
                ...prev,
                legend: {
                  ...prev.legend,
                  enabled: event.target.checked,
                },
              }))
            }
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Show Legend</span>
        </label>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Legend Title</label>
          <input
            type="text"
            value={config.legend?.title ?? ''}
            onChange={(event) =>
              setConfig((prev) => ({
                ...prev,
                legend: {
                  ...prev.legend,
                  title: event.target.value,
                },
              }))
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            placeholder="e.g. Series"
            disabled={config.legend?.enabled === false}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Placement Mode</label>
            <select
              value={legendModeValue}
              onChange={(event) => {
                const nextMode = event.target.value as typeof LEGEND_MODES[number];
                setConfig((prev) => {
                  const previousPlacement = prev.legend?.placement;
                  if (nextMode === 'coordinate') {
                    const previousX =
                      previousPlacement && previousPlacement.mode === 'coordinate'
                        ? previousPlacement.x
                        : 0;
                    const previousY =
                      previousPlacement && previousPlacement.mode === 'coordinate'
                        ? previousPlacement.y
                        : 0;
                    return {
                      ...prev,
                      legend: {
                        ...prev.legend,
                        placement: {
                          mode: 'coordinate',
                          x: previousX,
                          y: previousY,
                        },
                      },
                    };
                  }

                  const previousPosition =
                    previousPlacement && previousPlacement.mode !== 'coordinate'
                      ? previousPlacement.position ?? 'top-right'
                      : 'top-right';

                  return {
                    ...prev,
                    legend: {
                      ...prev.legend,
                      placement: {
                        mode: 'anchor',
                        position: previousPosition,
                      },
                    },
                  };
                });
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              disabled={config.legend?.enabled === false}
            >
              {LEGEND_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode === 'anchor' ? 'Anchor (Preset)' : 'Coordinate'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Layout</label>
            <select
              value={config.legend?.layout ?? 'horizontal'}
              onChange={(event) =>
                setConfig((prev) => ({
                  ...prev,
                  legend: {
                    ...prev.legend,
                    layout: event.target.value as typeof LEGEND_LAYOUTS[number],
                  },
                }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              disabled={config.legend?.enabled === false}
            >
              {LEGEND_LAYOUTS.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isCoordinatePlacement ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Coordinate X</label>
              <input
                type="text"
                value={coordinateX}
                onChange={(event) => {
                  const nextRawX = event.target.value;
                  setConfig((prev) => {
                    const previousPlacement = prev.legend?.placement;
                    const previousY =
                      previousPlacement && previousPlacement.mode === 'coordinate'
                        ? previousPlacement.y
                        : 0;
                    return {
                      ...prev,
                      legend: {
                        ...prev.legend,
                        placement: {
                          mode: 'coordinate',
                          x: parsePlacementInput(nextRawX),
                          y: previousY,
                        },
                      },
                    };
                  });
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="e.g. 24 or 1.5rem"
                disabled={config.legend?.enabled === false}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Coordinate Y</label>
              <input
                type="text"
                value={coordinateY}
                onChange={(event) => {
                  const nextRawY = event.target.value;
                  setConfig((prev) => {
                    const previousPlacement = prev.legend?.placement;
                    const previousX =
                      previousPlacement && previousPlacement.mode === 'coordinate'
                        ? previousPlacement.x
                        : 0;
                    return {
                      ...prev,
                      legend: {
                        ...prev.legend,
                        placement: {
                          mode: 'coordinate',
                          x: previousX,
                          y: parsePlacementInput(nextRawY),
                        },
                      },
                    };
                  });
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="e.g. 16 or 2rem"
                disabled={config.legend?.enabled === false}
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Anchor Position</label>
            <select
              value={anchorPosition}
              onChange={(event) =>
                setConfig((prev) => ({
                  ...prev,
                  legend: {
                    ...prev.legend,
                    placement: {
                      mode: 'anchor',
                      position: event.target.value as typeof LEGEND_POSITIONS[number],
                    },
                  },
                }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              disabled={config.legend?.enabled === false}
            >
              {LEGEND_POSITIONS.map((option) => (
                <option key={option} value={option}>
                  {option.replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </section>

    {/* Line Settings */}
    <section className="mb-6">
      <h3 className="font-semibold text-gray-700 mb-3">Line Settings</h3>
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.showLines}
            onChange={(event) => setConfig((prev) => ({ ...prev, showLines: event.target.checked }))}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Show Lines</span>
        </label>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Line Width: {config.lineWidth}px</label>
          <input
            type="range"
            min="1"
            max="10"
            value={config.lineWidth}
            onChange={(event) => setConfig((prev) => ({ ...prev, lineWidth: Number.parseInt(event.target.value, 10) }))}
            className="w-full"
          />
        </div>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.lineSmooth}
            onChange={(event) => setConfig((prev) => ({ ...prev, lineSmooth: event.target.checked }))}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Smooth Curves</span>
        </label>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Line Style</label>
          <select
            value={config.lineDash.length > 0 ? 'dashed' : 'solid'}
            onChange={(event) => setConfig((prev) => ({
              ...prev,
              lineDash: event.target.value === 'dashed' ? [10, 5] : [],
            }))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
          </select>
        </div>
      </div>
    </section>

    {/* Point Settings */}
    <section className="mb-6">
      <h3 className="font-semibold text-gray-700 mb-3">Point Settings</h3>
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.showPoints}
            onChange={(event) => setConfig((prev) => ({ ...prev, showPoints: event.target.checked }))}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Show Points</span>
        </label>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Point Size: {config.pointSize}px</label>
          <input
            type="range"
            min="3"
            max="20"
            value={config.pointSize}
            onChange={(event) => setConfig((prev) => ({ ...prev, pointSize: Number.parseInt(event.target.value, 10) }))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Point Shape</label>
          <select
            value={config.pointShape}
            onChange={(event) => setConfig((prev) => ({
              ...prev,
              pointShape: event.target.value as typeof prev.pointShape,
            }))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="circle">Circle</option>
            <option value="square">Square</option>
            <option value="triangle">Triangle</option>
            <option value="diamond">Diamond</option>
            <option value="cross">Cross</option>
            <option value="star">Star</option>
          </select>
        </div>
      </div>
    </section>

    {/* Fill Settings */}
    <section className="mb-6">
      <h3 className="font-semibold text-gray-700 mb-3">Fill Settings</h3>
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.fillArea}
            onChange={(event) => setConfig((prev) => ({ ...prev, fillArea: event.target.checked }))}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Fill Area Under Line</span>
        </label>

        {config.fillArea ? (
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Fill Opacity: {(config.fillOpacity * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.fillOpacity}
              onChange={(event) => setConfig((prev) => ({ ...prev, fillOpacity: Number.parseFloat(event.target.value) }))}
              className="w-full"
            />
          </div>
        ) : null}
      </div>
    </section>

    {/* Axes Settings */}
    <section className="mb-6">
      <h3 className="font-semibold text-gray-700 mb-3">Axes & Grid</h3>
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.showGrid}
            onChange={(event) => setConfig((prev) => ({ ...prev, showGrid: event.target.checked }))}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Show Grid</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.showXAxis}
            onChange={(event) => setConfig((prev) => ({ ...prev, showXAxis: event.target.checked }))}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Show X-Axis</span>
        </label>

        <div>
          <label className="block text-sm text-gray-600 mb-1">X-Axis Title</label>
          <input
            type="text"
            value={config.xAxisTitle}
            onChange={(event) => setConfig((prev) => ({ ...prev, xAxisTitle: event.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">X Tick Step</label>
            <input
              type="number"
              min="1"
              value={config.xAxisTickStep}
              onChange={(event) => {
                const nextValue = Math.max(1, Number.parseInt(event.target.value, 10) || 1);
                setConfig((prev) => ({ ...prev, xAxisTickStep: nextValue }));
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Show every Nth label.</p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Max X Ticks</label>
            <input
              type="number"
              min="0"
              value={config.xAxisMaxTicks}
              onChange={(event) => {
                const rawValue = Number.parseInt(event.target.value, 10);
                const nextValue = rawValue && rawValue > 0 ? rawValue : 0;
                setConfig((prev) => ({ ...prev, xAxisMaxTicks: nextValue }));
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">0 keeps all ticks.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">X Label Rotation (°)</label>
          <input
            type="number"
            min="-90"
            max="90"
            value={config.xAxisLabelRotation}
            onChange={(event) => {
              const value = Number.parseInt(event.target.value, 10);
              const nextValue = Number.isFinite(value) ? Math.max(-90, Math.min(90, value)) : 0;
              setConfig((prev) => ({ ...prev, xAxisLabelRotation: nextValue }));
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Helpful for long labels like dates.</p>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">X Label Offset Y (px)</label>
          <input
            type="number"
            value={config.xAxisLabelOffsetY}
            onChange={(event) => {
              const value = Number.parseInt(event.target.value, 10);
              const nextValue = Number.isFinite(value) ? value : 0;
              setConfig((prev) => ({ ...prev, xAxisLabelOffsetY: nextValue }));
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Shift rotated labels away from the axis line.</p>
        </div>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.showYAxis}
            onChange={(event) => setConfig((prev) => ({ ...prev, showYAxis: event.target.checked }))}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Show Y-Axes</span>
        </label>
      </div>
    </section>

    {/* Series Configuration */}
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700">Series</h3>
        <button
          onClick={onAddSeries}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
        >
          + Add Series
        </button>
      </div>
      <div className="space-y-3">
        {config.series.map((series) => (
          <div key={series.id} className="p-3 bg-gray-50 rounded space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={series.name}
                onChange={(event) => onUpdateSeries(series.id, { name: event.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Series name"
              />
              <input
                type="color"
                value={series.color}
                onChange={(event) => onUpdateSeries(series.id, { color: event.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <button
                onClick={() => onRemoveSeries(series.id)}
                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
                disabled={config.series.length === 1}
              >
                Remove
              </button>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Assigned Axis</label>
              <select
                value={series.axisId}
                onChange={(event) => onUpdateSeries(series.id, { axisId: event.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                {config.axes.map((axis) => (
                  <option key={axis.id} value={axis.id}>
                    {axis.title || axis.id} ({axis.position})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Axis Configuration */}
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700">Y-Axes</h3>
        <button
          onClick={onAddAxis}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
        >
          + Add Axis
        </button>
      </div>
      <div className="space-y-3">
        {config.axes.map((axis) => {
          const attachedSeries = config.series.filter((series) => series.axisId === axis.id);
          return (
            <div key={axis.id} className="p-3 bg-gray-50 rounded space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={axis.title}
                  onChange={(event) => onUpdateAxis(axis.id, { title: event.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  placeholder="Axis title"
                />
                <select
                  value={axis.position}
                  onChange={(event) =>
                    onUpdateAxis(axis.id, {
                      position: event.target.value as InteractiveChartAxisConfig['position'],
                    })
                  }
                  className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
                <button
                  onClick={() => onRemoveAxis(axis.id)}
                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
                  disabled={config.axes.length === 1}
                >
                  Remove
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {attachedSeries.length > 0
                  ? `${attachedSeries.length} series: ${attachedSeries.map((series) => series.name).join(', ')}`
                  : 'No series assigned'}
              </p>
            </div>
          );
        })}
      </div>
    </section>

    {/* Interactive Settings */}
    <section className="mb-6">
      <h3 className="font-semibold text-gray-700 mb-3">Interactive Features</h3>
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.enableCursor}
            onChange={(event) => setConfig((prev) => ({ ...prev, enableCursor: event.target.checked }))}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Enable Cursor</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.enableTooltip}
            onChange={(event) => setConfig((prev) => ({ ...prev, enableTooltip: event.target.checked }))}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Enable Tooltip</span>
        </label>

        {config.enableCursor ? (
          <>
            <label className="flex items-center ml-4">
              <input
                type="checkbox"
                checked={config.cursorSnapToPoints}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, cursorSnapToPoints: event.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Snap to Points</span>
            </label>
            <label className="flex items-center ml-4">
              <input
                type="checkbox"
                checked={config.cursorSnapAlongYAxis}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, cursorSnapAlongYAxis: event.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Include Y-Axis Snapping</span>
            </label>
            <label
              className={`flex items-center ml-4 ${
                config.cursorSnapToPoints ? '' : 'opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={config.cursorShowHoverPoints}
                onChange={(event) =>
                  setConfig((prev) => ({
                    ...prev,
                    cursorShowHoverPoints: event.target.checked,
                  }))}
                className="mr-2"
                disabled={!config.cursorSnapToPoints}
              />
              <span className="text-sm text-gray-600">Highlight Hovered Points</span>
            </label>
            {!config.cursorSnapToPoints ? (
              <p className="ml-4 text-xs text-gray-500">
                Enable snapping to data points to show hover markers.
              </p>
            ) : null}
          </>
        ) : null}

        {config.enableTooltip ? (
          <>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tooltip Position</label>
              <select
                value={config.tooltipPosition}
                onChange={(event) => setConfig((prev) => ({
                  ...prev,
                  tooltipPosition: event.target.value as typeof prev.tooltipPosition,
                }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="follow">Follow Cursor</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Tooltip Template</label>
              <input
                type="text"
                value={config.tooltipTemplate}
                onChange={(event) => setConfig((prev) => ({ ...prev, tooltipTemplate: event.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="{label}: {value}"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {'{label}'} and series keys like {'{seriesId}'} or leave blank to show all values automatically.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </section>
    </div>
  );
};
