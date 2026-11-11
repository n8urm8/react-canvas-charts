import type { ChartAnnotation } from './ChartAnnotationsLayer/annotations.types'
import type { ChartSelectionResult } from './ChartSurface/ChartSurface.types'

export type ChartAIAnalysisSuggestionKind = 'extrema' | 'regression-line'

export type ChartAIExtremaTarget = 'min' | 'max' | 'both'

export interface ChartAISuggestion {
  kind: ChartAIAnalysisSuggestionKind
  label: string
  description?: string
  seriesId?: string
  extremaTarget?: ChartAIExtremaTarget
  range?: {
    startIndex: number
    endIndex: number
  }
}

export type ChartAIActionType = 'annotate-point' | 'extrema' | 'regression-line' | 'area-under-curve' | 'custom-annotation'

export interface ChartAIPointReference {
  seriesId: string
  index: number
  value: number
  label?: string
  description?: string
}

export interface ChartAIRawAnnotation {
  type: 'text' | 'line' | 'circle'
  // Text annotation fields
  position?: { x: number; y: number; dataSpace?: boolean }
  text?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  color?: string
  backgroundColor?: string
  padding?: number
  // Line annotation fields
  start?: { x: number; y: number; dataSpace?: boolean }
  end?: { x: number; y: number; dataSpace?: boolean }
  dash?: number[]
  // Circle annotation fields
  center?: { x: number; y: number; dataSpace?: boolean }
  radius?: number
  fillColor?: string
  fillOpacity?: number
  // Shared
  strokeWidth?: number
}

export interface ChartAIActionRequest {
  type: ChartAIActionType
  label: string
  description?: string
  seriesId?: string
  point?: ChartAIPointReference
  extremaTarget?: ChartAIExtremaTarget
  range?: {
    startIndex: number
    endIndex: number
  }
  annotations?: ChartAIRawAnnotation[]
}

export interface ChartAIAnalysisResponse {
  answer: string
  actions: ChartAIActionRequest[]
}

export interface ChartAISnapshotPoint {
  index: number
  label: string
  values: Record<string, number | null>
}

export interface ChartAISnapshot {
  labels: string[]
  yKeys: string[]
  points: ChartAISnapshotPoint[]
}

export interface ChartAIAnalysisAction {
  id: string
  label: string
  description?: string
  annotations: ChartAnnotation[]
}

export interface ChartAIAnnotationStyleConfig {
  points?: {
    radius?: number
    strokeWidth?: number
    fillOpacity?: number
    color?: string
    minColor?: string
    maxColor?: string
  }
  lines?: {
    regressionColor?: string
    strokeWidth?: number
    dash?: number[]
  }
  annotations?: {
    fontSize?: number
    fontWeight?: 'normal' | 'bold'
    padding?: number
    textColor?: string
    backgroundColor?: string
  }
}

export interface ChartAIAnalysisContext {
  snapshot: ChartAISnapshot
  selection?: ChartSelectionResult | null
  getXPosition?: (index: number) => number
  getYPosition?: (value: number) => number
  chartArea?: {
    x: number
    y: number
    width: number
    height: number
  }
  canvasSize?: {
    width: number
    height: number
  }
  annotationStyleConfig?: ChartAIAnnotationStyleConfig
}

const SAFETY_ONLY_PATTERN = /^(user safety|response safety)\s*:/i

const ANALYSIS_POINT_LIMIT = 24

const createId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const clampRange = (startIndex: number, endIndex: number, maxIndex: number): { startIndex: number; endIndex: number } => {
  const safeStart = Math.max(0, Math.min(startIndex, maxIndex))
  const safeEnd = Math.max(safeStart, Math.min(endIndex, maxIndex))
  return { startIndex: safeStart, endIndex: safeEnd }
}

const getSeriesDisplayName = (seriesId: string): string => seriesId.replace(/[-_]/g, ' ')

const estimateTextBoxSize = (text: string, fontSize: number, padding: number) => {
  const estimatedWidth = Math.max(120, text.length * fontSize * 0.56 + padding * 2)
  const estimatedHeight = fontSize + padding * 2

  return {
    width: estimatedWidth,
    height: estimatedHeight,
  }
}

