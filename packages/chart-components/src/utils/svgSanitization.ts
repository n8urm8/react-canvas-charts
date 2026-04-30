/**
 * SVG sanitization utilities for safe rendering of custom selector SVGs
 * Prevents XSS attacks by validating SVG structure and removing dangerous attributes
 */

/**
 * Whitelist of safe SVG elements
 */
const SAFE_SVG_ELEMENTS = new Set([
  'svg',
  'g',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'defs',
  'symbol',
  'use',
  'image',
  'view',
  'metadata',
  'title',
  'desc'
])

/**
 * Whitelist of safe SVG attributes
 */
const SAFE_SVG_ATTRIBUTES = new Set([
  // Geometry
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'width',
  'height',
  'd',
  'points',
  'viewbox',
  'preserveaspectratio',

  // Styling
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-dashoffset',
  'font-size',
  'font-family',
  'text-anchor',

  // Transform
  'transform',

  // Structural
  'id',
  'class',
  'role',
  'data-*',
  'aria-*',

  // SVG specific
  'href',
  'xlink:href',
  'clippath',
  'clip-path',
  'mask',
  'fill-rule',
  'clip-rule'
])

/**
 * Sanitizes SVG markup by removing potentially dangerous elements and attributes
 * @param svgMarkup - The SVG markup to sanitize
 * @returns Sanitized SVG markup, or null if invalid
 * @throws Will not throw, but returns null for invalid SVG
 */
export function sanitizeSvgMarkup(svgMarkup: string | null | undefined): string | null {
  if (!svgMarkup || typeof svgMarkup !== 'string') {
    return null
  }

  const trimmed = svgMarkup.trim()
  if (!trimmed) {
    return null
  }

  // Validate that it looks like SVG markup
  if (!trimmed.toLowerCase().includes('<svg')) {
    return null
  }

  try {
    // Parse SVG string using DOMParser (safe - no execution)
    const parser = new DOMParser()
    const doc = parser.parseFromString(trimmed, 'image/svg+xml')

    // Check for parsing errors
    if (doc.querySelector('parsererror')) {
      return null
    }

    // Recursively clean the SVG element tree
    const root = doc.documentElement
    cleanSvgElement(root)

    // Serialize back to string
    const serializer = new XMLSerializer()
    return serializer.serializeToString(root)
  } catch {
    // Return null if any error occurs during parsing/serialization
    return null
  }
}

/**
 * Recursively cleans an SVG element and its children
 * Removes unsafe elements and attributes
 */
function cleanSvgElement(element: Element): void {
  // Remove unsafe elements entirely
  if (!SAFE_SVG_ELEMENTS.has(element.tagName.toLowerCase())) {
    element.remove()
    return
  }

  // Remove event handlers and script-related attributes
  const unsafeAttrs = Array.from(element.attributes)
    .filter((attr) => {
      const name = attr.name.toLowerCase()
      // Remove event handlers
      if (name.startsWith('on')) {
        return true
      }
      // Remove javascript: protocol
      if (attr.value?.toLowerCase().includes('javascript:')) {
        return true
      }
      // Check if attribute is in whitelist (handle data-* and aria-*)
      if (name.startsWith('data-') || name.startsWith('aria-')) {
        return false
      }
      return !SAFE_SVG_ATTRIBUTES.has(name)
    })
    .map((attr) => attr.name)

  // Remove all unsafe attributes
  unsafeAttrs.forEach((attr) => {
    element.removeAttribute(attr)
  })

  // Recursively clean children
  Array.from(element.children).forEach(cleanSvgElement)
}

/**
 * Validates if SVG markup is safe to render
 * @param svgMarkup - The SVG markup to validate
 * @returns true if SVG is safe, false otherwise
 */
export function isSafeSvg(svgMarkup: string | null | undefined): boolean {
  return sanitizeSvgMarkup(svgMarkup) !== null
}
