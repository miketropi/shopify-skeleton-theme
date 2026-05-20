import { registerSection } from '../section-registry'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerSectionBeforeAfter(): void {
  registerSection(
    'section-before-after',
    (container) => {
      const p = import('./section-before-after.runtime.js').then((m) => {
        m.init(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./section-before-after.runtime.js')
      m.destroy(container)
      pending.delete(container)
    },
  )
}
