import gsap from 'gsap'

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isDesignMode(): boolean {
  return Boolean((window as Window & { Shopify?: { designMode?: boolean } }).Shopify?.designMode)
}

export function whenWindowLoaded(): Promise<void> {
  if (document.readyState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    window.addEventListener('load', () => resolve(), { once: true })
  })
}

export async function waitSlideReady(container: HTMLElement, designMode: boolean): Promise<void> {
  const maxMs = designMode ? 450 : 6000
  const deadline = new Promise<void>((resolve) => {
    setTimeout(resolve, maxMs)
  })

  const work = async (): Promise<void> => {
    if (!designMode) await whenWindowLoaded()
    await new Promise<void>((r) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => r())
      })
    })
  }

  await Promise.race([work(), deadline])
}

export function waitForSectionVisible(
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

export type RevealStaggeredOptions = {
  container: HTMLElement
  slides: NodeListOf<Element>
  loadingEl: HTMLElement | null
  reduced: boolean
  revealedClass: string
}

export function revealStaggeredSlides({
  container,
  slides,
  loadingEl,
  reduced,
  revealedClass,
}: RevealStaggeredOptions): gsap.core.Timeline {
  if (reduced) {
    if (loadingEl) loadingEl.remove()
    gsap.set(slides, { autoAlpha: 1, y: 0 })
    container.classList.add(revealedClass)
    return gsap.timeline()
  }

  const tl = gsap.timeline({
    onComplete: () => {
      container.classList.add(revealedClass)
      loadingEl?.remove()
    },
  })

  if (loadingEl) {
    tl.to(
      loadingEl,
      {
        autoAlpha: 0,
        duration: 0.42,
        ease: 'power2.out',
      },
      0,
    )
  }

  tl.to(
    slides,
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.62,
      stagger: 0.06,
      ease: 'power2.out',
    },
    loadingEl ? 0.14 : 0,
  )

  return tl
}
