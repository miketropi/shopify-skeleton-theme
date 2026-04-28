import { ThemeModal } from './theme-modal'

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
    private shell: ThemeModal | null = null
    private loading: HTMLElement | null = null
    private loaded = false
    private eventsBound = false

    private onDocumentClick = (e: MouseEvent): void => {
      const t = (e.target as Node | null)?.nodeType === 1 ? (e.target as Element) : null
      const trigger = t?.closest<HTMLElement>('[data-size-guide-open]')
      if (trigger) {
        e.preventDefault()
        void this.handleOpen(trigger)
      }
    }

    constructor() {
      super()
    }

    connectedCallback(): void {
      if (!this.shell) {
        this.shell = new ThemeModal({
          root: this,
          panel: '.theme-modal__panel',
          overlay: '.theme-modal__overlay',
          durationOpen: 0.42,
          durationClose: 0.3,
          enterY: 20,
        })
      }
      this.loading = this.querySelector<HTMLElement>('[data-size-guide-loading]')
      if (!this.eventsBound) {
        this.eventsBound = true
        document.addEventListener('click', this.onDocumentClick)
      }
    }

    disconnectedCallback(): void {
      if (this.eventsBound) {
        document.removeEventListener('click', this.onDocumentClick)
        this.eventsBound = false
      }
      this.shell?.destroy()
      this.shell = null
    }

    private async handleOpen(trigger: HTMLElement): Promise<void> {
      if (!this.shell) return
      await this.shell.open(trigger)
      if (!this.loaded) {
        await this.fetchContent()
        this.loaded = true
      }
    }

    private getErrorHtml(): string {
      const msg = this.dataset.sizeGuideError?.trim() || 'Could not load the size guide.'
      return `<div class="theme-modal__message" role="status">${this.escape(msg)}</div>`
    }

    private getEmptyHtml(): string {
      const msg = this.dataset.sizeGuideEmpty?.trim() || 'No size guide available for this product.'
      return `<div class="theme-modal__message" role="status">${this.escape(msg)}</div>`
    }

    private escape(s: string): string {
      return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    }

    private getProductHandle(): string {
      const m = window.location.pathname.match(/\/products\/([^/?#]+)/)
      return m?.[1] ?? ''
    }

    private async fetchContent(): Promise<void> {
      const container = this.querySelector<HTMLElement>('.theme-modal__panel')
      if (!container) return

      const handle = this.getProductHandle()
      if (!handle) {
        this.hideLoading()
        this.showPlaceholder(container, this.getEmptyHtml())
        return
      }

      const pdp = document.querySelector<HTMLElement>('[data-main-product]')
      const hasMetafield = pdp?.dataset.pdpSizeMetafield === 'true'
      const override = document.querySelector<HTMLElement>('[data-size-guide-section-override]')

      if (override && !hasMetafield) {
        this.hideLoading()
        const source = override.firstElementChild
        if (source) {
          container.appendChild(source.cloneNode(true))
        } else {
          this.showPlaceholder(container, this.getEmptyHtml())
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
        if (content) {
          container.appendChild(content)
        } else {
          this.showPlaceholder(container, this.getEmptyHtml())
        }
      } catch {
        this.hideLoading()
        this.showPlaceholder(container, this.getErrorHtml())
      }
    }

    private hideLoading(): void {
      if (this.loading) {
        this.loading.hidden = true
        this.loading.classList.add('is-hidden')
      }
    }

    private showPlaceholder(container: HTMLElement, html: string): void {
      const el = document.createElement('div')
      el.innerHTML = html
      container.appendChild(el.firstElementChild ?? el)
    }
  }

  customElements.define(TAG, SizeGuideModal)
}

export {}
