/**
 * Accessible custom select: native `<select>` stays in the DOM; combobox UI when
 * `data-custom-select` is present. The options panel is portaled to `<body>` with
 * fixed positioning so parent `overflow` cannot clip it — better on tablet/mobile.
 *
 * Optional on the root: `data-custom-select-align="left" | "center" | "right"` — how
 * the anchored menu lines up with the trigger (default center). Ignored in compact
 * bottom-sheet mode.
 */

import gsap from 'gsap'

const roots = new Map<HTMLElement, () => void>()

const PANEL_Z = 10050
const BACKDROP_Z = 10049
const GUTTER = 8
const VIEW_MARGIN = 10
const SHEET_EDGE = 12

let bodyScrollLockCount = 0

function lockBodyScroll(): void {
  bodyScrollLockCount++
  if (bodyScrollLockCount === 1) {
    document.documentElement.style.overflow = 'hidden'
  }
}

function unlockBodyScroll(): void {
  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1)
  if (bodyScrollLockCount === 0) {
    document.documentElement.style.overflow = ''
  }
}

function syncOptionStates(
  rows: HTMLElement[],
  activeIdx: number,
  selectedIdx: number,
): void {
  rows.forEach((row, i) => {
    row.setAttribute('aria-selected', i === selectedIdx ? 'true' : 'false')
    row.classList.toggle('is-active', i === activeIdx)
  })
}

function scrollOptionIntoView(option: HTMLElement): void {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  option.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
}

type DropdownAlign = 'left' | 'center' | 'right'

function parseDropdownAlign(el: HTMLElement): DropdownAlign {
  const raw = (el.dataset.customSelectAlign || '').trim().toLowerCase()
  if (raw === 'left' || raw === 'right') return raw
  return 'center'
}

export interface EnhanceCustomSelectOptions {
  submitFormOnChange?: boolean
  /** Anchored panel only; overrides `data-custom-select-align` on root. */
  align?: DropdownAlign
}

function resolveDropdownAlign(
  root: HTMLElement,
  opts: EnhanceCustomSelectOptions,
): DropdownAlign {
  const a = opts.align
  if (a === 'left' || a === 'right' || a === 'center') return a
  return parseDropdownAlign(root)
}

function isCompactViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 47.99em)').matches
}

