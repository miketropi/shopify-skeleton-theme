import { registerSection } from '../section-registry'

export function registerSectionBenefits(): void {
  registerSection(
    'section-benefits',
    (container) => {
      import('./section-benefits.runtime.js').then((m) => {
        m.init(container)
      })
    },
    async (container) => {
      const m = await import('./section-benefits.runtime.js')
      m.destroy(container)
    },
  )
}
