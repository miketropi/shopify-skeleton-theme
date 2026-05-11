/**
 * Theme styles
 */
import '../styles/theme.scss'

/**
 * Sections
 */
import { bootSections } from './section-registry'
import { registerCartDrawerSection, registerAjaxCartAdd } from './cart-drawer'
import { registerMainProductSection } from './main-product'
import { registerProductTabsSection } from './product-tabs'
import { registerHeaderSection } from './header'
import { registerSectionHeroSlider } from './sections/section-hero-slider'
import { registerCollectionGridSection } from './collection-grid'
import './size-guide'
import { initSearchModal } from './search-modal'
import { registerHeaderTopBarSection } from './header-top-bar'
import { registerMainBlogSection } from './main-blog'
import { registerMainArticleSection } from './main-article'
import { bindTcardHoverVideos } from './tcard-hover-video'

export type { ThemeModalOptions } from './theme-modal'
export { ThemeModal, THEME_MODAL_COMPACT_MQ } from './theme-modal'
export {
  enhanceCustomSelectRoot,
  initCustomSelectsInContainer,
  destroyCustomSelectsInContainer,
} from './custom-select'

document.documentElement.classList.add('js')

registerCartDrawerSection()
registerAjaxCartAdd()
registerMainProductSection()
registerProductTabsSection()
registerHeaderSection() 
registerSectionHeroSlider()
registerCollectionGridSection()
registerHeaderTopBarSection()
registerMainBlogSection()
registerMainArticleSection()

bootSections()
initSearchModal()

document.addEventListener('DOMContentLoaded', () => {
  bindTcardHoverVideos(document.body)
})

console.log('Theme loaded')
