import gsap from 'gsap'
import { ThemeModal } from './theme-modal'
import { registerSection } from './section-registry'
import {
  initCustomSelectsInContainer,
  destroyCustomSelectsInContainer,
} from './custom-select'

// ─── Rotator ────────────────────────────────────────────

interface RotatorState {
  current: number
  timer: ReturnType<typeof setInterval> | null
  paused: boolean
  items: HTMLElement[]
  speed: number
  animating: boolean
  modal: ThemeModal | null
}

const rotatorStates = new WeakMap<HTMLElement, RotatorState>()

function initRotators(container: HTMLElement): void {
  container
    .querySelectorAll<HTMLElement>('[data-htbar-rotator]')
    .forEach((el) => startRotator(el))
}

function destroyRotators(container: HTMLElement): void {
  container
    .querySelectorAll<HTMLElement>('[data-htbar-rotator]')
    .forEach((el) => stopRotator(el))
}

function startRotator(el: HTMLElement): void {
  const items = Array.from(
    el.querySelectorAll<HTMLElement>('.htbar__rotator-item'),
  )
  if (items.length < 2) return

  const speed = (parseInt(el.dataset.speed || '4', 10) || 4) * 1000

  items.forEach((item, i) => {
    gsap.set(item, {
      opacity: i === 0 ? 1 : 0,
      y: 0,
      filter: 'blur(0px)',
    })
    if (i !== 0) item.setAttribute('aria-hidden', 'true')
  })

  el.classList.add('htbar__rotator--ready')

  const modalRoot = el.parentElement?.querySelector<HTMLElement>('[data-htbar-rt-modal]')
  let modal: ThemeModal | null = null
  if (modalRoot) {
    modal = new ThemeModal({
      root: modalRoot,
      panel: '.theme-modal__panel',
      overlay: '.theme-modal__overlay',
      sheetMotion: true,
      lockScroll: true,
    })
  }

  const state: RotatorState = {
    current: 0,
    timer: null,
    paused: false,
    items,
    speed,
    animating: false,
    modal,
  }

  rotatorStates.set(el, state)
  state.timer = setInterval(() => tick(state), speed)

  el.addEventListener('mouseenter', () => pauseRotator(el))
  el.addEventListener('mouseleave', () => resumeRotator(el))

  checkTruncation(el, items)

  items.forEach((item) => {
    item.addEventListener('click', () => {
      if (item.classList.contains('is-truncated')) openRotatorModal(state, el)
    })
  })

  window.addEventListener('resize', () => checkTruncation(el, items))
}

function checkTruncation(_el: HTMLElement, items: HTMLElement[]): void {
  items.forEach((item) => {
    item.classList.toggle('is-truncated', item.scrollWidth > item.clientWidth)
  })
}

function openRotatorModal(state: RotatorState, el: HTMLElement): void {
  if (!state.modal) return

  pauseRotator(el)

  const active = state.items[state.current]
  const richHtml = active.innerHTML

  const modalBody = state.modal.root.querySelector<HTMLElement>('[data-htbar-rt-modal-body]')
  if (modalBody) {
    modalBody.innerHTML = `<p>${richHtml}</p>`
  }

  void state.modal.open(state.items[state.current])

  state.modal.root.addEventListener(
    'theme-modal:closed',
    () => resumeRotator(el),
    { once: true },
  )
}

function tick(state: RotatorState): void {
  if (state.animating) return
  state.animating = true

  const prev = state.items[state.current]
  state.current = (state.current + 1) % state.items.length
  const next = state.items[state.current]

  const dur = 0.6

  next.removeAttribute('aria-hidden')
  gsap.set(next, { opacity: 0, y: 6, filter: 'blur(4px)' })

  gsap.to(prev, {
    opacity: 0,
    y: -6,
    filter: 'blur(4px)',
    duration: dur * 0.55,
    ease: 'power2.in',
    onComplete() {
      prev.setAttribute('aria-hidden', 'true')
      gsap.set(prev, { y: 0, filter: 'blur(0px)' })
    },
  })

  gsap.to(next, {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: dur,
    ease: 'power2.out',
    delay: dur * 0.35,
    onComplete() {
      state.animating = false
    },
  })
}

function pauseRotator(el: HTMLElement): void {
  const state = rotatorStates.get(el)
  if (!state) return
  state.paused = true
  if (state.timer != null) {
    clearInterval(state.timer)
    state.timer = null
  }
}

