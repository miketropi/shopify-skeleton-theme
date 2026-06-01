import gsap from 'gsap'
import {
  isDesignMode,
  prefersReducedMotion,
  waitForSectionVisible,
  waitSlideReady,
} from '../lib/carousel-section-entrance'

const REVEALED = 'section-image-with-text--revealed'

type IwtContainer = HTMLElement & {
  __iwtTeardown?: () => void
}

function parseBool(s: string | undefined, fallback: boolean): boolean {
  if (s === 'true') return true
  if (s === 'false') return false
  return fallback
}

export function init(container: HTMLElement): void {
  const root = container as IwtContainer
  if (root.classList.contains(REVEALED)) return

  const abort = new AbortController()
  const { signal } = abort

  let timeline: gsap.core.Timeline | null = null

  const animateOnScroll = parseBool(
    container.dataset.imageWithTextEntranceScroll,
    true,
  )
  const reduced = prefersReducedMotion()
  const designMode = isDesignMode()

  const targets = container.querySelectorAll<HTMLElement>(
    '.section-image-with-text__image-col, .section-image-with-text__content-col',
  )
  if (targets.length === 0) return

  const teardown = (): void => {
    timeline?.kill()
    timeline = null
    gsap.killTweensOf(targets)
    gsap.set(targets, { clearProps: 'all' })
    container.classList.remove(REVEALED)
    abort.abort()
  }
  root.__iwtTeardown = teardown

  gsap.set(targets, { autoAlpha: 0, y: 20 })

  const runReveal = (): void => {
    if (reduced) {
      gsap.set(targets, { clearProps: 'all' })
      container.classList.add(REVEALED)
      return
    }

    timeline = gsap.timeline({
      onComplete: () => {
        container.classList.add(REVEALED)
      },
    })

    timeline.to(
      targets,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.75,
        stagger: 0.12,
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
  const root = container as IwtContainer
  root.__iwtTeardown?.()
  delete root.__iwtTeardown
}
