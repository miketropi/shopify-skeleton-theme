import gsap from 'gsap'

import { registerSection } from './section-registry'

const SECTION_TYPE = 'main-product'

type VariantJson = {
  id: number
  available: boolean
  price: string
  compare_at_price: string | null
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function parseVariantsJson(container: HTMLElement): VariantJson[] | null {
  const el = container.querySelector('script[type="application/json"][data-product-variant-json]')
  if (!el?.textContent) return null
  try {
    const data = JSON.parse(el.textContent) as VariantJson[]
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

function killProductTweens(nodes: Element[]): void {
  for (const n of nodes) {
    gsap.killTweensOf(n)
  }
}

export function registerMainProductSection(): void {
  registerSection(
    SECTION_TYPE,
    (container) => {
      const variants = parseVariantsJson(container)
      if (!variants) return

      const reduced = prefersReducedMotion()
      const abort = new AbortController()
      const { signal } = abort

      const gallery = container.querySelector('.main-product__media')
      const figures = gallery ? Array.from(gallery.querySelectorAll('.main-product__figure')) : []
      const info = container.querySelector('.main-product__info')
      const infoBlocks = info ? Array.from(info.children) : []

      const select = container.querySelector<HTMLSelectElement>('[data-product-variant-select]')
      const priceEl = container.querySelector('[data-product-price]')
      const compareEl = container.querySelector('[data-product-compare]')
      const submitBtn = container.querySelector<HTMLButtonElement>('[data-product-submit]')
      const submitLabel = container.querySelector('[data-product-submit-label]')
      const priceRow = container.querySelector('[data-product-price-row]')
      const form = container.querySelector<HTMLFormElement>('.main-product__form')

      const addLabel = container.dataset.productAddLabel?.trim() || 'Add to cart'
      const soldLabel = container.dataset.productSoldLabel?.trim() || 'Sold out'

      const animNodes = [...figures, ...infoBlocks]

      if (!reduced && animNodes.length > 0) {
        gsap.set(animNodes, { autoAlpha: 0, y: 10 })
        gsap.to(animNodes, {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.055,
          clearProps: 'transform',
        })
      }

      function applyVariant(id: string): void {
        const v = variants.find((x) => String(x.id) === String(id))
        if (!v || !priceEl) return

        const updateDom = (): void => {
          priceEl.textContent = v.price
          if (compareEl) {
            if (v.compare_at_price) {
              compareEl.textContent = v.compare_at_price
              compareEl.classList.remove('is-visually-hidden')
            } else {
              compareEl.textContent = ''
              compareEl.classList.add('is-visually-hidden')
            }
          }
          if (submitBtn) submitBtn.disabled = !v.available
          if (submitLabel) submitLabel.textContent = v.available ? addLabel : soldLabel
        }

        if (reduced || !priceRow) {
          updateDom()
          return
        }

        gsap.killTweensOf(priceRow)
        gsap
          .timeline()
          .to(priceRow, { autoAlpha: 0.65, y: -3, duration: 0.12, ease: 'power2.in' })
          .add(updateDom)
          .to(priceRow, { autoAlpha: 1, y: 0, duration: 0.22, ease: 'power2.out' })
      }

      if (select) {
        select.addEventListener(
          'change',
          () => {
            applyVariant(select.value)
          },
          { signal }
        )
      }

      if (form && submitBtn) {
        form.addEventListener(
          'submit',
          () => {
            if (submitBtn.disabled) return
            if (reduced) return
            gsap.killTweensOf(submitBtn)
            gsap.fromTo(
              submitBtn,
              { scale: 1 },
              {
                scale: 0.98,
                duration: 0.07,
                ease: 'power2.inOut',
                yoyo: true,
                repeat: 1,
              }
            )
          },
          { capture: true, signal }
        )
      }

      ;(container as HTMLElement & { __mainProductTeardown?: () => void }).__mainProductTeardown = () => {
        abort.abort()
        killProductTweens(animNodes)
        if (priceRow) gsap.killTweensOf(priceRow)
        if (submitBtn) gsap.killTweensOf(submitBtn)
      }
    },
    (container) => {
      const extended = container as HTMLElement & { __mainProductTeardown?: () => void }
      extended.__mainProductTeardown?.()
      delete extended.__mainProductTeardown
    }
  )
}
