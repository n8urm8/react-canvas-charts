import { useMemo, useState } from 'react'
import { Bot, Loader2, Sparkles, Send, X } from 'lucide-react'
import { OpenRouter } from '@openrouter/sdk'
import { ChartOverlayPortal } from '../../utils/context/ChartOverlayContext'
import { useChartSurface } from '../../utils/context/ChartSurfaceContext'
import './ChartToolbar.css'
import type { ChartToolbarPosition } from './ChartToolbar'
import type { ChartAnnotation } from './ChartAnnotationsLayer/annotations.types'
import type { ChartSelectionResult } from './ChartSurface/ChartSurface.types'
import {
  buildDeterministicChartAIResponse,
  buildChartAIActionAnnotations,
  buildChartAIPrompt,
  isSafetyOnlyResponse,
  parseChartAIResponse,
  type ChartAIAnalysisAction,
  type ChartAIAnalysisContext,
  type ChartAIAnalysisResponse,
  type ChartAIAnnotationStyleConfig,
  type ChartAISnapshot,
} from './chartAiAnalysis'

type AIMessageRole = 'user' | 'assistant'

type AIChatMessage = {
  role: AIMessageRole
  content: string
  actions?: ChartAIAnalysisAction[]
}

export interface ChartAIAnalysisAssistantProps {
  apiKey: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplyAnnotations?: (annotations: ChartAnnotation[]) => void
  selection?: ChartSelectionResult | null
  model?: string
  position?: ChartToolbarPosition
  title?: string
  placeholder?: string
  appTitle?: string
  httpReferer?: string
  className?: string
  annotationStyleConfig?: ChartAIAnnotationStyleConfig
}

const DEFAULT_MODEL = 'openrouter/free'

/**
 * Maximum points handed to the analysis helpers. Larger visible ranges are sampled with a fixed
 * stride so a question never materialises millions of objects.
 */
const MAX_SNAPSHOT_POINTS = 50_000

type ChartSurfaceValue = ReturnType<typeof useChartSurface>

interface SnapshotMapping {
  snapshot: ChartAISnapshot
  /** Absolute index of snapshot point i is `start + i * stride`. */
  start: number
  stride: number
}

/** Builds the analysis snapshot from the visible range on demand (only when a question is sent). */
const buildSnapshot = (surface: ChartSurfaceValue): SnapshotMapping => {
  const { viewRange, dataStore, yKeys } = surface
  const visibleCount = Math.max(0, viewRange.end - viewRange.start + 1)
  const stride = Math.max(1, Math.ceil(visibleCount / MAX_SNAPSHOT_POINTS))
  const count = Math.ceil(visibleCount / stride)
  const labels: string[] = new Array(count)
  const points: ChartAISnapshot['points'] = new Array(count)

  for (let position = 0; position < count; position += 1) {
    const index = viewRange.start + position * stride
    const values: Record<string, number | null> = {}
    yKeys.forEach((key) => {
      const value = dataStore.value(key, index)
      values[key] = Number.isNaN(value) ? null : value
    })
    labels[position] = dataStore.label(index)
    points[position] = { index: position, label: labels[position], values }
  }

  return { snapshot: { labels, yKeys, points }, start: viewRange.start, stride }
}

/** Converts snapshot-relative data-space x coordinates in annotations to absolute data indices. */
const mapAnnotationsToDataIndices = (
  annotations: ChartAnnotation[],
  mapping: Pick<SnapshotMapping, 'start' | 'stride'>
): ChartAnnotation[] => {
  if (mapping.start === 0 && mapping.stride === 1) {
    return annotations
  }

  const mapCoordinate = <T extends { x: number; dataSpace?: boolean }>(coordinate: T): T =>
    coordinate.dataSpace ? { ...coordinate, x: mapping.start + coordinate.x * mapping.stride } : coordinate

  return annotations.map((annotation) => {
    const next: Record<string, unknown> = { ...annotation }
    ;(['position', 'start', 'end', 'center'] as const).forEach((field) => {
      const value = next[field] as { x: number; dataSpace?: boolean } | undefined
      if (value && typeof value === 'object' && typeof value.x === 'number') {
        next[field] = mapCoordinate(value)
      }
    })
    if (Array.isArray(next.points)) {
      next.points = (next.points as Array<{ x: number; dataSpace?: boolean }>).map(mapCoordinate)
    }
    return next as unknown as ChartAnnotation
  })
}

