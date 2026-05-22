import { registerSection } from '../section-registry'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerSectionTrustBar(): void {
  registerSection(
    'section-trust-bar',
    (container) => {
      const p = import('./section-trust-bar.runtime.js').then((m) => {
        m.init(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./section-trust-bar.runtime.js')
      m.destroy(container)
      pending.delete(container)
    },
  )
}
