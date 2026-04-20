const teardowns = new WeakMap<HTMLElement, () => void>()

function applyHeaderHeight(container: HTMLElement): void {
  document.documentElement.style.setProperty('--header-height', `${container.offsetHeight}px`)
}

export function init(container: HTMLElement): void {
  destroy(container)

  applyHeaderHeight(container)

  const wrapper = container.closest<HTMLElement>('.shopify-section')
  const mode = container.dataset.sticky

  const updateScrolledForTransparent = (): void => {
    const y = window.scrollY
    const atTop = y < container.offsetHeight
    container.classList.toggle('site-header--scrolled', !atTop)
  }

  const observer = new ResizeObserver(() => {
    applyHeaderHeight(container)
    updateScrolledForTransparent()
  })
  observer.observe(container)

  let lastY = window.scrollY

  const onScroll = (): void => {
    updateScrolledForTransparent()
    const y = window.scrollY
    if (mode === 'scroll-up' && wrapper) {
      if (container.classList.contains('site-header--nav-open')) {
        wrapper.classList.remove('shopify-section--header-hidden')
      } else {
        const scrollingDown = y > lastY && y > container.offsetHeight
        wrapper.classList.toggle('shopify-section--header-hidden', scrollingDown)
      }
    }
    lastY = y
  }

  updateScrolledForTransparent()
  window.addEventListener('scroll', onScroll, { passive: true })

  const cleanup = (): void => {
    observer.disconnect()
    window.removeEventListener('scroll', onScroll)
    wrapper?.classList.remove('shopify-section--header-hidden')
    container.classList.remove('site-header--scrolled')
    document.documentElement.style.removeProperty('--header-height')
  }

  teardowns.set(container, cleanup)
}

export function destroy(container: HTMLElement): void {
  const fn = teardowns.get(container)
  if (fn) {
    fn()
    teardowns.delete(container)
  }
}
