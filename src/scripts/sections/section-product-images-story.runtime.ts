import gsap from 'gsap'
import Swiper from 'swiper'
import { Autoplay, EffectCards, EffectFade, Keyboard, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/effect-cards'
import 'swiper/css/effect-fade'
import 'swiper/css/pagination'
import { bindTcardHoverVideos } from '../tcard-hover-video'
import {
  createImageLightbox,
  lightboxItemsFromPisSlides,
  type ImageLightboxHandle,
} from '../image-lightbox'

type PisContainer = HTMLElement & { __pisTeardown?: () => void }

function readPisLightboxLabels(root: HTMLElement) {
  return {
    close: root.dataset.lightboxClose || 'Close',
    prev: root.dataset.lightboxPrev || 'Previous',
    next: root.dataset.lightboxNext || 'Next',
    dialog: root.dataset.lightboxDialog || 'Images',
    counterTemplate: root.dataset.lightboxCounter || '__CURRENT__ / __TOTAL__',
  }
}

const PIS_MOBILE_MAX_WIDTH = '(max-width: 767.98px)'

function pisFillModeWantsAutoHeight(container: HTMLElement): boolean {
  return (
    !container.classList.contains('pis--slideshow-aspect') &&
    window.matchMedia(PIS_MOBILE_MAX_WIDTH).matches
  )
}

function formatPisFractionAria(template: string, current: number, total: number): string {
  return template.replace(/__CURRENT__/g, String(current)).replace(/__TOTAL__/g, String(total))
}

function syncPisSlideFraction(container: HTMLElement, swiper: Swiper): void {
  const fracRoot = container.querySelector<HTMLElement>('[data-pis-fraction]')
  const currentEl = container.querySelector<HTMLElement>('[data-pis-fraction-current]')
  if (!fracRoot || !currentEl) return

  const total = swiper.slides.length
  const current = swiper.activeIndex + 1
  currentEl.textContent = String(current)

  const tpl = container.dataset.pisFractionAria?.trim()
  if (tpl) {
    fracRoot.setAttribute('aria-label', formatPisFractionAria(tpl, current, total))
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isDesignMode(): boolean {
  return Boolean((window as Window & { Shopify?: { designMode?: boolean } }).Shopify?.designMode)
}

function whenWindowLoaded(): Promise<void> {
  if (document.readyState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    window.addEventListener('load', () => resolve(), { once: true })
  })
}

async function waitSlideReady(_container: HTMLElement, designMode: boolean): Promise<void> {
  const maxMs = designMode ? 450 : 6000
  const deadline = new Promise<void>((resolve) => {
    setTimeout(resolve, maxMs)
  })

  const work = async (): Promise<void> => {
    if (!designMode) await whenWindowLoaded()
    await new Promise<void>((r) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => r())
      })
    })
  }

  await Promise.race([work(), deadline])
}

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
      window.clearTimeout(fallbackTimer)
      resolve()
    }

    const onAbort = (): void => {
      if (settled) return
      settled = true
      signal.removeEventListener('abort', onAbort)
      cleanup()
      window.clearTimeout(fallbackTimer)
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

function revealPis(
  container: HTMLElement,
  cols: HTMLElement[],
  loadingEl: HTMLElement | null,
  reduced: boolean,
): gsap.core.Timeline {
  if (reduced) {
    loadingEl?.remove()
    gsap.set(cols, { autoAlpha: 1, y: 0 })
    container.classList.add('pis--revealed')
    return gsap.timeline()
  }

  const tl = gsap.timeline({
    onComplete: () => {
      container.classList.add('pis--revealed')
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
    cols,
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.62,
      stagger: 0.1,
      ease: 'power2.out',
    },
    loadingEl ? 0.14 : 0,
  )

  return tl
}

export function init(container: HTMLElement): void {
  const root = container as PisContainer
  const abort = new AbortController()
  const { signal } = abort
  let swiper: InstanceType<typeof Swiper> | undefined
  let storyLightbox: ImageLightboxHandle | null = null
  let revealTimeline: gsap.core.Timeline | null = null

  bindTcardHoverVideos(container, signal)

  const cols = Array.from(container.querySelectorAll<HTMLElement>('[data-pis-reveal-col]'))
  const loadingEl = container.querySelector<HTMLElement>('[data-pis-loading]')
  const swiperEl = container.querySelector<HTMLElement>('[data-pis-swiper]')

  let autoHeightMqCleanup: (() => void) | null = null

  const teardown = (): void => {
    autoHeightMqCleanup?.()
    autoHeightMqCleanup = null
    revealTimeline?.kill()
    revealTimeline = null
    const killTargets = [...cols]
    if (loadingEl) killTargets.push(loadingEl)
    gsap.killTweensOf(killTargets)
    storyLightbox?.destroy()
    storyLightbox = null
    swiper?.destroy(true, true)
    swiper = undefined
    container.classList.remove('pis--revealed')
    abort.abort()
  }
  root.__pisTeardown = teardown

  if (cols.length === 0) {
    container.classList.add('pis--revealed')
    return
  }

  const reduced = prefersReducedMotion()
  const designMode = isDesignMode()
  const animateOnScroll = container.dataset.pisEntranceScroll !== 'false'

  const mountStoryLightbox = (): void => {
    if (!swiperEl || !swiperEl.querySelector('[data-pis-lightbox-img]')) return

    storyLightbox = createImageLightbox({
      getItems: () => lightboxItemsFromPisSlides(swiperEl),
      labels: readPisLightboxLabels(container),
      reducedMotion: reduced,
    })

    const openFrom = (target: Element): void => {
      const img =
        target instanceof HTMLImageElement && target.hasAttribute('data-pis-lightbox-img')
          ? target
          : target.querySelector<HTMLImageElement>('[data-pis-lightbox-img]')
      if (!img || !swiperEl.contains(img)) return
      const imgs = [...swiperEl.querySelectorAll<HTMLImageElement>('[data-pis-lightbox-img]')]
      const idx = imgs.indexOf(img)
      if (idx >= 0) storyLightbox?.open(idx)
    }

    swiperEl.addEventListener(
      'click',
      (e) => {
        const t = e.target
        if (!(t instanceof Element)) return
        if (t.closest('.swiper-pagination, .pis__pagination')) return
        const img = t.closest<HTMLImageElement>('[data-pis-lightbox-img]')
        const fig = t.closest('.pis__slide-zoomable')
        if (img) openFrom(img)
        else if (fig) openFrom(fig)
      },
      { signal },
    )

    swiperEl.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        const t = e.target
        if (!(t instanceof Element)) return
        const fig = t.closest('.pis__slide-zoomable')
        if (!fig || !swiperEl.contains(fig)) return
        e.preventDefault()
        openFrom(fig)
      },
      { signal },
    )
  }

  const slideEls = swiperEl ? swiperEl.querySelectorAll<HTMLElement>('.swiper-slide') : []

  if (!reduced) {
    gsap.set(cols, { autoAlpha: 0, y: 20 })
    if (loadingEl) gsap.set(loadingEl, { autoAlpha: 1 })
  }

  const mountSwiper = (): void => {
    if (!swiperEl || slideEls.length <= 1) return

    autoHeightMqCleanup?.()
    autoHeightMqCleanup = null

    const autoplayOn = container.dataset.pisAutoplay === 'true' && !reduced
    const delay = Math.max(2000, parseInt(container.dataset.pisAutoplayDelay || '4000', 10) || 4000)
    const effectMode = (container.dataset.pisEffect || 'cards').toLowerCase()
    const wantsCards = effectMode === 'cards'
    const useCards = wantsCards && !reduced
    const useFade = effectMode === 'fade' || (wantsCards && reduced)
    const paginationEl = container.querySelector<HTMLElement>('[data-pis-pagination]')

    const modules: (
      | typeof Autoplay
      | typeof EffectCards
      | typeof EffectFade
      | typeof Keyboard
      | typeof Pagination
    )[] = [Keyboard]

    if (paginationEl) modules.push(Pagination)
    if (useFade) modules.push(EffectFade)
    if (useCards) modules.push(EffectCards)
    modules.push(Autoplay)

    const speed = reduced ? 0 : useFade ? 520 : useCards ? 500 : 480
    const autoHeight = pisFillModeWantsAutoHeight(container)

    swiper = new Swiper(swiperEl, {
      modules,
      speed,
      loop: false,
      watchOverflow: true,
      slidesPerView: 1,
      // centeredSlides: true,
      spaceBetween: 24,
      autoHeight,
      autoplay:
        autoplayOn
          ? {
              delay,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }
          : false,
      keyboard: { enabled: true, onlyInViewport: true },
      pagination: paginationEl
        ? {
            el: paginationEl,
            clickable: true,
          }
        : undefined,
      ...(useCards
        ? {
            effect: 'cards' as const,
            grabCursor: true,
            cardsEffect: {
              slideShadows: true,
              rotate: true,
              perSlideRotate: 2,
              perSlideOffset: 8,
            },
          }
        : useFade
          ? { effect: 'fade' as const, fadeEffect: { crossFade: true } }
          : { effect: 'slide' as const }),
      on: {
        init(sw) {
          syncPisSlideFraction(container, sw)
        },
        slideChange(sw) {
          syncPisSlideFraction(container, sw)
        },
      },
    })

    if (!container.classList.contains('pis--slideshow-aspect')) {
      const mq = window.matchMedia(PIS_MOBILE_MAX_WIDTH)
      const onBp = (): void => {
        if (!swiper) return
        const next = mq.matches
        if (Boolean(swiper.params.autoHeight) !== next) {
          swiper.params.autoHeight = next
          swiper.update()
        }
      }
      mq.addEventListener('change', onBp)
      autoHeightMqCleanup = (): void => {
        mq.removeEventListener('change', onBp)
      }
    }
  }

  if (reduced) {
    mountSwiper()
    mountStoryLightbox()
    revealTimeline = revealPis(container, cols, loadingEl, true)
    return
  }

  void Promise.all([
    waitSlideReady(container, designMode),
    animateOnScroll && !designMode
      ? waitForSectionVisible(container, signal, designMode)
      : Promise.resolve(),
  ])
    .catch(() => {})
    .then(() => {
      if (signal.aborted) return
      mountSwiper()
      mountStoryLightbox()
      revealTimeline = revealPis(container, cols, loadingEl, false)
      requestAnimationFrame(() => {
        swiper?.update?.()
      })
    })
}

export function destroy(container: HTMLElement): void {
  const root = container as PisContainer
  root.__pisTeardown?.()
  delete root.__pisTeardown
}