function resumeRotator(el: HTMLElement): void {
  const state = rotatorStates.get(el)
  if (!state || !state.paused) return
  state.paused = false
  state.timer = setInterval(() => tick(state), state.speed)
}

function stopRotator(el: HTMLElement): void {
  const state = rotatorStates.get(el)
  if (!state) return
  if (state.timer != null) clearInterval(state.timer)
  gsap.killTweensOf(state.items)
  state.modal?.destroy()
  rotatorStates.delete(el)
  el.classList.remove('htbar__rotator--ready')
}

// ─── Top bar menus (store info + localization — click to open) ──

type HtbarDropdownAlign = 'left' | 'center' | 'right'

const HTBAR_VIEW_MARGIN = 10
const HTBAR_TRIGGER_GAP = 8
const HTBAR_PORTAL_Z = 5000

/** Custom props defined on `.htbar` / `.htbar__info` — copied onto portaled dropdown so it keeps appearance off the bar root. */
const HTBAR_PORTAL_COPY_KEYS = [
  '--htbar-bg',
  '--htbar-text',
  '--htbar-heading',
  '--htbar-accent',
  '--htbar-align',
  '--_sep',
  '--_tint',
  '--cs-background',
  '--cs-background-secondary',
  '--cs-border',
  '--cs-text',
  '--cs-text-secondary',
  '--cs-heading',
  '--cs-accent',
  '--cs-accent-text',
  '--cs-btn-primary-bg',
  '--cs-btn-primary-text',
  '--cs-btn-primary-border',
  '--cs-btn-secondary-bg',
  '--cs-btn-secondary-text',
  '--cs-btn-secondary-border',
  '--theme-color-text',
  '--theme-color-bg',
  '--theme-color-accent',
  '--htbar-trigger-color',
  '--htbar-icon-color',
  '--htbar-btn-color',
] as const

function applyHtbarPortalTheme(
  panel: HTMLElement,
  bar: HTMLElement,
  info: HTMLElement,
): void {
  for (const source of [bar, info]) {
    const cs = getComputedStyle(source)
    for (const key of HTBAR_PORTAL_COPY_KEYS) {
      const v = cs.getPropertyValue(key).trim()
      if (v) panel.style.setProperty(key, v)
    }
  }
}

function removeHtbarPortalTheme(panel: HTMLElement): void {
  for (const key of HTBAR_PORTAL_COPY_KEYS) {
    panel.style.removeProperty(key)
  }
}

interface StoreInfoState {
  wrap: HTMLElement
  trigger: HTMLElement
  panel: HTMLElement | null
  card: HTMLElement | null
  open: boolean
  align: HtbarDropdownAlign
  panelPortaled: boolean
  panelParent: HTMLElement | null
  panelAnchor: Comment | null
  repositionCleanup: (() => void) | null
  boundOutsideClick: (e: MouseEvent) => void
  boundEscape: (e: KeyboardEvent) => void
}

const infoStates = new WeakMap<HTMLElement, StoreInfoState>()

function htbarPanel(wrap: HTMLElement): HTMLElement | null {
  return wrap.querySelector<HTMLElement>('[data-htbar-dropdown]')
}

function parseHtbarAlign(panel: HTMLElement | null): HtbarDropdownAlign {
  const raw = (panel?.dataset.htbarDropdownAlign || '').toLowerCase()
  if (raw === 'left' || raw === 'right') return raw
  return 'center'
}

function setHtbarPanelHidden(wrap: HTMLElement, hidden: boolean): void {
  const panel = htbarPanel(wrap)
  if (panel) {
    panel.setAttribute('aria-hidden', hidden ? 'true' : 'false')
  }
}

function clearHtbarPortalInlineStyles(panel: HTMLElement): void {
  panel.style.top = ''
  panel.style.left = ''
  panel.style.right = ''
  panel.style.bottom = ''
  panel.style.position = ''
  panel.style.transform = ''
  panel.style.paddingTop = ''
  panel.style.zIndex = ''
}

