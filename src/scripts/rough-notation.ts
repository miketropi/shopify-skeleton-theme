/**
 * Rough Notation: shortcode markers in rich text → hand-drawn SVG annotations on scroll.
 * @see docs/Rough Notation.md
 */

import { annotate } from 'rough-notation'

const SHORTCODE_RE =
  /\[(underline|circle|highlight|box|strike|bracket|crossed-off)(?:\s+color=["']?([^"'\]]+)["']?)?\]([\s\S]*?)\[\/\1\]/gi

const TYPE_MAP: Record<string, Parameters<typeof annotate>[1]['type']> = {
  underline: 'underline',
  circle: 'circle',
  highlight: 'highlight',
  box: 'box',
  strike: 'strike-through',
  bracket: 'bracket',
  'crossed-off': 'crossed-off',
}

export const ROUGH_NOTATION_DEFAULTS: Readonly<{
  color: string
  strokeWidth: number
  animationDuration: number
  padding: number
  iterations: number
  multiline: boolean
  threshold: number
}> = {
  color: '#E8593C',
  strokeWidth: 2,
  animationDuration: 800,
  padding: 5,
  iterations: 2,
  multiline: true,
  threshold: 0.3,
}

const SCAN_SELECTORS = [
  '[data-annotated-text]',
  '.rte',
  '.main-product__description',
  '.main-product__tab-rte',
  '.main-product__accordion-body',
  '.main-product__block--richtext',
  '.marticle__body',
  '.marticle__comment-content',
  '.main-page__content',
  '.mcol__desc',
  '.hero-slide__body',
  '.section-feature-grid__subheading',
  '.section-feature-grid__item-text',
  '.scrolling-promotion__text',
  '.header__drawer-block-body',
  '.htbar__loc-notice-body',
].join(', ')

const activeBySpan = new WeakMap<HTMLElement, ReturnType<typeof annotate>>()

/** Extra wait after a target intersects before calling `show()`, to let layout/paint settle. */
const POST_INTERSECTION_DELAY_MS = 300

const pendingShowTimers = new WeakMap<HTMLElement, number>()

let sharedObserver: IntersectionObserver | null = null

function clearPendingShow(span: HTMLElement): void {
  const t = pendingShowTimers.get(span)
  if (t != null) {
    clearTimeout(t)
    pendingShowTimers.delete(span)
  }
}

function clearPendingShowsInSubtree(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('span.arn-target').forEach(clearPendingShow)
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function outermost(nodes: HTMLElement[]): HTMLElement[] {
  return nodes.filter((e) => !nodes.some((o) => o !== e && o.contains(e)))
}

function hasShortcodeHint(text: string): boolean {
  return /\[(?:underline|circle|highlight|box|strike|bracket|crossed-off)\b/i.test(text)
}

function readRootConfig(root: HTMLElement): typeof ROUGH_NOTATION_DEFAULTS {
  const num = (v: string | null | undefined, fallback: number) => {
    const n = v != null && v !== '' ? parseFloat(v) : NaN
    return Number.isFinite(n) ? n : fallback
  }
  return {
    color: root.dataset.arnColor || ROUGH_NOTATION_DEFAULTS.color,
    strokeWidth: num(root.dataset.arnStroke, ROUGH_NOTATION_DEFAULTS.strokeWidth),
    animationDuration: num(root.dataset.arnDuration, ROUGH_NOTATION_DEFAULTS.animationDuration),
    padding: num(root.dataset.arnPadding, ROUGH_NOTATION_DEFAULTS.padding),
    iterations: num(root.dataset.arnIterations, ROUGH_NOTATION_DEFAULTS.iterations),
    multiline: root.dataset.arnMultiline !== 'false',
    threshold: num(root.dataset.arnThreshold, ROUGH_NOTATION_DEFAULTS.threshold),
  }
}

function applyOverridesToRoot(
  root: HTMLElement,
  overrides?: Partial<typeof ROUGH_NOTATION_DEFAULTS>,
): void {
  if (!overrides) return
  if (overrides.color != null) root.dataset.arnColor = String(overrides.color)
  if (overrides.strokeWidth != null) root.dataset.arnStroke = String(overrides.strokeWidth)
  if (overrides.animationDuration != null)
    root.dataset.arnDuration = String(overrides.animationDuration)
  if (overrides.padding != null) root.dataset.arnPadding = String(overrides.padding)
  if (overrides.iterations != null) root.dataset.arnIterations = String(overrides.iterations)
  if (overrides.multiline != null) root.dataset.arnMultiline = overrides.multiline ? 'true' : 'false'
  if (overrides.threshold != null) root.dataset.arnThreshold = String(overrides.threshold)
}

function stripForClientReparse(root: HTMLElement): void {
  clearPendingShowsInSubtree(root)
  root.querySelectorAll<HTMLElement>('span.arn-target').forEach((span) => {
    activeBySpan.get(span)?.remove()
    activeBySpan.delete(span)
    span.replaceWith(document.createTextNode(span.textContent || ''))
  })
  root.removeAttribute('data-rn-parsed')
}

function stripPreviousAnnotations(root: HTMLElement): void {
  clearPendingShowsInSubtree(root)
  root.querySelectorAll<HTMLElement>('span.arn-target').forEach((span) => {
    activeBySpan.get(span)?.remove()
    activeBySpan.delete(span)
    if (span.classList.contains('arn-ready')) {
      span.replaceWith(document.createTextNode(span.textContent || ''))
    }
  })
  root.removeAttribute('data-rn-parsed')
}

function replaceShortcodesInHtml(html: string): string {
  return html.replace(SHORTCODE_RE, (_full, rawType: string, color: string | undefined, inner: string) => {
    const t = String(rawType).toLowerCase()
    const rnType = TYPE_MAP[t]
    if (!rnType) return _full
    const colorAttr =
      color != null && String(color).trim() !== ''
        ? ` data-rn-color="${String(color).trim().replace(/"/g, '&quot;')}"`
        : ''
    return `<span class="arn-target arn-pending" data-rn-type="${rnType}"${colorAttr}>${inner}</span>`
  })
}

function getObserver(): IntersectionObserver {
  if (sharedObserver) return sharedObserver
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target as HTMLElement
        sharedObserver?.unobserve(el)

        const delayMs = prefersReducedMotion() ? 0 : POST_INTERSECTION_DELAY_MS
        if (delayMs === 0) {
          showAnnotation(el)
          continue
        }

        clearPendingShow(el)
        const timer = window.setTimeout(() => {
          pendingShowTimers.delete(el)
          if (!el.isConnected || !el.classList.contains('arn-pending')) return
          showAnnotation(el)
        }, delayMs)
        pendingShowTimers.set(el, timer)
      }
    },
    { threshold: ROUGH_NOTATION_DEFAULTS.threshold },
  )
  return sharedObserver
}

