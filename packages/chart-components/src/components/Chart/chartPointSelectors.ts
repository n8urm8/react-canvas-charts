export interface ChartPointSelector {
  id: string
  dataKey: string
  dataIndex: number
  /**
   * Optional trusted SVG markup used for this selector's visual marker.
   *
   * ⚠️ SECURITY WARNING: Only use with trusted/hardcoded SVG content.
   * If SVG comes from user input or untrusted sources, sanitize it first using sanitizeSvgMarkup().
   * Unsanitized SVG can enable XSS attacks.
   *
   * The SVG will be automatically sanitized during rendering to remove dangerous attributes/elements,
   * but it's recommended to validate at the source.
   *
   * @example
   * ```typescript
   * // ✓ Safe: hardcoded SVG
   * const selector = createChartPointSelector('value', 0, {
   *   selectorSvg: `<svg viewBox="0 0 24 24">...</svg>`
   * })
   *
   * // ✓ Safe: sanitized user input
   * import { sanitizeSvgMarkup } from 'react-canvas-charts'
   * const userSvg = getUserInput()
   * const sanitized = sanitizeSvgMarkup(userSvg)
   * if (sanitized) {
   *   const selector = createChartPointSelector('value', 0, { selectorSvg: sanitized })
   * }
   * ```
   */
  selectorSvg?: string
  /** Optional CSS class name(s) for the label. Merged with layer labelClassName. */
  labelClassName?: string
  /** Optional inline styles for the label. Merged with layer defaults. */
  labelStyle?: React.CSSProperties
}

function newSelectorId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `point-selector-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/** Create a selector state object with a stable random `id`. */
export function createChartPointSelector(
  dataKey: string,
  dataIndex = 0,
  options?: { selectorSvg?: string; labelClassName?: string; labelStyle?: React.CSSProperties }
): ChartPointSelector {
  return {
    id: newSelectorId(),
    dataKey,
    dataIndex,
    selectorSvg: options?.selectorSvg,
    labelClassName: options?.labelClassName,
    labelStyle: options?.labelStyle
  }
}
