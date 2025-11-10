import React from 'react';
import type { DataPoint, InteractiveChartConfig } from './types';

type InteractiveChartControlPanelProps = {
  dataPoints: DataPoint[];
  config: InteractiveChartConfig;
  onAddDataPoint: () => void;
  onRemoveDataPoint: (id: string) => void;
  onUpdateDataPoint: (id: string, field: 'label' | 'value', value: string | number) => void;
  setConfig: React.Dispatch<React.SetStateAction<InteractiveChartConfig>>;
};

export const InteractiveChartControlPanel: React.FC<InteractiveChartControlPanelProps> = ({
  dataPoints,
  config,
  onAddDataPoint,
  onRemoveDataPoint,
  onUpdateDataPoint,
  setConfig,
}) => (
  <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Control Panel</h2>

    {/* Data Points Section */}
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700">Data Points</h3>
        <button
          onClick={onAddDataPoint}
          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {dataPoints.map((point) => (
          <div key={point.id} className="flex gap-2 items-center p-2 bg-gray-50 rounded">
            <input
              type="text"
              value={point.label}
              onChange={(event) => onUpdateDataPoint(point.id, 'label', event.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="Label"
            />
            <input
              type="number"
              value={point.value}
              onChange={(event) => onUpdateDataPoint(point.id, 'value', Number.parseInt(event.target.value, 10) || 0)}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => onRemoveDataPoint(point.id)}
              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
              disabled={dataPoints.length === 1}
            >
              ×
            </button>
          </div>
        ))}
      </div>
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

        <div>
          <label className="block text-sm text-gray-600 mb-1">Line Color</label>
          <input
            type="color"
            value={config.lineColor}
            onChange={(event) => setConfig((prev) => ({ ...prev, lineColor: event.target.value }))}
            className="w-full h-10 rounded cursor-pointer"
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

        <div>
          <label className="block text-sm text-gray-600 mb-1">Point Color</label>
          <input
            type="color"
            value={config.pointColor}
            onChange={(event) => setConfig((prev) => ({ ...prev, pointColor: event.target.value }))}
            className="w-full h-10 rounded cursor-pointer"
          />
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

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.showYAxis}
            onChange={(event) => setConfig((prev) => ({ ...prev, showYAxis: event.target.checked }))}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Show Y-Axis</span>
        </label>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Y-Axis Title</label>
          <input
            type="text"
            value={config.yAxisTitle}
            onChange={(event) => setConfig((prev) => ({ ...prev, yAxisTitle: event.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
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
          <label className="flex items-center ml-4">
            <input
              type="checkbox"
              checked={config.cursorSnapToPoints}
              onChange={(event) => setConfig((prev) => ({ ...prev, cursorSnapToPoints: event.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Snap to Points</span>
          </label>
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
              <p className="text-xs text-gray-500 mt-1">Use {'{label}'} and {'{value}'}</p>
            </div>
          </>
        ) : null}
      </div>
    </section>
  </div>
);
