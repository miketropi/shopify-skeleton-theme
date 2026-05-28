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

type TestimonialsContainer = HTMLElement & {
  __testimonialsTeardown?: () => void
}

const REVEALED = 'testimonials--revealed'

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

export function init(container: HTMLElement): void {
  const root = container as TestimonialsContainer
  if (root.classList.contains(REVEALED)) return

  const abort = new AbortController()
  const { signal } = abort

  let swiper: InstanceType<typeof Swiper> | undefined
  let timeline: gsap.core.Timeline | null = null

  const autoplay = parseBool(container.dataset.testimonialsAutoplay, true)
  const autoplaySpeed = parseIntOrDefault(container.dataset.testimonialsAutoplaySpeed, 5, 2, 10)
  const showDots = parseBool(container.dataset.testimonialsShowDots, true)
  const showArrows = parseBool(container.dataset.testimonialsShowArrows, false)
  const effect = container.dataset.testimonialsEffect || 'fade'
  const slideCount = parseIntOrDefault(container.dataset.testimonialsCount, 1, 0, 12)
  const animateOnScroll = parseBool(container.dataset.testimonialsEntranceScroll, true)

  const swiperEl = container.querySelector<HTMLElement>('[data-testimonials-swiper]')
  const loadingEl = container.querySelector<HTMLElement>('[data-testimonials-loading]')
  const paginationEl = container.querySelector<HTMLElement>('[data-testimonials-pagination]')
  const prevEl = container.querySelector<HTMLElement>('[data-testimonials-arrow-prev]')
  const nextEl = container.querySelector<HTMLElement>('[data-testimonials-arrow-next]')

  const reduced = prefersReducedMotion()
  const designMode = isDesignMode()

  if (loadingEl && reduced) {
    loadingEl.remove()
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

    const swiperConfig: Record<string, unknown> = {
      modules,
      speed: reduced ? 0 : 400,
      loop: false,
      slidesPerView: 1,
      spaceBetween: 0,
      watchOverflow: true,
      keyboard: { enabled: true, onlyInViewport: true },
      ...navConfig,
    }

    if (showPagination) {
      swiperConfig.pagination = { el: paginationEl, clickable: true }
    }

    if (effect === 'fade') {
      swiperConfig.effect = 'fade'
      swiperConfig.fadeEffect = { crossFade: true }
    }

    if (autoplay && !reduced && slideCount > 1) {
      swiperConfig.autoplay = {
        delay: autoplaySpeed * 1000,
        pauseOnMouseEnter: true,
      }
    }

    swiper = new Swiper(swiperEl, swiperConfig)
  }

  const destroySwiper = (): void => {
    swiper?.destroy(true, true)
    swiper = undefined
  }

  const teardown = (): void => {
    timeline?.kill()
    timeline = null
    gsap.killTweensOf(container)
    if (loadingEl) gsap.killTweensOf(loadingEl)
    destroySwiper()
    container.classList.remove(REVEALED)
    abort.abort()
  }
  root.__testimonialsTeardown = teardown

  if (slideCount === 0) return

  const slides = container.querySelectorAll<HTMLElement>('.testimonials__slide')
  if (slides.length === 0) return

  gsap.set(slides, { autoAlpha: 0, y: reduced ? 0 : 12 })
  if (loadingEl && slideCount > 1 && !reduced) {
    gsap.set(loadingEl, { autoAlpha: 1 })
  }

  initSwiper()

  const runReveal = (): void => {
    if (reduced) {
      gsap.set(slides, { autoAlpha: 1, y: 0 })
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
      slides,
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
  const root = container as TestimonialsContainer
  root.__testimonialsTeardown?.()
  delete root.__testimonialsTeardown
}
