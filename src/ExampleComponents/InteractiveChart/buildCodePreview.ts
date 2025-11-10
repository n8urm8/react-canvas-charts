import type { ChartRecord, InteractiveChartConfig } from './types';

const serializeLayer = (lines: string[]): string => lines.filter(Boolean).join('\n');

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

  const surfaceProps = serializeLayer([
    'data={data}',
    'xKey="label"',
    'yKeys={["value"]}',
    'width="100%"',
    `height={${config.height}}`,
    `margin={{ top: ${config.padding}, right: ${config.padding}, bottom: ${config.padding}, left: ${config.padding} }}`,
    `defaultColors={[${JSON.stringify(config.lineColor)}]}`,
  ]);

  const gridLayer = `  <ChartGridLayer show={${config.showGrid}} color=${JSON.stringify(config.gridColor)} />`;

  const xAxisProps = [
    `show={${config.showXAxis}}`,
    `title=${JSON.stringify(config.xAxisTitle)}`,
    `showTitle={${config.xAxisTitle.length > 0}}`,
    `tickStep={${config.xAxisTickStep}}`,
  ];
  if (config.xAxisMaxTicks > 0) {
    xAxisProps.push(`maxTicks={${config.xAxisMaxTicks}}`);
  }
  const xAxisLayer = `  <ChartXAxis ${xAxisProps.join(' ')} />`;

  const yAxisProps = [
    `show={${config.showYAxis}}`,
    `title=${JSON.stringify(config.yAxisTitle)}`,
    `showTitle={${config.yAxisTitle.length > 0}}`,
  ];
  if (config.yAxisTitle.length > 0) {
    yAxisProps.push('titleRotation={-90}');
  }
  const yAxisLayer = `  <ChartYAxis ${yAxisProps.join(' ')} />`;

  const areaLayer = config.fillArea
    ? `  <ChartAreaSeries dataKey="value" color=${JSON.stringify(config.lineColor)} opacity={${config.fillOpacity}} />`
    : '';

  const lineLayer = config.showLines
    ? `  <ChartLineSeries dataKey="value" color=${JSON.stringify(config.lineColor)} lineWidth={${config.lineWidth}} smooth={${config.lineSmooth}} lineDash={${JSON.stringify(config.lineDash)}} />`
    : '';

  const pointLayer = config.showPoints
    ? `  <ChartPointSeries dataKey="value" size={${config.pointSize}} shape=${JSON.stringify(config.pointShape)} color=${JSON.stringify(config.pointColor)} fillColor=${JSON.stringify(config.pointColor)} />`
    : '';

  const valueLabelsLayer = config.showValues ? '  <ChartValueLabels dataKey="value" />' : '';

  const cursorLayer = config.enableCursor
    ? `  <ChartCursorLayer snapToDataPoints={${config.cursorSnapToPoints}} />`
    : '';

  const tooltipLayer = config.enableTooltip
    ? `  <ChartTooltipLayer position=${JSON.stringify(config.tooltipPosition)} template=${JSON.stringify(config.tooltipTemplate)} />`
    : '';

  const titleLayer = config.title
    ? `  <ChartTitleLayer title=${JSON.stringify(config.title)} />`
    : '';

  const layers = [
    titleLayer,
    gridLayer,
    xAxisLayer,
    yAxisLayer,
    areaLayer,
    lineLayer,
    pointLayer,
    valueLabelsLayer,
    cursorLayer,
    tooltipLayer,
  ]
    .filter(Boolean)
    .join('\n');

  return `import {\n  ChartSurface,\n  ChartGridLayer,\n  ChartXAxis,\n  ChartYAxis,\n  ChartLineSeries,\n  ChartPointSeries,\n  ChartAreaSeries,\n  ChartValueLabels,\n  ChartCursorLayer,\n  ChartTooltipLayer,\n  ChartTitleLayer,\n} from './components/Chart';\n\n${dataCode}\n\n<ChartSurface\n  ${surfaceProps}\n>\n${layers}\n</ChartSurface>`;
};
