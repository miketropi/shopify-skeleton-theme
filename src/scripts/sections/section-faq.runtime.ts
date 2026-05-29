/**
 * section-faq.runtime.ts
 * ────────────────────────────────────────────────────────────
 * Div-based accordion for the FAQ section.
 *
 * CSS handles the smooth expand/collapse animation via
 * `grid-template-rows: 0fr → 1fr` on `.faq__answer-wrapper`,
 * triggered by `.faq__item--open`.
 *
 * This runtime:
 *   - Toggles `.faq__item--open` and `aria-expanded` on click
 *   - Enforces single-open when `data-faq-accordion="single"`
 *   - Scrolls opened answer into view
 *   - Staggered entrance animation when section scrolls into view
 *   - Reduced-motion / no-JS: items collapse by default
 *     (only the first item may be pre-opened via Liquid).
 * ────────────────────────────────────────────────────────────
 */

import gsap from 'gsap'
import {
  isDesignMode,
  prefersReducedMotion,
  waitForSectionVisible,
  waitSlideReady,
} from '../lib/carousel-section-entrance'

const OPEN_CLASS = 'faq__item--open'
const REVEALED = 'faq--revealed'

type FaqContainer = HTMLElement & {
  __faqTeardown?: () => void
}

function parseBool(s: string | undefined, fallback: boolean): boolean {
  if (s === 'true') return true
  if (s === 'false') return false
  return fallback
}

function closeSiblings(
  trigger: HTMLElement,
  itemsContainer: HTMLElement,
): void {
  const openItems = itemsContainer.querySelectorAll<HTMLElement>(
    `.faq__item.${OPEN_CLASS}`,
  )
  for (const item of openItems) {
    if (item === trigger) continue
    item.classList.remove(OPEN_CLASS)
    const btn = item.querySelector<HTMLButtonElement>('.faq__question')
    if (btn) btn.setAttribute('aria-expanded', 'false')
  }
}

export function init(container: HTMLElement): void {
  const root = container as FaqContainer
  if (root.classList.contains(REVEALED)) return

  const abort = new AbortController()
  const { signal } = abort

  let timeline: gsap.core.Timeline | null = null

  const behavior = container.dataset.faqAccordion || 'single'
  const animateOnScroll = parseBool(container.dataset.faqEntranceScroll, true)
  const scrollToAnswer = parseBool(container.dataset.faqScrollToAnswer, true)

  const reduced = prefersReducedMotion()
  const designMode = isDesignMode()

  const handleClick = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '.faq__question',
    )
    if (!button) return

    const item = button.closest<HTMLElement>('.faq__item')
    if (!item) return

    const itemsContainer = item.closest<HTMLElement>('.faq__items')
    if (!itemsContainer) return

    const isOpen = item.classList.contains(OPEN_CLASS)
    let opening = false

    if (behavior === 'single') {
      closeSiblings(item, itemsContainer)
      if (!isOpen) {
        item.classList.add(OPEN_CLASS)
        button.setAttribute('aria-expanded', 'true')
        opening = true
      } else {
        item.classList.remove(OPEN_CLASS)
        button.setAttribute('aria-expanded', 'false')
      }
    } else {
      if (isOpen) {
        item.classList.remove(OPEN_CLASS)
        button.setAttribute('aria-expanded', 'false')
      } else {
        item.classList.add(OPEN_CLASS)
        button.setAttribute('aria-expanded', 'true')
        opening = true
      }
    }

    if (opening && scrollToAnswer) {
      setTimeout(() => {
        const top = item.getBoundingClientRect().top + window.scrollY
        const headerOffset = 80
        window.scrollTo({ top: top - headerOffset, behavior: reduced ? 'auto' : 'smooth' })
      }, 100)
    }
  }

  container.addEventListener('click', handleClick, { signal })

  const teardown = (): void => {
    timeline?.kill()
    timeline = null
    gsap.killTweensOf(container)
    if (container.dataset.animateEntranceEnabled) {
      const items = container.querySelectorAll<HTMLElement>('.faq__item')
      gsap.killTweensOf(items)
      gsap.set(items, { clearProps: 'all' })
    }
    container.classList.remove(REVEALED)
    abort.abort()
  }
  root.__faqTeardown = teardown

  const items = container.querySelectorAll<HTMLElement>('.faq__item')
  if (items.length === 0) return

  gsap.set(items, { autoAlpha: 0, y: reduced ? 0 : 12 })

  const runReveal = (): void => {
    if (reduced) {
      gsap.set(items, { autoAlpha: 1, y: 0 })
      container.classList.add(REVEALED)
      return
    }

    timeline = gsap.timeline({
      onComplete: () => {
        container.classList.add(REVEALED)
      },
    })

    timeline.to(
      items,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.62,
        stagger: 0.06,
        ease: 'power2.out',
      },
      0,
    )
  }

  if (reduced) {
    runReveal()
    return
  }

  if (!animateOnScroll || designMode) {
    void waitSlideReady(container, designMode).then(() => {
      if (signal.aborted) return
      runReveal()
    })
    return
  }

  void Promise.all([
    waitSlideReady(container, designMode),
    waitForSectionVisible(container, signal, designMode),
  ])
    .catch(() => {})
    .then(() => {
      if (signal.aborted) return
      runReveal()
    })
}

export function destroy(container: HTMLElement): void {
  const root = container as FaqContainer
  root.__faqTeardown?.()
  delete root.__faqTeardown
}
