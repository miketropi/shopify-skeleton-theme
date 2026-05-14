import { registerSection } from '../section-registry'

const SECTION_TYPE = 'section-home-slider'

const pending = new WeakMap<HTMLElement, Promise<void>>()

export function registerSectionHomeSlider(): void {
  registerSection(
    SECTION_TYPE,
    (container) => {
      const p = import('./section-home-slider.runtime').then((m) => {
        m.init(container)
      })
      pending.set(container, p)
    },
    async (container) => {
      await pending.get(container)
      const m = await import('./section-home-slider.runtime')
      m.destroy(container)
      pending.delete(container)
    },
  )
}
