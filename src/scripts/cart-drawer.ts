import gsap from 'gsap'

import { registerSection } from './section-registry'

const SECTION_TYPE = 'cart-drawer'
const SECTION_FILE = 'cart-drawer'

/** Capture phase so Escape reaches us even if a child calls stopPropagation() (common in embedded widgets). */
const DOC_KEYDOWN_CAPTURE = { capture: true }

type CartJson = { item_count: number }

function getShopify(): Window['Shopify'] | undefined {
  return typeof window !== 'undefined' ? window.Shopify : undefined
}

type StorefrontRoutes = {
  root: string
  cart_url: string
  cart_add_url: string
  cart_change_url: string
}

/** Liquid `routes` in theme.liquid is reliable; `window.Shopify.routes` can be missing on first paint. */
function getStorefrontRoutes(): StorefrontRoutes | null {
  const liquid = window.__themeRoutes
  const r = getShopify()?.routes
  const root = liquid?.root ?? r?.root
  const cart_url = liquid?.cart_url ?? r?.cart_url
  const cart_add_url = liquid?.cart_add_url ?? r?.cart_add_url
  const cart_change_url = liquid?.cart_change_url ?? r?.cart_change_url
  if (
    typeof root !== 'string' ||
    root.length === 0 ||
    typeof cart_url !== 'string' ||
    cart_url.length === 0 ||
    typeof cart_add_url !== 'string' ||
    cart_add_url.length === 0 ||
    typeof cart_change_url !== 'string' ||
    cart_change_url.length === 0
  ) {
    return null
  }
  return { root, cart_url, cart_add_url, cart_change_url }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getFocusable(root: HTMLElement): HTMLElement[] {
  const sel =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter(
    (el) => !el.hasAttribute('disabled') && el.closest('[hidden]') === null
  )
}

function createCartDrawerController(container: HTMLElement) {
  const routes = getStorefrontRoutes()
  const panel = container.querySelector<HTMLElement>('[data-cart-drawer-panel]')
  const overlay = container.querySelector<HTMLElement>('[data-cart-drawer-overlay]')
  const abort = new AbortController()
  const { signal } = abort

  let isOpen = false
  let triggerEl: HTMLElement | null = null
  const qtyTimers = new Map<string, number>()
  let busyDepth = 0
  /** Bumps when closing/reopening so deferred hide never runs after a cancelled close or stale instance. */
  let closeGeneration = 0

  const autoOpenAfterAdd = container.dataset.autoOpenAfterAdd === 'true'
  const strUpdated = container.dataset.i18nAnnounceUpdated ?? ''
  const strError = container.dataset.i18nAnnounceError ?? ''
  const drawerIsLeft = container.dataset.drawerPosition === 'left'
  const panelOffscreen = drawerIsLeft ? '-100%' : '100%'

  const DURATION_OPEN = 0.32
  const DURATION_CLOSE = 0.26
  const EASE_OPEN = 'power2.out'
  const EASE_CLOSE = 'power2.in'

  function killDrawerTweens(): void {
    if (!panel || !overlay) return
    gsap.killTweensOf([panel, overlay])
  }

  function setOpenTriggersExpanded(expanded: boolean): void {
    document.querySelectorAll<HTMLElement>('[data-cart-drawer-open]').forEach((el) => {
      el.setAttribute('aria-expanded', expanded ? 'true' : 'false')
    })
  }

  function lockScroll(lock: boolean): void {
    document.documentElement.style.overflow = lock ? 'hidden' : ''
  }

  function announce(message: string): void {
    const live = container.querySelector<HTMLElement>('[data-cart-drawer-live]')
    if (!live || !message) return
    live.textContent = ''
    requestAnimationFrame(() => {
      live.textContent = message
    })
  }

  async function fetchCartJson(): Promise<CartJson> {
    if (!routes) throw new Error('cart routes missing')
    const res = await fetch(`${routes.cart_url}.js`, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error('cart.js failed')
    return res.json() as Promise<CartJson>
  }

  const bodyScroll = container.querySelector<HTMLElement>('[data-cart-drawer-body]')

  function applyBusy(on: boolean): void {
    bodyScroll?.classList.toggle('cart-drawer__body--busy', on)
    if (panel) {
      if (on) panel.setAttribute('aria-busy', 'true')
      else panel.removeAttribute('aria-busy')
    }
  }

  function beginBusy(): void {
    busyDepth += 1
    if (busyDepth === 1) applyBusy(true)
  }

  function endBusy(): void {
    busyDepth = Math.max(0, busyDepth - 1)
    if (busyDepth === 0) applyBusy(false)
  }

  function updateHeaderCount(count: number): void {
    document.querySelectorAll<HTMLElement>('[data-header-cart-count]').forEach((el) => {
      el.textContent = String(count)
      if (count > 0) el.removeAttribute('hidden')
      else el.setAttribute('hidden', '')
    })
  }

  async function refreshDrawerBody(): Promise<void> {
    if (!routes) return
    const url = new URL(routes.root, window.location.href)
    url.searchParams.set('sections', SECTION_FILE)
    const res = await fetch(url.toString(), {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
    if (!res.ok) return
    const data = (await res.json()) as Record<string, string>
    const html = data[SECTION_FILE]
    if (!html) return
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const nextBody = doc.querySelector('[data-cart-drawer-body]')
    const bodyEl = container.querySelector('[data-cart-drawer-body]')
    if (nextBody && bodyEl) bodyEl.innerHTML = nextBody.innerHTML
  }

  async function syncAfterCartChange(announceMsg?: string): Promise<void> {
    beginBusy()
    try {
      const cart = await fetchCartJson()
      updateHeaderCount(cart.item_count)
      await refreshDrawerBody()
      window.dispatchEvent(
        new CustomEvent('theme:cart:change', { detail: { itemCount: cart.item_count } })
      )
      if (announceMsg) announce(announceMsg)
    } catch {
      announce(strError)
    } finally {
      endBusy()
    }
  }

  function moveFocusToOpener(savedTrigger: HTMLElement | null): void {
    const target =
      savedTrigger && document.body.contains(savedTrigger)
        ? savedTrigger
        : document.querySelector<HTMLElement>('[data-cart-drawer-open]')
    target?.focus({ preventScroll: true })
  }

  /** Apply hidden/aria-hidden only after focus has left the dialog (see double rAF in close). */
  function commitCloseDom(gen: number): void {
    if (gen !== closeGeneration) return
    if (!document.body.contains(container) || !panel || !overlay) return
    if (isOpen) return
    const ae0 = document.activeElement as HTMLElement | null
    if (ae0 && (ae0 === panel || panel.contains(ae0))) {
      moveFocusToOpener(null)
      let cur = document.activeElement as HTMLElement | null
      if (cur && (cur === panel || panel.contains(cur))) {
        cur.blur()
      }
      if (document.activeElement === panel) {
        panel.blur()
      }
    }
    killDrawerTweens()
    gsap.set(panel, { clearProps: 'transform' })
    gsap.set(overlay, { clearProps: 'opacity' })
    overlay.hidden = true
    panel.hidden = true
    panel.setAttribute('aria-hidden', 'true')
    container.classList.remove('cart-drawer--open')
    setOpenTriggersExpanded(false)
    lockScroll(false)
  }

  function scheduleCommitClose(gen: number): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        commitCloseDom(gen)
      })
    })
  }

  function resetDomClosed(): void {
    qtyTimers.forEach((id) => window.clearTimeout(id))
    qtyTimers.clear()
    if (!panel || !overlay) return
    killDrawerTweens()
    closeGeneration += 1
    const gen = closeGeneration
    isOpen = false
    const savedTrigger = triggerEl
    triggerEl = null
    moveFocusToOpener(savedTrigger)
    scheduleCommitClose(gen)
  }

  function onDocumentKeydown(e: KeyboardEvent): void {
    if (!panel || panel.hidden) return
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    if (!isOpen) return
    const ae = document.activeElement as HTMLElement | null
    if (
      e.key !== 'Tab' ||
      !ae ||
      (ae !== panel && !panel.contains(ae))
    ) {
      return
    }
    const focusables = getFocusable(panel)
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  function open(fromTrigger: HTMLElement | null): void {
    if (!panel || !overlay || isOpen || !panel.hidden) return
    killDrawerTweens()
    closeGeneration += 1
    isOpen = true
    triggerEl = fromTrigger
    overlay.hidden = false
    panel.hidden = false
    panel.setAttribute('aria-hidden', 'false')
    container.classList.add('cart-drawer--open')
    setOpenTriggersExpanded(true)
    lockScroll(true)

    const focusables = getFocusable(panel)
    const closeBtn = panel.querySelector<HTMLElement>('[data-cart-drawer-close]')
    ;(closeBtn ?? focusables[0])?.focus({ preventScroll: true })

    const reduced = prefersReducedMotion()
    if (reduced) {
      gsap.set(overlay, { opacity: 1 })
      gsap.set(panel, { x: 0 })
      return
    }

    gsap.set(overlay, { opacity: 0 })
    gsap.set(panel, { x: panelOffscreen })

    requestAnimationFrame(() => {
      gsap.to(overlay, { opacity: 1, duration: DURATION_OPEN * 0.75, ease: EASE_OPEN })
      gsap.to(panel, { x: 0, duration: DURATION_OPEN, ease: EASE_OPEN })
    })
  }

  function close(): void {
    if (!panel || !overlay) return
    // If a deferred commit failed, isOpen may already be false while the panel is still visible.
    if (!isOpen && panel.hidden && overlay.hidden) return
    killDrawerTweens()
    closeGeneration += 1
    const gen = closeGeneration
    isOpen = false
    const savedTrigger = triggerEl
    triggerEl = null
    moveFocusToOpener(savedTrigger)

    const reduced = prefersReducedMotion()
    if (reduced || panel.hidden) {
      scheduleCommitClose(gen)
      return
    }

    const tl = gsap.timeline({
      onComplete: () => {
        scheduleCommitClose(gen)
      },
    })
    tl.to(
      overlay,
      { opacity: 0, duration: DURATION_CLOSE * 0.75, ease: EASE_CLOSE },
      0
    )
    tl.to(panel, { x: panelOffscreen, duration: DURATION_CLOSE, ease: EASE_CLOSE }, 0)
  }

  async function changeLine(lineKey: string, quantity: number): Promise<void> {
    if (!routes) return
    beginBusy()
    try {
      const res = await fetch(`${routes.cart_change_url}.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: lineKey, quantity }),
      })
      if (!res.ok) {
        announce(strError)
        return
      }
      await syncAfterCartChange(strUpdated)
    } finally {
      endBusy()
    }
  }

  function scheduleQtyChange(lineKey: string, quantity: number): void {
    const prev = qtyTimers.get(lineKey)
    if (prev) window.clearTimeout(prev)
    const id = window.setTimeout(() => {
      qtyTimers.delete(lineKey)
      void changeLine(lineKey, quantity)
    }, 350)
    qtyTimers.set(lineKey, id)
  }

  document.addEventListener(
    'click',
    (e) => {
      const t = e.target as HTMLElement
      const opener = t.closest<HTMLElement>('[data-cart-drawer-open]')
      if (!opener) return
      e.preventDefault()
      const looksOpen = isOpen || (panel != null && !panel.hidden)
      if (looksOpen) {
        close()
      } else {
        open(opener)
      }
    },
    { signal, capture: true }
  )

  document.addEventListener('keydown', onDocumentKeydown, {
    ...DOC_KEYDOWN_CAPTURE,
    signal,
  })

  container.addEventListener(
    'click',
    (e) => {
      const t = e.target as HTMLElement
      if (t.closest('[data-cart-drawer-close]')) {
        e.preventDefault()
        close()
      } else if (t.closest('[data-cart-drawer-overlay]')) {
        close()
      }
    },
    { signal }
  )

  function onQtyAdjustment(e: Event): void {
    const input = e.target as HTMLInputElement
    if (!input.matches?.('[data-cart-drawer-qty]')) return
    const key = input.dataset.lineKey
    if (!key) return
    const qty = Number.parseInt(input.value, 10)
    if (Number.isNaN(qty)) return
    scheduleQtyChange(key, qty)
  }

  container.addEventListener('change', onQtyAdjustment, { signal })
  container.addEventListener('input', onQtyAdjustment, { signal })

  container.addEventListener(
    'click',
    (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-cart-drawer-remove]')
      if (!btn) return
      e.preventDefault()
      const key = btn.dataset.lineKey
      if (key) void changeLine(key, 0)
    },
    { signal }
  )

  return {
    open,
    close,
    abort,
    autoOpenAfterAdd,
    afterSuccessfulMutation: () => syncAfterCartChange(strUpdated),
    announceMessage: (msg: string) => announce(msg),
    defaultErrorMessage: () => strError,
    resetDomClosed,
  }
}

let activeController: ReturnType<typeof createCartDrawerController> | null = null

export function registerCartDrawerSection(): void {
  registerSection(
    SECTION_TYPE,
    (container) => {
      if (activeController) {
        activeController.resetDomClosed()
        activeController.abort.abort()
      }
      activeController = createCartDrawerController(container)
    },
    (container) => {
      if (activeController) {
        activeController.resetDomClosed()
        activeController.abort.abort()
      }
      if (container.contains(document.activeElement)) {
        const opener = document.querySelector<HTMLElement>('[data-cart-drawer-open]')
        ;(opener ?? document.body).focus()
      }
      activeController = null
      document.documentElement.style.overflow = ''
    }
  )
}

export function registerAjaxCartAdd(): void {
  document.addEventListener('submit', (e) => {
    const form = e.target
    if (!(form instanceof HTMLFormElement)) return
    if (!form.hasAttribute('data-ajax-add-to-cart')) return
    const routes = getStorefrontRoutes()
    if (!routes) return
    e.preventDefault()
    const fd = new FormData(form)
    void (async () => {
      const ctrl = activeController
      try {
        const res = await fetch(`${routes.cart_add_url}.js`, {
          method: 'POST',
          body: fd,
          headers: { Accept: 'application/json' },
        })
        const text = await res.text()
        if (!res.ok) {
          let description = ''
          try {
            const j = JSON.parse(text) as { description?: string }
            description = j.description?.trim() ?? ''
          } catch {
            /* ignore */
          }
          if (ctrl) ctrl.announceMessage(description || ctrl.defaultErrorMessage())
          return
        }
        await ctrl?.afterSuccessfulMutation()
        if (ctrl?.autoOpenAfterAdd) ctrl.open(null)
      } catch {
        if (ctrl) ctrl.announceMessage(ctrl.defaultErrorMessage())
      }
    })()
  })
}
