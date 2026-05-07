import gsap from 'gsap'
import { registerSection } from './section-registry'

interface ArticleSectionState {
  abort: AbortController
  intro: gsap.core.Timeline | null
}

const articleStates = new WeakMap<HTMLElement, ArticleSectionState>()

function slugifyHeading(text: string, used: Set<string>): string {
  let base = text
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (!base) base = 'section'

  let slug = base
  let n = 1
  while (used.has(slug)) {
    slug = `${base}-${n}`
    n += 1
  }
  used.add(slug)
  return slug
}

function initCopyButtons(container: HTMLElement, signal: AbortSignal): void {
  container.querySelectorAll<HTMLElement>('[data-copy-url]').forEach((btn) => {
    btn.addEventListener(
      'click',
      () => {
        const url = btn.getAttribute('data-copy-url')
        if (!url) return

        void navigator.clipboard.writeText(url).then(() => {
          const svg = btn.querySelector('svg')
          if (!svg) return

          const original = svg.innerHTML
          svg.innerHTML =
            '<polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'

          setTimeout(() => {
            svg.innerHTML = original
          }, 1500)
        })
      },
      { signal },
    )
  })
}

function collectRevealNodes(container: HTMLElement): HTMLElement[] {
  const lead = container.querySelector<HTMLElement>('.marticle__lead')
  const flow = container.querySelector<HTMLElement>('.marticle__flow')
  if (!lead && !flow) return []

  const ordered: HTMLElement[] = []
  const push = (root: HTMLElement | null, sel: string): void => {
    if (!root) return
    const el = root.querySelector<HTMLElement>(sel)
    if (el) ordered.push(el)
  }

  push(lead, '.marticle__breadcrumb')
  push(lead, '.marticle__hero')
  push(lead, '.marticle__header')

  if (flow) {
    const toc = flow.querySelector<HTMLElement>('[data-marticle-toc]')
    if (toc && !toc.hidden) ordered.push(toc)
    push(flow, '.marticle__prose')
    push(flow, '.marticle__post-foot')
  }

  return ordered
}

function initIntro(container: HTMLElement, signal: AbortSignal): gsap.core.Timeline | null {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return null

  const mainEls = collectRevealNodes(container)
  const sideEls = [...container.querySelectorAll<HTMLElement>('.marticle__sidebar-block')]
  const all = [...mainEls, ...sideEls]
  if (!all.length) return null

  gsap.set(mainEls, { autoAlpha: 0, y: 28 })
  if (sideEls.length) gsap.set(sideEls, { autoAlpha: 0, x: 24 })

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  if (mainEls.length) {
    tl.to(mainEls, { autoAlpha: 1, y: 0, duration: 0.62, stagger: 0.085 })
  }
  if (sideEls.length) {
    tl.to(
      sideEls,
      { autoAlpha: 1, x: 0, duration: 0.52, stagger: 0.1 },
      mainEls.length ? '-=0.42' : 0,
    )
  }

  signal.addEventListener('abort', () => {
    tl.kill()
    gsap.set(all, { clearProps: 'opacity,visibility,transform' })
  })

  return tl
}

const TOC_DESKTOP_MQ = '(min-width: 62em)'

function bindTocToggle(
  tocNav: HTMLElement,
  panel: HTMLElement,
  toggle: HTMLButtonElement,
  signal: AbortSignal,
): void {
  const mq = window.matchMedia(TOC_DESKTOP_MQ)

  const applyLayout = (): void => {
    if (mq.matches) {
      tocNav.classList.add('marticle__toc--desktop')
      tocNav.classList.remove('marticle__toc--expanded')
      toggle.hidden = true
      panel.hidden = false
      toggle.setAttribute('aria-expanded', 'true')
    } else {
      tocNav.classList.remove('marticle__toc--desktop')
      toggle.hidden = false
      toggle.setAttribute('aria-expanded', 'false')
      panel.hidden = true
      tocNav.classList.remove('marticle__toc--expanded')
    }
  }

  applyLayout()
  mq.addEventListener('change', applyLayout, { signal })

  toggle.addEventListener(
    'click',
    () => {
      if (mq.matches) return
      const open = toggle.getAttribute('aria-expanded') === 'true'
      const next = !open
      toggle.setAttribute('aria-expanded', String(next))
      panel.hidden = !next
      tocNav.classList.toggle('marticle__toc--expanded', next)
    },
    { signal },
  )

  tocNav.addEventListener(
    'keydown',
    (e) => {
      if (!mq.matches && e.key === 'Escape' && !panel.hidden) {
        toggle.setAttribute('aria-expanded', 'false')
        panel.hidden = true
        tocNav.classList.remove('marticle__toc--expanded')
        toggle.focus()
      }
    },
    { signal },
  )
}

