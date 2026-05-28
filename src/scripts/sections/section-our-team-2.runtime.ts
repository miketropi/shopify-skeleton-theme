import Swiper from 'swiper'
import { Autoplay, Keyboard, Navigation } from 'swiper/modules'
import 'swiper/css'
import gsap from 'gsap'
import {
  isDesignMode,
  prefersReducedMotion,
  waitForSectionVisible,
  waitSlideReady,
} from '../lib/carousel-section-entrance'

type OurTeam2Container = HTMLElement & {
  __ourTeam2Teardown?: () => void
}

const REVEALED = 'team-two--revealed'

function parseBool(s: string | undefined, fallback: boolean): boolean {
  if (s === 'true') return true
  if (s === 'false') return false
  return fallback
}

function parseIntOrDefault(s: string | undefined, fallback: number, min: number, max: number): number {
  const n = parseInt(s || String(fallback), 10)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

function parseSlidesPerView(s: string | undefined, fallback: number): number {
  const val = parseFloat(s || String(fallback))
  if (!Number.isFinite(val) || val <= 0) return fallback
  return val
}

export function init(container: HTMLElement): void {
  const root = container as OurTeam2Container
  if (root.classList.contains(REVEALED)) return

  const abort = new AbortController()
  const { signal } = abort

  let swiper: InstanceType<typeof Swiper> | undefined
  let timeline: gsap.core.Timeline | null = null

  const cardsVisible = parseSlidesPerView(container.dataset.teamTwoCardsVisible, 3.2)
  const autoplay = parseBool(container.dataset.teamTwoAutoplay, false)
  const autoplaySpeed = parseIntOrDefault(container.dataset.teamTwoAutoplaySpeed, 4, 2, 10)
  const showArrows = parseBool(container.dataset.teamTwoShowArrows, true)
  const gap = parseIntOrDefault(container.dataset.teamTwoGap, 20, 0, 48)
  const slideCount = parseIntOrDefault(container.dataset.teamTwoCount, 1, 0, 12)
  const animateOnScroll = parseBool(container.dataset.teamTwoEntranceScroll, true)

  const swiperEl = container.querySelector<HTMLElement>('[data-team-two-swiper]')
  const loadingEl = container.querySelector<HTMLElement>('[data-team-two-loading]')
  const prevEl = container.querySelector<HTMLElement>('[data-team-two-arrow-prev]')
  const nextEl = container.querySelector<HTMLElement>('[data-team-two-arrow-next]')

  const reduced = prefersReducedMotion()
  const designMode = isDesignMode()

  if (loadingEl && reduced) {
    loadingEl.remove()
  }

  const destroySwiper = (): void => {
    swiper?.destroy(true, true)
    swiper = undefined
  }

  const initSwiper = (): void => {
    if (!swiperEl || slideCount === 0) return
    if (swiper) {
      swiper.update()
      return
    }

    const modules: unknown[] = [Keyboard]
    const navConfig: Record<string, unknown> = {}

    if (autoplay && !reduced && slideCount > 1) {
      modules.push(Autoplay)
    }

    const showNav = showArrows && prevEl && nextEl && slideCount > 1
    if (showNav) {
      modules.push(Navigation)
      navConfig.navigation = { prevEl, nextEl }
    }

    const desktopSlides = cardsVisible

    const swiperConfig: Record<string, unknown> = {
      modules,
      speed: reduced ? 0 : 400,
      loop: false,
      slidesPerView: 1.25,
      spaceBetween: gap,
      watchOverflow: true,
      keyboard: { enabled: true, onlyInViewport: true },
      ...navConfig,
      breakpoints: {
        768: {
          slidesPerView: Math.min(2.2, desktopSlides),
          spaceBetween: gap,
        },
        992: {
          slidesPerView: desktopSlides,
          spaceBetween: gap,
        },
      },
    }

    if (autoplay && !reduced && slideCount > 1) {
      swiperConfig.autoplay = {
        delay: autoplaySpeed * 1000,
        pauseOnMouseEnter: true,
      }
    }

    swiper = new Swiper(swiperEl, swiperConfig)
  }

  const teardown = (): void => {
    timeline?.kill()
    timeline = null
    const targets = container.querySelectorAll('.team-two__slide-target')
    gsap.killTweensOf(targets)
    if (loadingEl) gsap.killTweensOf(loadingEl)
    destroySwiper()
    container.classList.remove(REVEALED)
    abort.abort()
  }
  root.__ourTeam2Teardown = teardown

  if (slideCount === 0) return

  const slideTargets = container.querySelectorAll<HTMLElement>('.team-two__slide-target')
  if (slideTargets.length === 0) return

  gsap.set(slideTargets, { autoAlpha: 0, y: reduced ? 0 : 12 })
  if (loadingEl && slideCount > 1 && !reduced) {
    gsap.set(loadingEl, { autoAlpha: 1 })
  }

  initSwiper()

  const runReveal = (): void => {
    if (reduced) {
      gsap.set(slideTargets, { autoAlpha: 1, y: 0 })
      if (loadingEl) loadingEl.remove()
      container.classList.add(REVEALED)
      return
    }

    timeline = gsap.timeline({
      onComplete: () => {
        container.classList.add(REVEALED)
        loadingEl?.remove()
      },
    })

    if (loadingEl && slideCount > 1) {
      timeline.to(
        loadingEl,
        {
          autoAlpha: 0,
          duration: 0.42,
          ease: 'power2.out',
        },
        0,
      )
    }

    timeline.to(
      slideTargets,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.62,
        stagger: 0.08,
        ease: 'power2.out',
      },
      loadingEl && slideCount > 1 ? 0.14 : 0,
    )
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
  const root = container as OurTeam2Container
  root.__ourTeam2Teardown?.()
  delete root.__ourTeam2Teardown
}
