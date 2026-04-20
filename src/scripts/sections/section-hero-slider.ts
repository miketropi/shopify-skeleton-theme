import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Swiper from 'swiper'
import { Autoplay, EffectFade, Keyboard, Navigation, Pagination } from 'swiper/modules'

import { registerSection } from '../section-registry'

// import 'swiper/css'
// import 'swiper/css/effect-fade'
// import 'swiper/css/navigation'
// import 'swiper/css/pagination'

gsap.registerPlugin(ScrollTrigger)

const SECTION_TYPE = 'section-hero-slider'

type HeroContainer = HTMLElement & { __heroSliderTeardown?: () => void }

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getCopyTargets(copy: HTMLElement): Element[] {
  return Array.from(copy.children)
}

function setCopyHidden(copy: HTMLElement): void {
  const targets = getCopyTargets(copy)
  if (targets.length === 0) return
  gsap.set(targets, { opacity: 0, y: 20 })
}

function animateCopyIn(copy: HTMLElement, reduced: boolean): gsap.core.Tween {
  const targets = getCopyTargets(copy)
  if (targets.length === 0) {
    return gsap.to(copy, { duration: 0 })
  }
  return gsap.to(targets, {
    opacity: 1,
    y: 0,
    duration: reduced ? 0 : 0.55,
    ease: 'power2.out',
    stagger: reduced ? 0 : 0.07,
    overwrite: 'auto',
  })
}

function animateCopyOut(copy: HTMLElement, reduced: boolean): gsap.core.Tween {
  const targets = getCopyTargets(copy)
  if (targets.length === 0) {
    return gsap.to(copy, { duration: 0 })
  }
  return gsap.to(targets, {
    opacity: 0,
    y: -10,
    duration: reduced ? 0 : 0.28,
    ease: 'power2.in',
    stagger: reduced ? 0 : 0.04,
    overwrite: 'auto',
  })
}

function killCopyTweens(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>('[data-hero-copy]').forEach((copy) => {
    getCopyTargets(copy).forEach((el) => gsap.killTweensOf(el))
  })
}

export function init(container: HTMLElement): void {
  const root = container as HeroContainer
  const swiperEl = container.querySelector<HTMLElement>('[data-hero-swiper]')
  if (!swiperEl) return

  const slideEls = Array.from(swiperEl.querySelectorAll<HTMLElement>('.swiper-slide'))
  if (slideEls.length === 0) return

  const reduced = prefersReducedMotion()
  const autoplayOn = container.dataset.heroAutoplay === 'true'
  const autoplayDelay = Math.max(3000, parseInt(container.dataset.heroAutoplayDelay || '5000', 10) || 5000)

  slideEls.forEach((slide) => {
    const copy = slide.querySelector<HTMLElement>('[data-hero-copy]')
    if (copy) setCopyHidden(copy)
  })

  let swiper: InstanceType<typeof Swiper> | undefined
  let scrollSt: ScrollTrigger | undefined
  let introTween: gsap.core.Tween | null = null

  const runIntroForIndex = (index: number): void => {
    const slide = slideEls[index]
    const copy = slide?.querySelector<HTMLElement>('[data-hero-copy]')
    if (!copy) return
    introTween?.kill()
    introTween = animateCopyIn(copy, reduced)
  }

  const teardown = (): void => {
    introTween?.kill()
    introTween = null
    scrollSt?.kill()
    scrollSt = undefined
    swiper?.destroy(true, true)
    swiper = undefined
    killCopyTweens(container)
  }

  if (slideEls.length <= 1) {
    runIntroForIndex(0)
    root.__heroSliderTeardown = teardown
    return
  }

  const paginationEl = swiperEl.querySelector<HTMLElement>('[data-hero-pagination]')
  const prevEl = swiperEl.querySelector<HTMLElement>('[data-hero-prev]')
  const nextEl = swiperEl.querySelector<HTMLElement>('[data-hero-next]')

  swiper = new Swiper(swiperEl, {
    modules: [Autoplay, EffectFade, Keyboard, Navigation, Pagination],
    effect: 'fade',
    fadeEffect: { crossFade: true },
    speed: reduced ? 0 : 640,
    loop: false,
    watchOverflow: true,
    autoplay:
      autoplayOn && !reduced
        ? {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }
        : false,
    keyboard: { enabled: true, onlyInViewport: true },
    navigation:
      prevEl && nextEl
        ? {
            prevEl,
            nextEl,
          }
        : undefined,
    pagination: paginationEl
      ? {
          el: paginationEl,
          clickable: true,
        }
      : undefined,
    on: {
      slideChangeTransitionStart(s) {
        const prevSlide = slideEls[s.previousIndex]
        const prevCopy = prevSlide?.querySelector<HTMLElement>('[data-hero-copy]')
        if (prevCopy && s.previousIndex !== s.activeIndex) {
          animateCopyOut(prevCopy, reduced)
        }
      },
      slideChangeTransitionEnd(s) {
        const activeSlide = slideEls[s.activeIndex]
        const copy = activeSlide?.querySelector<HTMLElement>('[data-hero-copy]')
        if (copy) animateCopyIn(copy, reduced)
      },
    },
  })

  requestAnimationFrame(() => {
    runIntroForIndex(swiper?.activeIndex ?? 0)
  })

  scrollSt = ScrollTrigger.create({
    trigger: container,
    start: 'top bottom',
    end: 'bottom top',
    onLeave: () => {
      swiper?.autoplay?.stop()
    },
    onEnterBack: () => {
      if (autoplayOn && !reduced) swiper?.autoplay?.start()
    },
  })

  root.__heroSliderTeardown = teardown
}

export function destroy(container: HTMLElement): void {
  const root = container as HeroContainer
  root.__heroSliderTeardown?.()
  delete root.__heroSliderTeardown
}

export function registerSectionHeroSlider(): void {
  registerSection(SECTION_TYPE, init, destroy)
}
