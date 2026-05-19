import { registerSection } from '../section-registry'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerSectionCollectionSlide(): void {
  registerSection(
    'section-collection-slide',
    (container) => {
      const p = import('./section-collection-slide.runtime.js').then((m) => {
        m.init(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./section-collection-slide.runtime.js')
      m.destroy(container)
      pending.delete(container)
    },
  )
}
