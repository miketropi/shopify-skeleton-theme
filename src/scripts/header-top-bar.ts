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

interface StoreInfoState {
  wrap: HTMLElement
  trigger: HTMLElement
  card: HTMLElement | null
  overlay: HTMLElement | null
  open: boolean
  tween: gsap.core.Timeline | null
  boundOutsideClick: (e: MouseEvent) => void
  boundEscape: (e: KeyboardEvent) => void
}

const mobileMq = window.matchMedia('(max-width: 35.99em)')
const infoStates = new WeakMap<HTMLElement, StoreInfoState>()

function htbarPanel(wrap: HTMLElement): HTMLElement | null {
  return wrap.querySelector<HTMLElement>('.htbar__dropdown')
}

function setHtbarPanelHidden(wrap: HTMLElement, hidden: boolean): void {
  const panel = htbarPanel(wrap)
  if (panel) {
    panel.setAttribute('aria-hidden', hidden ? 'true' : 'false')
  }
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

  const overlay = wrap.querySelector<HTMLElement>('[data-htbar-overlay]')
  const card = wrap.querySelector<HTMLElement>('.htbar__card')

  const boundOutsideClick = (e: MouseEvent): void => {
    if (!wrap.contains(e.target as Node)) closeStoreInfo(wrap)
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
    card,
    overlay,
    open: false,
    tween: null,
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

  if (overlay) {
    overlay.addEventListener('click', () => closeStoreInfo(wrap))
  }
}

function openStoreInfo(wrap: HTMLElement): void {
  const state = infoStates.get(wrap)
  if (!state || state.open) return
  state.open = true
  state.tween?.kill()

  wrap.classList.add('is-open')
  setHtbarPanelHidden(wrap, false)
  state.trigger.setAttribute('aria-expanded', 'true')

  document.addEventListener('click', state.boundOutsideClick, true)
  document.addEventListener('keydown', state.boundEscape, true)

  if (state.card) {
    requestAnimationFrame(() => {
      const el = firstFocusableIn(state.card!)
      el?.focus()
    })
  }

  if (mobileMq.matches && state.card && state.overlay) {
    document.documentElement.style.overflow = 'hidden'

    const tl = gsap.timeline()

    tl.fromTo(
      state.overlay,
      { visibility: 'visible', opacity: 0, pointerEvents: 'none' },
      { opacity: 1, pointerEvents: 'auto', duration: 0.3, ease: 'power2.out' },
      0,
    )

    tl.fromTo(
      state.card,
      { y: '100%' },
      { y: '0%', duration: 0.45, ease: 'power3.out' },
      0.05,
    )

    state.tween = tl
  }
}

function closeStoreInfo(wrap: HTMLElement): void {
  const state = infoStates.get(wrap)
  if (!state || !state.open) return
  state.open = false
  state.tween?.kill()

  setHtbarPanelHidden(wrap, true)
  state.trigger.setAttribute('aria-expanded', 'false')

  document.removeEventListener('click', state.boundOutsideClick, true)
  document.removeEventListener('keydown', state.boundEscape, true)

  const returnFocus = (): void => {
    state.trigger.focus()
  }

  if (mobileMq.matches && state.card && state.overlay) {
    const tl = gsap.timeline({
      onComplete() {
        wrap.classList.remove('is-open')
        document.documentElement.style.overflow = ''
        gsap.set(state.overlay!, { visibility: 'hidden', opacity: 0, pointerEvents: 'none' })
        returnFocus()
      },
    })

    tl.to(state.card, {
      y: '100%',
      duration: 0.32,
      ease: 'power2.in',
    }, 0)

    tl.to(state.overlay, {
      opacity: 0,
      pointerEvents: 'none',
      duration: 0.25,
      ease: 'power2.in',
    }, 0.06)

    state.tween = tl
  } else {
    wrap.classList.remove('is-open')
    document.documentElement.style.overflow = ''
    returnFocus()
  }
}

function teardownStoreInfo(wrap: HTMLElement): void {
  const state = infoStates.get(wrap)
  if (!state) return

  state.tween?.kill()
  if (state.open) {
    state.open = false
    wrap.classList.remove('is-open')
    setHtbarPanelHidden(wrap, true)
    state.trigger.setAttribute('aria-expanded', 'false')
    document.documentElement.style.overflow = ''
    document.removeEventListener('click', state.boundOutsideClick, true)
    document.removeEventListener('keydown', state.boundEscape, true)
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
