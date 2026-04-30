/** Predefined SVG selector options for point selectors */

// Design constants
const SVG_ICON_SIZE = '16'
const SVG_ICON_COLOR = '#6b7280'

export const SELECTOR_SVG_OPTIONS = {
  star: `<svg viewBox="0 0 24 24" width="${SVG_ICON_SIZE}" height="${SVG_ICON_SIZE}" fill="${SVG_ICON_COLOR}">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>`,

  diamond: `<svg viewBox="0 0 24 24" width="${SVG_ICON_SIZE}" height="${SVG_ICON_SIZE}" fill="${SVG_ICON_COLOR}">
    <path d="M12 2L22 12L12 22L2 12Z"/>
  </svg>`,

  triangle: `<svg viewBox="0 0 24 24" width="${SVG_ICON_SIZE}" height="${SVG_ICON_SIZE}" fill="${SVG_ICON_COLOR}">
    <path d="M12 2L22 20H2Z"/>
  </svg>`,

  hexagon: `<svg viewBox="0 0 24 24" width="${SVG_ICON_SIZE}" height="${SVG_ICON_SIZE}" fill="${SVG_ICON_COLOR}">
    <path d="M12 2L20 6V14L12 18L4 14V6Z"/>
  </svg>`,

  plus: `<svg viewBox="0 0 24 24" width="${SVG_ICON_SIZE}" height="${SVG_ICON_SIZE}" fill="${SVG_ICON_COLOR}">
    <rect x="11" y="5" width="2" height="14"/>
    <rect x="5" y="11" width="14" height="2"/>
  </svg>`,

  x: `<svg viewBox="0 0 24 24" width="${SVG_ICON_SIZE}" height="${SVG_ICON_SIZE}">
    <path d="M5 5L19 19M5 19L19 5" stroke="${SVG_ICON_COLOR}" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>`
} as const

export type SelectorSvgKey = keyof typeof SELECTOR_SVG_OPTIONS

export const SELECTOR_SVG_LABELS: Record<SelectorSvgKey, string> = {
  star: 'Star',
  diamond: 'Diamond',
  triangle: 'Triangle',
  hexagon: 'Hexagon',
  plus: 'Plus',
  x: 'X'
}
