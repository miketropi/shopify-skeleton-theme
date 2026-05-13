import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Swiper from 'swiper'
import { Autoplay, EffectFade, Keyboard, Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/effect-fade'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

gsap.registerPlugin(ScrollTrigger)

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

function padSlideIndex(index: number, total: number): string {
  const width = Math.max(2, String(total).length)
  return String(index).padStart(width, '0')
}

function pauseHeroVideos(root: HTMLElement): void {
  root.querySelectorAll<HTMLVideoElement>('video.hero-slide__video').forEach((v) => {
    v.pause()
  })
}

function playHeroVideosInSlide(slide: HTMLElement | undefined): void {
  if (!slide) return
  slide.querySelectorAll<HTMLVideoElement>('video.hero-slide__video').forEach((v) => {
    void v.play().catch(() => {})
  })
}

function updateSlideFraction(root: HTMLElement, activeIndex: number, totalSlides: number): void {
  const currentEl = root.querySelector<HTMLElement>('[data-hero-current]')
  const totalEl = root.querySelector<HTMLElement>('[data-hero-total]')
  const fractionEl = root.querySelector<HTMLElement>('[data-hero-fraction]')
  const cur = activeIndex + 1
  if (currentEl) currentEl.textContent = padSlideIndex(cur, totalSlides)
  if (totalEl) totalEl.textContent = padSlideIndex(totalSlides, totalSlides)
  if (fractionEl) {
    fractionEl.setAttribute('aria-label', `${cur} / ${totalSlides}`)
  }
}

/** Slide blocks ship `--cs-*` (and optional `--hero-ov-*`) on each `.swiper-slide`; chrome sits outside slides, so copy only those tokens onto the mid pill (never copy layout from slide `style`). */
function syncChromeMidFromActiveSlide(root: HTMLElement, slide: HTMLElement | undefined): void {
  const mid = root.querySelector<HTMLElement>('[data-hero-chrome-mid]')
  if (!mid) return
  const raw = slide?.getAttribute('style')?.trim()
  if (!raw) {
    mid.removeAttribute('style')
    return
  }
  const tokens = raw
    .split(';')
    .map((s) => s.trim())
    .filter((s) => /^--[-\w]+\s*:/.test(s))
  if (tokens.length === 0) {
    mid.removeAttribute('style')
    return
  }
  mid.setAttribute('style', `${tokens.join('; ')};`)
}

function resetChromeMidScheme(container: HTMLElement): void {
  container.querySelector<HTMLElement>('[data-hero-chrome-mid]')?.removeAttribute('style')
}

function setupHeroParallax(root: HTMLElement, reduced: boolean): () => void {
  if (reduced || root.dataset.heroParallax === 'false') {
    return () => {}
  }
  const raw = parseFloat(root.dataset.heroParallaxIntensity || '12')
  const intensity = Number.isFinite(raw) ? Math.min(22, Math.max(4, raw)) : 12
  const els = root.querySelectorAll<HTMLElement>('[data-hero-parallax]')
  if (els.length === 0) {
    return () => {}
  }

  const mm = gsap.matchMedia()
  mm.add('(min-width: 768px)', () => {
    const half = intensity / 2
    els.forEach((el) => {
      gsap.fromTo(
        el,
        { yPercent: -half },
        {
          yPercent: half,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5,
          },
        }
      )
    })
  })

  return () => {
    mm.revert()
  }
}

export function init(container: HTMLElement): void {
  const root = container as HeroContainer
  const swiperEl = container.querySelector<HTMLElement>('[data-hero-swiper]')
  if (!swiperEl) return

  const slideEls = Array.from(swiperEl.querySelectorAll<HTMLElement>('.swiper-slide'))
  if (slideEls.length === 0) return

  const reduced = prefersReducedMotion()
  const parallaxCleanup = setupHeroParallax(root, reduced)
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
    parallaxCleanup()
    introTween?.kill()
    introTween = null
    scrollSt?.kill()
    scrollSt = undefined
    swiper?.destroy(true, true)
    swiper = undefined
    killCopyTweens(container)
    resetChromeMidScheme(root)
    pauseHeroVideos(root)
  }

  if (slideEls.length <= 1) {
    runIntroForIndex(0)
    syncChromeMidFromActiveSlide(root, slideEls[0])
    pauseHeroVideos(root)
    if (!reduced) {
      playHeroVideosInSlide(slideEls[0])
      scrollSt = ScrollTrigger.create({
        trigger: container,
        start: 'top bottom',
        end: 'bottom top',
        onLeave: () => {
          pauseHeroVideos(root)
        },
        onEnterBack: () => {
          if (!reduced) playHeroVideosInSlide(slideEls[0])
        },
      })
    }
    root.__heroSliderTeardown = teardown
    return
  }

  const paginationEl = swiperEl.querySelector<HTMLElement>('[data-hero-pagination]')
  const prevEl = swiperEl.querySelector<HTMLElement>('[data-hero-prev]')
  const nextEl = swiperEl.querySelector<HTMLElement>('[data-hero-next]')

  const totalSlides = slideEls.length

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
      init(s) {
        updateSlideFraction(root, s.activeIndex, totalSlides)
        syncChromeMidFromActiveSlide(root, slideEls[s.activeIndex])
      },
      slideChange(s) {
        updateSlideFraction(root, s.activeIndex, totalSlides)
        syncChromeMidFromActiveSlide(root, slideEls[s.activeIndex])
      },
      slideChangeTransitionStart(s) {
        const prevSlide = slideEls[s.previousIndex]
        const prevCopy = prevSlide?.querySelector<HTMLElement>('[data-hero-copy]')
        if (prevSlide && s.previousIndex !== s.activeIndex) {
          prevSlide.querySelectorAll<HTMLVideoElement>('video.hero-slide__video').forEach((v) => v.pause())
        }
        if (prevCopy && s.previousIndex !== s.activeIndex) {
          animateCopyOut(prevCopy, reduced)
        }
      },
      slideChangeTransitionEnd(s) {
        const activeSlide = slideEls[s.activeIndex]
        const copy = activeSlide?.querySelector<HTMLElement>('[data-hero-copy]')
        if (copy) animateCopyIn(copy, reduced)
        pauseHeroVideos(root)
        if (!reduced) playHeroVideosInSlide(activeSlide)
      },
    },
  })

  requestAnimationFrame(() => {
    runIntroForIndex(swiper?.activeIndex ?? 0)
  })

  pauseHeroVideos(root)
  if (!reduced) {
    playHeroVideosInSlide(slideEls[swiper?.activeIndex ?? 0])
  }

  scrollSt = ScrollTrigger.create({
    trigger: container,
    start: 'top bottom',
    end: 'bottom top',
    onLeave: () => {
      swiper?.autoplay?.stop()
      pauseHeroVideos(root)
    },
    onEnterBack: () => {
      if (autoplayOn && !reduced) swiper?.autoplay?.start()
      if (!reduced) {
        const idx = swiper?.activeIndex ?? 0
        playHeroVideosInSlide(slideEls[idx])
      }
    },
  })

  root.__heroSliderTeardown = teardown
}

export function destroy(container: HTMLElement): void {
  const root = container as HeroContainer
  root.__heroSliderTeardown?.()
  delete root.__heroSliderTeardown
}
