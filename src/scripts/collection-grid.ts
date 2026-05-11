import gsap from 'gsap'
import { initMcolHeroParallax } from './mcol-hero-parallax'
import { registerSection } from './section-registry'
import { bindTcardHoverVideos } from './tcard-hover-video'

const SECTION_TYPE = 'collection-grid'
const DESKTOP_MQ = '(min-width: 75em)'

type FilterLayout = 'offcanvas' | 'toggle' | 'overlay' | 'sidebar'

type Teardown = () => void

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getFilterLayout(container: HTMLElement): FilterLayout {
  const v = container.dataset.filterLayout?.trim().toLowerCase()
  if (v === 'toggle' || v === 'overlay' || v === 'sidebar') return v
  return 'offcanvas'
}

/** Sidebar template uses a sticky column at desktop; below that breakpoint it behaves like inline toggle. */
function getEffectiveFilterLayout(container: HTMLElement): FilterLayout {
  const base = getFilterLayout(container)
  if (base !== 'sidebar') return base
  return window.matchMedia(DESKTOP_MQ).matches ? 'sidebar' : 'toggle'
}

function getOffcanvasSide(container: HTMLElement): 'left' | 'right' {
  const v = container.dataset.filterOffcanvas?.trim().toLowerCase()
  return v === 'right' ? 'right' : 'left'
}

function filterTweenTargets(container: HTMLElement): HTMLElement[] {
  const layout = getEffectiveFilterLayout(container)
  if (layout === 'sidebar') return []
  const panel = container.querySelector<HTMLElement>('[data-filter-panel]')
  const backdrop = container.querySelector<HTMLElement>('[data-filter-backdrop]')
  if (layout === 'toggle') {
    return [panel].filter((el): el is HTMLElement => el !== null)
  }
  return [panel, backdrop].filter((el): el is HTMLElement => el !== null)
}

function seedClosedFilterPanel(container: HTMLElement): void {
  if (prefersReducedMotion()) return
  const base = getFilterLayout(container)
  if (base === 'sidebar' && window.matchMedia(DESKTOP_MQ).matches) return
  const layout = getEffectiveFilterLayout(container)
  const panel = container.querySelector<HTMLElement>('[data-filter-panel]')
  const backdrop = container.querySelector<HTMLElement>('[data-filter-backdrop]')
  if (!panel || panel.classList.contains('is-open')) return

  if (layout === 'offcanvas') {
    const side = getOffcanvasSide(container)
    gsap.set(panel, { x: side === 'left' ? '-100%' : '100%' })
  } else if (layout === 'toggle') {
    gsap.set(panel, { maxHeight: 0, opacity: 0, overflow: 'hidden' })
  } else if (layout === 'overlay') {
    gsap.set(panel, { y: -12, autoAlpha: 0 })
    if (backdrop) gsap.set(backdrop, { autoAlpha: 0 })
  }
}

