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
 *   - Reduced-motion / no-JS: items collapse by default
 *     (only the first item may be pre-opened via Liquid).
 * ────────────────────────────────────────────────────────────
 */

const OPEN_CLASS = 'faq__item--open'

type FaqContainer = HTMLElement & {
  __faqTeardown?: () => void
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
  const abort = new AbortController()
  const { signal } = abort

  const behavior = container.dataset.faqAccordion || 'single'

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

    if (behavior === 'single') {
      // Close all siblings first
      closeSiblings(item, itemsContainer)
      if (!isOpen) {
        // Opening this item
        item.classList.add(OPEN_CLASS)
        button.setAttribute('aria-expanded', 'true')
      } else {
        // Closing this item (already closed siblings above)
        item.classList.remove(OPEN_CLASS)
        button.setAttribute('aria-expanded', 'false')
      }
    } else {
      // Multiple: simple toggle
      if (isOpen) {
        item.classList.remove(OPEN_CLASS)
        button.setAttribute('aria-expanded', 'false')
      } else {
        item.classList.add(OPEN_CLASS)
        button.setAttribute('aria-expanded', 'true')
      }
    }
  }

  container.addEventListener('click', handleClick, { signal })

  root.__faqTeardown = () => abort.abort()
}

export function destroy(container: HTMLElement): void {
  const root = container as FaqContainer
  root.__faqTeardown?.()
  delete root.__faqTeardown
}
