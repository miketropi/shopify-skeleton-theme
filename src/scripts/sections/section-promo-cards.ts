import { registerSection } from '../section-registry'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerSectionPromoCards(): void {
  registerSection(
    'section-promo-cards',
    (container) => {
      const p = import('./section-promo-cards.runtime.js').then((m) => {
        m.init(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./section-promo-cards.runtime.js')
      m.destroy(container)
      pending.delete(container)
    },
  )
}