function positionHtbarPortalPanel(
  trigger: HTMLElement,
  panel: HTMLElement,
  align: HtbarDropdownAlign,
): void {
  const triggerRect = trigger.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  panel.style.position = 'fixed'
  panel.style.zIndex = `${HTBAR_PORTAL_Z}`
  panel.style.paddingTop = '0'
  panel.style.right = 'auto'
  panel.style.bottom = 'auto'
  panel.style.transform = 'none'

  const pw = panel.offsetWidth
  const ph = panel.offsetHeight

  let left =
    align === 'left'
      ? triggerRect.left
      : align === 'right'
        ? triggerRect.right - pw
        : triggerRect.left + (triggerRect.width - pw) / 2

  left = Math.min(
    Math.max(HTBAR_VIEW_MARGIN, left),
    vw - HTBAR_VIEW_MARGIN - pw,
  )

  let top = triggerRect.bottom + HTBAR_TRIGGER_GAP
  if (top + ph > vh - HTBAR_VIEW_MARGIN) {
    const above = triggerRect.top - HTBAR_TRIGGER_GAP - ph
    if (above >= HTBAR_VIEW_MARGIN) top = above
  }

  top = Math.min(top, vh - HTBAR_VIEW_MARGIN - ph)
  top = Math.max(HTBAR_VIEW_MARGIN, top)

  panel.style.top = `${Math.round(top)}px`
  panel.style.left = `${Math.round(left)}px`
}

function bindHtbarPortalReposition(state: StoreInfoState): () => void {
  const reposition = (): void => {
    if (!state.open || !state.panelPortaled || !state.panel) return
    positionHtbarPortalPanel(state.trigger, state.panel, state.align)
  }

  window.addEventListener('scroll', reposition, true)
  window.addEventListener('resize', reposition)
  window.visualViewport?.addEventListener('resize', reposition)
  window.visualViewport?.addEventListener('scroll', reposition)

  return () => {
    window.removeEventListener('scroll', reposition, true)
    window.removeEventListener('resize', reposition)
    window.visualViewport?.removeEventListener('resize', reposition)
    window.visualViewport?.removeEventListener('scroll', reposition)
  }
}

function restoreHtbarPortalToWrap(state: StoreInfoState): void {
  const { panel, panelParent, panelAnchor } = state
  if (!panel || !panelParent || !panelAnchor?.parentNode) return
  if (panel.parentNode !== document.body) return

  removeHtbarPortalTheme(panel)
  panel.classList.remove('htbar__dropdown--portaled')
  clearHtbarPortalInlineStyles(panel)
  panelParent.insertBefore(panel, panelAnchor)
  panelParent.removeChild(panelAnchor)
  state.panelAnchor = null
  state.panelParent = null
  state.panelPortaled = false
}

function firstFocusableIn(container: HTMLElement): HTMLElement | null {
  const sel =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  for (const el of container.querySelectorAll<HTMLElement>(sel)) {
    if (el.closest('.visually-hidden')) continue
    if (el.getClientRects().length === 0) continue
    return el
  }
  return null
}

function initStoreInfo(container: HTMLElement): void {
  container
    .querySelectorAll<HTMLElement>('.htbar__info')
    .forEach((wrap) => setupStoreInfo(wrap))
}

function destroyStoreInfo(container: HTMLElement): void {
  container
    .querySelectorAll<HTMLElement>('.htbar__info')
    .forEach((wrap) => teardownStoreInfo(wrap))
}

function setupStoreInfo(wrap: HTMLElement): void {
  const trigger = wrap.querySelector<HTMLElement>('[data-htbar-trigger]')
  if (!trigger) return

  const panel = htbarPanel(wrap)
  const card = wrap.querySelector<HTMLElement>('.htbar__card')

  const boundOutsideClick = (e: MouseEvent): void => {
    const t = e.target as Node
    if (wrap.contains(t)) return
    if (panel?.contains(t)) return
    closeStoreInfo(wrap)
  }

  const boundEscape = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeStoreInfo(wrap)
    }
  }

  const state: StoreInfoState = {
    wrap,
    trigger,
    panel,
    card,
    open: false,
    align: parseHtbarAlign(panel),
    panelPortaled: false,
    panelParent: null,
    panelAnchor: null,
    repositionCleanup: null,
    boundOutsideClick,
    boundEscape,
  }

  infoStates.set(wrap, state)

  setHtbarPanelHidden(wrap, true)

  trigger.addEventListener('click', (e) => {
    e.preventDefault()
    if (state.open) {
      closeStoreInfo(wrap)
    } else {
      openStoreInfo(wrap)
    }
  })
}

