import Swiper from 'swiper'
import { Keyboard } from 'swiper/modules'
import 'swiper/css'
import gsap from 'gsap'
import {
  isDesignMode,
  prefersReducedMotion,
  revealStaggeredSlides,
  waitForSectionVisible,
  waitSlideReady,
} from '../lib/carousel-section-entrance'

type TrustBarContainer = HTMLElement & {
  __trustBarTeardown?: () => void
}

const REVEALED = 'trust-bar--revealed'
const MD_MQ = '(min-width: 48em)'

function parseCount(s: string | undefined, fallback: number): number {
  const n = parseInt(s || String(fallback), 10)
  if (Number.isFinite(n) && n > 0) return Math.min(n, 6)
  return fallback
}

function getRevealSlides(container: HTMLElement, layout: string): NodeListOf<HTMLElement> {
  const isGrid = layout === 'grid'
  const desktopGrid = window.matchMedia(MD_MQ).matches

  if (isGrid && desktopGrid) {
    return container.querySelectorAll<HTMLElement>('.trust-bar__grid .trust-bar__slide-target')
  }

  return container.querySelectorAll<HTMLElement>('.trust-bar__viewport .trust-bar__slide-target')
}

function shouldUseSwiper(container: HTMLElement, layout: string): boolean {
  if (layout === 'carousel') return true
  return !window.matchMedia(MD_MQ).matches
}

export function init(container: HTMLElement): void {
  const root = container as TrustBarContainer
  const abort = new AbortController()
  const { signal } = abort

  let swiper: InstanceType<typeof Swiper> | undefined
  let revealTimeline: gsap.core.Timeline | null = null
  let mqListener: (() => void) | undefined

  const layout = container.dataset.trustBarLayout || 'grid'
  const itemCount = parseCount(container.dataset.trustBarCount, 4)
  const swiperEl = container.querySelector<HTMLElement>('[data-trust-bar-swiper]')
  const loadingEl = container.querySelector<HTMLElement>('[data-trust-bar-loading]')
  const reduced = prefersReducedMotion()
  const designMode = isDesignMode()
  const animateOnScroll = container.dataset.trustBarEntranceScroll !== 'false'
  const useCarouselShell = layout === 'carousel' || shouldUseSwiper(container, layout)

  const destroySwiper = (): void => {
    swiper?.destroy(true, true)
    swiper = undefined
  }

  const initSwiper = (): void => {
    if (!swiperEl || itemCount === 0) return
    if (!shouldUseSwiper(container, layout)) {
      destroySwiper()
      return
    }

    if (swiper) {
      swiper.update()
      return
    }

    const desktopSlides = Math.min(itemCount, 4)

    swiper = new Swiper(swiperEl, {
      modules: [Keyboard],
      speed: reduced ? 0 : 420,
      watchOverflow: true,
      spaceBetween: 16,
      slidesPerView: 1,
      breakpoints:
        layout === 'carousel'
          ? {
              768: {
                slidesPerView: Math.min(itemCount, 2),
                spaceBetween: 20,
              },
              992: {
                slidesPerView: desktopSlides,
                spaceBetween: 24,
              },
            }
          : undefined,
      keyboard: { enabled: true, onlyInViewport: true },
    })
  }

  const teardown = (): void => {
    revealTimeline?.kill()
    revealTimeline = null
    const slides = container.querySelectorAll('.trust-bar__slide-target')
    gsap.killTweensOf(slides)
    if (loadingEl) gsap.killTweensOf(loadingEl)
    destroySwiper()
    container.classList.remove(REVEALED)
    if (mqListener) {
      window.matchMedia(MD_MQ).removeEventListener('change', mqListener)
      mqListener = undefined
    }
    abort.abort()
  }
  root.__trustBarTeardown = teardown

  const slideEls = getRevealSlides(container, layout)
  if (slideEls.length === 0) return

  gsap.set(slideEls, { autoAlpha: 0, y: reduced ? 0 : 12 })
  if (loadingEl && useCarouselShell && !reduced) gsap.set(loadingEl, { autoAlpha: 1 })

  initSwiper()

  mqListener = (): void => {
    initSwiper()
    const nextSlides = getRevealSlides(container, layout)
    if (!container.classList.contains(REVEALED)) {
      gsap.set(nextSlides, { autoAlpha: 0, y: reduced ? 0 : 12 })
    }
  }
  window.matchMedia(MD_MQ).addEventListener('change', mqListener)

  const runReveal = (): void => {
    const targets = getRevealSlides(container, layout)
    revealTimeline = revealStaggeredSlides({
      container,
      slides: targets,
      loadingEl: useCarouselShell ? loadingEl : null,
      reduced,
      revealedClass: REVEALED,
    })
  }

  if (reduced) {
    runReveal()
    return
  }

  void Promise.all([
    waitSlideReady(container, designMode),
    animateOnScroll && !designMode ? waitForSectionVisible(container, signal, designMode) : Promise.resolve(),
  ])
    .catch(() => {})
    .then(() => {
      if (signal.aborted) return
      runReveal()
      requestAnimationFrame(() => {
        swiper?.update?.()
      })
    })
}

export function destroy(container: HTMLElement): void {
  const root = container as TrustBarContainer
  root.__trustBarTeardown?.()
  delete root.__trustBarTeardown
}
