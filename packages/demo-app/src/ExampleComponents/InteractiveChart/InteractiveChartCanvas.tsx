import React, { useCallback, useMemo } from 'react'
import {
  ChartSurface,
  ChartGridLayer,
  ChartXAxis,
  ChartYAxis,
  ChartLineSeries,
  ChartPointSeries,
  ChartCursorLayer,
  ChartTooltipLayer,
  ChartAreaSeries,
  ChartValueLabels,
  ChartTitleLayer,
  ChartToolbar,
  ChartLegend,
  ChartOverlayPortal,
  ChartAnnotationsLayer,
  type ChartSelectionResult,
  type ChartToolbarPosition,
  type ChartAnnotation
} from 'react-canvas-charts'
import type { ChartRecord, InteractiveChartConfig, InteractiveChartToolbarTool } from './types'

type InteractiveChartCanvasProps = {
  data: ChartRecord[]
  config: InteractiveChartConfig
  onSelectionChange?: (selection: ChartSelectionResult | null) => void
  toolbarTools?: InteractiveChartToolbarTool[]
  toolbarEnabled?: boolean
  toolbarMultiSelect?: boolean
  toolbarVisibility?: 'always' | 'hover'
  toolbarMoveable?: boolean
  selectionResetKey?: number
  onToolbarToggle?: (tool: InteractiveChartToolbarTool, isActive: boolean, nextActiveIds: string[]) => void
  onToolbarPositionChange?: (position: ChartToolbarPosition) => void
  onAnnotationsChange?: (annotations: ChartAnnotation[]) => void
}

const EMPTY_TOOL_IDS: string[] = []