export function enhanceCustomSelectRoot(
  root: HTMLElement,
  options: EnhanceCustomSelectOptions = {},
): (() => void) | null {
  const select = root.querySelector('select')
  if (!select || select.multiple || select.disabled) return null
  if (root.querySelector(':scope .cselect')) return null

  const opts = Array.from(select.querySelectorAll('option')) as HTMLOptionElement[]
  if (opts.length === 0) return null

  const autoSubmit = options.submitFormOnChange ?? root.hasAttribute('data-select-submit')

  let assignedSyntheticId = false
  const baseId =
    select.id ||
    `csel-${
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
        : Math.random().toString(36).slice(2, 12)
    }`
  if (!select.id) {
    select.id = baseId
    assignedSyntheticId = true
  }

  const listboxId = `${select.id}-listbox`
  const btnId = `${select.id}-btn`

  select.classList.add('visually-hidden')
  select.tabIndex = -1

  const wrap = document.createElement('div')
  wrap.className = 'cselect'

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'cselect__btn'
  btn.id = btnId
  btn.setAttribute('role', 'combobox')
  btn.setAttribute('aria-haspopup', 'listbox')
  btn.setAttribute('aria-expanded', 'false')
  btn.setAttribute('aria-controls', listboxId)

  const labelEl = root.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(select.id)}"]`)
  if (labelEl?.id) {
    btn.setAttribute('aria-labelledby', labelEl.id)
  } else if (labelEl?.textContent?.trim()) {
    btn.setAttribute('aria-label', labelEl.textContent.trim())
  }

  const valueEl = document.createElement('span')
  valueEl.className = 'cselect__value'

  const icon = document.createElement('span')
  icon.className = 'cselect__icon'
  icon.setAttribute('aria-hidden', 'true')
  icon.innerHTML =
    '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5 6 7.5 9 4.5"/></svg>'

  btn.append(valueEl, icon)

  const chevron = icon.querySelector('svg')
  if (chevron) {
    gsap.set(chevron, { transformOrigin: '50% 50%', rotation: 0 })
  }

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const panel = document.createElement('div')
  panel.className = 'cselect__panel cselect__panel--portal'
  panel.hidden = true
  panel.style.zIndex = String(PANEL_Z)

  const backdrop = document.createElement('div')
  backdrop.className = 'cselect__backdrop'
  backdrop.hidden = true
  backdrop.style.zIndex = String(BACKDROP_Z)

  const list = document.createElement('ul')
  list.className = 'cselect__list'
  list.id = listboxId
  list.setAttribute('role', 'listbox')
  list.tabIndex = -1

  const listItems: HTMLElement[] = []

  opts.forEach((opt, i) => {
    const li = document.createElement('li')
    li.className = 'cselect__option'
    li.id = `${select.id}-opt-${i}`
    li.setAttribute('role', 'option')
    li.textContent = opt.textContent?.trim() || opt.value
    li.dataset.value = opt.value
    if (opt.disabled) {
      li.setAttribute('aria-disabled', 'true')
      li.classList.add('is-disabled')
    }
    list.appendChild(li)
    listItems.push(li)
  })

  panel.appendChild(list)
  wrap.append(btn)
  select.insertAdjacentElement('afterend', wrap)
  document.body.appendChild(panel)

  const MENU_THEME_PROPS = [
    '--cselect-focus',
    '--cselect-menu-bg',
    '--cselect-menu-fg',
    '--cselect-menu-row-hover',
    '--cselect-menu-row-active',
    '--cselect-menu-separator',
    '--cselect-menu-radius',
    '--cselect-shadow',
  ] as const

  function syncMenuThemeFromWrap(): void {
    const cs = getComputedStyle(wrap)
    for (const prop of MENU_THEME_PROPS) {
      const v = cs.getPropertyValue(prop).trim()
      if (v) panel.style.setProperty(prop, v)
    }
  }

  function clearMenuThemeOnPanel(): void {
    for (const prop of MENU_THEME_PROPS) {
      panel.style.removeProperty(prop)
    }
  }

  const dropdownAlign = resolveDropdownAlign(root, options)
  let anchoredFlipAbove = false

  function anchoredPanelTransformOrigin(flipAbove: boolean): string {
    const y = flipAbove ? '100%' : '0%'
    if (dropdownAlign === 'left') return `0% ${y}`
    if (dropdownAlign === 'right') return `100% ${y}`
    return `50% ${y}`
  }

  let open = false
  let sheetMode = false
  let scrollLockedByThis = false
  let activeIdx = Math.max(
    0,
    opts.findIndex((o) => o.selected && !o.disabled),
  )
  if (activeIdx < 0) activeIdx = 0
  let selectedIdx = activeIdx

  function applyPanelGeometry(): void {
    sheetMode = isCompactViewport()
    panel.classList.toggle('cselect__panel--sheet', sheetMode)
    panel.classList.toggle('cselect__panel--anchored', !sheetMode)

    if (sheetMode) {
      panel.style.left = `${SHEET_EDGE}px`
      panel.style.right = `${SHEET_EDGE}px`
      panel.style.width = 'auto'
      panel.style.top = 'auto'
      panel.style.bottom = `calc(${SHEET_EDGE}px + env(safe-area-inset-bottom, 0px))`
      const maxH = Math.min(window.innerHeight * 0.52, 420)
      panel.style.maxHeight = `${maxH}px`
      return
    }

    anchoredFlipAbove = false

    const rect = btn.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const belowY = rect.bottom + GUTTER
    const margin = VIEW_MARGIN

    let width = Math.max(rect.width, 200)
    width = Math.min(width, vw - 2 * margin)
    let left: number
    if (dropdownAlign === 'left') {
      left = rect.left
    } else if (dropdownAlign === 'right') {
      left = rect.right - width
    } else {
      left = rect.left + (rect.width - width) / 2
    }
    left = Math.min(Math.max(margin, left), vw - width - margin)

    panel.style.left = `${Math.round(left)}px`
    panel.style.width = `${Math.round(width)}px`
    panel.style.right = 'auto'
    panel.style.bottom = 'auto'

    const maxHCap = Math.min(320, Math.floor(vh * 0.48))
    let maxH = Math.min(maxHCap, vh - belowY - margin)
    maxH = Math.max(120, maxH)

    panel.style.top = `${Math.round(belowY)}px`
    panel.style.maxHeight = `${maxH}px`
    panel.style.transformOrigin = anchoredPanelTransformOrigin(false)

    void panel.offsetHeight
    const br = panel.getBoundingClientRect()
    if (br.bottom > vh - margin) {
      anchoredFlipAbove = true
      const spaceAbove = rect.top - margin - GUTTER
      const maxAbove = Math.min(maxHCap, Math.max(120, spaceAbove))
      panel.style.maxHeight = `${maxAbove}px`
      void panel.offsetHeight
      const h = panel.getBoundingClientRect().height
      let top = rect.top - GUTTER - h
      top = Math.max(margin, top)
      panel.style.top = `${Math.round(top)}px`
      panel.style.transformOrigin = anchoredPanelTransformOrigin(true)
    }
  }

  function showBackdrop(): void {
    backdrop.hidden = false
    document.body.appendChild(backdrop)
    if (reduceMotion) {
      gsap.set(backdrop, { opacity: 1 })
      return
    }
    gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: 'power2.out' })
  }

  function hideBackdrop(): void {
    if (backdrop.parentNode == null) return
    if (reduceMotion) {
      backdrop.remove()
      backdrop.hidden = true
      return
    }
    gsap.killTweensOf(backdrop)
    gsap.to(backdrop, {
      opacity: 0,
      duration: 0.18,
      ease: 'power2.in',
      onComplete: () => {
        backdrop.remove()
        backdrop.hidden = true
      },
    })
  }

  function syncPanelPosition(): void {
    if (!open) return
    applyPanelGeometry()
  }

  function animateChevron(expanded: boolean): void {
    if (!chevron) return
    gsap.killTweensOf(chevron)
    const target = expanded ? 180 : 0
    if (reduceMotion) {
      gsap.set(chevron, { rotation: target })
      return
    }
    gsap.to(chevron, {
      rotation: target,
      duration: expanded ? 0.48 : 0.3,
      ease: expanded ? 'expo.out' : 'expo.inOut',
    })
  }

  function killPanelTweens(): void {
    gsap.killTweensOf(panel)
  }

  function runOpenPanelMotion(): void {
    killPanelTweens()
    if (reduceMotion) {
      gsap.set(panel, { opacity: 1, y: 0, scale: 1, clearProps: 'transform' })
      return
    }
    if (sheetMode) {
      gsap.set(panel, {
        opacity: 0,
        y: 28,
        scale: 1,
        transformOrigin: '50% 100%',
      })
      gsap.to(panel, {
        opacity: 1,
        y: 0,
        duration: 0.38,
        ease: 'power3.out',
      })
      return
    }
    const origin = anchoredPanelTransformOrigin(anchoredFlipAbove)
    gsap.set(panel, {
      opacity: 0,
      y: -12,
      scale: 0.97,
      transformOrigin: origin,
    })
    gsap.to(panel, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.36,
      ease: 'power3.out',
    })
  }

  function runClosePanelMotion(onDone: () => void): void {
    killPanelTweens()
    if (reduceMotion) {
      onDone()
      return
    }
    if (sheetMode) {
      gsap.to(panel, {
        opacity: 0,
        y: 20,
        duration: 0.24,
        ease: 'power3.in',
        onComplete: onDone,
      })
      return
    }
    gsap.set(panel, {
      transformOrigin: anchoredPanelTransformOrigin(anchoredFlipAbove),
    })
    gsap.to(panel, {
      opacity: 0,
      y: -8,
      scale: 0.98,
      duration: 0.22,
      ease: 'power3.in',
      onComplete: onDone,
    })
  }

  const selectedOption = (): HTMLOptionElement => opts[selectedIdx] ?? opts[0]

  function updateButtonLabel(): void {
    const o = selectedOption()
    valueEl.textContent = o.textContent?.trim() || o.value
  }

  function applySelection(index: number): void {
    if (!select) return
    const o = opts[index]
    if (!o || o.disabled) return
    const prevIndex = select.selectedIndex
    selectedIdx = index
    activeIdx = index
    select.selectedIndex = index
    const changed = prevIndex !== index
    if (changed) {
      select.dispatchEvent(new Event('change', { bubbles: true }))
    }
    syncOptionStates(listItems, activeIdx, selectedIdx)
    updateButtonLabel()
    if (autoSubmit && changed) {
      const form = select.form
      if (form) {
        if ('requestSubmit' in form && typeof form.requestSubmit === 'function') {
          form.requestSubmit()
        } else {
          form.submit()
        }
      }
    }
  }

  function highlight(index: number): void {
    let next = index
    const len = opts.length
    if (next < 0) next = 0
    if (next >= len) next = len - 1
    while (opts[next]?.disabled && next < len - 1) next++
    while (opts[next]?.disabled && next > 0) next--
    if (opts[next]?.disabled) return
    activeIdx = next
    syncOptionStates(listItems, activeIdx, selectedIdx)
    btn.setAttribute('aria-activedescendant', listItems[activeIdx].id)
    scrollOptionIntoView(listItems[activeIdx])
  }

  function openPanel(): void {
    if (open) return
    killPanelTweens()
    open = true
    applyPanelGeometry()
    syncMenuThemeFromWrap()
    wrap.classList.add('is-open')
    panel.hidden = false
    btn.setAttribute('aria-expanded', 'true')
    if (sheetMode) {
      showBackdrop()
      lockBodyScroll()
      scrollLockedByThis = true
    }
    animateChevron(true)
    runOpenPanelMotion()
    activeIdx = selectedIdx
    syncOptionStates(listItems, activeIdx, selectedIdx)
    btn.setAttribute('aria-activedescendant', listItems[activeIdx].id)
    scrollOptionIntoView(listItems[activeIdx])
  }

  function closePanel(): void {
    if (!open) return
    open = false
    wrap.classList.remove('is-open')
    btn.setAttribute('aria-expanded', 'false')
    btn.removeAttribute('aria-activedescendant')
    activeIdx = selectedIdx
    syncOptionStates(listItems, activeIdx, selectedIdx)
    if (scrollLockedByThis) {
      hideBackdrop()
      unlockBodyScroll()
      scrollLockedByThis = false
    }
    animateChevron(false)
    runClosePanelMotion(() => {
      panel.hidden = true
      if (!reduceMotion) {
        gsap.set(panel, { clearProps: 'opacity,transform,scale,transformOrigin' })
      }
      panel.style.top = ''
      panel.style.left = ''
      panel.style.right = ''
      panel.style.bottom = ''
      panel.style.width = ''
      panel.style.maxHeight = ''
      clearMenuThemeOnPanel()
    })
  }

  updateButtonLabel()
  syncOptionStates(listItems, activeIdx, selectedIdx)

  const ac = new AbortController()
  const { signal } = ac

  const onViewportChange = (): void => {
    syncPanelPosition()
  }
  window.addEventListener('resize', onViewportChange, { signal })
  window.addEventListener('scroll', onViewportChange, { signal, capture: true })

  const compactMq = window.matchMedia('(max-width: 47.99em)')
  const onCompactMq = (): void => {
    if (!open) return
    const wasSheet = sheetMode
    killPanelTweens()
    applyPanelGeometry()
    if (wasSheet && !sheetMode) {
      gsap.killTweensOf(backdrop)
      backdrop.remove()
      backdrop.hidden = true
      if (scrollLockedByThis) {
        unlockBodyScroll()
        scrollLockedByThis = false
      }
    } else if (!wasSheet && sheetMode) {
      showBackdrop()
      lockBodyScroll()
      scrollLockedByThis = true
    }
    if (reduceMotion) {
      gsap.set(panel, { opacity: 1, clearProps: 'transform' })
    } else {
      gsap.set(panel, { opacity: 1, y: 0, scale: 1 })
    }
  }
  compactMq.addEventListener('change', onCompactMq)

  backdrop.addEventListener(
    'pointerdown',
    (e) => {
      e.preventDefault()
      if (open) closePanel()
    },
    { signal },
  )

  btn.addEventListener(
    'click',
    (e) => {
      e.preventDefault()
      if (open) closePanel()
      else openPanel()
    },
    { signal },
  )

  btn.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        if (!open) {
          openPanel()
          highlight(e.key === 'ArrowDown' ? selectedIdx + 1 : selectedIdx - 1)
        } else {
          highlight(e.key === 'ArrowDown' ? activeIdx + 1 : activeIdx - 1)
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (open) {
          applySelection(activeIdx)
          closePanel()
        } else {
          openPanel()
        }
      } else if (e.key === 'Escape') {
        if (open) {
          e.preventDefault()
          closePanel()
          btn.focus()
        }
      } else if (e.key === 'Home' && open) {
        e.preventDefault()
        highlight(0)
      } else if (e.key === 'End' && open) {
        e.preventDefault()
        highlight(opts.length - 1)
      }
    },
    { signal },
  )

  list.addEventListener(
    'click',
    (e) => {
      const t = (e.target as HTMLElement).closest('li[role="option"]')
      if (!t || !list.contains(t) || t.classList.contains('is-disabled')) return
      const idx = listItems.indexOf(t as HTMLElement)
      if (idx >= 0) {
        applySelection(idx)
        closePanel()
        btn.focus()
      }
    },
    { signal },
  )

  wrap.addEventListener(
    'focusout',
    (e) => {
      if (!open) return
      const next = e.relatedTarget as Node | null
      if (next && (wrap.contains(next) || panel.contains(next))) return
      closePanel()
    },
    { signal },
  )

  const onDocPointer = (e: Event): void => {
    if (!open) return
    const t = e.target as Node
    if (wrap.contains(t) || panel.contains(t) || (backdrop.isConnected && backdrop.contains(t)))
      return
    closePanel()
  }
  document.addEventListener('pointerdown', onDocPointer, { signal, capture: true })

  return () => {
    compactMq.removeEventListener('change', onCompactMq)
    ac.abort()
    gsap.killTweensOf(panel)
    if (chevron) gsap.killTweensOf(chevron)
    gsap.killTweensOf(backdrop)
    if (scrollLockedByThis) {
      unlockBodyScroll()
      scrollLockedByThis = false
    }
    open = false
    backdrop.remove()
    panel.remove()
    wrap.remove()
    select.classList.remove('visually-hidden')
    select.removeAttribute('tabindex')
    if (assignedSyntheticId) select.removeAttribute('id')
  }
}

export function initCustomSelectsInContainer(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>('[data-custom-select]').forEach((el) => {
    if (el.dataset.customSelectReady === 'true') return
    const teardown = enhanceCustomSelectRoot(el)
    if (teardown) {
      el.dataset.customSelectReady = 'true'
      roots.set(el, teardown)
    }
  })
}

export function destroyCustomSelectsInContainer(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>('[data-custom-select]').forEach((el) => {
    if (el.dataset.customSelectReady !== 'true') return
    roots.get(el)?.()
    roots.delete(el)
    delete el.dataset.customSelectReady
  })
}
