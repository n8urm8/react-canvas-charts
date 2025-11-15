import type { ChartRecord, InteractiveChartConfig } from './types';

const serializeLayer = (lines: string[]): string => lines.filter(Boolean).join('\n');

const formatArray = (items: string[]): string => `[${items.join(', ')}]`;

export const buildInteractiveChartCodePreview = (
  config: InteractiveChartConfig,
  chartRecords: ChartRecord[],
): string => {
  const firstDataEntry = chartRecords[0];
  const formattedFirstEntry = firstDataEntry
    ? JSON.stringify(firstDataEntry, null, 2)
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')
    : '';

  const dataCode = firstDataEntry
    ? `const data = [\n${formattedFirstEntry}${chartRecords.length > 1 ? `,\n  // ...more data points` : ''}\n];`
    : 'const data = [];';

  const seriesKeys = config.series.map((series) => JSON.stringify(series.id));
  const defaultColors = config.series.map((series) => JSON.stringify(series.color));

  const valueScales = config.axes.length
    ? `valueScales={[${config.axes
        .map((axis) => {
          const keys = config.series
            .filter((series) => series.axisId === axis.id)
            .map((series) => JSON.stringify(series.id));
          return `
    {
      id: ${JSON.stringify(axis.id)},
      dataKeys: ${formatArray(keys)},
    }`;
        })
        .join(',')}
  ]}`
    : '';

  const surfaceProps = serializeLayer([
    'data={data}',
    'xKey="label"',
    `yKeys={${formatArray(seriesKeys)}}`,
    'width="100%"',
    `height={${config.height}}`,
    `margin={{ top: ${config.padding}, right: ${config.padding}, bottom: ${config.padding}, left: ${config.padding} }}`,
    `defaultColors={${formatArray(defaultColors)}}`,
    valueScales,
  ]);

  const gridLayer = `  <ChartGridLayer show={${config.showGrid}} color=${JSON.stringify(config.gridColor)} alignWithXAxisTicks />`;

  const xAxisProps = [
    `show={${config.showXAxis}}`,
    `title=${JSON.stringify(config.xAxisTitle)}`,
    `showTitle={${config.xAxisTitle.length > 0}}`,
    `tickStep={${config.xAxisTickStep}}`,
    `labelRotation={${config.xAxisLabelRotation}}`,
    `labelOffsetY={${config.xAxisLabelOffsetY}}`,
  ];
  if (config.xAxisMaxTicks > 0) {
    xAxisProps.push(`maxTicks={${config.xAxisMaxTicks}}`);
  }
  const xAxisLayer = `  <ChartXAxis ${xAxisProps.join(' ')} />`;

  const yAxisLayers = config.showYAxis
    ? config.axes
        .map((axis) => {
          const line = `  <ChartYAxis show title=${JSON.stringify(axis.title)} showTitle={${axis.title.length > 0}} titleRotation={${axis.title.length > 0 ? -90 : 0}} scaleId=${JSON.stringify(axis.id)} side=${JSON.stringify(axis.position)} orientation=${JSON.stringify(axis.position === 'right' ? 'right' : 'left')} />`;
          return line;
        })
        .join('\n')
    : '';

  const areaLayers = config.fillArea
    ? config.series
        .map(
          (series) =>
            `  <ChartAreaSeries dataKey=${JSON.stringify(series.id)} color=${JSON.stringify(series.color)} opacity={${config.fillOpacity}} />`,
        )
        .join('\n')
    : '';

  const lineLayers = config.showLines
    ? config.series
        .map(
          (series) =>
            `  <ChartLineSeries dataKey=${JSON.stringify(series.id)} color=${JSON.stringify(series.color)} lineWidth={${config.lineWidth}} smooth={${config.lineSmooth}} lineDash={${JSON.stringify(config.lineDash)}} />`,
        )
        .join('\n')
    : '';

  const pointLayers = config.showPoints
    ? config.series
        .map(
          (series) =>
            `  <ChartPointSeries dataKey=${JSON.stringify(series.id)} size={${config.pointSize}} shape=${JSON.stringify(config.pointShape)} color=${JSON.stringify(series.color)} fillColor=${JSON.stringify(series.color)} />`,
        )
        .join('\n')
    : '';

  const valueLabelLayers = config.showValues
    ? config.series
        .map((series) => `  <ChartValueLabels dataKey=${JSON.stringify(series.id)} />`)
        .join('\n')
    : '';

  const cursorLayer = config.enableCursor
    ? `  <ChartCursorLayer snapToDataPoints={${config.cursorSnapToPoints}} snapAlongYAxis={${config.cursorSnapAlongYAxis}} />`
    : '';

  const tooltipLayer = config.enableTooltip
    ? `  <ChartTooltipLayer position=${JSON.stringify(config.tooltipPosition)} template=${JSON.stringify(config.tooltipTemplate)} snapAlongYAxis={${config.cursorSnapAlongYAxis}} />`
    : '';

  const titleLayer = config.title
    ? `  <ChartTitleLayer title=${JSON.stringify(config.title)} />`
    : '';

  const layers = [
    titleLayer,
    gridLayer,
    xAxisLayer,
    yAxisLayers,
    areaLayers,
    lineLayers,
    pointLayers,
    valueLabelLayers,
    cursorLayer,
    tooltipLayer,
  ]
    .filter(Boolean)
    .join('\n');

  return `import {\n  ChartSurface,\n  ChartGridLayer,\n  ChartXAxis,\n  ChartYAxis,\n  ChartLineSeries,\n  ChartPointSeries,\n  ChartAreaSeries,\n  ChartValueLabels,\n  ChartCursorLayer,\n  ChartTooltipLayer,\n  ChartTitleLayer,\n} from './components/Chart';\n\n${dataCode}\n\n<ChartSurface\n  ${surfaceProps}\n>\n${layers}\n</ChartSurface>`;
};