const chooseSmartLabelPosition = (
  context: ChartAIAnalysisContext,
  anchorX: number,
  anchorY: number,
  text: string,
  fontSize: number,
  padding: number
) => {
  const chartArea = context.chartArea
  const canvasSize = context.canvasSize
  const fallbackBounds = {
    left: 0,
    top: 0,
    right: canvasSize?.width ?? anchorX + 240,
    bottom: canvasSize?.height ?? anchorY + 120,
  }

  const bounds = chartArea
    ? {
        left: chartArea.x,
        top: chartArea.y,
        right: chartArea.x + chartArea.width,
        bottom: chartArea.y + chartArea.height,
      }
    : fallbackBounds

  const box = estimateTextBoxSize(text, fontSize, padding)
  const gap = 12

  const fitsRight = anchorX + gap + box.width <= bounds.right
  const fitsLeft = anchorX - gap - box.width >= bounds.left
  const fitsAbove = anchorY - gap - box.height >= bounds.top
  const fitsBelow = anchorY + gap + box.height <= bounds.bottom

  let x = anchorX + gap
  let y = anchorY - gap - box.height * 0.3

  if (fitsRight) {
    x = anchorX + gap
  } else if (fitsLeft) {
    x = anchorX - gap - box.width
  } else {
    x = Math.min(Math.max(bounds.left, anchorX + gap), Math.max(bounds.left, bounds.right - box.width))
  }

  if (fitsAbove) {
    y = anchorY - gap - box.height * 0.3
  } else if (fitsBelow) {
    y = anchorY + gap
  } else {
    y = Math.min(Math.max(bounds.top, anchorY + gap), Math.max(bounds.top, bounds.bottom - box.height))
  }

  return { x, y }
}

const buildPromptSnapshot = (context: ChartAIAnalysisContext) => {
  const { snapshot, selection } = context
  const points = snapshot.points
  const pointCount = points.length
  const samplePoints =
    pointCount <= ANALYSIS_POINT_LIMIT
      ? points
      : [...points.slice(0, 12), ...points.slice(Math.max(12, pointCount - 12))]

  const seriesStats = snapshot.yKeys.map((seriesId) => {
    const seriesPoints = points
      .map((point) => ({ index: point.index, label: point.label, value: point.values[seriesId] }))
      .filter((point): point is { index: number; label: string; value: number } => isFiniteNumber(point.value))

    const values = seriesPoints.map((point) => point.value)
    // Loop instead of Math.min(...values): spreading large arrays overflows the call stack.
    let min: number | null = null
    let max: number | null = null
    for (const value of values) {
      if (min === null || value < min) min = value
      if (max === null || value > max) max = value
    }
    const average = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null

    return {
      seriesId,
      label: getSeriesDisplayName(seriesId),
      count: values.length,
      min,
      max,
      average,
    }
  })

  return {
    pointCount,
    yKeys: snapshot.yKeys,
    selection,
    seriesStats,
    points: samplePoints,
    truncated: pointCount > samplePoints.length,
  }
}

export const buildChartAIPrompt = (context: ChartAIAnalysisContext) => {
  const promptSnapshot = buildPromptSnapshot(context)

  return [
    'You are an expert chart analyst for React Canvas Charts.',
    'Answer the user using only the chart data and the question.',
    'Return valid JSON only with this shape:',
    '{"answer":"short natural language answer","actions":[{"type":"annotate-point|extrema|regression-line|area-under-curve|custom-annotation","label":"button label","description":"short description","seriesId":"optional series id","point":{"seriesId":"series id","index":10,"value":42.1,"label":"x-axis label","description":"point-specific note"},"extremaTarget":"min|max|both","range":{"startIndex":0,"endIndex":10},"annotations":[{"type":"text|line|circle","position":{"x":5,"y":100,"dataSpace":true},"text":"label text","fontSize":12,"color":"#000","backgroundColor":"#fff","start":{"x":0,"y":50,"dataSpace":true},"end":{"x":10,"y":50,"dataSpace":true},"dash":[6,4],"center":{"x":5,"y":50,"dataSpace":true},"radius":8,"fillColor":"#3b82f6","fillOpacity":0.2,"strokeWidth":2}]}',
    'Rules:',
    '- actions can be empty if no chart action is useful.',
    '- use seriesId values from the supplied chart data.',
    '- use type="annotate-point" when referring to a specific point with details.',
    '- for area/integral questions, prefer type="area-under-curve".',
    '- for min/max questions, prefer type="extrema".',
    '- for trend or best-fit questions, prefer type="regression-line".',
    '- for any other visualization (horizontal lines, markers, shaded regions, labels at specific positions), use type="custom-annotation" with an annotations array.',
    '- annotations use dataSpace:true to position at data coordinates (x=point index, y=data value).',
    '- keep answers concise.',
    'Chart data snapshot:',
    JSON.stringify(promptSnapshot),
  ].join('\n')
}

