import gsap from 'gsap'

/**
 * Reusable modal shell: GSAP show/hide, scroll lock, Escape, overlay dismiss, focus restore, Tab trap.
 *
 * **Markup:** Pair with `theme-modal` BEM classes (`theme-modal__aligner`, `theme-modal__overlay`,
 * `theme-modal__panel`, …) from
 * `src/styles/components/_theme-modal.scss` for consistent chrome. Elements inside `root` with
 * `data-theme-modal-close` close the dialog on click.
 *
 * Usage — imperative (any markup):
 * ```ts
 * const modal = new ThemeModal({
 *   root: document.querySelector('#my-dialog'),
 *   panel: '.my-dialog__panel',
 *   overlay: '.my-dialog__overlay',
 * })
 * await modal.open(triggerButton)
 * await modal.close()
 * ```
 *
 * Usage — listen for lifecycle hooks:
 * ```ts
 * root.addEventListener('theme-modal:opened', () => {})
 * root.addEventListener('theme-modal:closed', () => {})
 * ```
 */

const FOCUSABLE_SEL =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Keep in sync with `src/styles/components/_theme-modal.scss` (`$theme-modal-compact-max`). */
export const THEME_MODAL_COMPACT_MQ = '(max-width: 74.99em)'

export type ThemeModalOptions = {
  /** Fixed/fullscreen host (usually `position: fixed; inset: 0`) */
  root: HTMLElement
  /** Animated surface (card / sheet) */
  panel: HTMLElement | string
  /** Optional backdrop; fades; click closes when `overlayCloses` is true */
  overlay?: HTMLElement | string | null
  overlayCloses?: boolean
  escapeCloses?: boolean
  lockScroll?: boolean
  /** Open animation duration (seconds); halved when `prefers-reduced-motion` */
  durationOpen?: number
  /** Close animation duration (seconds) */
  durationClose?: number
  /** Vertical offset (px) panel enters from (desktop / non-sheet) */
  enterY?: number
  /**
   * When true (default), compact viewports (`compactMediaQuery`) slide the panel up like a native bottom sheet.
   */
  sheetMotion?: boolean
  /** Must match SCSS sheet layout breakpoint. */
  compactMediaQuery?: string
  /** Extra px past panel height when sliding off-screen (sheet). */
  sheetMargin?: number
  /**
   * When true (default), compact sheet viewports allow dragging the handle downward to dismiss.
   * Requires a handle node: `[data-theme-modal-drag]` or `.theme-modal__handle` inside `root`.
   */
  dragToClose?: boolean
  /** Drag distance (px) past which the sheet closes on release. */
  dragCloseThresholdPx?: number
  /** Downward velocity (px per ms) on release that dismisses even below the distance threshold. */
  dragVelocityDismiss?: number
  /** Drag handle element or selector under `root`; default resolves `[data-theme-modal-drag]` then `.theme-modal__handle`. Pass `null` to disable handle resolution. */
  dragHandle?: HTMLElement | string | null
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function resolveEl(root: Element, target: HTMLElement | string): HTMLElement | null {
  return typeof target === 'string' ? root.querySelector(target) : target
}

function visibleFocusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SEL)).filter((el) => {
    if (el.hasAttribute('disabled')) return false
    if (el.closest('[hidden]')) return false
    return el.getClientRects().length > 0
  })
}

export class ThemeModal {
  private readonly panel: HTMLElement
  private readonly overlay: HTMLElement | null
  private readonly overlayCloses: boolean
  private readonly escapeCloses: boolean
  private readonly lockScroll: boolean
  private readonly durationOpen: number
  private readonly durationClose: number
  private readonly enterY: number
  private readonly sheetMotion: boolean
  private readonly sheetMargin: number
  private readonly compactMq: MediaQueryList
  private readonly dragToClose: boolean
  private readonly dragCloseThreshold: number
  private readonly dragVelocityThreshold: number
  private readonly dragHandleEl: HTMLElement | null

  private openState = false
  private triggerEl: HTMLElement | null = null
  private activeTween: gsap.core.Animation | null = null
  private boundKeydown = this.onDocumentKeydown.bind(this)
  private boundOverlayClick = this.onOverlayPointerdown.bind(this)
  private boundCloseControlClick = this.onCloseControlClick.bind(this)

