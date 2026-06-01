import { registerSection } from '../section-registry'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerSectionOurStory(): void {
  registerSection(
    'section-our-story',
    (container) => {
      const p = import('./section-our-story.runtime.js').then((m) => {
        m.init(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./section-our-story.runtime.js')
      m.destroy(container)
      pending.delete(container)
    },
  )
}
