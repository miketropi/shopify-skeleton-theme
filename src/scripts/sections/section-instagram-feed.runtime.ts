import Swiper from 'swiper'
import { Autoplay, Keyboard, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import gsap from 'gsap'
import { ThemeModal } from '../theme-modal'
import {
  isDesignMode,
  prefersReducedMotion,
  revealStaggeredSlides,
  waitForSectionVisible,
  waitSlideReady,
} from '../lib/carousel-section-entrance'

type InstagramFeedContainer = HTMLElement & {
  __instagramFeedTeardown?: () => void
}

type FeedItemData = {
  el: HTMLElement
  index: number
  mediaType: 'image' | 'video'
  imageSrc: string
  imageAlt: string
  videoSrc: string
  poster: string
  description: string
  viewUrl: string
  viewLabel: string
}

const REVEALED = 'instagram-feed--revealed'
const MD_MQ = '(min-width: 48em)'
const LG_MQ = '(min-width: 62em)'

function parseIntAttr(el: HTMLElement, key: string, fallback: number): number {
  const n = parseInt(el.dataset[key] || String(fallback), 10)
  return Number.isFinite(n) ? n : fallback
}

function metaDataAttr(meta: Element | null, name: string): string {
  return meta?.querySelector(`[data-${name}]`)?.getAttribute(`data-${name}`) || ''
}

function collectItems(container: HTMLElement): FeedItemData[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-instagram-feed-item]')).map(
    (el, index) => {
      const meta = el.querySelector('.instagram-feed__item-meta')
      const cardVideo = el.querySelector<HTMLVideoElement>('.instagram-feed__card-video')
      const cardSource = cardVideo?.querySelector('source')

      const mediaTypeRaw =
        metaDataAttr(meta, 'instagram-feed-media-type') ||
        (cardVideo ? 'video' : 'image')

      const videoSrc =
        metaDataAttr(meta, 'instagram-feed-video-src') ||
        cardSource?.getAttribute('src') ||
        cardVideo?.currentSrc ||
        ''

      return {
        el,
        index,
        mediaType: mediaTypeRaw === 'video' ? 'video' : 'image',
        imageSrc: metaDataAttr(meta, 'instagram-feed-image-src'),
        imageAlt: metaDataAttr(meta, 'instagram-feed-image-alt'),
        videoSrc,
        poster: metaDataAttr(meta, 'instagram-feed-poster'),
        description:
          meta?.querySelector('[data-instagram-feed-description]')?.textContent?.trim() || '',
        viewUrl: metaDataAttr(meta, 'instagram-feed-view-url'),
        viewLabel:
          metaDataAttr(meta, 'instagram-feed-view-label') || 'View on Instagram',
      }
    },
  )
}

function getGridColumns(container: HTMLElement): number {
  if (window.matchMedia(LG_MQ).matches) {
    return parseIntAttr(container, 'instagramFeedGridCols', 4)
  }
  if (window.matchMedia(MD_MQ).matches) {
    return Math.min(parseIntAttr(container, 'instagramFeedGridCols', 4), 3)
  }
  return 2
}

function pauseCardVideos(container: HTMLElement): void {
  container.querySelectorAll<HTMLVideoElement>('.instagram-feed__card-video').forEach((v) => {
    v.pause()
  })
}

function resumeVisibleCardVideos(container: HTMLElement): void {
  container.querySelectorAll<HTMLVideoElement>('.instagram-feed__card-video').forEach((v) => {
    const item = v.closest('[data-instagram-feed-item]')
    if (item && !item.classList.contains('instagram-feed__item--hidden')) {
      void v.play().catch(() => {})
    }
  })
}