function initToc(container: HTMLElement, signal: AbortSignal): void {
  const body = container.querySelector<HTMLElement>('[data-marticle-body]')
  const tocNav = container.querySelector<HTMLElement>('[data-marticle-toc]')
  const tocList = container.querySelector<HTMLElement>('[data-marticle-toc-list]')
  if (!body || !tocNav || !tocList) return

  const headingEls = body.querySelectorAll<HTMLHeadingElement>('h2, h3')
  if (!headingEls.length) return

  const usedIds = new Set<string>()
  const items: { el: HTMLHeadingElement; id: string; depth: 1 | 2 }[] = []

  headingEls.forEach((h) => {
    const depth: 1 | 2 = h.tagName === 'H2' ? 1 : 2
    let id = h.id
    if (!id) {
      id = slugifyHeading(h.textContent || '', usedIds)
      h.id = id
    } else {
      usedIds.add(id)
    }
    items.push({ el: h, id, depth })
  })

  tocList.replaceChildren()
  const frag = document.createDocumentFragment()

  items.forEach(({ el, id, depth }) => {
    const text = el.textContent?.trim() || ''
    const li = document.createElement('li')
    li.className =
      depth === 2 ? 'marticle__toc-item marticle__toc-item--sub' : 'marticle__toc-item'
    const a = document.createElement('a')
    a.href = `#${id}`
    a.className = 'marticle__toc-link'
    a.textContent = text
    li.appendChild(a)
    frag.appendChild(li)
  })

  tocList.appendChild(frag)
  tocNav.hidden = false
  tocNav.classList.remove('is-empty')

  const panel = tocNav.querySelector<HTMLElement>('[data-marticle-toc-panel]')
  const toggle = tocNav.querySelector<HTMLButtonElement>('[data-marticle-toc-toggle]')
  if (panel && toggle) bindTocToggle(tocNav, panel, toggle, signal)

  const links = tocList.querySelectorAll<HTMLAnchorElement>('.marticle__toc-link')

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!reduced && links.length) {
    let ticking = false
    const offset = (): number =>
      parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 96

    const syncActive = (): void => {
      const y = window.scrollY + offset()
      let currentId = items[0].id
      for (const { el, id } of items) {
        const top = el.getBoundingClientRect().top + window.scrollY
        if (top <= y) currentId = id
      }
      links.forEach((link) => {
        const on = link.getAttribute('href') === `#${currentId}`
        link.classList.toggle('is-active', on)
        if (on) link.setAttribute('aria-current', 'location')
        else link.removeAttribute('aria-current')
      })
    }

    const onScroll = (): void => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        syncActive()
      })
    }

    window.addEventListener('scroll', onScroll, { signal, passive: true })
    syncActive()
  }
}

function initArticle(container: HTMLElement): void {
  const abort = new AbortController()
  const { signal } = abort

  const body = container.querySelector<HTMLElement>('[data-marticle-body]')
  if (body) void import('./article-code-blocks').then((m) => m.initArticleCodeBlocks(body))

  initCopyButtons(container, signal)
  initToc(container, signal)
  const intro = initIntro(container, signal)

  articleStates.set(container, { abort, intro })
}

function destroyArticle(container: HTMLElement): void {
  const state = articleStates.get(container)
  if (!state) return

  state.abort.abort()
  state.intro?.kill()

  const tocNav = container.querySelector<HTMLElement>('[data-marticle-toc]')
  const tocList = container.querySelector<HTMLElement>('[data-marticle-toc-list]')
  if (tocList) tocList.replaceChildren()
  if (tocNav) {
    tocNav.hidden = true
    tocNav.classList.add('is-empty')
    tocNav.classList.remove('marticle__toc--desktop', 'marticle__toc--expanded')
    const toggle = tocNav.querySelector<HTMLButtonElement>('[data-marticle-toc-toggle]')
    const panel = tocNav.querySelector<HTMLElement>('[data-marticle-toc-panel]')
    if (toggle) {
      toggle.hidden = false
      toggle.setAttribute('aria-expanded', 'false')
    }
    if (panel) panel.hidden = true
  }

  const mainEls = collectRevealNodes(container)
  const sideEls = [...container.querySelectorAll<HTMLElement>('.marticle__sidebar-block')]
  gsap.set([...mainEls, ...sideEls], { clearProps: 'opacity,visibility,transform' })

  articleStates.delete(container)
}

export function registerMainArticleSection(): void {
  registerSection('main-article', initArticle, destroyArticle)
}
