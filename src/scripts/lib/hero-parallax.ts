/** Scroll parallax for hero media (respects reduced motion and optional min-width). */

export type HeroParallaxConfig = {
  container: HTMLElement
  heroSelector: string
  mediaSelector: string
  /** Shift range in px (default 30). */
  intensity?: number
  /** Min-width media query — parallax only runs when this matches (default 48em). */
  minWidthMq?: string
}

type HeroParallaxState = {
  hero: HTMLElement
  media: HTMLElement
  raf: number
  boundTick: () => void
  intensity: number
  mq: MediaQueryList
  mqListener: () => void
}

const stateMap = new WeakMap<HTMLElement, HeroParallaxState>()

function tick(container: HTMLElement): void {
  const state = stateMap.get(container)
  if (!state || !state.mq.matches) return

  cancelAnimationFrame(state.raf)
  state.raf = requestAnimationFrame(() => {
    const rect = state.hero.getBoundingClientRect()
    const vh = window.innerHeight
    if (rect.bottom < 0 || rect.top > vh) return

    const progress = (vh - rect.top) / (vh + rect.height)
    const shift = (progress - 0.5) * state.intensity
    state.media.style.transform = `translate3d(0, ${shift}px, 0)`
  })
}

export function initHeroParallax({
  container,
  heroSelector,
  mediaSelector,
  intensity = 30,
  minWidthMq = '(min-width: 48em)',
}: HeroParallaxConfig): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {}
  }

  const hero = container.querySelector<HTMLElement>(heroSelector)
  if (!hero) return () => {}

  const media = hero.querySelector<HTMLElement>(mediaSelector)
  if (!media) return () => {}

  const mq = window.matchMedia(minWidthMq)
  const state: HeroParallaxState = {
    hero,
    media,
    raf: 0,
    boundTick: () => tick(container),
    intensity,
    mq,
    mqListener: () => {
      if (!mq.matches) {
        media.style.transform = ''
      }
      tick(container)
    },
  }

  stateMap.set(container, state)
  mq.addEventListener('change', state.mqListener)
  window.addEventListener('scroll', state.boundTick, { passive: true })
  state.boundTick()

  return () => {
    const s = stateMap.get(container)
    if (!s) return

    cancelAnimationFrame(s.raf)
    s.mq.removeEventListener('change', s.mqListener)
    window.removeEventListener('scroll', s.boundTick)
    s.media.style.transform = ''
    stateMap.delete(container)
  }
}
