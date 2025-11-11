import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import {
	type DataPoint,
	type ChartRecord,
	type InteractiveChartAxisConfig,
	type InteractiveChartConfig,
	type InteractiveChartSeriesConfig,
	createInitialTimeSeries,
	generateNewPoints,
	buildInteractiveChartCodePreview,
	InteractiveChartCanvas,
	InteractiveChartQuickActions,
	InteractiveChartCodePreview,
	InteractiveChartControlPanel,
} from '../ExampleComponents/InteractiveChart';

const SERIES_COLOR_PALETTE = [
	'#3b82f6',
	'#ef4444',
	'#10b981',
	'#f59e0b',
	'#8b5cf6',
	'#06b6d4',
	'#84cc16',
	'#f97316',
];

const INITIAL_CONFIG: InteractiveChartConfig = {
	title: 'Interactive Line Chart',
	width: 800,
	height: 400,
	padding: 80,
	showPoints: true,
	showLines: true,
	showValues: false,
	fillArea: false,
	fillOpacity: 0.1,
	enableCursor: true,
	enableTooltip: true,
	lineWidth: 2,
	lineSmooth: false,
	lineDash: [],
	pointSize: 6,
	pointShape: 'circle',
	showGrid: true,
	gridColor: '#e5e7eb',
	showXAxis: true,
	showYAxis: true,
	xAxisTitle: 'Time',
	xAxisTickStep: 1,
	xAxisMaxTicks: 0,
	cursorSnapToPoints: true,
	tooltipPosition: 'follow',
	tooltipTemplate: '',
	axes: [
		{ id: 'axis-1', title: 'Value', position: 'left' },
	],
	series: [
		{ id: 'series-1', name: 'Series 1', color: '#3b82f6', axisId: 'axis-1' },
	],
};

const clamp = (value: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, value));

const getNextSeriesIndex = (series: InteractiveChartSeriesConfig[]): number => {
	const indices = series
		.map(({ id }) => Number.parseInt(id.replace('series-', ''), 10))
		.filter((value) => Number.isFinite(value));
	return (indices.length > 0 ? Math.max(...indices) : 0) + 1;
};

