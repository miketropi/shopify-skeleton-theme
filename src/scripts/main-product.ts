import { registerSection } from './section-registry'

const SECTION_TYPE = 'main-product'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerMainProductSection(): void {
  registerSection(
    SECTION_TYPE,
    (container) => {
      const p = import('./main-product.runtime').then((m) => {
        m.attachMainProduct(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./main-product.runtime')
      m.detachMainProduct(container)
      pending.delete(container)
    },
  )
}
