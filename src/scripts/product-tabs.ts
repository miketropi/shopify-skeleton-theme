import { registerSection } from './section-registry'
import {
  cleanupProductTabsAccordionGsap,
  initProductDetailTabs,
} from './product-detail-tabs'

const SECTION_TYPE = 'product-tabs'

type Teardown = () => void

export function registerProductTabsSection(): void {
  registerSection(
    SECTION_TYPE,
    (container) => {
      const abort = new AbortController()
      initProductDetailTabs(container, abort.signal)
      const extended = container as HTMLElement & { __productTabsTeardown?: Teardown }
      extended.__productTabsTeardown = () => {
        cleanupProductTabsAccordionGsap(container)
        abort.abort()
      }
    },
    (container) => {
      const extended = container as HTMLElement & { __productTabsTeardown?: Teardown }
      extended.__productTabsTeardown?.()
      delete extended.__productTabsTeardown
    }
  )
}
