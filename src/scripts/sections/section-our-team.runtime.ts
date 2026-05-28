import Swiper from 'swiper'
import { Autoplay, EffectFade, Keyboard, Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-fade'
import gsap from 'gsap'
import {
  isDesignMode,
  prefersReducedMotion,
  waitForSectionVisible,
  waitSlideReady,
} from '../lib/carousel-section-entrance'

type OurTeamContainer = HTMLElement & {
  __ourTeamTeardown?: () => void
}

const REVEALED = 'our-team--revealed'

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
  const val = parseIntOrDefault(s, fallback, 1, 4)
  return val
}

export function init(container: HTMLElement): void {
  const root = container as OurTeamContainer
  if (root.classList.contains(REVEALED)) return

  const abort = new AbortController()
  const { signal } = abort

  let swiper: InstanceType<typeof Swiper> | undefined
  let timeline: gsap.core.Timeline | null = null

  const slidesPerView = parseSlidesPerView(container.dataset.ourTeamSlidesPerView, 4)
  const autoplay = parseBool(container.dataset.ourTeamAutoplay, true)
  const autoplaySpeed = parseIntOrDefault(container.dataset.ourTeamAutoplaySpeed, 5, 2, 10)
  const showDots = parseBool(container.dataset.ourTeamShowDots, true)
  const showArrows = parseBool(container.dataset.ourTeamShowArrows, false)
  const effect = container.dataset.ourTeamEffect || 'slide'
  const gap = parseIntOrDefault(container.dataset.ourTeamGap, 24, 0, 48)
  const slideCount = parseIntOrDefault(container.dataset.ourTeamCount, 1, 0, 24)
  const animateOnScroll = parseBool(container.dataset.ourTeamEntranceScroll, true)

  const swiperEl = container.querySelector<HTMLElement>('[data-our-team-swiper]')
  const loadingEl = container.querySelector<HTMLElement>('[data-our-team-loading]')
  const paginationEl = container.querySelector<HTMLElement>('[data-our-team-pagination]')
  const prevEl = container.querySelector<HTMLElement>('[data-our-team-arrow-prev]')
  const nextEl = container.querySelector<HTMLElement>('[data-our-team-arrow-next]')

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

    if (effect === 'fade') {
      modules.push(EffectFade)
    }

    if (autoplay && !reduced && slideCount > 1) {
      modules.push(Autoplay)
    }

    const showPagination = showDots && paginationEl && slideCount > 1
    if (showPagination) {
      modules.push(Pagination)
    }

    const showNav = showArrows && prevEl && nextEl && slideCount > 1
    if (showNav) {
      modules.push(Navigation)
      navConfig.navigation = { prevEl, nextEl }
    }

    const desktopSlides = Math.min(slidesPerView, slideCount)

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
          slidesPerView: Math.min(2, desktopSlides),
          spaceBetween: gap,
        },
        992: {
          slidesPerView: desktopSlides,
          spaceBetween: gap,
        },
      },
    }

    if (showPagination) {
      swiperConfig.pagination = { el: paginationEl, clickable: true }
    }

    if (effect === 'fade') {
      swiperConfig.effect = 'fade'
      swiperConfig.fadeEffect = { crossFade: true }
      swiperConfig.slidesPerView = 1
      delete swiperConfig.breakpoints
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
    const targets = container.querySelectorAll('.our-team__slide-target')
    gsap.killTweensOf(targets)
    if (loadingEl) gsap.killTweensOf(loadingEl)
    destroySwiper()
    container.classList.remove(REVEALED)
    abort.abort()
  }
  root.__ourTeamTeardown = teardown

  if (slideCount === 0) return

  const slideTargets = container.querySelectorAll<HTMLElement>('.our-team__slide-target')
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
  const root = container as OurTeamContainer
  root.__ourTeamTeardown?.()
  delete root.__ourTeamTeardown
}
