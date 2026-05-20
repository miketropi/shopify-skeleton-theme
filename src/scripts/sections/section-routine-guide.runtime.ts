import gsap from 'gsap'

type RoutineGuideContainer = HTMLElement & {
  __routineGuideTeardown?: () => void
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

function syncFeatureVideos(container: HTMLElement, activeIndex: number): void {
  const reduced = prefersReducedMotion()
  const layers = container.querySelectorAll<HTMLElement>('[data-routine-guide-media]')

  layers.forEach((layer, i) => {
    const video = layer.querySelector<HTMLVideoElement>('video.routine-guide__feature-video')
    if (!video) return

    if (i === activeIndex && !reduced) {
      void video.play().catch(() => {})
      return
    }

    video.pause()
  })
}

function setActive(container: HTMLElement, index: number): void {
  const items = container.querySelectorAll<HTMLElement>('[data-routine-guide-item]')
  const media = container.querySelectorAll<HTMLElement>('[data-routine-guide-media]')
  const steps = container.querySelectorAll<HTMLElement>('[data-routine-guide-step]')

  items.forEach((el, i) => {
    el.classList.toggle('is-active', i === index)
  })

  media.forEach((el, i) => {
    const on = i === index
    el.classList.toggle('is-active', on)
    el.setAttribute('aria-hidden', on ? 'false' : 'true')
  })

  steps.forEach((btn, i) => {
    if (i === index) btn.setAttribute('aria-current', 'step')
    else btn.removeAttribute('aria-current')
  })

  syncFeatureVideos(container, index)
}

function bindStepInteraction(container: HTMLElement, signal: AbortSignal): void {
  const steps = container.querySelectorAll<HTMLElement>('[data-routine-guide-step]')
  if (steps.length === 0) return

  const mqFineHover = window.matchMedia('(hover: hover) and (pointer: fine)')

  const activateFromStep = (btn: HTMLElement): void => {
    const raw = btn.dataset.routineGuideIndex
    const idx = raw != null ? parseInt(raw, 10) : NaN
    if (!Number.isFinite(idx) || idx < 0) return
    setActive(container, idx)
  }

  steps.forEach((btn) => {
    if (mqFineHover.matches) {
      btn.addEventListener('mouseenter', () => activateFromStep(btn), { signal })
    }
    btn.addEventListener('pointerdown', () => activateFromStep(btn), { signal })
  })

  container.addEventListener(
    'focusin',
    (e) => {
      const t = e.target as HTMLElement | null
      const btn = t?.closest<HTMLElement>('[data-routine-guide-step]')
      if (!btn || !container.contains(btn)) return
      activateFromStep(btn)
    },
    { signal },
  )
}

function revealSection(
  container: HTMLElement,
  productEl: HTMLElement | null,
  featureEl: HTMLElement | null,
  stepsPanelEl: HTMLElement | null,
  stepItems: HTMLElement[],
  reduced: boolean,
): gsap.core.Timeline {
  const targets = [
    ...(productEl ? [productEl] : []),
    ...(featureEl ? [featureEl] : []),
    ...(stepsPanelEl ? [stepsPanelEl] : []),
    ...stepItems,
  ]

  if (reduced) {
    gsap.set(targets, { autoAlpha: 1, x: 0, y: 0 })
    container.classList.add('routine-guide--revealed')
    return gsap.timeline()
  }

  const tl = gsap.timeline({
    onComplete: () => {
      container.classList.add('routine-guide--revealed')
      gsap.set(targets, { clearProps: 'transform' })
    },
  })

  if (productEl) {
    tl.to(
      productEl,
      { autoAlpha: 1, y: 0, duration: 0.65, ease: 'power2.out' },
      0,
    )
  }

  if (featureEl) {
    tl.to(
      featureEl,
      { autoAlpha: 1, x: 0, duration: 0.72, ease: 'power3.out' },
      productEl ? 0.08 : 0,
    )
  }

  if (stepsPanelEl) {
    tl.to(
      stepsPanelEl,
      { autoAlpha: 1, x: 0, duration: 0.68, ease: 'power2.out' },
      featureEl ? 0.12 : productEl ? 0.1 : 0,
    )
  }

  if (stepItems.length > 0) {
    tl.to(
      stepItems,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power2.out',
      },
      stepsPanelEl ? 0.2 : featureEl ? 0.18 : productEl ? 0.14 : 0,
    )
  }

  return tl
}

export function init(container: HTMLElement): void {
  const root = container as RoutineGuideContainer
  const abort = new AbortController()
  const { signal } = abort
  let revealTimeline: gsap.core.Timeline | null = null

  const defaultRaw = container.dataset.routineGuideDefault
  const defaultIndex = defaultRaw != null ? parseInt(defaultRaw, 10) : 0
  if (Number.isFinite(defaultIndex) && defaultIndex >= 0) {
    setActive(container, defaultIndex)
  }

  bindStepInteraction(container, signal)

  const productEl = container.querySelector<HTMLElement>('[data-routine-guide-reveal-product]')
  const featureEl = container.querySelector<HTMLElement>('[data-routine-guide-reveal-feature]')
  const stepsPanelEl = container.querySelector<HTMLElement>('[data-routine-guide-reveal-steps]')
  const stepItems = Array.from(
    container.querySelectorAll<HTMLElement>('.routine-guide__step-item'),
  )

  const teardown = (): void => {
    revealTimeline?.kill()
    revealTimeline = null
    const targets = [
      ...(productEl ? [productEl] : []),
      ...(featureEl ? [featureEl] : []),
      ...(stepsPanelEl ? [stepsPanelEl] : []),
      ...stepItems,
    ]
    gsap.killTweensOf(targets)
    container.classList.remove('routine-guide--revealed')
    container.querySelectorAll<HTMLVideoElement>('video.routine-guide__feature-video').forEach((v) => {
      v.pause()
    })
    abort.abort()
  }
  root.__routineGuideTeardown = teardown

  if (!productEl && !featureEl && !stepsPanelEl && stepItems.length === 0) {
    container.classList.add('routine-guide--revealed')
    return
  }

  const reduced = prefersReducedMotion()
  const designMode = isDesignMode()
  const animateOnScroll = container.dataset.routineGuideEntranceScroll !== 'false'

  if (reduced) {
    revealTimeline = revealSection(
      container,
      productEl,
      featureEl,
      stepsPanelEl,
      stepItems,
      true,
    )
    return
  }

  if (productEl) gsap.set(productEl, { autoAlpha: 0, y: 22 })
  if (featureEl) gsap.set(featureEl, { autoAlpha: 0, x: -24 })
  if (stepsPanelEl) gsap.set(stepsPanelEl, { autoAlpha: 0, x: 20 })
  if (stepItems.length > 0) gsap.set(stepItems, { autoAlpha: 0, y: 14 })

  const waitScroll =
    animateOnScroll && !designMode
      ? waitForSectionVisible(container, signal, designMode)
      : Promise.resolve()

  void Promise.all([waitReadyForReveal(designMode), waitScroll])
    .catch(() => {})
    .then(() => {
      if (signal.aborted) return
      revealTimeline = revealSection(
        container,
        productEl,
        featureEl,
        stepsPanelEl,
        stepItems,
        false,
      )
    })
}

export function destroy(container: HTMLElement): void {
  const root = container as RoutineGuideContainer
  root.__routineGuideTeardown?.()
  delete root.__routineGuideTeardown
}
