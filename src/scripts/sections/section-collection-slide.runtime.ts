import gsap from 'gsap'
import Swiper from 'swiper'
import { Keyboard, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

type CollSlideContainer = HTMLElement & {
  __collSlideTeardown?: () => void
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isDesignMode(): boolean {
  return Boolean((window as Window & { Shopify?: { designMode?: boolean } }).Shopify?.designMode)
}

function parseCardsVisible(s: string | undefined): number {
  const n = parseFloat(s || '2.5')
  if (n === 2 || n === 2.5 || n === 3) return n
  return 2.5
}

function whenWindowLoaded(): Promise<void> {
  if (document.readyState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    window.addEventListener('load', () => resolve(), { once: true })
  })
}

async function waitSlideReady(container: HTMLElement, designMode: boolean): Promise<void> {
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

function revealSlides(
  container: HTMLElement,
  slides: NodeListOf<Element>,
  loadingEl: HTMLElement | null,
  reduced: boolean,
): gsap.core.Timeline {
  if (reduced) {
    if (loadingEl) loadingEl.remove()
    gsap.set(slides, { autoAlpha: 1, y: 0 })
    container.classList.add('coll-slide--revealed')
    return gsap.timeline()
  }

  const tl = gsap.timeline({
    onComplete: () => {
      container.classList.add('coll-slide--revealed')
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
    slides,
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.62,
      stagger: 0.06,
      ease: 'power2.out',
    },
    loadingEl ? 0.14 : 0,
  )

  return tl
}

export function init(container: HTMLElement): void {
  const root = container as CollSlideContainer
  const abort = new AbortController()
  const { signal } = abort

  let swiper: InstanceType<typeof Swiper> | undefined
  let revealTimeline: gsap.core.Timeline | null = null

  const teardown = (): void => {
    revealTimeline?.kill()
    revealTimeline = null
    const slides = container.querySelectorAll('.coll-slide__slide')
    gsap.killTweensOf(slides)
    const loadingEl = container.querySelector<HTMLElement>('[data-coll-slide-loading]')
    if (loadingEl) gsap.killTweensOf(loadingEl)
    swiper?.destroy(true, true)
    swiper = undefined
    container.classList.remove('coll-slide--revealed')
    abort.abort()
  }
  root.__collSlideTeardown = teardown

  const slideEls = container.querySelectorAll<HTMLElement>('.coll-slide__slide')
  if (slideEls.length === 0) return

  const loadingEl = container.querySelector<HTMLElement>('[data-coll-slide-loading]')
  const reduced = prefersReducedMotion()
  const designMode = isDesignMode()
  const swiperEl = container.querySelector<HTMLElement>('[data-coll-slide-swiper]')
  const animateOnScroll = container.dataset.collSlideEntranceScroll !== 'false'

  const gap = Math.max(0, parseInt(container.dataset.collSlideGap || '24', 10) || 24)
  const desktopSpv = parseCardsVisible(container.dataset.collSlideCards)
  const showArrows = container.dataset.collSlideShowArrows === 'true'

  gsap.set(slideEls, { autoAlpha: 0, y: reduced ? 0 : 16 })
  if (loadingEl && !reduced) gsap.set(loadingEl, { autoAlpha: 1 })

  const tabletSpv = Math.min(2, desktopSpv)

  if (swiperEl && slideEls.length > 0) {
    const prevEl = container.querySelector<HTMLElement>('[data-coll-slide-prev]')
    const nextEl = container.querySelector<HTMLElement>('[data-coll-slide-next]')

    const modules: (typeof Keyboard | typeof Navigation)[] = [Keyboard]
    if (showArrows && prevEl && nextEl && slideEls.length > 1) modules.push(Navigation)

    swiper = new Swiper(swiperEl, {
      modules,
      speed: reduced ? 0 : 420,
      watchOverflow: true,
      spaceBetween: gap, 
      slidesPerView: 1.2,
      breakpoints: {
        768: {
          slidesPerView: tabletSpv,
          spaceBetween: gap,
        },
        992: {
          slidesPerView: desktopSpv,
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

  if (reduced) {
    revealTimeline = revealSlides(container, slideEls, loadingEl, true)
    return
  }

  void Promise.all([
    waitSlideReady(container, designMode),
    animateOnScroll && !designMode ? waitForSectionVisible(container, signal, designMode) : Promise.resolve(),
  ])
    .catch(() => {})
    .then(() => {
      if (signal.aborted) return
      revealTimeline = revealSlides(container, slideEls, loadingEl, false)
      requestAnimationFrame(() => {
        swiper?.update?.()
      })
    })
}

export function destroy(container: HTMLElement): void {
  const root = container as CollSlideContainer
  root.__collSlideTeardown?.()
  delete root.__collSlideTeardown
}