export function init(container: HTMLElement): void {
  const root = container as InstagramFeedContainer
  const abort = new AbortController()
  const { signal } = abort

  let swiper: InstanceType<typeof Swiper> | undefined
  let revealTimeline: gsap.core.Timeline | null = null
  let modal: ThemeModal | null = null
  let modalIndex = 0
  let modalStepping = false
  let items: FeedItemData[] = []

  const displayMode = container.dataset.instagramFeedDisplayMode || 'grid'
  const isCarousel = displayMode === 'carousel'
  const itemCount = parseIntAttr(container, 'instagramFeedCount', 0)
  const loadingEl = container.querySelector<HTMLElement>('[data-instagram-feed-loading]')
  const swiperEl = container.querySelector<HTMLElement>('[data-instagram-feed-swiper]')
  const reduced = prefersReducedMotion()
  const designMode = isDesignMode()
  const animateOnScroll = container.dataset.instagramFeedEntranceScroll !== 'false'
  const gap = Math.max(0, parseIntAttr(container, 'instagramFeedGap', 8))
  const carouselCols = parseIntAttr(container, 'instagramFeedCarouselCols', 4)
  const showArrows = container.dataset.instagramFeedShowArrows === 'true'
  const autoplayOn = container.dataset.instagramFeedAutoplay === 'true' && !reduced
  const autoplaySec = Math.max(2, parseIntAttr(container, 'instagramFeedAutoplaySpeed', 4))

  const modalRoot = container.querySelector<HTMLElement>('.instagram-feed__modal')
  const modalMedia = container.querySelector<HTMLElement>('[data-instagram-feed-modal-media]')
  const modalDescription = container.querySelector<HTMLElement>(
    '[data-instagram-feed-modal-description]',
  )
  const modalLink = container.querySelector<HTMLAnchorElement>('[data-instagram-feed-modal-link]')
  const modalPrev = container.querySelector<HTMLElement>('[data-instagram-feed-modal-prev]')
  const modalNext = container.querySelector<HTMLElement>('[data-instagram-feed-modal-next]')

  const destroySwiper = (): void => {
    swiper?.destroy(true, true)
    swiper = undefined
  }

  const initSwiper = (): void => {
    if (!isCarousel || !swiperEl || itemCount === 0) return

    if (swiper) {
      swiper.update()
      return
    }

    const prevEl = container.querySelector<HTMLElement>('[data-instagram-feed-prev]')
    const nextEl = container.querySelector<HTMLElement>('[data-instagram-feed-next]')
    const modules: (typeof Keyboard | typeof Navigation | typeof Autoplay)[] = [Keyboard]
    if (showArrows && prevEl && nextEl && itemCount > 1) modules.push(Navigation)
    if (autoplayOn && itemCount > 1) modules.push(Autoplay)

    swiper = new Swiper(swiperEl, {
      modules,
      speed: reduced ? 0 : 420,
      watchOverflow: true,
      spaceBetween: gap,
      slidesPerView: 1.2,
      breakpoints: {
        768: {
          slidesPerView: Math.min(itemCount, 2),
          spaceBetween: gap,
        },
        992: {
          slidesPerView: Math.min(itemCount, carouselCols),
          spaceBetween: gap,
        },
      },
      keyboard: { enabled: true, onlyInViewport: true },
      navigation:
        showArrows && prevEl && nextEl && itemCount > 1
          ? { prevEl, nextEl }
          : undefined,
      autoplay: autoplayOn
        ? {
            delay: autoplaySec * 1000,
            disableOnInteraction: true,
            pauseOnMouseEnter: true,
          }
        : undefined,
    })
  }

  const renderModalMedia = (item: FeedItemData, autoplay = !reduced): void => {
    if (!modalMedia) return
    modalMedia.innerHTML = ''

    if (item.mediaType === 'video' && item.videoSrc) {
      const video = document.createElement('video')
      video.className = 'instagram-feed__modal-video'
      video.controls = true
      video.playsInline = true
      video.preload = 'auto'
      if (item.poster) video.poster = item.poster
      video.src = item.videoSrc
      modalMedia.append(video)
      if (autoplay) {
        void video.play().catch(() => {})
      }
      return
    }

    if (item.imageSrc) {
      const img = document.createElement('img')
      img.className = 'instagram-feed__modal-img'
      img.src = item.imageSrc
      img.alt = item.imageAlt
      img.loading = 'eager'
      modalMedia.append(img)
    }
  }

  const getModalCaptionTargets = (): HTMLElement[] => {
    const targets: HTMLElement[] = []
    if (modalDescription && !modalDescription.hidden) targets.push(modalDescription)
    if (modalLink && !modalLink.hidden) targets.push(modalLink)
    return targets
  }

  const applyModalCaption = (item: FeedItemData): void => {
    if (modalDescription) {
      if (item.description) {
        modalDescription.textContent = item.description
        modalDescription.hidden = false
      } else {
        modalDescription.textContent = ''
        modalDescription.hidden = true
      }
    }

    if (modalLink) {
      if (item.viewUrl) {
        modalLink.href = item.viewUrl
        modalLink.textContent = item.viewLabel
        modalLink.hidden = false
      } else {
        modalLink.hidden = true
      }
    }
  }

  const updateModalNav = (): void => {
    const showNav = items.length > 1
    if (modalPrev) modalPrev.hidden = !showNav
    if (modalNext) modalNext.hidden = !showNav
  }

  const pauseModalVideo = (): void => {
    modalMedia?.querySelector<HTMLVideoElement>('video')?.pause()
  }

  const resetModalMotion = (): void => {
    const captionTargets = [modalDescription, modalLink].filter(Boolean) as HTMLElement[]
    const targets = modalMedia ? [modalMedia, ...captionTargets] : captionTargets
    gsap.killTweensOf(targets)
    gsap.set(targets, { autoAlpha: 1, x: 0, clearProps: 'transform,opacity,visibility' })
  }

  const applyModalContent = (item: FeedItemData, dir: -1 | 0 | 1): void => {
    if (!item) return

    const captionOut = getModalCaptionTargets()
    const mediaTargets = modalMedia ? [modalMedia] : []

    const runSwap = (): void => {
      pauseModalVideo()
      renderModalMedia(item)
      applyModalCaption(item)
    }

    gsap.killTweensOf([...mediaTargets, ...captionOut])

    if (dir === 0 || reduced) {
      runSwap()
      updateModalNav()
      const captionIn = getModalCaptionTargets()
      gsap.fromTo(
        [...mediaTargets, ...captionIn],
        { autoAlpha: 0.001 },
        { autoAlpha: 1, duration: reduced ? 0.05 : 0.34, ease: 'power2.out' },
      )
      return
    }

    modalStepping = true
    if (modalPrev) modalPrev.disabled = true
    if (modalNext) modalNext.disabled = true

    const dx = dir * 20
    gsap
      .timeline({
        onComplete: () => {
          modalStepping = false
          if (modalPrev) modalPrev.disabled = false
          if (modalNext) modalNext.disabled = false
        },
      })
      .to(mediaTargets, {
        autoAlpha: 0,
        x: -dx,
        duration: reduced ? 0.04 : 0.22,
        ease: 'power2.inOut',
      })
      .to(
        captionOut,
        {
          autoAlpha: 0,
          duration: reduced ? 0.04 : 0.18,
          ease: 'power2.inOut',
        },
        '<',
      )
      .add(runSwap)
      .fromTo(
        mediaTargets,
        { autoAlpha: 0, x: dx },
        { autoAlpha: 1, x: 0, duration: reduced ? 0.05 : 0.36, ease: 'power2.out' },
      )
      .fromTo(
        getModalCaptionTargets(),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: reduced ? 0.05 : 0.28, ease: 'power2.out' },
        '<0.04',
      )

    updateModalNav()
  }

  const openModal = async (index: number, trigger: HTMLElement): Promise<void> => {
    if (!modal || !items.length) return
    modalIndex = ((index % items.length) + items.length) % items.length
    pauseCardVideos(container)
    resetModalMotion()
    applyModalContent(items[modalIndex], 0)
    await modal.open(trigger)
  }

  const stepModal = (delta: number): void => {
    if (!modal?.isOpen || items.length < 2 || modalStepping) return
    modalIndex = (modalIndex + delta + items.length) % items.length
    const dir = delta > 0 ? 1 : -1
    applyModalContent(items[modalIndex], dir)
  }

  const bindModal = (): void => {
    if (!modalRoot) return

    modal = new ThemeModal({
      root: modalRoot,
      panel: '.instagram-feed__modal-panel',
      overlay: '.theme-modal__overlay',
      sheetMotion: false,
      dragToClose: false,
    })

    modalRoot.addEventListener(
      'theme-modal:closed',
      () => {
        resetModalMotion()
        if (modalMedia) modalMedia.innerHTML = ''
        resumeVisibleCardVideos(container)
      },
      { signal },
    )

    modalPrev?.addEventListener('click', () => stepModal(-1), { signal })
    modalNext?.addEventListener('click', () => stepModal(1), { signal })

    modalRoot.addEventListener(
      'keydown',
      (e) => {
        if (!modal?.isOpen) return
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          stepModal(-1)
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          stepModal(1)
        }
      },
      { signal },
    )
  }

  const bindCards = (): void => {
    container.querySelectorAll<HTMLElement>('[data-instagram-feed-open]').forEach((btn) => {
      btn.addEventListener(
        'click',
        () => {
          const itemEl = btn.closest('[data-instagram-feed-item]')
          const idx = parseInt(itemEl?.getAttribute('data-item-index') || '0', 10) || 0
          void openModal(idx, btn)
        },
        { signal },
      )
    })
  }

  const bindLoadMore = (): void => {
    const btn = container.querySelector<HTMLElement>('[data-instagram-feed-load-more]')
    if (!btn) return

    btn.addEventListener(
      'click',
      () => {
        const cols = getGridColumns(container)
        const hidden = container.querySelectorAll('.instagram-feed__item--hidden')
        const batch = Math.min(cols, hidden.length)
        for (let i = 0; i < batch; i++) {
          hidden[i]?.classList.remove('instagram-feed__item--hidden')
        }
        if (container.querySelectorAll('.instagram-feed__item--hidden').length === 0) {
          btn.closest('.instagram-feed__load-more-wrap')?.remove()
        }
      },
      { signal },
    )
  }

  const teardown = (): void => {
    revealTimeline?.kill()
    revealTimeline = null
    const slides = container.querySelectorAll('.instagram-feed__slide-target')
    gsap.killTweensOf(slides)
    if (loadingEl) gsap.killTweensOf(loadingEl)
    resetModalMotion()
    destroySwiper()
    void modal?.destroy()
    modal = null
    container.classList.remove(REVEALED)
    abort.abort()
  }
  root.__instagramFeedTeardown = teardown

  items = collectItems(container)
  const slideEls = container.querySelectorAll<HTMLElement>('.instagram-feed__slide-target')
  if (slideEls.length === 0) return

  gsap.set(slideEls, { autoAlpha: 0, y: reduced ? 0 : 16 })
  if (loadingEl && isCarousel && !reduced) gsap.set(loadingEl, { autoAlpha: 1 })

  bindModal()
  bindCards()
  bindLoadMore()
  initSwiper()

  const runReveal = (): void => {
    revealTimeline = revealStaggeredSlides({
      container,
      slides: slideEls,
      loadingEl: isCarousel ? loadingEl : null,
      reduced,
      revealedClass: REVEALED,
    })
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
  const root = container as InstagramFeedContainer
  root.__instagramFeedTeardown?.()
  delete root.__instagramFeedTeardown
}
