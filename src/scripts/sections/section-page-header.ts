import { registerSection } from '../section-registry'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerSectionPageHeader(): void {
  registerSection(
    'section-page-header',
    (container) => {
      const p = import('./section-page-header.runtime.js').then((m) => {
        m.init(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./section-page-header.runtime.js')
      m.destroy(container)
      pending.delete(container)
    },
  )
}
