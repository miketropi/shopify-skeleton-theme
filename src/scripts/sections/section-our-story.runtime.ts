import gsap from 'gsap'
import {
  isDesignMode,
  prefersReducedMotion,
  waitForSectionVisible,
  waitSlideReady,
} from '../lib/carousel-section-entrance'

const REVEALED = 'section-our-story--revealed'

type OurStoryContainer = HTMLElement & {
  __ourStoryTeardown?: () => void
}

function parseBool(s: string | undefined, fallback: boolean): boolean {
  if (s === 'true') return true
  if (s === 'false') return false
  return fallback
}

export function init(container: HTMLElement): void {
  const root = container as OurStoryContainer
  if (root.classList.contains(REVEALED)) return

  const abort = new AbortController()
  const { signal } = abort

  let timeline: gsap.core.Timeline | null = null

  const animateOnScroll = parseBool(
    container.dataset.ourStoryEntranceScroll,
    true,
  )
  const reduced = prefersReducedMotion()
  const designMode = isDesignMode()

  const cards = container.querySelectorAll<HTMLElement>(
    '.section-our-story__card',
  )
  if (cards.length === 0) return

  const teardown = (): void => {
    timeline?.kill()
    timeline = null
    gsap.killTweensOf(cards)
    gsap.set(cards, { clearProps: 'all' })
    container.classList.remove(REVEALED)
    abort.abort()
  }
  root.__ourStoryTeardown = teardown

  gsap.set(cards, { autoAlpha: 0, y: 18 })

  const runReveal = (): void => {
    if (reduced) {
      gsap.set(cards, { clearProps: 'all' })
      container.classList.add(REVEALED)
      return
    }

    timeline = gsap.timeline({
      onComplete: () => {
        container.classList.add(REVEALED)
      },
    })

    timeline.to(
      cards,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.1,
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
  const root = container as OurStoryContainer
  root.__ourStoryTeardown?.()
  delete root.__ourStoryTeardown
}
