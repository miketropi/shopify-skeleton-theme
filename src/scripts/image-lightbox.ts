import gsap from 'gsap'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export type ImageLightboxItem = {
  src: string
  srcset?: string
  sizes?: string
  /** Accessible name / fallback when no caption panel */
  alt: string
  width?: number
  height?: number
  /** Shown below the image when `hasCaption` is true */
  caption: string
  hasCaption: boolean
}

export type ImageLightboxLabelsTemplate = {
  close: string
  prev: string
  next: string
  dialog: string
  /** Use `__CURRENT__` and `__TOTAL__` placeholders for translatable templates */
  counterTemplate: string
}

export type CreateImageLightboxOptions = {
  /** Called on each open so DOM (e.g. variant image) stays in sync */
  getItems: () => ImageLightboxItem[]
  labels: ImageLightboxLabelsTemplate
  reducedMotion?: boolean
}

export type ImageLightboxHandle = {
  open: (index: number) => void
  close: () => void
  isOpen: () => boolean
  destroy: () => void
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function visibleFocusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
    if (el.hasAttribute('disabled')) return false
    if (el.closest('[hidden]')) return false
    if (el.getAttribute('aria-hidden') === 'true') return false
    return el.getClientRects().length > 0
  })
}

function formatCounter(template: string, current: number, total: number): string {
  return template.replace('__CURRENT__', String(current)).replace('__TOTAL__', String(total))
}

/**
 * Full-screen image lightbox: GSAP transitions, prev/next, optional caption below the image
 * (when `item.hasCaption` + `item.caption`), touch swipe, and basic focus trap.
 *
 * ```ts
 * const lb = createImageLightbox({
 *   getItems: () => [...],
 *   labels: { close, prev, next, dialog, counterTemplate },
 * })
 * lb.open(0)
 * ```
 */