const tryParseChartAIObject = (value: string, depth = 0): Partial<ChartAIAnalysisResponse> | null => {
  if (depth > 2) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as unknown

    if (typeof parsed === 'string') {
      return tryParseChartAIObject(parsed, depth + 1)
    }

    if (parsed && typeof parsed === 'object') {
      return parsed as Partial<ChartAIAnalysisResponse>
    }

    return null
  } catch {
    return null
  }
}

const inferExtremaTarget = (label: string, description?: string): ChartAIExtremaTarget => {
  const haystack = `${label} ${description ?? ''}`.toLowerCase()
  const hasMin = /\b(min|min\.|minimum|lowest|smallest)\b/.test(haystack)
  const hasMax = /\b(max|max\.|maximum|highest|largest)\b/.test(haystack)

  if (hasMin && hasMax) {
    return 'both'
  }

  if (hasMax) {
    return 'max'
  }

  if (hasMin) {
    return 'min'
  }

  return 'both'
}

const isAreaUnderCurveIntent = (label: string, description?: string): boolean => {
  const haystack = `${label} ${description ?? ''}`.toLowerCase()
  return /(area\s+under\s+curve|\bauc\b|integral|area\s+of\s+the\s+curve)/.test(haystack)
}

const normalizeActionRequest = (raw: Partial<ChartAIActionRequest>): ChartAIActionRequest | null => {
  const rawType = raw.type as string | undefined
  const knownTypes: ChartAIActionType[] = ['annotate-point', 'extrema', 'regression-line', 'area-under-curve', 'custom-annotation']

  // Treat unknown types with annotations array as custom-annotation
  let resolvedType: ChartAIActionType
  if (rawType && knownTypes.includes(rawType as ChartAIActionType)) {
    resolvedType = rawType as ChartAIActionType
  } else if (Array.isArray((raw as { annotations?: unknown }).annotations)) {
    resolvedType = 'custom-annotation'
  } else {
    return null
  }

  const labelText = typeof raw.label === 'string' ? raw.label : ''
  const descriptionText = typeof raw.description === 'string' ? raw.description : undefined
  const type: ChartAIActionType =
    resolvedType === 'regression-line' && isAreaUnderCurveIntent(labelText, descriptionText)
      ? 'area-under-curve'
      : resolvedType

  const label = typeof raw.label === 'string' && raw.label.trim().length > 0 ? raw.label.trim() :
    type === 'annotate-point' ? 'Show point on chart' :
    type === 'extrema' ? 'Show extrema on chart' :
    type === 'area-under-curve' ? 'Show area under curve' :
    type === 'custom-annotation' ? 'Add to chart' : 'Show regression line'

  const normalized: ChartAIActionRequest = {
    type,
    label,
    description: typeof raw.description === 'string' ? raw.description : undefined,
    seriesId: typeof raw.seriesId === 'string' ? raw.seriesId : undefined,
    extremaTarget:
      raw.extremaTarget === 'min' || raw.extremaTarget === 'max' || raw.extremaTarget === 'both'
        ? raw.extremaTarget
        : undefined,
    range:
      raw.range && isFiniteNumber(raw.range.startIndex) && isFiniteNumber(raw.range.endIndex)
        ? {
            startIndex: Math.floor(raw.range.startIndex),
            endIndex: Math.floor(raw.range.endIndex),
          }
        : undefined,
  }

  if (raw.point && typeof raw.point === 'object') {
    const point = raw.point as Partial<ChartAIPointReference>
    if (typeof point.seriesId === 'string' && isFiniteNumber(point.index) && isFiniteNumber(point.value)) {
      normalized.point = {
        seriesId: point.seriesId,
        index: Math.floor(point.index),
        value: point.value,
        label: typeof point.label === 'string' ? point.label : undefined,
        description: typeof point.description === 'string' ? point.description : undefined,
      }
    }
  }

  if (type === 'extrema' && !normalized.extremaTarget) {
    normalized.extremaTarget = inferExtremaTarget(normalized.label, normalized.description)
  }

  if (type === 'custom-annotation' && Array.isArray((raw as { annotations?: unknown[] }).annotations)) {
    const rawAnnotations = (raw as { annotations: unknown[] }).annotations
    normalized.annotations = rawAnnotations
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item) => {
        const annotationType = item.type
        if (annotationType !== 'text' && annotationType !== 'line' && annotationType !== 'circle') {
          return null
        }
        return item as unknown as ChartAIRawAnnotation
      })
      .filter((item): item is ChartAIRawAnnotation => item !== null)
  }

  return normalized
}

