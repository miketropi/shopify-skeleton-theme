import gsap from 'gsap'
import {
  isDesignMode,
  prefersReducedMotion,
  waitForSectionVisible,
  waitSlideReady,
} from '../lib/carousel-section-entrance'

const REVEALED = 'ben--revealed'
const FALLBACK_MS = 8000

type BenefitsContainer = HTMLElement & {
  __benefitsTeardown?: () => void
}

export function init(container: HTMLElement): void {
  const root = container as BenefitsContainer
  const abort = new AbortController()
  const { signal } = abort

  const reduced = prefersReducedMotion()
  const designMode = isDesignMode()
  const animateOnScroll = container.dataset.benefitsEntranceScroll !== 'false'
  const loadingEl = container.querySelector<HTMLElement>('[data-benefits-loading]')
  const itemEls = container.querySelectorAll<HTMLElement>('.ben__item')

  let revealTl: gsap.core.Timeline | null = null
  let revealed = false
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null

  if (itemEls.length === 0) return

  const runReveal = (): void => {
    if (revealed) return
    revealed = true
    if (fallbackTimer) clearTimeout(fallbackTimer)

    if (reduced) {
      gsap.set(itemEls, { autoAlpha: 1, y: 0 })
      if (loadingEl) loadingEl.remove()
      container.classList.add(REVEALED)
      return
    }

    revealTl = gsap.timeline({
      onComplete: () => {
        container.classList.add(REVEALED)
        loadingEl?.remove()
      },
    })

    if (loadingEl) {
      revealTl.to(loadingEl, { autoAlpha: 0, duration: 0.35, ease: 'power2.out' }, 0)
    }

    revealTl.to(
      itemEls,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.07,
        ease: 'power3.out',
      },
      loadingEl ? 0.12 : 0,
    )
  }

  const forceReveal = (): void => {
    if (revealed) return
    revealed = true
    gsap.set(itemEls, { autoAlpha: 1, y: 0 })
    if (loadingEl) loadingEl.remove()
    container.classList.add(REVEALED)
  }

  const teardown = (): void => {
    if (fallbackTimer) clearTimeout(fallbackTimer)
    revealTl?.kill()
    revealTl = null
    gsap.killTweensOf(itemEls)
    if (loadingEl) gsap.killTweensOf(loadingEl)
    container.classList.remove(REVEALED)
    revealed = false
    abort.abort()
  }
  root.__benefitsTeardown = teardown

  gsap.set(itemEls, { autoAlpha: 0, y: reduced ? 0 : 16 })
  if (loadingEl && !reduced) gsap.set(loadingEl, { autoAlpha: 1 })

  if (reduced) {
    runReveal()
    return
  }

  fallbackTimer = setTimeout(forceReveal, FALLBACK_MS)

  void Promise.all([
    waitSlideReady(container, designMode),
    animateOnScroll && !designMode
      ? waitForSectionVisible(container, signal, designMode)
      : Promise.resolve(),
  ])
    .then(() => {
      if (signal.aborted || revealed) return
      runReveal()
    })
    .catch(() => {
      forceReveal()
    })
}

export function destroy(container: HTMLElement): void {
  const root = container as BenefitsContainer
  root.__benefitsTeardown?.()
  delete root.__benefitsTeardown
}
