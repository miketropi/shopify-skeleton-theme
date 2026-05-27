import { registerSection } from '../section-registry'

const SECTION_TYPE = 'section-map-location'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerSectionMapLocation(): void {
  registerSection(
    SECTION_TYPE,
    (container) => {
      const p = import('./section-map-location.runtime.js').then((m) => {
        m.init(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./section-map-location.runtime.js')
      m.destroy(container)
      pending.delete(container)
    },
  )
}