  private dragListenersBound = false
  private dragPointerId: number | null = null
  private dragStartClientY = 0
  private dragLastClientY = 0
  private dragLastTime = 0
  private dragLastVel = 0

  constructor(private readonly opts: ThemeModalOptions) {
    const p = resolveEl(opts.root, opts.panel)
    if (!p) throw new Error('[ThemeModal] panel selector did not match an element')
    this.panel = p
    this.overlay =
      opts.overlay != null && opts.overlay !== ''
        ? resolveEl(opts.root, opts.overlay)
        : null
    this.overlayCloses = opts.overlayCloses !== false
    this.escapeCloses = opts.escapeCloses !== false
    this.lockScroll = opts.lockScroll !== false
    this.durationOpen = opts.durationOpen ?? 0.4
    this.durationClose = opts.durationClose ?? 0.28
    this.enterY = opts.enterY ?? 18
    this.sheetMotion = opts.sheetMotion !== false
    this.sheetMargin = opts.sheetMargin ?? 20
    this.compactMq = window.matchMedia(opts.compactMediaQuery ?? THEME_MODAL_COMPACT_MQ)
    this.dragToClose = opts.dragToClose !== false
    this.dragCloseThreshold = opts.dragCloseThresholdPx ?? 72
    this.dragVelocityThreshold = opts.dragVelocityDismiss ?? 0.42
    this.dragHandleEl = this.resolveDragHandle(opts.dragHandle)

    this.setClosedLayout()
  }

  get root(): HTMLElement {
    return this.opts.root
  }

  get isOpen(): boolean {
    return this.openState
  }

  private useSheetMotion(): boolean {
    return this.sheetMotion && this.compactMq.matches
  }

  private panelEnterY(): number {
    if (!this.useSheetMotion()) return this.enterY
    const h = this.panel.offsetHeight
    return h > 0 ? h + this.sheetMargin : this.enterY * 5
  }

  private panelEnterScale(): number {
    return this.useSheetMotion() ? 1 : 0.98
  }

  private resolveDragHandle(
    explicit: HTMLElement | string | null | undefined,
  ): HTMLElement | null {
    if (explicit === null) return null
    if (explicit instanceof HTMLElement) return explicit
    if (typeof explicit === 'string') return resolveEl(this.opts.root, explicit)
    return (
      resolveEl(this.opts.root, '[data-theme-modal-drag]') ??
      resolveEl(this.opts.root, '.theme-modal__handle')
    )
  }

  private bindDragHandle(): void {
    if (
      !this.dragToClose ||
      !this.dragHandleEl ||
      !this.useSheetMotion() ||
      this.dragListenersBound
    ) {
      return
    }
    this.dragListenersBound = true
    this.dragHandleEl.addEventListener('pointerdown', this.onDragPointerDown)
  }

  private unbindDragHandle(): void {
    if (this.dragHandleEl) {
      this.dragHandleEl.removeEventListener('pointerdown', this.onDragPointerDown)
      this.teardownActiveDrag()
    }
    this.dragListenersBound = false
  }

  private teardownActiveDrag(): void {
    if (this.dragPointerId !== null && this.dragHandleEl) {
      try {
        this.dragHandleEl.releasePointerCapture(this.dragPointerId)
      } catch {
        /* not captured */
      }
      this.dragHandleEl.removeEventListener('pointermove', this.onDragPointerMove)
      this.dragHandleEl.removeEventListener('pointerup', this.onDragPointerUp)
      this.dragHandleEl.removeEventListener('pointercancel', this.onDragPointerUp)
    }
    this.dragPointerId = null
  }

  private onDragPointerDown = (e: PointerEvent): void => {
    if (!this.openState || this.dragPointerId !== null) return
    if (e.pointerType === 'mouse' && e.button !== 0) return

    this.dragPointerId = e.pointerId
    this.dragStartClientY = e.clientY
    this.dragLastClientY = e.clientY
    this.dragLastTime = performance.now()
    this.dragLastVel = 0

    e.preventDefault()
    this.dragHandleEl!.setPointerCapture(e.pointerId)
    this.dragHandleEl!.addEventListener('pointermove', this.onDragPointerMove)
    this.dragHandleEl!.addEventListener('pointerup', this.onDragPointerUp)
    this.dragHandleEl!.addEventListener('pointercancel', this.onDragPointerUp)
  }

