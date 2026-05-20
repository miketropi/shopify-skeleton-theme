import Swiper from 'swiper'
import { Keyboard, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import gsap from 'gsap'
import {
  isDesignMode,
  prefersReducedMotion,
  revealStaggeredSlides,
  waitForSectionVisible,
  waitSlideReady,
} from '../lib/carousel-section-entrance'

type PromoCardsContainer = HTMLElement & {
  __promoCardsTeardown?: () => void
}

const REVEALED = 'promo-cards--revealed'

function parseCols(s: string | undefined, fallback: number): number {
  const n = parseInt(s || String(fallback), 10)
  if (n === 2 || n === 3 || n === 4) return n
  return fallback
}

export function init(container: HTMLElement): void {
  const root = container as PromoCardsContainer
  const abort = new AbortController()
  const { signal } = abort

  let swiper: InstanceType<typeof Swiper> | undefined
  let revealTimeline: gsap.core.Timeline | null = null

  const teardown = (): void => {
    revealTimeline?.kill()
    revealTimeline = null
    const slides = container.querySelectorAll('.promo-cards__slide-target')
    gsap.killTweensOf(slides)
    const loadingEl = container.querySelector<HTMLElement>('[data-promo-cards-loading]')
    if (loadingEl) gsap.killTweensOf(loadingEl)
    swiper?.destroy(true, true)
    swiper = undefined
    container.classList.remove(REVEALED)
    abort.abort()
  }
  root.__promoCardsTeardown = teardown

  const slideEls = container.querySelectorAll<HTMLElement>('.promo-cards__slide-target')
  if (slideEls.length === 0) return

  const loadingEl = container.querySelector<HTMLElement>('[data-promo-cards-loading]')
  const reduced = prefersReducedMotion()
  const designMode = isDesignMode()
  const layout = container.dataset.promoCardsLayout || 'grid'
  const isCarousel = layout === 'carousel'
  const swiperEl = isCarousel ? container.querySelector<HTMLElement>('[data-promo-cards-swiper]') : null
  const animateOnScroll = container.dataset.promoCardsEntranceScroll !== 'false'

  const gap = Math.max(0, parseInt(container.dataset.promoCardsGap || '20', 10) || 20)
  const gapMobile = Math.max(0, parseInt(container.dataset.promoCardsGapMobile || '12', 10) || 12)
  const colsDesktop = parseCols(container.dataset.promoCardsColumns, 3)
  const colsTablet = parseCols(container.dataset.promoCardsColumnsTablet, Math.min(2, colsDesktop))
  const showArrows = container.dataset.promoCardsShowArrows === 'true'

  gsap.set(slideEls, { autoAlpha: 0, y: reduced ? 0 : 16 })
  if (loadingEl && isCarousel && !reduced) gsap.set(loadingEl, { autoAlpha: 1 })

  if (swiperEl && slideEls.length > 0) {
    const prevEl = container.querySelector<HTMLElement>('[data-promo-cards-prev]')
    const nextEl = container.querySelector<HTMLElement>('[data-promo-cards-next]')

    const modules: (typeof Keyboard | typeof Navigation)[] = [Keyboard]
    if (showArrows && prevEl && nextEl && slideEls.length > 1) modules.push(Navigation)

    swiper = new Swiper(swiperEl, {
      modules,
      speed: reduced ? 0 : 420,
      watchOverflow: true,
      spaceBetween: gapMobile,
      slidesPerView: 1.15,
      breakpoints: {
        768: {
          slidesPerView: colsTablet,
          spaceBetween: gap,
        },
        992: {
          slidesPerView: colsDesktop,
          spaceBetween: gap,
        },
      },
      keyboard: { enabled: true, onlyInViewport: true },
      navigation:
        showArrows && prevEl && nextEl && slideEls.length > 1
          ? {
              prevEl,
              nextEl,
            }
          : undefined,
    })
  }

  const runReveal = (useLoading: boolean): void => {
    revealTimeline = revealStaggeredSlides({
      container,
      slides: slideEls,
      loadingEl: useLoading ? loadingEl : null,
      reduced,
      revealedClass: REVEALED,
    })
  }

  if (reduced) {
    runReveal(isCarousel)
    return
  }

  void Promise.all([
    waitSlideReady(container, designMode),
    animateOnScroll && !designMode ? waitForSectionVisible(container, signal, designMode) : Promise.resolve(),
  ])
    .catch(() => {})
    .then(() => {
      if (signal.aborted) return
      runReveal(isCarousel)
      requestAnimationFrame(() => {
        swiper?.update?.()
      })
    })
}

export function destroy(container: HTMLElement): void {
  const root = container as PromoCardsContainer
  root.__promoCardsTeardown?.()
  delete root.__promoCardsTeardown
}