export const InteractiveChartCanvas: React.FC<InteractiveChartCanvasProps> = ({
  data,
  config,
  onSelectionChange,
  toolbarTools: toolbarToolsOverride,
  toolbarEnabled,
  toolbarMultiSelect,
  toolbarVisibility,
  toolbarMoveable,
  selectionResetKey,
  onToolbarToggle,
  onToolbarPositionChange,
  onAnnotationsChange
}) => {
  const resolvedAxes = useMemo(() => {
    if (config.axes.length > 0) {
      return config.axes
    }

    return [
      {
        id: 'axis-default',
        title: 'Value',
        position: 'left' as const
      }
    ]
  }, [config.axes])

  const axisIds = useMemo(() => resolvedAxes.map((axis) => axis.id), [resolvedAxes])
  const fallbackAxisId = axisIds[0] ?? 'axis-default'

  const resolvedSeries = useMemo(
    () =>
      (config.series.length > 0
        ? config.series
        : [
            {
              id: 'series-default',
              name: 'Series 1',
              color: '#3b82f6',
              axisId: fallbackAxisId
            }
          ]
      ).map((series, index) => ({
        ...series,
        axisId: axisIds.includes(series.axisId) ? series.axisId : fallbackAxisId,
        color: series.color || `hsl(${(index * 137.5) % 360}deg 70% 50%)`
      })),
    [axisIds, config.series, fallbackAxisId]
  )

  const yKeys = useMemo(() => resolvedSeries.map((series) => series.id), [resolvedSeries])
  const defaultColors = useMemo(() => resolvedSeries.map((series) => series.color), [resolvedSeries])

  const seriesLabelMap = useMemo(() => {
    const map: Record<string, string> = {}
    resolvedSeries.forEach((series) => {
      map[series.id] = series.name || series.id
    })
    return map
  }, [resolvedSeries])

  const valueScales = useMemo(
    () =>
      resolvedAxes.map((axis) => ({
        id: axis.id,
        dataKeys: resolvedSeries.filter((series) => series.axisId === axis.id).map((series) => series.id)
      })),
    [resolvedAxes, resolvedSeries]
  )

  const defaultToolbarTools = useMemo<InteractiveChartToolbarTool[]>(
    () => [
      { id: 'pan', label: 'Pan' },
      { id: 'brush', label: 'Brush' },
      { id: 'zoom-in', label: 'Zoom In' },
      { id: 'zoom-out', label: 'Zoom Out' }
    ],
    []
  )

  const toolbarConfig = config.toolbar
  const resolvedToolbarTools = useMemo(() => {
    if (toolbarToolsOverride && toolbarToolsOverride.length > 0) {
      return toolbarToolsOverride
    }
    if (toolbarConfig?.tools && toolbarConfig.tools.length > 0) {
      return toolbarConfig.tools
    }
    return defaultToolbarTools
  }, [defaultToolbarTools, toolbarConfig?.tools, toolbarToolsOverride])

  const resolvedToolbarEnabled = (toolbarEnabled ?? toolbarConfig?.enabled !== false) && resolvedToolbarTools.length > 0

  const resolvedToolbarMultiSelect = toolbarMultiSelect ?? toolbarConfig?.multiSelect ?? true

  const resolvedToolbarVisibility = toolbarVisibility ?? toolbarConfig?.visibility ?? 'always'

  const resolvedToolbarMoveable = toolbarMoveable ?? toolbarConfig?.moveable ?? false

  const legendConfig = config.legend ?? {}
  const legendItems = useMemo(
    () =>
      resolvedSeries.map((series) => ({
        dataKey: series.id,
        label: series.name || series.id,
        color: series.color
      })),
    [resolvedSeries]
  )

  const legendEnabled = legendConfig.enabled !== false && legendItems.length > 0

  const handleToolbarPositionChange = useCallback(
    (position: ChartToolbarPosition) => {
      onToolbarPositionChange?.(position)
    },
    [onToolbarPositionChange]
  )

  const handleToolbarToggle = useCallback(
    (tool: InteractiveChartToolbarTool, isActive: boolean, nextActive: string[]) => {
      onToolbarToggle?.(tool, isActive, nextActive)
    },
    [onToolbarToggle]
  )

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <ChartSurface
        data={data}
        xKey="label"
        yKeys={yKeys}
        width="100%"
        height={config.height}
        margin={{
          top: config.padding,
          right: config.padding,
          bottom: config.padding,
          left: config.padding
        }}
        backgroundColor="#ffffff"
        defaultColors={defaultColors}
        valueScales={valueScales}
        onSelectionChange={onSelectionChange}
        selectionResetKey={selectionResetKey}
      >
        {config.title ? <ChartTitleLayer title={config.title} /> : null}

        <ChartGridLayer
          show={config.showGrid}
          showVertical={config.showGrid}
          alignWithXAxisTicks
          color={config.gridColor}
        />
        <ChartXAxis
          show={config.showXAxis}
          title={config.xAxisTitle}
          showTitle={config.xAxisTitle.length > 0}
          tickStep={config.xAxisTickStep}
          maxTicks={config.xAxisMaxTicks > 0 ? config.xAxisMaxTicks : undefined}
          labelRotation={config.xAxisLabelRotation}
          labelOffsetY={config.xAxisLabelOffsetY}
        />
        {config.showYAxis
          ? resolvedAxes.map((axis) => (
              <ChartYAxis
                key={axis.id}
                show
                title={axis.title}
                showTitle={axis.title.length > 0}
                titleRotation={axis.title.length > 0 ? -90 : 0}
                scaleId={axis.id}
                side={axis.position}
                orientation={axis.position === 'right' ? 'right' : 'left'}
              />
            ))
          : null}

        {config.fillArea
          ? resolvedSeries.map((series) => (
              <ChartAreaSeries
                key={`area-${series.id}`}
                dataKey={series.id}
                color={series.color}
                opacity={config.fillOpacity}
              />
            ))
          : null}

        {config.showLines
          ? resolvedSeries.map((series) => (
              <ChartLineSeries
                key={`line-${series.id}`}
                dataKey={series.id}
                color={series.color}
                lineWidth={config.lineWidth}
                smooth={config.lineSmooth}
                lineDash={config.lineDash}
              />
            ))
          : null}

        {config.showPoints
          ? resolvedSeries.map((series) => (
              <ChartPointSeries
                key={`point-${series.id}`}
                dataKey={series.id}
                size={config.pointSize}
                shape={config.pointShape}
                color={series.color}
                fillColor={series.color}
              />
            ))
          : null}

        {config.showValues
          ? resolvedSeries.map((series) => <ChartValueLabels key={`label-${series.id}`} dataKey={series.id} />)
          : null}

        {config.enableCursor ? (
          <ChartCursorLayer
            snapToDataPoints={config.cursorSnapToPoints}
            snapAlongYAxis={config.cursorSnapAlongYAxis}
            showHoverPoints={config.cursorShowHoverPoints}
          />
        ) : null}

        {config.enableTooltip ? (
          <ChartTooltipLayer
            position={config.tooltipPosition}
            template={config.tooltipTemplate}
            snapAlongYAxis={config.cursorSnapAlongYAxis}
            seriesLabels={seriesLabelMap}
          />
        ) : null}

        {config.annotations && config.annotations.length > 0 ? (
          <ChartAnnotationsLayer annotations={config.annotations} onAnnotationsChange={onAnnotationsChange} />
        ) : null}

        {legendEnabled ? (
          <ChartLegend
            items={legendItems}
            placement={legendConfig.placement}
            layout={legendConfig.layout}
            title={legendConfig.title}
          />
        ) : null}

        {resolvedToolbarEnabled ? (
          <ChartOverlayPortal>
            <ChartToolbar
              tools={resolvedToolbarTools}
              activeToolIds={EMPTY_TOOL_IDS}
              defaultActiveToolIds={toolbarConfig?.defaultActiveIds}
              onToggle={handleToolbarToggle}
              multiSelect={resolvedToolbarMultiSelect}
              position={toolbarConfig?.position}
              visibility={resolvedToolbarVisibility}
              moveable={resolvedToolbarMoveable}
              onPositionChange={resolvedToolbarMoveable ? handleToolbarPositionChange : undefined}
            />
          </ChartOverlayPortal>
        ) : null}
      </ChartSurface>
    </div>
  )
}
