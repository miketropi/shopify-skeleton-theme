import gsap from 'gsap'
import { init as initHeaderLayout, destroy as destroyHeaderLayout } from './sections/header'
import { registerSection } from './section-registry'

const SECTION_TYPE = 'header'
const DESKTOP_NAV_MQ = '(min-width: 62em)'

const SUBMENU_OPEN_DURATION = 0.46
const SUBMENU_CLOSE_DURATION = 0.34
const SUBMENU_OPEN_EASE = 'power3.out'
const SUBMENU_CLOSE_EASE = 'power3.inOut'
const SUBMENU_STAGGER = 0.038
const SUBMENU_ITEM_SHIFT = 10

const FOCUSABLE_SELECTOR =
  'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'

function isDesktopNav(): boolean {
  return window.matchMedia(DESKTOP_NAV_MQ).matches
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getFocusableIn(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') return false
    if (el.closest('[hidden]')) return false
    return true
  })
}

function panelForToggle(button: HTMLButtonElement): HTMLElement | null {
  const id = button.getAttribute('aria-controls')
  return id ? document.getElementById(id) : null
}

function submenuListItems(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(':scope > li'))
}

function killSubmenuAnimations(panel: HTMLElement): void {
  gsap.killTweensOf(panel)
  gsap.killTweensOf(submenuListItems(panel))
}

function clearPanelInlineStyles(panel: HTMLElement): void {
  gsap.set(panel, { clearProps: 'height,overflow,opacity' })
  gsap.set(submenuListItems(panel), { clearProps: 'opacity,transform' })
}

function setSubmenuPanelOpen(panel: HTMLElement, open: boolean, instant: boolean): void {
  killSubmenuAnimations(panel)

  if (isDesktopNav() || instant || prefersReducedMotion()) {
    panel.hidden = !open
    clearPanelInlineStyles(panel)
    return
  }

  const items = submenuListItems(panel)

  if (open) {
    panel.hidden = false
    gsap.set(panel, { height: 'auto', overflow: 'hidden', opacity: 0 })
    const targetH = panel.scrollHeight
    gsap.set(panel, { height: 0, opacity: 0 })
    gsap.set(items, { opacity: 0, x: -SUBMENU_ITEM_SHIFT })

    gsap.to(panel, {
      height: targetH,
      opacity: 1,
      duration: SUBMENU_OPEN_DURATION,
      ease: SUBMENU_OPEN_EASE,
      overwrite: 'auto',
      onComplete: () => {
        gsap.set(panel, { height: 'auto', overflow: 'visible' })
        gsap.set(panel, { clearProps: 'opacity' })
      },
    })

    gsap.to(items, {
      opacity: 1,
      x: 0,
      duration: 0.34,
      stagger: SUBMENU_STAGGER,
      ease: 'power2.out',
      delay: 0.07,
      overwrite: 'auto',
    })
    return
  }

  if (panel.hidden) return

  gsap.set(panel, { height: panel.scrollHeight, overflow: 'hidden' })

  gsap.to(items, {
    opacity: 0,
    x: -SUBMENU_ITEM_SHIFT * 0.6,
    duration: 0.2,
    stagger: { each: 0.012, from: 'end' },
    ease: 'power2.in',
    overwrite: 'auto',
  })

  gsap.to(panel, {
    height: 0,
    opacity: 0,
    duration: SUBMENU_CLOSE_DURATION,
    ease: SUBMENU_CLOSE_EASE,
    delay: 0.05,
    overwrite: 'auto',
    onComplete: () => {
      panel.hidden = true
      clearPanelInlineStyles(panel)
    },
  })
}