export const InteractiveChartDemoNew: FC = () => {
	const [config, setConfig] = useState<InteractiveChartConfig>(INITIAL_CONFIG);
	const [dataPoints, setDataPoints] = useState<DataPoint[]>(() =>
		createInitialTimeSeries(
			INITIAL_CONFIG.series.map((series) => series.id),
			12,
		)
	);
	const [isStreaming, setIsStreaming] = useState(false);
	const [streamingHz, setStreamingHz] = useState(1);
	const [streamingPointsPerTick, setStreamingPointsPerTick] = useState(1);
	const [streamingMaxPoints, setStreamingMaxPoints] = useState(24);
	const [bulkAddCount, setBulkAddCount] = useState(10);
	const intervalRef = useRef<number | null>(null);

	const seriesIds = useMemo(
		() => config.series.map((series) => series.id),
		[config.series]
	);

	const axisSummaries = useMemo(
		() =>
			config.axes.map((axis) => ({
				axis,
				seriesCount: config.series.filter((series) => series.axisId === axis.id).length,
			})),
		[config.axes, config.series]
	);

	const regenerateDataForSeries = useCallback(
		(nextSeries: InteractiveChartSeriesConfig[], options?: { pointCount?: number }) => {
			const nextSeriesIds = nextSeries.map((series) => series.id);
			setDataPoints((previous) => {
				const targetCount = options?.pointCount !== undefined
					? Math.max(1, Math.floor(options.pointCount))
					: previous.length > 0
					? previous.length
					: 12;
				return createInitialTimeSeries(nextSeriesIds, targetCount);
			});
		},
		[setDataPoints]
	);

	const randomizeData = useCallback(() => {
		setDataPoints((previous) =>
			previous.map((point) => {
				const nextValues: Record<string, number> = { ...point.values };
				seriesIds.forEach((seriesId) => {
					nextValues[seriesId] = Math.floor(Math.random() * 100);
				});
				return { ...point, values: nextValues };
			})
		);
	}, [seriesIds]);

	const appendStreamingPoint = useCallback(() => {
		setDataPoints((previous) => {
			const additions = generateNewPoints(
				previous,
				Math.max(1, streamingPointsPerTick),
				seriesIds,
			);
			let nextData = [...previous, ...additions];

			if (streamingMaxPoints > 0 && nextData.length > streamingMaxPoints) {
				nextData = nextData.slice(nextData.length - streamingMaxPoints);
			}

			return nextData;
		});
	}, [seriesIds, streamingMaxPoints, streamingPointsPerTick]);

	const addBulkPoints = useCallback(() => {
		if (bulkAddCount <= 0) {
			return;
		}

		setDataPoints((previous) => {
			let nextData = [
				...previous,
				...generateNewPoints(previous, bulkAddCount, seriesIds),
			];

			if (streamingMaxPoints > 0 && nextData.length > streamingMaxPoints) {
				nextData = nextData.slice(nextData.length - streamingMaxPoints);
			}

			return nextData;
		});
	}, [bulkAddCount, seriesIds, streamingMaxPoints]);

	useEffect(() => {
		if (!isStreaming) {
			if (intervalRef.current !== null) {
				window.clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			return undefined;
		}

		const safeHz = clamp(streamingHz, 0.1, 100);
		const intervalMs = Math.max(10, Math.round(1000 / safeHz));
		const id = window.setInterval(appendStreamingPoint, intervalMs);
		intervalRef.current = id;

		return () => {
			window.clearInterval(id);
			if (intervalRef.current === id) {
				intervalRef.current = null;
			}
		};
	}, [appendStreamingPoint, isStreaming, streamingHz]);

	useEffect(
		() => () => {
			if (intervalRef.current !== null) {
				window.clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		},
		[]
	);

	useEffect(() => {
		if (streamingMaxPoints <= 0) {
			return;
		}

		setDataPoints((previous) => {
			if (previous.length <= streamingMaxPoints) {
				return previous;
			}
			return previous.slice(previous.length - streamingMaxPoints);
		});
	}, [streamingMaxPoints]);

	const toggleStreaming = useCallback(() => {
		setIsStreaming((previous) => !previous);
	}, []);

	const chartRecords = useMemo<ChartRecord[]>(() => {
		return dataPoints.map(({ label, values }) => {
			const record: ChartRecord = { label } as ChartRecord;
			seriesIds.forEach((seriesId) => {
				record[seriesId] = values[seriesId] ?? 0;
			});
			return record;
		});
	}, [dataPoints, seriesIds]);

	const codePreview = useMemo(
		() => buildInteractiveChartCodePreview(config, chartRecords),
		[chartRecords, config]
	);

	const toggleSmooth = useCallback(() => {
		setConfig((previous) => ({ ...previous, lineSmooth: !previous.lineSmooth }));
	}, []);

	const toggleFillArea = useCallback(() => {
		setConfig((previous) => ({ ...previous, fillArea: !previous.fillArea }));
	}, []);

	const toggleShowValues = useCallback(() => {
		setConfig((previous) => ({ ...previous, showValues: !previous.showValues }));
	}, []);

	const handleStreamingHzChange = useCallback((value: number) => {
		setStreamingHz(clamp(value, 0.1, 100));
	}, []);

	const handleStreamingPointsPerTickChange = useCallback((value: number) => {
		setStreamingPointsPerTick(clamp(value, 1, 100));
	}, []);

	const handleStreamingMaxPointsChange = useCallback((value: number) => {
		setStreamingMaxPoints(Math.max(0, value));
	}, []);

	const handleBulkAddCountChange = useCallback((value: number) => {
		setBulkAddCount(Math.max(1, value));
	}, []);

	const handleSetAxisCount = useCallback(
		(rawCount: number) => {
			setConfig((previous) => {
				const target = Math.max(1, Math.min(6, Math.floor(rawCount)));
				if (target === previous.axes.length) {
					return previous;
				}
				let nextAxes = [...previous.axes];
				let nextSeries = [...previous.series];

				if (target > previous.axes.length) {
					for (let index = previous.axes.length; index < target; index += 1) {
						const axisId = `axis-${index + 1}`;
						const newAxis: InteractiveChartAxisConfig = {
							id: axisId,
							title: `Axis ${index + 1}`,
							position: index % 2 === 0 ? 'left' : 'right',
						};
						nextAxes = [...nextAxes, newAxis];
						const nextSeriesIndex = getNextSeriesIndex(nextSeries);
						const newSeries: InteractiveChartSeriesConfig = {
							id: `series-${nextSeriesIndex}`,
							name: `Series ${nextSeriesIndex}`,
							color: SERIES_COLOR_PALETTE[(nextSeriesIndex - 1) % SERIES_COLOR_PALETTE.length],
							axisId,
						};
						nextSeries = [...nextSeries, newSeries];
					}
				} else {
					const removedAxisIds = new Set(nextAxes.slice(target).map((axis) => axis.id));
					nextAxes = nextAxes.slice(0, target);
					nextSeries = nextSeries.filter((series) => !removedAxisIds.has(series.axisId));
					if (nextSeries.length === 0 && nextAxes.length > 0) {
						nextSeries = [
							{
								id: 'series-1',
								name: 'Series 1',
								color: SERIES_COLOR_PALETTE[0],
								axisId: nextAxes[0].id,
							},
						];
					}
				}

				const nextConfig = { ...previous, axes: nextAxes, series: nextSeries };
				regenerateDataForSeries(nextSeries);
				return nextConfig;
			});
		},
		[regenerateDataForSeries]
	);

	const handleSetAxisSeriesCount = useCallback(
		(axisId: string, rawCount: number) => {
			setConfig((previous) => {
				const axisExists = previous.axes.some((axis) => axis.id === axisId);
				if (!axisExists) {
					return previous;
				}
				const desired = Math.max(1, Math.min(8, Math.floor(rawCount)));
				const currentForAxis = previous.series.filter((series) => series.axisId === axisId);
				if (currentForAxis.length === desired) {
					return previous;
				}
				let nextSeries = [...previous.series];
				if (desired > currentForAxis.length) {
					let toAdd = desired - currentForAxis.length;
					while (toAdd > 0) {
						const nextSeriesIndex = getNextSeriesIndex(nextSeries);
						const newSeries: InteractiveChartSeriesConfig = {
							id: `series-${nextSeriesIndex}`,
							name: `Series ${nextSeriesIndex}`,
							color: SERIES_COLOR_PALETTE[(nextSeriesIndex - 1) % SERIES_COLOR_PALETTE.length],
							axisId,
						};
						nextSeries = [...nextSeries, newSeries];
						toAdd -= 1;
					}
				} else {
					const removableIds = new Set(
						currentForAxis
							.slice(desired)
							.map((series) => series.id),
					);
					nextSeries = nextSeries.filter((series) => !removableIds.has(series.id));
				}

				if (nextSeries.length === 0) {
					const fallbackAxisId = previous.axes[0]?.id ?? axisId;
					nextSeries = [
						{
							id: 'series-1',
							name: 'Series 1',
							color: SERIES_COLOR_PALETTE[0],
							axisId: fallbackAxisId,
						},
					];
				}

				const nextConfig = { ...previous, series: nextSeries };
				regenerateDataForSeries(nextSeries);
				return nextConfig;
			});
		},
		[regenerateDataForSeries]
	);

	const handleAddSeries = useCallback(() => {
		setConfig((previous) => {
			if (previous.axes.length === 0) {
				return previous;
			}
			const axisCounts = previous.axes.map((axis) => ({
				axisId: axis.id,
				count: previous.series.filter((series) => series.axisId === axis.id).length,
			}));
			const targetAxisId = axisCounts.sort((a, b) => a.count - b.count)[0]?.axisId ?? previous.axes[0].id;
			const nextSeriesIndex = getNextSeriesIndex(previous.series);
			const newSeries: InteractiveChartSeriesConfig = {
				id: `series-${nextSeriesIndex}`,
				name: `Series ${nextSeriesIndex}`,
				color: SERIES_COLOR_PALETTE[(nextSeriesIndex - 1) % SERIES_COLOR_PALETTE.length],
				axisId: targetAxisId,
			};
			const nextSeries = [...previous.series, newSeries];
			const nextConfig = { ...previous, series: nextSeries };
			regenerateDataForSeries(nextSeries);
			return nextConfig;
		});
	}, [regenerateDataForSeries]);

	const handleRemoveSeries = useCallback(
		(seriesId: string) => {
			setConfig((previous) => {
				if (previous.series.length <= 1) {
					return previous;
				}
				const nextSeries = previous.series.filter((series) => series.id !== seriesId);
				if (nextSeries.length === previous.series.length) {
					return previous;
				}
				const nextConfig = { ...previous, series: nextSeries };
				regenerateDataForSeries(nextSeries);
				return nextConfig;
			});
		},
		[regenerateDataForSeries]
	);

	const handleUpdateSeries = useCallback(
		(seriesId: string, updates: Partial<InteractiveChartSeriesConfig>) => {
			setConfig((previous) => {
				const axisIds = previous.axes.map((axis) => axis.id);
				return {
					...previous,
					series: previous.series.map((series) => {
						if (series.id !== seriesId) {
							return series;
						}
						const nextAxisId = updates.axisId && axisIds.includes(updates.axisId)
							? updates.axisId
							: updates.axisId
							? axisIds[0] ?? series.axisId
							: series.axisId;
						return {
							...series,
							...updates,
							axisId: nextAxisId,
						};
					}),
				};
			});
		},
		[]
	);

	const handleAddAxis = useCallback(() => {
		setConfig((previous) => {
			const nextIndex = previous.axes.length + 1;
			const newAxis: InteractiveChartAxisConfig = {
				id: `axis-${nextIndex}`,
				title: `Axis ${nextIndex}`,
				position: nextIndex % 2 === 0 ? 'right' : 'left',
			};
			const nextAxes = [...previous.axes, newAxis];
			const nextSeriesIndex = getNextSeriesIndex(previous.series);
			const newSeries: InteractiveChartSeriesConfig = {
				id: `series-${nextSeriesIndex}`,
				name: `Series ${nextSeriesIndex}`,
				color: SERIES_COLOR_PALETTE[(nextSeriesIndex - 1) % SERIES_COLOR_PALETTE.length],
				axisId: newAxis.id,
			};
			const nextSeries = [...previous.series, newSeries];
			const nextConfig = { ...previous, axes: nextAxes, series: nextSeries };
			regenerateDataForSeries(nextSeries);
			return nextConfig;
		});
	}, [regenerateDataForSeries]);

	const handleRemoveAxis = useCallback((axisId: string) => {
		setConfig((previous) => {
			if (previous.axes.length <= 1) {
				return previous;
			}
			const nextAxes = previous.axes.filter((axis) => axis.id !== axisId);
			if (nextAxes.length === previous.axes.length) {
				return previous;
			}
			let nextSeries = previous.series.filter((series) => series.axisId !== axisId);
			if (nextSeries.length === 0 && nextAxes.length > 0) {
				nextSeries = [
					{
						id: 'series-1',
						name: 'Series 1',
						color: SERIES_COLOR_PALETTE[0],
						axisId: nextAxes[0].id,
					},
				];
			}
			const nextConfig = { ...previous, axes: nextAxes, series: nextSeries };
			regenerateDataForSeries(nextSeries);
			return nextConfig;
		});
	}, [regenerateDataForSeries]);

	const handleUpdateAxis = useCallback(
		(axisId: string, updates: Partial<InteractiveChartAxisConfig>) => {
			setConfig((previous) => ({
				...previous,
				axes: previous.axes.map((axis) =>
					axis.id === axisId ? { ...axis, ...updates } : axis
				),
			}));
		},
		[]
	);

	return (
		<div className="p-5 font-sans bg-gray-50 min-h-screen">
			<div className="w-full mx-auto">
				<h1 className="text-center text-3xl font-bold text-gray-900 mb-8">
					🎮 Interactive Chart Demo
				</h1>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
					<div className="lg:col-span-2">
						<InteractiveChartCanvas data={chartRecords} config={config} />

						<InteractiveChartQuickActions
							config={config}
							dataPointsCount={dataPoints.length}
							isStreaming={isStreaming}
							streamingHz={streamingHz}
							streamingPointsPerTick={streamingPointsPerTick}
							streamingMaxPoints={streamingMaxPoints}
							bulkAddCount={bulkAddCount}
							onRandomizeData={randomizeData}
							onToggleSmooth={toggleSmooth}
							onToggleFillArea={toggleFillArea}
							onToggleShowValues={toggleShowValues}
							onToggleStreaming={toggleStreaming}
							onStreamingHzChange={handleStreamingHzChange}
							onStreamingPointsPerTickChange={handleStreamingPointsPerTickChange}
							onStreamingMaxPointsChange={handleStreamingMaxPointsChange}
							onBulkAddCountChange={handleBulkAddCountChange}
							onBulkAddPoints={addBulkPoints}
						/>

						<InteractiveChartCodePreview code={codePreview} />
					</div>

					<div className="lg:col-span-1">
						<InteractiveChartControlPanel
							dataPointsCount={dataPoints.length}
							config={config}
							axisSummaries={axisSummaries}
							onSetAxisCount={handleSetAxisCount}
							onSetAxisSeriesCount={handleSetAxisSeriesCount}
							onAddSeries={handleAddSeries}
							onRemoveSeries={handleRemoveSeries}
							onUpdateSeries={handleUpdateSeries}
							onAddAxis={handleAddAxis}
							onRemoveAxis={handleRemoveAxis}
							onUpdateAxis={handleUpdateAxis}
							setConfig={setConfig}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default InteractiveChartDemoNew;
