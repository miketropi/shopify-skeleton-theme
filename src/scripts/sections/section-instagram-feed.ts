import { registerSection } from '../section-registry'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerSectionInstagramFeed(): void {
  registerSection(
    'section-instagram-feed',
    (container) => {
      const p = import('./section-instagram-feed.runtime.js').then((m) => {
        m.init(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./section-instagram-feed.runtime.js')
      m.destroy(container)
      pending.delete(container)
    },
  )
}