function showAnnotation(span: HTMLElement): void {
  const root = span.closest<HTMLElement>('[data-rn-parsed]')
  if (!root) return

  const type = span.dataset.rnType as Parameters<typeof annotate>[1]['type'] | undefined
  if (!type) return

  const cfg = readRootConfig(root)
  const inlineColor = span.dataset.rnColor?.trim()
  const reduce = prefersReducedMotion()

  const annotation = annotate(span, {
    type,
    color: inlineColor || cfg.color,
    strokeWidth: cfg.strokeWidth,
    padding: cfg.padding,
    iterations: cfg.iterations,
    multiline: cfg.multiline,
    animate: !reduce,
    animationDuration: reduce ? 0 : cfg.animationDuration,
  })

  activeBySpan.set(span, annotation)
  span.classList.remove('arn-pending')
  span.classList.add('arn-ready')
  annotation.show()
}

function observeTargets(root: HTMLElement): void {
  const spans = root.querySelectorAll<HTMLElement>('span.arn-target.arn-pending')
  if (spans.length === 0) return
  const obs = getObserver()
  spans.forEach((span) => obs.observe(span))
}

function hasServerPreparsedTargets(container: HTMLElement): boolean {
  return container.querySelector('span.arn-target.arn-pending') !== null
}

/**
 * Parse shortcodes inside one container and attach scroll-triggered annotations.
 * Containers may already contain <span class="arn-target arn-pending"> from Liquid (snippets/rough-notation-html).
 */
export function processContainer(
  container: HTMLElement,
  configOverrides?: Partial<typeof ROUGH_NOTATION_DEFAULTS>,
): void {
  if (!container.isConnected) return

  const hasShortcodes = hasShortcodeHint(container.textContent || '')
  const hasPreparsed = hasServerPreparsedTargets(container)

  if (!hasShortcodes && !hasPreparsed) return

  applyOverridesToRoot(container, configOverrides)

  if (hasShortcodes) {
    stripForClientReparse(container)
    const html = container.innerHTML
    const next = replaceShortcodesInHtml(html)
    if (next !== html) {
      container.innerHTML = next
    }
  }

  if (!hasServerPreparsedTargets(container)) return

  container.setAttribute('data-rn-parsed', '')
  observeTargets(container)
}

function collectScanRoots(parent: ParentNode): HTMLElement[] {
  const scope =
    parent instanceof Document || parent instanceof DocumentFragment
      ? document.body
      : (parent as HTMLElement)
  const all = Array.from(scope.querySelectorAll<HTMLElement>(SCAN_SELECTORS))
  return outermost(all)
}

/**
 * Scan `parent` (default `document.body`) for eligible containers and process those that contain shortcodes.
 */
export function initRoughNotation(parent: ParentNode = document.body): void {
  collectScanRoots(parent).forEach((root) => {
    processContainer(root)
  })
}

/** Full refresh: strip parsed markers everywhere under `parent`, then scan again. */
export function refreshRoughNotation(parent: ParentNode = document.body): void {
  const scope =
    parent instanceof Document || parent instanceof DocumentFragment
      ? document.body
      : (parent as HTMLElement)
  scope.querySelectorAll<HTMLElement>('[data-rn-parsed]').forEach((el) => {
    stripPreviousAnnotations(el)
  })
  initRoughNotation(parent)
}

function onSectionLoad(e: Event): void {
  const ev = e as CustomEvent<{ sectionId?: string }>
  const id = ev.detail?.sectionId
  const el = id
    ? (document.getElementById(`shopify-section-${id}`) as HTMLElement | null)
    : null
  if (el) initRoughNotation(el)
  else initRoughNotation(document.body)
}

export function bindRoughNotationSectionEvents(): void {
  document.addEventListener('shopify:section:load', onSectionLoad)
}

/** Optional legacy global for third-party / AJAX snippets */
export function attachRoughNotationGlobalShim(): void {
  window.AnnotatedText = {
    process: (el: HTMLElement, overrides?: Partial<typeof ROUGH_NOTATION_DEFAULTS>) => {
      processContainer(el, overrides)
    },
    refresh: () => refreshRoughNotation(document.body),
    defaults: ROUGH_NOTATION_DEFAULTS,
  }
}

declare global {
  interface Window {
    AnnotatedText?: {
      process: (el: HTMLElement, overrides?: Partial<typeof ROUGH_NOTATION_DEFAULTS>) => void
      refresh: () => void
      defaults: typeof ROUGH_NOTATION_DEFAULTS
    }
  }
}
