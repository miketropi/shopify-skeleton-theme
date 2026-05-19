import gsap from 'gsap'

type CollListContainer = HTMLElement & {
  __collListTeardown?: () => void
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isDesignMode(): boolean {
  return Boolean((window as Window & { Shopify?: { designMode?: boolean } }).Shopify?.designMode)
}

function whenWindowLoaded(): Promise<void> {
  if (document.readyState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    window.addEventListener('load', () => resolve(), { once: true })
  })
}

async function waitReadyForReveal(designMode: boolean): Promise<void> {
  if (!designMode) await whenWindowLoaded()
  await new Promise<void>((r) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => r())
    })
  })
}

function waitForSectionVisible(
  el: HTMLElement,
  signal: AbortSignal,
  designMode: boolean,
): Promise<void> {
  if (designMode) return Promise.resolve()

  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    let settled = false
    let obs: IntersectionObserver

    const cleanup = (): void => {
      obs?.disconnect()
    }

    const finish = (): void => {
      if (settled) return
      settled = true
      signal.removeEventListener('abort', onAbort)
      cleanup()
      window.clearTimeout(fallbackTimer)
      resolve()
    }

    const onAbort = (): void => {
      if (settled) return
      settled = true
      signal.removeEventListener('abort', onAbort)
      cleanup()
      window.clearTimeout(fallbackTimer)
      reject(new DOMException('Aborted', 'AbortError'))
    }

    signal.addEventListener('abort', onAbort)

    const fallbackTimer = window.setTimeout(finish, 14000)

    obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            finish()
            return
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    )

    obs.observe(el)
  })
}

function setActive(container: HTMLElement, index: number): void {
  const items = container.querySelectorAll<HTMLElement>('[data-coll-list-item]')
  const media = container.querySelectorAll<HTMLElement>('[data-coll-list-media]')

  items.forEach((el, i) => {
    el.classList.toggle('is-active', i === index)
  })

  media.forEach((el, i) => {
    const on = i === index
    el.classList.toggle('is-active', on)
    el.setAttribute('aria-hidden', on ? 'false' : 'true')
  })
}

/** Matches `mq-up('md')` in _section-collection-list.scss (two-column layout). */
const COLL_LIST_TWO_COL_MQ = '(min-width: 48em)'
const COLL_LIST_STICKY_HEIGHT_EPS = 2

/**
 * Sticks the shorter of the two columns on md+; clears classes below the breakpoint.
 * Recalculates on resize / column content size changes.
 */
function setupCollListStickyColumn(
  media: HTMLElement,
  entries: HTMLElement,
  signal: AbortSignal,
): void {
  const mq = window.matchMedia(COLL_LIST_TWO_COL_MQ)
  let rafId = 0

  const clearSticky = (): void => {
    media.classList.remove('coll-list__col--sticky')
    entries.classList.remove('coll-list__col--sticky')
  }

  const update = (): void => {
    if (signal.aborted) return
    clearSticky()
    if (!mq.matches) return

    const hMedia = media.offsetHeight
    const hEntries = entries.offsetHeight

    if (hMedia + COLL_LIST_STICKY_HEIGHT_EPS < hEntries) {
      media.classList.add('coll-list__col--sticky')
    } else if (hEntries + COLL_LIST_STICKY_HEIGHT_EPS < hMedia) {
      entries.classList.add('coll-list__col--sticky')
    }
  }

  const scheduleUpdate = (): void => {
    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      rafId = 0
      update()
    })
  }

  const onMqChange = (): void => {
    scheduleUpdate()
  }

  mq.addEventListener('change', onMqChange)

  const ro = new ResizeObserver(scheduleUpdate)
  ro.observe(media)
  ro.observe(entries)

  scheduleUpdate()

  signal.addEventListener(
    'abort',
    () => {
      mq.removeEventListener('change', onMqChange)
      ro.disconnect()
      cancelAnimationFrame(rafId)
      clearSticky()
    },
    { once: true },
  )
}

