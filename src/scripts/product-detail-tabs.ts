/**
 * ARIA tabs for PDP: tab/panel sync, keyboard roving, arrow / Home / End.
 * Used by the product-tabs section (and any container that includes `[data-product-tabs]`).
 */
export function initProductDetailTabs(
  root: HTMLElement,
  signal: AbortSignal
): void {
  const tabsHost = root.querySelector<HTMLElement>('[data-product-tabs]')
  if (!tabsHost) return

  const tabButtons = (): HTMLButtonElement[] =>
    Array.from(tabsHost.querySelectorAll<HTMLButtonElement>('[data-product-tab][role="tab"]'))

  const tabPanels = (): HTMLElement[] =>
    Array.from(tabsHost.querySelectorAll<HTMLElement>('[data-product-tab-panel][role="tabpanel"]'))

  function showTab(key: string): void {
    for (const btn of tabButtons()) {
      const k = btn.getAttribute('data-product-tab') || ''
      const on = k === key
      btn.setAttribute('aria-selected', on ? 'true' : 'false')
      btn.tabIndex = on ? 0 : -1
    }
    for (const panel of tabPanels()) {
      const k = panel.getAttribute('data-product-tab-panel') || ''
      if (k === key) {
        panel.removeAttribute('hidden')
      } else {
        panel.setAttribute('hidden', '')
      }
    }
  }

  tabsHost.addEventListener(
    'click',
    (e) => {
      const t = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-product-tab]')
      if (!t || !tabsHost.contains(t)) return
      const key = t.getAttribute('data-product-tab')
      if (key) showTab(key)
    },
    { signal }
  )

  tabsHost.addEventListener(
    'keydown',
    (e) => {
      const cur = document.activeElement
      if (!cur || !(cur instanceof HTMLButtonElement) || !cur.hasAttribute('data-product-tab')) return
      if (!tabsHost.contains(cur)) return
      const list = tabButtons()
      const idx = list.indexOf(cur)
      if (idx < 0) return
      let next = idx
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        next = (idx + 1) % list.length
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        next = (idx - 1 + list.length) % list.length
      } else if (e.key === 'Home') {
        e.preventDefault()
        next = 0
      } else if (e.key === 'End') {
        e.preventDefault()
        next = list.length - 1
      } else {
        return
      }
      const k = list[next]?.getAttribute('data-product-tab')
      if (k) {
        showTab(k)
        list[next]?.focus()
      }
    },
    { signal }
  )
}