export function createImageLightbox(options: CreateImageLightboxOptions): ImageLightboxHandle {
  const reduced = options.reducedMotion ?? prefersReducedMotion()
  let openState = false
  let index = 0
  let lastTrigger: HTMLElement | null = null

  let root: HTMLElement | null = null
  let backdrop: HTMLElement | null = null
  let stage: HTMLElement | null = null
  let stageInner: HTMLElement | null = null
  let img: HTMLImageElement | null = null
  let captionWrap: HTMLElement | null = null
  let captionText: HTMLElement | null = null
  let btnClose: HTMLButtonElement | null = null
  let btnPrev: HTMLButtonElement | null = null
  let btnNext: HTMLButtonElement | null = null
  let counter: HTMLElement | null = null

  let swipeId: number | null = null
  let swipeStartX = 0
  let swipeX = 0
  let swipeActive = false

  const teardownSwipe = (): void => {
    swipeActive = false
    swipeId = null
    if (stage) {
      stage.classList.remove('is-dragging')
      gsap.to(stage, { x: 0, duration: reduced ? 0.05 : 0.22, ease: 'power3.out' })
    }
  }

  const ensureDom = (): void => {
    if (root) return

    const el = document.createElement('div')
    el.className = 'image-lightbox'
    el.setAttribute('role', 'presentation')
    el.setAttribute('aria-hidden', 'true')

    el.innerHTML = `
      <div class="image-lightbox__backdrop" data-lightbox-backdrop></div>
      <div class="image-lightbox__shell" role="dialog" aria-modal="true" aria-label="${escapeAttr(options.labels.dialog)}">
        <button type="button" class="image-lightbox__close" data-lightbox-close aria-label="${escapeAttr(options.labels.close)}">
          <span aria-hidden="true">×</span>
        </button>
        <button type="button" class="image-lightbox__nav image-lightbox__nav--prev" data-lightbox-prev aria-label="${escapeAttr(options.labels.prev)}">
          <span aria-hidden="true">‹</span>
        </button>
        <button type="button" class="image-lightbox__nav image-lightbox__nav--next" data-lightbox-next aria-label="${escapeAttr(options.labels.next)}">
          <span aria-hidden="true">›</span>
        </button>
        <span class="image-lightbox__counter" data-lightbox-counter aria-live="polite" hidden></span>
        <div class="image-lightbox__stage-clip">
          <div class="image-lightbox__stage" data-lightbox-stage>
            <div class="image-lightbox__layout" data-lightbox-layout>
              <div class="image-lightbox__panel image-lightbox__panel--media">
                <div class="image-lightbox__media" data-lightbox-media>
                  <img class="image-lightbox__img" alt="" decoding="async" data-lightbox-img />
                </div>
              </div>
              <div class="image-lightbox__panel image-lightbox__panel--caption" hidden data-lightbox-caption-wrap>
                <div class="image-lightbox__caption rte" data-lightbox-caption></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(el)
    root = el
    backdrop = el.querySelector('[data-lightbox-backdrop]')
    btnClose = el.querySelector('[data-lightbox-close]')
    btnPrev = el.querySelector('[data-lightbox-prev]')
    btnNext = el.querySelector('[data-lightbox-next]')
    counter = el.querySelector('[data-lightbox-counter]')
    stage = el.querySelector('[data-lightbox-stage]')
    stageInner = el.querySelector('[data-lightbox-layout]')
    img = el.querySelector('[data-lightbox-img]')
    captionWrap = el.querySelector('[data-lightbox-caption-wrap]')
    captionText = el.querySelector('[data-lightbox-caption]')

    backdrop?.addEventListener('click', () => void closeUi())
    btnClose?.addEventListener('click', () => void closeUi())
    btnPrev?.addEventListener('click', () => step(-1))
    btnNext?.addEventListener('click', () => step(1))

    stage?.addEventListener('pointerdown', onStagePointerDown)
    stage?.addEventListener('pointermove', onStagePointerMove)
    stage?.addEventListener('pointerup', onStagePointerUp)
    stage?.addEventListener('pointercancel', onStagePointerUp)
  }

  function lockScroll(lock: boolean): void {
    const doc = document.documentElement
    if (lock) {
      const sb = window.innerWidth - doc.clientWidth
      doc.style.overflow = 'hidden'
      if (sb > 0) doc.style.paddingRight = `${sb}px`
    } else {
      doc.style.overflow = ''
      doc.style.paddingRight = ''
    }
  }

  function applyItem(items: ImageLightboxItem[], i: number, dir: -1 | 0 | 1): void {
    const item = items[i]
    if (!item || !img || !captionWrap || !captionText || !stageInner) return

    gsap.killTweensOf(stageInner)

    const showCaption = item.hasCaption && item.caption.trim().length > 0
    captionWrap.hidden = !showCaption
    captionText.textContent = showCaption ? item.caption : ''

    root?.classList.toggle('image-lightbox--split', showCaption)

    const runSwap = (): void => {
      img!.alt = item.alt
      if (item.width) img!.width = item.width
      if (item.height) img!.height = item.height
      img!.src = item.src
      if (item.srcset) img!.setAttribute('srcset', item.srcset)
      else img!.removeAttribute('srcset')
      if (item.srcset) img!.setAttribute('sizes', 'min(100vw, 1920px)')
      else if (item.sizes) img!.setAttribute('sizes', item.sizes)
      else img!.removeAttribute('sizes')
    }

    if (dir === 0 || reduced) {
      runSwap()
      gsap.fromTo(
        stageInner,
        { autoAlpha: 0.001 },
        { autoAlpha: 1, duration: reduced ? 0.05 : 0.32, ease: 'power2.out' }
      )
      return
    }

    const dx = dir * 28
    gsap
      .timeline()
      .to(stageInner, {
        autoAlpha: 0,
        x: -dx,
        duration: reduced ? 0.04 : 0.18,
        ease: 'power3.in',
      })
      .add(runSwap)
      .fromTo(
        stageInner,
        { autoAlpha: 0, x: dx },
        { autoAlpha: 1, x: 0, duration: reduced ? 0.05 : 0.3, ease: 'power3.out' }
      )
  }

  function updateNav(items: ImageLightboxItem[]): void {
    const n = items.length
    if (btnPrev) btnPrev.disabled = n < 2
    if (btnNext) btnNext.disabled = n < 2
    if (counter) {
      if (n < 2) {
        counter.hidden = true
        counter.textContent = ''
      } else {
        counter.hidden = false
        counter.textContent = formatCounter(options.labels.counterTemplate, index + 1, n)
      }
    }
  }

  function step(delta: number): void {
    const items = options.getItems()
    if (items.length === 0) return
    const n = items.length
    if (n < 2) return
    const next = (index + delta + n) % n
    const dir = delta > 0 ? 1 : -1
    index = next
    applyItem(items, index, dir)
    updateNav(items)
  }

  function onStagePointerDown(e: PointerEvent): void {
    if (!openState || (e.pointerType === 'mouse' && e.button !== 0)) return
    const t = e.target as Node
    if (btnClose?.contains(t) || btnPrev?.contains(t) || btnNext?.contains(t)) return
    swipeActive = true
    swipeId = e.pointerId
    swipeStartX = e.clientX
    swipeX = 0
    stage?.classList.add('is-dragging')
    try {
      stage?.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  function onStagePointerMove(e: PointerEvent): void {
    if (!swipeActive || e.pointerId !== swipeId || !stage || reduced) return
    swipeX = e.clientX - swipeStartX
    gsap.set(stage, { x: swipeX * 0.65 })
  }

  function onStagePointerUp(e: PointerEvent): void {
    if (e.pointerId !== swipeId || !swipeActive) return
    try {
      stage?.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    const threshold = Math.min(80, Math.max(48, (stage?.offsetWidth ?? 320) * 0.12))
    let delta = 0
    if (swipeX < -threshold) delta = 1
    else if (swipeX > threshold) delta = -1
    teardownSwipe()
    if (delta !== 0) step(delta)
  }

  const onDocKeydown = (e: KeyboardEvent): void => {
    if (!openState) return
    if (e.key === 'Escape') {
      e.preventDefault()
      void closeUi()
      return
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      step(1)
      return
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      step(-1)
      return
    }
    if (e.key !== 'Tab' || !root) return
    const focusables = visibleFocusables(root)
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const cur = document.activeElement as HTMLElement | null
    if (e.shiftKey) {
      if (cur === first || !root.contains(cur)) {
        e.preventDefault()
        last.focus()
      }
    } else if (cur === last) {
      e.preventDefault()
      first.focus()
    }
  }

  async function openUi(startIndex: number): Promise<void> {
    const items = options.getItems()
    if (items.length === 0 || !root) return
    index = Math.max(0, Math.min(items.length - 1, startIndex))
    openState = true

    lockScroll(true)
    root.setAttribute('aria-hidden', 'false')
    const shell = root.querySelector<HTMLElement>('[role="dialog"]')
    shell?.setAttribute('aria-label', options.labels.dialog)

    gsap.killTweensOf([backdrop, shell, stage, stageInner])

    applyItem(items, index, 0)
    updateNav(items)

    if (backdrop) gsap.set(backdrop, { autoAlpha: 0 })
    if (shell) gsap.set(shell, { autoAlpha: 0, y: reduced ? 0 : 6, scale: 1 })
    if (stageInner) gsap.set(stageInner, { autoAlpha: 1, x: 0 })

    gsap.set(root, { visibility: 'visible', pointerEvents: 'auto' })
    root.classList.add('is-open')

    document.addEventListener('keydown', onDocKeydown, true)

    const dur = reduced ? 0.08 : 0.42
    await gsap
      .timeline()
      .to(backdrop, { autoAlpha: 1, duration: dur * 0.85, ease: 'power2.out' }, 0)
      .to(shell, { autoAlpha: 1, y: 0, duration: dur, ease: 'power2.out' }, 0.03)

    const toFocus = btnClose ?? btnPrev
    toFocus?.focus()
  }

  async function closeUi(): Promise<void> {
    if (!root) return
    if (!openState) {
      lockScroll(false)
      return
    }
    openState = false
    document.removeEventListener('keydown', onDocKeydown, true)
    lockScroll(false)
    teardownSwipe()

    const shell = root.querySelector<HTMLElement>('[role="dialog"]')
    gsap.killTweensOf([backdrop, shell, stageInner])

    const dur = reduced ? 0.06 : 0.3
    await gsap
      .timeline()
      .to(shell, {
        autoAlpha: 0,
        y: reduced ? 0 : 4,
        duration: dur * 0.65,
        ease: 'power2.in',
      })
      .to(backdrop, { autoAlpha: 0, duration: dur * 0.55, ease: 'power2.in' }, 0)

    root.classList.remove('is-open')
    root.setAttribute('aria-hidden', 'true')
    gsap.set(root, { visibility: 'hidden', pointerEvents: 'none' })

    lastTrigger?.focus()
    lastTrigger = null
  }

  function destroy(): void {
    document.removeEventListener('keydown', onDocKeydown, true)
    lockScroll(false)
    openState = false
    teardownSwipe()
    if (root) {
      const shell = root.querySelector<HTMLElement>('[role="dialog"]')
      gsap.killTweensOf([backdrop, shell, stage, stageInner])
      root.remove()
    }
    root = null
    backdrop = null
    stage = null
    stageInner = null
    img = null
    captionWrap = null
    captionText = null
    btnClose = null
    btnPrev = null
    btnNext = null
    counter = null
  }

  return {
    open(i: number) {
      const items = options.getItems()
      if (items.length === 0) return
      ensureDom()
      const target = Math.max(0, Math.min(items.length - 1, i))
      if (openState && root) {
        const dir = target === index ? 0 : target > index ? 1 : -1
        index = target
        applyItem(items, index, dir)
        updateNav(items)
        return
      }
      lastTrigger = document.activeElement as HTMLElement
      void openUi(target)
    },
    close: () => void closeUi(),
    isOpen: () => openState,
    destroy,
  }
}

/** Map product gallery images to lightbox items (expects `data-lightbox-*` on each img). */
export function lightboxItemsFromGalleryImgs(galleryRoot: HTMLElement): ImageLightboxItem[] {
  const imgs = galleryRoot.querySelectorAll<HTMLImageElement>('[data-product-slide-img]')
  return Array.from(imgs).map((el) => {
    const caption = (el.dataset.lightboxCaption || '').trim()
    const hasCaption = el.dataset.lightboxHasCaption === 'true'
    const w = parseInt(el.getAttribute('width') || '', 10)
    const h = parseInt(el.getAttribute('height') || '', 10)
    return {
      src: el.currentSrc || el.src,
      srcset: el.getAttribute('srcset') || undefined,
      sizes: el.getAttribute('sizes') || undefined,
      alt: el.alt || '',
      width: Number.isFinite(w) ? w : undefined,
      height: Number.isFinite(h) ? h : undefined,
      caption: hasCaption ? caption : '',
      hasCaption,
    }
  })
}

/** Map Product Images Story slides (`data-pis-lightbox-img`; optional `data-pis-lightbox-src` for full-res). */
export function lightboxItemsFromPisSlides(root: HTMLElement): ImageLightboxItem[] {
  const imgs = root.querySelectorAll<HTMLImageElement>('[data-pis-lightbox-img]')
  return Array.from(imgs).map((el) => {
    const caption = (el.dataset.lightboxCaption || '').trim()
    const hasCaption = el.dataset.lightboxHasCaption === 'true'
    const w = parseInt(el.getAttribute('width') || '', 10)
    const h = parseInt(el.getAttribute('height') || '', 10)
    const hires = (el.dataset.pisLightboxSrc || '').trim()
    return {
      src: hires || el.currentSrc || el.src,
      srcset: hires ? undefined : el.getAttribute('srcset') || undefined,
      sizes: hires ? undefined : el.getAttribute('sizes') || undefined,
      alt: el.alt || '',
      width: Number.isFinite(w) ? w : undefined,
      height: Number.isFinite(h) ? h : undefined,
      caption: hasCaption ? caption : '',
      hasCaption,
    }
  })
}