function init(container: HTMLElement): void {
  const abort = new AbortController()
  const { signal } = abort
  const sectionId = container.dataset.sectionId ?? ''
  const mqlDesktop = window.matchMedia(DESKTOP_MQ)
  let priceTimer: ReturnType<typeof setTimeout> | null = null
  let fetchController: AbortController | null = null
  const reducedMotion = prefersReducedMotion()
  if (!reducedMotion) {
    container.classList.add('mcol--filter-anim-gsap')
    seedClosedFilterPanel(container)
  }

  const teardownHeroParallax = initMcolHeroParallax(container)

  bindTcardHoverVideos(container, signal)

  // ── Section Rendering API fetch ────────────────────────

  async function fetchSection(url: string): Promise<string> {
    const fetchUrl = new URL(url, window.location.origin)
    fetchUrl.searchParams.set('sections', sectionId)

    fetchController?.abort()
    fetchController = new AbortController()

    const resp = await fetch(fetchUrl.toString(), { signal: fetchController.signal })
    if (!resp.ok) throw new Error(`Section fetch failed: ${resp.status}`)
    const json = (await resp.json()) as Record<string, string>
    return json[sectionId]
  }

  function replaceContent(html: string, keepDrawerOpen: boolean): void {
    const tmp = document.createElement('div')
    tmp.innerHTML = html

    const incoming = tmp.querySelector<HTMLElement>(`[data-section-id="${sectionId}"]`)
    if (!incoming) return

    const incomingStack = incoming.querySelector('.mcol__toolbar-stack')
    const existingStack = container.querySelector('.mcol__toolbar-stack')
    if (incomingStack && existingStack) {
      existingStack.innerHTML = incomingStack.innerHTML
    } else {
      const toolbar = incoming.querySelector('.mcol__toolbar')
      const existingToolbar = container.querySelector('.mcol__toolbar')
      if (toolbar && existingToolbar) {
        existingToolbar.innerHTML = toolbar.innerHTML
      }
    }

    const body = incoming.querySelector('.mcol__body')
    const existingBody = container.querySelector('.mcol__body')
    if (body && existingBody) {
      existingBody.replaceWith(body)
    }

    bindTcardHoverVideos(container, signal)

    if (!keepDrawerOpen && !prefersReducedMotion()) {
      seedClosedFilterPanel(container)
    }

    if (keepDrawerOpen) {
      const base = getFilterLayout(container)
      if (base === 'sidebar' && window.matchMedia(DESKTOP_MQ).matches) return
      const layout = getEffectiveFilterLayout(container)
      const panel = container.querySelector<HTMLElement>('[data-filter-panel]')
      const backdrop = container.querySelector<HTMLElement>('[data-filter-backdrop]')
      const toggle = container.querySelector<HTMLButtonElement>('[data-filter-toggle]')
      if (panel) {
        gsap.killTweensOf(filterTweenTargets(container))
        panel.classList.add('is-open')
        toggle?.setAttribute('aria-expanded', 'true')
        if (layout === 'offcanvas') {
          backdrop?.classList.add('is-visible')
          document.body.style.overflow = 'hidden'
          gsap.set(panel, { x: 0 })
          if (backdrop) gsap.set(backdrop, { autoAlpha: 1 })
        } else if (layout === 'toggle') {
          gsap.set(panel, { maxHeight: 'none', opacity: 1, overflow: 'hidden' })
        } else if (layout === 'overlay') {
          backdrop?.classList.add('is-visible')
          gsap.set(panel, { y: 0, autoAlpha: 1 })
          if (backdrop) gsap.set(backdrop, { autoAlpha: 1 })
        }
      }
    }
  }

  async function navigateAjax(
    url: string,
    opts: { pushState?: boolean; keepDrawer?: boolean; scrollToGrid?: boolean } = {}
  ): Promise<void> {
    const { pushState = true, keepDrawer = false, scrollToGrid = false } = opts

    container.classList.add('is-loading')

    try {
      const html = await fetchSection(url)
      replaceContent(html, keepDrawer)

      if (pushState) {
        const clean = new URL(url, window.location.origin)
        clean.searchParams.delete('sections')
        history.pushState({}, '', clean.toString())
      }

      if (scrollToGrid) {
        const main = container.querySelector<HTMLElement>('.mcol__main')
        main?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      window.location.href = url
    } finally {
      container.classList.remove('is-loading')
    }
  }

  // ── Delegated click handler ────────────────────────────

  container.addEventListener(
    'click',
    (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // Filter toggle
      if (target.closest('[data-filter-toggle]')) {
        e.preventDefault()
        toggleFilterDrawer(container)
        return
      }

      // Filter close
      if (target.closest('[data-filter-close]')) {
        e.preventDefault()
        closeFilterDrawer(container)
        return
      }

      // Filter option links
      const filterLink = target.closest<HTMLAnchorElement>('.mcol__filter-option')
      if (filterLink && !filterLink.classList.contains('mcol__filter-option--disabled')) {
        e.preventDefault()
        navigateAjax(filterLink.href, { keepDrawer: true })
        return
      }

      // Active filter pills
      const pill = target.closest<HTMLAnchorElement>('.mcol__pill')
      if (pill) {
        e.preventDefault()
        navigateAjax(pill.href)
        return
      }

      // Clear all (filter footer)
      const clearLink = target.closest<HTMLAnchorElement>('.mcol__filters-clear')
      if (clearLink) {
        e.preventDefault()
        navigateAjax(clearLink.href)
        return
      }

      // Empty state clear link
      const emptyLink = target.closest<HTMLAnchorElement>('.mcol__empty-link')
      if (emptyLink) {
        e.preventDefault()
        navigateAjax(emptyLink.href)
        return
      }

      // Pagination links
      const pagLink = target.closest<HTMLAnchorElement>('.mcol__pag a')
      if (pagLink) {
        e.preventDefault()
        navigateAjax(pagLink.href, { scrollToGrid: true })
        return
      }
    },
    { signal }
  )

  // ── Backdrop click (close drawer) ──────────────────────

  container.addEventListener(
    'click',
    (e: MouseEvent) => {
      if ((e.target as HTMLElement).matches('[data-filter-backdrop]')) {
        closeFilterDrawer(container)
      }
    },
    { signal }
  )

  // ── Delegated change handler (sort + price) ────────────

  container.addEventListener(
    'change',
    (e: Event) => {
      const target = e.target as HTMLElement

      // Sort select
      if (target.matches('[data-sort-select]')) {
        const select = target as HTMLSelectElement
        const url = new URL(window.location.href)
        url.searchParams.set('sort_by', select.value)
        url.searchParams.delete('page')
        navigateAjax(url.toString(), { scrollToGrid: true })
        return
      }

      // Price range inputs (debounced)
      if (target.matches('[data-price-range]')) {
        if (priceTimer) clearTimeout(priceTimer)
        priceTimer = setTimeout(() => {
          const inputs = container.querySelectorAll<HTMLInputElement>('[data-price-range]')
          const url = new URL(window.location.href)
          inputs.forEach((input) => {
            if (input.value !== '') {
              url.searchParams.set(input.name, input.value)
            } else {
              url.searchParams.delete(input.name)
            }
          })
          url.searchParams.delete('page')
          navigateAjax(url.toString(), { keepDrawer: true })
        }, 800)
      }
    },
    { signal }
  )

  // ── Secondary image eager load ─────────────────────────

  container.addEventListener(
    'mouseenter',
    (e) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('.tcard--has-alt')
      if (!card) return
      const secondary = card.querySelector<HTMLImageElement>('.tcard__img--secondary')
      if (secondary && !secondary.complete) {
        secondary.loading = 'eager'
      }
    },
    { signal, capture: true }
  )

  // ── Keyboard: Escape closes drawer ─────────────────────

  document.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const panel = container.querySelector<HTMLElement>('[data-filter-panel]')
        if (panel?.classList.contains('is-open')) {
          closeFilterDrawer(container)
          container.querySelector<HTMLButtonElement>('[data-filter-toggle]')?.focus()
        }
      }
    },
    { signal }
  )

  // ── Desktop breakpoint: close panel ────────────────────

  mqlDesktop.addEventListener(
    'change',
    () => {
      if (getFilterLayout(container) === 'sidebar') {
        const panel = container.querySelector<HTMLElement>('[data-filter-panel]')
        const toggle = container.querySelector<HTMLButtonElement>('[data-filter-toggle]')
        gsap.killTweensOf(filterTweenTargets(container))
        document.body.style.overflow = ''
        if (mqlDesktop.matches) {
          panel?.classList.remove('is-open')
          toggle?.setAttribute('aria-expanded', 'false')
          if (panel) gsap.set(panel, { clearProps: 'maxHeight,opacity,overflow' })
        } else if (!prefersReducedMotion()) {
          seedClosedFilterPanel(container)
        }
        return
      }
      closeFilterDrawer(container)
    },
    { signal }
  )

  // ── Popstate: handle browser back/forward ──────────────

  window.addEventListener(
    'popstate',
    () => {
      navigateAjax(window.location.href, { pushState: false })
    },
    { signal }
  )

  // ── Teardown ───────────────────────────────────────────

  const extended = container as HTMLElement & { __collectionGridTeardown?: Teardown }
  extended.__collectionGridTeardown = () => {
    teardownHeroParallax()
    if (priceTimer) clearTimeout(priceTimer)
    fetchController?.abort()
    gsap.killTweensOf(filterTweenTargets(container))
    document.body.style.overflow = ''
    abort.abort()
  }
}

