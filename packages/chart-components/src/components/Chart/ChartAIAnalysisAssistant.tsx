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

const buildSnapshot = (context: ReturnType<typeof useChartSurface>): ChartAISnapshot => ({
  labels: context.labels,
  yKeys: context.yKeys,
  points: context.normalizedData.map((datum) => ({
    index: datum.index,
    label: datum.label,
    values: datum.values,
  })),
})

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
  const analysisContext = useMemo<ChartAIAnalysisContext>(
    () => ({
      snapshot: buildSnapshot(chartSurface),
      selection,
      getXPosition: chartSurface.getXPosition,
      getYPosition: chartSurface.getYPosition,
      chartArea: chartSurface.chartArea,
      canvasSize: chartSurface.canvasSize,
      annotationStyleConfig,
    }),
    [annotationStyleConfig, chartSurface, selection]
  )

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