function openStoreInfo(wrap: HTMLElement): void {
  const state = infoStates.get(wrap)
  if (!state || state.open) return
  state.open = true

  const { panel } = state
  const bar = wrap.closest('.htbar') as HTMLElement | null
  const parent = panel?.parentElement ?? null
  const usePortal = Boolean(panel && parent && bar)

  if (usePortal && panel && parent && bar) {
    state.panelPortaled = true
    state.panelParent = parent
    const anchor = document.createComment('htbar-dropdown-anchor')
    state.panelAnchor = anchor
    state.panelParent.insertBefore(anchor, panel)
    document.body.appendChild(panel)
    panel.classList.add('htbar__dropdown--portaled')
    applyHtbarPortalTheme(panel, bar, wrap)
  }

  wrap.classList.add('is-open')
  panel?.classList.add('is-open')
  setHtbarPanelHidden(wrap, false)
  state.trigger.setAttribute('aria-expanded', 'true')

  document.addEventListener('click', state.boundOutsideClick, true)
  document.addEventListener('keydown', state.boundEscape, true)

  if (state.panelPortaled && panel) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!state.open || !state.panelPortaled || !state.panel) return
        positionHtbarPortalPanel(state.trigger, state.panel, state.align)
      })
    })
    state.repositionCleanup = bindHtbarPortalReposition(state)
  }

  if (state.card) {
    requestAnimationFrame(() => {
      const el = firstFocusableIn(state.card!)
      el?.focus()
    })
  }
}

function closeStoreInfo(wrap: HTMLElement): void {
  const state = infoStates.get(wrap)
  if (!state || !state.open) return
  state.open = false

  state.repositionCleanup?.()
  state.repositionCleanup = null

  document.removeEventListener('click', state.boundOutsideClick, true)
  document.removeEventListener('keydown', state.boundEscape, true)

  setHtbarPanelHidden(wrap, true)
  state.trigger.setAttribute('aria-expanded', 'false')

  const returnFocus = (): void => {
    state.trigger.focus()
  }

  const { panel } = state

  const finishPortalClose = (): void => {
    if (state.panelPortaled) restoreHtbarPortalToWrap(state)
    panel?.classList.remove('is-open')
    wrap.classList.remove('is-open')
    document.documentElement.style.overflow = ''
    returnFocus()
  }

  if (state.panelPortaled && panel) {
    panel.classList.remove('is-open')
    wrap.classList.remove('is-open')

    const card = panel.querySelector<HTMLElement>('.htbar__card')
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (card && !reduced) {
      let done = false
      const onEnd = (ev: TransitionEvent): void => {
        if (ev.target !== card) return
        if (done) return
        done = true
        card.removeEventListener('transitionend', onEnd)
        finishPortalClose()
      }
      card.addEventListener('transitionend', onEnd)
      window.setTimeout(() => {
        if (done) return
        done = true
        card.removeEventListener('transitionend', onEnd)
        finishPortalClose()
      }, 400)
    } else {
      finishPortalClose()
    }
    return
  }

  panel?.classList.remove('is-open')
  wrap.classList.remove('is-open')
  document.documentElement.style.overflow = ''
  returnFocus()
}

function teardownStoreInfo(wrap: HTMLElement): void {
  const state = infoStates.get(wrap)
  if (!state) return

  state.repositionCleanup?.()
  state.repositionCleanup = null

  if (state.open) {
    state.open = false
    const { panel } = state
    panel?.classList.remove('is-open')
    wrap.classList.remove('is-open')
    setHtbarPanelHidden(wrap, true)
    state.trigger.setAttribute('aria-expanded', 'false')
    document.documentElement.style.overflow = ''
    document.removeEventListener('click', state.boundOutsideClick, true)
    document.removeEventListener('keydown', state.boundEscape, true)

    if (state.panelPortaled && panel && state.panelAnchor?.parentNode && state.panelParent) {
      removeHtbarPortalTheme(panel)
      panel.classList.remove('htbar__dropdown--portaled', 'is-open')
      clearHtbarPortalInlineStyles(panel)
      state.panelParent.insertBefore(panel, state.panelAnchor)
      state.panelParent.removeChild(state.panelAnchor)
      state.panelAnchor = null
      state.panelParent = null
      state.panelPortaled = false
    }
  }
  infoStates.delete(wrap)
}

// ─── Section registration ───────────────────────────────

function initSection(container: HTMLElement): void {
  initRotators(container)
  initStoreInfo(container)
  initCustomSelectsInContainer(container)
}

function destroySection(container: HTMLElement): void {
  destroyRotators(container)
  destroyStoreInfo(container)
  destroyCustomSelectsInContainer(container)
}

export function registerHeaderTopBarSection(): void {
  registerSection('header-top-bar', initSection, destroySection)
}
