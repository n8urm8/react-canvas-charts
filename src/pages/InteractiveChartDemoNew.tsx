import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import {
	type DataPoint,
	type ChartRecord,
	type InteractiveChartConfig,
	createInitialTimeSeries,
	generateNewPoints,
	buildInteractiveChartCodePreview,
	InteractiveChartCanvas,
	InteractiveChartQuickActions,
	InteractiveChartCodePreview,
	InteractiveChartControlPanel,
} from '../ExampleComponents/InteractiveChart';

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
	lineColor: '#3b82f6',
	lineSmooth: false,
	lineDash: [],
	pointSize: 6,
	pointShape: 'circle',
	pointColor: '#3b82f6',
	showGrid: true,
	gridColor: '#e5e7eb',
	showXAxis: true,
	showYAxis: true,
	xAxisTitle: 'Time',
	yAxisTitle: 'Value',
	xAxisTickStep: 1,
	xAxisMaxTicks: 0,
	cursorSnapToPoints: true,
	tooltipPosition: 'follow',
	tooltipTemplate: '{label}: {value}',
};

const clamp = (value: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, value));

export const InteractiveChartDemoNew: FC = () => {
	const [dataPoints, setDataPoints] = useState<DataPoint[]>(() => createInitialTimeSeries(12));
	const [config, setConfig] = useState<InteractiveChartConfig>(INITIAL_CONFIG);
	const [isStreaming, setIsStreaming] = useState(false);
	const [streamingHz, setStreamingHz] = useState(1);
	const [streamingPointsPerTick, setStreamingPointsPerTick] = useState(1);
	const [streamingMaxPoints, setStreamingMaxPoints] = useState(24);
	const [bulkAddCount, setBulkAddCount] = useState(10);
	const intervalRef = useRef<number | null>(null);

	const addDataPoint = useCallback(() => {
		setDataPoints((previous) => {
			const numericIds = previous
				.map((point) => Number.parseInt(point.id, 10))
				.filter((id) => Number.isFinite(id));
			const nextId = ((numericIds.length > 0 ? Math.max(...numericIds) : 0) + 1).toString();

			return [
				...previous,
				{ id: nextId, label: `Point ${nextId}`, value: Math.floor(Math.random() * 100) },
			];
		});
	}, []);

	const removeDataPoint = useCallback((id: string) => {
		setDataPoints((previous) => {
			if (previous.length <= 1) {
				return previous;
			}
			return previous.filter((point) => point.id !== id);
		});
	}, []);

	const updateDataPoint = useCallback(
		(id: string, field: 'label' | 'value', value: string | number) => {
			setDataPoints((previous) =>
				previous.map((point) => (point.id === id ? { ...point, [field]: value } : point))
			);
		},
		[]
	);

	const randomizeData = useCallback(() => {
		setDataPoints((previous) =>
			previous.map((point) => ({ ...point, value: Math.floor(Math.random() * 100) }))
		);
	}, []);

	const appendStreamingPoint = useCallback(() => {
		setDataPoints((previous) => {
			const additions = generateNewPoints(previous, Math.max(1, streamingPointsPerTick));
			let nextData = [...previous, ...additions];

			if (streamingMaxPoints > 0 && nextData.length > streamingMaxPoints) {
				nextData = nextData.slice(nextData.length - streamingMaxPoints);
			}

			return nextData;
		});
	}, [streamingMaxPoints, streamingPointsPerTick]);

	const addBulkPoints = useCallback(() => {
		if (bulkAddCount <= 0) {
			return;
		}

		setDataPoints((previous) => {
			let nextData = [...previous, ...generateNewPoints(previous, bulkAddCount)];

			if (streamingMaxPoints > 0 && nextData.length > streamingMaxPoints) {
				nextData = nextData.slice(nextData.length - streamingMaxPoints);
			}

			return nextData;
		});
	}, [bulkAddCount, streamingMaxPoints]);

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

	const chartRecords = useMemo<ChartRecord[]>(
		() => dataPoints.map(({ label, value }) => ({ label, value })),
		[dataPoints]
	);

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
							dataPoints={dataPoints}
							config={config}
							onAddDataPoint={addDataPoint}
							onRemoveDataPoint={removeDataPoint}
							onUpdateDataPoint={updateDataPoint}
							setConfig={setConfig}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default InteractiveChartDemoNew;