const mapSuggestionToAction = (suggestion: ChartAISuggestion): ChartAIActionRequest => ({
  type: suggestion.kind,
  label: suggestion.label,
  description: suggestion.description,
  seriesId: suggestion.seriesId,
  extremaTarget: suggestion.kind === 'extrema' ? suggestion.extremaTarget : undefined,
  range: suggestion.range,
})

const extractBalancedJson = (text: string): string | null => {
  const start = text.indexOf('{')
  if (start < 0) {
    return null
  }
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\' && inString) {
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) {
      continue
    }
    if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) {
        return text.slice(start, i + 1)
      }
    }
  }
  return null
}

export const parseChartAIResponse = (rawContent: string): ChartAIAnalysisResponse => {
  const trimmed = rawContent.trim()
  const stripped = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  const jsonText = start >= 0 && end >= start ? stripped.slice(start, end + 1) : stripped
  const balanced = extractBalancedJson(stripped)

  const parsed =
    tryParseChartAIObject(stripped) ??
    tryParseChartAIObject(jsonText) ??
    (balanced ? tryParseChartAIObject(balanced) : null) ??
    tryParseChartAIObject(stripped.replace(/\\n/g, '\n')) ??
    tryParseChartAIObject(jsonText.replace(/\\n/g, '\n')) ??
    (balanced ? tryParseChartAIObject(balanced.replace(/\\n/g, '\n')) : null)

  if (parsed) {
    const answer = typeof parsed.answer === 'string' ? parsed.answer.trim() : trimmed
    const actions: ChartAIActionRequest[] = []

    const parsedActions = (parsed as { actions?: unknown[] }).actions
    if (Array.isArray(parsedActions)) {
      parsedActions.forEach((item) => {
        if (!item || typeof item !== 'object') {
          return
        }
        const normalized = normalizeActionRequest(item as Partial<ChartAIActionRequest>)
        if (normalized) {
          actions.push(normalized)
        }
      })
    }

    if (actions.length === 0 && Array.isArray((parsed as { suggestions?: unknown[] }).suggestions)) {
      const suggestions: ChartAISuggestion[] = []
      ;((parsed as { suggestions?: unknown[] }).suggestions ?? []).forEach((item) => {
        if (!item || typeof item !== 'object') {
          return
        }

        const suggestion = item as Partial<ChartAISuggestion>
        if (suggestion.kind !== 'extrema' && suggestion.kind !== 'regression-line') {
          return
        }

        suggestions.push({
          kind: suggestion.kind,
          label:
            typeof suggestion.label === 'string' && suggestion.label.trim().length > 0
              ? suggestion.label.trim()
              : suggestion.kind === 'extrema'
                ? 'Add min/max annotations'
                : 'Add regression line',
          description: typeof suggestion.description === 'string' ? suggestion.description : undefined,
          seriesId: typeof suggestion.seriesId === 'string' ? suggestion.seriesId : undefined,
          extremaTarget:
            suggestion.kind === 'extrema'
              ? suggestion.extremaTarget === 'min' || suggestion.extremaTarget === 'max' || suggestion.extremaTarget === 'both'
                ? suggestion.extremaTarget
                : inferExtremaTarget(
                    typeof suggestion.label === 'string' ? suggestion.label : '',
                    typeof suggestion.description === 'string' ? suggestion.description : undefined
                  )
              : undefined,
          range:
            suggestion.range &&
            isFiniteNumber(suggestion.range.startIndex) &&
            isFiniteNumber(suggestion.range.endIndex)
              ? {
                  startIndex: Math.floor(suggestion.range.startIndex),
                  endIndex: Math.floor(suggestion.range.endIndex),
                }
              : undefined,
        })
      })

      suggestions.forEach((suggestion) => {
        actions.push(mapSuggestionToAction(suggestion))
      })
    }

    return { answer, actions }
  }

  return { answer: trimmed, actions: [] }
}

export const isSafetyOnlyResponse = (answer: string): boolean => {
  const lines = answer
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) {
    return false
  }

  return lines.every((line) => SAFETY_ONLY_PATTERN.test(line))
}

const collectSeriesValues = (
  snapshot: ChartAISnapshot,
  seriesId: string,
  range: { startIndex: number; endIndex: number }
) => {
  const values: Array<{ index: number; label: string; value: number }> = []

  for (let index = range.startIndex; index <= range.endIndex; index += 1) {
    const point = snapshot.points[index]
    if (!point) {
      continue
    }

    const value = point.values[seriesId]
    if (!isFiniteNumber(value)) {
      continue
    }

    values.push({ index: point.index, label: point.label, value })
  }

  return values
}

