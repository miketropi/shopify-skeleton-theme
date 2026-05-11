/** Scroll parallax for collection hero media (skips when reduced motion is preferred). */

interface McolHeroParallaxState {
  hero: HTMLElement
  media: HTMLElement
  raf: number
  boundTick: () => void
}

const stateMap = new WeakMap<HTMLElement, McolHeroParallaxState>()

function tick(container: HTMLElement): void {
  const state = stateMap.get(container)
  if (!state) return

  cancelAnimationFrame(state.raf)
  state.raf = requestAnimationFrame(() => {
    const rect = state.hero.getBoundingClientRect()
    const vh = window.innerHeight
    if (rect.bottom < 0 || rect.top > vh) return

    const progress = (vh - rect.top) / (vh + rect.height)
    const shift = (progress - 0.5) * 30
    state.media.style.transform = `translate3d(0, ${shift}%, 0)`
  })
}

export function initMcolHeroParallax(container: HTMLElement): () => void {
  const hero = container.querySelector<HTMLElement>('[data-mcol-hero-parallax]')
  if (!hero) return () => {}

  const media = hero.querySelector<HTMLElement>('.mcol__hero-parallax-target')
  if (!media) return () => {}

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {}
  }

  const state: McolHeroParallaxState = {
    hero,
    media,
    raf: 0,
    boundTick: () => tick(container),
  }

  stateMap.set(container, state)
  window.addEventListener('scroll', state.boundTick, { passive: true })
  state.boundTick()

  return () => {
    const s = stateMap.get(container)
    if (!s) return

    cancelAnimationFrame(s.raf)
    window.removeEventListener('scroll', s.boundTick)
    s.media.style.transform = ''
    stateMap.delete(container)
  }
}
