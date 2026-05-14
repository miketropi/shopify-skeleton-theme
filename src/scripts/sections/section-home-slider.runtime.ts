import gsap from 'gsap'
import Swiper from 'swiper'
import { Autoplay, EffectFade, Keyboard, Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/effect-fade'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

type HomeSliderContainer = HTMLElement & { __homeSliderTeardown?: () => void }

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getCopyTargets(copy: HTMLElement): Element[] {
  return Array.from(copy.children)
}

function setCopyHidden(copy: HTMLElement): void {
  const targets = getCopyTargets(copy)
  if (targets.length === 0) return
  gsap.set(targets, { opacity: 0, y: 16, scale: 0.98 })
}

function animateCopyIn(copy: HTMLElement, reduced: boolean): gsap.core.Tween {
  const targets = getCopyTargets(copy)
  if (targets.length === 0) {
    return gsap.to(copy, { duration: 0 })
  }
  return gsap.to(targets, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: reduced ? 0 : 0.72,
    ease: reduced ? 'none' : 'power3.out',
    stagger: reduced ? 0 : 0.09,
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
    y: -8,
    duration: reduced ? 0 : 0.34,
    ease: reduced ? 'none' : 'power2.in',
    stagger: reduced ? 0 : 0.045,
    overwrite: 'auto',
  })
}

function killCopyTweens(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>('[data-home-copy]').forEach((copy) => {
    getCopyTargets(copy).forEach((el) => gsap.killTweensOf(el))
  })
}

export function init(container: HTMLElement): void {
  const root = container as HomeSliderContainer
  const swiperEl = container.querySelector<HTMLElement>('[data-home-slider-swiper]')
  if (!swiperEl) return

  const slideEls = Array.from(swiperEl.querySelectorAll<HTMLElement>('.swiper-slide'))
  if (slideEls.length === 0) return

  const reduced = prefersReducedMotion()
  const autoplayOn = container.dataset.homeAutoplay === 'true'
  const autoplayPauseOnHover = container.dataset.homeAutoplayPauseHover !== 'false'
  const autoplayDelay = Math.max(3000, parseInt(container.dataset.homeAutoplayDelay || '5000', 10) || 5000)
  const useFade = container.dataset.homeSliderEffect === 'fade'
  const centeredAuto = container.dataset.homeCenteredAuto === 'true'
  const effectiveFade = useFade && !centeredAuto

  const rawInitial = parseInt(container.dataset.homeInitialSlide ?? '0', 10)
  const initialSlide = Math.max(
    0,
    Math.min(slideEls.length - 1, Number.isFinite(rawInitial) ? rawInitial : 0),
  )

  slideEls.forEach((slide) => {
    const copy = slide.querySelector<HTMLElement>('[data-home-copy]')
    if (copy) setCopyHidden(copy)
  })

  let swiper: InstanceType<typeof Swiper> | undefined
  let introTween: gsap.core.Tween | null = null

  const runIntroForIndex = (index: number): void => {
    const slide = slideEls[index]
    const copy = slide?.querySelector<HTMLElement>('[data-home-copy]')
    if (!copy) return
    introTween?.kill()
    introTween = animateCopyIn(copy, reduced)
  }

  const teardown = (): void => {
    introTween?.kill()
    introTween = null
    container.classList.remove('section-home-slider--swiper-mounted')
    swiper?.destroy(true, true)
    swiper = undefined
    killCopyTweens(container)
  }

  if (slideEls.length <= 1) {
    container.classList.add('section-home-slider--swiper-mounted')
    requestAnimationFrame(() => {
      runIntroForIndex(0)
    })
    root.__homeSliderTeardown = teardown
    return
  }

  const paginationEl = swiperEl.querySelector<HTMLElement>('[data-home-pagination]')
  const prevEl = swiperEl.querySelector<HTMLElement>('[data-home-prev]')
  const nextEl = swiperEl.querySelector<HTMLElement>('[data-home-next]')

  const modules = [Autoplay, Keyboard]
  if (paginationEl) modules.push(Pagination)
  if (prevEl && nextEl) modules.push(Navigation)
  if (effectiveFade) modules.push(EffectFade)

  const swiperParams = {
    modules,
    initialSlide,
    speed: reduced ? 0 : effectiveFade ? 520 : 480,
    loop: false,
    watchOverflow: true,
    slidesPerView: centeredAuto ? ('auto' as const) : 1,
    centeredSlides: centeredAuto,
    // centeredSlidesBounds: centeredAuto,
    spaceBetween: centeredAuto ? 24 : 0,
    autoplay:
      autoplayOn && !reduced
        ? {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: autoplayPauseOnHover,
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
    ...(effectiveFade
      ? { effect: 'fade' as const, fadeEffect: { crossFade: true } }
      : { effect: 'slide' as const }),
    on: {
      slideChangeTransitionStart(swiperInstance: InstanceType<typeof Swiper>) {
        const prevSlide = slideEls[swiperInstance.previousIndex]
        const prevCopy = prevSlide?.querySelector<HTMLElement>('[data-home-copy]')
        if (prevCopy && swiperInstance.previousIndex !== swiperInstance.activeIndex) {
          animateCopyOut(prevCopy, reduced)
        }
      },
      slideChangeTransitionEnd(swiperInstance: InstanceType<typeof Swiper>) {
        const activeSlide = slideEls[swiperInstance.activeIndex]
        const copy = activeSlide?.querySelector<HTMLElement>('[data-home-copy]')
        if (copy) animateCopyIn(copy, reduced)
      },
    },
  }

  swiper = new Swiper(swiperEl, swiperParams)

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container.classList.add('section-home-slider--swiper-mounted')
      runIntroForIndex(swiper?.activeIndex ?? initialSlide)
    })
  })

  root.__homeSliderTeardown = teardown
}

export function destroy(container: HTMLElement): void {
  const root = container as HomeSliderContainer
  root.__homeSliderTeardown?.()
  delete root.__homeSliderTeardown
}
