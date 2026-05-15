import gsap from 'gsap'
import Swiper from 'swiper'
import { Keyboard, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { bindTcardHoverVideos } from '../tcard-hover-video'

type ProductSliderContainer = HTMLElement & {
  __productSliderTeardown?: () => void
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isDesignMode(): boolean {
  return Boolean((window as Window & { Shopify?: { designMode?: boolean } }).Shopify?.designMode)
}

function parsePerRow(s: string | undefined): number {
  const n = parseInt(s || '4', 10)
  if (n === 2 || n === 3 || n === 4) return n
  return 4
}

function whenWindowLoaded(): Promise<void> {
  if (document.readyState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    window.addEventListener('load', () => resolve(), { once: true })
  })
}

function whenImagesLoaded(scope: ParentNode): Promise<void> {
  const imgs = scope.querySelectorAll<HTMLImageElement>(
    '.product-slider__slide img, .product-slider__grid-item img',
  )
  const tasks = [...imgs].map(
    (img) =>
      new Promise<void>((resolve) => {
        if (img.complete && img.naturalWidth > 0) {
          resolve()
          return
        }
        img.addEventListener('load', () => resolve(), { once: true })
        img.addEventListener('error', () => resolve(), { once: true })
      }),
  )
  return Promise.all(tasks).then(() => {})
}

async function waitSlideReady(container: HTMLElement, designMode: boolean): Promise<void> {
  const maxMs = designMode ? 450 : 6000
  const deadline = new Promise<void>((resolve) => {
    setTimeout(resolve, maxMs)
  })

  const work = async (): Promise<void> => {
    if (!designMode) await whenWindowLoaded()
    await whenImagesLoaded(container)
    await new Promise<void>((r) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => r())
      })
    })
  }

  await Promise.race([work(), deadline])
}

/** First time the section crosses into the viewport (or theme editor: immediately). */
function waitForSectionVisible(
  el: HTMLElement,
  signal: AbortSignal,
  designMode: boolean,
): Promise<void> {
  if (designMode) return Promise.resolve()

  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    let settled = false
    let obs: IntersectionObserver

    const cleanup = (): void => {
      obs?.disconnect()
    }

    const finish = (): void => {
      if (settled) return
      settled = true
      signal.removeEventListener('abort', onAbort)
      cleanup()
      clearTimeout(fallbackTimer)
      resolve()
    }

    const onAbort = (): void => {
      if (settled) return
      settled = true
      signal.removeEventListener('abort', onAbort)
      cleanup()
      clearTimeout(fallbackTimer)
      reject(new DOMException('Aborted', 'AbortError'))
    }

    signal.addEventListener('abort', onAbort)

    const fallbackTimer = window.setTimeout(finish, 14000)

    obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            finish()
            return
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    )

    obs.observe(el)
  })
}

function revealSlides(
  container: HTMLElement,
  items: NodeListOf<HTMLElement>,
  loadingEl: HTMLElement | null,
  reduced: boolean,
): gsap.core.Timeline {
  if (reduced) {
    if (loadingEl) loadingEl.remove()
    gsap.set(items, { autoAlpha: 1, y: 0 })
    container.classList.add('product-slider--revealed')
    return gsap.timeline()
  }

  const tl = gsap.timeline({
    onComplete: () => {
      container.classList.add('product-slider--revealed')
      loadingEl?.remove()
    },
  })

  if (loadingEl) {
    tl.to(
      loadingEl,
      {
        autoAlpha: 0,
        duration: 0.42,
        ease: 'power2.out',
      },
      0,
    )
  }

  tl.to(
    items,
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.62,
      stagger: 0.068,
      ease: 'power2.out',
    },
    loadingEl ? 0.14 : 0,
  )

  return tl
}

export function init(container: HTMLElement): void {
  const root = container as ProductSliderContainer
  const abort = new AbortController()
  const { signal } = abort

  let swiper: InstanceType<typeof Swiper> | undefined
  let revealTimeline: gsap.core.Timeline | null = null

  const teardown = (): void => {
    revealTimeline?.kill()
    revealTimeline = null
    const items = container.querySelectorAll<HTMLElement>('.product-slider__slide, .product-slider__grid-item')
    gsap.killTweensOf(items)
    const loadingEl = container.querySelector<HTMLElement>('[data-product-slider-loading]')
    if (loadingEl) gsap.killTweensOf(loadingEl)
    swiper?.destroy(true, true)
    swiper = undefined
    container.classList.remove('product-slider--revealed')
    abort.abort()
  }
  root.__productSliderTeardown = teardown

  bindTcardHoverVideos(container, signal)

  const items = container.querySelectorAll<HTMLElement>('.product-slider__slide, .product-slider__grid-item')
  if (items.length === 0) return

  const loadingEl = container.querySelector<HTMLElement>('[data-product-slider-loading]')
  const reduced = prefersReducedMotion()
  const designMode = isDesignMode()
  const carouselEnabled = container.dataset.productSliderCarousel === 'true'
  const swiperEl = container.querySelector<HTMLElement>('[data-product-slider-swiper]')

  gsap.set(items, { autoAlpha: 0, y: reduced ? 0 : 20 })
  if (loadingEl && !reduced) gsap.set(loadingEl, { autoAlpha: 1 })

  if (carouselEnabled && swiperEl) {
    const gap = Math.max(0, parseInt(container.dataset.productSliderGap || '24', 10) || 24)
    const perRow = parsePerRow(container.dataset.productsPerRow)
    const showArrows = container.dataset.productSliderShowArrows === 'true'

    const slideEls = swiperEl.querySelectorAll<HTMLElement>('.swiper-slide')
    if (slideEls.length === 0) {
      container.classList.add('product-slider--revealed')
      gsap.set(items, { autoAlpha: 1, y: 0 })
      loadingEl?.remove()
      return
    }

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

  if (reduced) {
    revealTimeline = revealSlides(container, items, loadingEl, true)
    return
  }

  void Promise.all([
    waitSlideReady(container, designMode),
    waitForSectionVisible(container, signal, designMode),
  ])
    .catch(() => {})
    .then(() => {
      if (signal.aborted) return
      revealTimeline = revealSlides(container, items, loadingEl, false)
    })
}

export function destroy(container: HTMLElement): void {
  const root = container as ProductSliderContainer
  root.__productSliderTeardown?.()
  delete root.__productSliderTeardown
}
