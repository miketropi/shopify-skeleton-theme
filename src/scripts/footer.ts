import { registerSection } from './section-registry'

const SECTION_TYPE = 'footer'
const MD_MQ = '(min-width: 48em)'
const SCROLL_THRESHOLD = 400

type FooterContainer = HTMLElement & {
  __footerTeardown?: () => void
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function initAccordions(container: HTMLElement, signal: AbortSignal): void {
  if (container.dataset.footerAccordion !== 'true') return

  const cols = Array.from(container.querySelectorAll<HTMLElement>('[data-footer-nav-col]'))
  if (cols.length === 0) return

  const mq = window.matchMedia(MD_MQ)

  const setExpanded = (col: HTMLElement, expanded: boolean): void => {
    const toggle = col.querySelector<HTMLButtonElement>('[data-footer-nav-toggle]')
    const panel = col.querySelector<HTMLElement>('[data-footer-nav-panel]')
    if (!toggle || !panel) return
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false')
    col.classList.toggle('site-footer__nav-col--open', expanded)
  }

  const syncLayout = (): void => {
    const desktop = mq.matches
    cols.forEach((col) => {
      const toggle = col.querySelector<HTMLButtonElement>('[data-footer-nav-toggle]')
      if (!toggle) return
      if (desktop) {
        toggle.hidden = true
        setExpanded(col, true)
      } else {
        toggle.hidden = false
        if (!col.classList.contains('site-footer__nav-col--open')) {
          setExpanded(col, false)
        }
      }
    })
  }

  mq.addEventListener('change', syncLayout, { signal })
  syncLayout()

  container.addEventListener(
    'click',
    (e) => {
      if (mq.matches) return
      const toggle = (e.target as Element).closest<HTMLButtonElement>('[data-footer-nav-toggle]')
      if (!toggle || !container.contains(toggle)) return
      const col = toggle.closest<HTMLElement>('[data-footer-nav-col]')
      if (!col) return
      const expanded = toggle.getAttribute('aria-expanded') === 'true'
      setExpanded(col, !expanded)
    },
    { signal },
  )
}

function initBackToTop(container: HTMLElement, signal: AbortSignal): void {
  const btn = container.querySelector<HTMLButtonElement>('[data-footer-back-to-top]')
  if (!btn) return

  const update = (): void => {
    btn.hidden = window.scrollY < SCROLL_THRESHOLD
  }

  window.addEventListener('scroll', update, { signal, passive: true })
  update()

  btn.addEventListener(
    'click',
    () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    },
    { signal },
  )
}

function init(container: HTMLElement): void {
  const root = container as FooterContainer
  const abort = new AbortController()
  const { signal } = abort

  initAccordions(container, signal)
  initBackToTop(container, signal)

  root.__footerTeardown = () => {
    abort.abort()
  }
}

function destroy(container: HTMLElement): void {
  const root = container as FooterContainer
  root.__footerTeardown?.()
  root.__footerTeardown = undefined
}

export function registerFooterSection(): void {
  registerSection(SECTION_TYPE, init, destroy)
}