// ── Filter drawer helpers ──────────────────────────────────

function toggleFilterDrawer(container: HTMLElement): void {
  const panel = container.querySelector<HTMLElement>('[data-filter-panel]')
  if (!panel) return

  if (panel.classList.contains('is-open')) {
    closeFilterDrawer(container)
  } else {
    openFilterDrawer(container)
  }
}

function openFilterDrawer(container: HTMLElement): void {
  const panel = container.querySelector<HTMLElement>('[data-filter-panel]')
  const backdrop = container.querySelector<HTMLElement>('[data-filter-backdrop]')
  const toggle = container.querySelector<HTMLButtonElement>('[data-filter-toggle]')
  if (!panel) return

  const layout = getEffectiveFilterLayout(container)
  if (layout === 'sidebar') return

  const reduced = prefersReducedMotion()

  panel.classList.add('is-open')
  toggle?.setAttribute('aria-expanded', 'true')

  if (layout === 'offcanvas') {
    backdrop?.classList.add('is-visible')
    document.body.style.overflow = 'hidden'
  } else if (layout === 'overlay') {
    backdrop?.classList.add('is-visible')
  }

  if (reduced) {
    if (layout === 'toggle') {
      // CSS handles visibility for reduced-motion toggle
    }
    return
  }

  gsap.killTweensOf(filterTweenTargets(container))

  if (layout === 'offcanvas') {
    const side = getOffcanvasSide(container)
    const fromX = side === 'left' ? '-100%' : '100%'
    gsap.set(panel, { x: fromX })
    if (backdrop) gsap.set(backdrop, { autoAlpha: 0 })

    gsap.to(backdrop, {
      autoAlpha: 1,
      duration: 0.38,
      ease: 'power2.out',
    })
    gsap.to(panel, {
      x: 0,
      duration: 0.48,
      ease: 'power3.out',
    })
    return
  }

  if (layout === 'toggle') {
    gsap.set(panel, { overflow: 'hidden', maxHeight: 0, opacity: 0 })
    const raw = Math.max(panel.scrollHeight, 1)
    gsap.to(panel, {
      maxHeight: raw,
      opacity: 1,
      duration: 0.45,
      ease: 'power2.out',
      onComplete: () => {
        gsap.set(panel, { maxHeight: 'none', overflow: 'hidden' })
      },
    })
    return
  }

  // overlay
  gsap.set(panel, { y: -12 })
  if (backdrop) gsap.set(backdrop, { autoAlpha: 0 })
  gsap.to(backdrop, {
    autoAlpha: 1,
    duration: 0.32,
    ease: 'power2.out',
  })
  gsap.to(panel, {
    y: 0,
    autoAlpha: 1,
    duration: 0.38,
    ease: 'power3.out',
  })
}