  private onDragPointerMove = (e: PointerEvent): void => {
    if (e.pointerId !== this.dragPointerId) return
    const dy = e.clientY - this.dragStartClientY
    const y = Math.max(0, dy)
    gsap.set(this.panel, { y })

    const now = performance.now()
    const dt = now - this.dragLastTime
    if (dt > 0) {
      this.dragLastVel = (e.clientY - this.dragLastClientY) / dt
    }
    this.dragLastClientY = e.clientY
    this.dragLastTime = now

    if (this.overlay) {
      const denom = Math.max(120, this.panel.offsetHeight * 0.45)
      const p = Math.min(1, y / denom)
      gsap.set(this.overlay, { autoAlpha: 1 - p * 0.4 })
    }
  }

  private onDragPointerUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.dragPointerId) return

    const dy = e.clientY - this.dragStartClientY
    const dismiss =
      dy >= this.dragCloseThreshold ||
      (dy > 24 && this.dragLastVel > this.dragVelocityThreshold)

    this.teardownActiveDrag()

    if (!this.openState) return

    if (dismiss) {
      void this.close()
      return
    }

    gsap.killTweensOf(this.panel)
    if (this.overlay) gsap.killTweensOf(this.overlay)
    const quick = prefersReducedMotion()
    gsap.to(this.panel, {
      y: 0,
      duration: quick ? 0.05 : 0.24,
      ease: 'power2.out',
    })
    if (this.overlay) {
      gsap.to(this.overlay, { autoAlpha: 1, duration: quick ? 0.05 : 0.18, ease: 'power2.out' })
    }
  }

  /** Prepare DOM for GSAP (idempotent). */
  setClosedLayout(): void {
    gsap.set(this.opts.root, { visibility: 'hidden', pointerEvents: 'none' })
    if (this.overlay) gsap.set(this.overlay, { autoAlpha: 0 })
    gsap.set(this.panel, {
      autoAlpha: 0,
      y: this.panelEnterY(),
      scale: this.panelEnterScale(),
    })
  }

  async open(fromTrigger?: HTMLElement | null): Promise<void> {
    if (this.openState) return
    this.openState = true
    this.triggerEl = fromTrigger ?? null
    this.activeTween?.kill()

    this.opts.root.setAttribute('aria-hidden', 'false')
    const role = this.opts.root.getAttribute('role')
    if (role === 'dialog' || role === 'alertdialog') {
      this.opts.root.setAttribute('aria-modal', 'true')
    }

    gsap.set(this.opts.root, { visibility: 'visible', pointerEvents: 'auto' })
    this.opts.root.scrollTop = 0
    this.opts.root.classList.add('is-open')
    if (this.lockScroll) document.documentElement.style.overflow = 'hidden'

    document.addEventListener('keydown', this.boundKeydown, true)
    if (this.overlay && this.overlayCloses) {
      this.overlay.addEventListener('click', this.boundOverlayClick)
    }
    this.opts.root.addEventListener('click', this.boundCloseControlClick)

    const reduced = prefersReducedMotion()
    const dOpen = reduced ? Math.min(this.durationOpen, 0.08) : this.durationOpen
    const ease = this.useSheetMotion() && !reduced ? 'power2.out' : 'power3.out'

    const startY = reduced ? 0 : this.panelEnterY()
    const startScale = reduced ? 1 : this.panelEnterScale()
    gsap.set(this.panel, { autoAlpha: 0, y: startY, scale: startScale })

    const tl = gsap.timeline()
    if (this.overlay) {
      tl.to(this.overlay, { autoAlpha: 1, duration: dOpen * 0.8, ease: 'power2.out' }, 0)
    }
    tl.to(this.panel, { autoAlpha: 1, y: 0, scale: 1, duration: dOpen, ease }, 0.03)
    this.activeTween = tl
    await tl.then()
    this.activeTween = null

    this.bindDragHandle()
    this.focusFirst()
    this.opts.root.dispatchEvent(new CustomEvent('theme-modal:opened', { bubbles: true }))
  }

  async close(): Promise<void> {
    if (!this.openState) return
    this.openState = false
    this.activeTween?.kill()
    gsap.killTweensOf(this.panel)
    if (this.overlay) gsap.killTweensOf(this.overlay)
    this.unbindDragHandle()

    document.removeEventListener('keydown', this.boundKeydown, true)
    if (this.overlay && this.overlayCloses) {
      this.overlay.removeEventListener('click', this.boundOverlayClick)
    }
    this.opts.root.removeEventListener('click', this.boundCloseControlClick)

    this.opts.root.classList.remove('is-open')

    const reduced = prefersReducedMotion()
    const dClose = reduced ? Math.min(this.durationClose, 0.06) : this.durationClose
    const sheet = this.useSheetMotion() && !reduced
    const endY = sheet ? this.panelEnterY() : this.enterY * 0.75
    const endScale = sheet ? 1 : 0.985

    const tl = gsap.timeline()
    tl.to(this.panel, {
      autoAlpha: 0,
      y: reduced ? 0 : endY,
      scale: reduced ? 1 : endScale,
      duration: dClose,
      ease: sheet ? 'power2.in' : 'power3.in',
    })
    if (this.overlay) {
      tl.to(this.overlay, { autoAlpha: 0, duration: dClose * 0.85, ease: 'power2.in' }, 0.05)
    }
    tl.set(this.opts.root, { visibility: 'hidden', pointerEvents: 'none' })
    this.activeTween = tl
    await tl.then()
    this.activeTween = null

    this.opts.root.setAttribute('aria-hidden', 'true')
    this.opts.root.setAttribute('aria-modal', 'false')

    if (this.lockScroll) document.documentElement.style.overflow = ''

    const t = this.triggerEl
    this.triggerEl = null
    t?.focus({ preventScroll: true })

    this.opts.root.dispatchEvent(new CustomEvent('theme-modal:closed', { bubbles: true }))
  }

  /** Kill tweens and listeners; sync DOM to canceled closed state (e.g. node removed). */
  destroy(): void {
    this.activeTween?.kill()
    gsap.killTweensOf([this.panel, this.opts.root, ...(this.overlay ? [this.overlay] : [])])

    document.removeEventListener('keydown', this.boundKeydown, true)
    if (this.overlay && this.overlayCloses) {
      this.overlay.removeEventListener('click', this.boundOverlayClick)
    }
    this.opts.root.removeEventListener('click', this.boundCloseControlClick)
    this.unbindDragHandle()

    if (this.openState) {
      this.openState = false
      if (this.lockScroll) document.documentElement.style.overflow = ''
      const t = this.triggerEl
      this.triggerEl = null
      t?.focus({ preventScroll: true })
    }

    this.opts.root.classList.remove('is-open')
    this.opts.root.setAttribute('aria-hidden', 'true')
    this.opts.root.setAttribute('aria-modal', 'false')
    this.setClosedLayout()
  }

  private onOverlayPointerdown(e: MouseEvent): void {
    if (e.target === this.overlay) void this.close()
  }

  private onCloseControlClick(e: MouseEvent): void {
    const t = e.target
    if (!(t instanceof Element)) return
    if (t.closest('[data-theme-modal-close]')) {
      e.preventDefault()
      void this.close()
    }
  }

  private onDocumentKeydown(e: KeyboardEvent): void {
    if (!this.openState) return
    if (this.escapeCloses && e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      void this.close()
      return
    }
    if (e.key !== 'Tab') return

    const list = visibleFocusables(this.opts.root)
    if (list.length === 0) return
    const first = list[0]
    const last = list[list.length - 1]
    const ae = document.activeElement as HTMLElement | null
    if (e.shiftKey && ae === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && ae === last) {
      e.preventDefault()
      first.focus()
    }
  }

  private focusFirst(): void {
    const list = visibleFocusables(this.opts.root)
    if (list.length > 0) {
      list[0].focus()
      return
    }
    this.panel.setAttribute('tabindex', '-1')
    this.panel.focus()
  }
}
