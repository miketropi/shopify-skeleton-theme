import { registerSection } from '../section-registry'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerSectionImageWithText(): void {
  registerSection(
    'section-image-with-text',
    (container) => {
      const p = import('./section-image-with-text.runtime.js').then((m) => {
        m.init(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./section-image-with-text.runtime.js')
      m.destroy(container)
      pending.delete(container)
    },
  )
}
