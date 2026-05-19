import { registerSection } from '../section-registry'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerSectionProductImagesStory(): void {
  registerSection(
    'section-product-images-story',
    (container) => {
      const p = import('./section-product-images-story.runtime.js').then((m) => {
        m.init(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./section-product-images-story.runtime.js')
      m.destroy(container)
      pending.delete(container)
    },
  )
}
