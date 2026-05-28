import { registerSection } from '../section-registry'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerSectionOurTeam(): void {
  registerSection(
    'section-our-team',
    (container) => {
      const p = import('./section-our-team.runtime.js').then((m) => {
        m.init(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./section-our-team.runtime.js')
      m.destroy(container)
      pending.delete(container)
    },
  )
}