function bindListInteraction(container: HTMLElement, signal: AbortSignal): void {
  const entries = container.querySelectorAll<HTMLElement>('[data-coll-list-entry]')
  if (entries.length === 0) return

  const mqFineHover = window.matchMedia('(hover: hover) and (pointer: fine)')

  const activateFromLink = (link: HTMLElement): void => {
    const raw = link.dataset.collListIndex
    const idx = raw != null ? parseInt(raw, 10) : NaN
    if (!Number.isFinite(idx) || idx < 0) return
    setActive(container, idx)
  }

  entries.forEach((link) => {
    if (mqFineHover.matches) {
      link.addEventListener('mouseenter', () => activateFromLink(link), { signal })
    }
    link.addEventListener('pointerdown', () => activateFromLink(link), { signal })
  })

  container.addEventListener(
    'focusin',
    (e) => {
      const t = e.target as HTMLElement | null
      const link = t?.closest<HTMLElement>('[data-coll-list-entry]')
      if (!link || !container.contains(link)) return
      activateFromLink(link)
    },
    { signal },
  )
}

function revealSection(
  container: HTMLElement,
  mediaEl: HTMLElement | null,
  listItems: HTMLElement[],
  reduced: boolean,
): gsap.core.Timeline {
  if (reduced) {
    const targets = [...listItems, ...(mediaEl ? [mediaEl] : [])]
    gsap.set(targets, { autoAlpha: 1, x: 0, y: 0 })
    container.classList.add('coll-list--revealed')
    return gsap.timeline()
  }

  const tl = gsap.timeline({
    onComplete: () => {
      container.classList.add('coll-list--revealed')
      if (mediaEl) gsap.set(mediaEl, { clearProps: 'transform' })
      gsap.set(listItems, { clearProps: 'transform' })
    },
  })

  if (mediaEl) {
    tl.to(
      mediaEl,
      {
        autoAlpha: 1,
        x: 0,
        duration: 0.72,
        ease: 'power3.out',
      },
      0,
    )
  }

  tl.to(
    listItems,
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.58,
      stagger: 0.065,
      ease: 'power2.out',
    },
    mediaEl ? 0.14 : 0,
  )

  return tl
}

export function init(container: HTMLElement): void {
  const root = container as CollListContainer
  const abort = new AbortController()
  const { signal } = abort
  let revealTimeline: gsap.core.Timeline | null = null

  const mediaEl = container.querySelector<HTMLElement>('.coll-list__media')
  const mediaMotionEl = mediaEl?.querySelector<HTMLElement>('.coll-list__media-motion') ?? null
  const mediaAnimateTarget = mediaMotionEl ?? mediaEl
  const listItems = Array.from(container.querySelectorAll<HTMLElement>('.coll-list__item'))

  const teardown = (): void => {
    revealTimeline?.kill()
    revealTimeline = null
    const targets = [...listItems, ...(mediaAnimateTarget ? [mediaAnimateTarget] : [])]
    gsap.killTweensOf(targets)
    container.classList.remove('coll-list--revealed')
    abort.abort()
  }
  root.__collListTeardown = teardown

  bindListInteraction(container, signal)

  const entriesCol = container.querySelector<HTMLElement>('.coll-list__entries')
  if (mediaEl && entriesCol) {
    setupCollListStickyColumn(mediaEl, entriesCol, signal)
  }

  if (listItems.length === 0 && !mediaEl) {
    container.classList.add('coll-list--revealed')
    return
  }

  const reduced = prefersReducedMotion()
  const designMode = isDesignMode()
  const animateOnScroll = container.dataset.collListEntranceScroll !== 'false'

  if (reduced) {
    revealTimeline = revealSection(container, mediaAnimateTarget, listItems, true)
    return
  }

  if (mediaAnimateTarget) gsap.set(mediaAnimateTarget, { autoAlpha: 0, x: -28 })
  if (listItems.length > 0) gsap.set(listItems, { autoAlpha: 0, y: 22 })

  const waitScroll = animateOnScroll && !designMode
    ? waitForSectionVisible(container, signal, designMode)
    : Promise.resolve()

  void Promise.all([waitReadyForReveal(designMode), waitScroll])
    .catch(() => {})
    .then(() => {
      if (signal.aborted) return
      revealTimeline = revealSection(container, mediaAnimateTarget, listItems, false)
    })
}

export function destroy(container: HTMLElement): void {
  const root = container as CollListContainer
  root.__collListTeardown?.()
  delete root.__collListTeardown
}