const extractResponseText = (completion: unknown): string => {
  const typedCompletion = completion as { choices?: Array<{ message?: { content?: string | null } }> }
  return typedCompletion.choices?.[0]?.message?.content ?? ''
}

export const ChartAIAnalysisAssistant = ({
  apiKey,
  open,
  onOpenChange,
  onApplyAnnotations,
  selection,
  model = DEFAULT_MODEL,
  position = { top: 16, right: 16 },
  title = 'Chart AI Assistant',
  placeholder = 'Ask about min, max, regression, trends, anomalies, or comparisons...',
  appTitle = 'React Canvas Charts',
  httpReferer,
  className,
  annotationStyleConfig,
}: ChartAIAnalysisAssistantProps) => {
  const chartSurface = useChartSurface()
  // Built lazily per question: building it on every render would copy the whole dataset.
  const buildAnalysisContext = (): { context: ChartAIAnalysisContext; mapping: SnapshotMapping } => {
    const mapping = buildSnapshot(chartSurface)
    const { start, stride } = mapping
    const toSnapshotIndex = (index: number) => Math.max(0, Math.round((index - start) / stride))
    const mappedSelection = selection
      ? {
          ...selection,
          minIndex: toSnapshotIndex(selection.minIndex),
          maxIndex: toSnapshotIndex(selection.maxIndex),
        }
      : selection

    return {
      mapping,
      context: {
        snapshot: mapping.snapshot,
        selection: mappedSelection,
        getXPosition: (index: number) => chartSurface.getXPosition(start + index * stride),
        getYPosition: chartSurface.getYPosition,
        chartArea: chartSurface.chartArea,
        canvasSize: chartSurface.canvasSize,
        annotationStyleConfig,
      },
    }
  }

  const client = useMemo(
    () =>
      new OpenRouter({
        apiKey,
        httpReferer: httpReferer ?? (typeof window !== 'undefined' ? window.location.origin : undefined),
        appTitle,
      }),
    [apiKey, appTitle, httpReferer]
  )

  const [messages, setMessages] = useState<AIChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendAnalysis = async () => {
    const question = draft.trim()
    if (!question || isSending) {
      return
    }

    setDraft('')
    setIsSending(true)
    setError(null)

    const nextMessages = [...messages, { role: 'user' as const, content: question }]
    setMessages(nextMessages)

    try {
      const { context: analysisContext, mapping } = buildAnalysisContext()
      const completion = await client.chat.send({
        chatRequest: {
          model,
          messages: [
            { role: 'system', content: buildChartAIPrompt(analysisContext) },
            ...nextMessages.map((message) => ({ role: message.role, content: message.content })),
          ],
        },
      })

      const responseText = extractResponseText(completion)
      const parsed = parseChartAIResponse(responseText)
      const fallback =
        parsed.answer.trim().length === 0 || isSafetyOnlyResponse(parsed.answer)
          ? buildDeterministicChartAIResponse(question, analysisContext)
          : null

      const resolved: ChartAIAnalysisResponse = fallback ?? parsed

      const actions = resolved.actions
        .map((action) => buildChartAIActionAnnotations(analysisContext, action))
        .filter((action): action is ChartAIAnalysisAction => action !== null)
        .map((action) => ({ ...action, annotations: mapAnnotationsToDataIndices(action.annotations, mapping) }))

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: resolved.answer,
          actions,
        },
      ])
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Unable to reach OpenRouter.'
      setError(message)
      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: 'I could not complete that request right now.',
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const applyAction = (action: ChartAIAnalysisAction) => {
    onApplyAnnotations?.(action.annotations)
  }

  if (!open) {
    return null
  }

  return (
    <ChartOverlayPortal>
      <div
        className={`chart-ai-assistant ${className ?? ''}`}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        style={{
          position: 'absolute',
          top: typeof position.top === 'number' ? `${position.top}px` : position.top,
          right: typeof position.right === 'number' ? `${position.right}px` : position.right,
          bottom: typeof position.bottom === 'number' ? `${position.bottom}px` : position.bottom,
          left: typeof position.left === 'number' ? `${position.left}px` : position.left,
          pointerEvents: 'auto',
          touchAction: 'auto',
          width: 'min(380px, calc(100vw - 2rem))',
          maxHeight: 'min(560px, calc(100vh - 2rem))',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '0.75rem',
          border: '1px solid #d1d5db',
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.16)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2rem',
                height: '2rem',
                borderRadius: '9999px',
                backgroundColor: '#ede9fe',
                color: '#6d28d9',
              }}
            >
              <Bot style={{ width: '1rem', height: '1rem' }} />
            </span>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>{title}</div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Ask questions about the current chart data</div>
            </div>
          </div>
          <button
            type="button"
            className="chart-toolbar-button"
            onClick={() => onOpenChange(false)}
            aria-label="Close chart AI assistant"
          >
            <X style={{ width: '0.9rem', height: '0.9rem' }} />
          </button>
        </div>

        <div
          style={{
            padding: '0.9rem 1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            flex: '1 1 auto',
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                backgroundColor: '#f8fafc',
                padding: '0.75rem',
                color: '#475569',
                fontSize: '0.875rem',
                lineHeight: 1.5,
              }}
            >
              Try asking for the min and max values, a regression line, a trend summary, or any other chart question.
            </div>
          ) : null}

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              style={{
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '100%',
                borderRadius: '0.75rem',
                padding: '0.7rem 0.8rem',
                backgroundColor: message.role === 'user' ? '#dbeafe' : '#f9fafb',
                border: '1px solid #e5e7eb',
                color: '#111827',
                fontSize: '0.875rem',
                lineHeight: 1.5,
              }}
            >
              <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>

              {message.actions && message.actions.length > 0 ? (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {message.actions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className="chart-toolbar-button"
                      onClick={() => applyAction(action)}
                      style={{ justifyContent: 'flex-start' }}
                    >
                      <Sparkles style={{ width: '0.9rem', height: '0.9rem', marginRight: '0.5rem' }} />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          {error ? (
            <div
              style={{
                borderRadius: '0.75rem',
                border: '1px solid #fecaca',
                backgroundColor: '#fef2f2',
                padding: '0.75rem',
                color: '#991b1b',
                fontSize: '0.8rem',
              }}
            >
              {error}
            </div>
          ) : null}
        </div>

        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            padding: '0.75rem 1rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void sendAnalysis()
              }
            }}
            placeholder={placeholder}
            rows={3}
            className="chart-toolbar-button"
            style={{
              width: '100%',
              minHeight: '4.75rem',
              resize: 'vertical',
              textAlign: 'left',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              color: '#111827',
              padding: '0.75rem',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className={`chart-toolbar-button chart-ai-send-button ${isSending ? 'is-sending' : ''}`}
              onClick={() => void sendAnalysis()}
              disabled={isSending || draft.trim().length === 0}
            >
              {isSending ? <Loader2 style={{ width: '0.9rem', height: '0.9rem' }} /> : <Send style={{ width: '0.9rem', height: '0.9rem' }} />}
              <span style={{ marginLeft: '0.5rem' }}>{isSending ? 'Analyzing' : 'Ask AI'}</span>
            </button>
          </div>
        </div>
      </div>
    </ChartOverlayPortal>
  )
}

export type { ChartAIAnnotationStyleConfig } from './chartAiAnalysis'