export function registerHeaderSection(): void {
  registerSection(
    SECTION_TYPE,
    (container) => {
      initHeaderLayout(container)

      const toggle = container.querySelector<HTMLButtonElement>('[data-header-menu-toggle]')
      const nav = container.querySelector<HTMLElement>('[data-header-nav]')
      const backdrop = container.querySelector<HTMLElement>('[data-header-backdrop]')
      const closeBtn = container.querySelector<HTMLButtonElement>('[data-header-menu-close]')
      if (!toggle || !nav) return

      const abort = new AbortController()
      const { signal } = abort

      const forEachSubmenuToggle = (
        callback: (button: HTMLButtonElement, panel: HTMLElement | null) => void
      ): void => {
        container.querySelectorAll<HTMLButtonElement>('[data-header-submenu-toggle]').forEach((button) => {
          callback(button, panelForToggle(button))
        })
      }

      function killAllSubmenuAnimations(): void {
        container.querySelectorAll<HTMLElement>('.header__submenu, .header__submenu-nested').forEach((el) => {
          killSubmenuAnimations(el)
        })
      }

      function closeAllSubmenus(instant = true): void {
        forEachSubmenuToggle((button, panel) => {
          button.setAttribute('aria-expanded', 'false')
          if (panel) setSubmenuPanelOpen(panel, false, instant)
        })
      }

      function closeSiblingSubmenus(submenuToggle: HTMLButtonElement, instant: boolean): void {
        const parentUl = submenuToggle.closest('ul')
        if (!parentUl) return
        parentUl.querySelectorAll<HTMLButtonElement>('[data-header-submenu-toggle]').forEach((button) => {
          if (button === submenuToggle) return
          button.setAttribute('aria-expanded', 'false')
          const panel = panelForToggle(button)
          if (panel) setSubmenuPanelOpen(panel, false, instant)
        })
      }

      function syncNavAccessibility(open: boolean): void {
        if (isDesktopNav()) {
          nav?.removeAttribute('inert')
          nav?.removeAttribute('aria-hidden')
          return
        }
        if (open) {
          nav?.removeAttribute('inert')
          nav?.removeAttribute('aria-hidden')
        } else {
          nav?.setAttribute('inert', '')
          nav?.setAttribute('aria-hidden', 'true')
        }
      }

      function setOpen(open: boolean): void {
        if (open) {
          container.closest('.shopify-section')?.classList.remove('shopify-section--header-hidden')
        }
        container.classList.toggle('site-header--nav-open', open)
        toggle?.setAttribute('aria-expanded', open ? 'true' : 'false')
        if (!isDesktopNav()) {
          nav?.setAttribute('aria-modal', open ? 'true' : 'false')
        } else {
          nav?.removeAttribute('aria-modal')
        }
        syncNavAccessibility(open)
        if (backdrop) {
          backdrop.toggleAttribute('inert', !open)
          backdrop.setAttribute('aria-hidden', open ? 'false' : 'true')
        }
        document.documentElement.classList.toggle('header-nav-open', open)
        if (!open) closeAllSubmenus(true)
        if (open && !isDesktopNav()) {
          requestAnimationFrame(() => {
            const focusTarget = closeBtn ?? getFocusableIn(nav ?? document.body)[0]
            focusTarget?.focus({ preventScroll: true })
          })
        }
      }

      function close(): void {
        setOpen(false)
      }

      function onNavClick(e: MouseEvent): void {
        const subToggle = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-header-submenu-toggle]')
        if (subToggle) {
          e.preventDefault()
          e.stopPropagation()
          const list = panelForToggle(subToggle)
          if (!list) return
          const opening = subToggle.getAttribute('aria-expanded') !== 'true'
          if (opening) closeSiblingSubmenus(subToggle, false)
          subToggle.setAttribute('aria-expanded', opening ? 'true' : 'false')
          setSubmenuPanelOpen(list, opening, false)
          return
        }

        if ((e.target as HTMLElement).closest('a') && !isDesktopNav()) close()
      }

      function onNavKeydown(e: KeyboardEvent): void {
        if (!container.classList.contains('site-header--nav-open') || isDesktopNav()) return
        if (e.key !== 'Tab') return
        const focusables = getFocusableIn(nav ?? document.body)
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement
        if (e.shiftKey) {
          if (active === first || !nav?.contains(active)) {
            e.preventDefault()
            last.focus()
          }
        } else if (active === last) {
          e.preventDefault()
          first.focus()
        }
      }

      function onDocumentKeydown(e: KeyboardEvent): void {
        if (e.key !== 'Escape') return
        if (container.querySelector('[data-header-submenu-toggle][aria-expanded="true"]')) {
          e.preventDefault()
          closeAllSubmenus(prefersReducedMotion())
          return
        }
        if (container.classList.contains('site-header--nav-open')) {
          e.preventDefault()
          close()
          toggle?.focus()
        }
      }

      if (!isDesktopNav()) {
        nav.setAttribute('inert', '')
        nav.setAttribute('aria-hidden', 'true')
      }

      toggle.addEventListener(
        'click',
        () => {
          if (isDesktopNav()) return
          setOpen(!container.classList.contains('site-header--nav-open'))
        },
        { signal }
      )

      closeBtn?.addEventListener('click', close, { signal })
      backdrop?.addEventListener('click', close, { signal })
      nav.addEventListener('click', onNavClick, { signal })
      nav.addEventListener('keydown', onNavKeydown, { signal })

      document.addEventListener(
        'click',
        (e) => {
          if (container.contains(e.target as Node)) return
          closeAllSubmenus(true)
        },
        { signal }
      )

      document.addEventListener('keydown', onDocumentKeydown, { signal })

      const mq = window.matchMedia(DESKTOP_NAV_MQ)
      const onMqChange = (): void => {
        killAllSubmenuAnimations()
        closeAllSubmenus(true)
        if (isDesktopNav()) {
          close()
          nav.removeAttribute('aria-modal')
        } else {
          syncNavAccessibility(container.classList.contains('site-header--nav-open'))
        }
      }
      mq.addEventListener('change', onMqChange)

      const extended = container as HTMLElement & { __headerTeardown?: () => void }
      extended.__headerTeardown = () => {
        killAllSubmenuAnimations()
        abort.abort()
        mq.removeEventListener('change', onMqChange)
      }
    },
    (container) => {
      container.querySelectorAll<HTMLElement>('.header__submenu, .header__submenu-nested').forEach((el) => {
        killSubmenuAnimations(el)
      })
      const extended = container as HTMLElement & { __headerTeardown?: () => void }
      extended.__headerTeardown?.()
      delete extended.__headerTeardown
      destroyHeaderLayout(container)
      container.classList.remove('site-header--nav-open', 'site-header--scrolled')
      container.closest('.shopify-section')?.classList.remove('shopify-section--header-hidden')
      document.documentElement.classList.remove('header-nav-open')
      container.querySelector<HTMLElement>('[data-header-nav]')?.removeAttribute('aria-modal')
    }
  )
}
