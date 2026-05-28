import { registerSection } from '../section-registry'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerSectionTestimonials(): void {
  registerSection(
    'section-testimonials',
    (container) => {
      const p = import('./section-testimonials.runtime.js').then((m) => {
        m.init(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./section-testimonials.runtime.js')
      m.destroy(container)
      pending.delete(container)
    },
  )
}
