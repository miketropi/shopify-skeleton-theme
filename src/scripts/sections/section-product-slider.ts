import { registerSection } from '../section-registry'

const SECTION_TYPE = 'section-product-slider'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerSectionProductSlider(): void {
  registerSection(
    SECTION_TYPE,
    (container) => {
      const p = import('./section-product-slider.runtime').then((m) => {
        m.init(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./section-product-slider.runtime')
      m.destroy(container)
      pending.delete(container)
    },
  ) 
}
