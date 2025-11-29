import React from 'react'

type InteractiveChartQuickActionsProps = {
  dataPointsCount: number
  isStreaming: boolean
  streamingHz: number
  streamingPointsPerTick: number
  streamingMaxPoints: number
  bulkAddCount: number
  onToggleStreaming: () => void
  onStreamingHzChange: (value: number) => void
  onStreamingPointsPerTickChange: (value: number) => void
  onStreamingMaxPointsChange: (value: number) => void
  onBulkAddCountChange: (value: number) => void
  onBulkAddPoints: () => void
}

export const InteractiveChartQuickActions: React.FC<InteractiveChartQuickActionsProps> = ({
  dataPointsCount,
  isStreaming,
  streamingHz,
  streamingPointsPerTick,
  streamingMaxPoints,
  bulkAddCount,
  onToggleStreaming,
  onStreamingHzChange,
  onStreamingPointsPerTickChange,
  onStreamingMaxPointsChange,
  onBulkAddCountChange,
  onBulkAddPoints
}) => (
  <div className="mt-4 bg-white rounded-lg shadow p-4">
    <div className="">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-gray-700">Live Data Stream</h4>
          <p className="text-xs text-gray-500">
            {isStreaming ? `Streaming at ${streamingHz.toFixed(1)} Hz` : 'Stream is paused'}
            {streamingMaxPoints > 0 ? ` • Max ${streamingMaxPoints} pts` : ' • Unlimited points'}
            {` • ${dataPointsCount} total points`}
          </p>
          <p className="text-xs text-gray-500 mt-1">{`Points per update: ${streamingPointsPerTick}`}</p>
        </div>
        <button
          onClick={onToggleStreaming}
          className={`px-4 py-2 text-sm font-medium rounded transition ${
            isStreaming ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isStreaming ? '⏹️ Stop Stream' : '▶️ Start Stream'}
        </button>
      </div>

      <div className="mt-3">
        <label className="block text-sm text-gray-600 mb-1">Update Rate: {streamingHz.toFixed(1)} Hz</label>
        <input
          type="range"
          min="0.1"
          max="100"
          step="0.1"
          value={streamingHz}
          onChange={(event) => {
            const parsed = Number.parseFloat(event.target.value)
            if (!Number.isNaN(parsed)) {
              onStreamingHzChange(parsed)
            }
          }}
          className="w-full"
        />
        <div className="flex items-center gap-2 mt-2">
          <input
            type="number"
            min="0.1"
            max="100"
            step="0.1"
            value={streamingHz}
            onChange={(event) => {
              const parsed = Number.parseFloat(event.target.value)
              if (!Number.isNaN(parsed)) {
                onStreamingHzChange(parsed)
              }
            }}
            className="w-24 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
          <span className="text-sm text-gray-500">Hz</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Higher Hz adds points faster. Minimum 0.1 Hz.</p>
      </div>

      <div className="mt-3">
        <label className="block text-sm text-gray-600 mb-1">Points Added Per Update: {streamingPointsPerTick}</label>
        <input
          type="range"
          min="1"
          max="100"
          step="1"
          value={streamingPointsPerTick}
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10)
            if (!Number.isNaN(parsed)) {
              onStreamingPointsPerTickChange(parsed)
            }
          }}
          className="w-full"
        />
        <div className="flex items-center gap-2 mt-2">
          <input
            type="number"
            min="1"
            max="100"
            value={streamingPointsPerTick}
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value, 10)
              if (!Number.isNaN(parsed)) {
                onStreamingPointsPerTickChange(parsed)
              }
            }}
            className="w-24 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
          <span className="text-sm text-gray-500">points/update</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Each tick pushes multiple points to simulate higher throughput.</p>
      </div>

      <div className="mt-3">
        <label className="block text-sm text-gray-600 mb-1">Max Points (0 = unlimited)</label>
        <input
          type="number"
          min="0"
          value={streamingMaxPoints}
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10)
            if (!Number.isNaN(parsed)) {
              onStreamingMaxPointsChange(parsed)
            }
          }}
          className="w-28 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Older points drop when the limit is reached.</p>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Add Points Manually</label>
          <input
            type="number"
            min="1"
            value={bulkAddCount}
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value, 10)
              if (!Number.isNaN(parsed)) {
                onBulkAddCountChange(parsed)
              }
            }}
            className="w-28 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Generates additional points instantly.</p>
        </div>
        <button
          onClick={onBulkAddPoints}
          className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition"
        >
          ➕ Add {bulkAddCount} Points
        </button>
      </div>
    </div>
  </div>
)