const formatSeriesName = (seriesId: string): string => {
  const cleaned = seriesId.replace(/[-_]/g, ' ').trim()
  if (cleaned.length === 0) {
    return seriesId
  }
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

export const buildDeterministicChartAIResponse = (
  question: string,
  context: ChartAIAnalysisContext
): ChartAIAnalysisResponse | null => {
  const normalized = question.toLowerCase()
  const asksMin = /\b(min|min\.|minimum|lowest|smallest)\b/.test(normalized)
  const asksMax = /\b(max|max\.|maximum|highest|largest)\b/.test(normalized)
  const asksArea = /(area\s+under\s+curve|\bauc\b|integral|area\s+of\s+the\s+curve)/.test(normalized)
  const asksRegression = /\b(regression|trend\s*line|best\s*fit|line\s*of\s*best\s*fit)\b/.test(normalized)

  if (!asksMin && !asksMax && !asksRegression && !asksArea) {
    return null
  }

  const { snapshot, selection } = context
  const maxIndex = Math.max(0, snapshot.points.length - 1)
  const range = selection
    ? clampRange(selection.minIndex, selection.maxIndex, maxIndex)
    : { startIndex: 0, endIndex: maxIndex }

  const answerParts: string[] = []
  const actions: ChartAIActionRequest[] = []

  if (asksMin || asksMax) {
    const extremaLines: string[] = []

    snapshot.yKeys.forEach((seriesId) => {
      const values = collectSeriesValues(snapshot, seriesId, range)
      if (values.length === 0) {
        return
      }

      const minPoint = values.reduce((best, point) => (point.value < best.value ? point : best), values[0])
      const maxPoint = values.reduce((best, point) => (point.value > best.value ? point : best), values[0])

      const parts: string[] = []
      if (asksMin) {
        parts.push(`min ${minPoint.value.toFixed(2)} at ${minPoint.label}`)
      }
      if (asksMax) {
        parts.push(`max ${maxPoint.value.toFixed(2)} at ${maxPoint.label}`)
      }

      extremaLines.push(`${formatSeriesName(seriesId)}: ${parts.join(', ')}`)

      actions.push({
        type: 'extrema',
        seriesId,
        extremaTarget: asksMin && asksMax ? 'both' : asksMin ? 'min' : 'max',
        label:
          asksMin && asksMax
            ? `Show min/max for ${formatSeriesName(seriesId)}`
            : asksMin
              ? `Show min for ${formatSeriesName(seriesId)}`
              : `Show max for ${formatSeriesName(seriesId)}`,
      })
    })

    if (extremaLines.length > 0) {
      answerParts.push(extremaLines.join('\n'))
    }
  }

  if (asksRegression) {
    const primarySeriesId = snapshot.yKeys[0]
    if (primarySeriesId) {
      const values = collectSeriesValues(snapshot, primarySeriesId, range)
      if (values.length >= 2) {
        actions.push({
          type: 'regression-line',
          seriesId: primarySeriesId,
          label: `Show regression for ${formatSeriesName(primarySeriesId)}`,
          range,
        })
        answerParts.push(
          `I can plot a regression line for ${formatSeriesName(primarySeriesId)} across the current range.`
        )
      }
    }
  }

  if (asksArea) {
    const primarySeriesId = snapshot.yKeys[0]
    if (primarySeriesId) {
      const values = collectSeriesValues(snapshot, primarySeriesId, range)
      if (values.length >= 2) {
        let area = 0
        for (let index = 0; index < values.length - 1; index += 1) {
          const current = values[index]
          const next = values[index + 1]
          const deltaX = next.index - current.index
          area += ((current.value + next.value) / 2) * deltaX
        }

        actions.push({
          type: 'area-under-curve',
          seriesId: primarySeriesId,
          label: `Show area under curve for ${formatSeriesName(primarySeriesId)}`,
          range,
        })

        answerParts.push(
          `Estimated area under ${formatSeriesName(primarySeriesId)} over the selected range is ${area.toFixed(2)}.`
        )
      }
    }
  }

  if (answerParts.length === 0) {
    return null
  }

  return {
    answer: answerParts.join('\n\n'),
    actions,
  }
}

const getTargetSeriesIds = (snapshot: ChartAISnapshot, seriesId?: string): string[] => {
  if (seriesId && snapshot.yKeys.includes(seriesId)) {
    return [seriesId]
  }

  return snapshot.yKeys.length > 0 ? [snapshot.yKeys[0]] : []
}

const resolveRange = (
  snapshot: ChartAISnapshot,
  suggestionRange?: { startIndex: number; endIndex: number },
  selection?: ChartSelectionResult | null
) => {
  const maxIndex = Math.max(0, snapshot.points.length - 1)

  if (suggestionRange) {
    return clampRange(suggestionRange.startIndex, suggestionRange.endIndex, maxIndex)
  }

  if (selection) {
    return clampRange(selection.minIndex, selection.maxIndex, maxIndex)
  }

  return { startIndex: 0, endIndex: maxIndex }
}

const formatPointAnnotationText = (
  label: string,
  seriesId: string,
  value: number,
  description?: string
) => {
  const valueText = `${getSeriesDisplayName(seriesId)}: ${value.toFixed(2)}`
  const trimmedDescription = description?.trim()

  if (!trimmedDescription) {
    return `${label} · ${valueText}`
  }

  if (trimmedDescription.includes(value.toFixed(2)) || trimmedDescription.includes(valueText)) {
    return trimmedDescription
  }

  return `${trimmedDescription} (${valueText})`
}

const createPointAnnotations = (
  context: ChartAIAnalysisContext,
  prefix: string,
  label: string,
  point: ChartAISnapshotPoint,
  seriesId: string,
  value: number,
  color: string,
  textOverride?: string
): ChartAnnotation[] => {
  const pointStyles = context.annotationStyleConfig?.points
  const annotationStyles = context.annotationStyleConfig?.annotations
  const anchorX = context.getXPosition ? context.getXPosition(point.index) : point.index
  const anchorY = context.getYPosition ? context.getYPosition(value) : value
  const fontSize = annotationStyles?.fontSize ?? 12
  const padding = annotationStyles?.padding ?? 6
  const pointLabel = textOverride ?? formatPointAnnotationText(label, seriesId, value)
  const labelPosition = chooseSmartLabelPosition(context, anchorX, anchorY, pointLabel, fontSize, padding)
  const resolvedPointColor = pointStyles?.color ?? color

  return [
    {
      id: createId(`${prefix}-point`),
      type: 'circle',
      center: { x: point.index, y: value, dataSpace: true },
      radius: pointStyles?.radius ?? 7,
      color: resolvedPointColor,
      strokeWidth: pointStyles?.strokeWidth ?? 2,
      fillColor: resolvedPointColor,
      fillOpacity: pointStyles?.fillOpacity ?? 0.18,
    },
    {
      id: createId(`${prefix}-label`),
      type: 'text',
      position: { x: labelPosition.x, y: labelPosition.y },
      text: pointLabel,
      fontSize,
      fontWeight: annotationStyles?.fontWeight ?? 'bold',
      color: annotationStyles?.textColor ?? resolvedPointColor,
      backgroundColor: annotationStyles?.backgroundColor ?? '#ffffff',
      padding,
      metadata: {
        source: 'chart-ai',
        anchorX,
        anchorY,
      },
    },
  ]
}

const computeRegressionLine = (
  points: Array<{ index: number; value: number }>
) => {
  if (points.length < 2) {
    return null
  }

  const count = points.length
  const sumX = points.reduce((sum, point) => sum + point.index, 0)
  const sumY = points.reduce((sum, point) => sum + point.value, 0)
  const sumXY = points.reduce((sum, point) => sum + point.index * point.value, 0)
  const sumXX = points.reduce((sum, point) => sum + point.index * point.index, 0)

  const denominator = count * sumXX - sumX * sumX
  if (denominator === 0) {
    return null
  }

  const slope = (count * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / count

  return { slope, intercept }
}

const computeAreaUnderCurve = (points: Array<{ index: number; value: number }>) => {
  if (points.length < 2) {
    return null
  }

  let area = 0
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]
    const next = points[index + 1]
    const deltaX = next.index - current.index
    area += ((current.value + next.value) / 2) * deltaX
  }

  return area
}

