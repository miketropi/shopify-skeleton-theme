import gsap from 'gsap'

// ─── Stagger entrance animation ─────────────────────────

function initStagger(container: HTMLElement): void {
  if (!container.hasAttribute('data-mblog-animate')) return

  const items = container.querySelectorAll<HTMLElement>('.mblog__item')
  if (!items.length) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    container.classList.add('is-animated')
    return
  }

  gsap.fromTo(
    Array.from(items),
    { opacity: 0, y: 24 },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.07,
      ease: 'power2.out',
      onComplete() {
        container.classList.add('is-animated')
      },
    },
  )
}

function destroyStagger(container: HTMLElement): void {
  container.classList.remove('is-animated')
  const items = container.querySelectorAll<HTMLElement>('.mblog__item')
  gsap.killTweensOf(Array.from(items))
}

// ─── Parallax hero ──────────────────────────────────────

interface ParallaxState {
  hero: HTMLElement
  media: HTMLElement
  raf: number
  boundTick: () => void
}

const parallaxMap = new WeakMap<HTMLElement, ParallaxState>()

function initParallax(container: HTMLElement): void {
  const hero = container.querySelector<HTMLElement>('[data-mblog-parallax]')
  if (!hero) return

  const media = hero.querySelector<HTMLElement>('.mblog__hero-media')
  if (!media) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return

  const state: ParallaxState = {
    hero,
    media,
    raf: 0,
    boundTick: () => tickParallax(container),
  }

  parallaxMap.set(container, state)
  window.addEventListener('scroll', state.boundTick, { passive: true })
  state.boundTick()
}

function tickParallax(container: HTMLElement): void {
  const state = parallaxMap.get(container)
  if (!state) return

  cancelAnimationFrame(state.raf)
  state.raf = requestAnimationFrame(() => {
    const rect = state.hero.getBoundingClientRect()
    const vh = window.innerHeight
    if (rect.bottom < 0 || rect.top > vh) return

    const progress = (vh - rect.top) / (vh + rect.height)
    const shift = (progress - 0.5) * 30
    state.media.style.transform = `translate3d(0, ${shift}%, 0)`
  })
}

function destroyParallax(container: HTMLElement): void {
  const state = parallaxMap.get(container)
  if (!state) return

  cancelAnimationFrame(state.raf)
  window.removeEventListener('scroll', state.boundTick)
  state.media.style.transform = ''
  parallaxMap.delete(container)
}

// ─── Tags overflow toggle ───────────────────────────────

const tagsHandlers = new WeakMap<HTMLElement, () => void>()

function initTagsToggle(container: HTMLElement): void {
  const nav = container.querySelector<HTMLElement>('[data-mblog-tags]')
  const btn = container.querySelector<HTMLElement>('[data-mblog-tags-toggle]')
  if (!nav || !btn) return

  const moreLabel = btn.querySelector<HTMLElement>('[data-mblog-tags-more]')
  const lessLabel = btn.querySelector<HTMLElement>('[data-mblog-tags-less]')

  const handler = (): void => {
    const expanded = nav.classList.toggle('is-expanded')
    btn.setAttribute('aria-expanded', String(expanded))

    if (moreLabel) moreLabel.hidden = expanded
    if (lessLabel) lessLabel.hidden = !expanded
  }

  btn.addEventListener('click', handler)
  tagsHandlers.set(container, handler)
}

function destroyTagsToggle(container: HTMLElement): void {
  const btn = container.querySelector<HTMLElement>('[data-mblog-tags-toggle]')
  const handler = tagsHandlers.get(container)
  if (btn && handler) btn.removeEventListener('click', handler)
  tagsHandlers.delete(container)
}

// ─── Section lifecycle (lazy-loaded chunk) ────────────

export function initBlog(container: HTMLElement): void {
  initStagger(container)
  initParallax(container)
  initTagsToggle(container)
}

export function destroyBlog(container: HTMLElement): void {
  destroyStagger(container)
  destroyParallax(container)
  destroyTagsToggle(container)
}
