import gsap from 'gsap'

/**
 * ARIA tabs for PDP: tab/panel sync, keyboard roving, arrow / Home / End.
 * Accordion layout: viewport clips; body holds padding and supplies scrollHeight.
 */
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function tabAccordionRoot(host: HTMLElement): HTMLElement | null {
  return host.querySelector('.main-product__tabs-accordion')
}

function tabAccordionItems(host: HTMLElement): HTMLDetailsElement[] {
  const root = tabAccordionRoot(host)
  if (!root) return []
  return Array.from(root.querySelectorAll<HTMLDetailsElement>('.main-product__tab-accordion'))
}

function accordionViewport(details: HTMLDetailsElement): HTMLElement | null {
  return details.querySelector<HTMLElement>('.main-product__tab-accordion-viewport')
}

function accordionBody(details: HTMLDetailsElement): HTMLElement | null {
  return details.querySelector<HTMLElement>('.main-product__tab-accordion-body')
}

function initProductTabsAccordionGsap(host: HTMLElement, signal: AbortSignal): void {
  if (prefersReducedMotion()) return

  const root = tabAccordionRoot(host)
  if (!root) return

  const easeClose = 'sine.inOut'
  const easeOpen = 'power2.out'
  const durClose = 0.48
  const durOpen = 0.52
  /** Start opening while previous row is still closing — shared motion reads smoother than close-then-open. */
  const switchOverlap = 0.14

  for (const details of tabAccordionItems(host)) {
    details.classList.add('main-product__tab-accordion--anim')
  }

  root.addEventListener(
    'click',
    (e: MouseEvent) => {
      const t = e.target
      if (!(t instanceof Element)) return
      const summary = t.closest('summary')
      if (!summary || !root.contains(summary)) return
      const details = summary.closest('details')
      if (!details || !(details instanceof HTMLDetailsElement) || !root.contains(details)) return

      e.preventDefault()

      const vp = accordionViewport(details)
      const body = accordionBody(details)
      if (!vp || !body) return

      if (details.open) {
        gsap.killTweensOf(vp)
        const current = vp.getBoundingClientRect().height || body.scrollHeight
        gsap.set(vp, { height: current, overflow: 'hidden' })
        gsap.to(vp, {
          height: 0,
          duration: durClose,
          ease: easeClose,
          onComplete: () => {
            details.open = false
            gsap.set(vp, { clearProps: 'height,overflow' })
          },
        })
        return
      }

      const others = tabAccordionItems(host).filter((d) => d !== details && d.open)

      for (const d of others) {
        const ovp = accordionViewport(d)
        const obody = accordionBody(d)
        if (!ovp || !obody) continue
        gsap.killTweensOf(ovp)
        const h = ovp.getBoundingClientRect().height || obody.scrollHeight
        gsap.set(ovp, { height: h, overflow: 'hidden' })
      }

      gsap.killTweensOf(vp)
      gsap.set(vp, { height: 0, overflow: 'hidden' })
      details.open = true

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const targetH = body.scrollHeight
          if (targetH <= 0) {
            details.open = false
            gsap.set(vp, { clearProps: 'height,overflow' })
            return
          }

          if (!others.length) {
            gsap.fromTo(
              vp,
              { height: 0 },
              {
                height: targetH,
                duration: durOpen,
                ease: easeOpen,
                onComplete: () => {
                  gsap.set(vp, { height: 'auto', overflow: 'visible' })
                },
              }
            )
            return
          }

          const tl = gsap.timeline()
          for (const d of others) {
            const ovp = accordionViewport(d)
            if (!ovp) continue
            tl.to(
              ovp,
              {
                height: 0,
                duration: durClose,
                ease: easeClose,
                onComplete: () => {
                  d.open = false
                  gsap.set(ovp, { clearProps: 'height,overflow' })
                },
              },
              0
            )
          }
          tl.fromTo(
            vp,
            { height: 0 },
            {
              height: targetH,
              duration: durOpen,
              ease: easeOpen,
              onComplete: () => {
                gsap.set(vp, { height: 'auto', overflow: 'visible' })
              },
            },
            switchOverlap
          )
        })
      })
    },
    { capture: true, signal }
  )
}

export function cleanupProductTabsAccordionGsap(root: HTMLElement): void {
  const host = root.querySelector<HTMLElement>('[data-product-tabs]')
  if (!host || host.dataset.tabsLayout?.trim() !== 'accordion') return

  for (const details of tabAccordionItems(host)) {
    const vp = accordionViewport(details)
    if (vp) {
      gsap.killTweensOf(vp)
      gsap.set(vp, { clearProps: 'height,overflow' })
    }
    details.classList.remove('main-product__tab-accordion--anim')
  }
}

export function initProductDetailTabs(
  root: HTMLElement,
  signal: AbortSignal
): void {
  const tabsHost = root.querySelector<HTMLElement>('[data-product-tabs]')
  if (!tabsHost) return

  const layout = tabsHost.dataset.tabsLayout?.trim() || 'top'
  if (layout === 'accordion') {
    initProductTabsAccordionGsap(tabsHost, signal)
    return
  }

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