export const buildChartAIActionAnnotations = (
  context: ChartAIAnalysisContext,
  action: ChartAIActionRequest
): ChartAIAnalysisAction | null => {
  const { snapshot, selection } = context
  const pointStyles = context.annotationStyleConfig?.points
  const lineStyles = context.annotationStyleConfig?.lines
  const annotationStyles = context.annotationStyleConfig?.annotations
  const targetSeriesIds = getTargetSeriesIds(snapshot, action.seriesId)

  if (targetSeriesIds.length === 0) {
    return null
  }

  if (action.type === 'annotate-point') {
    const point = action.point
    if (!point || !snapshot.yKeys.includes(point.seriesId)) {
      return null
    }

    const snapshotPoint = snapshot.points[point.index]
    if (!snapshotPoint) {
      return null
    }

    const value = isFiniteNumber(snapshotPoint.values[point.seriesId])
      ? (snapshotPoint.values[point.seriesId] as number)
      : point.value

    const pointText = formatPointAnnotationText(
      action.label,
      point.seriesId,
      value,
      point.description ?? action.description
    )

    const annotations = createPointAnnotations(
      context,
      'chart-ai-point',
      action.label,
      snapshotPoint,
      point.seriesId,
      value,
      pointStyles?.color ?? '#1d4ed8',
      pointText
    )

    return {
      id: createId('chart-ai-point-action'),
      label: action.label,
      description: action.description,
      annotations,
    }
  }

  if (action.type === 'extrema') {
    const range = resolveRange(snapshot, action.range, selection)
    const extremaTarget = action.extremaTarget ?? inferExtremaTarget(action.label, action.description)
    let minPoint: { point: ChartAISnapshotPoint; seriesId: string; value: number } | null = null
    let maxPoint: { point: ChartAISnapshotPoint; seriesId: string; value: number } | null = null

    for (let index = range.startIndex; index <= range.endIndex; index += 1) {
      const point = snapshot.points[index]
      if (!point) {
        continue
      }

      for (const seriesId of targetSeriesIds) {
        const value = point.values[seriesId]
        if (!isFiniteNumber(value)) {
          continue
        }

        if (!minPoint || value < minPoint.value) {
          minPoint = { point, seriesId, value }
        }

        if (!maxPoint || value > maxPoint.value) {
          maxPoint = { point, seriesId, value }
        }
      }
    }

    if (!minPoint || !maxPoint) {
      return null
    }

    const minResolved = minPoint
    const maxResolved = maxPoint

    const annotations: ChartAnnotation[] = []

    if (extremaTarget === 'min' || extremaTarget === 'both') {
      annotations.push(
        ...createPointAnnotations(
          context,
          'chart-ai-min',
          'Min',
          minResolved.point,
          minResolved.seriesId,
          minResolved.value,
          pointStyles?.minColor ?? '#0891b2'
        )
      )
    }

    if (extremaTarget === 'max' || extremaTarget === 'both') {
      annotations.push(
        ...createPointAnnotations(
          context,
          'chart-ai-max',
          'Max',
          maxResolved.point,
          maxResolved.seriesId,
          maxResolved.value,
          pointStyles?.maxColor ?? '#dc2626'
        )
      )
    }

    return {
      id: createId('chart-ai-extrema'),
      label: action.label,
      description: action.description,
      annotations,
    }
  }

  if (action.type === 'area-under-curve') {
    const range = resolveRange(snapshot, action.range, selection)
    const seriesId = targetSeriesIds[0]
    const numericPoints = [] as Array<{ index: number; value: number; point: ChartAISnapshotPoint }>

    for (let index = range.startIndex; index <= range.endIndex; index += 1) {
      const point = snapshot.points[index]
      if (!point) {
        continue
      }

      const value = point.values[seriesId]
      if (!isFiniteNumber(value)) {
        continue
      }

      numericPoints.push({ index: point.index, value, point })
    }

    const area = computeAreaUnderCurve(numericPoints)
    if (area === null) {
      return null
    }

    const midPoint = numericPoints[Math.floor(numericPoints.length / 2)]
    const maxValue = numericPoints.reduce((max, point) => Math.max(max, point.value), numericPoints[0].value)

    const annotationText = `${formatSeriesName(seriesId)} area (${range.startIndex}-${range.endIndex}): ${area.toFixed(2)}`

    return {
      id: createId('chart-ai-area-under-curve'),
      label: action.label,
      description: action.description,
      annotations: [
        {
          id: createId('chart-ai-area-label'),
          type: 'text',
          position: {
            x: midPoint.index,
            y: maxValue,
            dataSpace: true,
          },
          text: annotationText,
          fontSize: annotationStyles?.fontSize ?? 12,
          fontWeight: annotationStyles?.fontWeight ?? 'bold',
          color: annotationStyles?.textColor ?? '#7c3aed',
          backgroundColor: annotationStyles?.backgroundColor ?? '#f3e8ff',
          padding: annotationStyles?.padding ?? 6,
          metadata: {
            kind: 'area-under-curve',
            seriesId,
            area,
            range,
          },
        },
      ],
    }
  }

  if (action.type === 'custom-annotation') {
    const rawAnnotations = action.annotations
    if (!rawAnnotations || rawAnnotations.length === 0) {
      return null
    }

    const builtAnnotations: ChartAnnotation[] = rawAnnotations.map((raw) => {
      if (raw.type === 'text') {
        return {
          id: createId('chart-ai-custom-text'),
          type: 'text' as const,
          position: raw.position ?? { x: 0, y: 0 },
          text: raw.text ?? action.label,
          fontSize: raw.fontSize ?? annotationStyles?.fontSize ?? 12,
          fontWeight: raw.fontWeight ?? annotationStyles?.fontWeight ?? 'bold',
          color: raw.color ?? annotationStyles?.textColor ?? '#374151',
          backgroundColor: raw.backgroundColor ?? annotationStyles?.backgroundColor ?? '#ffffff',
          padding: raw.padding ?? annotationStyles?.padding ?? 6,
          metadata: { source: 'chart-ai-custom' },
        }
      }

      if (raw.type === 'line') {
        return {
          id: createId('chart-ai-custom-line'),
          type: 'line' as const,
          start: raw.start ?? { x: 0, y: 0, dataSpace: true },
          end: raw.end ?? { x: 0, y: 0, dataSpace: true },
          color: raw.color ?? lineStyles?.regressionColor ?? '#7c3aed',
          strokeWidth: raw.strokeWidth ?? lineStyles?.strokeWidth ?? 2,
          dash: raw.dash,
          metadata: { source: 'chart-ai-custom' },
        }
      }

      // circle
      return {
        id: createId('chart-ai-custom-circle'),
        type: 'circle' as const,
        center: raw.center ?? { x: 0, y: 0, dataSpace: true },
        radius: raw.radius ?? pointStyles?.radius ?? 7,
        color: raw.color ?? pointStyles?.color ?? '#3b82f6',
        strokeWidth: raw.strokeWidth ?? pointStyles?.strokeWidth ?? 2,
        fillColor: raw.fillColor ?? raw.color ?? pointStyles?.color ?? '#3b82f6',
        fillOpacity: raw.fillOpacity ?? pointStyles?.fillOpacity ?? 0.18,
        metadata: { source: 'chart-ai-custom' },
      }
    })

    return {
      id: createId('chart-ai-custom'),
      label: action.label,
      description: action.description,
      annotations: builtAnnotations,
    }
  }

  if (action.type !== 'regression-line') {
    return null
  }

  const range = resolveRange(snapshot, action.range, selection)
  const seriesId = targetSeriesIds[0]
  const numericPoints = [] as Array<{ index: number; value: number; point: ChartAISnapshotPoint }>

  for (let index = range.startIndex; index <= range.endIndex; index += 1) {
    const point = snapshot.points[index]
    if (!point) {
      continue
    }

    const value = point.values[seriesId]
    if (!isFiniteNumber(value)) {
      continue
    }

    numericPoints.push({ index: point.index, value, point })
  }

  const regression = computeRegressionLine(numericPoints)
  if (!regression) {
    return null
  }

  const startPoint = numericPoints[0]
  const endPoint = numericPoints[numericPoints.length - 1]
  const startY = regression.slope * startPoint.index + regression.intercept
  const endY = regression.slope * endPoint.index + regression.intercept
  const equation = `y = ${regression.slope.toFixed(3)}x + ${regression.intercept.toFixed(3)}`
  const regressionColor = lineStyles?.regressionColor ?? '#7c3aed'

  return {
    id: createId('chart-ai-regression'),
    label: action.label,
    description: action.description,
    annotations: [
      {
        id: createId('chart-ai-regression-line'),
        type: 'line',
        start: { x: startPoint.index, y: startY, dataSpace: true },
        end: { x: endPoint.index, y: endY, dataSpace: true },
        color: regressionColor,
        strokeWidth: lineStyles?.strokeWidth ?? 2,
        dash: lineStyles?.dash ?? [6, 4],
        metadata: {
          kind: 'regression-line',
          seriesId,
          equation,
        },
      },
      {
        id: createId('chart-ai-regression-label'),
        type: 'text',
        position: { x: Math.round((startPoint.index + endPoint.index) / 2), y: (startY + endY) / 2, dataSpace: true },
        text: `${formatSeriesName(seriesId)}: ${equation}`,
        fontSize: annotationStyles?.fontSize ?? 12,
        fontWeight: annotationStyles?.fontWeight ?? 'bold',
        color: annotationStyles?.textColor ?? regressionColor,
        backgroundColor: annotationStyles?.backgroundColor ?? '#f3e8ff',
        padding: annotationStyles?.padding ?? 6,
        metadata: {
          kind: 'regression-label',
          seriesId,
          equation,
        },
      },
    ],
  }
}