function closeFilterDrawer(container: HTMLElement): void {
  const panel = container.querySelector<HTMLElement>('[data-filter-panel]')
  const backdrop = container.querySelector<HTMLElement>('[data-filter-backdrop]')
  const toggle = container.querySelector<HTMLButtonElement>('[data-filter-toggle]')
  if (!panel) return

  const base = getFilterLayout(container)
  if (base === 'sidebar' && window.matchMedia(DESKTOP_MQ).matches) {
    document.body.style.overflow = ''
    return
  }

  if (!panel.classList.contains('is-open')) {
    document.body.style.overflow = ''
    return
  }

  const layout = getEffectiveFilterLayout(container)
  const reduced = prefersReducedMotion()

  if (layout !== 'toggle') {
    toggle?.setAttribute('aria-expanded', 'false')
  }

  if (layout === 'toggle') {
    document.body.style.overflow = ''
    if (reduced) {
      toggle?.setAttribute('aria-expanded', 'false')
      panel.classList.remove('is-open')
      return
    }

    const h = Math.max(panel.scrollHeight, panel.getBoundingClientRect().height, 1)
    gsap.killTweensOf(filterTweenTargets(container))
    gsap.set(panel, { maxHeight: h, overflow: 'hidden' })
    gsap.to(panel, {
      maxHeight: 0,
      opacity: 0,
      duration: 0.45,
      ease: 'power2.out',
      onComplete: () => {
        gsap.set(panel, {
          maxHeight: 0,
          opacity: 0,
          overflow: 'hidden',
        })
        requestAnimationFrame(() => {
          panel.classList.remove('is-open')
          toggle?.setAttribute('aria-expanded', 'false')
        })
      },
    })
    return
  }

  if (layout === 'overlay') {
    if (reduced) {
      panel.classList.remove('is-open')
      backdrop?.classList.remove('is-visible')
      return
    }

    gsap.killTweensOf(filterTweenTargets(container))
    gsap.to(panel, {
      y: -12,
      autoAlpha: 0,
      duration: 0.32,
      ease: 'power2.in',
      onComplete: () => {
        panel.classList.remove('is-open')
        gsap.set(panel, { y: -12 })
      },
    })
    gsap.to(backdrop, {
      autoAlpha: 0,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: () => {
        backdrop?.classList.remove('is-visible')
      },
    })
    return
  }

  // offcanvas
  if (reduced) {
    panel.classList.remove('is-open')
    backdrop?.classList.remove('is-visible')
    document.body.style.overflow = ''
    gsap.set(panel, { clearProps: 'transform' })
    return
  }

  const side = getOffcanvasSide(container)
  const toX = side === 'left' ? '-100%' : '100%'
  gsap.killTweensOf(filterTweenTargets(container))

  gsap.to(panel, {
    x: toX,
    duration: 0.4,
    ease: 'power3.in',
    onComplete: () => {
      panel.classList.remove('is-open')
      gsap.set(panel, { clearProps: 'transform' })
      const p = container.querySelector<HTMLElement>('[data-filter-panel]')
      if (p && !p.classList.contains('is-open')) {
        gsap.set(p, { x: getOffcanvasSide(container) === 'left' ? '-100%' : '100%' })
      }
      document.body.style.overflow = ''
    },
  })
  gsap.to(backdrop, {
    autoAlpha: 0,
    duration: 0.32,
    ease: 'power2.in',
    onComplete: () => {
      backdrop?.classList.remove('is-visible')
    },
  })
}

// ── Section lifecycle ──────────────────────────────────────

function destroy(container: HTMLElement): void {
  const extended = container as HTMLElement & { __collectionGridTeardown?: Teardown }
  extended.__collectionGridTeardown?.()
  delete extended.__collectionGridTeardown
}

export function registerCollectionGridSection(): void {
  registerSection(SECTION_TYPE, init, destroy)
}
