import React, { useEffect, useState } from 'react'

const DATASET_PRESETS = [100_000, 1_000_000, 10_000_000, 20_000_000]

const formatCount = (value: number) =>
  value >= 1_000_000 ? `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M` : value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`

const formatMegabytes = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`

/** Chrome-only `performance.memory`; returns null elsewhere. */
const readJsHeap = (): number | null => {
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
  return memory ? memory.usedJSHeapSize : null
}

const DatasetControls: React.FC<{
  dataPointsCount: number
  visiblePointsCount: number
  dataBytes: number
  generationStatus: string | null
  onGenerateDataset: (count: number) => void
}> = ({ dataPointsCount, visiblePointsCount, dataBytes, generationStatus, onGenerateDataset }) => {
  const [customCount, setCustomCount] = useState(5_000_000)
  const [jsHeap, setJsHeap] = useState<number | null>(() => readJsHeap())

  useEffect(() => {
    const id = window.setInterval(() => setJsHeap(readJsHeap()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const busy = generationStatus !== null

  return (
    <div className="mb-4 pb-4 border-b border-gray-100">
      <h4 className="font-semibold text-gray-700">Dataset Size</h4>
      <p className="text-xs text-gray-500">
        {dataPointsCount.toLocaleString()} points per series • {visiblePointsCount.toLocaleString()} in view • data
        buffers {formatMegabytes(dataBytes)}
        {jsHeap !== null ? ` • JS heap ${formatMegabytes(jsHeap)}` : ''}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Samples live in typed arrays; lines are decimated per pixel, so render cost does not grow with point count.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {DATASET_PRESETS.map((count) => (
          <button
            key={count}
            type="button"
            disabled={busy}
            onClick={() => onGenerateDataset(count)}
            className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {formatCount(count)}
          </button>
        ))}
        <input
          type="number"
          min="1"
          step="100000"
          value={customCount}
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10)
            if (!Number.isNaN(parsed)) {
              setCustomCount(Math.max(1, parsed))
            }
          }}
          className="w-32 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          aria-label="Custom dataset size"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => onGenerateDataset(customCount)}
          className="px-3 py-1.5 text-sm font-medium rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          Generate
        </button>
      </div>
      {generationStatus ? <p className="text-xs text-blue-600 mt-2">{generationStatus}</p> : null}
    </div>
  )
}

type InteractiveChartQuickActionsProps = {
  dataPointsCount: number
  visiblePointsCount: number
  /** Bytes held by the sample buffers. */
  dataBytes: number
  generationStatus: string | null
  onGenerateDataset: (count: number) => void
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
  visiblePointsCount,
  dataBytes,
  generationStatus,
  onGenerateDataset,
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
    <DatasetControls
      dataPointsCount={dataPointsCount}
      visiblePointsCount={visiblePointsCount}
      dataBytes={dataBytes}
      generationStatus={generationStatus}
      onGenerateDataset={onGenerateDataset}
    />
    <div className="">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-gray-700">Live Data Stream</h4>
          <p className="text-xs text-gray-500">
            {isStreaming ? `Streaming at ${streamingHz.toFixed(1)} Hz` : 'Stream is paused'}
            {streamingMaxPoints > 0 ? ` • Max ${streamingMaxPoints} pts` : ' • Unlimited points'}
            {` • ${dataPointsCount.toLocaleString()} total points`}
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
