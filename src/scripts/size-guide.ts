const TAG = 'size-guide-modal'

/** Locale-aware product URL; `routes.root_url` is a path prefix (e.g. / or /en). */
function productSectionFetchUrl(handle: string, sectionId: string): string {
  const rootPath = window.__themeRoutes?.root || '/'
  const base = new URL(rootPath, window.location.origin).href
  return new URL(
    `products/${encodeURIComponent(handle)}?section_id=${encodeURIComponent(sectionId)}`,
    base,
  ).toString()
}

if (!customElements.get(TAG)) {
  class SizeGuideModal extends HTMLElement {
    private container: HTMLElement | null = null
    private loading: HTMLElement | null = null
    private loaded = false
    private isOpen = false
    private lastTrigger: HTMLElement | null = null
    private eventsBound = false

    constructor() {
      super()
    }

    connectedCallback(): void {
      this.container = this.querySelector<HTMLElement>('.size-guide-modal__container')
      this.loading = this.querySelector<HTMLElement>('[data-size-guide-loading]')
      if (!this.eventsBound) {
        this.eventsBound = true
        this.bindEvents()
      }
    }

    disconnectedCallback(): void {
      if (this.isOpen) {
        document.body.style.overflow = ''
      }
    }

    private bindEvents(): void {
      document.addEventListener('click', (e) => {
        const t = (e.target as Node | null)?.nodeType === 1 ? (e.target as Element) : null
        const trigger = t?.closest<HTMLElement>('[data-size-guide-open]')
        if (trigger) {
          e.preventDefault()
          void this.open(trigger)
        }
      })

      this.addEventListener('click', (e) => {
        const t = e.target as Node | null
        if (t && (t as Element).nodeType === 1) {
          const el = t as Element
          if (el.hasAttribute('data-size-guide-close') || el.closest('[data-size-guide-close]')) {
            e.preventDefault()
            this.close()
          }
        }
      })

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          e.preventDefault()
          this.close()
        }
      })
    }

    private async open(trigger: HTMLElement): Promise<void> {
      this.lastTrigger = trigger
      if (!this.loaded) {
        await this.fetchContent()
        this.loaded = true
      }
      this.classList.add('is-open')
      this.setAttribute('aria-hidden', 'false')
      this.setAttribute('aria-modal', 'true')
      document.body.style.overflow = 'hidden'

      this.isOpen = true
      const focusable = this.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable) focusable.focus()
    }

    private close(): void {
      this.classList.remove('is-open')
      this.setAttribute('aria-hidden', 'true')
      this.setAttribute('aria-modal', 'false')
      document.body.style.overflow = ''
      this.isOpen = false
      this.lastTrigger?.focus()
    }

    private getErrorHtml(): string {
      const msg = this.dataset.sizeGuideError?.trim() || 'Could not load the size guide.'
      return `<div class="size-guide-modal__message" role="status">${this.escape(msg)}</div>`
    }

    private getEmptyHtml(): string {
      const msg = this.dataset.sizeGuideEmpty?.trim() || 'No size guide available for this product.'
      return `<div class="size-guide-modal__message" role="status">${this.escape(msg)}</div>`
    }

    private escape(s: string): string {
      return s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
    }

    private getProductHandle(): string {
      const m = window.location.pathname.match(/\/products\/([^/?#]+)/)
      return m?.[1] ?? ''
    }

    private async fetchContent(): Promise<void> {
      const handle = this.getProductHandle()
      if (!handle) {
        this.hideLoading()
        this.showPlaceholder(this.getEmptyHtml())
        return
      }

      const pdp = document.querySelector<HTMLElement>('[data-main-product]')
      const hasMetafield = pdp?.dataset.pdpSizeMetafield === 'true'
      const override = document.querySelector<HTMLElement>('[data-size-guide-section-override]')

      if (override && !hasMetafield) {
        this.hideLoading()
        const source = override.firstElementChild
        if (source && this.container) {
          this.container.appendChild(source.cloneNode(true))
        } else {
          this.showPlaceholder(this.getEmptyHtml())
        }
        return
      }

      const url = productSectionFetchUrl(handle, 'size-guide')

      try {
        const response = await fetch(url, { headers: { Accept: 'text/html' } })
        if (!response.ok) throw new Error(String(response.status))
        const html = await response.text()
        this.hideLoading()
        const temp = document.createElement('div')
        temp.innerHTML = html
        const content = temp.querySelector<HTMLElement>('[data-size-guide]')
        if (content && this.container) {
          this.container.appendChild(content)
        } else {
          this.showPlaceholder(this.getEmptyHtml())
        }
      } catch {
        this.hideLoading()
        this.showPlaceholder(this.getErrorHtml())
      }
    }

    private hideLoading(): void {
      if (this.loading) {
        this.loading.hidden = true
        this.loading.classList.add('is-hidden')
      }
    }

    private showPlaceholder(html: string): void {
      if (!this.container) return
      const el = document.createElement('div')
      el.innerHTML = html
      this.container.appendChild(el.firstElementChild ?? el)
    }
  }

  customElements.define(TAG, SizeGuideModal)
}

export {}
