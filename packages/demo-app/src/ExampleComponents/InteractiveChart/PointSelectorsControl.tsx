import React, { useCallback, useState, type FC } from 'react'
import { createChartPointSelector, type ChartPointSelector } from 'react-canvas-charts'
import { SELECTOR_SVG_OPTIONS, SELECTOR_SVG_LABELS, type SelectorSvgKey } from './selectorOptions'

export interface PointSelectorsControlProps {
  selectors: ChartPointSelector[]
  series: Array<{ id: string; name: string }>
  onSelectorsChange: (selectors: ChartPointSelector[]) => void
}

// Design constants - keep in sync with ChartPointSelectorsLayer defaults
// SECURITY: The hardcoded SVG options below are safe. If allowing user-provided SVG,
// sanitize using sanitizeSvgMarkup() from react-canvas-charts before use.
const DEFAULT_LABEL_BACKGROUND = 'rgba(17, 24, 39, 0.92)'
const DEFAULT_LABEL_TEXT_COLOR = '#f9fafb'
const DEFAULT_LABEL_FONT_SIZE = '12px'

const DEFAULT_LABEL_STYLE: React.CSSProperties = {
  background: DEFAULT_LABEL_BACKGROUND,
  color: DEFAULT_LABEL_TEXT_COLOR,
  fontSize: DEFAULT_LABEL_FONT_SIZE
}

const DEFAULT_LABEL_COLORS = [
  { label: 'Dark', value: DEFAULT_LABEL_BACKGROUND },
  { label: 'Blue', value: 'rgba(59, 130, 246, 0.9)' },
  { label: 'Red', value: 'rgba(239, 68, 68, 0.9)' },
  { label: 'Green', value: 'rgba(16, 185, 129, 0.9)' },
  { label: 'Purple', value: 'rgba(139, 92, 246, 0.9)' }
]

