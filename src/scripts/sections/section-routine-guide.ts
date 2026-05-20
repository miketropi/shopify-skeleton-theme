import { registerSection } from '../section-registry'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerSectionRoutineGuide(): void {
  registerSection(
    'section-routine-guide',
    (container) => {
      const p = import('./section-routine-guide.runtime.js').then((m) => {
        m.init(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./section-routine-guide.runtime.js')
      m.destroy(container)
      pending.delete(container)
    },
  )
}
