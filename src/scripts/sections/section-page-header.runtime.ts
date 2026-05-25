import gsap from 'gsap'
import { initHeroParallax } from '../lib/hero-parallax'
import {
  isDesignMode,
  prefersReducedMotion,
  waitForSectionVisible,
  waitSlideReady,
} from '../lib/carousel-section-entrance'

type PageHeaderContainer = HTMLElement & {
  __pageHeaderTeardown?: () => void
}

const REVEALED = 'page-header--revealed'

function parseIntensity(raw: string | undefined): number {
  const n = parseInt(raw || '30', 10)
  if (!Number.isFinite(n)) return 30
  return Math.min(80, Math.max(10, n))
}

export function init(container: HTMLElement): void {
  const root = container as PageHeaderContainer
  const abort = new AbortController()
  const { signal } = abort

  const loadingEl = container.querySelector<HTMLElement>('[data-page-header-loading]')
  const contentEl = container.querySelector<HTMLElement>('[data-page-header-content]')
  const hasMedia = container.dataset.pageHeaderHasMedia === 'true'
  const reduced = prefersReducedMotion()
  const designMode = isDesignMode()
  const animateOnScroll = container.dataset.pageHeaderEntranceScroll !== 'false'
  const useParallax = container.dataset.pageHeaderParallax === 'true' && !reduced

  let revealTimeline: gsap.core.Timeline | null = null
  let parallaxCleanup = (): void => {}

  const teardown = (): void => {
    revealTimeline?.kill()
    revealTimeline = null
    if (contentEl) gsap.killTweensOf(contentEl)
    if (loadingEl) gsap.killTweensOf(loadingEl)
    parallaxCleanup()
    container.classList.remove(REVEALED)
    abort.abort()
  }

  root.__pageHeaderTeardown = teardown

  if (useParallax) {
    parallaxCleanup = initHeroParallax({
      container,
      heroSelector: '[data-page-header-hero]',
      mediaSelector: '.page-header__media-target',
      intensity: parseIntensity(container.dataset.pageHeaderParallaxIntensity),
    })
  }

  const reveal = (): void => {
    container.classList.add(REVEALED)

    if (!contentEl) {
      loadingEl?.remove()
      return
    }

    if (reduced) {
      gsap.set(contentEl, { autoAlpha: 1, y: 0 })
      loadingEl?.remove()
      return
    }

    revealTimeline?.kill()
    revealTimeline = gsap.timeline({
      onComplete: () => {
        loadingEl?.remove()
      },
    })

    gsap.set(contentEl, { autoAlpha: 0, y: 16 })

    if (loadingEl) {
      revealTimeline.to(
        loadingEl,
        {
          autoAlpha: 0,
          duration: designMode ? 0.2 : 0.42,
          ease: 'power2.out',
        },
        0,
      )
    }

    revealTimeline.to(
      contentEl,
      {
        autoAlpha: 1,
        y: 0,
        duration: designMode ? 0.25 : 0.62,
        ease: 'power2.out',
      },
      loadingEl ? 0.12 : 0,
    )
  }

  const run = async (): Promise<void> => {
    if (hasMedia) {
      await waitSlideReady(container, designMode)
    }

    if (animateOnScroll && !designMode && !reduced) {
      try {
        await waitForSectionVisible(container, signal, designMode)
      } catch {
        return
      }
    }

    if (signal.aborted) return
    reveal()
  }

  if (!hasMedia) {
    container.classList.add(REVEALED)

    if (contentEl && animateOnScroll && !designMode && !reduced) {
      gsap.set(contentEl, { autoAlpha: 0, y: 12 })
      void waitForSectionVisible(container, signal, designMode)
        .then(() => {
          if (signal.aborted) return
          gsap.to(contentEl, {
            autoAlpha: 1,
            y: 0,
            duration: designMode ? 0.25 : 0.55,
            ease: 'power2.out',
          })
        })
        .catch(() => {})
    }

    return
  }

  void run()
}

export function destroy(container: HTMLElement): void {
  const root = container as PageHeaderContainer
  root.__pageHeaderTeardown?.()
  delete root.__pageHeaderTeardown
}
