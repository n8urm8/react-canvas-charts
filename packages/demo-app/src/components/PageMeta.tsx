import { useEffect } from 'react'
import { useLocation } from 'react-router'

// Canonical host for every URL the site declares. Keep in sync with index.html,
// public/sitemap.xml and public/robots.txt.
const SITE_URL = 'https://reactcanvascharts.com'

const DEFAULT_TITLE = 'React Canvas Charts - High-Performance Canvas-Based Chart Library'
const DEFAULT_DESCRIPTION =
  'A high-performance, canvas-based charting library for React. Create interactive line charts, area charts, and real-time data visualizations with TypeScript support.'

interface PageMetaProps {
  title?: string
  description?: string
  noindex?: boolean
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }
  element.href = href
}

/**
 * Sets the title, description, canonical URL and robots directive for the current route.
 * index.html carries the homepage values, so the homepage can omit the props.
 * Pages that should not be indexed (such as the 404 page) pass `noindex`.
 */
export function PageMeta({ title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION, noindex = false }: PageMetaProps) {
  const { pathname } = useLocation()

  useEffect(() => {
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/'
    const url = noindex ? `${SITE_URL}/` : `${SITE_URL}${path}`

    document.title = title
    upsertCanonical(url)
    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow')
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', url)
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:url', url)
  }, [pathname, title, description, noindex])

  return null
}
