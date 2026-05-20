import gsap from 'gsap'
import {
  isDesignMode,
  prefersReducedMotion,
  waitForSectionVisible,
  whenWindowLoaded,
} from '../lib/carousel-section-entrance'

type BeforeAfterContainer = HTMLElement & {
  __beforeAfterTeardown?: () => void
}

const REVEALED = 'before-after--revealed'
const ENHANCED = 'before-after--enhanced'
const MIN_POS = 5
const MAX_POS = 95
const KEY_STEP = 5

function clampPosition(pct: number): number {
  return Math.min(MAX_POS, Math.max(MIN_POS, pct))
}

function loadImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve()
  return new Promise((resolve) => {
    const done = (): void => {
      img.removeEventListener('load', done)
      img.removeEventListener('error', done)
      resolve()
    }
    img.addEventListener('load', done)
    img.addEventListener('error', done)
  })
}

export function init(container: HTMLElement): void {
  const root = container as BeforeAfterContainer
  const abort = new AbortController()
  const { signal } = abort

  let revealTimeline: gsap.core.Timeline | null = null

  const teardown = (): void => {
    revealTimeline?.kill()
    revealTimeline = null
    const revealEls = container.querySelectorAll('[data-before-after-reveal]')
    gsap.killTweensOf(revealEls)
    const loadingEl = container.querySelector<HTMLElement>('[data-before-after-loading]')
    if (loadingEl) gsap.killTweensOf(loadingEl)
    container.classList.remove(REVEALED, ENHANCED)
    abort.abort()
  }
  root.__beforeAfterTeardown = teardown

  const compare = container.querySelector<HTMLElement>('[data-before-after-compare]')
  const handle = container.querySelector<HTMLButtonElement>('[data-before-after-handle]')
  if (!compare) return

  if (handle) {
    container.classList.add(ENHANCED)
  }

  const reduced = prefersReducedMotion()
  const designMode = isDesignMode()
  const animateOnScroll = container.dataset.beforeAfterEntranceScroll !== 'false'
  const revealEls = container.querySelectorAll<HTMLElement>('[data-before-after-reveal]')
  const loadingEl = container.querySelector<HTMLElement>('[data-before-after-loading]')

  const followCursor =
    container.dataset.beforeAfterInteraction === 'follow_cursor' && !reduced

  const setPosition = (pct: number): void => {
    const clamped = clampPosition(pct)
    compare.style.setProperty('--before-after-position', `${clamped}%`)
    if (handle) {
      handle.style.left = 'var(--before-after-position)'
      handle.setAttribute('aria-valuenow', String(Math.round(clamped)))
    }
    const divider = container.querySelector<HTMLElement>('[data-before-after-divider]')
    if (divider) divider.style.left = 'var(--before-after-position)'
  }

  if (handle) {
    const positionFromClientX = (clientX: number): number => {
      const rect = compare.getBoundingClientRect()
      if (rect.width <= 0) return MIN_POS
      const x = clientX - rect.left
      return clampPosition((x / rect.width) * 100)
    }

    const onKeyDown = (e: KeyboardEvent): void => {
      const current = parseInt(handle.getAttribute('aria-valuenow') || '50', 10)
      let next = current
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        next = current - KEY_STEP
        e.preventDefault()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        next = current + KEY_STEP
        e.preventDefault()
      } else if (e.key === 'Home') {
        next = MIN_POS
        e.preventDefault()
      } else if (e.key === 'End') {
        next = MAX_POS
        e.preventDefault()
      } else {
        return
      }
      setPosition(next)
    }

    handle.addEventListener('keydown', onKeyDown, { signal })

    if (followCursor) {
      const onFollowMove = (e: PointerEvent): void => {
        if (signal.aborted) return
        setPosition(positionFromClientX(e.clientX))
      }

      compare.addEventListener('pointermove', onFollowMove, { signal })
      compare.addEventListener(
        'pointerdown',
        (e: PointerEvent) => {
          if (signal.aborted) return
          setPosition(positionFromClientX(e.clientX))
        },
        { signal },
      )
    } else {
      let dragging = false

      const onPointerDown = (e: PointerEvent): void => {
        if (signal.aborted) return
        dragging = true
        compare.setPointerCapture(e.pointerId)
        setPosition(positionFromClientX(e.clientX))
      }

      const onPointerMove = (e: PointerEvent): void => {
        if (!dragging || signal.aborted) return
        setPosition(positionFromClientX(e.clientX))
      }

      const onPointerUp = (e: PointerEvent): void => {
        if (!dragging) return
        dragging = false
        if (compare.hasPointerCapture(e.pointerId)) {
          compare.releasePointerCapture(e.pointerId)
        }
      }

      compare.addEventListener('pointerdown', onPointerDown, { signal })
      compare.addEventListener('pointermove', onPointerMove, { signal })
      compare.addEventListener('pointerup', onPointerUp, { signal })
      compare.addEventListener('pointercancel', onPointerUp, { signal })
    }

    const initial = parseInt(container.dataset.beforeAfterInitial || '50', 10)
    setPosition(Number.isFinite(initial) ? initial : 50)
  }

  const runReveal = (): void => {
    if (reduced) {
      loadingEl?.remove()
      gsap.set(revealEls, { autoAlpha: 1, y: 0 })
      container.classList.add(REVEALED)
      return
    }

    gsap.set(revealEls, { autoAlpha: 0, y: 18 })
    if (loadingEl) gsap.set(loadingEl, { autoAlpha: 1 })

    revealTimeline = gsap.timeline({
      onComplete: () => {
        container.classList.add(REVEALED)
        loadingEl?.remove()
      },
    })

    if (loadingEl) {
      revealTimeline.to(loadingEl, { autoAlpha: 0, duration: 0.4, ease: 'power2.out' }, 0)
    }

    revealTimeline.to(
      revealEls,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.62,
        stagger: 0.1,
        ease: 'power2.out',
      },
      loadingEl ? 0.12 : 0,
    )
  }

  const waitImages = async (): Promise<void> => {
    const imgs = compare.querySelectorAll<HTMLImageElement>('.before-after__img')
    if (imgs.length === 0) return
    const maxMs = designMode ? 400 : 8000 
    await Promise.race([
      Promise.all([...imgs].map((img) => loadImage(img))),
      new Promise<void>((r) => window.setTimeout(r, maxMs)),
    ])
  }

  const waitReady = async (): Promise<void> => {
    if (!designMode) await whenWindowLoaded()
    // await waitImages()
    await new Promise<void>((r) => {
      requestAnimationFrame(() => requestAnimationFrame(() => r()))
    })
  }

  void Promise.all([
    waitReady(),
    animateOnScroll && !designMode ? waitForSectionVisible(container, signal, designMode) : Promise.resolve(),
  ])
    .catch(() => {})
    .then(() => {
      if (signal.aborted) return
      runReveal()
    })
}

export function destroy(container: HTMLElement): void {
  const root = container as BeforeAfterContainer
  root.__beforeAfterTeardown?.()
  delete root.__beforeAfterTeardown
}
