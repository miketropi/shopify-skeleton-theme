import { registerSection } from './section-registry'

const SECTION_TYPE = 'collection-grid'
const DESKTOP_MQ = '(min-width: 75em)'

type Teardown = () => void

function init(container: HTMLElement): void {
  const abort = new AbortController()
  const { signal } = abort
  const sectionId = container.dataset.sectionId ?? ''
  const mqlDesktop = window.matchMedia(DESKTOP_MQ)
  let priceTimer: ReturnType<typeof setTimeout> | null = null
  let fetchController: AbortController | null = null

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

    const toolbar = incoming.querySelector('.mcol__toolbar')
    const body = incoming.querySelector('.mcol__body')

    const existingToolbar = container.querySelector('.mcol__toolbar')
    const existingBody = container.querySelector('.mcol__body')

    if (toolbar && existingToolbar) {
      existingToolbar.innerHTML = toolbar.innerHTML
    }
    if (body && existingBody) {
      existingBody.replaceWith(body)
    }

    if (keepDrawerOpen) {
      const panel = container.querySelector<HTMLElement>('[data-filter-panel]')
      const backdrop = container.querySelector<HTMLElement>('[data-filter-backdrop]')
      const toggle = container.querySelector<HTMLButtonElement>('[data-filter-toggle]')
      if (panel && !mqlDesktop.matches) {
        panel.classList.add('is-open')
        backdrop?.classList.add('is-visible')
        toggle?.setAttribute('aria-expanded', 'true')
        document.body.style.overflow = 'hidden'
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
        toggleFilterDrawer(container, mqlDesktop)
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
      const card = (e.target as HTMLElement).closest<HTMLElement>('.mcol__card--has-alt')
      if (!card) return
      const secondary = card.querySelector<HTMLImageElement>('.mcol__card-img--secondary')
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

  // ── Desktop breakpoint: reset drawer state ─────────────

  mqlDesktop.addEventListener(
    'change',
    () => {
      if (mqlDesktop.matches) {
        closeFilterDrawer(container)
        container
          .querySelector<HTMLElement>('.mcol__body')
          ?.classList.remove('mcol__body--filters-collapsed')
      }
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
    if (priceTimer) clearTimeout(priceTimer)
    fetchController?.abort()
    abort.abort()
  }
}

// ── Filter drawer helpers ──────────────────────────────────

function toggleFilterDrawer(container: HTMLElement, mqlDesktop: MediaQueryList): void {
  const panel = container.querySelector<HTMLElement>('[data-filter-panel]')
  if (!panel) return

  if (mqlDesktop.matches) {
    const body = container.querySelector<HTMLElement>('.mcol__body')
    if (!body) return
    const isCollapsed = body.classList.toggle('mcol__body--filters-collapsed')
    container
      .querySelector<HTMLButtonElement>('[data-filter-toggle]')
      ?.setAttribute('aria-expanded', String(!isCollapsed))
    return
  }

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

  panel?.classList.add('is-open')
  backdrop?.classList.add('is-visible')
  toggle?.setAttribute('aria-expanded', 'true')
  document.body.style.overflow = 'hidden'
}

function closeFilterDrawer(container: HTMLElement): void {
  const panel = container.querySelector<HTMLElement>('[data-filter-panel]')
  const backdrop = container.querySelector<HTMLElement>('[data-filter-backdrop]')
  const toggle = container.querySelector<HTMLButtonElement>('[data-filter-toggle]')

  panel?.classList.remove('is-open')
  backdrop?.classList.remove('is-visible')
  toggle?.setAttribute('aria-expanded', 'false')
  document.body.style.overflow = ''
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
