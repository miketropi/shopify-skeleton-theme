import { registerSection } from '../section-registry'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerSectionCollectionList(): void {
  registerSection(
    'section-collection-list',
    (container) => {
      const p = import('./section-collection-list.runtime.js').then((m) => {
        m.init(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./section-collection-list.runtime.js')
      m.destroy(container)
      pending.delete(container)
    },
  )
}
