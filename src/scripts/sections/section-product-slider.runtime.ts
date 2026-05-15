import Swiper from 'swiper'
import { Keyboard, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { bindTcardHoverVideos } from '../tcard-hover-video'

type ProductSliderContainer = HTMLElement & { __productSliderTeardown?: () => void }

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function parsePerRow(s: string | undefined): number {
  const n = parseInt(s || '4', 10)
  if (n === 2 || n === 3 || n === 4) return n
  return 4
}

export function init(container: HTMLElement): void {
  const root = container as ProductSliderContainer
  const abort = new AbortController()
  const { signal } = abort

  let swiper: InstanceType<typeof Swiper> | undefined

  const teardown = (): void => {
    swiper?.destroy(true, true)
    swiper = undefined
    abort.abort()
  }
  root.__productSliderTeardown = teardown

  bindTcardHoverVideos(container, signal)

  const carouselEnabled = container.dataset.productSliderCarousel === 'true'
  const swiperEl = container.querySelector<HTMLElement>('[data-product-slider-swiper]')
  if (!carouselEnabled || !swiperEl) return

  const gap = Math.max(0, parseInt(container.dataset.productSliderGap || '24', 10) || 24)
  const perRow = parsePerRow(container.dataset.productsPerRow)
  const showArrows = container.dataset.productSliderShowArrows === 'true'
  const reduced = prefersReducedMotion()

  const slideEls = swiperEl.querySelectorAll<HTMLElement>('.swiper-slide')
  if (slideEls.length === 0) return

  const prevEl = container.querySelector<HTMLElement>('[data-product-slider-prev]')
  const nextEl = container.querySelector<HTMLElement>('[data-product-slider-next]')

  const modules = [Keyboard]
  if (showArrows && prevEl && nextEl) modules.push(Navigation)

  const tabletSlides = Math.min(3, perRow)

  swiper = new Swiper(swiperEl, {
    modules,
    speed: reduced ? 0 : 400,
    watchOverflow: true,
    spaceBetween: gap,
    slidesPerView: 1.25,
    breakpoints: {
      768: {
        slidesPerView: tabletSlides,
        spaceBetween: gap,
      },
      992: {
        slidesPerView: perRow,
        spaceBetween: gap,
      },
    },
    keyboard: { enabled: true, onlyInViewport: true },
    navigation:
      showArrows && prevEl && nextEl
        ? {
            prevEl,
            nextEl,
          }
        : undefined,
  })
}

export function destroy(container: HTMLElement): void {
  const root = container as ProductSliderContainer
  root.__productSliderTeardown?.()
  delete root.__productSliderTeardown
}