export const PointSelectorsControl: FC<PointSelectorsControlProps> = ({
  selectors,
  series,
  onSelectorsChange
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleAddSelector = useCallback(() => {
    const firstSeriesId = series.length > 0 ? series[0].id : 'series-1'
    const newSelector = createChartPointSelector(firstSeriesId, 0, {
      labelStyle: DEFAULT_LABEL_STYLE
    })
    onSelectorsChange([...selectors, newSelector])
    setExpandedId(newSelector.id)
  }, [series, selectors, onSelectorsChange])

  const handleRemoveSelector = useCallback(
    (id: string) => {
      onSelectorsChange(selectors.filter((s) => s.id !== id))
      if (expandedId === id) {
        setExpandedId(null)
      }
    },
    [selectors, expandedId, onSelectorsChange]
  )

  /**
   * Generic selector update handler - reduces duplication for similar update patterns
   */
  const updateSelector = useCallback(
    (id: string, updates: Partial<ChartPointSelector>) => {
      onSelectorsChange(
        selectors.map((s) => (s.id === id ? { ...s, ...updates } : s))
      )
    },
    [selectors, onSelectorsChange]
  )

  const handleUpdateSelectorSvg = useCallback(
    (id: string, svgKey: SelectorSvgKey | null) => {
      updateSelector(id, {
        selectorSvg: svgKey ? SELECTOR_SVG_OPTIONS[svgKey] : undefined
      })
    },
    [updateSelector]
  )

  const handleUpdateLabelStyle = useCallback(
    (id: string, styleUpdates: Partial<React.CSSProperties>) => {
      updateSelector(id, {
        labelStyle: {
          ...selectors.find((s) => s.id === id)?.labelStyle,
          ...styleUpdates
        }
      })
    },
    [updateSelector, selectors]
  )

  const handleUpdateDataIndex = useCallback(
    (id: string, dataIndex: number) => {
      updateSelector(id, { dataIndex })
    },
    [updateSelector]
  )

  const handleUpdateDataKey = useCallback(
    (id: string, dataKey: string) => {
      updateSelector(id, { dataKey })
    },
    [updateSelector]
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-700">Point Selectors</h3>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
          {selectors.length}
        </span>
      </div>

      {selectors.length === 0 ? (
        <p className="text-xs text-gray-500 mb-2">No selectors yet. Add one to get started!</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {selectors.map((selector) => (
            <div key={selector.id} className="border border-gray-200 rounded-lg bg-gray-50">
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === selector.id ? null : selector.id)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 text-sm font-medium text-gray-700"
              >
                <span>
                  {series.find((s) => s.id === selector.dataKey)?.name || selector.dataKey} (Index:{' '}
                  {selector.dataIndex})
                </span>
                <span className="text-xs">{expandedId === selector.id ? '−' : '+'}</span>
              </button>

              {expandedId === selector.id && (
                <div className="border-t border-gray-200 p-3 space-y-3 bg-white">
                  {/* Series Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Series</label>
                    <select
                      value={selector.dataKey}
                      onChange={(e) => handleUpdateDataKey(selector.id, e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                    >
                      {series.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Data Point Index */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Data Point Index
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={selector.dataIndex}
                      onChange={(e) => {
                        const parsedValue = parseInt(e.target.value, 10)
                        const nextDataIndex = Number.isNaN(parsedValue) ? 0 : Math.max(0, parsedValue)
                        handleUpdateDataIndex(selector.id, nextDataIndex)
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>

                  {/* SVG Shape Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Icon Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateSelectorSvg(selector.id, null)}
                        className={`px-2 py-1 text-xs rounded border-2 transition-colors ${
                          !selector.selectorSvg
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        Default
                      </button>
                      {(Object.keys(SELECTOR_SVG_OPTIONS) as SelectorSvgKey[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleUpdateSelectorSvg(selector.id, key)}
                          title={SELECTOR_SVG_LABELS[key]}
                          className={`px-2 py-1 text-xs rounded border-2 transition-colors flex items-center justify-center h-8 min-w-8 ${
                            selector.selectorSvg === SELECTOR_SVG_OPTIONS[key]
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: SELECTOR_SVG_OPTIONS[key]
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Label Background Color */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Label Background</label>
                    <div className="grid grid-cols-3 gap-2">
                      {DEFAULT_LABEL_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => handleUpdateLabelStyle(selector.id, { background: color.value })}
                          className={`px-2 py-1 text-xs rounded border-2 transition-colors ${
                            selector.labelStyle?.background === color.value
                              ? 'border-blue-500'
                              : 'border-gray-300'
                          }`}
                          title={color.label}
                          style={{ background: color.value }}
                        >
                          <span
                            style={{
                              color: color.value === DEFAULT_LABEL_BACKGROUND ? DEFAULT_LABEL_TEXT_COLOR : '#fff'
                            }}
                          >
                            {color.label.charAt(0)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Label Text Color */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Label Text Color</label>
                    <input
                      type="color"
                      value={(selector.labelStyle?.color as string) || DEFAULT_LABEL_TEXT_COLOR}
                      onChange={(e) => handleUpdateLabelStyle(selector.id, { color: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded h-8"
                    />
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={8}
                        max={24}
                        value={
                          (selector.labelStyle?.fontSize as string)?.replace('px', '') || DEFAULT_LABEL_FONT_SIZE.replace('px', '')
                        }
                        onChange={(e) =>
                          handleUpdateLabelStyle(selector.id, { fontSize: `${e.target.value}px` })
                        }
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-500 py-1">px</span>
                    </div>
                  </div>

                  {/* Label Vertical Position */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Label Position (Y offset)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={(selector.labelStyle?.bottom as string)?.replace('%', '') || '100'}
                        onChange={(e) =>
                          handleUpdateLabelStyle(selector.id, { bottom: `${e.target.value}%` })
                        }
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-500 py-1">% above</span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveSelector(selector.id)}
                    className="w-full px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleAddSelector}
        className="w-full px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded font-medium transition-colors"
      >
        + Add Selector
      </button>
    </div>
  )
}
